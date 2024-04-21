import * as vscode from "vscode"
import Parser from "web-tree-sitter"
import * as U from "./utils"
import * as AST from "./ast"

export type Command = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => vscode.Selection | undefined

class GlobalSelectionStackByDoc {
  private state = new Map<vscode.TextDocument, vscode.Selection[]>()

  push = (doc: vscode.TextDocument, selection: vscode.Selection) => {
    const prev = this.state.get(doc) || []
    if (selection.isEmpty) {
      this.state.set(doc, [])
    } else {
      this.state.set(doc, [...prev, selection])
    }
  }

  pop = (doc: vscode.TextDocument) => {
    const stack = this.state.get(doc)
    if (!stack || stack.length === 0) {
      return
    }

    const last = stack[stack.length - 1]
    stack.pop()
    return last
  }
}

const globalSelectionStack = new GlobalSelectionStackByDoc()

export const ExpandSelection = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  if (selection.isEmpty) {
    selection = U.moveSelectionToFirstNonWhitespace(doc, selection)
  }

  const path = AST.pathOfSmallestNodeContainingSelection(
    tree.rootNode,
    selection,
  )
  path.reverse()
  const node = path.find((n) => !selection.isEqual(U.parserNode2Selection(n)))

  if (!node) {
    return
  }

  globalSelectionStack.push(doc, selection)

  return U.parserNode2Selection(node)
}

export const ContractSelection = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  return globalSelectionStack.pop(doc)
}

export const SelectTopLevel = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  const cursorPath = AST.pathOfSmallestNodeContainingSelection(
    tree.rootNode,
    selection,
  )

  if (cursorPath.length < 2) {
    return
  }
  return U.parserNode2Selection(cursorPath[1])
}

const GrowShrinkAtSides = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
  side: "beginning" | "end",
  action: "grow" | "shrink",
): vscode.Selection | undefined => {
  const pathOfSideChar = AST.pathOfSmallestNodeContainingSelection(
    tree.rootNode,
    side === "beginning"
      ? U.selectFirstChar(selection)
      : U.selectLastChar(selection),
  )

  // biggest node in path contained by selection
  const node = pathOfSideChar.find((n) =>
    selection.contains(U.parserNode2Selection(n)),
  )

  if (side === "beginning" && action === "grow") {
    if (selection.isEmpty) {
      const p = AST.pathOfSmallestNodeContainingSelection(
        tree.rootNode,
        U.selectFirstChar(U.moveSelectionToFirstNonWhitespace(doc, selection)),
      )
      const n = p[p.length - 1]
      if (!n?.previousNamedSibling) {
        return
      }
      return U.invert(U.parserNode2Selection(n.previousNamedSibling))
    }

    if (node?.previousNamedSibling) {
      return new vscode.Selection(
        selection.end,
        U.parserNode2Selection(node.previousNamedSibling).start,
      )
    }
  } else if (
    side === "beginning" &&
    action === "shrink" &&
    node?.nextNamedSibling
  ) {
    if (selection.isEqual(U.parserNode2Selection(node))) {
      return U.emptySelection(selection.end)
    }
    return new vscode.Selection(
      selection.end,
      U.parserNode2Selection(node.nextNamedSibling).start,
    )
  } else if (side === "end" && action === "grow") {
    if (selection.isEmpty) {
      return ExpandSelection(doc, selection, tree)
    }

    if (node?.nextNamedSibling) {
      return new vscode.Selection(
        selection.start,
        U.parserNode2Selection(node.nextNamedSibling).end,
      )
    }
  } else if (
    side === "end" &&
    action === "shrink" &&
    node?.previousNamedSibling
  ) {
    if (selection.isEqual(U.parserNode2Selection(node))) {
      return U.emptySelection(selection.start)
    }

    return new vscode.Selection(
      selection.start,
      U.parserNode2Selection(node.previousNamedSibling).end,
    )
  }
}

export const GrowSelectionAtEnd = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  return GrowShrinkAtSides(doc, selection, tree, "end", "grow")
}

export const ShrinkSelectionAtEnd = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  return GrowShrinkAtSides(doc, selection, tree, "end", "shrink")
}

export const GrowSelectionAtBeginning = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  return GrowShrinkAtSides(doc, selection, tree, "beginning", "grow")
}

export const ShrinkSelectionAtBeginning = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  return GrowShrinkAtSides(doc, selection, tree, "beginning", "shrink")
}

export const GrowOrShrinkSelectionFocusLeft = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  if (selection.isReversed) {
    return GrowShrinkAtSides(doc, selection, tree, "beginning", "grow")
  } else {
    return GrowShrinkAtSides(doc, selection, tree, "end", "shrink")
  }
}

export const GrowOrShrinkSelectionFocusRight = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  if (selection.isReversed && !selection.isEmpty) {
    return GrowShrinkAtSides(doc, selection, tree, "beginning", "shrink")
  } else {
    return GrowShrinkAtSides(doc, selection, tree, "end", "grow")
  }
}

export const MoveCursorRight = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  const path = AST.pathOfSmallestNodeContainingSelection(
    tree.rootNode,
    selection,
  )

  if (path.length < 1) {
    return
  }

  const sibling = path[path.length - 1].nextNamedSibling
  if (!sibling) {
    return
  }
  return U.emptySelection(U.parserNode2Selection(sibling).start)
}

export const MoveCursorLeft = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  const path = AST.pathOfSmallestNodeContainingSelection(
    tree.rootNode,
    selection,
  )

  if (path.length < 1) {
    return
  }

  const sibling = path[path.length - 1].previousNamedSibling
  if (!sibling) {
    return
  }
  return U.emptySelection(U.parserNode2Selection(sibling).start)
}
