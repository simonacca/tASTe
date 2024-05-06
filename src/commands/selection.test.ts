import * as Cmds from "./selection"
import * as TUtils from "../utils/test"

const cases: TUtils.SelectionChangeTest[] = [
  {
    cmd: Cmds.SelectTopLevel,
    languageId: "typescript",
    text: `
        a = 123
        🫸🏻const👉🏻👈🏻 a = () => {
            
        }🫷🏻
            `,
  },
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
  {
    cmd: Cmds.ExpandSelection,
    languageId: "go",
    text: `
    a
    if err != nil 🫸🏻{
      👉🏻panic("Failed to perform setup")👈🏻
    }🫷🏻`,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "go",
    text: `
    a
    🫸🏻c := 👉🏻mainConfig{}👈🏻🫷🏻
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
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
  { cmd: Cmds.ExpandSelection, languageId: "typescript", text: `🫸🏻{"val": 1}🫷🏻👉🏻👈🏻` },
  {
    cmd: Cmds.MoveCursorForward,
    languageId: "json",
    text: `
    {
      "devDependencies": {
        "shadow-cljs": "2.26.7"
      }👉🏻👈🏻,
      "dependencies": {
        "snabbdom": "3.5.1"
      }🫸🏻🫷🏻
    }
    `,
  },
  {
    cmd: Cmds.MoveCursorForward,
    languageId: "json",
    text: `
    {
      "devDependencies": {
        "shadow-cljs": "2.26.7"
      },
      👉🏻👈🏻"dependencies"🫸🏻🫷🏻: {
        "snabbdom": "3.5.1"
      }
    }
    `,
  },
  {
    cmd: Cmds.MoveCursorForward,
    languageId: "json",
    text: `
    {
      "devDependencies": {
        "shadow-cljs": "2.26.7"
      },
      "dependencies": 👉🏻👈🏻{
        "snabbdom": "3.5.1"
      }🫸🏻🫷🏻
    }
    `,
  },
  {
    cmd: Cmds.MoveCursorBackward,
    languageId: "json",
    text: `
    {
      "devDependencies": {
        "shadow-cljs": "2.26.7"
      },
      "dependencies": 🫸🏻🫷🏻{
        "snabbdom": "3.5.1"
      }👉🏻👈🏻
    }
    `,
  },
  {
    cmd: Cmds.MoveCursorBackward,
    languageId: "json",
    text: `
    {
      🫸🏻🫷🏻"devDependencies": {
        "shadow-cljs": "2.26.7"
      },
      👉🏻👈🏻"dependencies": {
        "snabbdom": "3.5.1"
      }
    }
    `,
  },
]

describe("Commands", () => {
  test.concurrent.each(cases)("%#", TUtils.executeSelectionChangeTest)
})
