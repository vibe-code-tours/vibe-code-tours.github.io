import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sortCards,
  parseFilterQuery,
  serializeFilterQuery,
  stackDisplay,
  shotCount,
} from "./gallery-filter.mjs";

test("sortCards chapter desc, stable by order", () => {
  const cells = [
    { chapter: 2, title: "b", order: 0 },
    { chapter: 5, title: "a", order: 1 },
    { chapter: 2, title: "c", order: 2 },
  ];
  assert.deepEqual(
    sortCards(cells, "chapter").map((c) => c.title),
    ["a", "b", "c"],
  );
});

test("sortCards az by title, case-insensitive", () => {
  const cells = [
    { title: "Beta", order: 0 },
    { title: "alpha", order: 1 },
  ];
  assert.deepEqual(
    sortCards(cells, "az").map((c) => c.title),
    ["alpha", "Beta"],
  );
});

test("URL query round-trips non-default state", () => {
  const state = {
    active: { type: "cli", stack: "*" },
    query: "bot",
    sort: "az",
  };
  const q = serializeFilterQuery(state);
  const back = parseFilterQuery("?" + q);
  assert.equal(back.active.type, "cli");
  assert.equal(back.query, "bot");
  assert.equal(back.sort, "az");
});

test("serialize omits defaults", () => {
  assert.equal(
    serializeFilterQuery({ active: { type: "*" }, query: "", sort: "chapter" }),
    "",
  );
});

test("stackDisplay caps at max with extra count", () => {
  assert.deepEqual(stackDisplay(["a", "b", "c", "d", "e"], 3), {
    shown: ["a", "b", "c"],
    extra: 2,
  });
  assert.deepEqual(stackDisplay(["a"], 3), { shown: ["a"], extra: 0 });
  assert.deepEqual(stackDisplay(undefined, 3), { shown: [], extra: 0 });
});

test("shotCount handles missing", () => {
  assert.equal(shotCount(["a", "b"]), 2);
  assert.equal(shotCount(null), 0);
});

test("per-gallery default sort: team omitted when it's the default", () => {
  assert.equal(
    serializeFilterQuery({ active: {}, query: "", sort: "team" }, "team"),
    "",
  );
  assert.equal(parseFilterQuery("", "team").sort, "team");
});
