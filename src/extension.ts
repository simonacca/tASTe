import * as vscode from 'vscode'
import Parser from "web-tree-sitter"
import { languageID2Filename } from "./languages"
import * as Cmd from './commands'


// this will be resolved on activation
var parser: Parser | undefined = undefined
// this will be populate on activation
var languageID2Language: { [languageID: string]: Cmd.Grammar } = {}

const initParserPromise = Parser.init()
const initParser = async () => {
	await initParserPromise
	parser = new Parser
}


const loadLanguage = async (basePath: string, languageID: string) => {
	// already loaded
	if (languageID2Language[languageID]) { return }

	console.log(`Loading language:`, languageID)

	const fileName = languageID2Filename(basePath, languageID)
	try {
		languageID2Language[languageID] = await Parser.Language.load(fileName)
	} catch (error) {
		console.warn(`Could not load language: ${languageID}`)
	}

}

export const activate = async (context: vscode.ExtensionContext) => {
	await initParser()

	if (vscode.window.activeTextEditor) {
		await loadLanguage(context.extensionPath, vscode.window.activeTextEditor.document.languageId)
	}

	vscode.window.onDidChangeActiveTextEditor((editor) => {
		if (!editor) { return }
		loadLanguage(context.extensionPath, editor.document.languageId)
	})

	context.subscriptions.push(vscode.commands.registerCommand('taste.expandSelection', () => Cmd.ExpandSelection(languageID2Language, parser)))
	context.subscriptions.push(vscode.commands.registerCommand('taste.contractSelection', Cmd.ContractSelection))
	context.subscriptions.push(vscode.commands.registerCommand('taste.selectTopLevel', () => Cmd.SelectTopLevel(languageID2Language, parser)))
	context.subscriptions.push(vscode.commands.registerCommand('taste.selectNodeForward', () => Cmd.SelectNodeForward(languageID2Language, parser)))
	context.subscriptions.push(vscode.commands.registerCommand('taste.unselectNodeForward', () => Cmd.UnSelectNodeForward(languageID2Language, parser)))
	context.subscriptions.push(vscode.commands.registerCommand('taste.selectNodeBackward', () => Cmd.SelectNodeBackward(languageID2Language, parser)))

}

export function deactivate() { }
