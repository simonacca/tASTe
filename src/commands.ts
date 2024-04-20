import { window } from "vscode"
import * as vscode from 'vscode'
import Parser from "web-tree-sitter"
import { logSyntaxNode, makeSelectionOfSize, movePositionChar, syntaxNode2Selection } from "./utils"
import { ASTpathOfCursor } from "./ast"

export type Grammar = any

export type Command = (
    languageID2Language: { [languageID: string]: Grammar },
    parser?: Parser
) => void

const setParserLanguageFromDoc = (
    doc: vscode.TextDocument,
    languageID2Language: { [languageID: string]: Grammar },
    parser?: Parser
) => {
    if (!parser || !window.activeTextEditor) { return }
    const grammar = languageID2Language[doc.languageId]

    if (!grammar) {
        vscode.window.showErrorMessage(`The language "${doc.languageId}" is not yet supported by TASTE. \nPlease consider contributing! https://github.com/simonacca/taste`)
        return
    }
    parser.setLanguage(grammar)
}

let globalSelectionStackByDoc: Map<vscode.TextDocument, vscode.Selection[]> = new Map()

export async function ExpandSelection(
    languageID2Language: { [languageID: string]: Grammar },
    parser?: Parser
) {
    if (!parser || !window.activeTextEditor) { return }
    const doc = window.activeTextEditor.document
    setParserLanguageFromDoc(doc, languageID2Language, parser)

    let selection = window.activeTextEditor.selection

    console.log("CURSOR",
        selection.start.line, selection.start.character,
        selection.end.line, selection.end.character)

    // if cursor is before any non-whitespace character, move it to the first non-whitespace character
    if (selection.start.isEqual(selection.end)) {
        const line = doc.lineAt(selection.start)
        if (line.firstNonWhitespaceCharacterIndex > selection.start.character) {
            selection = new vscode.Selection(
                new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex),
                new vscode.Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex))
        }
    }

    const ASTtree = parser.parse(doc.getText())
    const ASTpath = ASTpathOfCursor(doc.languageId, ASTtree.rootNode, selection)
    ASTpath.reverse()

    logSyntaxNode("ASTpath", ASTpath)

    const nodeToSelect = ASTpath.find(n => !selection.isEqual(syntaxNode2Selection(n)))
    if (!nodeToSelect) { return }
    logSyntaxNode("selecting node", [nodeToSelect])

    const prev = globalSelectionStackByDoc.get(doc) || []
    if (selection.isEmpty) {
        globalSelectionStackByDoc.set(doc, [])
    } else {
        globalSelectionStackByDoc.set(doc, [...prev, selection])
    }

    window.activeTextEditor.selection = syntaxNode2Selection(nodeToSelect)
}

export async function ContractSelection() {
    if (!window.activeTextEditor) { return }
    const doc = window.activeTextEditor.document

    const stack = globalSelectionStackByDoc.get(doc)
    if (!stack || stack.length === 0) { return }

    const last = stack[stack.length - 1]
    stack.pop()
    window.activeTextEditor.selection = last
}

export async function SelectTopLevel(
    languageID2Language: { [languageID: string]: Grammar },
    parser?: Parser
) {
    if (!parser || !window.activeTextEditor) { return }
    const doc = window.activeTextEditor.document
    setParserLanguageFromDoc(doc, languageID2Language, parser)
    const ASTtree = parser.parse(doc.getText())
    const ASTpath = ASTpathOfCursor(doc.languageId, ASTtree.rootNode, window.activeTextEditor.selection)

    if (ASTpath.length < 2) { return }
    window.activeTextEditor.selection = syntaxNode2Selection(ASTpath[1])
}

const parseAndExtractLastNode = (parser: Parser, doc: vscode.TextDocument, sel: vscode.Selection) => {
    const ASTtree = parser.parse(doc.getText())
    const ASTpath = ASTpathOfCursor(doc.languageId, ASTtree.rootNode, sel)
    return ASTpath[ASTpath.length - 1]

}

export async function SelectNodeForward(
    languageID2Language: { [languageID: string]: Grammar },
    parser?: Parser
) {
    if (!parser || !window.activeTextEditor) { return }
    const doc = window.activeTextEditor.document

    setParserLanguageFromDoc(doc, languageID2Language, parser)

    if (window.activeTextEditor.selection.isEmpty) {
        ExpandSelection(languageID2Language, parser)
        return
    }

    const node = parseAndExtractLastNode(parser, doc,
        makeSelectionOfSize(movePositionChar(window.activeTextEditor.selection.end, -1), 1)
    )

    if (!node || !node.nextNamedSibling) { return }

    window.activeTextEditor.selection = new vscode.Selection(
        window.activeTextEditor.selection.start,
        syntaxNode2Selection(node.nextNamedSibling).end)
}

export async function UnSelectNodeForward(
    languageID2Language: { [languageID: string]: Grammar },
    parser?: Parser
) {
    if (!parser || !window.activeTextEditor) { return }
    const doc = window.activeTextEditor.document

    setParserLanguageFromDoc(doc, languageID2Language, parser)

    const node = parseAndExtractLastNode(parser, doc,
        makeSelectionOfSize(movePositionChar(window.activeTextEditor.selection.end, -1), 1)
    )

    if (!node || !node.previousNamedSibling) { return }

    window.activeTextEditor.selection = new vscode.Selection(
        window.activeTextEditor.selection.start,
        syntaxNode2Selection(node.previousNamedSibling).end)
}

export async function SelectNodeBackward(
    languageID2Language: { [languageID: string]: Grammar },
    parser?: Parser
) {
    if (!parser || !window.activeTextEditor) { return }
    const doc = window.activeTextEditor.document

    setParserLanguageFromDoc(doc, languageID2Language, parser)

    const node = parseAndExtractLastNode(parser, doc,
        makeSelectionOfSize(window.activeTextEditor.selection.start, 1)
    )
    if (!node || !node.previousNamedSibling) { return }

    window.activeTextEditor.selection = new vscode.Selection(
        syntaxNode2Selection(node.previousNamedSibling).start,
        window.activeTextEditor.selection.end)
}