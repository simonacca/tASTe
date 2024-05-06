import * as vscode from "vscode"
import * as ParserLib from "./utils/tree_sitter"
import TSParser from "web-tree-sitter"
import { detectLanguage } from "./utils/language_detection"
import { Command } from "./commands/common"
import EditCmds from "./commands/editing"
import SelCmds from "./commands/selection"
import MovementCmds from "./commands/movement"

const initCommands = (
  context: vscode.ExtensionContext,
  parser: TSParser,
  commands: { [key: string]: Command },
) => {
  for (const cmd of Object.entries(commands)) {
    context.subscriptions.push(
      vscode.commands.registerCommand(cmd[0], async () => {
        if (!parser || !vscode.window.activeTextEditor) {
          return
        }
        const editor = vscode.window.activeTextEditor
        const doc = editor.document
        const selection = vscode.window.activeTextEditor.selection

        const language = detectLanguage(doc)
        if (!language || !ParserLib.setParserLanguage(parser, language)) {
          vscode.window.showErrorMessage(
            `The language "${language}" is not yet supported by tASTe. \nPlease consider contributing! https://github.com/simonacca/tASTe`,
          )
          return
        }

        const ASTtree = parser.parse(doc.getText())

        const ret = cmd[1](doc, selection, ASTtree)

        if (ret?.edit) {
          editor.edit(ret.edit)
        }

        if (ret?.selection) {
          vscode.window.activeTextEditor.selection = ret.selection
        }
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
    "taste.ExpandSelection": SelCmds.ExpandSelection,
    "taste.ContractSelection": SelCmds.ContractSelection,
    "taste.SelectTopLevel": SelCmds.SelectTopLevel,
    "taste.GrowSelectionAtEnd": SelCmds.GrowSelectionAtEnd,
    "taste.ShrinkSelectionAtEnd": SelCmds.ShrinkSelectionAtEnd,
    "taste.GrowSelectionAtStart": SelCmds.GrowSelectionAtStart,
    "taste.ShrinkSelectionAtStart": SelCmds.ShrinkSelectionAtStart,
    "taste.SelectForward": SelCmds.SelectForward,
    "taste.SelectBackward": SelCmds.SelectBackward,
    "taste.MoveCursorBackward": MovementCmds.MoveCursorBackward,
    "taste.MoveCursorForward": MovementCmds.MoveCursorForward,
    "taste.Raise": EditCmds.Raise,
    "taste.SwapForward": EditCmds.SwapForward,
    "taste.SwapBackward": EditCmds.SwapBackward,
    "taste.BarfForward": EditCmds.BarfForward,
    "taste.SlurpForward": EditCmds.SlurpForward,
  })
}

export function deactivate() {}
