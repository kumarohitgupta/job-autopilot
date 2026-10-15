# Job Autopilot

**A daily job-search routine that runs itself, built on [career-ops](https://github.com/career-ops-hq/career-ops).**

Every weekday morning it scans the job boards you care about and scores each new role against your profile. For the strong matches it writes a tailored one-page resume, a cover letter in your own voice, and a referral note. Everything lands in a review queue. You pick what to apply to, the agent fills the application and stops before Submit, and you click Submit yourself.

Runs on your machine with **Claude Code** or **Codex (ChatGPT)**. Your data never leaves your computer except through the AI CLI you choose.

## What it adds to career-ops

| | |
|---|---|
| ⏰ **Unattended daily run** | Weekday schedule (macOS launchd or Linux cron): free API scan → triage → scoring → materials for every role at 4.0/5+ |
| 📋 **Agent Queue** | One review row per role, in a Google Sheet or a local CSV: `Ready – review` → `Fill application` → `Form filled – review & submit` → `Applied` |
| 🖊️ **Form filling that stops before Submit** | `process queue` fills each chosen application in your browser and leaves it for you to check. It stops at logins. |
| ✍️ **Cover letters in your voice** | Learns your style from your writing samples. Banned-phrase list, standing answers, a why-company paragraph built only from real experience. |
| ✅ **Fact gate** | Every resume, letter and form answer is checked against your `cv.md`. Wrong versions of your facts (old titles, rounded numbers) are blocked. |
| 📄 **One-page resume rules** | Classic one-page template, summary written last and matched to the bullets, JD keywords for ATS with before/after coverage, no skill claimed without a bullet that proves it |
| 🧭 **Guided setup** | Say `set me up`. The agent asks about the four things you change and fills in the files. |

## You change four things

1. **Job preferences:** roles, level, pay, locations, work authorization
2. **Companies and role types:** who to watch and which titles count
3. **Voice:** a few writing samples
4. **Resume and cover letter:** your full resume, your format, your standing answers

## Quick start

```bash
git clone https://github.com/<you>/<this-repo>.git job-autopilot
cd job-autopilot
npm install && npx playwright install chromium
node autopilot/setup.mjs
claude            # Codex: codex "Read modes/_custom.md, then set me up"
> set me up
```

Then turn on the schedule with `./autopilot/install-schedule.sh`.

📖 **Full guide:** [autopilot/GUIDE.md](../autopilot/GUIDE.md)

## Credits and license

Job Autopilot is an independent project built on top of [career-ops](https://github.com/career-ops-hq/career-ops) by Santiago Fernández de Valderrama and contributors. It is not affiliated with or endorsed by the career-ops project. Everything in career-ops (scanner, scoring, PDF pipeline, fact checker, modes, dashboard) is their work. The original README is [here](../README.md).

Released under the MIT License, like career-ops. See [LICENSE](../LICENSE) and [NOTICE.md](../NOTICE.md).
