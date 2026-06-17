#!/usr/bin/env bash
# Vibe Code Tours — chapter doctor / self-check.
#
# Single chapter-aware script. Replaces old ch-0 doctor.sh and check-ch1.sh.
#
# Usage:
#   bash doctor.sh                  # default ch-0 (pre-class setup)
#   bash doctor.sh ch-0             # explicit ch-0
#   bash doctor.sh ch-1             # ch-1 homework (profile repo + PR)
#   bash doctor.sh ch-2             # ch-2 homework (proposal in team repo)
#
# Stages (all chapters):
#   1. detect platform (mac | wsl | linux)
#   2. detect claude install (linux | windows | both | none) — ch-0 prompts on conflict
#   3. version checks (node, npm, python, git, gh, claude)
#   4. gh auth + user + read probe
#   5. proxy probe (claude -p OR curl VIBE_PROXY)
#
# Chapter-specific:
#   ch-0: SVG badge card → drop PNG in #ch-0-intro → instructor ✅/👏 → ch-0-done
#   ch-N: posts gist → submit via /submit ch-N <gist-url> (ch-1 also checks profile+PR)
#
# Flags:
#   --non-interactive  default REPLACE on windows-claude conflict (ch-0)
#   --keep|--replace   force conflict resolution (ch-0)
#   --no-post          save report.md only, no gist post (ch-N)
#   --no-update        skip self-update check
#   --out DIR          output dir (default ~/.vibecode/doctor)
#
# Exit codes:
#   0  all green     1  hard fail     2  soft fail (proxy down)

set -u

# ---------- 0. self-update ----------
# doctor.sh updates itself from main so chapter checks can change mid-cohort.
# Skip with --no-update or DOCTOR_SKIP_UPDATE=1. Best-effort: offline = run as-is.
DOCTOR_URL="https://raw.githubusercontent.com/vibe-code-tours/vibecode-setup/main/doctor.sh"
case " $* " in *" --no-update "*) DOCTOR_SKIP_UPDATE=1 ;; esac
if [ "${DOCTOR_SKIP_UPDATE:-0}" != "1" ] && [ -f "$0" ] && grep -q "Vibe Code Tours" "$0" 2>/dev/null; then
  _upd_tmp=$(mktemp 2>/dev/null || echo /tmp/doctor-update.$$)
  if curl -fsSL --max-time 10 "$DOCTOR_URL" -o "$_upd_tmp" 2>/dev/null \
     && grep -q "Vibe Code Tours" "$_upd_tmp" 2>/dev/null \
     && bash -n "$_upd_tmp" 2>/dev/null \
     && ! cmp -s "$_upd_tmp" "$0"; then
    cp "$_upd_tmp" "$0" 2>/dev/null || true
    echo "doctor.sh updated from main — re-running..."
    DOCTOR_SKIP_UPDATE=1 exec bash "$_upd_tmp" "$@"
  fi
  rm -f "$_upd_tmp"
fi

# ---------- args ----------
CHAPTER="ch-0"
if [ $# -gt 0 ] && [[ "$1" =~ ^ch-[0-9]+$ ]]; then CHAPTER="$1"; shift; fi
NONINT=0; KEEP=0; REPLACE=0; OUTDIR="${HOME}/.vibecode/doctor"; NO_POST=0
while [ $# -gt 0 ]; do
  case "$1" in
    --non-interactive) NONINT=1 ;;
    --keep)            KEEP=1 ;;
    --replace)         REPLACE=1 ;;
    --no-post)         NO_POST=1 ;;
    --no-update)       : ;;
    --chapter)         CHAPTER="$2"; shift ;;
    --out)             OUTDIR="$2"; shift ;;
    -h|--help)         sed -n '2,30p' "$0"; exit 0 ;;
    *) echo "unknown flag: $1" >&2; exit 1 ;;
  esac
  shift
done

mkdir -p "$OUTDIR"
TS="$(date +%Y%m%d-%H%M%S)"
JSON="$OUTDIR/${CHAPTER}-results-$TS.json"
MD="$OUTDIR/${CHAPTER}-report-$TS.md"
SVG="$OUTDIR/${CHAPTER}-report-$TS.svg"
PNG="$OUTDIR/${CHAPTER}-report-$TS.png"
TXT="$OUTDIR/${CHAPTER}-report-$TS.txt"
WEBSITE_REPO="vibe-code-tours/vibe-code-tours.github.io"
GH_ORG="vibe-code-tours"
TEMPLATE_URL="https://raw.githubusercontent.com/vibe-code-tours/vibecode-setup/main/card-template.svg"
KEYFILE="${VIBE_KEYFILE:-vibe-key.env}"

