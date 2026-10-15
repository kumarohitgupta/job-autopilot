# Job Autopilot — guide

Job Autopilot is a ready-to-use setup for [career-ops](https://github.com/career-ops-hq/career-ops), the open-source job-search agent. career-ops does the heavy lifting: scanning job boards, scoring roles, generating resumes. Autopilot adds a daily routine on top: every weekday morning it finds new roles and scores them. For the good ones it writes the resume, the cover letter and an outreach note, and it lines everything up in a review queue. You decide what to apply to, the agent fills the form and stops, and you click Submit.

You change four things. Everything else works as shipped.

| # | What you change | Where it lives | How |
|---|-----------------|----------------|-----|
| 1 | **Job preferences:** target roles, level, pay, locations, work authorization, deal-breakers | `config/profile.yml`, `modes/_profile.md`, `modes/_brief.md` | "set me up" step 2 |
| 2 | **Companies and role types:** which companies to watch, which titles count, where | `portals.yml` | "set me up" step 3, or "add companies: A, B, C" |
| 3 | **Voice:** how your cover letters and messages sound | `writing-samples/` → `voice-dna.md` | "set me up" step 4 |
| 4 | **Resume and cover letter:** your facts, your format, your standing answers | `cv.md`, `config/cv-facts.json`, `templates/onepage/` (or your own template), "Cover Letter Standing Answers" in `modes/_profile.md` | "set me up" steps 1 and 4 |

All of these files are gitignored, so your data never ends up in the repo, and updates never overwrite them.

---

## 1. Install (about 10 minutes)

You need [Node.js 20+](https://nodejs.org) and one AI coding CLI:

- **Claude Code** (recommended; works with a Claude Pro or Max subscription): `curl -fsSL https://claude.ai/install.sh | bash`
- **Codex CLI** (works with a ChatGPT plan): `npm install -g @openai/codex`

Then:

```bash
git clone https://github.com/<you>/<this-repo>.git job-autopilot
cd job-autopilot
npm install
npx playwright install chromium     # renders the PDFs
node autopilot/setup.mjs            # copies the starter files into place
```

## 2. Make it yours (about 15 minutes)

1. Put your **full resume** (the long version, .docx or .pdf) in `documents/`.
2. Put 2-5 **writing samples** in `writing-samples/`: emails you liked, LinkedIn posts, past cover letters.
3. Start the agent in the folder and say **`set me up`**.
   - Claude Code: `claude`, then `set me up`. Setup wrote a `CLAUDE.local.md` that points Claude at the Autopilot workflows in every session.
   - Codex: start each session with `codex "Read modes/_custom.md, then set me up"` (or `... then process queue`), because Codex doesn't read `CLAUDE.local.md`.

The agent asks one area at a time and writes your answers into the files:

1. **Resume:** turns your resume into `cv.md`, the only source of facts, and asks about outdated or wrong versions of your facts so the fact gate can block them.
2. **Job preferences:** roles, level, pay, markets, work authorization, start date, deal-breakers.
3. **Companies:** finds each company's job board so scanning is free and exact.
4. **Voice and format:** learns your writing style from the samples, saves your cover-letter answers, and either uses the shipped one-page template or copies the design of your own resume.
5. **Queue and schedule:** a Google Sheet or a local file, a test run on one real job URL, then the daily schedule.

Say `skip` to leave any step for later, and `set up <area>` to come back to it.

## 3. Choose where your queue lives

**Google Sheet (recommended with Claude Code).** Create a Google Sheet and import the two files in `autopilot/google-sheet/` as tabs named `Agent Queue` and `Tracker`. On `Agent Queue` column K, add a dropdown with `Ready – review`, `Fill application`, `Form filled – review & submit`, `Applied`, `Skip`. Connect Google Sheets (and optionally Google Drive) to Claude at claude.ai → Settings → Connectors. In Claude Code, `/mcp` should list them. Put the sheet's ID in `modes/_custom.md` → Autopilot Settings.

> Claude Code only loads claude.ai connectors when you're signed in with your subscription. If `echo $ANTHROPIC_API_KEY` prints a key, remove it from your shell profile.

**Local file (no Google account, works with any CLI).** Set the queue backend to `local`. The queue is `data/agent-queue.csv` (open it in Excel or Numbers), and career-ops' own tracker `data/applications.md` holds your statuses.

**Drive links (optional).** If you use Google Drive for desktop, sync the `output/` folder and set "Google Drive links" to `on`. Each queue row then links the PDFs.

## 4. Turn on the daily run

```bash
./autopilot/install-schedule.sh                  # weekdays 7:45
./autopilot/install-schedule.sh --time 08:30     # another time
./autopilot/install-schedule.sh --agent codex    # use Codex
./autopilot/install-schedule.sh --remove         # turn it off
./autopilot/daily-run.sh                         # run it right now
```

Each run scans every API job board for free, scores the new roles, and for each role at 4.0/5 or higher writes:
- a tailored one-page resume, fact-checked against `cv.md`
- a cover letter in your voice, fact-checked again
- an outreach note for a referral

It then adds one row to your Agent Queue and writes a shortlist to `data/daily-shortlist-YYYY-MM-DD.md`. Logs are in `data/daily-YYYY-MM-DD.log`.

## 5. Your daily routine (about 10 minutes)

1. Open the Agent Queue. For each `Ready – review` row, read the resume and letter, then set Status to `Fill application` or `Skip`. Notes for the agent go in column L.
2. In the project folder, start the agent and say **`process queue`**. It opens each `Fill application` job in your browser, fills the form, attaches the resume and **stops before Submit**. The row becomes `Form filled – review & submit`.
3. Check each tab, click Submit yourself, and set the row to `Applied`. The next run syncs it to your tracker.

Form filling needs a browser the agent can drive: Claude in Chrome with Claude Code, or Playwright. If a site needs a login, the agent stops and writes "Needs login" in the row.

## Commands

Say these inside the agent:

| Say | What happens |
|-----|--------------|
| `set me up` / `set up voice` | Guided setup, all of it or one area |
| paste a job URL | Score it, write the report, and if it's strong, the resume and letter |
| `daily run` | The full daily routine, on demand |
| `process queue` | Fill forms for rows marked `Fill application`, sync `Applied` rows |
| `apply <company>` | Fill one application and stop before Submit |
| `mark applied <company> <role>` | Record an application you sent yourself |
| `sync tracker <company>` | Push a status change (Interviewing, Rejected, Offer) to the tracker |
| `pull tracker` | Follow-ups due, and tracker companies the scanner doesn't watch yet |
| `add companies: A, B, C` | Find their job boards and add them to `portals.yml` |
| `recalibrate my writing style` | Re-read `writing-samples/` and update `voice-dna.md` |
| `/career-ops` | Every career-ops mode (interview prep, offer comparison, follow-ups...) |

## What it will never do

- Submit an application, send an email or send a LinkedIn message. You review and send everything.
- Log in, create accounts or type passwords on job sites.
- Invent a metric, title or employer. Every resume, letter and form answer is checked against `cv.md` by `verify-cv-facts.mjs`, and claims you've marked wrong in `config/cv-facts.json` are blocked.

## Claude Code or ChatGPT (Codex)?

Both work with the same files, since career-ops reads `AGENTS.md` in every supported CLI.

| | Claude Code | Codex (ChatGPT) |
|---|---|---|
| Setup, scoring, resumes, cover letters | ✅ | ✅ |
| Google Sheet and Drive queue | ✅ via claude.ai connectors | Use the local queue, or add a Google Sheets MCP server to Codex yourself |
| Form filling in your browser | ✅ Claude in Chrome | Playwright |
| Scheduled daily run | ✅ | Experimental (`--agent codex`) |

## Updating

career-ops ships updates often. In the agent, say `check for updates`, or run `node update-system.mjs check`. Your files (everything in the table at the top) are never touched. Autopilot's own files live in `autopilot/` and `templates/onepage/`. To get Autopilot updates, pull this repo.

## Troubleshooting

- **`set me up` doesn't start:** run `node autopilot/setup.mjs` first. The workflows live in `modes/_custom.md`.
- **No Google Sheets in `/mcp`:** connect it at claude.ai → Settings → Connectors, restart `claude`, and check that `ANTHROPIC_API_KEY` isn't set.
- **Resume spills to two pages:** the agent cuts bullets automatically. If it keeps happening, lower the bullet count in Resume Rule 3 of `modes/_profile.md`.
- **A claim got blocked:** that's the fact gate working. Fix `cv.md` if the fact is real (then remove it from `forbidden_phrases`), or leave it blocked.
- **Health check:** `npm run doctor`.
