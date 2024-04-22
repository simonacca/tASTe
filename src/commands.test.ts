import * as vscode from "vscode"
import * as vsj from "jest-mock-vscode"
import * as Cmd from "./commands"
import { initParser, setParserLanguage } from "./parser"

describe("workspace", () => {
  test("SelectTopLevel", async () => {
    const parser = await initParser()

    const doc = vsj.createTextDocument(
      vscode.Uri.parse("untitled:Untitled-1"),
      `
const a = () => {

}
`,
    )
    const sel = new vscode.Selection(new vscode.Position(1, 1), new vscode.Position(1, 1))
    if (!setParserLanguage(parser, "typescript")) {
      throw new Error("Could not set parser language")
    }
    Cmd.SelectTopLevel(doc, sel, parser.parse(doc.getText()))
  })
})
