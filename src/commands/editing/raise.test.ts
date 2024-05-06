import * as Cmds from "./raise"
import * as TUtils from "../../utils/test"

const cases: TUtils.EditTest[] = [
  {
    languageId: "typescript",
    cmd: Cmds.Raise,
    initialText: "[1,2,3,[👉🏻4👈🏻,5]]",
    finalText: "[1,2,3,4]",
  },
]

describe("Edit Commands", () => {
  test.concurrent.each(cases)("%#", TUtils.executeEditTest)
})
