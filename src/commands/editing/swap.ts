import { TextDocument, Selection, TextEditorEdit } from "vscode"
import Parser from "web-tree-sitter"
import * as tsUtils from "../../utils/tree_sitter"
import { CommandRet } from "../common"

export const SwapForward = (doc: TextDocument, sel: Selection, tree: Parser.Tree): CommandRet => {
  const node = tsUtils.SmallestNodeEnclosingSel(tree.rootNode, sel)
  const sibling = node?.nextNamedSibling

  if (!node || !sibling) {
    return
  }

  const siblingText = sibling.text

  const edit = (editBuilder: TextEditorEdit) => {
    editBuilder.replace(tsUtils.SyntaxNode2Selection(sibling), node.text)
    editBuilder.replace(tsUtils.SyntaxNode2Selection(node), siblingText)
  }

  return { edit }
}

export const SwapBackward = (doc: TextDocument, sel: Selection, tree: Parser.Tree): CommandRet => {
  const node = tsUtils.SmallestNodeEnclosingSel(tree.rootNode, sel)
  const sibling = node?.previousNamedSibling

  if (!node || !sibling) {
    return
  }

  const nodeText = node.text

  const edit = (editBuilder: TextEditorEdit) => {
    editBuilder.replace(tsUtils.SyntaxNode2Selection(node), sibling.text)
    editBuilder.replace(tsUtils.SyntaxNode2Selection(sibling), nodeText)
  }

  return { edit }
}
