import * as TopLevel from "./topLevel"
import * as GrowShrink from "./growShrinkAtEnds"
import * as ExpandContract from "./expandContract"

export default {
  ...TopLevel,
  ...GrowShrink,
  ...ExpandContract,
}
