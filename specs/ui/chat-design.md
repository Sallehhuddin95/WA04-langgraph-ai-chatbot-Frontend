# Chat Design

## Status

Draft

## Goal

Lock the visual language for the chat surface. This file wins on colors, type, components, and layout. Flows stay in `specs/features/chat-ui.md`. State copy stays in `specs/ui/chat-states.md`.

## Palette Tokens

- primary: blue-600 for send, active thread, and primary actions
- primary hover: blue-500
- tint: blue-50 for user bubble and citation chips
- text: slate-900 for main text
- muted: slate-500 for secondary text, timestamps, and hints, gray-500 is allowed as an alias for secondary text
- surface: white for message cards and thread buttons
- page: slate-50 for the main column background
- sidebar: slate-200 for the thread sidebar background
- border: slate-200 for card and input borders, slate-300 for the sidebar edge
- skeleton: slate-100 for loading blocks
- focus: blue-500 for focus rings
- no extra accent colors, no gradients, no artwork
- brand: Singularity in the header, assistant name Singularity above each reply, avatar fallback S

## Theme

- default theme is light. Dark mode is opt-in through a header toggle.
- strategy: class on `html`. Use Tailwind `dark:` variant. Hold state in next-themes or an isolated Zustand store per `docs/frontend/FRONTEND_GUIDELINE.md` section 7.
- light tokens: page slate-50, sidebar slate-200, surface white, text slate-900, primary blue-600, primary hover blue-500, border slate-200, sidebar edge slate-300, skeleton slate-100, tint blue-50, focus blue-500.
- dark tokens: page slate-950, sidebar black (near-black), surface slate-900, text slate-100, primary blue-500, primary hover blue-400, border slate-800, skeleton slate-800, tint blue-950 for chips and slate-800 for bubbles, focus blue-400.
- toggle: header slot. Use shadcn Switch or Button with Sun and Moon icons.
- persist: save choice in localStorage or cookie. On first load respect prefers-color-scheme. Fall back to light when no saved choice and no OS preference.
- no flash: set the class on `html` early with an inline script in the root layout before first paint.

## Typography

- font stack: Inter, system stack fallback
- headings: tight tracking, short labels for thread titles and pane titles
- message text: 15px with relaxed line height for reading
- secondary text: 13px for timestamps, hints, and metadata
- code or citation text: 13px, mono only where the component already provides it

## Components

Use shadcn/ui only, no custom kit:

- Button for send, stop, retry, new thread, and sign-in
- Input or Textarea for the composer field
- Card with rounded-xl, slate-200 border, and subtle shadow for message turns
- Avatar for user and assistant markers, minimal style, no large art
- Skeleton in slate-100 for thread list and turn loading
- ScrollArea for the message column and thread list
- Tooltip for icon-only buttons where the label needs a hint

Rules:

- one icon per action, minimal outline style
- composer is sticky at the bottom of the message column
- citation markers are plain links, reachable by keyboard

## Layout

- desktop: 280px thread sidebar beside the message column
- mobile: sidebar collapses into a drawer behind a toggle, composer stays pinned at the bottom
- message column: centered, max width 768px, with spacious padding between turns
- citation list wraps under its turn on narrow widths
- sticky composer keeps send and stop visible during scroll

## Citation Chips

- chip background: blue-50 with a slate-200 or blue-100 border
- chip link text: blue-700
- dark mode: chip background blue-950 with blue-300 links, see Theme for tokens
- numbered markers in reply text link to the matching chip
- missing sources show plain text from `specs/ui/chat-states.md`, no fake chips

## Out of Scope

- prompt tuning, model pickers, and agent internals
- new color themes beyond light and dark, or brand restyles
- custom component library work outside shadcn/ui

## Related Specs

- Feature: `specs/features/chat-ui.md`
- States: `specs/ui/chat-states.md`
- Client contract: `specs/api/chat-client-contract.md`
