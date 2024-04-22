import { Selection } from "vscode"
import { SyntaxNode } from "web-tree-sitter"

export type Path = SyntaxNode[]

export const pathOfSmallestNodeContainingSelection = (
  node: SyntaxNode,
  selection: Selection,
): Path => {
  const isInRange =
    (node.startPosition.row < selection.start.line ||
      (node.startPosition.row === selection.start.line &&
        node.startPosition.column <= selection.start.character)) &&
    (node.endPosition.row > selection.end.line ||
      (node.endPosition.row === selection.end.line &&
        node.endPosition.column >= selection.end.character))

  if (!isInRange) {
    return []
  }

  // we do not want anonymous nodes like parentheses
  // see: https://tree-sitter.github.io/tree-sitter/using-parsers#named-vs-anonymous-nodes
  if (!node.isNamed) {
    return []
  }

  for (const child of node.children) {
    const res = pathOfSmallestNodeContainingSelection(child, selection)
    if (res.length > 0) {
      return [node, ...res]
    }
  }

  return [node]
}
