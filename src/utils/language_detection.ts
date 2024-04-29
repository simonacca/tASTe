import path from "path"
import { TextDocument } from "vscode"

export type LanguageID = string
type Extension = string

const languageIDTranslation: { [id: LanguageID]: LanguageID } = {
  javascriptreact: "javascript",
  shellscript: "bash",
  terraform: "hcl",
  jsonc: "json",
}

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
  if (languageIDTranslation[doc.languageId]) {
    return languageIDTranslation[doc.languageId]
  }
  if (doc.languageId !== "" && doc.languageId !== "plaintext") {
    return doc.languageId
  }

  let { ext } = path.parse(doc.fileName)
  ext = ext.slice(1)

  if (ext2LanguageId[ext]) {
    return ext2LanguageId[ext]
  }
}
