import * as vscode from "vscode"
import * as ParserLib from "./parser"
import * as SelCmds from "./commands_selection"
import * as EditCmds from "./commands_edit"
import TSParser from "web-tree-sitter"
import { detectLanguage } from "./languageDetection"
import { Command } from "./commands"

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

        const newSel = await cmd[1](editor, doc, selection, ASTtree)

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
    "taste.ExpandSelection": SelCmds.ExpandSelection,
    "taste.ContractSelection": SelCmds.ContractSelection,
    "taste.SelectTopLevel": SelCmds.SelectTopLevel,
    "taste.GrowSelectionAtEnd": SelCmds.GrowSelectionAtEnd,
    "taste.ShrinkSelectionAtEnd": SelCmds.ShrinkSelectionAtEnd,
    "taste.GrowSelectionAtStart": SelCmds.GrowSelectionAtStart,
    "taste.ShrinkSelectionAtStart": SelCmds.ShrinkSelectionAtStart,
    "taste.SelectForward": SelCmds.SelectForward,
    "taste.SelectBackward": SelCmds.SelectBackward,
    "taste.MoveCursorBackward": SelCmds.MoveCursorBackward,
    "taste.MoveCursorForward": SelCmds.MoveCursorForward,
    "taste.Raise": EditCmds.Raise,
    "taste.SwapForward": EditCmds.SwapForward,
    "taste.SwapBackward": EditCmds.SwapBackward,
    "taste.BarfForward": EditCmds.BarfForward,
    "taste.SlurpForward": EditCmds.SlurpForward,
  })
}

export function deactivate() {}
