import { Selection, Position } from "vscode"
import TSParser, { SyntaxNode, Tree } from "web-tree-sitter"
import * as Utils from "./utils"
import { LanguageID } from "./language_detection"

// languages are not loaded into a specific parser but rather at the library level
var parserRegistry: { [languageID: LanguageID]: TSParser.Language } = {}

const languageID2Path = (basePath: string, languageID: LanguageID): string => {
  return `${basePath}/out/parsers/${languageID}.wasm`
}

export const loadLanguage = async (basePath: string, languageID: LanguageID) => {
  // already loaded
  if (parserRegistry[languageID]) {
    return
  }

  const parserPath = languageID2Path(basePath, languageID)
  try {
    parserRegistry[languageID] = await TSParser.Language.load(parserPath)
  } catch (error) {
    console.warn(`Could not load language: ${languageID}`)
  }
}

export const setParserLanguage = (parser: TSParser, languageId: LanguageID): boolean => {
  const languageParser = parserRegistry[languageId]

  if (!languageParser) {
    return false
  }
  parser.setLanguage(languageParser)
  return true
}

// the library itself needs to be initialized before any parser can be instantiated
const treeSitterInitSingleton = TSParser.init()

/**
 * Finds the smallest **named** SyntaxNode that fully encloses `selection`
 */
export const SmallestNodeEnclosingSel = (
  container: SyntaxNode,
  selection: Selection,
): SyntaxNode | undefined => {
  if (!SyntaxNode2Selection(container).contains(selection)) {
    return
  }

  const [_, res] = Utils.find(container.children, (c) => SmallestNodeEnclosingSel(c, selection))
  if (res) {
    return res
  }

  if (container.isNamed) {
    return container
  }
}

/**
 * Finds the biggest SyntaxNode containing smallSel which is fully contained in bigSel
 */
export const biggestNodeContaining = (
  tree: Tree,
  bigSel: Selection,
  smallSel: Selection,
): SyntaxNode | undefined => {
  let node = SmallestNodeEnclosingSel(tree.rootNode, smallSel)
  if (!node) {
    return
  }
  while (node && node.parent && bigSel.contains(SyntaxNode2Selection(node.parent))) {
    node = node.parent
  }
  return node
}

/**
 * Finds a node's parent.
 * Sometimes the syntax tree has a parent node whose range concides with its child's range.
 * in these cases we want to try the ancestors further up until we find one
 * whose range does not coincide with the child.
 * if we don't manage in 10 attempts, we bail
 */
export const enclosingParent = (node: SyntaxNode | undefined): SyntaxNode | null | undefined => {
  let parent = node?.parent
  for (let i = 0; i < 10; i++) {
    if (!node || !parent || !areSyntaxNodesSameSelection(node, parent)) {
      break
    }
    parent = parent?.parent
  }

  return parent
}

export const firstAncestorWithNamedChild = (node: SyntaxNode): SyntaxNode | undefined => {
  while (true) {
    if (node.firstNamedChild) {
      return node
    }
    if (!node.parent) {
      return
    }
    node = node.parent
  }
}

export const initParser = async () => {
  await treeSitterInitSingleton
  return new TSParser()
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
