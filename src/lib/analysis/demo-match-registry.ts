import {
  match8724913167LocalAnalysis,
  match8724913167Seed,
  match8724913167Visualization,
  type MatchLocalAnalysisProfile,
  type MatchVisualizationProfile,
} from "@/lib/analysis/demo-match-8724913167";
import type { AnalysisAudience } from "@/lib/analysis/schema";

type MatchRegistryEntry = {
  seedTitle: string;
  visualization: MatchVisualizationProfile;
  localAnalysis: MatchLocalAnalysisProfile;
};

const demoMatchRegistry = new Map<string, MatchRegistryEntry>([
  [
    match8724913167Seed.matchId,
    {
      seedTitle: match8724913167Seed.title,
      visualization: match8724913167Visualization,
      localAnalysis: match8724913167LocalAnalysis,
    },
  ],
]);

export function getDemoMatchVisualization(matchId?: string) {
  if (!matchId) {
    return null;
  }

  return demoMatchRegistry.get(matchId) ?? null;
}

export function getDemoMatchLocalAnalysis(
  matchId: string | undefined,
  audience: AnalysisAudience,
) {
  if (!matchId) {
    return null;
  }

  return demoMatchRegistry.get(matchId)?.localAnalysis[audience] ?? null;
}
