import * as Cmds from "./slurpBarf"
import * as TUtils from "../../utils/test"

const cases: TUtils.EditTest[] = [
  {
    languageId: "typescript",
    cmd: Cmds.SlurpForward,
    initialText: "[[1,2👉🏻👈🏻,3],4,5]",
    finalText: "[[1,2,3,4],5]",
  },
  {
    languageId: "typescript",
    cmd: Cmds.BarfForward,
    initialText: "[[1,2👉🏻👈🏻,3],4,5]",
    finalText: "[[1,2,],3,4,5]",
  },
]

describe("Edit Commands", () => {
  test.concurrent.each(cases)("%#", TUtils.executeEditTest)
})
