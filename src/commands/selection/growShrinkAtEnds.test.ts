import * as Cmds from "./growShrinkAtEnds"
import * as TUtils from "../../utils/test"

const cases: TUtils.SelectionChangeTest[] = [
  {
    cmd: Cmds.SelectForward,
    languageId: "typescript",
    text: `
    [
        👉🏻🫸🏻{a: 1}👈🏻,
        {b: 2}🫷🏻,
        {c: 3}
      ]`,
  },
  {
    cmd: Cmds.SelectForward,
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
    cmd: Cmds.SelectForward,
    languageId: "typescript",
    text: `
    [
        {a: 1},  👉🏻👈🏻  

        🫸🏻{b: 2}🫷🏻,
        {c: 3}
      ]`,
  },
  {
    cmd: Cmds.SelectBackward,
    languageId: "typescript",
    text: `
    [
      🫸🏻🫷🏻👉🏻{a: 1}👈🏻,
        {b: 2},
        {c: 3}
      ]`,
  },
  {
    cmd: Cmds.SelectBackward,
    languageId: "typescript",
    text: `
    [
        👉🏻🫸🏻{a: 1}🫷🏻,
        {b: 2}👈🏻,
        {c: 3}
      ]`,
  },
  {
    cmd: Cmds.SelectBackward,
    languageId: "typescript",
    text: `
    [
      🫷🏻{},
      👉🏻👈🏻🫸🏻{},
      {},
  ]`,
  },
  {
    cmd: Cmds.SelectBackward,
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
    cmd: Cmds.SelectForward,
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
]

describe("Commands", () => {
  test.concurrent.each(cases)("%#", TUtils.executeSelectionChangeTest)
})
