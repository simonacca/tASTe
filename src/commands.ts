import { TextDocument, Selection } from "vscode"
import Parser from "web-tree-sitter"
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

    const last = stack[stack.length - 1]
    stack.pop()
    return last
  }
}

const globalSelectionStack = new SelectionStackByDoc()

export const ExpandSelection = (doc: TextDocument, sel: Selection, tree: Parser.Tree) => {
  if (sel.isEmpty) {
    sel = U.moveSelectionToFirstNonWhitespace(doc, sel)
  }

  const path = AST.pathOfSmallestNodeContainingSelection(tree.rootNode, sel)
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
  const cursorPath = AST.pathOfSmallestNodeContainingSelection(tree.rootNode, sel)

  if (cursorPath.length < 2) {
    return
  }
  return U.parserNode2Selection(cursorPath[1])
}

const GrowShrinkAtSides = (
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
  side: "beginning" | "end",
  action: "grow" | "shrink",
): Selection | undefined => {
  const pathOfSideChar = AST.pathOfSmallestNodeContainingSelection(
    tree.rootNode,
    side === "beginning" ? U.selectFirstChar(sel) : U.selectLastChar(sel),
  )

  // biggest node in path contained by selection
  const node = pathOfSideChar.find((n) => sel.contains(U.parserNode2Selection(n)))

  if (side === "beginning" && action === "grow") {
    if (sel.isEmpty) {
      const p = AST.pathOfSmallestNodeContainingSelection(
        tree.rootNode,
        U.selectFirstChar(U.moveSelectionToFirstNonWhitespace(doc, sel)),
      )
      const n = p[p.length - 1]
      if (!n?.previousNamedSibling) {
        return
      }
      return U.invert(U.parserNode2Selection(n.previousNamedSibling))
    }

    if (node?.previousNamedSibling) {
      return new Selection(sel.end, U.parserNode2Selection(node.previousNamedSibling).start)
    }
  } else if (side === "beginning" && action === "shrink" && node?.nextNamedSibling) {
    if (sel.isEqual(U.parserNode2Selection(node))) {
      return U.emptySelection(sel.end)
    }
    return new Selection(sel.end, U.parserNode2Selection(node.nextNamedSibling).start)
  } else if (side === "end" && action === "grow") {
    if (sel.isEmpty) {
      return ExpandSelection(doc, sel, tree)
    }

    if (node?.nextNamedSibling) {
      return new Selection(sel.start, U.parserNode2Selection(node.nextNamedSibling).end)
    }
  } else if (side === "end" && action === "shrink" && node?.previousNamedSibling) {
    if (sel.isEqual(U.parserNode2Selection(node))) {
      return U.emptySelection(sel.start)
    }

    return new Selection(sel.start, U.parserNode2Selection(node.previousNamedSibling).end)
  }
}

export const GrowSelectionAtEnd = (doc: TextDocument, sel: Selection, tree: Parser.Tree) => {
  return GrowShrinkAtSides(doc, sel, tree, "end", "grow")
}

export const ShrinkSelectionAtEnd = (
  doc: TextDocument,
  selection: Selection,
  tree: Parser.Tree,
) => {
  return GrowShrinkAtSides(doc, selection, tree, "end", "shrink")
}

export const GrowSelectionAtBeginning = (doc: TextDocument, sel: Selection, tree: Parser.Tree) => {
  return GrowShrinkAtSides(doc, sel, tree, "beginning", "grow")
}

export const ShrinkSelectionAtBeginning = (
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
) => {
  return GrowShrinkAtSides(doc, sel, tree, "beginning", "shrink")
}

export const GrowOrShrinkSelectionFocusLeft = (
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
) => {
  if (sel.isReversed) {
    return GrowShrinkAtSides(doc, sel, tree, "beginning", "grow")
  } else {
    return GrowShrinkAtSides(doc, sel, tree, "end", "shrink")
  }
}

export const GrowOrShrinkSelectionFocusRight = (
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
) => {
  if (sel.isReversed && !sel.isEmpty) {
    return GrowShrinkAtSides(doc, sel, tree, "beginning", "shrink")
  } else {
    return GrowShrinkAtSides(doc, sel, tree, "end", "grow")
  }
}

export const MoveCursorRight = (doc: TextDocument, sel: Selection, tree: Parser.Tree) => {
  const path = AST.pathOfSmallestNodeContainingSelection(tree.rootNode, sel)

  if (path.length < 1) {
    return
  }

  const sibling = path[path.length - 1].nextNamedSibling
  if (!sibling) {
    return
  }
  return U.emptySelection(U.parserNode2Selection(sibling).start)
}

export const MoveCursorLeft = (doc: TextDocument, sel: Selection, tree: Parser.Tree) => {
  const path = AST.pathOfSmallestNodeContainingSelection(tree.rootNode, sel)

  if (path.length < 1) {
    return
  }

  const sibling = path[path.length - 1].previousNamedSibling
  if (!sibling) {
    return
  }
  return U.emptySelection(U.parserNode2Selection(sibling).start)
}
