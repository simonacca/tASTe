import * as vscode from "vscode"
import * as ParserLib from "./parser"
import * as Cmd from "./commands"
import TSParser from "web-tree-sitter"

const initCommands = (
  context: vscode.ExtensionContext,
  parser: TSParser,
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

        if (!ParserLib.setParserLanguage(parser, doc.languageId)) {
          vscode.window.showErrorMessage(
            `The language "${doc.languageId}" is not yet supported by tASTe. \nPlease consider contributing! https://github.com/simonacca/tASTe`,
          )
        }

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
    "taste.ExpandSelection": Cmd.ExpandSelection,
    "taste.ContractSelection": Cmd.ContractSelection,
    "taste.SelectTopLevel": Cmd.SelectTopLevel,
    "taste.GrowSelectionAtEnd": Cmd.GrowSelectionAtEnd,
    "taste.ShrinkSelectionAtEnd": Cmd.ShrinkSelectionAtEnd,
    "taste.GrowSelectionAtStart": Cmd.GrowSelectionAtStart,
    "taste.ShrinkSelectionAtStart": Cmd.ShrinkSelectionAtStart,
    "taste.SelectForward": Cmd.SelectForward,
    "taste.SelectBackward": Cmd.SelectBackward,
    "taste.MoveCursorBackward": Cmd.MoveCursorBackward,
    "taste.MoveCursorForward": Cmd.MoveCursorForward,
  })
}

export function deactivate() {}
