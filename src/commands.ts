import { TextDocument, Selection, TextEditor, window } from "vscode"
import Parser, { SyntaxNode } from "web-tree-sitter"
import * as U from "./utils"
import * as AST from "./ast"

export type Command = (
  doc: TextDocument,
  selection: Selection,
  tree: Parser.Tree,
) => Selection | undefined | void

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
  let node: SyntaxNode | undefined | null = undefined
  if (sel.isEmpty) {
    sel = U.moveSelectionToFirstNonWhitespace(doc, sel)
    node = AST.Sel(tree.rootNode, sel)
  } else {
    node = AST.Sel(tree.rootNode, sel)?.parent
  }

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
  let node = AST.Sel(tree.rootNode, sel)
  if (!node) {
    return
  }

  while (node.parent?.parent) {
    node = node?.parent
  }

  return U.parserNode2Selection(node)
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
    const node = AST.Sel(
      tree.rootNode,
      U.selectCharAfter(U.moveSelectionToFirstNonWhitespace(doc, sel).start),
    )
    if (!node) {
      return
    }

    if (direction === "right" && node) {
      return U.parserNode2Selection(node)
    } else if (direction === "left" && node.previousNamedSibling) {
      return new Selection(sel.end, U.parserNode2Selection(node.previousNamedSibling).start)
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
  const node = AST.Sel(tree.rootNode, sel)

  if (!node) {
    return
  }

  const sibling = node.nextNamedSibling
  if (!sibling) {
    return
  }
  return U.emptySelection(U.parserNode2Selection(sibling).start)
}

export const MoveCursorBackward = (doc: TextDocument, sel: Selection, tree: Parser.Tree) => {
  const node = AST.Sel(tree.rootNode, sel)

  if (!node) {
    return
  }

  const sibling = node.previousNamedSibling
  if (!sibling) {
    return
  }
  return U.emptySelection(U.parserNode2Selection(sibling).start)
}

export const Raise = (doc: TextDocument, sel: Selection, tree: Parser.Tree) => {
  const node = AST.Sel(tree.rootNode, sel)
  const parent = node?.parent

  if (!node || !parent) {
    return
  }

  window.activeTextEditor?.edit((editBuilder) => {
    editBuilder.replace(U.parserNode2Selection(parent), node.text)
  })
}

export const SwapForward = (doc: TextDocument, sel: Selection, tree: Parser.Tree) => {
  const node = AST.Sel(tree.rootNode, sel)
  const sibling = node?.nextNamedSibling

  if (!node || !sibling) {
    return
  }

  const siblingText = sibling.text

  window.activeTextEditor?.edit((editBuilder) => {
    editBuilder.replace(U.parserNode2Selection(sibling), node.text)
    editBuilder.replace(U.parserNode2Selection(node), siblingText)
  })
}

export const SwapBackward = (doc: TextDocument, sel: Selection, tree: Parser.Tree) => {
  const node = AST.Sel(tree.rootNode, sel)
  const sibling = node?.previousNamedSibling

  if (!node || !sibling) {
    return
  }

  const nodeText = node.text

  window.activeTextEditor?.edit((editBuilder) => {
    editBuilder.replace(U.parserNode2Selection(node), sibling.text)
    editBuilder.replace(U.parserNode2Selection(sibling), nodeText)
  })
}
