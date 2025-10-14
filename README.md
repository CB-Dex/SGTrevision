codex/create-static-site-for-police-sergeant-revision-52i62c
# SGT Revision Toolkit

A fast, accessible static site that maps every topic in the Blackstone's Police Sergeants' & Inspectors' Manuals. The toolkit lists all chapters across the Crime, Evidence & Procedure, and General Police Duties volumes and pairs them with quick reference study cards.

## Features
- Header topic picker with live preview of chapter counts and highlights.
- Home overview showing the complete breakdown of every chapter for each Blackstone's volume.
- Browse view for filtering and searching study cards by topic, keyword, or tag.
- Lightweight dark-mode toggle stored locally in the browser.

## Running locally
No build step is required. Clone or download the repository and open `index.html` in a modern browser (double-click the file or use **File → Open**). The app loads `data.json` from the same folder.

## Deploying to GitHub Pages
1. Push this repository to GitHub.
2. In your repository, open **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch** and select the branch that contains these files. Ensure the folder is set to `/ (root)`.
4. Save. GitHub Pages will serve the static files directly.

## Updating `data.json`
- `topics` describe the three main volumes. Each topic has many `subtopics` representing the full chapter list supplied by Blackstone's.
- Each study `card` references a `subtopic_id`, includes a `question`, `answer`, `reference`, `subtitle`, and an array of `tags`. Optional `explanation` text adds extra context.
- Add new cards by appending to the `cards` array. Keep IDs unique so that localStorage references remain stable for returning users.
- The preview counts and home overview update automatically when data changes.

## Notes
- All references cite Blackstone's 2025 content
- Feel free to adapt the styling in `styles.css` to suit your branding while preserving accessible colour contrast.
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
 main
