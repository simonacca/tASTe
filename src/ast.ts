import { Selection } from "vscode"
import { SyntaxNode, Tree } from "web-tree-sitter"
import * as U from "./utils"

/**
 * Finds the smallest SyntaxNode that fully encloses `selection`
 */
export const Sel = (container: SyntaxNode, selection: Selection): SyntaxNode | undefined => {
  if (!U.SyntaxNode2Selection(container).contains(selection)) {
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

/**
 * Finds the biggest SyntaxNode containing smallSel which is fully contained in bigSel
 */
export const biggestNodeContaining = (
  tree: Tree,
  bigSel: Selection,
  smallSel: Selection,
): SyntaxNode | undefined => {
  let node = Sel(tree.rootNode, smallSel)
  if (!node) {
    return
  }
  while (node && node.parent && bigSel.contains(U.SyntaxNode2Selection(node.parent))) {
    node = node.parent
  }
  return node
}

/**
 * Finds a node's parent.
 * Sometimes the syntax tree has a parent node whose range concides with its child's range.
 * in these cases we want to try the ancestors further up until we find one
 * whose range does not coincide with the child.
 * if we don't manage in 10 attempts, we bail
 */
export const enclosingParent = (node: SyntaxNode | undefined): SyntaxNode | null | undefined => {
  let parent = node?.parent
  for (let i = 0; i < 10; i++) {
    if (!node || !parent || !U.areSyntaxNodesSameSelection(node, parent)) {
      break
    }
    parent = parent?.parent
  }

  return parent
}

export const firstAncestorWithNamedChild = (node: SyntaxNode): SyntaxNode | undefined => {
  while (true) {
    if (node.firstNamedChild) {
      return node
    }
    if (!node.parent) {
      return
    }
    node = node.parent
  }
}
