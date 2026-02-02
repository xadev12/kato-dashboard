# Kato Dashboard Systems

This document describes the two automation systems for Kato Dashboard:
1. **Auto-Update System** - Automatic project/task tracking
2. **Token Stats System** - Real token usage analytics

---

## System 1: Auto-Update System

Automatically updates dashboard-data.json after completing tasks, with automatic git commit and Vercel deployment.

### Usage

```bash
# After a small task (< 3 min)
update-dashboard --project="kato-dashboard" --task="add ROI badges" --status=done

# For longer tasks (> 3 min) - mark in progress first
update-dashboard --project="kato-dashboard" --task="build token dashboard" --status=in_progress
# ... later when done ...
update-dashboard --project="kato-dashboard" --task="build token dashboard" --status=done
```

### Installation

The scripts are located in `/Users/devl/clawd/scripts/`:
- `update-dashboard-task.sh` - Shell wrapper
- `update-dashboard-task.js` - Node.js implementation

Add to your shell profile for global access:
```bash
# ~/.zshrc or ~/.bashrc
alias update-dashboard='/Users/devl/clawd/scripts/update-dashboard-task.sh'
```

Or use directly:
```bash
./scripts/update-dashboard-task.sh --project="move-pwa" --task="fix bug" --status=done
```

### Options

| Option | Description | Required |
|--------|-------------|----------|
| `--project=ID` | Project ID or name | Yes |
| `--task=TITLE` | Task title | Yes |
| `--status=STATUS` | done, in_progress, queued | Yes |
| `--message=MSG` | Custom commit message | No |
| `--dry-run` | Preview changes without saving | No |
| `--help, -h` | Show help | No |

### How It Works

1. **Reads** current dashboard-data.json
2. **Finds** the project and task (creates if not found)
3. **Updates** task status, timestamps, and progress
4. **Recalculates** project progress percentage
5. **Commits** changes with descriptive message
6. **Pushes** to trigger Vercel auto-deploy

### Environment Variables

```bash
# Override dashboard location
export DASHBOARD_DATA_PATH=/path/to/dashboard-data.json

# Skip git operations (for testing)
export SKIP_GIT=true
```

---

## System 2: Token Stats System

Collects real token usage data from OpenClaw gateway sessions and displays it in the Token Dashboard.

### Usage

```bash
# Update dashboard with latest stats (default: week period)
collect-token-stats

# Output JSON to stdout
collect-token-stats --output=json

# Save to file
collect-token-stats --output=file --file=./stats.json

# Different time period
collect-token-stats --period=month  # day, week, month

# Dry run (preview without saving)
collect-token-stats --dry-run
```

### Installation

Script location: `/Users/devl/clawd/scripts/collect-token-stats.js`

Add alias to shell profile:
```bash
alias collect-token-stats='node /Users/devl/clawd/scripts/collect-token-stats.js'
```

### Data Sources

The collector parses:
- `~/.openclaw/agents/*/sessions/*.jsonl` - Session transcripts with token usage
- Extracts: model, provider, input/output/cache tokens, cost estimates

### Token Pricing

Pricing is defined in the script for these models:
- Claude Opus 4.5
- Claude Sonnet 4.5
- Kimi Code/Chat
- GPT-4o / GPT-4o-mini
- Gemini 2.5 Pro/Flash

Costs are estimated based on token counts and model pricing.

### Dashboard Integration

The Token Dashboard (`/token-dashboard`) displays:
- **Total tokens** used in period
- **Estimated cost** in USD
- **Token waste** percentage
- **Parallelization** efficiency
- **Daily usage** chart
- **Model breakdown** by provider
- **Agent breakdown** with per-agent costs
- **Daily breakdown** table

### Automatic Updates

To automatically collect stats periodically, add to crontab:
```bash
# Collect token stats every hour
0 * * * * cd /Users/devl/clawd && node scripts/collect-token-stats.js --output=dashboard >> /tmp/token-stats.log 2>&1
```

---

## Combined Workflow

Complete workflow after finishing a task:

```bash
# 1. Update the project progress
update-dashboard --project="kato-dashboard" --task="implement feature X" --status=done

# 2. Collect fresh token stats
collect-token-stats

# 3. Both changes deploy automatically to Vercel
```

---

## File Structure

```
/Users/devl/clawd/
├── scripts/
│   ├── update-dashboard-task.sh      # Auto-update wrapper
│   ├── update-dashboard-task.js      # Auto-update implementation
│   └── collect-token-stats.js        # Token stats collector
├── kato-dashboard/
│   ├── public/
│   │   └── dashboard-data.json       # Dashboard data (auto-updated)
│   └── src/
│       └── pages/
│           └── TokenDashboard.tsx    # Real-time token dashboard
└── .openclaw/
    ├── agents/
    │   └── */sessions/*.jsonl        # Session data (parsed for tokens)
    └── logs/gateway.log              # Gateway logs
```

---

## Troubleshooting

### Auto-Update Script

**"Project not found"**
- Check project ID in dashboard-data.json
- Use partial matching: `--project="kato"` matches "kato-dashboard"

**"Git operation failed"**
- Ensure you're in a git repository
- Check git credentials
- Set `SKIP_GIT=true` to test without git

**Changes not deploying**
- Check Vercel dashboard for build errors
- Ensure git push succeeded
- Verify `public/dashboard-data.json` is committed

### Token Stats Script

**"No token data found"**
- Check `~/.openclaw/agents/` exists and has sessions
- Verify date range includes recent sessions
- Run with `--period=month` for larger window

**Costs seem incorrect**
- Pricing is estimated; actual costs may vary
- Update TOKEN_PRICING in collect-token-stats.js
- Some models may use default pricing

---

## Future Enhancements

- [ ] Hook into gateway for real-time token logging
- [ ] Add project-level token budgets and alerts
- [ ] Track token usage per task more precisely
- [ ] Add model comparison analytics
- [ ] Export token reports (PDF/CSV)
