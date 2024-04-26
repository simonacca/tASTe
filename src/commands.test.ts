import * as Cmd from "./commands"
import * as ParserLib from "./parser"
import * as TUtils from "./testutils"
import { detectLanguage } from "./languageDetection"

// Each test case contains four markers describing the position of the
// Initial selection (that is, the selection before the command is applied)
// and of the Final Selection (that is, the selection after the command is applied)
// - 👉🏻 : Initial selection, Start
// - 👈🏻 : Initial selection, End
// - 🫸🏻 : Final selection,   Start
// - 🫷🏻 : Final selection,   End

const cases: TUtils.Test[] = [
  {
    cmd: Cmd.SelectTopLevel,
    languageId: "typescript",
    text: `
        a = 123
        🫸🏻const👉🏻👈🏻 a = () => {
            
        }🫷🏻
            `,
  },
  {
    cmd: Cmd.SelectForward,
    languageId: "typescript",
    text: `
    [
        👉🏻🫸🏻{a: 1}👈🏻,
        {b: 2}🫷🏻,
        {c: 3}
      ]`,
  },
  {
    cmd: Cmd.SelectForward,
    languageId: "typescript",
    text: `
    [
        👉🏻👈🏻🫸🏻{a: 1}🫷🏻,
        {b: 2},
        {c: 3}
      ]`,
  },
  {
    cmd: Cmd.SelectBackward,
    languageId: "typescript",
    text: `
    [
      🫸🏻🫷🏻👉🏻{a: 1}👈🏻,
        {b: 2},
        {c: 3}
      ]`,
  },
  {
    cmd: Cmd.SelectBackward,
    languageId: "typescript",
    text: `
    [
        👉🏻🫸🏻{a: 1}🫷🏻,
        {b: 2}👈🏻,
        {c: 3}
      ]`,
  },
  {
    cmd: Cmd.SelectBackward,
    languageId: "typescript",
    text: `
    [
      🫷🏻{},
      👉🏻👈🏻🫸🏻{},
      {},
  ]`,
  },
  {
    cmd: Cmd.SelectBackward,
    languageId: "python",
    text: `
    def abc():
    🫸🏻👉🏻for x in range(3):
          print(x)🫷🏻
  
      if 1 == 2:
          print("wow")👈🏻
  
      while False:
          print("huh")`,
  },
  {
    cmd: Cmd.SelectForward,
    languageId: "go",
    text: `function main() {
      foo(
        🫸🏻👉🏻bar(
          1,
          2,
        )👈🏻,
        3🫷🏻,
      )
    }`,
  },
  {
    cmd: Cmd.ExpandSelection,
    languageId: "go",
    text: `
    a
    if err != nil 🫸🏻{
      👉🏻panic("Failed to perform setup")👈🏻
    }🫷🏻`,
  },
  {
    cmd: Cmd.ExpandSelection,
    languageId: "go",
    text: `
    a
    🫸🏻c := 👉🏻mainConfig{}👈🏻🫷🏻
    `,
  },
]

describe("Commands", () => {
  test.concurrent.each(cases)("%#", async (c) => {
    const parser = await ParserLib.initParser()
    const { doc, initialSel, finalSel } = TUtils.text2VScodeObjs(c.languageId, c.text)

    const language = detectLanguage(doc)
    if (!language) {
      throw new Error("Could not determine langauge")
    }
    await ParserLib.loadLanguage(process.cwd(), language)
    if (!ParserLib.setParserLanguage(parser, language)) {
      throw new Error("Could not set parser language")
    }
    const res = c.cmd(doc, initialSel, parser.parse(doc.getText()))

    if (res && !finalSel.isEqual(res)) {
      console.log(
        "Want",
        c.text,
        "\n----------------\n",
        "Have",
        [
          doc.getText().slice(0, doc.offsetAt(res.start)),
          "🫸🏻",
          doc.getText().slice(doc.offsetAt(res.start), doc.offsetAt(res.end)),
          "🫷🏻",
          doc.getText().slice(doc.offsetAt(res.start)),
        ].join(""),
      )
    }

    expect(res).toEqual(finalSel)
  })
})
