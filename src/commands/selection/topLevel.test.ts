import * as Cmds from "./topLevel"
import * as TUtils from "../../utils/test"

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
]

describe("Commands", () => {
  test.concurrent.each(cases)("%#", TUtils.executeSelectionChangeTest)
})
