# Argument Map: Tree & Sunburst View Design

**Status:** Design  
**Last Updated:** April 22, 2026  
**Related:** pwa-rebuild-plan.md § 3.5 Argument Map View

---

## 1. Overview

Debate Dissector's Argument Map currently shows annotated text blocks in a **linear timeline** (document order) with manual link connectors. This document designs two additional view modes — **Tree** and **Sunburst** — inspired by Kialo's structured debate visualization, but adapted to Debate Dissector's fundamentally different workflow.

### Key Difference from Kialo

| Aspect | Kialo | Debate Dissector |
|--------|-------|------------------|
| Starting point | Empty thesis → add Pro/Con children | Written debate transcript → annotate → extract blocks |
| Structure | Strict tree (one parent per claim, one root) | DAG — directed acyclic graph (multiple roots, shared children) |
| Construction | Top-down (thesis first, children added to tree) | Bottom-up (blocks exist before any structure is imposed) |
| Node creation | User writes claim text directly into tree | Blocks are automatically extracted from annotated document text |
| Link semantics | Implicit (Pro/Con position in tree) | Explicit (user creates named links between blocks) |

### Three View Modes

The view switcher in the title bar will offer three modes:

1. **Timeline** (existing) — linear document-order view with connection arrows
2. **Tree** — hierarchical branching layout derived from links
3. **Sunburst** — radial visualization of argument structure

All three views render the **same underlying data**: `MarkupBlock[]` + `ArgumentLink[]`. No separate data model is needed per view.

---

## 2. Data Model Changes

### 2.1 ArgumentLink — Add `linkType`

```typescript
export interface ArgumentLink {
  id: string;
  sourceMarkId: string;   // The responding block's primary mark ID
  targetMarkId: string;    // The block being responded to
  linkType: LinkType;      // NEW — relationship type
  createdAt: number;
}

export type LinkType = 'supports' | 'rebuts' | 'ignores' | 'unspecified';
```

**Migration:** Existing links without `linkType` default to `'unspecified'`. The link creation UI should prompt the user to choose a type, but default to `'unspecified'` if dismissed.

**Visual mapping:**
- `supports` → green connector / placed on "Pro" side of tree
- `rebuts` → red connector / placed on "Con" side of tree
- `ignores` → amber connector / no tree position (shown as a cross-link or in staging)
- `unspecified` → gray connector / user hasn't categorized yet

### 2.2 MarkupBlock — Add Optional `isThesis`

Rather than a data model change, this is a UI-level flag stored on the `ArgumentLink` graph topology:

- A **root block** is any block with outgoing links but no incoming links, OR
- A block explicitly marked as a thesis by the user via a UI action

To support explicit thesis marking, add to `DebateDocument`:

```typescript
export interface DebateDocument {
  // ... existing fields ...
  argumentLinks?: ArgumentLink[];
  thesisMarkIds?: string[];  // NEW — mark IDs of blocks designated as thesis/root nodes
}
```

This allows the user to override the automatic root detection. A block in `thesisMarkIds` is always treated as a root, even if it has incoming links.

---

## 3. Graph Topology

### 3.1 The DAG (Directed Acyclic Graph)

Unlike Kialo's strict tree, Debate Dissector's link graph is a DAG:

```
Thesis A          Thesis B
  ├── Claim 1       ├── Claim 3
  │   ├── Rebuttal X ◄──┘  (shared child — rebuts both Claim 1 and Claim 3)
  │   └── Support Y
  └── Claim 2
      └── Rebuttal Z
```

**Properties:**
- **Multiple roots** — a debate can have several independent thesis statements
- **Shared children** — a block can rebut/support claims from different trees
- **Unattached blocks** — blocks with no links exist in a staging area
- **No cycles** — enforced at link creation time (reject links that would create a cycle)

### 3.2 Node Categories

Every block falls into one of these categories based on its position in the link graph:

| Category | Definition | Visual Treatment |
|----------|-----------|-----------------|
| **Thesis/Root** | In `thesisMarkIds` OR has outgoing links but no incoming | Top of tree, center of sunburst |
| **Attached** | Has at least one incoming or outgoing link | Positioned in tree hierarchy |
| **Shared** | Has incoming links from 2+ different parents | Badge showing connection count, appears in primary parent's branch |
| **Unattached** | Has zero links (no incoming, no outgoing) | Shown in staging area |
| **Orphan chain** | Has incoming links but its parent is unattached | Partial chain with dashed placeholder parent |

### 3.3 Cycle Prevention

