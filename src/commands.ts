import { TextDocument, Selection } from "vscode"
import Parser, { SyntaxNode } from "web-tree-sitter"
import * as U from "./utils"
import * as AST from "./ast"

export type Command = (
  doc: TextDocument,
  selection: Selection,
  tree: Parser.Tree,
) => Selection | undefined

class SelectionStackByDoc {
  private state = new Map<TextDocument, Selection[]>()

  push = (doc: TextDocument, selection: Selection) => {
    const prev = this.state.get(doc) || []
    if (selection.isEmpty) {
      this.state.set(doc, [])
    } else {
      this.state.set(doc, [...prev, selection])
    }
  }

  pop = (doc: TextDocument) => {
    const stack = this.state.get(doc)
    if (!stack || stack.length === 0) {
      return
    }

    return stack.pop()
  }
}

const globalSelectionStack = new SelectionStackByDoc()

export const ExpandSelection = (doc: TextDocument, sel: Selection, tree: Parser.Tree) => {
  if (sel.isEmpty) {
    sel = U.moveSelectionToFirstNonWhitespace(doc, sel)
  }

  const path = AST.path2Sel(tree.rootNode, sel)
  path.reverse()
  const node = path.find((n) => !sel.isEqual(U.parserNode2Selection(n)))

  if (!node) {
    return
  }

  globalSelectionStack.push(doc, sel)

  return U.parserNode2Selection(node)
}

export const ContractSelection = (doc: TextDocument, sel: Selection, tree: Parser.Tree) => {
  return globalSelectionStack.pop(doc)
}

export const SelectTopLevel = (doc: TextDocument, sel: Selection, tree: Parser.Tree) => {
  const cursorPath = AST.path2Sel(tree.rootNode, sel)

  if (cursorPath.length < 2) {
    return
  }
  return U.parserNode2Selection(cursorPath[1])
}

const growFromLeft = (sel: Selection, node: SyntaxNode) => {
  if (!node.previousNamedSibling) {
    return
  }
  return new Selection(U.parserNode2Selection(node.previousNamedSibling).start, sel.end)
}
const growFromRight = (sel: Selection, node: SyntaxNode) => {
  if (!node.nextNamedSibling) {
    return
  }
  return new Selection(sel.start, U.parserNode2Selection(node.nextNamedSibling).end)
}
const shrinkFromLeft = (sel: Selection, node: SyntaxNode) => {
  if (sel.end.isEqual(U.parserNode2Selection(node).end) || !node.nextNamedSibling) {
    return U.emptySelection(sel.end)
  } else {
    return new Selection(U.parserNode2Selection(node.nextNamedSibling).start, sel.end)
  }
}
const shrinkFromRight = (sel: Selection, node: SyntaxNode) => {
  if (sel.start.isEqual(U.parserNode2Selection(node).start) || !node.previousNamedSibling) {
    return U.emptySelection(sel.start)
  } else {
    return new Selection(sel.start, U.parserNode2Selection(node.previousNamedSibling).end)
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
    const path = AST.path2Sel(
      tree.rootNode,
      U.selectCharAfter(U.moveSelectionToFirstNonWhitespace(doc, sel).start),
    )
    let node = U.last(path)
    if (!node) {
      return
    }
    if (direction === "left") {
      if (!node.previousNamedSibling) {
        return
      }
      node = node.previousNamedSibling
    }
    const newSel = U.parserNode2Selection(node)
    return direction === "right" ? newSel : U.reverse(newSel)
  }

  const sideCharSel = (() => {
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

  const path = AST.path2Sel(tree.rootNode, sideCharSel)
  const node = U.last(path)
  if (!node) {
    return
  }

  const newSel = (() => {
    if (side === "start" && direction === "left") {
      return growFromLeft(sel, node)
    } else if (side === "start" && direction === "right") {
      return shrinkFromLeft(sel, node)
    } else if (side === "end" && direction === "left") {
      return shrinkFromRight(sel, node)
    } else if (side === "end" && direction === "right") {
      return growFromRight(sel, node)
    } else if (side === "active" && !sel.isReversed && direction === "right") {
      return growFromRight(sel, node)
    } else if (side === "active" && sel.isReversed && direction === "left") {
      return growFromLeft(sel, node)
    } else if (side === "active" && sel.isReversed && direction === "right") {
      return shrinkFromLeft(sel, node)
    } else if (side === "active" && !sel.isReversed && direction === "left") {
      return shrinkFromRight(sel, node)
    } else if (side === "anchor" && !sel.isReversed && direction === "right") {
      return shrinkFromLeft(sel, node)
    } else if (side === "anchor" && sel.isReversed && direction === "left") {
      return shrinkFromRight(sel, node)
    } else if (side === "anchor" && sel.isReversed && direction === "right") {
      return growFromRight(sel, node)
    } else if (side === "anchor" && !sel.isReversed && direction === "left") {
      return growFromLeft(sel, node)
    }

    throw new Error("case not handled")
  })()

  if (!newSel) {
    return
  }
  return sel.isReversed ? U.reverse(newSel) : newSel
}

export const GrowSelectionAtEnd = (doc: TextDocument, sel: Selection, tree: Parser.Tree) => {
  return GrowShrink(doc, sel, tree, "end", "right")
}

export const ShrinkSelectionAtEnd = (doc: TextDocument, sel: Selection, tree: Parser.Tree) => {
  return GrowShrink(doc, sel, tree, "end", "left")
}

export const GrowSelectionAtStart = (doc: TextDocument, sel: Selection, tree: Parser.Tree) => {
  return GrowShrink(doc, sel, tree, "start", "left")
}

export const ShrinkSelectionAtStart = (doc: TextDocument, sel: Selection, tree: Parser.Tree) => {
  return GrowShrink(doc, sel, tree, "start", "right")
}

export const SelectForward = (doc: TextDocument, sel: Selection, tree: Parser.Tree) => {
  return GrowShrink(doc, sel, tree, "active", "right")
}

export const SelectBackward = (doc: TextDocument, sel: Selection, tree: Parser.Tree) => {
  return GrowShrink(doc, sel, tree, "active", "left")
}

export const MoveCursorForward = (doc: TextDocument, sel: Selection, tree: Parser.Tree) => {
  const path = AST.path2Sel(tree.rootNode, sel)

  if (path.length < 1) {
    return
  }

  const sibling = path[path.length - 1].nextNamedSibling
  if (!sibling) {
    return
  }
  return U.emptySelection(U.parserNode2Selection(sibling).start)
}

export const MoveCursorBackward = (doc: TextDocument, sel: Selection, tree: Parser.Tree) => {
  const path = AST.path2Sel(tree.rootNode, sel)

  const node = U.last(path)
  if (!node) {
    return
  }

  const sibling = node.previousNamedSibling
  if (!sibling) {
    return
  }
  return U.emptySelection(U.parserNode2Selection(sibling).start)
}
