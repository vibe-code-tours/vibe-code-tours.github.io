import { test } from "node:test";
import assert from "node:assert/strict";
import { getTeams, typeBuckets, statusBuckets, hasVideo } from "./teams.mjs";

test("getTeams returns validated, team_no-sorted list", () => {
  const teams = getTeams();
  assert.ok(Array.isArray(teams) && teams.length > 0);
  for (const t of teams) {
    assert.equal(typeof t.repo_url, "string");
    assert.equal(typeof t.title, "string");
  }
  const nos = teams.map((t) => t.team_no ?? 999);
  assert.deepEqual(
    nos,
    [...nos].sort((a, b) => a - b),
  );
});

test("statusBuckets counts live and done", () => {
  const b = statusBuckets(getTeams());
  const live = b.find((x) => x.status === "live");
  const done = b.find((x) => x.status === "done");
  assert.ok(live.count >= 0 && done.count >= 0);
});

test("hasVideo true when a video id exists", () => {
  assert.equal(hasVideo({ youtube_id: "abc" }), true);
  assert.equal(hasVideo({ drive_id: "x" }), true);
  assert.equal(hasVideo({ youtube_id: null, drive_id: null }), false);
});

test("typeBuckets sorted by count desc", () => {
  const b = typeBuckets(getTeams());
  for (let i = 1; i < b.length; i++) assert.ok(b[i - 1].count >= b[i].count);
});