When the user creates a link (source → target), check if `target` is an ancestor of `source` in the existing graph. If so, reject the link with a toast: "Cannot create link — this would create a circular reference."

```typescript
function wouldCreateCycle(
  sourceMarkId: string,
  targetMarkId: string,
  existingLinks: ArgumentLink[],
): boolean {
  // BFS/DFS from targetMarkId following outgoing links
  // If we reach sourceMarkId, it would create a cycle
  const visited = new Set<string>();
  const queue = [targetMarkId];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === sourceMarkId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    // Follow all outgoing links FROM this node
    // (because link direction is: source responds TO target,
    //  the tree parent is the target, child is the source)
    for (const link of existingLinks) {
      if (link.sourceMarkId === current) {
        queue.push(link.targetMarkId);
      }
    }
  }
  return false;
}
```

**Important note on link direction:** In the current data model, `sourceMarkId` is "the responding block" and `targetMarkId` is "the block being responded to." In tree terms, the **target is the parent** and the **source is the child**. This means:
- Tree parent = `targetMarkId`
- Tree child = `sourceMarkId`
- A block's children = all links where `link.targetMarkId === block.primaryMarkId`
- A block's parents = all links where `link.sourceMarkId === block.primaryMarkId`

---

## 4. Tree View Design

### 4.1 Layout

```
┌──────────────────────────────────────────────────────────┐
│ ☰ Summary bar  │ 12 passages │ 3 fallacies │ Timeline ▼ │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─── Staging Area (3 unattached blocks) ──────────┐     │
│  │ [Block A]  [Block B]  [Block C]                 │     │
│  └─────────────────────────────────────────────────┘     │
│                                                          │
│  ┌─── Thesis 1: "Climate change is..." ────────────┐    │
│  │                                                   │    │
│  │   ┌─ PRO ──────────────────────┐                  │    │
│  │   │  [Support: "Studies show…"]│                  │    │
│  │   │    └─ [Rebuttal: "But…"]   │                  │    │
│  │   └────────────────────────────┘                  │    │
│  │                                                   │    │
│  │   ┌─ CON ──────────────────────┐                  │    │
│  │   │  [Rebuttal: "However…"]   │                  │    │
│  │   │    ├─ [Support: "Data…"] ←─── shared (also   │    │
│  │   │    │                          under Thesis 2) │    │
│  │   │    └─ [Counter: "Yet…"]    │                  │    │
│  │   └────────────────────────────┘                  │    │
│  └───────────────────────────────────────────────────┘    │
│                                                          │
│  ┌─── Thesis 2: "Economic policy..." ──────────────┐    │
│  │   ...                                             │    │
│  └───────────────────────────────────────────────────┘    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 4.2 Staging Area

The staging area shows all **unattached blocks** — those with zero links. It appears at the top of the tree view and is collapsible.

**Behavior:**
- Blocks are displayed as compact cards (truncated text, type badge, speaker color)
- Drag-and-drop: drag a staging block onto a tree node to create a link (prompts for link type)
- Click-to-link: same connect button workflow as the timeline view
- When a block gets its first link, it automatically moves out of staging into the tree
- When all links to a block are deleted, it returns to staging
- Counter badge shows count: "3 unattached"

### 4.3 Tree Node Cards

Each node in the tree is a **compact card** similar to the existing `BlockCard` but with tree-specific additions:

```
┌────────────────────────────────────────────┐
│ ● Claim  │ Speaker A          [⊕] [−] [⋯] │
│                                            │
│ "The evidence clearly shows that..."       │
│                                            │
│ 3 Pro  │  2 Con  │  1 Shared               │
└────────────────────────────────────────────┘
```

- **Left border color** = speaker color (existing behavior)
- **[⊕]** = Add child link (starts linking mode, click another block)
- **[−]** = Collapse/expand children
- **[⋯]** = Context menu: Mark as thesis, Remove from tree, View in editor
- **Child count bar** = shows how many Pro (green) and Con (red) children
- **Shared badge** = if this block appears under multiple parents, show "Also linked to: [parent name]"
- Click the card to open annotation details in the sidebar (existing behavior)

### 4.4 Pro/Con Branching

Children of a node are split into two columns based on `linkType`:

| Link Type | Column | Color |
|-----------|--------|-------|
| `supports` | Pro (left) | Green accent |
| `rebuts` | Con (right) | Red accent |
| `ignores` | Displayed as a dimmed cross-link, not in either column |
| `unspecified` | Shown below both columns in a neutral section |

If no children have link types set, all children are shown in a single column with neutral styling.

### 4.5 Indentation & Nesting

- Each level of nesting is indented 24–32px
- Vertical tree lines connect parent to children (similar to a file explorer)
- Maximum visible depth: 5 levels (deeper levels accessible via drill-down)
- **Drill-down**: clicking a node's expand icon at deep levels re-roots the view on that node, with breadcrumbs to navigate back up

### 4.6 Shared Children

When a block has incoming links from 2+ parents:

1. The block appears **in full** under its **first parent** (by document order or creation time)
2. Under other parents, a **ghost card** appears:
   ```
   ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
   │ ↗ "The evidence clearly shows..."   │
   │   (also under Thesis 1 → Claim 3)  │
   └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘
   ```
3. Clicking the ghost card scrolls to / highlights the full card
4. A thin dashed line connects ghost cards to their full card (if both are visible)

---

## 5. Sunburst View Design

### 5.1 Layout

The sunburst is a **radial tree** where:
- **Center circle** = thesis/root node
- **Ring 1** = direct children (Pro/Con of thesis)
- **Ring 2** = grandchildren
- **Ring N** = N levels deep
- **Arc width** = proportional to the number of descendants (larger subtrees get wider arcs)

```
         ┌───────────────────┐
         │      Sunburst     │
         │                   │
         │      ╭─────╮      │
         │    ╭─┤Thesis├─╮   │
         │  ╭─┤ ╰─────╯ ├─╮ │
         │  │Pro│       │Con│ │
         │  ╰─┤         ├─╯ │
         │    ╰─────────╯    │
         │                   │
         └───────────────────┘
