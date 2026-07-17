# Sage

Quiz app I use for studying. React + Vite frontend, small Express server.

Run with `npm install` then `npm start` (or just double-click `sage.command` on the Mac). Opens at http://localhost:4400 — also works from the phone if it's on the same wifi.

### macOS blocks sage.command?

If you downloaded this as a zip, macOS quarantines the script and shows a "Not Opened" warning — it's unsigned, not malicious. Any of these fixes it:

- Clone instead of downloading the zip (`git clone https://github.com/upetik/sage.git`) — cloned files aren't quarantined.
- Or try to open it once, then go to System Settings → Privacy & Security, scroll down and click "Open Anyway".
- Or run `xattr -d com.apple.quarantine sage.command` in Terminal once, then double-click works.
- Or skip the script entirely: `npm install` + `npm start` in Terminal never triggers the warning.

## Quiz format

One markdown file per quiz in `quizzes/`:

```markdown
# Optional Quiz Title

## Question text goes here?
- Wrong answer
- *Correct answer (asterisk marks it)
- Wrong answer
- Wrong answer
> Optional hint, opened from the lightbulb button on the card
```

Exactly 4 answers per question, exactly 1 correct, or the question gets skipped. A `> quote` line after the answers becomes the question's hint (write it so it doesn't give the answer away) — leave it out and no lightbulb appears. Everything else in the file is ignored, so notes are fine. Hit "Sync" in the app after editing files.

Images and renamed titles live in `data/`.
