import * as vscode from "vscode"
import * as vsj from "jest-mock-vscode"
import * as Cmd from "./commands"
import * as ParserLib from "./parser"
import { detectLanguage } from "./languageDetection"

const re = /👉🏻|👈🏻|🫸🏻|🫷🏻/g
const extractSymbols = (text: string) => {
  const positions = Array.from(text.matchAll(re))
  if (positions.length !== 4) {
    throw new Error("Must have exactly 4 hand emojis")
  }

  const symbols: { [symbol: string]: number } = {}

  symbols[positions[0][0]] = positions[0].index
  symbols[positions[1][0]] = positions[1].index - 4
  symbols[positions[2][0]] = positions[2].index - 4 - 4
  symbols[positions[3][0]] = positions[3].index - 4 - 4 - 4

  if (!symbols["👉🏻"]) {
    throw new Error("Missing symbol 👉🏻")
  }

  if (!symbols["👈🏻"]) {
    throw new Error("Missing symbol 👈🏻")
  }

  if (!symbols["🫸🏻"]) {
    throw new Error("Missing symbol 🫸🏻")
  }

  if (!symbols["🫷🏻"]) {
    throw new Error("Missing symbol 🫷🏻")
  }

  return symbols
}

const text2VScodeObjs = (
  languageID: string,
  text: string,
): { doc: vscode.TextDocument; initialSel: vscode.Selection; finalSel: vscode.Selection } => {
  const filteredText = text.replace(re, "")
  const doc = vsj.createTextDocument(
    vscode.Uri.parse("untitled:Untitled-1"),
    filteredText,
    languageID,
  )

  const symbols = extractSymbols(text)

  const initialSel = new vscode.Selection(
    doc.positionAt(symbols["👉🏻"]),
    doc.positionAt(symbols["👈🏻"]),
  )

  const finalSel = new vscode.Selection(
    doc.positionAt(symbols["🫸🏻"]),
    doc.positionAt(symbols["🫷🏻"]),
  )

  return { doc, initialSel, finalSel }
}

export interface Test {
  text: string
  languageId: string
  cmd: Cmd.Command
}

/**
 * Each test case contains four markers describing the position of the
 * Initial selection (that is, the selection before the command is applied)
 * and of the Final Selection (that is, the selection after the command is applied)
 * - 👉🏻 : Initial selection, Start
 * - 👈🏻 : Initial selection, End
 * - 🫸🏻 : Final selection,   Start
 * - 🫷🏻 : Final selection,   End
 */
export const executeTestCases = (cases: Test[], case2Name?: string) => {
  test.concurrent.each(cases)(case2Name || "%#", async (c) => {
    const parser = await ParserLib.initParser()
    const { doc, initialSel, finalSel } = text2VScodeObjs(c.languageId, c.text)

    const language = detectLanguage(doc)
    if (!language) {
      throw new Error("Could not determine langauge")
    }
    await ParserLib.loadLanguage(process.cwd(), language)
    if (!ParserLib.setParserLanguage(parser, language)) {
      throw new Error("Could not set parser language")
    }
    const res = c.cmd(doc, initialSel, parser.parse(doc.getText()))

    if (res && !finalSel.isEqual(res)) {
      console.log(
        "Want",
        c.text,
        "\n----------------\n",
        "Have",
        [
          doc.getText().slice(0, doc.offsetAt(res.start)),
          "🫸🏻",
          doc.getText().slice(doc.offsetAt(res.start), doc.offsetAt(res.end)),
          "🫷🏻",
          doc.getText().slice(doc.offsetAt(res.start)),
        ].join(""),
      )
    }

    expect(res).toEqual(finalSel)
  })
}
