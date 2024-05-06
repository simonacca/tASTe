import * as Cmds from "./expandContract"
import * as TUtils from "../../utils/test"

const cases: TUtils.SelectionChangeTest[] = [
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
]

describe("Commands", () => {
  test.concurrent.each(cases)("%#", TUtils.executeSelectionChangeTest)
})
