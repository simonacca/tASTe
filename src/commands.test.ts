import * as vscode from "vscode"
import * as vsj from "jest-mock-vscode"
import * as Cmd from "./commands"
import * as ParserLib from "./parser"

const re = /<IS>|<IE>|<FS>|<FE>/g
const extractSymbols = (text: string) => {
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
    doc.positionAt(symbols["<IS>"]),
    doc.positionAt(symbols["<IE>"]),
  )

  const finalSel = new vscode.Selection(
    doc.positionAt(symbols["<FS>"]),
    doc.positionAt(symbols["<FE>"]),
  )

  return { doc, initialSel, finalSel }
}

describe("workspace", () => {
  test("SelectTopLevel", async () => {
    const parser = await ParserLib.initParser()

    const { doc, initialSel, finalSel } = text2VScodeObjs(
      "typescript",
      `
a = 123
<FS>const<IS><IE> a = () => {
    
}<FE>
    `,
    )

    await ParserLib.loadLanguage(".", doc.languageId)
    if (!ParserLib.setParserLanguage(parser, doc.languageId)) {
      throw new Error("Could not set parser language")
    }
    const res = Cmd.SelectTopLevel(doc, initialSel, parser.parse(doc.getText()))
    const isEq = res?.isEqual(finalSel)

    if (!isEq) {
      console.error("Res", res)
    }
    expect(isEq).toBeTruthy()
  })
})
