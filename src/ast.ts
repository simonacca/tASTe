import { Selection } from "vscode"
import { SyntaxNode, Tree } from "web-tree-sitter"
import * as U from "./utils"

export type Path = SyntaxNode[]

export const path2Sel = (node: SyntaxNode, selection: Selection): Path => {
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
    const res = path2Sel(child, selection)
    if (res.length > 0) {
      return [node, ...res]
    }
  }

  return [node]
}

// biggestNodeContaining smallSel which is fully contained in bigSel
export const biggestNodeContaining = (
  tree: Tree,
  bigSel: Selection,
  smallSel: Selection,
): SyntaxNode | undefined => {
  const path = path2Sel(tree.rootNode, smallSel)
  let node = U.last(path)
  if (!node) {
    return
  }
  while (node && node.parent && bigSel.contains(U.parserNode2Selection(node.parent))) {
    node = node.parent
  }
  return node
}
