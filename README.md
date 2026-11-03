# SoundRoom

A clickable concept for live group listening on X with Spotify Premium: one room with shared playback, a vote-ranked queue, chat, reactions and an optional X Space for voice.

**Live demo:** https://poweressien.github.io/X-x-Spotify-sound-room/

> **This is a concept prototype.** It is not affiliated with, or endorsed by, X Corp. or Spotify AB. Every person, room, song list and number is simulated. No network requests are made and no accounts are connected.

## What you can try

- **Overview:** the idea in one screen, with a tappable record.
- **Rooms:** trending, top ranked, by genre, picked for you, and your join requests. Search and sort work.
- **Live room:** player, seek, queue with voting, add a song, chat, reactions, members, stats, invite.
- **Join flows:** public rooms open at once, request rooms wait for the host (use "Simulate host approval"), private rooms need an invite.
- **Create room:** name, genre, who can join, X Space on or off.
- **Connect:** a simulated OAuth flow that shows the scopes each side would ask for.
- **How it works:** the architecture, sync approach and the public endpoints involved.
- **Proposal:** the case, risks and a pilot plan. "Save as PDF" prints a clean version.
- **Tour:** an 11-step guided walk. Arrow keys move, Escape exits.

## Run it

It is plain HTML, CSS and JavaScript with no build step.

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` directly also works.

## Files

```
index.html          markup, icon sprite, dialogs
assets/styles.css   design tokens and all styles
assets/app.js       state, rendering and simulated behaviour
assets/favicon.svg  tab icon
assets/og.png       social preview image
```

## Notes on the build

- Text typed by a person (room names, chat) is never parsed as HTML. All DOM nodes are built with `createElement` and `textContent`.
- A Content-Security-Policy meta tag blocks inline scripts and external script sources.
- Keyboard and screen reader support: skip link, labelled controls, tablists with arrow keys, native dialogs with focus handling, a live region for notifications.
- `prefers-reduced-motion` is respected.
- Fonts (Bricolage Grotesque and Instrument Sans) load from Google Fonts. The page falls back to system fonts if they are blocked.

## What a real version would need

- X does not offer a public API to create or host a Space from another app. Voice would need a first-party integration or a partnership.
- Spotify has no shared playback clock. Sync would be approximate, corrected by periodic seeks, and every listener needs Premium.
- Production use of either API needs approval and agreement to the provider's developer terms.

## License

MIT. See [LICENSE](LICENSE).
