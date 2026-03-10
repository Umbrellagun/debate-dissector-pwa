# Trello Sync for pwa-rebuild-plan.md

Automatically sync tasks from the project plan to a Trello board.

## Setup

### 1. Get Trello API Credentials

1. Get your API key at: https://trello.com/app-key
2. Generate a token by visiting:
   ```
   https://trello.com/1/authorize?expiration=never&scope=read,write&response_type=token&key=YOUR_API_KEY
   ```
3. Find your board ID from the board URL: `https://trello.com/b/BOARD_ID/board-name`

### 2. Configure Environment

```bash
cd scripts/trello-sync
cp .env.example .env
# Edit .env with your credentials
```

### 3. Install Dependencies

```bash
npm install
```

## Usage

### Full Sync
```bash
npm run sync
```

### Dry Run (preview changes)
```bash
npm run dry-run
```

## How It Works

1. **Parses** `docs/plans/pwa-rebuild-plan.md` for task items
2. **Extracts** task status from checkboxes (`- [ ]` = todo, `- [x]` = done)
3. **Creates/updates** Trello cards with:
   - Card name = task text
   - Label = Phase (color-coded)
   - List = To Do or Done based on status
4. **Skips** `**LEGAL:**` notes (reminders, not tasks)

## Board Structure

The script will create these lists if they don't exist:
- **To Do** - Incomplete tasks
- **In Progress** - (for manual use)
- **Done** - Completed tasks

## GitHub Action

To auto-sync when the plan changes, add this workflow:

```yaml
# .github/workflows/trello-sync.yml
name: Sync to Trello

on:
  push:
    paths:
      - 'docs/plans/pwa-rebuild-plan.md'

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install dependencies
        run: cd scripts/trello-sync && npm install
      - name: Sync to Trello
        env:
          TRELLO_API_KEY: ${{ secrets.TRELLO_API_KEY }}
          TRELLO_TOKEN: ${{ secrets.TRELLO_TOKEN }}
          TRELLO_BOARD_ID: ${{ secrets.TRELLO_BOARD_ID }}
        run: cd scripts/trello-sync && npm run sync
```

Add your Trello credentials as repository secrets in GitHub.
