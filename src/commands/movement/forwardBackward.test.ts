import * as Cmds from "./forwardBackward"
import * as TUtils from "../../utils/test"

const cases: TUtils.SelectionChangeTest[] = [
  {
    cmd: Cmds.MoveCursorForwardToEndOfNode,
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
    cmd: Cmds.MoveCursorForwardToEndOfNode,
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
    cmd: Cmds.MoveCursorForwardToEndOfNode,
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
    cmd: Cmds.MoveCursorForwardToBeginningOfNextNode,
    languageId: "json",
    text: `
    {
      "devDependencies": {
        "shadow-cljs": "2.26.7"
      }👉🏻👈🏻,
      🫸🏻🫷🏻"dependencies": {
        "snabbdom": "3.5.1"
      }
    }
    `,
  },
  {
    cmd: Cmds.MoveCursorForwardToBeginningOfNextNode,
    languageId: "json",
    text: `
    {
      "devDependencies": {
        "shadow-cljs": "2.26.7"
      },
      👉🏻👈🏻"dependencies": 🫸🏻🫷🏻{
        "snabbdom": "3.5.1"
      }
    }
    `,
  },
  {
    cmd: Cmds.MoveCursorForwardToBeginningOfNextNode,
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
