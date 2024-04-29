import { TextDocument, Selection, TextEditor } from "vscode"
import Parser from "web-tree-sitter"
import * as U from "./utils"
import * as AST from "./ast"
import { CommandRet } from "./commands"

export const Raise = async (
  editor: TextEditor,
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  const node = AST.Sel(tree.rootNode, sel)
  const parent = AST.enclosingParent(node)

  if (!node || !parent) {
    return
  }

  const parentSel = U.SyntaxNode2Selection(parent)
  await editor.edit((editBuilder) => {
    editBuilder.replace(parentSel, node.text)
  })

  return U.emptySelection(parentSel.start)
}

export const SwapForward = async (
  editor: TextEditor,
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  const node = AST.Sel(tree.rootNode, sel)
  const sibling = node?.nextNamedSibling

  if (!node || !sibling) {
    return
  }

  const siblingText = sibling.text

  await editor.edit((editBuilder) => {
    editBuilder.replace(U.SyntaxNode2Selection(sibling), node.text)
    editBuilder.replace(U.SyntaxNode2Selection(node), siblingText)
  })
}

export const SwapBackward = async (
  editor: TextEditor,
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  const node = AST.Sel(tree.rootNode, sel)
  const sibling = node?.previousNamedSibling

  if (!node || !sibling) {
    return
  }

  const nodeText = node.text

  await editor.edit((editBuilder) => {
    editBuilder.replace(U.SyntaxNode2Selection(node), sibling.text)
    editBuilder.replace(U.SyntaxNode2Selection(sibling), nodeText)
  })
}

export const SlurpForward = async (
  editor: TextEditor,
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  sel = U.moveSelectionToFirstNonWhitespace(doc, sel)
  const child = AST.Sel(tree.rootNode, sel)
  if (!child) {
    return
  }

  // we use firstAncestorWithNamedChild instead of just child.parent
  // to cover these cases: [[1,2,3 👉🏻👈🏻]4,5] or [[1,👉🏻2,3 👈🏻]4,5]
  const parent = AST.firstAncestorWithNamedChild(child)
  const lastNamedChild = parent?.lastNamedChild
  const secondToLastNamedChild = lastNamedChild?.previousNamedSibling
  const nextSibling = parent?.nextNamedSibling
  if (!parent || !lastNamedChild || !secondToLastNamedChild || !nextSibling) {
    return
  }

  const deleteSel = new Selection(
    U.SyntaxNode2Selection(nextSibling).start,

    // we do this to account for separators
    // for example in [[1👉🏻👈🏻,2], 3, 4] we want to delete
    // this whole chunk: [[1,2], 🫸🏻3, 🫷🏻4], not just this: [[1,2], 🫸🏻3🫷🏻, 4]
    nextSibling.nextNamedSibling
      ? U.SyntaxNode2Selection(nextSibling.nextNamedSibling).start
      : U.SyntaxNode2Selection(nextSibling).end,
  )

  const separatorSel = new Selection(
    U.SyntaxNode2Selection(secondToLastNamedChild).end,
    U.SyntaxNode2Selection(lastNamedChild).start,
  )
  const separator = doc.getText(separatorSel)

  const insertionPoint = U.SyntaxNode2Selection(lastNamedChild).end

  await editor.edit((editBuilder) => {
    editBuilder.delete(deleteSel)
    editBuilder.insert(insertionPoint, separator + nextSibling.text)
  })
}

export const BarfForward = async (
  editor: TextEditor,
  doc: TextDocument,
  sel: Selection,
  tree: Parser.Tree,
): CommandRet => {
  sel = U.moveSelectionToFirstNonWhitespace(doc, sel)
  const child = AST.Sel(tree.rootNode, sel)
  if (!child) {
    return
  }

  // see comment of SlurpForward regarding firstAncestorWithNamedChild
  const parent = AST.firstAncestorWithNamedChild(child)
  const lastNamedChild = parent?.lastNamedChild
  const lastChild = parent?.lastChild
  const nextSibling = parent?.nextNamedSibling
  if (!parent || !lastChild || !lastNamedChild || !nextSibling) {
    return
  }

  const separatorSel = new Selection(
    U.SyntaxNode2Selection(parent).end,
    U.SyntaxNode2Selection(nextSibling).start,
  )
  const separator = doc.getText(separatorSel)

  const insertionPoint = U.SyntaxNode2Selection(nextSibling).start

  await editor.edit((editBuilder) => {
    editBuilder.replace(
      new Selection(
        U.SyntaxNode2Selection(lastNamedChild).start,
        U.SyntaxNode2Selection(lastChild).start,
      ),
      "",
    )
    editBuilder.insert(insertionPoint, lastNamedChild.text + separator)
  })
}
