import { describe, expect, it } from "vitest";

import {
  buildAudienceRequestFromMatchSeed,
  buildMatchProductSeed,
} from "@/lib/analysis/match-json";

const rawMatch = {
  match_id: 8724913167,
  radiant_name: "Midwest Meepo",
  dire_name: "Pancakes & Pango",
  radiant_score: 21,
  dire_score: 15,
  radiant_win: false,
  duration: 1754,
  patch: 59,
  objectives: [
    { time: 1012, type: "building_kill", key: "npc_dota_badguys_tower1_top" },
    { time: 1643, type: "CHAT_MESSAGE_ROSHAN_KILL", key: null },
    { time: 1686, type: "building_kill", key: "npc_dota_goodguys_tower2_mid" },
    { time: 1754, type: "building_kill", key: "npc_dota_goodguys_fort" },
  ],
  players: [
    {
      player_slot: 0,
      personaname: "MM.Dax",
      isRadiant: true,
      hero_id: 21,
      kills: 10,
      deaths: 1,
      assists: 3,
      hero_damage: 19701,
      tower_damage: 2514,
      net_worth: 18086,
    },
    {
      player_slot: 132,
      personaname: "ER.Paradise",
      isRadiant: false,
      hero_id: 11,
      kills: 4,
      deaths: 3,
      assists: 4,
      hero_damage: 12050,
      tower_damage: 8873,
      net_worth: 18230,
    },
  ],
} as const;

describe("buildMatchProductSeed", () => {
  it("turns a replay json blob into a product-friendly seed", () => {
    const seed = buildMatchProductSeed(rawMatch);

    expect(seed.matchId).toBe("8724913167");
    expect(seed.title).toContain("Midwest Meepo");
    expect(seed.contextSummary).toContain("Pancakes & Pango");
    expect(seed.contextSummary).toContain("27:23");
    expect(seed.timeline.length).toBeGreaterThanOrEqual(3);
    expect(seed.replayNotes).toContain("ER.Paradise");
  });

  it("builds audience-specific requests from the same seed", () => {
    const seed = buildMatchProductSeed(rawMatch);
    const creatorRequest = buildAudienceRequestFromMatchSeed(seed, "creator");
    const coachRequest = buildAudienceRequestFromMatchSeed(seed, "coach");

    expect(creatorRequest.matchId).toBe("8724913167");
    expect(creatorRequest.mode).toBe("content-breakdown");
    expect(creatorRequest.focusQuestion).toContain("故事线");
    expect(coachRequest.mode).toBe("team-review");
    expect(coachRequest.timeline[1]?.time).toBe("27:23");
  });
});
