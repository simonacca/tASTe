import * as vscode from "vscode"
import * as ParserLib from "./parser"
import * as Cmd from "./commands"
import TSParser from "web-tree-sitter"
import { detectLanguage } from "./languageDetection"

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

        const language = detectLanguage(doc)
        if (!language || !ParserLib.setParserLanguage(parser, language)) {
          vscode.window.showErrorMessage(
            `The language "${language}" is not yet supported by tASTe. \nPlease consider contributing! https://github.com/simonacca/tASTe`,
          )
          return
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
    const language = detectLanguage(vscode.window.activeTextEditor.document)
    if (!language) {
      console.warn(`Could not load parser for ${language}`)
      return
    }
    await ParserLib.loadLanguage(context.extensionPath, language)
  }

  vscode.window.onDidChangeActiveTextEditor((editor) => {
    if (!editor) {
      return
    }
    const language = detectLanguage(editor.document)
    if (!language) {
      console.warn(`Could not load parser for ${language}`)
      return
    }
    ParserLib.loadLanguage(context.extensionPath, language)
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
    "taste.Raise": Cmd.Raise,
    "taste.SwapForward": Cmd.SwapForward,
    "taste.SwapBackward": Cmd.SwapBackward,
    "taste.BarfForward": Cmd.BarfForward,
    "taste.SlurpForward": Cmd.SlurpForward,
  })
}

export function deactivate() {}
