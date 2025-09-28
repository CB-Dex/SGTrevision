# SGT Revision Briefings

A static set of briefing notes for the UK Police Sergeant's exam. The site emphasises short explanations over rote testing, letting you scan the key sections and references that matter most.

## Features
- Topic picker with instant previews so you can gauge where to focus next.
- Browse view with search and tag filters to surface the right explanation quickly.
- Concise cards that pair the section title with practical commentary and Blackstone's references.
- Optional dark theme stored locally in the browser. No logins or analytics.

## Running locally
No tooling is required. Clone or download the repository, then open `index.html` in a modern browser (double-click it or use **File → Open**). The page will load `data.json` from the same folder and render immediately.

## Deploying to GitHub Pages
1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Select **Deploy from a branch**, choose your branch, and keep the root (`/`) folder.
4. Save. Pages will publish the static files automatically.

## Updating `data.json`
- Keep the existing structure: topics → subtopics → cards. Each card includes `id`, `subtopic_id`, `question`, `answer`, `reference`, `subtitle`, `tags`, and optional `explanation`.
- Assign new numeric IDs when adding material. This keeps existing links intact.
- Because the site no longer tracks quiz progress, you can freely edit wording without affecting browser storage.
- Refresh the browser after saving edits to load the latest content.

### CSV planning template
When drafting in a spreadsheet, use:
```
id,subtopic_id,question,answer,reference,subtitle,tags,explanation
```
- Separate multiple tags with a pipe (e.g. `mens rea|OAPA`).
- Leave `explanation` blank if a single paragraph is enough.

## How search works
The browse search matches keywords across the question, answer, subtitle, reference, topic, subtopic, and tags fields. Filter dropdowns narrow the list by topic or tag for faster access to the most relevant guidance.
