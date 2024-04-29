import { TextDocument, Selection, TextEditor, TextEditorEdit } from "vscode"
import Parser from "web-tree-sitter"

interface CommandRetInner {
  selection?: Selection
  edit?: (editBuilder: TextEditorEdit) => void
}

export type CommandRet = CommandRetInner | undefined

export type Command = (doc: TextDocument, selection: Selection, tree: Parser.Tree) => CommandRet

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
