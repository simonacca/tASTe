import * as vscode from "vscode"
import * as ParserLib from "./parser"
import * as Cmd from "./commands"

const initCommands = (
  context: vscode.ExtensionContext,
  parser: ParserLib.Parser,
  commands: { [key: string]: Cmd.Command },
) => {
  for (const cmd of Object.entries(commands)) {
    context.subscriptions.push(
      vscode.commands.registerCommand(cmd[0], () => {
        if (!parser || !vscode.window.activeTextEditor) {
          return
        }
        const doc = vscode.window.activeTextEditor.document
        const selection = vscode.window.activeTextEditor.selection

        parser.setParserLanguageFromDoc(doc)

        const ASTtree = parser.parse(doc.getText())

        const newSel = cmd[1](doc, selection, ASTtree)

        if (!newSel) {
          return
        }

        vscode.window.activeTextEditor.selection = newSel
      }),
    )
  }
}

export const activate = async (context: vscode.ExtensionContext) => {
  const parser = await ParserLib.initParser()

  if (vscode.window.activeTextEditor) {
    await ParserLib.loadLanguage(
      context.extensionPath,
      vscode.window.activeTextEditor.document.languageId,
    )
  }

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (!editor) {
      return
    }
    ParserLib.loadLanguage(context.extensionPath, editor.document.languageId)
  })

  initCommands(context, parser, {
    "taste.expandSelection": Cmd.ExpandSelection,
    "taste.contractSelection": Cmd.ContractSelection,
    "taste.selectTopLevel": Cmd.SelectTopLevel,
    "taste.selectNodeForward": Cmd.SelectNodeForward,
    "taste.unselectNodeForward": Cmd.UnSelectNodeForward,
    "taste.selectNodeBackward": Cmd.SelectNodeBackward,
  })
}

export function deactivate() {}
