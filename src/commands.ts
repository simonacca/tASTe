import { TextDocument, Selection } from "vscode"
import Parser from "web-tree-sitter"

export type Command = (
  doc: TextDocument,
  selection: Selection,
  tree: Parser.Tree,
) => Selection | undefined | void

class SelectionStackByDoc {
  private state = new Map<TextDocument, Selection[]>()

  clear = () => (this.state = new Map())

  push = (doc: TextDocument, selection: Selection) => {
    if (selection.isEmpty) {
      this.clear()
    }
    const prev = this.state.get(doc) || []
    this.state.set(doc, [...prev, selection])
  }

  pop = (doc: TextDocument) => {
    const stack = this.state.get(doc)
    if (!stack || stack.length === 0) {
      return
    }

    return stack.pop()
  }
}

export const globalSelectionStack = new SelectionStackByDoc()
