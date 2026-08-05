import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getProjects,
  typeBuckets,
  teamBuckets,
  stackList,
  TYPE_LABELS,
} from "./projects.mjs";

test("getProjects loads and sorts by name", () => {
  const p = getProjects();
  assert.ok(p.length >= 3);
  assert.deepEqual(
    [...p].map((c) => c.name),
    [...p].map((c) => c.name).sort((a, b) => a.localeCompare(b)),
  );
});

test("every card has required fields + valid type", () => {
  for (const c of getProjects()) {
    assert.ok(c.github && c.title && c.repo_url, "core fields present");
    assert.ok(TYPE_LABELS[c.type], `type ${c.type} has a label`);
    assert.ok(Array.isArray(c.stack));
  }
});

test("getProjects normalises team to a number or null", () => {
  for (const c of getProjects()) {
    assert.ok(c.team === null || (Number.isInteger(c.team) && c.team > 0));
  }
});

test("teamBuckets counts per team, ascending, skipping teamless cards", () => {
  const b = teamBuckets([
    { team: 5 },
    { team: 1 },
    { team: 5 },
    { team: null },
    {},
  ]);
  assert.deepEqual(b, [
    { team: 1, count: 1 },
    { team: 5, count: 2 },
  ]);
  assert.deepEqual(teamBuckets([]), []);
});

test("typeBuckets + stackList are counted desc", () => {
  const cards = getProjects();
  const tb = typeBuckets(cards);
  assert.ok(tb.length >= 1 && tb[0].count >= tb[tb.length - 1].count);
  const sl = stackList(cards);
  assert.ok(sl.every((s) => s.name && s.count > 0));
});
