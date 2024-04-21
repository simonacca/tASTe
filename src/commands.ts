import * as vscode from "vscode"
import Parser from "web-tree-sitter"
import {
  makeSelectionOfSize,
  movePositionChar,
  parserNode2Selection,
} from "./utils"
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

const moveSelectionToFirstNonWhitespace = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
) => {
  const line = doc.lineAt(selection.start)
  if (line.firstNonWhitespaceCharacterIndex > selection.start.character) {
    return new vscode.Selection(
      new vscode.Position(
        line.lineNumber,
        line.firstNonWhitespaceCharacterIndex,
      ),
      new vscode.Position(
        line.lineNumber,
        line.firstNonWhitespaceCharacterIndex,
      ),
    )
  } else {
    return selection
  }
}

export const ExpandSelection = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  if (selection.isEmpty) {
    selection = moveSelectionToFirstNonWhitespace(doc, selection)
  }

  const path = AST.pathOfSmallestNodeContainingSelection(
    tree.rootNode,
    selection,
  )
  path.reverse()
  const node = path.find((n) => !selection.isEqual(parserNode2Selection(n)))

  if (!node) {
    return
  }

  globalSelectionStack.push(doc, selection)

  return parserNode2Selection(node)
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
  return parserNode2Selection(cursorPath[1])
}

const selectFirstChar = (s: vscode.Selection) => makeSelectionOfSize(s.start, 1)
const selectLastChar = (s: vscode.Selection) =>
  makeSelectionOfSize(movePositionChar(s.end, -1), 1)

export const GrowShrinkAtSides = (
  selection: vscode.Selection,
  tree: Parser.Tree,
  side: "beginning" | "end",
  action: "grow" | "shrink",
) => {
  const pathOfSideChar = AST.pathOfSmallestNodeContainingSelection(
    tree.rootNode,
    side === "beginning"
      ? selectFirstChar(selection)
      : selectLastChar(selection),
  )

  // biggest node in path contained by selection
  const node = pathOfSideChar.find((n) =>
    selection.contains(parserNode2Selection(n)),
  )

  if (!node) {
    return
  }

  if (side === "beginning" && action === "grow" && node.previousNamedSibling) {
    return new vscode.Selection(
      parserNode2Selection(node.previousNamedSibling).start,
      selection.end,
    )
  } else if (
    side === "beginning" &&
    action === "shrink" &&
    node.nextNamedSibling
  ) {
    return new vscode.Selection(
      parserNode2Selection(node.nextNamedSibling).start,
      selection.end,
    )
  } else if (side === "end" && action === "grow" && node.nextNamedSibling) {
    return new vscode.Selection(
      selection.start,
      parserNode2Selection(node.nextNamedSibling).end,
    )
  } else if (
    side === "end" &&
    action === "shrink" &&
    node.previousNamedSibling
  ) {
    return new vscode.Selection(
      selection.start,
      parserNode2Selection(node.previousNamedSibling).end,
    )
  }
}

export const GrowSelectionAtEnd = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  if (selection.isEmpty) {
    return ExpandSelection(doc, selection, tree)
  }
  return GrowShrinkAtSides(selection, tree, "end", "grow")
}

export const ShrinkSelectionAtEnd = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  return GrowShrinkAtSides(selection, tree, "end", "shrink")
}

export const GrowSelectionAtBeginning = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  return GrowShrinkAtSides(selection, tree, "beginning", "grow")
}

export const ShrinkSelectionAtBeginning = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  return GrowShrinkAtSides(selection, tree, "beginning", "shrink")
}

export const GrowOrShrinkSelectionFocusLeft = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  if (selection.isReversed) {
    return GrowShrinkAtSides(selection, tree, "beginning", "grow")
  } else {
    return GrowShrinkAtSides(selection, tree, "end", "shrink")
  }
}

export const GrowOrShrinkSelectionFocusRight = (
  doc: vscode.TextDocument,
  selection: vscode.Selection,
  tree: Parser.Tree,
) => {
  if (selection.isReversed) {
    return GrowShrinkAtSides(selection, tree, "beginning", "shrink")
  } else {
    return GrowShrinkAtSides(selection, tree, "end", "grow")
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
  return makeSelectionOfSize(parserNode2Selection(sibling).start, 0)
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
  return makeSelectionOfSize(parserNode2Selection(sibling).start, 0)
}