# ---------- ui ----------
c_reset=$'\033[0m'; c_dim=$'\033[2m'
c_ok=$'\033[32m'; c_warn=$'\033[33m'; c_err=$'\033[31m'; c_bold=$'\033[1m'
ok()   { printf '  %s✅%s %s\n' "$c_ok"   "$c_reset" "$*"; }
warn() { printf '  %s⚠ %s%s\n'  "$c_warn" "$c_reset" "$*"; }
fail() { printf '  %s❌%s %s\n' "$c_err"  "$c_reset" "$*"; }
hr()   { printf '%s──────────────────────────────────────────────%s\n' "$c_dim" "$c_reset"; }
say()  { printf '%s%s%s\n' "$c_bold" "$*" "$c_reset"; }
have() { command -v "$1" >/dev/null 2>&1; }

# ---------- load vibe-key.env (for proxy curl fallback) ----------
# shellcheck source=/dev/null
if [ -f "$KEYFILE" ]; then set -a; . "$KEYFILE" 2>/dev/null; set +a; fi
VIBE_PROXY="${VIBE_PROXY:-}"; VIBE_KEY="${VIBE_KEY:-}"

# ---------- 1. platform ----------
PLATFORM=linux
if [ "$(uname -s)" = "Darwin" ]; then PLATFORM=mac
elif grep -qiE 'microsoft|wsl' /proc/version 2>/dev/null; then PLATFORM=wsl
fi
say "Vibe Code Doctor — $CHAPTER"; hr
echo "  platform: $PLATFORM"

