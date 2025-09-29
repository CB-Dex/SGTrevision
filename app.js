(function () {
  const THEME_KEY = 'sgt-theme';

  // Static catalogue describing the three volumes and their chapters
  const blackstonesCatalogue = [
    {
      title: 'Crime',
      slug: 'crime',
      summary:
        "Sixteen chapters covering foundational principles and major offences within the Blackstone's crime volume.",
      chapters: [
        'Mens Rea (State of Mind)',
        'Actus Reus (Criminal Conduct)',
        'Incomplete Offences',
        'General Defences',
        'Homicide',
        'Misuse of Drugs',
        'Firearms and Gun Crime',
        'Racially and Religiously Aggravated Offences',
        'Non-fatal Offences Against the Person',
        'Miscellaneous Offences Against the Person and Offences Involving the Deprivation of Liberty',
        'Sexual Offences',
        'Child Protection',
        'Theft and Related Offences',
        'Fraud',
        'Criminal Damage',
        'Offences Against the Administration of Justice and Public Interest'
      ]
    },
    {
      title: 'Evidence & Procedure',
      slug: 'evidence-procedure',
      summary:
        'Eight procedure-focused chapters following the lifecycle of an investigation through to presentation in court.',
      chapters: [
        'Instituting Criminal Proceedings',
        'Release of Person Arrested',
        'Court Procedure and Witnesses',
        'Exclusion of Admissible Evidence',
        'Disclosure of Evidence',
        'Detention and Treatment of Persons by Police Officers: PACE Code C',
        'Identification: PACE Code D',
        'Interviews: PACE Codes C, E and F'
      ]
    },
    {
      title: 'General Police Duties',
      slug: 'general-police-duties',
      summary:
        'Twenty-two operational chapters spanning public protection, public order, community safeguarding, and road policing.',
      chapters: [
        'Stop and Search',
        'Entry, Search and Seizure',
        'Powers of Arrest',
        'Protection of People Suffering from Mental Disorders',
        'Offences Relating to Land and Premises',
        'Licensing and Offences',
        'Protecting Citizens and the Community: Injunctions, Orders, and Police Powers',
        'Policing Processions, Assemblies and Protests; Offences and Powers',
        'Public Order Offences',
        'Sporting Events',
        'Domestic Violence and Abuse',
        'Hatred and Harassment Offences',
        'Offences and Powers Relating to Information and Communications',
        'Offences Against the Administration of Justice and Public Interest',
        'Terrorism and Associated Offences',
        'Diversity, Equality and Inclusion',
        'Complaints and Misconduct',
        'Unsatisfactory Performance and Attendance',
        'Road Policing Definitions and Principles',
        'Key Police Powers Relating to Road Policing',
        'Offences Involving Standards of Driving',
        'Drink, Drugs and Driving'
      ]
    }
  ];

  const state = {
    data: null,
    indexes: {},
    route: window.location.hash || '#home',
    theme: 'light',
    activeTopic: 'all',
    search: { term: '', topic: 'all', tag: 'all' },
    catalogueMap: new Map()
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    document.documentElement.classList.remove('no-js');
    loadTheme();
    bindGlobalEvents();
    buildCatalogueMap();
    fetchData();
  }

  function buildCatalogueMap() {
    state.catalogueMap = new Map();
    blackstonesCatalogue.forEach((topic) => {
      state.catalogueMap.set(topic.slug, topic);
    });
  }

  function bindGlobalEvents() {
    window.addEventListener('hashchange', handleRouteChange);

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
      updateThemeToggleLabel();
    }

    const topicSelect = document.getElementById('topic-select');
    if (topicSelect) {
      topicSelect.addEventListener('change', (event) => {
        const value = event.target.value;
        state.activeTopic = value;
        renderTopicPreview();
        if (value === 'all') {
          if (!state.route.startsWith('#browse')) {
            window.location.hash = '#browse';
          } else {
            handleRouteChange();
          }
        } else {
          window.location.hash = `#topic/${value}`;
        }
      });
    }
  }

  function fetchData() {
    fetch('data.json')
      .then((res) => res.json())
      .then((data) => {
        state.data = data;
        buildIndexes();
        populateTopicSelect();
        renderTopicPreview();
        handleRouteChange();
      })
      .catch((err) => {
        console.error('Failed to load data.json', err);
        renderError('Unable to load study cards. Please refresh the page.');
      });
  }

  function buildIndexes() {
    const topicMap = new Map();
    const topicBySlug = new Map();
    const subtopicMap = new Map();
    const subtopicsByTopic = new Map();

    state.data.topics.forEach((topic) => {
      topicMap.set(topic.id, topic);
      topicBySlug.set(topic.slug, topic);
      subtopicsByTopic.set(topic.id, []);
    });

    state.data.subtopics.forEach((subtopic) => {
      subtopicMap.set(subtopic.id, subtopic);
      const list = subtopicsByTopic.get(subtopic.topic_id) || [];
      list.push(subtopic);
      subtopicsByTopic.set(subtopic.topic_id, list);
    });

    state.indexes = { topicMap, topicBySlug, subtopicMap, subtopicsByTopic };
  }

  function populateTopicSelect() {
    const select = document.getElementById('topic-select');
    if (!select) return;

    // Prefer live topics from data.json; fall back to static catalogue if needed
    const source = state.data?.topics?.length ? state.data.topics : blackstonesCatalogue;
    const options = ['<option value="all">All topics</option>'].concat(
      source.map((topic) => {
        const slug = topic.slug || topic.slug;
        const title = topic.title || topic.title;
        return `<option value="${slug}">${escapeHtml(title)}</option>`;
      })
    );
    select.innerHTML = options.join('');
    select.value = state.activeTopic;
  }

  function renderTopicPreview() {
    const preview = document.getElementById('topic-preview');
    if (!preview) return;

    if (state.activeTopic === 'all') {
      preview.innerHTML = '<p>Select a topic to see the chapter breakdown and related study cards.</p>';
      return;
    }

    const catalogue = state.catalogueMap.get(state.activeTopic);
    const topic = state.indexes.topicBySlug?.get(state.activeTopic);

    if (!catalogue || !topic) {
      preview.textContent = '';
      return;
    }

    const previewChapters = catalogue.chapters
      .slice(0, 3)
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join('');

    preview.innerHTML = `
      <div>
        <strong>${escapeHtml(topic.title)}</strong>
        <p>${escapeHtml(catalogue.summary)}</p>
        <p class="preview-count">${catalogue.chapters.length} chapters</p>
        <ul class="preview-list">${previewChapters}</ul>
        <p class="preview-footnote">View the full breakdown on the topic page.</p>
      </div>
    `;
  }

  function handleRouteChange() {
    state.route = window.location.hash || '#home';

    if (state.route.startsWith('#topic/')) {
      const slug = state.route.replace('#topic/', '');
      state.activeTopic = slug;
      const select = document.getElementById('topic-select');
      if (select) select.value = slug;
      renderTopicPreview();
    }

    if (!state.data) return;

    const mainEl = document.getElementById('app');
    mainEl.innerHTML = '';

    if (state.route === '#home') {
      renderHome(mainEl);
    } else if (state.route === '#browse') {
      renderBrowse(mainEl);
    } else if (state.route.startsWith('#topic/')) {
      renderTopic(mainEl);
    } else if (state.route === '#about') {
      renderAbout(mainEl);
    } else {
      renderNotFound(mainEl);
    }

    setTimeout(() => mainEl.focus(), 0);
  }

  function renderHome(container) {
    const cardsByTopic = countCardsByTopic();
    const catalogueHtml = blackstonesCatalogue
      .map((topic) => {
        const topicCount = cardsByTopic.get(topic.slug) || 0;
        const chapters = topic.chapters.map((chapter) => `<li>${escapeHtml(chapter)}</li>`).join('');
        return `
          <article class="topic-card">
            <header>
              <h3>${escapeHtml(topic.title)}</h3>
              <p class="subtitle">${escapeHtml(topic.summary)}</p>
              <p class="chapter-count">${topic.chapters.length} chapters · ${topicCount} study cards</p>
            </header>
            <ul class="chapter-list">${chapters}</ul>
            <div class="topic-actions">
              <a class="button secondary" href="#topic/${topic.slug}">Open topic</a>
            </div>
          </article>
        `;
      })
      .join('');

    container.innerHTML = `
      <section aria-labelledby="home-title">
        <h2 id="home-title">Blackstone's syllabus at a glance</h2>
        <p>Use this overview to explore every topic required for the UK Police Sergeant's exam. Each section below lists the chapters contained within the official Blackstone's manuals and links directly to the supporting study cards.</p>
        <div class="topic-grid">
          ${catalogueHtml}
        </div>
      </section>
    `;
  }

  function renderBrowse(container) {
    const tags = collectTags();
    container.innerHTML = `
      <section aria-labelledby="browse-title">
        <h2 id="browse-title">Browse study cards</h2>
        <p>Search by keyword, filter by topic, or focus on specific tags to surface the explanations you need.</p>
        <div class="search-bar" role="search">
          <label class="sr-only" for="search-input">Search cards</label>
          <input id="search-input" class="search-input" type="search" placeholder="Search questions, answers, or references" value="${state.search.term}" aria-label="Search cards">
          <label class="sr-only" for="topic-filter">Filter by topic</label>
          <select id="topic-filter" aria-label="Filter by topic">
            <option value="all">All topics</option>
            ${state.data.topics
              .map(
                (topic) =>
                  `<option value="${topic.slug}" ${state.search.topic === topic.slug ? 'selected' : ''}>${escapeHtml(topic.title)}</option>`
              )
              .join('')}
          </select>
          <label class="sr-only" for="tag-filter">Filter by tag</label>
          <select id="tag-filter" aria-label="Filter by tag">
            <option value="all">All tags</option>
            ${tags
              .map((tag) => `<option value="${tag}" ${state.search.tag === tag ? 'selected' : ''}>${escapeHtml(tag)}</option>`)
              .join('')}
          </select>
        </div>
        <div id="browse-results" class="card-list" aria-live="polite"></div>
      </section>
    `;

    const searchInput = container.querySelector('#search-input');
    const topicFilter = container.querySelector('#topic-filter');
    const tagFilter = container.querySelector('#tag-filter');

    const debouncedSearch = debounce((value) => {
      state.search.term = value;
      updateBrowseResults();
    }, 200);

    searchInput?.addEventListener('input', (event) => debouncedSearch(event.target.value));
    topicFilter?.addEventListener('change', (event) => {
      state.search.topic = event.target.value;
      updateBrowseResults();
    });
    tagFilter?.addEventListener('change', (event) => {
      state.search.tag = event.target.value;
      updateBrowseResults();
    });

    updateBrowseResults();
  }

  function updateBrowseResults() {
    const container = document.getElementById('browse-results');
    if (!container) return;

    let cards = state.data.cards.slice();

    if (state.search.topic !== 'all') {
      cards = cards.filter((card) => {
        const subtopic = state.indexes.subtopicMap.get(card.subtopic_id);
        const topic = subtopic ? state.indexes.topicMap.get(subtopic.topic_id) : null;
        return topic?.slug === state.search.topic;
      });
    }

    if (state.search.tag !== 'all') {
      cards = cards.filter((card) => card.tags.includes(state.search.tag));
    }

    if (state.search.term) {
      cards = cards.filter((card) => searchableText(card).includes(state.search.term.toLowerCase()));
    }

    container.innerHTML = cards.length
      ? cards.map((card) => renderCard(card)).join('')
      : '<p>No cards match the current filters.</p>';
  }

  function renderTopic(container) {
    const slug = state.route.replace('#topic/', '');
    const topicRecord = state.indexes.topicBySlug.get(slug);
    const catalogue = state.catalogueMap.get(slug);

    if (!topicRecord || !catalogue) {
      renderNotFound(container);
      return;
    }

    const cards = state.data.cards.filter((card) => {
      const subtopic = state.indexes.subtopicMap.get(card.subtopic_id);
      return subtopic?.topic_id === topicRecord.id;
    });

    const subtopics = catalogue.chapters.map((chapter) => `<li>${escapeHtml(chapter)}</li>`).join('');

    container.innerHTML = `
      <section aria-labelledby="topic-title">
        <h2 id="topic-title">${escapeHtml(topicRecord.title)}</h2>
        <p>${escapeHtml(catalogue.summary)}</p>
        <p class="chapter-count">${catalogue.chapters.length} chapters</p>
        <h3>Chapter breakdown</h3>
        <ul class="chapter-list">${subtopics}</ul>
        <h3>Study cards</h3>
        <div class="card-list">
          ${cards.map((card) => renderCard(card)).join('') || '<p>Cards for this topic are coming soon.</p>'}
        </div>
      </section>
    `;
  }

  function renderAbout(container) {
    container.innerHTML = `
      <section aria-labelledby="about-title">
        <h2 id="about-title">About this site</h2>
        <p>SGT Revision Toolkit is a static reference built around the official Blackstone's Police Sergeants' and Inspectors' Manuals. It highlights every chapter across the crime, evidence & procedure, and general police duties volumes, pairing them with concise study cards that distil key legal tests.</p>
        <p>Use the topic selector in the header to jump between volumes, review the chapter breakdowns, and read the linked cards when you need quick clarification.</p>
        <p>All data is stored locally in your browser, and the site runs entirely offline once loaded.</p>
      </section>
    `;
  }

  function renderNotFound(container) {
    container.innerHTML = `
      <section>
        <h2>Page not found</h2>
        <p>The requested page could not be located. Please choose another section from the navigation.</p>
      </section>
    `;
  }

  function renderError(message) {
    const main = document.getElementById('app');
    if (main) {
      main.innerHTML = `<section><h2>Error</h2><p>${escapeHtml(message)}</p></section>`;
    }
  }

  function renderCard(card) {
    const subtopic = state.indexes.subtopicMap.get(card.subtopic_id);
    const topic = subtopic ? state.indexes.topicMap.get(subtopic.topic_id) : null;
    return `
      <article class="card" aria-label="${escapeHtml(card.question)}">
        <header>
          <h3>${escapeHtml(card.question)}</h3>
          <p class="subtitle">${escapeHtml(card.subtitle)}${topic ? ` · ${escapeHtml(topic.title)}` : ''}</p>
          <p class="reference">${escapeHtml(card.reference)}</p>
        </header>
        <div class="body">
          <p><strong>Answer:</strong> ${escapeHtml(card.answer)}</p>
          ${card.explanation ? `<p>${escapeHtml(card.explanation)}</p>` : ''}
          <div class="card-tags">
            ${card.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>
      </article>
    `;
  }

  function countCardsByTopic() {
    const counts = new Map();
    if (!state.data) return counts;
    state.data.cards.forEach((card) => {
      const subtopic = state.indexes.subtopicMap.get(card.subtopic_id);
      const topic = subtopic ? state.indexes.topicMap.get(subtopic.topic_id) : null;
      if (!topic) return;
      counts.set(topic.slug, (counts.get(topic.slug) || 0) + 1);
    });
    return counts;
  }

  function collectTags() {
    const tagSet = new Set();
    state.data.cards.forEach((card) => {
      (card.tags || []).forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }

  function searchableText(card) {
    const subtopic = state.indexes.subtopicMap.get(card.subtopic_id);
    const topic = subtopic ? state.indexes.topicMap.get(subtopic.topic_id) : null;
    const text = [card.question, card.answer, card.reference, card.subtitle, ...(card.tags || [])];
    if (subtopic) text.push(subtopic.title);
    if (topic) text.push(topic.title);
    return text.join(' ').toLowerCase();
  }

  function loadTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) state.theme = stored;
    applyTheme();
  }

  function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    localStorage.setItem(THEME_KEY, state.theme);
  }

  function applyTheme() {
    document.body.setAttribute('data-theme', state.theme);
    updateThemeToggleLabel();
  }

  function updateThemeToggleLabel() {
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    button.textContent = state.theme === 'dark' ? 'Light mode' : 'Dark mode';
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function debounce(fn, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), wait);
    };
  }
})();
