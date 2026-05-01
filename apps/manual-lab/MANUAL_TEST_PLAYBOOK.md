# Pulse Manual Lab - Step-by-Step Test Playbook

This guide is for manual testing in your current local environment (WSL + local browser), with no external internet required.

It covers:
- How to confirm editor state is correct
- How to use `advanced` mode without confusion
- How to test each available feature in the manual lab
- What "pass" should look like for each test

---

## 0) Start Server

From project root:

```bash
npm run dev:manual-lab
```

Open:
- Simple mode: `http://127.0.0.1:4177/`
- Advanced mode: `http://127.0.0.1:4177/advanced`

If browser shows old behavior, hard refresh:
- `Ctrl+Shift+R`

---

## 1) How to Verify State Correctness (Important)

You can verify state in 3 ways:

1. **UI chips/status**
   - Focus chip, recent commands, save status chips
2. **Advanced "Status JSON" panel**
   - Live snapshot of palette/save/dnd/selection data
3. **Direct API check**
   - `GET /api/state` from browser console or terminal

### Browser Console state check

On either page, open DevTools Console and run:

```js
fetch('/api/state').then((r) => r.json()).then((data) => console.log(data.snapshot));
```

You should see:
- `snapshot.document.blocks` (all blocks)
- `snapshot.document.focusedBlockId`
- `snapshot.palette.state`
- `snapshot.saveStatus`

### Terminal state check

```bash
curl -sS http://127.0.0.1:4177/api/state
```

---

## 2) Advanced Mode Map (What Each Section Does)

In `http://127.0.0.1:4177/advanced`, left panel sections are:

1. **Runtime**
   - Reset, save, autosave flush, copy/paste, clear events
2. **Block Focus & Text**
   - Focus a block and update its text
3. **Selection & Toolbar**
   - Set selection range and test floating toolbar context
4. **Slash / Backslash Suggestions**
   - Open palette, navigate with arrows, use Tab/Enter semantics
5. **Command & Shortcut Execution**
   - Run command by ID or shortcut combo
6. **Context & DnD**
   - Block menu, selection menu, drag and drop
7. **Event Filters**
   - Filter event logger by text/source

Right panel is preview/debug surfaces:
- Editor surface
- Palette preview
- Toolbar preview
- Context menus
- Block action menu
- Inspector
- Event logger
- Status JSON
- Block list

---

## 3) Full Feature Test Flow (Recommended Order)

Follow this sequence exactly to reduce confusion.

### Step 1 - Baseline load

1. Open `/advanced`
2. Confirm status says ready (not error)
3. Confirm block list shows seeded blocks (`lab-b1`, `lab-b2`, `lab-b3`)

Pass:
- No red status error
- Seed blocks visible

---

### Step 2 - Focus + text update

1. In **Block Focus & Text**, choose `lab-b2`
2. Click **Apply Focus**
3. In textarea, type mixed text: `Hello سلام 123`
4. Click **Update Focused Text Block**

Pass:
- Block text updates in editor surface and block list
- `focusedBlockId` updates in status snapshot

---

### Step 3 - Slash command open and execute

1. In **Slash / Backslash Suggestions**:
   - Trigger: `/`
   - Query: `insert`
2. Click **Open Suggestions**
3. Click **Arrow Down** once
4. Click **Enter (Final)**

Pass:
- A command executes
- Block count may increase (depending on command)
- Recent commands chip updates

---

### Step 4 - Nested command flow (Tab vs Enter)

1. Trigger: `/`, Query: `insert`
2. Click **Open Suggestions**
3. Click **Tab (Pre-confirm)** (this should enter submenu/path)
4. Click **Tab** again if needed to go deeper
5. Click **Enter (Final)** to execute

Pass:
- `Path` updates while using Tab
- Command executes only on Enter
- Palette closes after final execution

---

### Step 5 - Backslash macro flow

1. Trigger: `\\`, Query: `date` (or another available macro keyword)
2. Open suggestions
3. Use Enter to execute

Pass:
- Macro-related command executes
- Changes visible in state/events or block content

---

### Step 6 - Shortcut dispatch

1. In **Command & Shortcut Execution**, choose any shortcut combo from dropdown
2. Click **Dispatch Shortcut**

Pass:
- Status message reports dispatch result
- Related command effect appears in state/UI

---

### Step 7 - Selection + floating toolbar context

1. In **Selection & Toolbar** choose a text block
2. Set start/end offsets (example: `0` to `5`)
3. Click **Set Selection**
4. Observe **Toolbar preview** section

Pass:
- Toolbar appears when range is non-collapsed
- Toolbar buttons are enabled/disabled based on selection context

Note:
- Current renderer may not show visual rich text style differences yet (see Known Limitations).

---

### Step 8 - Block context menu

1. In **Context & DnD**, choose target block
2. Click **Open Block Menu**
3. Click **Run First Block Menu Item**

Pass:
- Block menu opens with items
- First enabled command executes

---

### Step 9 - Selection context menu

1. Ensure selection is set (Step 7)
2. Click **Open Selection Menu**
3. Click **Run First Selection Item**

Pass:
- Selection menu opens
- Command executes with selection context

---

### Step 10 - Block action menu + hover state

1. In simple mode (`/`), hover a block and open quick actions
2. In advanced mode, click **Hover Action Menu** in Block Focus section

Pass:
- Block action menu becomes visible
- Action commands execute

---

### Step 11 - Drag and drop

1. In **Context & DnD**, select a drag block
2. Set drop index (example: `0`)
3. Click **Apply DnD**

Pass:
- Block order changes in block list
- DnD snapshot updates in status JSON

---

### Step 12 - Clipboard copy/paste

1. Select/focus block(s)
2. Click **Copy Blocks**
3. Click **Paste Blocks**

Pass:
- Paste result reports pasted block IDs/count
- New block(s) appear

---

### Step 13 - Save + autosave

1. Edit text in focused block
2. Click **Manual Save**
3. Click **Flush Autosave**

Pass:
- `saveStatus.lastSavedAt` updates
- Status reports save/autosave completion

---

### Step 14 - Event logger + filters

1. Perform 2-3 actions (edit, command, save)
2. In **Event Filters**, enter text like `save`
3. Optionally set source filter
4. Click **Apply Event Filter**

Pass:
- Event list narrows to matching entries
- Clear with **Clear Events**

---

### Step 15 - Reset runtime

1. Click **Reset Runtime**

Pass:
- Seed blocks restored
- Focus returns to initial fixture
- State resets to clean baseline

---

## 4) Minimal Smoke Checklist (Quick Pass/Fail)

If you only have 3-5 minutes, test these:

1. Open `/advanced` and confirm ready
2. Update block text and confirm in state
3. Run one slash command via Enter
4. Run one nested command flow via Tab then Enter
5. Run one shortcut
6. Save and confirm `lastSavedAt`
7. Reset runtime

If all 7 pass, core manual-lab workflow is healthy.

---

## 5) Known Limitations (Current Phase)

These are expected right now:

1. Many non-text blocks render as structured data preview, not final polished visuals.
2. Formatting commands (for example `bold`) update state marks, but visible rich text styling may not yet be fully reflected in this lab renderer.
3. `favicon.ico` 404 in console is non-blocking.
4. Browser extensions may inject unrelated console logs.

These are normal for the current pre-Phase-3 renderer stage.

---

## 6) If Something Fails

When reporting a bug, always include:

1. URL (`/` or `/advanced`)
2. Exact step number from this playbook
3. Status message text on page
4. First console error line
5. `fetch('/api/state')` output snippet (focusedBlockId, palette state, save status)

This makes debugging much faster.