```

### 5.2 Color Coding

Each arc segment is colored by one of (user-selectable toggle):
- **Speaker** — arc color = speaker color (default)
- **Link type** — green for supports, red for rebuts, gray for unspecified
- **Markup type** — fallacy color, rhetoric color, or structural color (uses primary tag)

### 5.3 Interaction

- **Hover** an arc segment → tooltip showing block text preview, speaker name, and markup tags
- **Click** an arc segment → drill into that subtree (it becomes the new center, with breadcrumbs to go back)
- **Right-click / long-press** → context menu: View in editor, Remove link, Mark as thesis

### 5.4 Multiple Roots

With multiple thesis nodes, the sunburst shows a **multi-root layout**:
- The center is divided into equal slices, one per thesis
- Each thesis gets its own radial subtree expanding outward
- Alternatively: a small "All Theses" hub in the center, with each thesis as a Ring 1 segment

### 5.5 Shared Children in Sunburst

A block appearing under multiple parents is drawn in its **primary parent's arc** (largest subtree). A thin connecting line (chord) is drawn across the sunburst to the other parent's arc, similar to a chord diagram.

### 5.6 Unattached Blocks

Unattached blocks are shown as a **ring of small dots** around the outer edge of the sunburst, visually indicating "these exist but aren't placed yet." Clicking one opens a prompt to link it.

---

## 6. Staging Area (Unattached Blocks Panel)

### 6.1 Shared Across Views

The staging area is visible in both Tree and Sunburst views (not Timeline — timeline shows everything linearly regardless of links).

### 6.2 Layout

A collapsible panel at the top of the view:

```
┌─── Unattached Blocks (7) ─────────────── [Collapse ▲] ──┐
│                                                           │
│  [Filter: All ▼] [Sort: Document Order ▼]                │
│                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ "Text…"  │ │ "Text…"  │ │ "Text…"  │ │ "Text…"  │    │
│  │ Fallacy  │ │ Rhetoric │ │ Claim    │ │ Fallacy  │    │
│  │ Spkr A   │ │ Spkr B   │ │ Spkr A   │ │ Spkr B   │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│                                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                  │
│  │ "Text…"  │ │ "Text…"  │ │ "Text…"  │                  │
│  │ Evidence │ │ Statistic│ │ Quote    │                  │
│  │ Spkr A   │ │ Spkr B   │ │ Spkr A   │                  │
│  └──────────┘ └──────────┘ └──────────┘                  │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

### 6.3 Compact Card Format

Staging cards are smaller than full BlockCards:
- **Line 1:** Truncated text (50 chars max)
- **Line 2:** Primary markup type badge
- **Line 3:** Speaker name in speaker color
- **Left border:** Speaker color
- **Connect icon:** Same button as timeline view, positioned on left edge

### 6.4 Quick-Attach Workflow

Two methods to attach a staging block to a tree:

