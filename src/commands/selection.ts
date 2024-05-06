import { TextDocument, Selection, TextEditor } from "vscode"
import Parser, { SyntaxNode } from "web-tree-sitter"
import * as vsUtils from "../utils/vscode"
import * as tsUtils from "../utils/tree_sitter"
import { CommandRet, globalSelectionStack } from "./common"

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

const growFromLeft = (sel: Selection, node: SyntaxNode) => {
  if (!node.previousNamedSibling) {
    return
  }
  return new Selection(tsUtils.SyntaxNode2Selection(node.previousNamedSibling).start, sel.end)
}
const growFromRight = (sel: Selection, node: SyntaxNode) => {
  if (!node.nextNamedSibling) {
    return
  }
  return new Selection(sel.start, tsUtils.SyntaxNode2Selection(node.nextNamedSibling).end)
}
const shrinkFromLeft = (sel: Selection, node: SyntaxNode) => {
  if (sel.end.isEqual(tsUtils.SyntaxNode2Selection(node).end) || !node.nextNamedSibling) {
    return vsUtils.emptySelection(sel.end)
  } else {
    return new Selection(tsUtils.SyntaxNode2Selection(node.nextNamedSibling).start, sel.end)
  }
}
const shrinkFromRight = (sel: Selection, node: SyntaxNode) => {
  if (sel.start.isEqual(tsUtils.SyntaxNode2Selection(node).start) || !node.previousNamedSibling) {
    return vsUtils.emptySelection(sel.start)
  } else {
    return new Selection(sel.start, tsUtils.SyntaxNode2Selection(node.previousNamedSibling).end)
  }
}

const GrowShrink = (
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
  side: "start" | "end" | "active" | "anchor",
  direction: "left" | "right",
): CommandRet => {
  if (sel.isEmpty) {
    const node = tsUtils.SmallestNodeEnclosingSel(
      tree.rootNode,
      vsUtils.selectCharAfter(vsUtils.moveSelectionToFirstNonWhitespace(doc, sel).start),
    )
    if (!node) {
      return
    }

    if (direction === "right" && node) {
      return { selection: tsUtils.SyntaxNode2Selection(node) }
    } else if (direction === "left" && node.previousNamedSibling) {
      return {
        selection: new Selection(
          sel.end,
          tsUtils.SyntaxNode2Selection(node.previousNamedSibling).start,
        ),
      }
    }
  }

  const edgeChar = ((): Selection => {
    switch (side) {
      case "start": {
        return vsUtils.selectCharAfter(sel.start)
      }
      case "end": {
        return vsUtils.selectCharBefore(sel.end)
      }
      case "anchor": {
        if (sel.isReversed) {
          return vsUtils.selectCharBefore(sel.anchor)
        } else {
          return vsUtils.selectCharAfter(sel.anchor)
        }
      }
      case "active":
        {
          if (sel.isReversed) {
            return vsUtils.selectCharAfter(sel.active)
          } else {
            return vsUtils.selectCharBefore(sel.active)
          }
        }
        throw new Error("Case not handled")
    }
  })()

  if (!edgeChar) {
    return
  }

  // here we cannot just use `sel`, it doesn't work in case sel comprises
  // of more than 1 element out of a sequence. for example: [<IS><FS>f(1),f(2)<IE>,f(3)<FE>,f(4)]
  // we cannot use edgeChar either because, as in the example above, it might select
  // something that is not directly an element of the sequence of interest.
  // instead, we want to find the biggest syntax node that includes the last character of the selection
  // and that is fully enclosed by the selection

  let edgeNode = tsUtils.biggestNodeContaining(tree, sel, edgeChar)
  if (!edgeNode) {
    return
  }

  const newSel = (() => {
    if (side === "start" && direction === "left") {
      return growFromLeft(sel, edgeNode)
    } else if (side === "start" && direction === "right") {
      return shrinkFromLeft(sel, edgeNode)
    } else if (side === "end" && direction === "left") {
      return shrinkFromRight(sel, edgeNode)
    } else if (side === "end" && direction === "right") {
      return growFromRight(sel, edgeNode)
    } else if (side === "active" && !sel.isReversed && direction === "right") {
      return growFromRight(sel, edgeNode)
    } else if (side === "active" && sel.isReversed && direction === "left") {
      return growFromLeft(sel, edgeNode)
    } else if (side === "active" && sel.isReversed && direction === "right") {
      return shrinkFromLeft(sel, edgeNode)
    } else if (side === "active" && !sel.isReversed && direction === "left") {
      return shrinkFromRight(sel, edgeNode)
    } else if (side === "anchor" && !sel.isReversed && direction === "right") {
      return shrinkFromLeft(sel, edgeNode)
    } else if (side === "anchor" && sel.isReversed && direction === "left") {
      return shrinkFromRight(sel, edgeNode)
    } else if (side === "anchor" && sel.isReversed && direction === "right") {
      return growFromRight(sel, edgeNode)
    } else if (side === "anchor" && !sel.isReversed && direction === "left") {
      return growFromLeft(sel, edgeNode)
    }

    throw new Error("case not handled")
  })()

  if (!newSel) {
    return
  }
  return { selection: sel.isReversed ? vsUtils.reverse(newSel) : newSel }
}

export const GrowSelectionAtEnd = (
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  return GrowShrink(doc, sel, tree, "end", "right")
}

export const ShrinkSelectionAtEnd = (
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  return GrowShrink(doc, sel, tree, "end", "left")
}

export const GrowSelectionAtStart = (
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  return GrowShrink(doc, sel, tree, "start", "left")
}

export const ShrinkSelectionAtStart = (
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  return GrowShrink(doc, sel, tree, "start", "right")
}

export const SelectForward = (doc: TextDocument, sel: Selection, tree: Parser.Tree): CommandRet => {
  return GrowShrink(doc, sel, tree, "active", "right")
}

export const SelectBackward = (
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  return GrowShrink(doc, sel, tree, "active", "left")
}

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
