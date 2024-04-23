import * as Cmd from "./commands"
import * as ParserLib from "./parser"
import * as TUtils from "./testutils"


// Each test case contains four markers describing the position of the
// Initial selection (that is, the selection before the command is applied)
// and of the Final Selection (that is, the selection after the command is applied)
// - <IS> : Initial selection, Start
// - <IE> : Initial selection, End
// - <FS> : Final selection, Start
// - <FE> : Final selection, end


const cases: TUtils.Test[] = [
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

describe("Commands", () => {
  test.concurrent.each(cases)("%#", async (c) => {
    const parser = await ParserLib.initParser()
    const { doc, initialSel, finalSel } = TUtils.text2VScodeObjs(c.languageId, c.text)

    await ParserLib.loadLanguage(".", doc.languageId)
    if (!ParserLib.setParserLanguage(parser, doc.languageId)) {
      throw new Error("Could not set parser language")
    }
    const res = c.cmd(doc, initialSel, parser.parse(doc.getText()))
    
    // must
    if (res && !finalSel.isEqual(res)) {
      console.log(
        "Want",
        c.text,
        "\n----------------\n",
        "Have",
        `${doc.getText().slice(0, doc.offsetAt(res.start))}<FS>${doc.getText().slice(doc.offsetAt(res.start), doc.offsetAt(res.end))}<FE>${doc.getText().slice(doc.offsetAt(res.start))}`,
      )
    }

    expect(res).toEqual(finalSel)
  })
})
