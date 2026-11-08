/**
 * LeafIndex: registers the Floorcount LEAF scenarios, one per done criterion in
 * devpost/design-brief.md.
 */

import { scenariosIndex } from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator"
import { ScenarioMetadata } from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata"
import { FloorcountC1StartScenario } from "./FloorcountC1StartScenario"
import { FloorcountC2BeatScenario } from "./FloorcountC2BeatScenario"
import { FloorcountC3AgainScenario } from "./FloorcountC3AgainScenario"
import { FloorcountC4NextStepScenario } from "./FloorcountC4NextStepScenario"
import { FloorcountC5MarkAndSummaryScenario } from "./FloorcountC5MarkAndSummaryScenario"
import { FloorcountC6OffViewArrowScenario } from "./FloorcountC6OffViewArrowScenario"
import { FloorcountC7StepCardScenario } from "./FloorcountC7StepCardScenario"
import { FloorcountC8AnswerGuardScenario } from "./FloorcountC8AnswerGuardScenario"
import { FloorcountC9SessionMemoryScenario } from "./FloorcountC9SessionMemoryScenario"
import { FloorcountC10LeftTurnScenario } from "./FloorcountC10LeftTurnScenario"
import { FloorcountC11HalvesScenario } from "./FloorcountC11HalvesScenario"
import { FloorcountC12CountDisplayScenario } from "./FloorcountC12CountDisplayScenario"
import { FloorcountC13TheAndScenario } from "./FloorcountC13TheAndScenario"
import { FloorcountC14MarkRingScenario } from "./FloorcountC14MarkRingScenario"
import { FloorcountC15RestartFromSummaryScenario } from "./FloorcountC15RestartFromSummaryScenario"
import { FloorcountC16ArcInsidePadScenario } from "./FloorcountC16ArcInsidePadScenario"
import { FloorcountC17TealLawScenario } from "./FloorcountC17TealLawScenario"
import { FloorcountC18FloorSettleScenario } from "./FloorcountC18FloorSettleScenario"
import { FloorcountHoldOnCountScenario } from "./FloorcountHoldOnCountScenario"
import { FloorcountCaptureScenario } from "./FloorcountCaptureScenario"

@component
export class LeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex: ScenarioMetadata[] = [
    { id: "floorcount-c1-start", typename: FloorcountC1StartScenario.getTypeName() },
    { id: "floorcount-c2-beat", typename: FloorcountC2BeatScenario.getTypeName() },
    { id: "floorcount-c3-again", typename: FloorcountC3AgainScenario.getTypeName() },
    { id: "floorcount-c4-next-step", typename: FloorcountC4NextStepScenario.getTypeName() },
    { id: "floorcount-c5-mark-and-summary", typename: FloorcountC5MarkAndSummaryScenario.getTypeName() },
    { id: "floorcount-c6-off-view-arrow", typename: FloorcountC6OffViewArrowScenario.getTypeName() },
    // The card's look rather than a done criterion: one left edge, fitted capsules, and the
    // words the focus line carries while the session is held.
    { id: "floorcount-c7-step-card", typename: FloorcountC7StepCardScenario.getTypeName() },
    // The rule behind criteria 3 and 4, with the Lens as it ships: one answer per 8-count.
    { id: "floorcount-c8-answer-guard", typename: FloorcountC8AnswerGuardScenario.getTypeName() },
    // c9 to c17 each cover a behaviour nothing above asserts. They are not done criteria: the
    // brief's six are c1 to c6.
    { id: "floorcount-c9-session-memory", typename: FloorcountC9SessionMemoryScenario.getTypeName() },
    { id: "floorcount-c10-left-turn", typename: FloorcountC10LeftTurnScenario.getTypeName() },
    { id: "floorcount-c11-halves", typename: FloorcountC11HalvesScenario.getTypeName() },
    { id: "floorcount-c12-count-display", typename: FloorcountC12CountDisplayScenario.getTypeName() },
    { id: "floorcount-c13-the-and", typename: FloorcountC13TheAndScenario.getTypeName() },
    { id: "floorcount-c14-mark-ring", typename: FloorcountC14MarkRingScenario.getTypeName() },
    { id: "floorcount-c15-restart-from-summary", typename: FloorcountC15RestartFromSummaryScenario.getTypeName() },
    { id: "floorcount-c16-arc-inside-pad", typename: FloorcountC16ArcInsidePadScenario.getTypeName() },
    { id: "floorcount-c17-teal-law", typename: FloorcountC17TealLawScenario.getTypeName() },
    // The rule that settles the layout onto the real floor, fed by hand: the preview has no
    // floor to read, the glasses do.
    { id: "floorcount-c18-floor-settle", typename: FloorcountC18FloorSettleScenario.getTypeName() },
    // Capture helpers rather than done criteria: they hold the Lens on a known frame so a
    // screenshot can be taken of it.
    {
      id: "floorcount-hold-on-count",
      typename: FloorcountHoldOnCountScenario.getTypeName(),
      parameters: { count: "1" },
    },
    {
      id: "floorcount-capture",
      typename: FloorcountCaptureScenario.getTypeName(),
      parameters: { shot: "right-turn-count2" },
    },
  ]
}
