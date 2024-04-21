import * as vscode from "vscode"
import TSParser from "web-tree-sitter"

type Grammar = any

const languageIDTranslation: { [id: string]: string | null } = {
  javascriptreact: "javascript",
  shellscript: "bash",
  terraform: "hcl",
  jsonc: "json",
}

// languages are not loaded into a specific parser but rather at the
// library level. This is why languageID2Language is not part of
// the Parser class
var languageID2Language: { [languageID: string]: Grammar } = {}

const languageID2Filename = (basePath: string, languageID: string): string => {
  const translation = languageIDTranslation[languageID]
  languageID = translation || languageID
  return `${basePath}/out/parsers/${languageID}.wasm`
}

export const loadLanguage = async (basePath: string, languageID: string) => {
  // already loaded
  if (languageID2Language[languageID]) {
    return
  }

  console.log(`Loading language:`, languageID)

  const fileName = languageID2Filename(basePath, languageID)
  try {
    languageID2Language[languageID] = await TSParser.Language.load(fileName)
  } catch (error) {
    console.warn(`Could not load language: ${languageID}`)
  }
}

export class Parser extends TSParser {
  setParserLanguageFromDoc = (doc: vscode.TextDocument) => {
    if (!vscode.window.activeTextEditor) {
      return
    }
    const grammar = languageID2Language[doc.languageId]

    if (!grammar) {
      vscode.window.showErrorMessage(
        `The language "${doc.languageId}" is not yet supported by tASTe. \nPlease consider contributing! https://github.com/simonacca/tASTe`,
      )
      return
    }
    this.setLanguage(grammar)
  }
}

// tree sitter itself needs to be initialized before
// any parser can be instantiated
const treeSitterInitSingleton = TSParser.init()

export const initParser = async () => {
  await treeSitterInitSingleton
  return new Parser()
}
