import { TextDocument, Selection, TextEditor, TextEditorEdit } from "vscode"
import Parser from "web-tree-sitter"
import * as vsUtils from "../utils/vscode"
import * as tsUtils from "../utils/tree_sitter"
import { CommandRet } from "./common"

export const Raise = (doc: TextDocument, sel: Selection, tree: Parser.Tree): CommandRet => {
  const node = tsUtils.SmallestNodeEnclosingSel(tree.rootNode, sel)
  const parent = tsUtils.enclosingParent(node)

  if (!node || !parent) {
    return
  }

  const parentSel = tsUtils.SyntaxNode2Selection(parent)
  const edit = (editBuilder: TextEditorEdit) => {
    editBuilder.replace(parentSel, node.text)
  }

  return { selection: vsUtils.emptySelection(parentSel.start), edit }
}

export const SwapForward = (doc: TextDocument, sel: Selection, tree: Parser.Tree): CommandRet => {
  const node = tsUtils.SmallestNodeEnclosingSel(tree.rootNode, sel)
  const sibling = node?.nextNamedSibling

  if (!node || !sibling) {
    return
  }

  const siblingText = sibling.text

  const edit = (editBuilder: TextEditorEdit) => {
    editBuilder.replace(tsUtils.SyntaxNode2Selection(sibling), node.text)
    editBuilder.replace(tsUtils.SyntaxNode2Selection(node), siblingText)
  }

  return { edit }
}

export const SwapBackward = (doc: TextDocument, sel: Selection, tree: Parser.Tree): CommandRet => {
  const node = tsUtils.SmallestNodeEnclosingSel(tree.rootNode, sel)
  const sibling = node?.previousNamedSibling

  if (!node || !sibling) {
    return
  }

  const nodeText = node.text

  const edit = (editBuilder: TextEditorEdit) => {
    editBuilder.replace(tsUtils.SyntaxNode2Selection(node), sibling.text)
    editBuilder.replace(tsUtils.SyntaxNode2Selection(sibling), nodeText)
  }

  return { edit }
}

export const SlurpForward = (doc: TextDocument, sel: Selection, tree: Parser.Tree): CommandRet => {
  sel = vsUtils.moveSelectionToFirstNonWhitespace(doc, sel)
  const child = tsUtils.SmallestNodeEnclosingSel(tree.rootNode, sel)
  if (!child) {
    return
  }

  // we use firstAncestorWithNamedChild instead of just child.parent
  // to cover these cases: [[1,2,3 👉🏻👈🏻]4,5] or [[1,👉🏻2,3 👈🏻]4,5]
  const parent = tsUtils.firstAncestorWithNamedChild(child)
  const lastNamedChild = parent?.lastNamedChild
  const secondToLastNamedChild = lastNamedChild?.previousNamedSibling
  const nextSibling = parent?.nextNamedSibling
  if (!parent || !lastNamedChild || !secondToLastNamedChild || !nextSibling) {
    return
  }

  const deleteSel = new Selection(
    tsUtils.SyntaxNode2Selection(nextSibling).start,

    // we do this to account for separators
    // for example in [[1👉🏻👈🏻,2], 3, 4] we want to delete
    // this whole chunk: [[1,2], 🫸🏻3, 🫷🏻4], not just this: [[1,2], 🫸🏻3🫷🏻, 4]
    nextSibling.nextNamedSibling
      ? tsUtils.SyntaxNode2Selection(nextSibling.nextNamedSibling).start
      : tsUtils.SyntaxNode2Selection(nextSibling).end,
  )

  const separatorSel = new Selection(
    tsUtils.SyntaxNode2Selection(secondToLastNamedChild).end,
    tsUtils.SyntaxNode2Selection(lastNamedChild).start,
  )
  const separator = doc.getText(separatorSel)

  const insertionPoint = tsUtils.SyntaxNode2Selection(lastNamedChild).end

  const edit = (editBuilder: TextEditorEdit) => {
    editBuilder.delete(deleteSel)
    editBuilder.insert(insertionPoint, separator + nextSibling.text)
  }

  return { edit }
}

export const BarfForward = (doc: TextDocument, sel: Selection, tree: Parser.Tree): CommandRet => {
  sel = vsUtils.moveSelectionToFirstNonWhitespace(doc, sel)
  const child = tsUtils.SmallestNodeEnclosingSel(tree.rootNode, sel)
  if (!child) {
    return
  }

  // see comment of SlurpForward regarding firstAncestorWithNamedChild
  const parent = tsUtils.firstAncestorWithNamedChild(child)
  const lastNamedChild = parent?.lastNamedChild
  const lastChild = parent?.lastChild
  const nextSibling = parent?.nextNamedSibling
  if (!parent || !lastChild || !lastNamedChild || !nextSibling) {
    return
  }

  const separatorSel = new Selection(
    tsUtils.SyntaxNode2Selection(parent).end,
    tsUtils.SyntaxNode2Selection(nextSibling).start,
  )
  const separator = doc.getText(separatorSel)

  const insertionPoint = tsUtils.SyntaxNode2Selection(nextSibling).start

  const edit = (editBuilder: TextEditorEdit) => {
    editBuilder.replace(
      new Selection(
        tsUtils.SyntaxNode2Selection(lastNamedChild).start,
        tsUtils.SyntaxNode2Selection(lastChild).start,
      ),
      "",
    )
    editBuilder.insert(insertionPoint, lastNamedChild.text + separator)
  }

  return { edit }
}
