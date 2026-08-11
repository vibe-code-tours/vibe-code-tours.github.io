# Add Yourself as a Builder

Your **first real Pull Request** — the workflow open source runs on.
You fork this site, add a file about yourself, and open a PR. Once merged, your
card appears on [vibecode.tours/cohort/1](https://vibecode.tours/cohort/1).

> 🇲🇲 မြန်မာဘာသာ အောက်မှာ ဖတ်ပါ ([Myanmar version below](#မြန်မာ-လမ်းညွှန်)).

---

## What you'll do

```
Fork → Clone → Branch → Add your file → Commit → Push → Pull Request
```

This is exactly how developers contribute to open-source projects. No shortcuts —
the real thing, with guardrails (CI checks your file, an instructor reviews, then merges).

---

## Steps (English)

### 1. Fork this repo

Click **Fork** (top-right of the GitHub page). This makes your own copy under your account.

### 2. Clone your fork

```bash
git clone https://github.com/<your-username>/vibe-code-tours.github.io.git
cd vibe-code-tours.github.io
```

### 3. Make a branch

```bash
git checkout -b intro/<your-username>
```

### 4. Add your file

Copy the example and rename it to your **GitHub username**:

```bash
cp src/content/builders/_example.md src/content/builders/<your-username>.md
```

Edit `src/content/builders/<your-username>.md`:

```markdown
---
name: Your Name
github: your-username
cohort: 1
role: builder
skills: ["JavaScript", "Python", "Claude Code"]
repo: https://github.com/your-username/your-project
x: your-x-handle
linkedin: your-linkedin-username
website: https://your-site.com
---

Hi! 2–3 sentences about you — why you're here, what you want to build.
```

Only `name`, `github`, `cohort` are required. `skills`, `repo`, `x`,
`linkedin`, `website` are optional — delete any you don't want shown.
Social fields accept a handle (`kokoye2007`) or a full URL.

**Rules:**

- Filename **must match** your `github:` value (e.g. `kokoye2007.md` → `github: kokoye2007`)
- `name`, `github`, `cohort` are required. `repo` is optional.
- **No photo needed** — your GitHub avatar is pulled automatically.
- `role`: leave as `builder` (mentors/instructors set their own).

### 4b. Add your certificates (optional)

Finished a Claude course? Add a `certs:` block and the badge lights up amber on
your card. Two rules: it goes **under `certs:`, indented 2 spaces**, and you use
the **short id** — not the course title.

```yaml
certs:
  claude_101: 293x3v9qydhx
  claude_code_101: https://verify.skilljar.com/c/sbdx5cwzjhec
  agent_skills_intro: https://verify.skilljar.com/c/kfnmyubu3i96
```

The value is either the bare Skilljar code or the full verify URL — both work.
Find it on your certificate page: the link ends in `/c/<your-code>`.

**Short id for every cert we track:**

| Course name (as shown on Skilljar)     | Short id to write          |
| -------------------------------------- | -------------------------- |
| Claude 101                             | `claude_101`               |
| Claude Code 101                        | `claude_code_101`          |
| Introduction to Agent Skills           | `agent_skills_intro`       |
| Introduction to Subagents              | `subagents_intro`          |
| Introduction to Model Context Protocol | `mcp_intro`                |
| Claude Code in Action                  | `claude_code_in_action`    |
| Building with the Claude API           | `building_claude_api`      |
| Claude Platform 101                    | `claude_platform_101`      |
| Introduction to Claude Cowork          | `claude_cowork`            |
| MCP: Advanced Topics                   | `mcp_advanced`             |
| Claude with Amazon Bedrock             | `claude_bedrock`           |
| Claude with Vertex AI                  | `claude_vertex`            |
| AI Fluency: Framework & Foundations    | `ai_fluency`               |
| AI Fluency for Educators               | `ai_fluency_for_educators` |
| GitHub Foundations (Credly)            | `github_foundations`       |
| Git Essential Training (LinkedIn)      | `git_essential_training`   |

Non-Skilljar certs (GitHub Foundations, Git Essential Training) use the full
public verify URL as the value — Credly badge link, LinkedIn certificate link.

> **Wrote the course title instead?** It still works. `Introduction to subagents`,
> `introduction-to-subagents`, and `subagents_intro` all resolve to the same badge —
> case, spaces, and hyphens don't matter. CI will just nudge you toward the short
> id. What does **not** work is putting cert ids at the top level instead of under
> `certs:` — those are silently ignored.

### 5. Commit

```bash
git add src/content/builders/<your-username>.md
git commit -m "add <your-username> to cohort 1"
```

### 6. Push to your fork

```bash
git push origin intro/<your-username>
```

### 7. Open a Pull Request

Go to your fork on GitHub → click **Compare & pull request** → submit.

✅ CI checks your file builds. An instructor reviews and merges. Your card goes live.

---

## Troubleshooting

| Problem                  | Fix                                                               |
| ------------------------ | ----------------------------------------------------------------- |
| CI fails "missing field" | Check `name`, `github`, `cohort` all present in frontmatter       |
| CI fails build           | Frontmatter must be valid — keep the `---` lines, no tabs         |
| Avatar not showing       | Make sure `github:` is your exact username                        |
| Touched other files      | Only add YOUR `src/content/builders/<username>.md` — nothing else |

Stuck? Ask in the cohort channel. Getting stuck and asking is part of learning.

---

# မြန်မာ လမ်းညွှန်

သင့်ရဲ့ **ပထမဆုံး တကယ့် Pull Request** — open source မှာ developer တွေ
လုပ်နေကျ workflow အတိုင်း။ ဒီ site ကို fork လုပ်၊ ကိုယ့်အကြောင်း file တစ်ခု ထည့်၊
PR ဖွင့်ပါ။ Merge ပြီးတာနဲ့ သင့် card က
[vibecode.tours/cohort/1](https://vibecode.tours/cohort/1) မှာ ပေါ်လာပါမယ်။

## အဆင့်များ

### ၁။ ဒီ repo ကို Fork လုပ်ပါ

GitHub စာမျက်နှာ ညာဘက်အပေါ်က **Fork** ကို နှိပ်ပါ။ သင့် account အောက်မှာ
ကိုယ်ပိုင် copy တစ်ခု ရလာပါမယ်။

### ၂။ သင့် fork ကို Clone လုပ်ပါ

```bash
git clone https://github.com/<your-username>/vibe-code-tours.github.io.git
cd vibe-code-tours.github.io
```

### ၃။ Branch ဖွဲ့ပါ

```bash
git checkout -b intro/<your-username>
```

### ၄။ ကိုယ့် file ထည့်ပါ

နမူနာ file ကို copy ကူးပြီး သင့် **GitHub username** နဲ့ အမည်ပြောင်းပါ —

```bash
cp src/content/builders/_example.md src/content/builders/<your-username>.md
```

`src/content/builders/<your-username>.md` ကို ပြင်ပါ —

```markdown
---
name: သင့်နာမည်
github: your-username
cohort: 1
role: builder
skills: ["JavaScript", "Python", "Claude Code"]
repo: https://github.com/your-username/your-project
x: your-x-handle
linkedin: your-linkedin-username
website: https://your-site.com
---

ဟိုင်း! ကိုယ့်အကြောင်း ၂–၃ ကြောင်း — ဘာကြောင့် ပါဝင်ချင်တာလဲ၊ ဘာ build ချင်လဲ။
```

`name`, `github`, `cohort` သာ မဖြစ်မနေ လိုအပ်တယ်။ `skills`, `repo`, `x`,
`linkedin`, `website` က optional — မလိုတာ ဖျက်လို့ရတယ်။ Social field တွေက
handle (`kokoye2007`) ဒါမှမဟုတ် URL အပြည့် လက်ခံတယ်။

**စည်းမျဉ်းများ —**

- File name က သင့် `github:` တန်ဖိုးနဲ့ **တူရမယ်** (ဥပမာ `kokoye2007.md` → `github: kokoye2007`)
- `name`, `github`, `cohort` မဖြစ်မနေ လိုအပ်တယ်။ `repo` က optional။
- **ဓာတ်ပုံ မလိုပါ** — သင့် GitHub avatar ကို အလိုအလျောက် ဆွဲယူပါမယ်။
- `role` ကို `builder` အတိုင်း ထားပါ။

### ၄-ခ။ လက်မှတ် (certificate) ထည့်ခြင်း — optional

Claude သင်တန်း ပြီးထားပြီလား? `certs:` block ထည့်လိုက်ရင် သင့် card ပေါ်မှာ
badge က အဝါရောင် လင်းလာပါမယ်။ စည်းမျဉ်း နှစ်ခုပဲ ရှိတယ် — `certs:` **အောက်မှာ
space ၂ လုံး ခြားပြီး** ရေးရမယ်၊ ပြီးတော့ သင်တန်းနာမည်အပြည့် မဟုတ်ဘဲ
**short id** ကို သုံးရမယ်။

```yaml
certs:
  claude_101: 293x3v9qydhx
  claude_code_101: https://verify.skilljar.com/c/sbdx5cwzjhec
  agent_skills_intro: https://verify.skilljar.com/c/kfnmyubu3i96
```

တန်ဖိုးက Skilljar code သက်သက်ဖြစ်ဖြစ်၊ verify URL အပြည့်ဖြစ်ဖြစ် ရပါတယ် —
နှစ်မျိုးလုံး အလုပ်လုပ်တယ်။ သင့် certificate စာမျက်နှာမှာ link အဆုံးက
`/c/<your-code>` ဆိုတာ ရှာပါ။

**Cert တိုင်းအတွက် short id —**

| သင်တန်းနာမည် (Skilljar မှာ ပြထားသည့်အတိုင်း) | ရေးရမည့် short id          |
| -------------------------------------------- | -------------------------- |
| Claude 101                                   | `claude_101`               |
| Claude Code 101                              | `claude_code_101`          |
| Introduction to Agent Skills                 | `agent_skills_intro`       |
| Introduction to Subagents                    | `subagents_intro`          |
| Introduction to Model Context Protocol       | `mcp_intro`                |
| Claude Code in Action                        | `claude_code_in_action`    |
| Building with the Claude API                 | `building_claude_api`      |
| Claude Platform 101                          | `claude_platform_101`      |
| Introduction to Claude Cowork                | `claude_cowork`            |
| MCP: Advanced Topics                         | `mcp_advanced`             |
| Claude with Amazon Bedrock                   | `claude_bedrock`           |
| Claude with Vertex AI                        | `claude_vertex`            |
| AI Fluency: Framework & Foundations          | `ai_fluency`               |
| AI Fluency for Educators                     | `ai_fluency_for_educators` |
| GitHub Foundations (Credly)                  | `github_foundations`       |
| Git Essential Training (LinkedIn)            | `git_essential_training`   |

Skilljar မဟုတ်တဲ့ cert တွေ (GitHub Foundations, Git Essential Training) ကတော့
verify URL အပြည့် — Credly badge link ဒါမှမဟုတ် LinkedIn certificate link —
ကို တန်ဖိုးအဖြစ် ထည့်ပါ။

> **သင်တန်းနာမည်အပြည့် ရေးမိပြီလား?** ရပါတယ်၊ အလုပ်လုပ်ပါတယ်။
> `Introduction to subagents`၊ `introduction-to-subagents`၊ `subagents_intro`
> သုံးခုလုံး badge တစ်ခုတည်းကို ညွှန်ပါတယ် — စာလုံးအကြီးအသေး၊ space၊ hyphen
> အရေးမကြီးပါ။ CI က short id သုံးဖို့ သတိပေးရုံပါပဲ။ **အလုပ်မလုပ်တာ** ကတော့
> cert id တွေကို `certs:` အောက်မှာ မထားဘဲ အပေါ်ဆုံး အဆင့်မှာ ထားလိုက်တာ —
> အဲဒါဆို တိတ်တိတ်ဆိတ်ဆိတ် ပျောက်သွားပါလိမ့်မယ်။

### ၅။ Commit

```bash
git add src/content/builders/<your-username>.md
git commit -m "add <your-username> to cohort 1"
```

### ၆။ သင့် fork ကို Push

```bash
git push origin intro/<your-username>
```

### ၇။ Pull Request ဖွင့်ပါ

GitHub မှာ သင့် fork ကို သွား → **Compare & pull request** နှိပ် → တင်ပါ။

✅ CI က သင့် file ကို စစ်ပါမယ်။ Instructor က review လုပ်ပြီး merge လုပ်ပါမယ်။
သင့် card live ဖြစ်သွားပါမယ်။

---

**License:** By submitting, you agree your intro is published publicly under the
site's [CC-BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) content license.
