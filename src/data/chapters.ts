// Source of truth for the /curriculum card grid.
// Titles/outcomes from 02-curriculum/curriculum-v1.1.md via 06b chapters.yaml.
// Tier letters: A = AI off, B = foundation, C = AI default.

export type Tier = "A" | "B" | "C";

export interface Chapter {
  num: number;
  tag: "ASYNC" | "DEEP DIVE" | null;
  title: string;
  outcome: string;
  tiers: Tier[];
  duration: string;
  hero?: boolean;
}

export const chapters: Chapter[] = [
  {
    num: 0,
    tag: "ASYNC",
    title: "Pre-class Setup",
    outcome: "Install + verify before Class 1",
    tiers: ["A"],
    duration: "~45-60 min, async",
    hero: true,
  },
  {
    num: 1,
    tag: null,
    title: "Foundation + Mental Model",
    outcome: "First Tour Repo PR · meet cohort",
    tiers: ["A", "B"],
    duration: "2 sessions · 4 hours",
  },
  {
    num: 2,
    tag: "DEEP DIVE",
    title: "Claude Code Deep Dive",
    outcome: "Permission modes · CLAUDE.md · costs · prompting",
    tiers: ["B", "C"],
    duration: "2 sessions · 4 hours",
  },
  {
    num: 3,
    tag: null,
    title: "Team Formation + Project Kickoff",
    outcome: "3 teams of 3 · working agreements · pitch",
    tiers: ["A", "B", "C"],
    duration: "2 sessions · 4 hours",
  },
  {
    num: 4,
    tag: null,
    title: "Context Expansion Ecosystem",
    outcome: "MCP · Context7 · claude-mem · custom MCPs",
    tiers: ["B", "C"],
    duration: "2 sessions · 4 hours",
  },
  {
    num: 5,
    tag: null,
    title: "Workflow + Capability + Optimization",
    outcome: "Skills · Subagents · methodologies · SDK · hooks",
    tiers: ["B", "C"],
    duration: "2 sessions · 4 hours",
  },
  {
    num: 6,
    tag: null,
    title: "Polish + Deployment",
    outcome: "Going live · real URL · security audit",
    tiers: ["A", "B", "C"],
    duration: "2 sessions · 4 hours",
  },
  {
    num: 7,
    tag: null,
    title: "Tool Landscape + Build Sprint",
    outcome: "Beyond Claude · Cursor · Copilot · Aider",
    tiers: ["A", "B", "C"],
    duration: "2 sessions · 4 hours",
  },
  {
    num: 8,
    tag: null,
    title: "Demo Day + Community",
    outcome: "Show what you built · reflect · continue",
    tiers: ["A", "B"],
    duration: "2 sessions · 4 hours",
  },
];
