import * as vscode from "vscode"
import Parser from "web-tree-sitter"
import {
  makeSelectionOfSize,
  movePositionChar,
  syntaxNode2Selection,
} from "./utils"
import { ASTpathOfCursor } from "./ast"

export type Command = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => vscode.Selection | undefined

class GlobalSelectionStackByDoc {
  private state = new Map<vscode.TextDocument, vscode.Selection[]>()

  push = (doc: vscode.TextDocument, selection: vscode.Selection) => {
    const prev = this.state.get(doc) || []
    if (selection.isEmpty) {
      this.state.set(doc, [])
    } else {
      this.state.set(doc, [...prev, selection])
    }
  }

  pop = (doc: vscode.TextDocument) => {
    const stack = this.state.get(doc)
    if (!stack || stack.length === 0) {
      return
    }

    const last = stack[stack.length - 1]
    stack.pop()
    return last
  }
}

const globalSelectionStack = new GlobalSelectionStackByDoc()

const moveSelectionToFirstNonWhitespace = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
) => {
  const line = doc.lineAt(selection.start)
  if (line.firstNonWhitespaceCharacterIndex > selection.start.character) {
    return new vscode.Selection(
      new vscode.Position(
        line.lineNumber,
        line.firstNonWhitespaceCharacterIndex,
      ),
      new vscode.Position(
        line.lineNumber,
        line.firstNonWhitespaceCharacterIndex,
      ),
    )
  } else {
    return selection
  }
}

const findSmallestNodeContainingSelection = (
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  const cursorPath = ASTpathOfCursor(tree.rootNode, selection)
  if (cursorPath.length === 0) {
    return
  }
  return cursorPath[cursorPath.length - 1]
}

const findNodeMatchingSelection = (
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  const cursorPath = ASTpathOfCursor(tree.rootNode, selection)
  cursorPath.reverse()
  return cursorPath.find((n) => !selection.isEqual(syntaxNode2Selection(n)))
}

export const ExpandSelection = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  if (selection.isEmpty) {
    selection = moveSelectionToFirstNonWhitespace(doc, selection)
  }

  const node = findNodeMatchingSelection(selection, tree)
  if (!node) {
    return
  }

  globalSelectionStack.push(doc, selection)

  return syntaxNode2Selection(node)
}

export const ContractSelection = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  return globalSelectionStack.pop(doc)
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

export const SelectNodeForward = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  if (selection.isEmpty) {
    ExpandSelection(doc, selection, tree)
    return
  }

  const node = findSmallestNodeContainingSelection(
    makeSelectionOfSize(movePositionChar(selection.end, -1), 1),
    tree,
  )

  if (!node?.nextNamedSibling) {
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
  const node = findSmallestNodeContainingSelection(
    makeSelectionOfSize(movePositionChar(selection.end, -1), 1),
    tree,
  )

  if (!node?.previousNamedSibling) {
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
  const node = findSmallestNodeContainingSelection(
    makeSelectionOfSize(selection.start, 1),
    tree,
  )
  if (!node?.previousNamedSibling) {
    return
  }

  return new vscode.Selection(
    syntaxNode2Selection(node.previousNamedSibling).start,
    selection.end,
  )
}
