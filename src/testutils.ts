import * as vscode from "vscode"
import * as vsj from "jest-mock-vscode"
import { Command } from "./commands"
import * as ParserLib from "./parser"
import { detectLanguage } from "./languageDetection"

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
  const filteredText = text.replace(selectionSymbolsRe, "")
  const doc = vsj.createTextDocument(
    vscode.Uri.parse("untitled:Untitled-1"),
    filteredText,
    languageID,
  )

  const symbols = extractSelSymbols(text)

  let initialSel: vscode.Selection | undefined = undefined
  if (symbols[ISS] && symbols[ISE]) {
    initialSel = new vscode.Selection(doc.positionAt(symbols[ISS]), doc.positionAt(symbols[ISE]))
  }

  let finalSel: vscode.Selection | undefined = undefined
  if (symbols[FSS] && symbols[FSE]) {
    finalSel = new vscode.Selection(doc.positionAt(symbols[FSS]), doc.positionAt(symbols[FSE]))
  }

  return { doc, initialSel, finalSel }
}

export interface SelectionChangeTest {
  text: string
  languageId: string
  cmd: Command
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

export const executeSelectionChangeTest = async (testCase: SelectionChangeTest) => {
  const { doc, initialSel, finalSel } = text2VScodeObjs(testCase.languageId, testCase.text)

  if (!initialSel) {
    throw new Error("Could not find Initial Selection")
  }

  if (!finalSel) {
    throw new Error("Could not find Final Selection")
  }

  const parser = await loadParser(doc)
  const newSel = testCase.cmd(doc, initialSel, parser.parse(doc.getText()))

  if (newSel && !finalSel.isEqual(newSel)) {
    console.log(
      "Want",
      testCase.text,
      "\n----------------\n",
      "Have",
      [
        doc.getText().slice(0, doc.offsetAt(newSel.start)),
        FSS,
        doc.getText().slice(doc.offsetAt(newSel.start), doc.offsetAt(newSel.end)),
        FSE,
        doc.getText().slice(doc.offsetAt(newSel.start)),
      ].join(""),
    )
  }

  expect(newSel).toEqual(finalSel)
}
