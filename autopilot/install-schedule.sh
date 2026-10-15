#!/bin/bash
# Job Autopilot — turn the daily run on (or off).
#
#   ./autopilot/install-schedule.sh                 weekdays at 7:45
#   ./autopilot/install-schedule.sh --time 08:30    weekdays at 8:30
#   ./autopilot/install-schedule.sh --agent codex   run with Codex instead of Claude Code
#   ./autopilot/install-schedule.sh --remove        turn it off
#
# macOS: a launchd job (runs at the next wake if the Mac was asleep).
# Linux: a crontab line.
# Windows: use Task Scheduler with WSL or Git Bash to run autopilot/daily-run.sh.

set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT="$REPO/autopilot/daily-run.sh"
LABEL="io.job-autopilot.daily"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
TIME="07:45"
AGENT="claude"
REMOVE=0

while [ $# -gt 0 ]; do
  case "$1" in
    --time) TIME="$2"; shift 2 ;;
    --agent) AGENT="$2"; shift 2 ;;
    --remove) REMOVE=1; shift ;;
    -h|--help) sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if ! [[ "$TIME" =~ ^([01]?[0-9]|2[0-3]):[0-5][0-9]$ ]]; then
  echo "--time must look like 07:45"; exit 1
fi
HOUR=$((10#${TIME%%:*}))
MINUTE=$((10#${TIME##*:}))
chmod +x "$SCRIPT"

if [ "$(uname)" = "Darwin" ]; then
  if [ "$REMOVE" = 1 ]; then
    launchctl unload "$PLIST" 2>/dev/null || true
    rm -f "$PLIST"
    echo "Daily run turned off."
    exit 0
  fi
  mkdir -p "$HOME/Library/LaunchAgents" "$REPO/data"
  {
    cat <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>            <string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>$SCRIPT</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>AUTOPILOT_AGENT</key> <string>$AGENT</string>
  </dict>
  <key>WorkingDirectory</key> <string>$REPO</string>
  <key>StartCalendarInterval</key>
  <array>
EOF
    for d in 1 2 3 4 5; do
      echo "    <dict><key>Weekday</key><integer>$d</integer><key>Hour</key><integer>$HOUR</integer><key>Minute</key><integer>$MINUTE</integer></dict>"
    done
    cat <<EOF
  </array>
  <key>StandardOutPath</key>   <string>$REPO/data/launchd.log</string>
  <key>StandardErrorPath</key> <string>$REPO/data/launchd.log</string>
</dict>
</plist>
EOF
  } > "$PLIST"
  launchctl unload "$PLIST" 2>/dev/null || true
  launchctl load "$PLIST"
  echo "Daily run on: weekdays at $TIME ($AGENT) -> $SCRIPT"
  echo "Turn it off: ./autopilot/install-schedule.sh --remove"
else
  TAG="# job-autopilot daily run"
  CURRENT="$(crontab -l 2>/dev/null | grep -v "$TAG" || true)"
  if [ "$REMOVE" = 1 ]; then
    printf '%s\n' "$CURRENT" | crontab -
    echo "Daily run turned off."
    exit 0
  fi
  LINE="$MINUTE $HOUR * * 1-5 AUTOPILOT_AGENT=$AGENT /bin/bash \"$SCRIPT\" >> \"$REPO/data/cron.log\" 2>&1 $TAG"
  printf '%s\n%s\n' "$CURRENT" "$LINE" | sed '/^$/d' | crontab -
  echo "Daily run on: weekdays at $TIME ($AGENT) via cron."
  echo "Turn it off: ./autopilot/install-schedule.sh --remove"
fi
