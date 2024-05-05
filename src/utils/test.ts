import { expect, jest } from "@jest/globals"

import * as vscode from "vscode"
import * as vsj from "jest-mock-vscode"
import { Command } from "../commands/common"
import * as ParserLib from "./tree_sitter"
import { detectLanguage } from "./language_detection"
import { replaceStr } from "./utils"
import { selectionify } from "./vscode"

/**
 * Each test case contains four markers describing the position of
 * - the Initial selection (the selection before the command is applied)
 * - the Final Selection (the selection after the command is applied)
 * - 👉🏻 : Initial selection, Start
 * - 👈🏻 : Initial selection, End
 * - 🫸🏻 : Final selection,   Start
 * - 🫷🏻 : Final selection,   End
 */

const ISS = "👉🏻"
const ISE = "👈🏻"
const FSS = "🫸🏻"
const FSE = "🫷🏻"

const selectionSymbolsRe = new RegExp(`${ISS}|${ISE}|${FSS}|${FSE}`, "g")

const extractSelSymbols = (text: string) => {
  const symbols: { [symbol: string]: number } = {}

  let count = 0
  for (const pos of text.matchAll(selectionSymbolsRe)) {
    symbols[pos[0]] = pos.index - 4 * count
    count++
  }
  return symbols
}

const text2VScodeObjs = (
  languageID: string,
  text: string,
): {
  doc: vscode.TextDocument
  initialSel?: vscode.Selection
  finalSel?: vscode.Selection
} => {
  const cleanText = text.replace(selectionSymbolsRe, "")
  const doc = vsj.createTextDocument(vscode.Uri.parse("untitled:Untitled-1"), cleanText, languageID)

  const symbols = extractSelSymbols(text)

  let initialSel: vscode.Selection | undefined = undefined
  if (symbols[ISS] && symbols[ISE]) {
    initialSel = new vscode.Selection(doc.positionAt(symbols[ISS]), doc.positionAt(symbols[ISE]))
  }

  let finalSel: vscode.Selection | undefined = undefined
  if (symbols[FSS] !== undefined && symbols[FSE] !== undefined) {
    finalSel = new vscode.Selection(doc.positionAt(symbols[FSS]), doc.positionAt(symbols[FSE]))
  }

  return { doc, initialSel, finalSel }
}

const loadParser = async (doc: vscode.TextDocument) => {
  const parser = await ParserLib.initParser()
  const language = detectLanguage(doc)
  if (!language) {
    throw new Error("Could not determine langauge")
  }
  await ParserLib.loadLanguage(process.cwd(), language)
  if (!ParserLib.setParserLanguage(parser, language)) {
    throw new Error("Could not set parser language")
  }

  return parser
}

export interface SelectionChangeTest {
  text: string
  languageId: string
  cmd: Command
}

export const executeSelectionChangeTest = async (testCase: SelectionChangeTest) => {
  const { doc, initialSel, finalSel } = text2VScodeObjs(testCase.languageId, testCase.text)

  if (!initialSel) {
    throw new Error("Could not find Initial Selection")
  }

  if (!finalSel) {
    throw new Error("Could not find Final Selection")
  }

  const parser = await loadParser(doc)
  const ret = await testCase.cmd(doc, initialSel, parser.parse(doc.getText()))

  if (ret?.selection && !finalSel.isEqual(ret.selection)) {
    console.log(
      "Want",
      testCase.text,
      "\n----------------\n",
      "Have",
      [
        doc.getText().slice(0, doc.offsetAt(ret.selection.start)),
        FSS,
        doc.getText().slice(doc.offsetAt(ret.selection.start), doc.offsetAt(ret.selection.end)),
        FSE,
        doc.getText().slice(doc.offsetAt(ret.selection.start)),
      ].join(""),
    )
  }

  expect(ret?.selection).toEqual(finalSel)
}

export interface EditTest {
  initialText: string
  finalText: string
  languageId: string
  cmd: Command
}

// jest-mock-vscode doesn't implement edits so we do it ourselves
class EditorEdit implements vscode.TextEditorEdit {
  doc: vscode.TextDocument
  text: string
  lastEditPos: number
  constructor(doc: vscode.TextDocument) {
    this.doc = doc
    this.text = doc.getText()
    this.lastEditPos = this.text.length
  }

  // we only allow monotonic edit so that this.text stays in sync with selections over this.doc
  checkPos(newStartPos: number, newEndPos: number) {
    if (newStartPos > newEndPos) {
      throw new Error("newEndPos is lower than newStartPos")
    }
    if (newEndPos > this.lastEditPos) {
      throw new Error("Only edits to monotonically decreasing positions are allowed")
    }
    this.lastEditPos = newStartPos
  }

  replace(location: vscode.Position | vscode.Range | vscode.Selection, value: string): void {
    const sel = selectionify(location)

    const startPos = this.doc.offsetAt(sel.start)
    const endPos = this.doc.offsetAt(sel.end)
    this.checkPos(startPos, endPos)

    this.text = replaceStr(this.text, startPos, endPos, value)
  }

  insert(location: vscode.Position, value: string): void {
    this.replace(location, value)
  }

  delete(location: vscode.Range | vscode.Selection): void {
    this.replace(location, "")
  }

  setEndOfLine(endOfLine: vscode.EndOfLine): void {
    throw new Error("Not implemented")
  }
}

export const executeEditTest = async (testCase: EditTest) => {
  const { doc, initialSel, finalSel } = text2VScodeObjs(testCase.languageId, testCase.initialText)

  if (!initialSel) {
    throw new Error("Could not find Initial Selection")
  }

  if (finalSel) {
    throw new Error("Should not have Final Selection")
  }

  const parser = await loadParser(doc)
  const ret = testCase.cmd(doc, initialSel, parser.parse(doc.getText()))
  const editor = new EditorEdit(doc)
  if (ret?.edit) {
    ret.edit(editor)
  }

  expect(editor.text).toEqual(testCase.finalText)
}
