import { TextDocument, Selection, TextEditorEdit } from "vscode"
import Parser from "web-tree-sitter"
import * as vsUtils from "../../utils/vscode"
import * as tsUtils from "../../utils/tree_sitter"
import { CommandRet } from "../common"

export const Raise = (doc: TextDocument, sel: Selection, tree: Parser.Tree): CommandRet => {
  const node = tsUtils.SmallestNodeEnclosingSel(tree.rootNode, sel)
  const parent = tsUtils.enclosingParent(node)

  if (!node || !parent) {
    return
  }

  const parentSel = tsUtils.SyntaxNode2Selection(parent)
  const edit = (editBuilder: TextEditorEdit) => {
    editBuilder.replace(parentSel, node.text)
  }

  return { selection: vsUtils.emptySelection(parentSel.start), edit }
}
