import * as Cmds from "./edit"
import * as TUtils from "../utils/test"

const cases: TUtils.EditTest[] = [
  {
    languageId: "typescript",
    cmd: Cmds.Raise,
    initialText: "[1,2,3,[👉🏻4👈🏻,5]]",
    finalText: "[1,2,3,4]",
  },
  {
    languageId: "typescript",
    cmd: Cmds.SwapForward,
    initialText: "[1,👉🏻2👈🏻,3]",
    finalText: "[1,3,2]",
  },
  {
    languageId: "typescript",
    cmd: Cmds.SwapBackward,
    initialText: "[1,👉🏻2👈🏻,3]",
    finalText: "[2,1,3]",
  },
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
