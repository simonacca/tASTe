import { SyntaxNode } from "web-tree-sitter"
import * as vscode from "vscode"

export const logSyntaxNode = (t: string, ASTpath: SyntaxNode[]) => {
  console.log(
    t,
    "\n",
    ASTpath.map((n) =>
      [
        n.startPosition.row,
        n.startPosition.column,
        n.endPosition.row,
        n.endPosition.column,
        n.type,
      ].join("\t"),
    ).join("\n "),
  )
}

export const parserNode2Selection = (node: SyntaxNode) => {
  return new vscode.Selection(
    new vscode.Position(node.startPosition.row, node.startPosition.column),
    new vscode.Position(node.endPosition.row, node.endPosition.column),
  )
}

export const invert = (selection: vscode.Selection) => {
  return new vscode.Selection(selection.end, selection.start)
}

export const movePositionChar = (pos: vscode.Position, amount: number) => {
  return new vscode.Position(pos.line, pos.character + amount)
}

export const makeSelectionOfSize = (pos: vscode.Position, size: number) => {
  return new vscode.Selection(pos, movePositionChar(pos, size))
}

export const emptySelection = (pos: vscode.Position) =>
  makeSelectionOfSize(pos, 0)

export const selectFirstChar = (s: vscode.Selection) =>
  makeSelectionOfSize(s.start, 1)
export const selectLastChar = (s: vscode.Selection) =>
  makeSelectionOfSize(movePositionChar(s.end, -1), 1)

export const moveSelectionToFirstNonWhitespace = (
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
