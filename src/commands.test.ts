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
  {
    cmd: Cmd.GrowOrShrinkSelectionFocusRight,
    languageId: "typescript",
    text: `
    [
        <IS><FS>{a: 1}<IE>,
        {b: 2}<FE>,
        {c: 3}
      ]`,
  },
  {
    cmd: Cmd.GrowOrShrinkSelectionFocusRight,
    languageId: "typescript",
    text: `
    [
        <IS><IE><FS>{a: 1}<FE>,
        {b: 2},
        {c: 3}
      ]`,
  },
  {
    cmd: Cmd.GrowOrShrinkSelectionFocusLeft,
    languageId: "typescript",
    text: `
    [
        <IS><FS>{a: 1}<FE>,
        {b: 2}<IE>,
        {c: 3}
      ]`,
  },
  {
    cmd: Cmd.GrowOrShrinkSelectionFocusLeft,
    languageId: "typescript",
    text: `
    [
        <IS><FS>{a: 1}<FE>,
        {b: 2}<IE>,
        {c: 3}
      ]`,
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
        if (res) {
          console.error(
            "Want",
            test.text,
            "\n----------------\n",
            "Have",
            `${doc.getText().slice(0, doc.offsetAt(res.start))}<FS>${doc.getText().slice(doc.offsetAt(res.start), doc.offsetAt(res.end))}<FE>${doc.getText().slice(doc.offsetAt(res.start))}`,
          )
        } else {
          console.error("No Res")
        }
      }
      expect(isEq).toBeTruthy()
    }
  })
})
