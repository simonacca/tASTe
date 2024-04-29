import { TextDocument, Selection, TextEditor } from "vscode"
import Parser, { SyntaxNode } from "web-tree-sitter"
import * as U from "./utils"
import * as AST from "./ast"
import { CommandRet, globalSelectionStack } from "./commands"

export const ExpandSelection = (
  _: TextEditor,
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  let parent: SyntaxNode | undefined | null = undefined
  if (sel.isEmpty) {
    sel = U.moveSelectionToFirstNonWhitespace(doc, sel)
    parent = AST.Sel(tree.rootNode, sel)
  } else {
    const node = AST.Sel(tree.rootNode, sel)
    if (!node) {
      return
    }

    if (U.SyntaxNode2Selection(node).isEqual(sel)) {
      // in this case sel covers exactly one syntax node, so we jump to its parent
      parent = AST.enclosingParent(node)
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

  return U.SyntaxNode2Selection(parent)
}

export const ContractSelection = (
  _: TextEditor,
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  return globalSelectionStack.pop(doc)
}

export const SelectTopLevel = (
  _: TextEditor,
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  let node = AST.Sel(tree.rootNode, sel)
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

  return U.SyntaxNode2Selection(node)
}

const growFromLeft = (sel: Selection, node: SyntaxNode) => {
  if (!node.previousNamedSibling) {
    return
  }
  return new Selection(U.SyntaxNode2Selection(node.previousNamedSibling).start, sel.end)
}
const growFromRight = (sel: Selection, node: SyntaxNode) => {
  if (!node.nextNamedSibling) {
    return
  }
  return new Selection(sel.start, U.SyntaxNode2Selection(node.nextNamedSibling).end)
}
const shrinkFromLeft = (sel: Selection, node: SyntaxNode) => {
  if (sel.end.isEqual(U.SyntaxNode2Selection(node).end) || !node.nextNamedSibling) {
    return U.emptySelection(sel.end)
  } else {
    return new Selection(U.SyntaxNode2Selection(node.nextNamedSibling).start, sel.end)
  }
}
const shrinkFromRight = (sel: Selection, node: SyntaxNode) => {
  if (sel.start.isEqual(U.SyntaxNode2Selection(node).start) || !node.previousNamedSibling) {
    return U.emptySelection(sel.start)
  } else {
    return new Selection(sel.start, U.SyntaxNode2Selection(node.previousNamedSibling).end)
  }
}

const GrowShrink = (
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
  side: "start" | "end" | "active" | "anchor",
  direction: "left" | "right",
): Selection | undefined => {
  if (sel.isEmpty) {
    const node = AST.Sel(
      tree.rootNode,
      U.selectCharAfter(U.moveSelectionToFirstNonWhitespace(doc, sel).start),
    )
    if (!node) {
      return
    }

    if (direction === "right" && node) {
      return U.SyntaxNode2Selection(node)
    } else if (direction === "left" && node.previousNamedSibling) {
      return new Selection(sel.end, U.SyntaxNode2Selection(node.previousNamedSibling).start)
    }
  }

  const edgeChar = ((): Selection => {
    switch (side) {
      case "start": {
        return U.selectCharAfter(sel.start)
      }
      case "end": {
        return U.selectCharBefore(sel.end)
      }
      case "anchor": {
        if (sel.isReversed) {
          return U.selectCharBefore(sel.anchor)
        } else {
          return U.selectCharAfter(sel.anchor)
        }
      }
      case "active":
        {
          if (sel.isReversed) {
            return U.selectCharAfter(sel.active)
          } else {
            return U.selectCharBefore(sel.active)
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

  let edgeNode = AST.biggestNodeContaining(tree, sel, edgeChar)
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
  return sel.isReversed ? U.reverse(newSel) : newSel
}

export const GrowSelectionAtEnd = (
  _: TextEditor,
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  return GrowShrink(doc, sel, tree, "end", "right")
}

export const ShrinkSelectionAtEnd = (
  _: TextEditor,
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  return GrowShrink(doc, sel, tree, "end", "left")
}

export const GrowSelectionAtStart = (
  _: TextEditor,
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  return GrowShrink(doc, sel, tree, "start", "left")
}

export const ShrinkSelectionAtStart = (
  _: TextEditor,
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  return GrowShrink(doc, sel, tree, "start", "right")
}

export const SelectForward = (
  _: TextEditor,
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  return GrowShrink(doc, sel, tree, "active", "right")
}

export const SelectBackward = (
  _: TextEditor,
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  return GrowShrink(doc, sel, tree, "active", "left")
}

export const MoveCursorForward = (
  _: TextEditor,
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  sel = U.moveSelectionToFirstNonWhitespace(doc, sel)
  const node = AST.Sel(tree.rootNode, sel)

  if (!node) {
    return
  }

  const sibling = node.nextNamedSibling
  if (!sibling) {
    return
  }
  return U.emptySelection(U.SyntaxNode2Selection(sibling).start)
}

export const MoveCursorBackward = (
  _: TextEditor,
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  const node = AST.Sel(tree.rootNode, sel)

  if (!node) {
    return
  }

  const sibling = node.previousNamedSibling
  if (!sibling) {
    return
  }
  return U.emptySelection(U.SyntaxNode2Selection(sibling).start)
}