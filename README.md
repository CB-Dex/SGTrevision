# SGT Revision Toolkit

A static revision hub for the UK Police Sergeant's exam. The toolkit maps all 46 examinable topics from the Crime, Evidence & Procedure, and General Police Duties volumes. Each topic has its own landing page with revision goals, suggested study actions, recommended resources, and optional cue cards for rapid knowledge checks.

## Features
- Header topic picker with live preview of summaries and available cue cards.
- Home page directory linking to every topic and grouped category overviews.
- Dedicated topic pages outlining key points, study actions, and resource lists.
- Browse view for filtering cue cards by category, topic, tag, or keyword when you want quick recall practice.
- Accessible light/dark theme toggle stored locally in the browser.

## Running locally
Because the app loads `data.json` via `fetch`, you need to serve the files over HTTP. Clone or download the repository, then run a lightweight web server from the project root:

```bash
python -m http.server 8000
```

Open [http://localhost:8000/index.html](http://localhost:8000/index.html) in your browser to use the site.

## Deploying to GitHub Pages
1. Push this repository to GitHub.
2. In your repository, open **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch** and select the branch that contains these files. Ensure the folder is set to `/ (root)`.
4. Save. GitHub Pages will serve the static files directly.

## Updating `data.json`
The data file now has three top-level collections:

- `categories` describe the Crime, Evidence & Procedure, and General Police Duties groupings. Each category has an `id`, `title`, `slug`, and `summary` used on the home and category pages.
- `topics` contains all 46 examinable topics. Every topic includes:
  - `id` and `category_id` keys for lookups.
  - `title`, `slug`, and `summary` strings used on landing pages and the topic selector.
  - `key_points`, `core_tasks`, and `resources` arrays rendered as bullet lists on the topic page.
  - `study_cards`, which is generated automatically from the `cards` collection but can be edited if you want to pin specific cards.
- `cards` holds optional cue cards. Each card includes `id`, `topic_id`, `question`, `answer`, `reference`, `subtitle`, optional `explanation`, and an array of `tags`.

When adding new material:
- Keep IDs numeric and unique. Reference the relevant `topic_id` when adding cue cards.
- If you introduce a new topic, add it under the appropriate category and supply at least a `summary`, `key_points`, and `core_tasks` array so the landing page stays informative.
- The topic selector, directory, and browse filters update automatically when data changes.

## Notes
- All references cite Blackstone's 2025 content
- Feel free to adapt the styling in `styles.css` to suit your branding while preserving accessible colour contrast.
