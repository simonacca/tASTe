import { TextDocument, Selection } from "vscode"
import Parser, { SyntaxNode } from "web-tree-sitter"
import * as vsUtils from "../../utils/vscode"
import * as tsUtils from "../../utils/tree_sitter"
import { CommandRet, globalSelectionStack } from "../common"

export const ExpandSelection = (
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  let parent: SyntaxNode | undefined | null = undefined
  if (sel.isEmpty) {
    sel = vsUtils.moveSelectionToFirstNonWhitespace(doc, sel)
    parent = tsUtils.SmallestNodeEnclosingSel(tree.rootNode, sel)
  } else {
    const node = tsUtils.SmallestNodeEnclosingSel(tree.rootNode, sel)
    if (!node) {
      return
    }

    if (tsUtils.SyntaxNode2Selection(node).isEqual(sel)) {
      // in this case sel covers exactly one syntax node, so we jump to its parent
      parent = tsUtils.enclosingParent(node)
    } else {
      // in this case, sel covers more than one syntax node (for example two sibling nodes)
      // so we jump to node, which is already the smallest syntax node that encloses all of
      // sel
      parent = node
    }
  }

  if (!parent) {
    return
  }

  globalSelectionStack.push(doc, sel)

  return { selection: tsUtils.SyntaxNode2Selection(parent) }
}

export const ContractSelection = (
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  return { selection: globalSelectionStack.pop(doc) }
}
