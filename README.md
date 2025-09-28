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
- All references cite Blackstone's 2025 content, published by Wildy & Sons.
- Feel free to adapt the styling in `styles.css` to suit your branding while preserving accessible colour contrast.