1. **Click-to-link** (existing flow):
   - Click connect icon on staging block → block becomes link source
   - Click a tree node → link is created, staging block moves into tree
   - Prompt appears: "How does this relate? [Supports] [Rebuts] [Other]"

2. **Drag-and-drop** (new):
   - Drag a staging card onto a tree node
   - Drop triggers the same link type prompt
   - On confirm, link is created and block moves into tree

---

## 7. Link Type Selection UI

### 7.1 When Link Type is Prompted

A link type selection appears when:
- Creating a new link (after clicking source + target)
- Explicitly editing an existing link's type

### 7.2 Inline Popover

After clicking source and target blocks, a small popover appears near the target:

```
┌─────────────────────────┐
│ How does this relate?   │
│                         │
│ [🟢 Supports]           │
│ [🔴 Rebuts]             │
│ [🟡 Ignores]            │
│ [⚪ Skip]               │
│                         │
└─────────────────────────┘
```

- **Supports** — creates link with `linkType: 'supports'`
- **Rebuts** — creates link with `linkType: 'rebuts'`
- **Ignores** — creates link with `linkType: 'ignores'`
- **Skip** — creates link with `linkType: 'unspecified'` (user can categorize later)

### 7.3 Batch Categorization

For existing links with `linkType: 'unspecified'`, show a banner in the tree/sunburst views:

```
⚠️ 5 links are uncategorized. [Categorize Now]
```

Clicking opens a modal that lists each uncategorized link with source/target text previews and link type buttons.

---

## 8. View Switcher Update

### 8.1 Current

The title bar has a two-option toggle: **Editor** | **Map**

### 8.2 Proposed

When in Map mode, add a secondary view mode selector:

```
[Editor] | [Map ▼]
               ├── Timeline (current)
               ├── Tree
               └── Sunburst
```

Or as sub-tabs within the map view:

```
┌──────────────────────────────────────────────────────┐
│ Summary bar  │  [Timeline] [Tree] [Sunburst]          │
├──────────────────────────────────────────────────────┤
│ (active view content)                                │
└──────────────────────────────────────────────────────┘
```

The sub-tab approach is preferred — it keeps the Editor/Map toggle simple and adds the view choice within the map context.

---

## 9. Implementation Phases

### Phase A: Data Model & Link Types (prerequisite)
1. Add `linkType` field to `ArgumentLink` interface
2. Add `thesisMarkIds` field to `DebateDocument`
3. Migrate existing links to `linkType: 'unspecified'`
4. Add link type selection popover to the existing link creation flow
5. Add cycle detection to `onCreateLink`
6. Add "Mark as thesis" action to block context menu
7. Update persistence in EditorPage

### Phase B: Tree View
1. Build graph traversal utilities (find roots, find children, detect shared nodes)
2. Create `ArgumentTreeView` component with recursive node rendering
3. Implement staging area (unattached blocks panel)
4. Add Pro/Con column layout based on link types
5. Implement shared node ghost cards
6. Add collapse/expand per node
7. Add drill-down navigation with breadcrumbs
8. Wire into view switcher as a sub-tab

### Phase C: Sunburst View
1. Build radial layout algorithm (arc positions, ring sizes)
2. Create `ArgumentSunburstView` component using SVG
3. Implement hover tooltips and click-to-drill-down
4. Add multi-root center layout
5. Add shared-child chord connectors
6. Add unattached block dots on outer ring
7. Add color mode toggle (speaker / link type / markup type)
8. Wire into view switcher as a sub-tab

### Phase D: Polish & Interaction
1. Drag-and-drop from staging to tree
2. Batch link categorization modal
3. Smooth animations for tree expand/collapse
4. Sunburst drill-down transitions
5. Keyboard navigation for tree view
6. Responsive layout for mobile (tree collapses to single-column)

---

## 10. Open Questions

1. **Should "ignores" links be shown in the tree at all?** They represent a non-response, so they might be better as annotations on the parent node rather than child branches.

2. **Maximum practical depth?** Kialo debates can go 10+ levels deep. With extracted blocks from a typical debate transcript, realistic depth is probably 3–5 levels. Should we enforce a limit?

3. **Auto-suggest links?** When a block in staging has text overlap with an existing tree node (e.g., same keywords, same speaker responding), should we suggest a link? This is non-AI — just keyword/heuristic matching.

4. **Should the sunburst be interactive on mobile?** Radial visualizations are hard on small screens. Consider making it view-only on mobile with a "switch to tree view" prompt.

5. **Undo support?** Link operations (create, delete, change type) should be undoable. Should this use the existing version history system or a separate undo stack?