# ---------- 2. claude location ----------
CLAUDE_LINUX=""; CLAUDE_WIN=""; CLAUDE_LOC=none
if have claude; then
  bin="$(command -v claude)"
  case "$bin" in
    /mnt/c/*|*/AppData/*|*.exe|*.cmd) CLAUDE_WIN="$bin"; CLAUDE_LOC=windows ;;
    *)                                CLAUDE_LINUX="$bin"; CLAUDE_LOC=linux ;;
  esac
fi
if [ "$PLATFORM" = "wsl" ]; then
  for p in "/mnt/c/Users/$USER/AppData/Roaming/npm/claude.cmd" \
           "/mnt/c/Program Files/nodejs/claude.cmd" \
           "$(wslpath "$(cmd.exe /c 'echo %USERPROFILE%' 2>/dev/null | tr -d '\r')\\AppData\\Roaming\\npm\\claude.cmd" 2>/dev/null)"; do
    [ -n "$p" ] && [ -f "$p" ] && { CLAUDE_WIN="$p"; break; }
  done
  if [ -n "$CLAUDE_LINUX" ] && [ -n "$CLAUDE_WIN" ]; then CLAUDE_LOC=both
  elif [ -n "$CLAUDE_WIN" ] && [ -z "$CLAUDE_LINUX" ]; then CLAUDE_LOC=windows
  fi
fi
echo "  claude:   $CLAUDE_LOC${CLAUDE_LINUX:+  linux=$CLAUDE_LINUX}${CLAUDE_WIN:+  win=$CLAUDE_WIN}"
hr

# ---------- 2b. conflict resolution (ch-0 only) ----------
CHOICE=skip
if [ "$CHAPTER" = "ch-0" ] && [ "$CLAUDE_LOC" = "both" ]; then
  warn "windows-native AND wsl claude both installed — config drift risk"
  echo "    cohort recommends WSL-native only"
  if [ "$REPLACE" = "1" ] || [ "$NONINT" = "1" ]; then CHOICE=replace
  elif [ "$KEEP" = "1" ]; then CHOICE=keep
  else
    echo
    echo "    [R] REPLACE — uninstall windows, install in WSL (recommended)"
    echo "    [K] KEEP    — leave windows, route proxy to Windows .claude/"
    echo "    [S] SKIP    — keep both, accept risk"
    printf "    pick [R/K/S] (default R): "
    read -r ans
    case "${ans:-R}" in r|R) CHOICE=replace ;; k|K) CHOICE=keep ;; *) CHOICE=skip ;; esac
  fi
  echo "    choice: $CHOICE"
  case "$CHOICE" in
    replace)
      echo "    uninstalling windows-native claude…"
      if have powershell.exe; then
        powershell.exe -NoProfile -Command "npm uninstall -g @anthropic-ai/claude-code" 2>/dev/null || warn "uninstall returned non-zero"
      elif have cmd.exe; then
        cmd.exe /c "npm uninstall -g @anthropic-ai/claude-code" 2>/dev/null || warn "uninstall returned non-zero"
      else
        warn "no powershell/cmd — uninstall windows claude manually:"
        echo "      (in Windows) npm uninstall -g @anthropic-ai/claude-code"
      fi
      CLAUDE_WIN=""; CLAUDE_LOC=linux ;;
    keep) ok "keeping windows claude (proxy config will target Windows .claude/)" ;;
    skip) warn "skip — both installs left in place" ;;
  esac
fi

# ---------- 3. versions ----------
say "Versions"; hr
checks_pass=0; checks_total=0
record_check() {
  local name="$1" cmd="$2" want="$3"
  local out
  if out="$($cmd 2>&1)" && echo "$out" | grep -qE "$want"; then
    printf '  \033[32m✅\033[0m %s: %s\n' "$name" "$(echo "$out" | head -1)" >&2
    echo "ok"
  else
    printf '  \033[31m❌\033[0m %s: %s\n' "$name" "${out:-<missing>}" >&2
    echo "fail"
  fi
}
score_check() { checks_total=$((checks_total+1)); [ "$1" = "ok" ] && checks_pass=$((checks_pass+1)); }

NODE_R=$(record_check "node"   "node --version"     "^v(22|23|24)\.");           score_check "$NODE_R"
NPM_R=$(record_check  "npm"    "npm --version"      "^(1[0-9]|2[0-9])\.");        score_check "$NPM_R"
PY_R=$(record_check   "python" "python3 --version"  "^Python 3\.(12|13|14)\.");  score_check "$PY_R"
GIT_R=$(record_check  "git"    "git --version"      "git version 2\.");           score_check "$GIT_R"
GH_R=$(record_check   "gh"     "gh --version"       "gh version (2\.[4-9][0-9]|[3-9])"); score_check "$GH_R"
CL_R=$(record_check   "claude" "claude --version"   "^[0-9]");                     score_check "$CL_R"

# ---------- 4. github ----------
say "GitHub"; hr
GH_USER=""; GH_AUTH=fail; GH_PR=fail
if have gh && gh auth status >/dev/null 2>&1; then
  GH_AUTH=ok
  GH_USER="$(gh api user --jq .login 2>/dev/null || true)"
  # lowercased login for filename guidance (GitHub logins are case-insensitive;
  # team.yml + CI use lowercase, so suggest a lowercase proposal filename).
  GH_USER_LC="$(printf '%s' "$GH_USER" | tr '[:upper:]' '[:lower:]')"
  if [ -n "$GH_USER" ]; then ok "auth: $GH_USER"; else warn "auth ok but /user empty"; fi
  if gh pr list --repo cli/cli --limit 1 >/dev/null 2>&1; then GH_PR=ok; ok "pr read probe (cli/cli)"
  else fail "pr read probe — token may lack repo scope"
  fi
else
  fail "gh not logged in (run: gh auth login)"
fi

# ---------- 5. proxy / claude api ----------
say "Proxy / Claude API"; hr
CL_API=fail; CL_REPLY=""; PROXY_HTTP=""
if have claude; then
  if CL_REPLY="$(claude -p "ping in one word" --output-format text 2>&1)" && [ -n "$CL_REPLY" ] && ! echo "$CL_REPLY" | grep -qiE "error|401|403|fetch failed|ENOTFOUND"; then
    CL_API=ok; ok "claude -p ping: $(echo "$CL_REPLY" | head -1 | cut -c1-60)"
  else
    fail "claude -p: $(echo "$CL_REPLY" | head -1 | cut -c1-100)"
  fi
fi
# curl fallback (also primary when claude missing)
if [ "$CL_API" != "ok" ] && [ -n "$VIBE_PROXY" ] && [ -n "$VIBE_KEY" ]; then
  PROXY_HTTP=$(curl -s -o /tmp/doctor_api.json -w '%{http_code}' --max-time 30 \
    "${VIBE_PROXY%/}/v1/chat/completions" \
    -H "Authorization: Bearer $VIBE_KEY" -H "Content-Type: application/json" \
    -d '{"model":"mimo-v2.5","messages":[{"role":"user","content":"say ok"}],"max_tokens":5}' 2>/dev/null)
  if [ "$PROXY_HTTP" = "200" ]; then
    CL_API=ok; ok "proxy curl: HTTP 200"
  else
    fail "proxy curl: HTTP ${PROXY_HTTP:-no-response} (check VIBE_PROXY/VIBE_KEY)"
  fi
elif [ "$CL_API" != "ok" ]; then
  fail "no proxy creds — set VIBE_PROXY+VIBE_KEY in $KEYFILE"
fi

# ---------- 6. chapter-specific ----------
CH1_PROFILE=fail; CH1_PR=""; CH1_PR_STATE=fail
if [ "$CHAPTER" = "ch-1" ]; then
  say "Chapter 1 — homework"; hr
  if [ -n "$GH_USER" ]; then
    if gh api "repos/$GH_USER/$GH_USER" >/dev/null 2>&1; then
      CH1_PROFILE=ok; ok "profile repo: github.com/$GH_USER/$GH_USER"
    else
      fail "profile repo $GH_USER/$GH_USER not found — create with a README"
    fi
    CH1_PR=$(gh pr list --repo "$WEBSITE_REPO" --author "$GH_USER" --state all --json url --jq '.[0].url' 2>/dev/null)
    if [ -n "$CH1_PR" ]; then
      CH1_PR_STATE=ok; ok "website PR: $CH1_PR"
    else
      fail "no PR to $WEBSITE_REPO by @$GH_USER"
    fi
  else
    fail "skipping profile/PR — gh not authed"
  fi
fi

# ---------- 6b. chapter 2 — proposal in team repo ----------
# ch-2 gate = member-proposals/<you>.md in your team-NN repo. Build-repo
# checks (files, commits) happen in ch-4 — code may stay private for now.
CH2_PROPOSAL=fail; CH2_TEAM_REPO=""
if [ "$CHAPTER" = "ch-2" ]; then
  say "Chapter 2 — team proposal"; hr
  if [ -n "$GH_USER" ]; then
    TEAM_REPOS=$(gh api "orgs/$GH_ORG/repos?per_page=100" --jq '.[].name' 2>/dev/null | grep -E '^team-[0-9]+$' || true)
    if [ -n "$TEAM_REPOS" ]; then
      for t in $TEAM_REPOS; do
        # case-insensitive filename match (logins case-insensitive, files aren't)
        if gh api "repos/$GH_ORG/$t/contents/member-proposals" --jq '.[].name' 2>/dev/null | grep -Fixq "$GH_USER.md"; then
          CH2_PROPOSAL=ok; CH2_TEAM_REPO="$t"; break
        fi
      done
      if [ "$CH2_PROPOSAL" = "ok" ]; then
        ok "team proposal: $CH2_TEAM_REPO/member-proposals/$GH_USER_LC.md"
      else
        CH2_TEAM_REPO=$(printf '%s\n' "$TEAM_REPOS" | head -1)
        fail "no member-proposals/$GH_USER_LC.md in your team repo — copy member-proposals/_TEMPLATE.md to that lowercase name, fill Gist/Story/Why, push"
      fi
    else
      fail "no team repo visible — run /repo-access in Discord, accept the GitHub invite, retry"
    fi
  else
    fail "skipping ch-2 checks — gh not authed"
  fi
fi

# ---------- 7. results JSON ----------
# ch1 block only when actually run (ch-1); keeps it off the ch-0 card
CH1_JSON=""
if [ "$CHAPTER" = "ch-1" ]; then
  CH1_JSON="  \"ch1\": { \"profile\": \"$CH1_PROFILE\", \"pr_url\": \"$CH1_PR\", \"pr_state\": \"$CH1_PR_STATE\" },
"
fi
CH2_JSON=""
if [ "$CHAPTER" = "ch-2" ]; then
  CH2_JSON="  \"ch2\": { \"proposal\": \"$CH2_PROPOSAL\", \"team_repo\": \"$CH2_TEAM_REPO\" },
"
fi
cat > "$JSON" <<EOF
{
  "ts": "$TS",
  "chapter": "$CHAPTER",
  "platform": "$PLATFORM",
  "claude_loc": "$CLAUDE_LOC",
  "claude_choice": "$CHOICE",
  "gh_user": "$GH_USER",
  "checks": {
    "node": "$NODE_R", "npm": "$NPM_R", "python": "$PY_R",
    "git": "$GIT_R", "gh": "$GH_R", "claude": "$CL_R"
  },
  "gh": { "auth": "$GH_AUTH", "pr_probe": "$GH_PR" },
  "proxy_api": "$CL_API",
${CH1_JSON}${CH2_JSON}  "score": "$checks_pass/$checks_total"
}
EOF
ok "results json: $JSON"

# ---------- 8. card by chapter ----------
if [ "$CHAPTER" = "ch-0" ]; then
  render_static_svg() {
    local user="${GH_USER:-anonymous}"
    local hdr_date; hdr_date="$(date '+%Y-%m-%d %H:%M:%S' 2>/dev/null)"
    local r pass_n=0 fail_n=0 bg mk
    for r in "$NODE_R" "$NPM_R" "$PY_R" "$GIT_R" "$GH_R" "$CL_R" "$GH_AUTH" "$GH_PR" "$CL_API"; do
      if [ "$r" = "ok" ]; then pass_n=$((pass_n+1)); else fail_n=$((fail_n+1)); fi
    done
    if [ "$CHAPTER" = "ch-1" ]; then
      for r in "$CH1_PROFILE" "$CH1_PR_STATE"; do
        if [ "$r" = "ok" ]; then pass_n=$((pass_n+1)); else fail_n=$((fail_n+1)); fi
      done
    fi

    # system-check pills
    local pills="" px=40 pair lbl st w
    for pair in "node:$NODE_R:64" "npm:$NPM_R:58" "python:$PY_R:84" "git:$GIT_R:56" "gh:$GH_R:52" "claude:$CL_R:84"; do
      lbl=${pair%%:*}; w=${pair##*:}; st=${pair#*:}; st=${st%%:*}
      if [ "$st" = "ok" ]; then bg="#16a34a"; mk="\xe2\x9c\x93"; else bg="#dc2626"; mk="\xe2\x9c\x97"; fi
      pills="$pills<g transform=\"translate($px,194)\"><rect width=\"$w\" height=\"26\" rx=\"13\" fill=\"$bg\"/><circle cx=\"16\" cy=\"13\" r=\"8\" fill=\"#ffffff\"/><text x=\"16\" y=\"17.5\" font-size=\"12\" text-anchor=\"middle\" fill=\"$bg\">$mk</text><text x=\"31\" y=\"17.5\" font-size=\"13\" fill=\"#ffffff\">$lbl</text></g>"
      px=$((px + w + 8))
    done

    # services rows
    local IFSO="$IFS" i nm vv
    local names="GH Auth|GH PR Probe|Proxy API" vals="$GH_AUTH|$GH_PR|$CL_API"
    IFS='|'
    # shellcheck disable=SC2206
    local -a NA=($names) VA=($vals)
    IFS="$IFSO"
    local rows="" sy=262
    for i in "${!NA[@]}"; do
      nm="${NA[$i]}"; vv="${VA[$i]}"
      if [ "$vv" = "ok" ]; then bg="#16a34a"; mk="\xe2\x9c\x93"; else bg="#dc2626"; mk="\xe2\x9c\x97"; fi
      rows="$rows<text x=\"52\" y=\"$((sy+16))\" font-size=\"15\" fill=\"#3f2a14\">$nm</text><g transform=\"translate(250,$sy)\"><rect width=\"62\" height=\"24\" rx=\"12\" fill=\"$bg\"/><circle cx=\"14\" cy=\"12\" r=\"7.5\" fill=\"#ffffff\"/><text x=\"14\" y=\"16\" font-size=\"11\" text-anchor=\"middle\" fill=\"$bg\">$mk</text><text x=\"28\" y=\"16\" font-size=\"12\" fill=\"#ffffff\">$vv</text></g>"
      sy=$((sy+30))
    done

    # chapter-1 section (ch-1 only)
    local ch1svg="" cy cn cv
    if [ "$CHAPTER" = "ch-1" ]; then
      cy=$((sy+8))
      ch1svg="<text x=\"40\" y=\"$((cy+12))\" font-size=\"13\" font-weight=\"700\" letter-spacing=\"1\" fill=\"#b45309\">CHAPTER 1</text><line x1=\"40\" y1=\"$((cy+18))\" x2=\"300\" y2=\"$((cy+18))\" stroke=\"#e6b27a\" stroke-width=\"1\"/>"
      cy=$((cy+24))
      IFS='|'; local -a CN=("Profile" "PR State") CV=("$CH1_PROFILE" "$CH1_PR_STATE"); IFS="$IFSO"
      for i in "${!CN[@]}"; do
        cn="${CN[$i]}"; cv="${CV[$i]}"
        if [ "$cv" = "ok" ]; then bg="#16a34a"; mk="\xe2\x9c\x93"; else bg="#dc2626"; mk="\xe2\x9c\x97"; fi
        ch1svg="$ch1svg<text x=\"52\" y=\"$((cy+16))\" font-size=\"15\" fill=\"#3f2a14\">$cn</text><g transform=\"translate(250,$cy)\"><rect width=\"62\" height=\"24\" rx=\"12\" fill=\"$bg\"/><circle cx=\"14\" cy=\"12\" r=\"7.5\" fill=\"#ffffff\"/><text x=\"14\" y=\"16\" font-size=\"11\" text-anchor=\"middle\" fill=\"$bg\">$mk</text><text x=\"28\" y=\"16\" font-size=\"12\" fill=\"#ffffff\">$cv</text></g>"
        cy=$((cy+28))
      done
    fi

    local ready="#d97706"
    [ "$pass_n" -gt 0 ] && [ "$fail_n" -eq 0 ] && ready="#16a34a"

    # --- resolve template: local file -> cached -> download -> embedded fallback ---
    local tpl="" cache="$OUTDIR/card-template.svg"
    if [ -f "./card-template.svg" ]; then tpl="$(cat ./card-template.svg)"
    elif [ -f "$cache" ]; then tpl="$(cat "$cache")"
    elif have curl && curl -fsSL "$TEMPLATE_URL" -o "$cache" 2>/dev/null && [ -s "$cache" ]; then tpl="$(cat "$cache")"
    fi
    if [ -z "$tpl" ]; then
      tpl="$(cat <<'TPL'
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450" font-family="ui-monospace,SFMono-Regular,Menlo,monospace">
  <!-- Vibe Code Doctor card template. Double-underscore tokens (CHAPTER, PILLS,
       ROWS, CH1, SCORE, PASS, FAIL, READY, ...) are filled in by doctor.sh.
       Safe to redesign; keep the injection-point tokens intact. -->
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fef3e2"/><stop offset="1" stop-color="#fde2c4"/></linearGradient></defs>
  <rect width="800" height="450" fill="url(#bg)"/>
  <rect x="12" y="12" width="776" height="426" fill="none" stroke="#d97706" stroke-width="3" rx="16"/>
  <rect x="34" y="26" width="60" height="26" rx="13" fill="#d97706"/>
  <text x="64" y="44" font-size="14" font-weight="700" text-anchor="middle" fill="#ffffff">__CHAPTER__</text>
  <text x="110" y="44" font-size="13" fill="#a16207">__HDR_DATE__  &#183;  __PLATFORM__  &#183;  claude:__CHOICE__</text>
  <text x="766" y="44" font-size="16" font-weight="700" text-anchor="end" fill="#9a3412">@__USER__</text>
  <text x="40" y="80" font-size="13" font-weight="700" letter-spacing="1" fill="#b45309">ENVIRONMENT</text>
  <line x1="40" y1="86" x2="300" y2="86" stroke="#e6b27a" stroke-width="1"/>
  <text x="52" y="112" font-size="15" fill="#3f2a14">Platform</text>
  <rect x="210" y="97" width="90" height="22" rx="6" fill="none" stroke="#d9a066"/><text x="222" y="112" font-size="13" fill="#7c2d12">__PLATFORM__</text>
  <text x="52" y="140" font-size="15" fill="#3f2a14">Claude Loc</text>
  <rect x="210" y="125" width="90" height="22" rx="6" fill="none" stroke="#d9a066"/><text x="222" y="140" font-size="13" fill="#7c2d12">__CLAUDE_LOC__</text>
  <text x="52" y="168" font-size="15" fill="#3f2a14">Choice</text>
  <rect x="210" y="153" width="90" height="22" rx="6" fill="none" stroke="#d9a066"/><text x="222" y="168" font-size="13" fill="#7c2d12">__CHOICE__</text>
  <text x="40" y="184" font-size="13" font-weight="700" letter-spacing="1" fill="#b45309">SYSTEM CHECKS</text>
  __PILLS__
  <text x="40" y="252" font-size="13" font-weight="700" letter-spacing="1" fill="#b45309">SERVICES</text>
  <line x1="40" y1="258" x2="300" y2="258" stroke="#e6b27a" stroke-width="1"/>
  __ROWS__
  __CH1__
  <rect x="566" y="58" width="200" height="306" rx="14" fill="#fff7ec" stroke="#e6b27a"/>
  <rect x="596" y="70" width="72" height="22" rx="11" fill="none" stroke="#d9a066"/>
  <text x="632" y="85" font-size="12" font-weight="700" letter-spacing="1" text-anchor="middle" fill="#9a3412">SCORE</text>
  <circle cx="666" cy="158" r="56" fill="none" stroke="#f0d2a8" stroke-width="10"/>
  <text x="666" y="178" font-size="58" font-weight="700" text-anchor="middle" fill="#c2410c">__SCORE__</text>
  <text x="666" y="214" font-size="13" text-anchor="middle" fill="#9a3412">checkpoints passed</text>
  <rect x="586" y="240" width="160" height="22" rx="6" fill="#fde7cf"/>
  <text x="596" y="255" font-size="13" font-weight="700" fill="#7c2d12">PASS</text>
  <text x="736" y="255" font-size="13" font-weight="700" text-anchor="end" fill="#16a34a">__PASS__</text>
  <text x="596" y="281" font-size="13" font-weight="700" fill="#7c2d12">FAIL</text>
  <text x="736" y="281" font-size="13" font-weight="700" text-anchor="end" fill="#dc2626">__FAIL__</text>
  <text x="586" y="308" font-size="11" fill="#a16207">CHAPTER</text><text x="746" y="308" font-size="11" text-anchor="end" fill="#7c2d12">__CHAPTER__</text>
  <text x="586" y="326" font-size="11" fill="#a16207">PLATFORM</text><text x="746" y="326" font-size="11" text-anchor="end" fill="#7c2d12">__PLATFORM__</text>
  <text x="586" y="344" font-size="11" fill="#a16207">CLAUDE</text><text x="746" y="344" font-size="11" text-anchor="end" fill="#7c2d12">__CLAUDE_LOC__</text>
  <rect x="320" y="418" width="170" height="22" rx="11" fill="none" stroke="__READY__"/>
  <text x="405" y="433" font-size="12" text-anchor="middle" fill="#a16207">vibecode.tours</text>
</svg>
TPL
)"
    fi

    tpl="${tpl//__CHAPTER__/$CHAPTER}"
    tpl="${tpl//__HDR_DATE__/$hdr_date}"
    tpl="${tpl//__PLATFORM__/$PLATFORM}"
    tpl="${tpl//__CLAUDE_LOC__/$CLAUDE_LOC}"
    tpl="${tpl//__CHOICE__/$CHOICE}"
    tpl="${tpl//__USER__/$user}"
    tpl="${tpl//__PILLS__/$pills}"
    tpl="${tpl//__ROWS__/$rows}"
    tpl="${tpl//__CH1__/$ch1svg}"
    tpl="${tpl//__SCORE__/$checks_pass/$checks_total}"
    tpl="${tpl//__PASS__/$pass_n}"
    tpl="${tpl//__FAIL__/$fail_n}"
    tpl="${tpl//__READY__/$ready}"
    printf '%s\n' "$tpl" > "$SVG"
  }
  say "Card"; hr
  render_static_svg; ok "static svg: $SVG"
  make_png() {
    if have rsvg-convert; then rsvg-convert "$SVG" -o "$PNG" 2>/dev/null && return 0; fi
    if have convert;       then convert "$SVG" "$PNG" 2>/dev/null && return 0; fi
    if have chromium;      then chromium --headless --no-sandbox --disable-gpu --screenshot="$PNG" --window-size=800,450 "file://$SVG" >/dev/null 2>&1 && return 0; fi
    if have google-chrome; then google-chrome --headless --no-sandbox --disable-gpu --screenshot="$PNG" --window-size=800,450 "file://$SVG" >/dev/null 2>&1 && return 0; fi
    return 1
  }
  if make_png; then ok "png: $PNG"
  else warn "no svg→png tool (install: librsvg2-bin OR imagemagick)"
  fi
  {
    echo "┌─ Vibe Code Doctor ──────────────┐"
    echo "│ user:     ${GH_USER:-anonymous}"
    echo "│ platform: $PLATFORM"
    echo "│ claude:   $CLAUDE_LOC ($CHOICE)"
    echo "│ checks:   ${NODE_R}/node ${NPM_R}/npm ${PY_R}/py ${GIT_R}/git ${GH_R}/gh ${CL_R}/claude"
    echo "│ proxy:    $CL_API"
    echo "│ score:    $checks_pass/$checks_total"
    echo "└──────────────────────────────────┘"
  } > "$TXT"
  echo
  say "Drop one of these in #ch-0-intro"; hr
  [ -f "$PNG" ] && echo "  image: $PNG"
  [ -f "$SVG" ] && echo "  svg:   $SVG  (fallback if no PNG)"
  echo "  text:  $TXT  (copy/paste fallback)"
  echo "  json:  $JSON"
  echo
  echo "  Wait for instructor ✅/👏 → ch-0-done role → #ch-1 unlocks."

else
  # any homework chapter (ch-1, ch-2, ...). Base: proxy + gh auth.
  # ch-1 also needs profile repo + website PR; others rely on mentor 👏 review.
  ch_fail=0
  [ "$CL_API"  != "ok" ] && ch_fail=1
  [ "$GH_AUTH" != "ok" ] && ch_fail=1
  if [ "$CHAPTER" = "ch-1" ]; then
    [ "$CH1_PROFILE"  != "ok" ] && ch_fail=1
    [ "$CH1_PR_STATE" != "ok" ] && ch_fail=1
  fi
  if [ "$CHAPTER" = "ch-2" ]; then
    [ "$CH2_PROPOSAL" != "ok" ] && ch_fail=1
  fi
  {
    echo "# ${CHAPTER} check — $(date -u '+%Y-%m-%d %H:%M UTC')"
    echo
    echo "- proxy api: $CL_API"
    echo "- gh auth: $GH_AUTH ($GH_USER)"
    if [ "$CHAPTER" = "ch-1" ]; then
      echo "- profile repo: $CH1_PROFILE"
      echo "- website pr: ${CH1_PR:-none}"
    fi
    if [ "$CHAPTER" = "ch-2" ]; then
      echo "- team proposal: $CH2_PROPOSAL (${CH2_TEAM_REPO:-no-team-repo})"
    fi
    echo
    echo "---"
    echo "chapter: $CHAPTER"
    echo "github_username: ${GH_USER:-none}"
    [ "$CHAPTER" = "ch-1" ] && echo "website_pr: ${CH1_PR:-none}"
    echo "result: $([ "$ch_fail" -eq 0 ] && echo PASS || echo INCOMPLETE)"
  } > "$MD"
  say "${CHAPTER} report"; hr
  echo "  md: $MD"
  if [ "$ch_fail" -ne 0 ]; then
    warn "checks failed — fix the ❌ rows above and re-run. Gist not posted."
    exit 1
  fi
  if [ "$NO_POST" = "1" ]; then
    echo "  --no-post — skipping gist. Manual: gh gist create --public $MD"
  elif have gh && gh auth status >/dev/null 2>&1; then
    url=$(gh gist create --public -d "Vibe Code Tours — ${CHAPTER} — @$GH_USER" "$MD" 2>/dev/null | tail -1)
    if [ -n "$url" ]; then
      ok "gist posted: $url"
      echo
      say "Submit (Discord):"; hr
      echo "    Paste this gist link in #${CHAPTER} — the bot checks it, a mentor 👏 approves:"
      echo "    $url"
      echo "    (or run the /submit command and paste the link)"
    else
      warn "gist post failed. Manual: gh gist create --public $MD"
    fi
  else
    echo "  gh not authed — manual gist: gh gist create --public $MD"
  fi
fi

# ---------- 9. recovery on proxy fail ----------
if [ "$CL_API" = "fail" ]; then
  echo
  say "Proxy/API failed — recovery options:"; hr
  echo "  1. gemini  — free tier (gemini.google.com or 'gemini' CLI)"
  echo "  2. ollama  — offline (ollama run qwen2.5-coder:7b)"
  echo "  3. #help   — tag @instructor for manual /unlock"
  exit 2
fi

[ "$checks_pass" = "$checks_total" ] && exit 0 || exit 2
