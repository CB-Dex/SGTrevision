(function () {
  const THEME_KEY = 'sgt-theme';

  const state = {
    data: null,
    indexes: {},
    route: window.location.hash || '#home',
    theme: 'light',
    activeTopic: 'all',
    search: { term: '', category: 'all', topic: 'all', tag: 'all' }
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
        renderError('Unable to load revision topics. Please refresh the page.');
      });
  }

  function buildIndexes() {
    const categoryMap = new Map();
    const categoryBySlug = new Map();
    const topicMap = new Map();
    const topicBySlug = new Map();
    const topicsByCategory = new Map();
    const cardsByTopic = new Map();
    const tagSet = new Set();

    (state.data.categories || []).forEach((category) => {
      categoryMap.set(category.id, category);
      categoryBySlug.set(category.slug, category);
      topicsByCategory.set(category.id, []);
    });

    (state.data.topics || []).forEach((topic) => {
      topicMap.set(topic.id, topic);
      topicBySlug.set(topic.slug, topic);
      const list = topicsByCategory.get(topic.category_id) || [];
      list.push(topic);
      topicsByCategory.set(topic.category_id, list);
      cardsByTopic.set(topic.id, []);
    });

    topicsByCategory.forEach((list, key) => {
      topicsByCategory.set(
        key,
        list.slice().sort((a, b) => a.title.localeCompare(b.title))
      );
    });

    (state.data.cards || []).forEach((card) => {
      const topicCards = cardsByTopic.get(card.topic_id);
      if (topicCards) {
        topicCards.push(card);
      }
      (card.tags || []).forEach((tag) => tagSet.add(tag));
    });

    state.indexes = {
      categoryMap,
      categoryBySlug,
      topicMap,
      topicBySlug,
      topicsByCategory,
      cardsByTopic,
      tagSet
    };
  }

  function populateTopicSelect() {
    const select = document.getElementById('topic-select');
    if (!select || !state.data) return;

    const groups = (state.data.categories || [])
      .map((category) => {
        const topics = state.indexes.topicsByCategory.get(category.id) || [];
        const options = topics
          .map((topic) => `<option value="${topic.slug}">${escapeHtml(topic.title)}</option>`)
          .join('');
        return `<optgroup label="${escapeHtml(category.title)}">${options}</optgroup>`;
      })
      .join('');

    select.innerHTML = `<option value="all">All topics</option>${groups}`;
    select.value = state.activeTopic;
  }

  function renderTopicPreview() {
    const preview = document.getElementById('topic-preview');
    if (!preview) return;

    if (state.activeTopic === 'all') {
      preview.innerHTML = '<p>Select a topic to see the summary, key points, and available study cards.</p>';
      return;
    }

    const topic = state.indexes.topicBySlug?.get(state.activeTopic);
    if (!topic) {
      preview.textContent = '';
      return;
    }

    const category = state.indexes.categoryMap.get(topic.category_id);
    const keyPoints = (topic.key_points || []).slice(0, 3);
    const keyPointsHtml = keyPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join('');
    const cardCount = (state.indexes.cardsByTopic.get(topic.id) || []).length;

    preview.innerHTML = `
      <div>
        <strong>${escapeHtml(topic.title)}</strong>
        <p class="preview-category">${escapeHtml(category?.title || '')}</p>
        <p>${escapeHtml(topic.summary || '')}</p>
        <p class="preview-count">${cardCount} ${cardCount === 1 ? 'cue card' : 'cue cards'} available</p>
        ${keyPointsHtml ? `<ul class="preview-list">${keyPointsHtml}</ul>` : ''}
        <p class="preview-footnote">Open the topic page for revision plans, resources, and optional cards.</p>
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
    } else {
      state.activeTopic = 'all';
      const select = document.getElementById('topic-select');
      if (select) select.value = 'all';
      renderTopicPreview();
    }

    if (!state.data) return;

    const mainEl = document.getElementById('app');
    if (!mainEl) return;
    mainEl.innerHTML = '';

    if (state.route === '#home') {
      renderHome(mainEl);
    } else if (state.route === '#browse') {
      renderBrowse(mainEl);
    } else if (state.route.startsWith('#topic/')) {
      renderTopic(mainEl);
    } else if (state.route.startsWith('#category/')) {
      renderCategory(mainEl);
    } else if (state.route === '#about') {
      renderAbout(mainEl);
    } else {
      renderNotFound(mainEl);
    }

    setTimeout(() => mainEl.focus(), 0);
  }

  function renderHome(container) {
    const categoryCards = (state.data.categories || [])
      .map((category) => {
        const topics = state.indexes.topicsByCategory.get(category.id) || [];
        const cardCount = topics.reduce(
          (total, topic) => total + (state.indexes.cardsByTopic.get(topic.id)?.length || 0),
          0
        );
        const highlightTopics = topics.slice(0, 4);
        const topicLinks = highlightTopics
          .map(
            (topic) =>
              `<li><a href="#topic/${topic.slug}">${escapeHtml(topic.title)}</a></li>`
          )
          .join('');
        return `
          <article class="category-card">
            <header>
              <h3>${escapeHtml(category.title)}</h3>
              <p class="subtitle">${escapeHtml(category.summary || '')}</p>
              <p class="chapter-count">${topics.length} topics · ${cardCount} cue cards</p>
            </header>
            ${topicLinks ? `<ul class="chapter-list">${topicLinks}</ul>` : ''}
            <div class="topic-actions">
              <a class="button secondary" href="#category/${category.slug}">View topic directory</a>
            </div>
          </article>
        `;
      })
      .join('');

    const directory = (state.data.topics || [])
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title))
      .map(
        (topic) =>
          `<li><a href="#topic/${topic.slug}">${escapeHtml(topic.title)}</a><span>${escapeHtml(
            state.indexes.categoryMap.get(topic.category_id)?.title || ''
          )}</span></li>`
      )
      .join('');

    container.innerHTML = `
      <section aria-labelledby="home-title" class="home-intro">
        <h2 id="home-title">Plan your revision across every Blackstone's topic</h2>
        <p>Navigate the complete catalogue of 46 topics from the Crime, Evidence & Procedure, and General Police Duties volumes. Each landing page includes concise revision goals, suggested study tasks, resource links, and optional cue cards when you need quick knowledge checks.</p>
        <div class="category-grid">
          ${categoryCards}
        </div>
      </section>
      <section aria-labelledby="directory-title" class="topic-directory">
        <h2 id="directory-title">Topic directory</h2>
        <p>Browse the full set of topics in alphabetical order. Open any topic to review focused revision notes and switch on cue cards when you want to test yourself.</p>
        <ul class="topic-directory-list">${directory}</ul>
      </section>
    `;
  }

  function renderCategory(container) {
    const slug = state.route.replace('#category/', '');
    const category = state.indexes.categoryBySlug.get(slug);
    if (!category) {
      renderNotFound(container);
      return;
    }

    const topics = state.indexes.topicsByCategory.get(category.id) || [];
    const topicCards = topics
      .map((topic) => {
        const cards = state.indexes.cardsByTopic.get(topic.id) || [];
        const keyPoints = (topic.key_points || []).slice(0, 3).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
        return `
          <article class="topic-card">
            <header>
              <h3><a href="#topic/${topic.slug}">${escapeHtml(topic.title)}</a></h3>
              <p class="subtitle">${escapeHtml(topic.summary || '')}</p>
              <p class="chapter-count">${cards.length} ${cards.length === 1 ? 'cue card' : 'cue cards'}</p>
            </header>
            ${keyPoints ? `<ul class="chapter-list">${keyPoints}</ul>` : ''}
            <div class="topic-actions">
              <a class="button secondary" href="#topic/${topic.slug}">Open topic</a>
            </div>
          </article>
        `;
      })
      .join('');

    container.innerHTML = `
      <section aria-labelledby="category-title" class="category-detail">
        <div class="topic-overview">
          <p class="breadcrumb"><a href="#home">Home</a> · ${escapeHtml(category.title)}</p>
          <h2 id="category-title">${escapeHtml(category.title)} topics</h2>
          <p>${escapeHtml(category.summary || '')}</p>
          <p class="chapter-count">${topics.length} topics</p>
        </div>
        <div class="topic-grid">${topicCards}</div>
      </section>
    `;
  }

  function renderBrowse(container) {
    const tags = collectTags();
    container.innerHTML = `
      <section aria-labelledby="browse-title">
        <h2 id="browse-title">Browse cue cards</h2>
        <p>Search by keyword, filter by category, or jump directly to a specific topic to focus your quick checks.</p>
        <div class="search-bar" role="search">
          <label class="sr-only" for="search-input">Search cards</label>
          <input id="search-input" class="search-input" type="search" placeholder="Search questions, answers, or references" value="${state.search.term}" aria-label="Search cards">
          <label class="sr-only" for="category-filter">Filter by category</label>
          <select id="category-filter" aria-label="Filter by category">
            <option value="all">All categories</option>
            ${state.data.categories
              .map(
                (category) =>
                  `<option value="${category.slug}" ${state.search.category === category.slug ? 'selected' : ''}>${escapeHtml(category.title)}</option>`
              )
              .join('')}
          </select>
          <label class="sr-only" for="topic-filter">Filter by topic</label>
          <select id="topic-filter" aria-label="Filter by topic"></select>
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
    const categoryFilter = container.querySelector('#category-filter');
    const topicFilter = container.querySelector('#topic-filter');
    const tagFilter = container.querySelector('#tag-filter');

    populateBrowseTopicFilter(topicFilter);

    const debouncedSearch = debounce((value) => {
      state.search.term = value;
      updateBrowseResults();
    }, 200);

    searchInput?.addEventListener('input', (event) => debouncedSearch(event.target.value));
    categoryFilter?.addEventListener('change', (event) => {
      state.search.category = event.target.value;
      if (state.search.category === 'all') {
        state.search.topic = 'all';
      }
      populateBrowseTopicFilter(topicFilter);
      updateBrowseResults();
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

  function populateBrowseTopicFilter(topicFilter) {
    if (!topicFilter) return;
    const categorySlug = state.search.category;
    let topics;
    if (categorySlug !== 'all') {
      const category = state.indexes.categoryBySlug.get(categorySlug);
      const list = category ? state.indexes.topicsByCategory.get(category.id) || [] : [];
      topics = list.slice();
    } else {
      topics = (state.data.topics || []).slice();
    }
    topics.sort((a, b) => a.title.localeCompare(b.title));
    if (!topics.some((topic) => topic.slug === state.search.topic)) {
      state.search.topic = 'all';
    }
    const options = ['<option value="all">All topics</option>'].concat(
      topics.map((topic) =>
        `<option value="${topic.slug}" ${state.search.topic === topic.slug ? 'selected' : ''}>${escapeHtml(topic.title)}</option>`
      )
    );
    topicFilter.innerHTML = options.join('');
  }

  function updateBrowseResults() {
    const container = document.getElementById('browse-results');
    if (!container) return;

    let cards = state.data.cards.slice();

    if (state.search.category !== 'all') {
      const category = state.indexes.categoryBySlug.get(state.search.category);
      if (category) {
        cards = cards.filter((card) => {
          const topic = state.indexes.topicMap.get(card.topic_id);
          return topic?.category_id === category.id;
        });
      }
    }

    if (state.search.topic !== 'all') {
      cards = cards.filter((card) => {
        const topic = state.indexes.topicBySlug.get(state.search.topic);
        return topic ? card.topic_id === topic.id : false;
      });
    }

    if (state.search.tag !== 'all') {
      cards = cards.filter((card) => card.tags.includes(state.search.tag));
    }

    if (state.search.term) {
      const term = state.search.term.toLowerCase();
      cards = cards.filter((card) => searchableText(card).includes(term));
    }

    container.innerHTML = cards.length
      ? cards.map((card) => renderCard(card)).join('')
      : '<p>No cue cards match the current filters.</p>';
  }

  function renderTopic(container) {
    const slug = state.route.replace('#topic/', '');
    const topic = state.indexes.topicBySlug.get(slug);
    if (!topic) {
      renderNotFound(container);
      return;
    }

    const category = state.indexes.categoryMap.get(topic.category_id);
    const cards = state.indexes.cardsByTopic.get(topic.id) || [];
    const keyPoints = (topic.key_points || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const coreTasks = (topic.core_tasks || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    const resources = (topic.resources || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('');

    const cardMarkup = cards.length
      ? cards.map((card) => renderCard(card)).join('')
      : '<p>We are preparing cue cards for this topic. Check back soon.</p>';

    container.innerHTML = `
      <section aria-labelledby="topic-title" class="topic-detail">
        <div class="topic-overview">
          <p class="breadcrumb"><a href="#home">Home</a> · <a href="#category/${category?.slug}">${escapeHtml(category?.title || '')}</a></p>
          <h2 id="topic-title">${escapeHtml(topic.title)}</h2>
          <p class="topic-summary">${escapeHtml(topic.summary || '')}</p>
          <p class="chapter-count">${cards.length} ${cards.length === 1 ? 'cue card' : 'cue cards'} available</p>
        </div>
        <div class="topic-layout">
          <aside class="topic-sidebar">
            ${keyPoints ? `<section><h3>Key points</h3><ul>${keyPoints}</ul></section>` : ''}
            ${resources ? `<section><h3>Recommended resources</h3><ul>${resources}</ul></section>` : ''}
          </aside>
          <div class="topic-main">
            ${coreTasks ? `<section><h3>Suggested study actions</h3><ul>${coreTasks}</ul></section>` : ''}
            <details class="topic-cards" ${cards.length ? 'open' : ''}>
              <summary>Cue cards (${cards.length})</summary>
              <div class="card-list">${cardMarkup}</div>
            </details>
          </div>
        </div>
      </section>
    `;
  }

  function renderAbout(container) {
    container.innerHTML = `
      <section aria-labelledby="about-title">
        <h2 id="about-title">About SGT Revision</h2>
        <p>SGT Revision is a static toolkit that maps every chapter of the Blackstone's Police Sergeants' and Inspectors' Manuals. It gives you structured landing pages for all 46 examinable topics, pairing each with targeted revision steps, quick resource links, and optional cue cards for rapid knowledge checks.</p>
        <p>Use the topic directory or header selector to jump between areas. Each topic page keeps the focus on what to learn, why it matters operationally, and where to read more. When you want to practise recall, expand the cue cards and work through the prompts.</p>
        <p>The site runs entirely client-side so no data leaves your browser once loaded. Bookmark it, serve it locally for offline use, or publish to GitHub Pages for your team.</p>
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
    const topic = state.indexes.topicMap.get(card.topic_id);
    const category = topic ? state.indexes.categoryMap.get(topic.category_id) : null;
    return `
      <article class="card" aria-label="${escapeHtml(card.question)}">
        <header>
          <h3>${escapeHtml(card.question)}</h3>
          <p class="subtitle">${escapeHtml(card.subtitle)}${topic ? ` · ${escapeHtml(topic.title)}` : ''}${category ? ` (${escapeHtml(category.title)})` : ''}</p>
          <p class="reference">${escapeHtml(card.reference)}</p>
        </header>
        <div class="body">
          <p><strong>Answer:</strong> ${escapeHtml(card.answer)}</p>
          ${card.explanation ? `<p>${escapeHtml(card.explanation)}</p>` : ''}
          <div class="card-tags">
            ${(card.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}
          </div>
        </div>
      </article>
    `;
  }

  function collectTags() {
    return Array.from(state.indexes.tagSet || []).sort();
  }

  function searchableText(card) {
    const topic = state.indexes.topicMap.get(card.topic_id);
    const category = topic ? state.indexes.categoryMap.get(topic.category_id) : null;
    const topicFields = topic
      ? [topic.title, topic.summary, ...(topic.key_points || []), ...(topic.core_tasks || [])]
      : [];
    const categoryFields = category ? [category.title] : [];
    const text = [card.question, card.answer, card.reference, card.subtitle, ...(card.tags || []), ...topicFields, ...categoryFields];
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
