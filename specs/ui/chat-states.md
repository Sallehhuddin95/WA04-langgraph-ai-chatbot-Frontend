# Chat States

## Status

Draft

## Goal

Show one clear state at a time for the chat surface. Each state tells the user what happened and what to do next. Copy uses product language only.

This spec follows `docs/shared/error-handling.md`. Retry stays scoped to the failed slice. Route `error.tsx` covers route crashes. `QueryCache` toasts cover async failures. Inline messages cover validation and turn failures.

## Entry Points

- `/chat` for thread list plus active thread
- `/chat/[threadId]` for direct thread link or reload

## Layout and Sections

- left or top: thread list
- center: message list
- bottom: composer with send and stop
- under each assistant turn: citation list when present
- inline slot on a failed turn for retry

## Interactive Elements

- new thread button
- thread select items
- composer input and send button
- stop button while streaming
- retry button on the failed turn only
- citation links that open the source

## Visual Rules

- send button and active thread use blue-600, hover uses blue-500
- dark mode: send button and active thread use blue-500, hover uses blue-400
- user bubble uses blue-50, assistant turn uses a white card
- dark mode: user bubble uses slate-800, assistant turn uses a slate-900 card
- page background is slate-50, message cards are white
- dark mode: page background is slate-950, message cards are slate-900
- secondary text uses gray-500
- skeleton blocks use slate-100
- dark mode: skeleton blocks use slate-800
- focus rings use blue-500
- dark mode: focus rings use blue-400
- citation chips use blue-50 with blue-700 links
- dark mode: citation chips use blue-950 with blue-300 links
- icons stay minimal, one icon per action
- state copy below is unchanged, these colors apply on top of each state

## Loading State

What appears while data or actions are pending:

- thread list skeleton on first load
- turn skeleton or spinner when opening a thread
- composer disabled with send replaced by stop during stream
- streaming text renders as deltas arrive; citation list appears at turn end

Copy:

- `Loading your chats.`
- `Loading messages.`

## Empty State

What appears when no data exists:

- no threads: `No chats yet. Start your first chat below.`
- new thread with no turns: `Ask a question to begin. Replies show sources when available.`
- thread not found: `This chat was not found. Pick another chat or start a new one.`

Empty states offer one next action: start thread, send prompt, or open thread list.

## Error State

### Streaming state

- partial reply stays visible with a typing marker
- stop keeps partial text and marks it stopped: `Reply stopped. You can retry or ask a new question.`
- retry scope is the active turn only

### Grounded reply with citations

- reply text with numbered markers such as `[1][2]`
- citation list under the turn with title and link per item
- missing citation data does not block the reply; list shows `Sources were not returned for this reply.`

### Ungrounded fallback notice

- shown when `is_grounded` is false
- copy: `This reply has no supporting sources. Check the answer before you use it.`
- citations section is hidden or shows the same notice; no fake markers

### Validation

- empty prompt: `Type a message before sending.`
- too long prompt: `Keep your message under 4000 characters.`
- failed local parse: `That message could not be sent. Edit it and try again.`
- mapped to the composer field only

### Auth expired

- copy: `Your session expired. Sign in again to keep chatting.`
- action: sign-in button; pending draft stays in the composer when possible
- further sends route to sign-in instead of failing silently

### Forbidden

- copy: `You do not have access to this chat.`
- action: back to thread list

### Offline

- copy: `You are offline. Check your connection and try again.`
- send stays disabled until connection returns
- failed turn from lost connection offers retry on that turn

### Server failure on a turn

- copy: `This reply failed to load. Retry this turn.`
- toast copy: `Could not get the reply. Retry the failed turn.`
- retry scope is the failed turn only; other turns stay intact

Retry scope summary:

- route crash: retry in `error.tsx` for that route slice
- turn failure: retry button on that turn
- list failure: retry button on the list pane
- one broken slice must not clear the full screen when avoidable

## Responsive Behavior

- desktop: thread list beside message list
- small screens: thread list collapses behind a toggle; composer stays pinned at the bottom
- citation list wraps under the turn on narrow widths

## Accessibility Notes

- composer uses a labeled input with `aria-label` such as `Message input`
- send and stop use real buttons with clear names
- streaming region uses `aria-live: polite` without reading every delta twice
- citation markers are keyboard reachable links
- auth and error notices use `role: alert` for the active message only
- focus moves to the failed turn retry or to the sign-in action when those states appear
