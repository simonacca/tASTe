import { TextDocument, Selection } from "vscode"
import Parser from "web-tree-sitter"
import * as tsUtils from "../../utils/tree_sitter"
import { CommandRet } from "../common"

export const SelectTopLevel = (
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  let node = tsUtils.SmallestNodeEnclosingSel(tree.rootNode, sel)
  if (!node) {
    return
  }

  // if we can't get to the top in 50 iteration, we bail
  for (let i = 0; i < 50; i++) {
    if (!node.parent?.parent) {
      break
    }
    node = node.parent
  }

  return { selection: tsUtils.SyntaxNode2Selection(node) }
}
