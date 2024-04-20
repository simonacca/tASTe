import * as vscode from "vscode"
import Parser from "web-tree-sitter"
import {
  logSyntaxNode,
  makeSelectionOfSize,
  movePositionChar,
  syntaxNode2Selection,
} from "./utils"
import { ASTpathOfCursor } from "./ast"

export type Grammar = any

export type Command = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => vscode.Selection | undefined

let globalSelectionStackByDoc: Map<vscode.TextDocument, vscode.Selection[]> =
  new Map()

export const ExpandSelection = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  console.log(
    "CURSOR",
    selection.start.line,
    selection.start.character,
    selection.end.line,
    selection.end.character,
  )

  // if cursor is before any non-whitespace character, move it to the first non-whitespace character
  if (selection.isEmpty) {
    const line = doc.lineAt(selection.start)
    if (line.firstNonWhitespaceCharacterIndex > selection.start.character) {
      selection = new vscode.Selection(
        new vscode.Position(
          line.lineNumber,
          line.firstNonWhitespaceCharacterIndex,
        ),
        new vscode.Position(
          line.lineNumber,
          line.firstNonWhitespaceCharacterIndex,
        ),
      )
    }
  }

  const cursorPath = ASTpathOfCursor(tree.rootNode, selection)
  cursorPath.reverse()

  logSyntaxNode("cursorPath", cursorPath)

  const nodeToSelect = cursorPath.find(
    (n) => !selection.isEqual(syntaxNode2Selection(n)),
  )
  if (!nodeToSelect) {
    return
  }
  logSyntaxNode("selecting node", [nodeToSelect])

  const prev = globalSelectionStackByDoc.get(doc) || []
  if (selection.isEmpty) {
    globalSelectionStackByDoc.set(doc, [])
  } else {
    globalSelectionStackByDoc.set(doc, [...prev, selection])
  }

  return syntaxNode2Selection(nodeToSelect)
}

export const ContractSelection = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  const stack = globalSelectionStackByDoc.get(doc)
  if (!stack || stack.length === 0) {
    return
  }

  const last = stack[stack.length - 1]
  stack.pop()
  return last
}

export const SelectTopLevel = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  const cursorPath = ASTpathOfCursor(tree.rootNode, selection)

  if (cursorPath.length < 2) {
    return
  }
  return syntaxNode2Selection(cursorPath[1])
}

const smallestNodeContainingSelection = (
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  const cursorPath = ASTpathOfCursor(tree.rootNode, selection)
  return cursorPath[cursorPath.length - 1]
}

export const SelectNodeForward = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  if (selection.isEmpty) {
    ExpandSelection(doc, selection, tree)
    return
  }

  const node = smallestNodeContainingSelection(
    makeSelectionOfSize(movePositionChar(selection.end, -1), 1),
    tree,
  )

  if (!node || !node.nextNamedSibling) {
    return
  }

  return new vscode.Selection(
    selection.start,
    syntaxNode2Selection(node.nextNamedSibling).end,
  )
}

export const UnSelectNodeForward = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  const node = smallestNodeContainingSelection(
    makeSelectionOfSize(movePositionChar(selection.end, -1), 1),
    tree,
  )

  if (!node || !node.previousNamedSibling) {
    return
  }

  return new vscode.Selection(
    selection.start,
    syntaxNode2Selection(node.previousNamedSibling).end,
  )
}

export const SelectNodeBackward = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  const node = smallestNodeContainingSelection(
    makeSelectionOfSize(selection.start, 1),
    tree,
  )
  if (!node || !node.previousNamedSibling) {
    return
  }

  return new vscode.Selection(
    syntaxNode2Selection(node.previousNamedSibling).start,
    selection.end,
  )
}
