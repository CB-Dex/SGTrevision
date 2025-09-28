(function () {
  const THEME_KEY = 'sgt-theme';

  const state = {
    data: null,
    indexes: {},
    route: window.location.hash || '#home',
    theme: 'light',
    activeTopic: 'all',
    search: {
      term: '',
      topic: 'all',
      tag: 'all'
    }
  };

  const topicSummaries = {
    'non-fatal-offences': {
      summary:
        'Focus on how intent, harm level, and lawful excuses shape charging decisions for assault-based offences.',
      highlights: [
        'Differentiate apprehension-based assault from contact offences.',
        'Recognise the thresholds for ABH, wounding, and grievous bodily harm.',
        'Link lawful force and necessity defences to practical scenarios.'
      ]
    },
    'theft-related': {
      summary:
        'Understand how appropriation, dishonesty, and property concepts interact under the Theft Act and connected offences.',
      highlights: [
        'Break down appropriation and ownership rights for theft.',
        'Spot the knowledge elements in handling stolen goods.',
        'Apply the objective dishonesty test to fraud scenarios.'
      ]
    },
    'criminal-damage': {
      summary:
        'Examine how intention, recklessness, and lawful excuse operate for damage to property, including life-endangerment cases.',
      highlights: [
        'Separate simple and aggravated criminal damage requirements.',
        'Use lawful excuse provisions when property is damaged to protect people.',
        'Confirm what counts as property within the legislation.'
      ]
    }
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    document.documentElement.classList.remove('no-js');
    loadTheme();
    bindGlobalEvents();
    fetchData();
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
        renderError('Unable to load briefing notes. Please refresh the page.');
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

    state.indexes = {
      topicMap,
      topicBySlug,
      subtopicMap,
      subtopicsByTopic
    };
  }

  function populateTopicSelect() {
    const select = document.getElementById('topic-select');
    if (!select || !state.data) return;
    const options = ['<option value="all">All topics</option>'].concat(
      state.data.topics.map(
        (topic) => `<option value="${topic.slug}">${escapeHtml(topic.title)}</option>`
      )
    );
    select.innerHTML = options.join('');
    select.value = state.activeTopic;
  }

  function renderTopicPreview() {
    const preview = document.getElementById('topic-preview');
    if (!preview) return;

    if (!state.data) {
      preview.textContent = '';
      return;
    }

    if (state.activeTopic === 'all') {
      preview.innerHTML =
        '<p>Select a topic to see a quick outline of the key sections covered in these briefings.</p>';
      return;
    }

    const info = topicSummaries[state.activeTopic];
    const topic = state.indexes.topicBySlug.get(state.activeTopic);
    if (!info || !topic) {
      preview.textContent = '';
      return;
    }

    preview.innerHTML = `
      <strong>${escapeHtml(topic.title)}:</strong>
      <span>${escapeHtml(info.summary)}</span>
    `;
  }

  function handleRouteChange() {
    state.route = window.location.hash || '#home';

    if (state.route.startsWith('#topic/')) {
      const slug = state.route.replace('#topic/', '');
      state.activeTopic = slug;
      const select = document.getElementById('topic-select');
      if (select) {
        select.value = slug;
      }
      renderTopicPreview();
    }

    if (!state.data) {
      return;
    }

    const main = document.getElementById('app');
    main.innerHTML = '';

    if (state.route === '#home') {
      renderHome(main);
    } else if (state.route === '#browse') {
      renderBrowse(main);
    } else if (state.route.startsWith('#topic/')) {
      renderTopic(main);
    } else if (state.route === '#about') {
      renderAbout(main);
    } else {
      renderNotFound(main);
    }

    setTimeout(() => main.focus(), 0);
  }

  function renderHome(container) {
    const sectionsHtml = state.data.topics
      .map((topic) => {
        const summary = topicSummaries[topic.slug];
        if (!summary) return '';
        const highlights = summary.highlights
          .map((item) => `<li>${escapeHtml(item)}</li>`)
          .join('');
        return `
          <article class="card">
            <header>
              <h3>${escapeHtml(topic.title)}</h3>
              <p class="subtitle">${escapeHtml(summary.summary)}</p>
            </header>
            <ul class="topic-summary-list">${highlights}</ul>
          </article>
        `;
      })
      .join('');

    container.innerHTML = `
      <section aria-labelledby="home-title">
        <h2 id="home-title">Briefings built for quick understanding</h2>
        <p>
          Each note distils legislation and procedure into the points you need for confident application on the exam and on shift.
          Browse by topic or scroll through the key sections below to refresh understanding without drilling quizzes.
        </p>
        <div class="card-list">
          ${sectionsHtml}
        </div>
      </section>
    `;
  }

  function renderBrowse(container) {
    const tags = collectTags();
    container.innerHTML = `
      <section aria-labelledby="browse-title">
        <h2 id="browse-title">Browse briefing notes</h2>
        <p>Search across explanations, references, and tags to locate the section you need.</p>
        <div class="search-bar" role="search">
          <label class="sr-only" for="search-input">Search notes</label>
          <input id="search-input" class="search-input" type="search" placeholder="Search explanations or references" value="${state.search.term}" aria-label="Search notes">
          <label class="sr-only" for="topic-filter">Filter by topic</label>
          <select id="topic-filter" aria-label="Filter by topic">
            <option value="all">All topics</option>
            ${state.data.topics
              .map(
                (topic) => `<option value="${topic.slug}" ${state.search.topic === topic.slug ? 'selected' : ''}>${escapeHtml(topic.title)}</option>`
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

    searchInput?.addEventListener('input', (event) => {
      debouncedSearch(event.target.value);
    });

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

    if (cards.length === 0) {
      container.innerHTML = '<p>No notes match the current filters.</p>';
      return;
    }

    container.innerHTML = cards.map((card) => renderCard(card)).join('');
  }

  function renderTopic(container) {
    const slug = state.route.replace('#topic/', '');
    const topic = state.indexes.topicBySlug.get(slug);
    if (!topic) {
      renderNotFound(container);
      return;
    }
    const summary = topicSummaries[slug];
    const cards = state.data.cards.filter((card) => {
      const subtopic = state.indexes.subtopicMap.get(card.subtopic_id);
      return subtopic?.topic_id === topic.id;
    });

    const highlights = summary
      ? summary.highlights.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
      : '';

    container.innerHTML = `
      <section aria-labelledby="topic-title">
        <h2 id="topic-title">${escapeHtml(topic.title)}</h2>
        ${summary ? `<p>${escapeHtml(summary.summary)}</p>` : ''}
        ${highlights ? `<ul class="topic-summary-list">${highlights}</ul>` : ''}
        <div class="card-list" style="margin-top: 1.5rem;">
          ${cards.map((card) => renderCard(card)).join('')}
        </div>
      </section>
    `;
  }

  function renderAbout(container) {
    container.innerHTML = `
      <section aria-labelledby="about-title">
        <h2 id="about-title">About these briefings</h2>
        <p>
          The toolkit distils essential sections from the Sergeant exam syllabus into concise explanations. Instead of drilling memory-based questions, each entry emphasises why the section matters, how it is applied, and the reference to return to within Blackstone's.
        </p>
        <p>
          Use the topic picker to skim outlines, then dive into the browse view when you need the full narrative, supporting tags, and pinpoint references.
        </p>
        <p>
          Content is stored locally; no accounts or tracking are involved. Toggle the colour theme to suit your environment.
        </p>
      </section>
    `;
  }

  function renderNotFound(container) {
    container.innerHTML = `
      <section>
        <h2>Page not found</h2>
        <p>The page you requested could not be located. Choose another section from the navigation.</p>
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
          <p>${escapeHtml(card.answer)}</p>
          ${card.explanation ? `<p>${escapeHtml(card.explanation)}</p>` : ''}
          <div class="card-tags">
            ${card.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>
      </article>
    `;
  }

  function collectTags() {
    const tagSet = new Set();
    state.data.cards.forEach((card) => {
      card.tags.forEach((tag) => tagSet.add(tag));
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
    if (stored) {
      state.theme = stored;
    }
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
