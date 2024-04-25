import { SyntaxNode } from "web-tree-sitter"
import { Selection, Position, TextDocument } from "vscode"

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

export const areSyntaxNodesSameSelection = (a: SyntaxNode, b: SyntaxNode): boolean => {
  return a.startIndex === b.startIndex && a.endIndex === b.endIndex
}

export const parserNode2Selection = (node: SyntaxNode) => {
  return new Selection(
    new Position(node.startPosition.row, node.startPosition.column),
    new Position(node.endPosition.row, node.endPosition.column),
  )
}

export const reverse = (selection: Selection) => {
  return new Selection(selection.end, selection.start)
}

export const movePositionChar = (pos: Position, amount: number) => {
  return new Position(pos.line, pos.character + amount)
}

export const makeSelectionOfSize = (pos: Position, size: number) => {
  return new Selection(pos, movePositionChar(pos, size))
}

export const emptySelection = (pos: Position) => makeSelectionOfSize(pos, 0)

export const selectCharAfter = (p: Position) => makeSelectionOfSize(p, 1)
export const selectCharBefore = (p: Position) => makeSelectionOfSize(movePositionChar(p, -1), 1)

export const moveSelectionToFirstNonWhitespace = (doc: TextDocument, selection: Selection) => {
  const line = doc.lineAt(selection.start)
  if (line.firstNonWhitespaceCharacterIndex > selection.start.character) {
    return new Selection(
      new Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex),
      new Position(line.lineNumber, line.firstNonWhitespaceCharacterIndex),
    )
  } else {
    return selection
  }
}
