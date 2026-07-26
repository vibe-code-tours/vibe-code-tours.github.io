import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CERT_ALIASES,
  CERT_CATALOG,
  canonicalCertId,
  certUrl,
  normalizeCerts,
  slugifyCertId,
} from "./certs.mjs";

// Every one of these is a real key a builder pushed to src/content/builders.
const REAL_WORLD = {
  "Introduction to agent skills": "agent_skills_intro",
  "introduction-to-agent-skills": "agent_skills_intro",
  introduction_to_agent_skills: "agent_skills_intro",
  agent_skills: "agent_skills_intro",
  "Introduction to subagents": "subagents_intro",
  introduction_to_subagents: "subagents_intro",
  introduction_to_Model_Context_Protocol: "mcp_intro",
  introduction_to_model_context_protocol: "mcp_intro",
  "AI Fluency Framework and Foundations": "ai_fluency",
  "AI_fluency_framework_&_foundations": "ai_fluency",
  "Claude_Platform 101": "claude_platform_101",
  "claude-code-in-action": "claude_code_in_action",
};

test("slugifyCertId folds case, spaces, hyphens and punctuation", () => {
  assert.equal(
    slugifyCertId("Introduction to agent skills"),
    "introduction_to_agent_skills",
  );
  assert.equal(
    slugifyCertId("AI_fluency_framework_&_foundations"),
    "ai_fluency_framework_foundations",
  );
  assert.equal(
    slugifyCertId("  claude-code-in-action  "),
    "claude_code_in_action",
  );
  assert.equal(slugifyCertId(""), "");
  assert.equal(slugifyCertId(null), "");
});

test("canonicalCertId resolves every id builders have actually written", () => {
  for (const [raw, expected] of Object.entries(REAL_WORLD)) {
    assert.equal(canonicalCertId(raw), expected, `${raw} -> ${expected}`);
  }
});

test("canonicalCertId resolves catalog labels (layer 3, auto-derived)", () => {
  assert.equal(canonicalCertId("Intro to MCP"), "mcp_intro");
  assert.equal(
    canonicalCertId("Building with the Claude API"),
    "building_claude_api",
  );
  assert.equal(canonicalCertId("Claude with Amazon Bedrock"), "claude_bedrock");
  assert.equal(canonicalCertId("GitHub Foundations"), "github_foundations");
});

test("canonicalCertId leaves an unknown cert alone (slugified, still renders)", () => {
  assert.equal(canonicalCertId("Some Other Course"), "some_other_course");
});

test("every alias target is a real catalog id", () => {
  for (const [alias, target] of Object.entries(CERT_ALIASES)) {
    assert.ok(
      CERT_CATALOG[target],
      `alias '${alias}' -> unknown id '${target}'`,
    );
    assert.equal(
      slugifyCertId(alias),
      alias,
      `alias key '${alias}' is not slugified`,
    );
    assert.ok(!CERT_CATALOG[alias], `alias '${alias}' shadows a catalog id`);
  }
});

test("catalog orders are unique", () => {
  const orders = Object.values(CERT_CATALOG).map((m) => m.order);
  assert.equal(new Set(orders).size, orders.length);
});

test("normalizeCerts canonicalizes ids and keeps Skilljar codes", () => {
  const out = normalizeCerts({
    "Introduction to subagents": "https://verify.skilljar.com/c/qaadufpgkrma",
    introduction_to_Model_Context_Protocol: "g9t775dpv6bj",
  });
  assert.deepEqual(out, {
    subagents_intro: "qaadufpgkrma",
    mcp_intro: "g9t775dpv6bj",
  });
});

test("normalizeCerts keeps a non-Skilljar verify URL intact", () => {
  const url =
    "https://www.linkedin.com/learning/certificates/ed41dc0684c8?trk=share_certificate";
  const out = normalizeCerts({ git_essential_training: url });
  assert.deepEqual(out, { git_essential_training: url });
  assert.equal(certUrl(url), url);
});

test("normalizeCerts prefers the canonical spelling when a cert is listed twice", () => {
  const out = normalizeCerts({
    "Introduction to subagents": "mnkwxrfjaxyq",
    subagents_intro: "qaadufpgkrma",
  });
  assert.deepEqual(out, { subagents_intro: "qaadufpgkrma" });
});

test("normalizeCerts drops entries with no usable code", () => {
  assert.equal(normalizeCerts({ claude_101: "" }), undefined);
  assert.equal(normalizeCerts({ claude_101: "<skilljar-code>" }), undefined);
  assert.equal(normalizeCerts(null), undefined);
  assert.equal(normalizeCerts(["claude_101"]), undefined);
});

test("normalizeCerts rejects template placeholder codes (fake 'verified' badge)", () => {
  assert.equal(
    normalizeCerts({
      claude_code_101: "https://verify.skilljar.com/c/YYYYYYYY",
    }),
    undefined,
  );
  assert.equal(normalizeCerts({ claude_101: "XXXXXXXX" }), undefined);
  assert.equal(normalizeCerts({ claude_101: "000000" }), undefined);
  // A real code that happens to repeat a character is still fine.
  assert.deepEqual(normalizeCerts({ claude_101: "bqxyfumtey2e" }), {
    claude_101: "bqxyfumtey2e",
  });
});
