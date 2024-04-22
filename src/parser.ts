import TSParser from "web-tree-sitter"

type LanguageId = string

const languageIDTranslation: { [id: LanguageId]: LanguageId | null } = {
  javascriptreact: "javascript",
  shellscript: "bash",
  terraform: "hcl",
  jsonc: "json",
}

// languages are not loaded into a specific parser but rather at the library level
var parserRegistry: { [languageID: LanguageId]: TSParser.Language } = {}

const languageID2Path = (basePath: string, languageID: LanguageId): string => {
  const translation = languageIDTranslation[languageID]
  languageID = translation || languageID
  return `${basePath}/out/parsers/${languageID}.wasm`
}

export const loadLanguage = async (basePath: string, languageID: LanguageId) => {
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

export const setParserLanguage = (parser: TSParser, languageId: LanguageId): boolean => {
  const languageParser = parserRegistry[languageId]

  if (!languageParser) {
    return false
  }
  parser.setLanguage(languageParser)
  return true
}

// the library itself needs to be initialized before any parser can be instantiated
const treeSitterInitSingleton = TSParser.init()

export const initParser = async () => {
  await treeSitterInitSingleton
  return new TSParser()
}
