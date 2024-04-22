import * as vscode from "vscode"
import * as vsj from "jest-mock-vscode"
import * as Cmd from "./commands"
import * as ParserLib from "./parser"

describe("workspace", () => {
  test("SelectTopLevel", async () => {
    const parser = await ParserLib.initParser()

    const doc = vsj.createTextDocument(
      vscode.Uri.parse("untitled:Untitled-1"),
      `
const a = () => {

}
`,
      "typescript",
    )
    const initialSel = new vscode.Selection(new vscode.Position(2, 2), new vscode.Position(2, 2))
    const finalSel = new vscode.Selection(new vscode.Position(1, 0), new vscode.Position(3, 1))
    await ParserLib.loadLanguage(".", doc.languageId)
    if (!ParserLib.setParserLanguage(parser, doc.languageId)) {
      throw new Error("Could not set parser language")
    }
    const res = Cmd.SelectTopLevel(doc, initialSel, parser.parse(doc.getText()))
    expect(res?.isEqual(finalSel)).toBeTruthy()
  })
})
