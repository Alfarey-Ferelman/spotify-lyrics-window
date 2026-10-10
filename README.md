# spotify-lyrics-window

A Spicetify extension that shows synced lyrics in the main area of the Spotify window,
with a blurred, cover-based gradient background.

## Features
- Synced lyrics with the current line highlighted
- Click a line to jump to it
- Gradient background that follows the cover art
- Button in the player bar, or press Alt+L
- Remembers whether the window was open

## Install
Via Spicetify Marketplace (Extensions tab), or manually:

1. Put `my-lyrics.js` into your Spicetify `Extensions` folder
2. Run:

```
spicetify config extensions my-lyrics.js
spicetify apply
```

## Notes
Lyrics come from Spotify's own lyrics service, with LRCLIB as a fallback.
Unofficial project, not affiliated with Spotify.
