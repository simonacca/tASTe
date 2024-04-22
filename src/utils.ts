import { SyntaxNode } from "web-tree-sitter"
import { Selection, Position, TextDocument } from "vscode"

export const logSyntaxNode = (t: string, ASTpath: SyntaxNode[]) => {
  console.log(
    t,
    "\n",
    ASTpath.map((n) =>
      [
        n.startPosition.row,
        n.startPosition.column,
        n.endPosition.row,
        n.endPosition.column,
        n.type,
      ].join("\t"),
    ).join("\n "),
  )
}

export const parserNode2Selection = (node: SyntaxNode) => {
  return new Selection(
    new Position(node.startPosition.row, node.startPosition.column),
    new Position(node.endPosition.row, node.endPosition.column),
  )
}

export const invert = (selection: Selection) => {
  return new Selection(selection.end, selection.start)
}

export const movePositionChar = (pos: Position, amount: number) => {
  return new Position(pos.line, pos.character + amount)
}

export const makeSelectionOfSize = (pos: Position, size: number) => {
  return new Selection(pos, movePositionChar(pos, size))
}

export const emptySelection = (pos: Position) => makeSelectionOfSize(pos, 0)

export const selectFirstChar = (s: Selection) => makeSelectionOfSize(s.start, 1)
export const selectLastChar = (s: Selection) => makeSelectionOfSize(movePositionChar(s.end, -1), 1)

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
