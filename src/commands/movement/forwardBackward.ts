import { TextDocument, Selection } from "vscode"
import Parser from "web-tree-sitter"
import * as vsUtils from "../../utils/vscode"
import * as tsUtils from "../../utils/tree_sitter"
import { CommandRet } from "../common"

export const MoveCursorForward = (
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  sel = vsUtils.moveSelectionToFirstNonWhitespace(doc, sel)
  const node = tsUtils.SmallestNodeEnclosingSel(tree.rootNode, sel)

  if (!node) {
    return
  }

  const sibling = node.nextNamedSibling
  if (!sibling) {
    return
  }
  return { selection: vsUtils.emptySelection(tsUtils.SyntaxNode2Selection(sibling).start) }
}

export const MoveCursorBackward = (
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  const node = tsUtils.SmallestNodeEnclosingSel(tree.rootNode, sel)

  if (!node) {
    return
  }

  const sibling = node.previousNamedSibling
  if (!sibling) {
    return
  }
  return { selection: vsUtils.emptySelection(tsUtils.SyntaxNode2Selection(sibling).start) }
}
