# Trello Sync for trello-roadmap.md

Automatically sync tasks from the project roadmap to a Trello board.

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

### Clean Sync (delete all cards first)
```bash
npm run sync -- --clean
```

## How It Works

1. **Parses** `docs/plans/trello-roadmap.md` for sections and tasks
2. **Extracts** task status from checkboxes (`- [ ]` = todo, `- [x]` = done)
3. **Creates/updates** Trello cards with:
   - One card per section (e.g., "Project Setup", "Debate Editor")
   - Checklist items for each task
   - Cards organized into lists by focus area
4. **Skips** `**LEGAL:**` notes (reminders, not tasks)

## Board Structure

The script creates one **list per focus area**:
- Foundation
- Core Features
- Advanced Editor Features
- User Experience
- Sharing & Collaboration
- Public Debate Library (Future)
- Platform Features
- Future Preparation
- Testing & Quality

Each **section** becomes a **card** with a **checklist** of tasks.

## GitHub Action

The workflow at `.github/workflows/trello-sync.yml` auto-syncs when `trello-roadmap.md` changes.

**Required GitHub Secrets:**
- `TRELLO_API_KEY` - Your Trello API key
- `TRELLO_TOKEN` - Your Trello authorization token
- `TRELLO_BOARD_ID` - The ID of your Trello board

Add these in: **Repository Settings → Secrets and variables → Actions → New repository secret**
