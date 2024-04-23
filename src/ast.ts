import { Selection } from "vscode"
import { SyntaxNode, Tree } from "web-tree-sitter"
import * as U from "./utils"

export const Sel = (container: SyntaxNode, selection: Selection): SyntaxNode | undefined => {
  if (!U.parserNode2Selection(container).contains(selection)) {
    return
  }

  const [_, res] = U.find(container.children, (c) => Sel(c, selection))
  if (res) {
    return res
  }

  if (container.isNamed) {
    return container
  }
}

// biggestNodeContaining smallSel which is fully contained in bigSel
export const biggestNodeContaining = (
  tree: Tree,
  bigSel: Selection,
  smallSel: Selection,
): SyntaxNode | undefined => {
  let node = Sel(tree.rootNode, smallSel)
  if (!node) {
    return
  }
  while (node && node.parent && bigSel.contains(U.parserNode2Selection(node.parent))) {
    node = node.parent
  }
  return node
}
