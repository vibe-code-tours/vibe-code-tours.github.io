import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getTeams,
  typeBuckets,
  statusBuckets,
  hasVideo,
  teamTag,
  teamTitles,
} from "./teams.mjs";

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

test("getTeams carries the metadata logo through to the gallery", () => {
  const teams = getTeams();
  for (const t of teams) {
    assert.ok(t.logo, `${t.team} lost its logo variants`);
    assert.ok(
      t.logo.svg || t.logo.small || t.logo.medium || t.logo.large,
      `${t.team} resolved no logo file`,
    );
  }
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

test("teamTag zero-pads to the roster's T0N form", () => {
  assert.equal(teamTag(1), "T01");
  assert.equal(teamTag(20), "T20");
  assert.equal(teamTag(0), null);
  assert.equal(teamTag(null), null);
  assert.equal(teamTag(undefined), null);
});

test("teamTitles maps every team_no to its project title", () => {
  const m = teamTitles();
  const teams = getTeams();
  assert.equal(m.size, teams.length);
  for (const t of teams) assert.equal(m.get(t.team_no), t.title);
});
