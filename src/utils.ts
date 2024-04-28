import { SyntaxNode } from "web-tree-sitter"
import { Selection, Position, TextDocument, Range } from "vscode"

/**
 * Last element of an array
 */
export function last<T>(a: T[]): T | undefined {
  if (a.length > 0) {
    return a[a.length - 1]
  }
}

/**
 * First element of array for which fn produces a value, as well as the produced value
 */
export function find<T, R>(array: T[], fn: (i: T) => R | undefined): [T, R] | [] {
  for (const item of array) {
    const res = fn(item)
    if (res) {
      return [item, res]
    }
  }
  return []
}

/**
 * Checks if two Syntax nodes refer to the same region of text
 */
export const areSyntaxNodesSameSelection = (a: SyntaxNode, b: SyntaxNode): boolean => {
  return a.startIndex === b.startIndex && a.endIndex === b.endIndex
}

/**
 * Converts a tree-sitter node to a vscode selection
 */
export const SyntaxNode2Selection = (node: SyntaxNode) => {
  return new Selection(
    new Position(node.startPosition.row, node.startPosition.column),
    new Position(node.endPosition.row, node.endPosition.column),
  )
}

/**
 * Reverses direction of a Selection
 */
export const reverse = (selection: Selection) => {
  return new Selection(selection.end, selection.start)
}

/**
 * Moves position by `amount` to the right
 */
export const movePositionChar = (pos: Position, amount: number) => {
  return new Position(pos.line, pos.character + amount)
}

/**
 * Makes a selection that starts at `pos` and ends `size` chars later
 */
export const makeSelectionOfSize = (pos: Position, size: number) => {
  return new Selection(pos, movePositionChar(pos, size))
}

/**
 * Makes an empty selection starting at `pos`
 */
export const emptySelection = (pos: Position) => makeSelectionOfSize(pos, 0)

export const selectCharAfter = (p: Position) => makeSelectionOfSize(p, 1)
export const selectCharBefore = (p: Position) => makeSelectionOfSize(movePositionChar(p, -1), 1)

// line.firstNonWhitespaceCharacterIndex is unreliable
const firstNonWhitespaceIdx = (s: string) => s.search(/\S|$/)
const isWhitespaceString = (s: string) => !s.replace(/\s/g, "").length

/**
 * When selection is collapsed and occurs before any non-whitespace char
 *  moves it to an empty selection just before the first non-whitespace char.
 * Skips lines until it finds a non-whitespace char if necessary.
 */
export const moveSelectionToFirstNonWhitespace = (
  doc: TextDocument,
  selection: Selection,
): Selection => {
  if (!selection.isEmpty) {
    return selection
  }

  let startPos = selection.start
  while (true) {
    if (!doc.validatePosition(startPos)) {
      return selection
    }

    const line = doc.lineAt(startPos)
    // line.firstNonWhitespaceCharacterIndex is unreliable
    const firstNonWhitespace = firstNonWhitespaceIdx(line.text)
    const nextLineStart = new Position(startPos.line + 1, 0)

    if (firstNonWhitespace === line.text.length) {
      startPos = nextLineStart
      continue
    }

    if (firstNonWhitespace > startPos.character) {
      return emptySelection(new Position(line.lineNumber, firstNonWhitespace))
    }

    if (isWhitespaceString(doc.getText(new Range(startPos, line.range.end)))) {
      startPos = nextLineStart
      continue
    } else {
      return selection
    }
  }
}
