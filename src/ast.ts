import * as vscode from "vscode"
import { SyntaxNode } from "web-tree-sitter"

export const ASTpathOfCursor = (
  languageID: string,
  node: SyntaxNode,
  cursor: vscode.Selection,
): SyntaxNode[] => {
  const isInRange =
    (node.startPosition.row < cursor.start.line ||
      (node.startPosition.row === cursor.start.line &&
        node.startPosition.column <= cursor.start.character)) &&
    (node.endPosition.row > cursor.end.line ||
      (node.endPosition.row === cursor.end.line &&
        node.endPosition.column >= cursor.end.character))

  if (!isInRange) {
    return []
  }

  // we do not want anonymous nodes like parentheses
  // see: https://tree-sitter.github.io/tree-sitter/using-parsers#named-vs-anonymous-nodes
  if (!node.isNamed) {
    return []
  }

  for (const child of node.children) {
    const res = ASTpathOfCursor(languageID, child, cursor)
    if (res.length > 0) {
      return [node, ...res]
    }
  }

  return [node]
}
