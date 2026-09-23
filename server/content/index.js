import { finishScenario } from "./common.js";
import s1 from "./s1.js";
import s2 from "./s2.js";
import s3 from "./s3.js";
import s4 from "./s4.js";

export const scenarios = Object.fromEntries(
  [s1, s2, s3, s4].map((s) => [s.id, finishScenario(s)]),
);

export {
  elders,
  elderFiresOn,
  roles,
  decidedByPrompt,
  villagerStandingLine,
  meterStart,
  meterLabels,
  buildEpilogue,
} from "./common.js";
