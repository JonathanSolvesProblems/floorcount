/**
 * LeafIndex — registers the Floorcount LEAF scenarios, one per done criterion in
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
import { FloorcountHoldOnCountScenario } from "./FloorcountHoldOnCountScenario"

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
    // A capture helper rather than a done criterion: holds the session on one count so a
    // screenshot can be taken of a known frame.
    {
      id: "floorcount-hold-on-count",
      typename: FloorcountHoldOnCountScenario.getTypeName(),
      parameters: { count: "1" },
    },
  ]
}
