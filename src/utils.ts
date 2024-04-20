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

export const syntaxNode2Selection = (innermostNode: SyntaxNode) => {
  return new vscode.Selection(
    new vscode.Position(
      innermostNode.startPosition.row,
      innermostNode.startPosition.column,
    ),
    new vscode.Position(
      innermostNode.endPosition.row,
      innermostNode.endPosition.column,
    ),
  )
}

export const movePositionChar = (pos: vscode.Position, amount: number) => {
  return new vscode.Position(pos.line, pos.character + amount)
}

export const makeSelectionOfSize = (pos: vscode.Position, size: number) => {
  return new vscode.Selection(pos, movePositionChar(pos, size))
}
