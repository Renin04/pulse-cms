# Pulse Manual Lab Server

A local interactive test server for exercising current Pulse editor capabilities in one place.

## What you can test

- Slash and backslash command suggestions (`/` and `\`)
- Nested command paths with Tab (pre-confirm) vs Enter (final execute)
- Persian alias command search and mixed RTL/LTR query input
- Command registry execution
- Shortcut dispatch flows
- Block and selection context menus
- Block action menu and drag/drop reorder
- Clipboard copy/paste flows
- Manual save + autosave flush behavior
- Block inspector and event logger dev surfaces

## Run

From project root:

```bash
npm run dev:manual-lab
```

Then open:

- `http://127.0.0.1:4177` (Simple editor-like UI)
- `http://127.0.0.1:4177/advanced` (Full control surface)

## 2-minute quick start (simple mode)

1. Open `http://127.0.0.1:4177`.
2. In **Text Editing**, pick a focused block, type mixed English/Persian text, click **Update Focused Block**.
3. In **Slash / Backslash**, choose `/` or `\`, type a query (for example `insert/text` or `تیتر`), click **Open**.
4. Press **Tab** for preliminary path acceptance, then **Enter** for final command execution.
5. Use **Save / Copy / Paste** to validate persistence and clipboard flows.
6. If you need every debug action (selection menus, DnD details, filters), open `/advanced`.

## Notes

- The script runs `npm run build` first and then starts the server.
- This lab is intentionally local-only and does not require external network access.
- The UI is a manual verification harness, not the final product UI.
- Full step-by-step test flow (including advanced mode and state validation): `apps/manual-lab/MANUAL_TEST_PLAYBOOK.md`.
