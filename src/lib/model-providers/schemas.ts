import type { z } from "zod";
import {
  assessmentResultSchema,
  correctionItemSchema,
  practiceSummarySchema,
  practiceTurnGuidanceSchema,
  qualityAssessmentSchema,
} from "../agent-skill-contracts/schema.ts";
import type { ExpectedOutputSchemaName } from "./types.ts";

export function schemaForExpectedOutput(name: ExpectedOutputSchemaName): z.ZodType {
  switch (name) {
    case "practiceTurnGuidance":
      return practiceTurnGuidanceSchema;
    case "assessmentResult":
      return assessmentResultSchema;
    case "qualityAssessment":
      return qualityAssessmentSchema;
    case "correctionItem":
      return correctionItemSchema;
    case "practiceSummary":
      return practiceSummarySchema;
  }
}
