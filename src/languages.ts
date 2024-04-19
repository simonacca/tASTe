const languageIDTranslation: { [id: string]: string | null } = {
    'typescriptreact': 'typescript',
    'javascriptreact': 'javascript',
    'shellscript': 'bash',
    'terraform': 'hcl',
    'jsonc': 'json'
}

export const languageID2Filename = (basePath: string, languageID: string): string => {
    const translation = languageIDTranslation[languageID]
    languageID = translation || languageID
    return `${basePath}/out/parsers/${languageID}.wasm`
}
