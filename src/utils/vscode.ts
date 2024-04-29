import { Selection, Position, TextDocument, Range } from "vscode"

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

/**
 * Convert a Position, a range or a Selection into a Selection
 */
export const selectionify = (location: Position | Range | Selection): Selection => {
  if ((location as any).line) {
    return new Selection(location as any, location as any)
  } else {
    return new Selection((location as any).start, (location as any).end)
  }
}
