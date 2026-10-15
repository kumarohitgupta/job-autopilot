#!/usr/bin/env node
// Job Autopilot — first-time setup.
//
// Copies the starter files into the places career-ops reads them from. Every
// destination is in career-ops' User Layer (gitignored, never auto-updated),
// so your answers stay on your machine and survive `node update-system.mjs`.
//
// Existing files are never overwritten unless you pass --force.
//
//   node autopilot/setup.mjs            copy what's missing
//   node autopilot/setup.mjs --dry-run  show what would be copied
//   node autopilot/setup.mjs --force    overwrite existing files (backups as *.bak)

import { existsSync, mkdirSync, copyFileSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const force = args.has('--force');

if (args.has('--help') || args.has('-h')) {
  console.log(readFileSync(fileURLToPath(import.meta.url), 'utf-8').split('\n').slice(1, 12).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
  process.exit(0);
}

// starter file → where career-ops reads it
const COPIES = [
  ['starter/modes/_custom.md', 'modes/_custom.md', 'workflows + settings (daily run, Agent Queue, writing rules)'],
  ['starter/modes/_profile.md', 'modes/_profile.md', '1. job preferences + resume rules + cover letter answers'],
  ['starter/modes/_brief.md', 'modes/_brief.md', '1. job preferences (fast triage)'],
  ['starter/portals.starter.yml', 'portals.yml', '2. companies and role types'],
  ['starter/voice-dna.starter.md', 'voice-dna.md', '3. your voice'],
];

// files created from career-ops' own examples when missing
const FROM_EXAMPLES = [
  ['config/profile.example.yml', 'config/profile.yml', '1. contact details + targets'],
];

const QUEUE_HEADER = 'Date added,Company,Role,Score,Lane,Work authorization,Job link,Resume,Cover letter,Outreach note,Status,My notes,Agent log\n';

const done = [];
const kept = [];

function place(src, dest, label) {
  const to = join(root, dest);
  if (existsSync(to) && !force) {
    kept.push(`  kept     ${dest}  (${label})`);
    return;
  }
  if (!dryRun) {
    mkdirSync(dirname(to), { recursive: true });
    if (existsSync(to)) copyFileSync(to, `${to}.bak`);
    copyFileSync(src, to);
  }
  done.push(`  created  ${dest}  (${label})`);
}

for (const [src, dest, label] of COPIES) place(join(here, src), dest, label);
for (const [src, dest, label] of FROM_EXAMPLES) {
  const from = join(root, src);
  if (existsSync(from)) place(from, dest, label);
}

// empty fact gate: setup step 1 adds the wrong variants of your facts here
const facts = join(root, 'config', 'cv-facts.json');
if (!existsSync(facts)) {
  if (!dryRun) {
    mkdirSync(dirname(facts), { recursive: true });
    writeFileSync(facts, JSON.stringify({ allow_metrics: [], allow_facts: [], forbidden_phrases: [], warn_phrases: [] }, null, 2) + '\n');
  }
  done.push('  created  config/cv-facts.json  (4. fact gate: blocks wrong claims)');
}

// Claude Code loads CLAUDE.local.md (gitignored) in every session; it points
// the agent at the Autopilot workflows so "set me up" etc. work right away.
const HOOK_MARK = '<!-- job-autopilot -->';
const HOOK = `${HOOK_MARK}
# Job Autopilot

- The Job Autopilot settings and workflows live in \`modes/_custom.md\`. Read it at the start of every session.
- When I say "set me up", "set up <area>", "daily run", "process queue", "apply <company>", "mark applied", "sync tracker" or "pull tracker", run the workflow of that name from \`modes/_custom.md\` → Custom Workflows.
`;
const localHook = join(root, 'CLAUDE.local.md');
const hookText = existsSync(localHook) ? readFileSync(localHook, 'utf-8') : '';
if (!hookText.includes(HOOK_MARK)) {
  if (!dryRun) writeFileSync(localHook, hookText ? `${hookText.trimEnd()}\n\n${HOOK}` : HOOK);
  done.push(`  ${hookText ? 'updated' : 'created'}  CLAUDE.local.md  (Claude Code reads the Autopilot workflows every session)`);
}

// keep CLAUDE.local.md out of git without editing the shared .gitignore
const exclude = join(root, '.git', 'info', 'exclude');
if (existsSync(join(root, '.git')) && !dryRun) {
  const ex = existsSync(exclude) ? readFileSync(exclude, 'utf-8') : '';
  if (!ex.split('\n').includes('CLAUDE.local.md')) {
    mkdirSync(dirname(exclude), { recursive: true });
    writeFileSync(exclude, `${ex.trimEnd()}${ex ? '\n' : ''}CLAUDE.local.md\n`);
  }
}

// local Agent Queue (used when you don't connect a Google Sheet)
const queue = join(root, 'data', 'agent-queue.csv');
if (!existsSync(queue)) {
  if (!dryRun) {
    mkdirSync(dirname(queue), { recursive: true });
    writeFileSync(queue, QUEUE_HEADER);
  }
  done.push('  created  data/agent-queue.csv  (local Agent Queue)');
}

for (const dir of ['writing-samples', 'documents', 'output']) {
  if (!dryRun) mkdirSync(join(root, dir), { recursive: true });
}

console.log(`\nJob Autopilot setup${dryRun ? ' (dry run, nothing written)' : ''}\n`);
if (done.length) console.log(done.join('\n'));
if (kept.length) console.log(kept.join('\n') + '\n  (existing files kept; use --force to replace them)');

console.log(`
Next:
  1. Put your full resume (.docx or .pdf) in documents/ and 2-5 writing samples in writing-samples/
  2. Start your AI CLI in this folder:   claude
     (Codex: start with   codex "Read modes/_custom.md, then set me up")
  3. Say:  set me up
     It walks you through the four things you change:
       1. job preferences   2. companies and role types   3. voice   4. resume and cover letter
  4. Paste one job URL to test, then turn on the daily run:  ./autopilot/install-schedule.sh

Full guide: autopilot/GUIDE.md
`);
