import * as vscode from "vscode"
import * as vsj from "jest-mock-vscode"
import * as Cmd from "./commands"

const re = /<IS>|<IE>|<FS>|<FE>/g
export const extractSymbols = (text: string) => {
  const positions = Array.from(text.matchAll(re))
  if (positions.length !== 4) {
    throw new Error("Must have exactly 4 <> symbols")
  }

  const symbols: { [symbol: string]: number } = {}

  symbols[positions[0][0]] = positions[0].index
  symbols[positions[1][0]] = positions[1].index - 4
  symbols[positions[2][0]] = positions[2].index - 4 - 4
  symbols[positions[3][0]] = positions[3].index - 4 - 4 - 4

  if (!symbols["<IS>"]) {
    throw new Error("Missing symbol <IS>")
  }

  if (!symbols["<IE>"]) {
    throw new Error("Missing symbol <IE>")
  }

  if (!symbols["<FS>"]) {
    throw new Error("Missing symbol <FS>")
  }

  if (!symbols["<FE>"]) {
    throw new Error("Missing symbol <FE>")
  }

  return symbols
}

export const text2VScodeObjs = (
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
    doc.positionAt(symbols["<IS>"]),
    doc.positionAt(symbols["<IE>"]),
  )

  const finalSel = new vscode.Selection(
    doc.positionAt(symbols["<FS>"]),
    doc.positionAt(symbols["<FE>"]),
  )

  return { doc, initialSel, finalSel }
}

export interface Test {
  text: string
  languageId: string
  cmd: Cmd.Command
}
