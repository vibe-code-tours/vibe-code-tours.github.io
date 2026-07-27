import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_SVG_BYTES,
  logoVariants,
  pickLogo,
  prefixLogo,
  loadTeamMeta,
  mergeTeamMeta,
} from "./team-meta.mjs";

test("logoVariants finds the files a team actually shipped", () => {
  // team-01 shipped only the 64px png; the yaml stub claims 128/256 too.
  const one = logoVariants(1);
  assert.equal(one.small, "/logos/team-01-64x64.png");
  assert.equal(one.medium, null);
  assert.equal(one.large, null);
  assert.equal(one.svg, null);

  // team-03 shipped the full set including a small svg.
  const three = logoVariants(3);
  assert.equal(three.svg, "/logos/team-03.svg");
  assert.equal(three.small, "/logos/team-03-64x64.png");
  assert.equal(three.medium, "/logos/team-03-128x128.png");
  assert.equal(three.large, "/logos/team-03-256x256.png");
});

test("logoVariants drops an svg too heavy to serve as a badge", () => {
  // team-06 ships a 1.8 MB traced svg — the pngs are the honest choice.
  const six = logoVariants(6);
  assert.equal(six.svg, null);
  assert.equal(six.small, "/logos/team-06-64x64.png");
  assert.ok(MAX_SVG_BYTES > 0);
});

test("pickLogo prefers vector, then the requested size, then a neighbour", () => {
  const full = {
    svg: "/s.svg",
    small: "/64.png",
    medium: "/128.png",
    large: "/256.png",
  };
  assert.equal(pickLogo(full, "small"), "/s.svg");

  const pngs = { svg: null, small: "/64.png", medium: null, large: "/256.png" };
  assert.equal(pickLogo(pngs, "small"), "/64.png");
  assert.equal(pickLogo(pngs, "medium"), "/256.png");
  assert.equal(pickLogo(pngs, "large"), "/256.png");

  const only64 = { svg: null, small: "/64.png", medium: null, large: null };
  assert.equal(pickLogo(only64, "large"), "/64.png");

  assert.equal(pickLogo({}, "small"), null);
  assert.equal(pickLogo(null, "small"), null);
});

test("prefixLogo applies the site base to every variant", () => {
  const logo = {
    svg: null,
    small: "/logos/a.png",
    medium: null,
    large: null,
  };
  const out = prefixLogo(logo, "/vibe-code-tours-site");
  assert.equal(out.small, "/vibe-code-tours-site/logos/a.png");
  assert.equal(out.medium, null);
  assert.equal(prefixLogo(logo, "").small, "/logos/a.png");
  assert.equal(prefixLogo(null, "/x"), null);
});

test("loadTeamMeta reads every metadata/team-NN.yaml", () => {
  const map = loadTeamMeta();
  assert.ok(map.size >= 20, `expected 20 team yamls, got ${map.size}`);
  const one = map.get(1);
  assert.equal(one.team, "Team-01");
  assert.equal(one.title, "Yay Thal Pya Zat");
  // video: is a nested map in the yaml; it must arrive flattened.
  assert.equal(one.youtube_id, "PgkMgBNo_CQ");
  assert.ok(one.drive_id, "drive_id derived from drive_url");
  // Empty tagline must not survive as "" and shadow the json fallback.
  assert.ok(!("tagline" in one) || one.tagline);
  assert.equal(one.logo.small, "/logos/team-01-64x64.png");
});

test("mergeTeamMeta lets non-empty yaml win and keeps json for the rest", () => {
  const teams = [
    {
      team_no: 1,
      team: "Team-01",
      title: "Old title",
      desc: "Old desc",
      live_url: "https://old.example",
      repo_url: "https://github.com/o/r",
      type: "api",
      stack: ["Astro"],
    },
  ];
  const meta = new Map([
    [
      1,
      {
        title: "New title",
        tagline: "Pitch line",
        logo: { svg: null, small: "/logos/team-01-64x64.png" },
      },
    ],
  ]);
  const [t] = mergeTeamMeta(teams, meta);
  assert.equal(t.title, "New title");
  assert.equal(t.tagline, "Pitch line");
  assert.equal(t.desc, "Old desc");
  assert.equal(t.live_url, "https://old.example");
  assert.deepEqual(t.stack, ["Astro"]);
  assert.equal(t.logo.small, "/logos/team-01-64x64.png");
});

test("mergeTeamMeta leaves a team with no yaml untouched", () => {
  const teams = [{ team_no: 99, title: "Ghost", type: "api" }];
  const [t] = mergeTeamMeta(teams, new Map());
  assert.equal(t.title, "Ghost");
  assert.equal(t.logo, null);
});
