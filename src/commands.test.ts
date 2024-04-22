import * as Cmd from "./commands"
import * as ParserLib from "./parser"
import * as TUtils from "./testutils"

const tests: TUtils.Test[] = [
  {
    cmd: Cmd.SelectTopLevel,
    languageId: "typescript",
    text: `
        a = 123
        <FS>const<IS><IE> a = () => {
            
        }<FE>
            `,
  },
]

describe("workspace", () => {
  test("Commands", async () => {
    const parser = await ParserLib.initParser()

    for (const test of tests) {
      const { doc, initialSel, finalSel } = TUtils.text2VScodeObjs(test.languageId, test.text)

      await ParserLib.loadLanguage(".", doc.languageId)
      if (!ParserLib.setParserLanguage(parser, doc.languageId)) {
        throw new Error("Could not set parser language")
      }
      const res = test.cmd(doc, initialSel, parser.parse(doc.getText()))
      const isEq = res?.isEqual(finalSel)

      if (!isEq) {
        console.error("Res", res)
      }
      expect(isEq).toBeTruthy()
    }
  })
})
