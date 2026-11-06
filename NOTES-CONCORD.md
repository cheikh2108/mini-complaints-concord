# Notes: trying Concord MCP with two coding agents

Test project: a small complaints app (Express API + React front + shared TypeScript types).
Plan: Claude Code owns `backend/` and `shared/types.ts`; Gemini CLI builds `frontend/` and must
ask Claude (through Concord) before touching `shared/types.ts`. Date: 2026-11-06.

## What happened

1. `git init`, `npm i -g @concord-ai/concord-mcp`, `concord setup`: all worked first try
   (about 1 minute for the install). Setup detected Claude Code, Gemini, Cursor and Antigravity.
2. Claude Code did not see the Concord tools in the session where setup ran. A restart was
   required so the project MCP server (`.mcp.json`) was loaded. After the restart, the five
   tools (`start_work`, `inspect_work`, `update_work`, `transfer_work`, `finish_work`) appeared.
3. Claude called `start_work` (task `API-1`, files `backend/**` and `shared/types.ts`): the claim
   was accepted with no overlaps. It built the API, checked it with curl, and published the API
   contract as a `decision` update on `API-1`.
4. Gemini was launched headless with `concord adapters gemini --approval-mode auto_edit -p "..."`.
   It registered in Concord (`gemini:...`) but never got to write code: the Gemini API returned
   503 ("high demand") on the first run and 429 (free-tier daily quota exhausted) on the second.
5. Fallback: Claude claimed `FRONT-1` (`frontend/**`) in Concord and built the frontend itself
   (Vite + React + TS, `npm run build` passes). It then verified API and front together by
   calling the API through the Vite proxy (create, validation error, filter, status change, stats).
   The rendered UI was not checked in a browser.
6. Both tasks were closed with `finish_work` (`review_ready`) with files, tests, decisions, risks.

## What worked well

- Setup is one command and writes instructions and MCP config for many agents at once.
- `start_work` / `finish_work` give a clear, low-ceremony lifecycle; overlap detection is built in.
- `concord status` is a readable snapshot (who is here, active work, overlaps, stale claims).
- Messages carry receipts (sent, delivered, read, replied) and an honest `outlook`: it told me
  right away that the recipient had no live session and the message was only queued.
- Publishing the API contract as a durable `decision` on the task is a good fit: it outlives chat.
- `.concord/` is self-gitignored, so the shared state does not pollute the repo.

## Problems

- **Restart needed.** The MCP tools only load at session start; the CLI cannot reserve files or
  post updates, so nothing useful can be done until the agent restarts.
- **Headless agents are second-class.** With `gemini -p`, Concord warns that the inbox monitor
  does not start on its own. So a message sent to that agent is only queued (`queued_pull`) and
  would never reach a one-shot run. The "ask before touching shared/types.ts" flow could not be
  tested live.
- **Failed agent, no cleanup signal.** Gemini crashed (exit 1) and stayed listed as
  `idle/active` in `concord status`; two Gemini identities piled up (one per attempt) and there was
  no easy "this agent is gone" action.
- **Auto-approval needed for headless runs.** Gemini needs `--yolo` to call MCP tools and shell
  commands without a human. Claude Code's permission classifier refused to launch it that way, so
  I used the weaker `auto_edit` mode, which may not allow Concord tool calls either. This was never
  confirmed because the API quota failed first.
- **Setup footprint is large.** It wrote instruction/config files for 8+ tools, even for tools not
  installed (Codex, Grok, Devin), and edited user-level config (`~/.codex/config.toml`, extensions
  under `~/.claude`, `~/.gemini`, `~/.cursor`). The generated MCP files contain absolute local
  paths, so they must not be committed (they are gitignored here).
- **Telemetry on by default** (IP and country stored without expiry); opt-out is an env var.
- External, not Concord's fault: the Gemini free-tier outage/quota blocked the main scenario.

## Two suggestions

1. **Make one-shot / headless agents first-class.** On start, a headless agent should pull its
   pending messages and print them; `concord adapters <agent> -p` should say clearly whether a
   message can reach it; and a claim whose agent exited with an error should be flagged (or
   auto-released after a short lease) so another agent can take over with one command.
2. **Smaller, safer setup defaults.** Only configure detected tools, make user-level and global
   changes opt-in with a dry-run summary, generate per-machine files (with absolute paths) already
   gitignored or with relative paths, and make telemetry opt-in or at least announced during setup.
