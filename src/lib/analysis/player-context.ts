import type { AnalysisRequest } from "@/lib/analysis/schema";

export const playerPositionRoleLabels = {
  "1": "优势路",
  "2": "中单",
  "3": "劣势路",
  "4": "辅助",
  "5": "纯辅助",
} as const satisfies Record<Exclude<AnalysisRequest["playerPosition"], "">, string>;

export function formatPlayerPositionRole(
  position: AnalysisRequest["playerPosition"],
) {
  return position ? playerPositionRoleLabels[position] : "";
}
