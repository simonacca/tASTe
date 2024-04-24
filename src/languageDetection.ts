import path from "path"
import { TextDocument } from "vscode"

type LanguageID = string
type Extension = string

const languageId2Exts: { [languageID: LanguageID]: Extension[] } = {
  csv: ["csv"],
  tsv: ["tsv"],
}

const ext2LanguageId = (() => {
  const res: { [ext: Extension]: LanguageID } = {}
  for (const languageId of Object.keys(languageId2Exts)) {
    for (const ext of languageId2Exts[languageId]) {
      res[ext] = languageId
    }
  }
  return res
})()

export const detectLanguage = (doc: TextDocument): string | undefined => {
  if (doc.languageId !== "" && doc.languageId !== "plaintext") {
    return doc.languageId
  }

  let { ext } = path.parse(doc.fileName)
  ext = ext.slice(1)

  if (ext2LanguageId[ext]) {
    return ext2LanguageId[ext]
  }
}
