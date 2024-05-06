import { TextDocument, Selection } from "vscode"
import Parser, { SyntaxNode } from "web-tree-sitter"
import * as vsUtils from "../../utils/vscode"
import * as tsUtils from "../../utils/tree_sitter"
import { CommandRet } from "../common"

export const MoveCursorForwardToEndOfNode = (
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  sel = vsUtils.emptySelection(sel.end)
  sel = vsUtils.moveSelectionToFirstNonWhitespace(doc, sel)

  let node = tsUtils.SmallestNodeEnclosingSel(tree.rootNode, sel)

  while (node && node !== node.tree.rootNode) {
    if (!sel.end.isEqual(tsUtils.SyntaxNode2Selection(node).end)) {
      return {
        selection: vsUtils.emptySelection(tsUtils.SyntaxNode2Selection(node).end),
      }
    } else if (node.nextNamedSibling) {
      return {
        selection: vsUtils.emptySelection(tsUtils.SyntaxNode2Selection(node.nextNamedSibling).end),
      }
    } else if (node.parent) {
      node = node.parent
    } else {
      return
    }
  }
}

export const MoveCursorForwardToBeginningOfNextNode = (
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  sel = vsUtils.emptySelection(sel.end)
  sel = vsUtils.moveSelectionToFirstNonWhitespace(doc, sel)

  const deepestNode = tsUtils.SmallestNodeEnclosingSel(tree.rootNode, sel)
  if (!deepestNode) {
    return
  }
  let node: SyntaxNode | null = deepestNode

  while (node) {
    if (
      node.nextNamedSibling &&
      !sel.start.isEqual(tsUtils.SyntaxNode2Selection(node.nextNamedSibling).start)
    ) {
      return {
        selection: vsUtils.emptySelection(
          tsUtils.SyntaxNode2Selection(node.nextNamedSibling).start,
        ),
      }
    }
    node = node.parent
  }

  return {
    selection: vsUtils.emptySelection(tsUtils.SyntaxNode2Selection(deepestNode).end),
  }
}

export const MoveCursorBackward = (
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  sel = vsUtils.emptySelection(sel.start)

  // TODO: implement this in the opposite direction
  // sel = vsUtils.moveSelectionToFirstNonWhitespace(doc, sel)

  let node = tsUtils.SmallestNodeEnclosingSel(tree.rootNode, sel)

  while (node) {
    if (!sel.start.isEqual(tsUtils.SyntaxNode2Selection(node).start)) {
      return {
        selection: vsUtils.emptySelection(tsUtils.SyntaxNode2Selection(node).start),
      }
    } else if (node.previousNamedSibling) {
      return {
        selection: vsUtils.emptySelection(
          tsUtils.SyntaxNode2Selection(node.previousNamedSibling).start,
        ),
      }
    }
    node = node.parent || undefined
  }

  return { selection: sel }
}
