import * as Cmds from "./swap"
import * as TUtils from "../../utils/test"

const cases: TUtils.EditTest[] = [
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
]

describe("Edit Commands", () => {
  test.concurrent.each(cases)("%#", TUtils.executeEditTest)
})
