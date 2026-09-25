# Chat Acceptance

## Status

Draft

## Scope

UX journeys for the frontend chat surface only. This covers send and stream, citations display, retry of a failed turn, resume on reload, signed-out redirect, and expired session notice.

Agent correctness such as retrieval quality, grounding accuracy, ranking, or prompt behavior is owned by the backend. See backend acceptance for `chat-agent`. Do not duplicate those checks here.

Related:

- feature: `specs/features/chat-ui.md`
- client contract: `specs/api/chat-client-contract.md`
- states: `specs/ui/chat-states.md`

## Scenarios

### Scenario: Send and stream a reply

Given a signed-in user on `/chat` with a thread open
When the user sends `What is the refund policy?`
Then the composer clears and disables send
And deltas append to a pending assistant turn
And the final turn shows full `reply_text` with no raw `trace_id` in the body

### Scenario: Show citations on a grounded reply

Given a finished assistant turn with `is_grounded` true and two citations
When the user views the turn
Then numbered markers link to a citation list under that turn
And each citation shows title and link
And opening a citation opens its source

### Scenario: Show fallback on an ungrounded reply

Given a finished assistant turn with `is_grounded` false
When the user views the turn
Then the UI shows `This reply has no supporting sources. Check the answer before you use it.`
And no fake citation markers appear

### Scenario: Stop a streaming reply

Given a turn is streaming
When the user selects stop
Then the stream reader closes
And partial text stays marked as stopped
And the UI offers retry or a new prompt without breaking the thread

### Scenario: Retry a failed turn

Given a turn failed with a server error
When the user selects retry on that turn
Then only that turn resends with the same `user_text`
And other turns stay intact
And success replaces the failed state with the new reply

### Scenario: Resume on reload

Given a thread with settled turns
When the user reloads `/chat/[threadId]`
Then the thread list and turns reload from the backend
And the last settled state appears without duplicate sends

### Scenario: Signed-out redirect

Given a user with no valid session on `/chat`
When the page loads or a send is attempted
Then the app routes to sign-in
And no turn request is sent
And no internal error text is shown

### Scenario: Expired session notice

Given a session that expires during an open chat
When the next send or stream starts
Then the UI shows `Your session expired. Sign in again to keep chatting.`
And the composer draft is kept when possible
And the sign-in action is focused or clearly offered

### Scenario: Offline send blocked

Given the client is offline
When the user tries to send
Then the UI shows `You are offline. Check your connection and try again.`
And send stays disabled until connection returns
