import * as Cmd from "./commands"
import * as TUtils from "./testutils"

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
    // ensure moveSelectionToFirstNonWhitespace works across newlines
    cmd: Cmd.SelectForward,
    languageId: "typescript",
    text: `
    [
        {a: 1},  👉🏻👈🏻  

        🫸🏻{b: 2}🫷🏻,
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
  {
    cmd: Cmd.ExpandSelection,
    languageId: "typescript",
    text: `
[
  1,
  🫸🏻[
    👉🏻2,
    3👈🏻,
    4,
  ]🫷🏻
]

    `,
  },
]

describe("Commands", () => {
  test.concurrent.each(cases)("%#", TUtils.executeSelectionChangeTest)
})
