(function () {
  const GUTTER_ROOT_ID = 'md-preview-gutter';
  const MARK_CLASS = 'md-preview-gutter-mark';
  const LINE_SELECTOR = '.code-line[data-line], [data-line]';
  const LINE_ATTR = 'data-line';
  const LINE_NUMBER_OFFSET = 1;

  let layoutFrame = 0;

  function ensureGutterRoot() {
    const existing = document.getElementById(GUTTER_ROOT_ID);
    if (existing) {
      return existing;
    }
    const root = document.createElement('div');
    root.id = GUTTER_ROOT_ID;
    document.body.prepend(root);
    return root;
  }

  function sourceLineOf(element) {
    const raw = element.getAttribute(LINE_ATTR);
    if (raw === null || raw === '') {
      return NaN;
    }
    return Number(raw) + LINE_NUMBER_OFFSET;
  }

  function markTop(element) {
    return element.getBoundingClientRect().top;
  }

  function firstElementPerLine(elements) {
    const chosen = new Map();
    for (const element of elements) {
      const line = sourceLineOf(element);
      if (!Number.isFinite(line) || chosen.has(line)) {
        continue;
      }
      chosen.set(line, element);
    }
    return chosen;
  }

  function createMark(line, element) {
    const mark = document.createElement('div');
    mark.className = MARK_CLASS;
    mark.textContent = String(line);
    mark.style.top = `${markTop(element)}px`;
    return mark;
  }

  function renderMarks(root) {
    const chosen = firstElementPerLine(document.querySelectorAll(LINE_SELECTOR));
    const fragment = document.createDocumentFragment();
    for (const [line, element] of chosen) {
      fragment.appendChild(createMark(line, element));
    }
    root.replaceChildren(fragment);
  }

  function layout() {
    if (!document.body) {
      return;
    }
    renderMarks(ensureGutterRoot());
  }

  function scheduleLayout() {
    if (layoutFrame) {
      cancelAnimationFrame(layoutFrame);
    }
    layoutFrame = requestAnimationFrame(() => {
      layoutFrame = 0;
      layout();
    });
  }

  scheduleLayout();

  window.addEventListener('resize', scheduleLayout, { passive: true });
  window.addEventListener('scroll', scheduleLayout, { passive: true, capture: true });
  document.addEventListener('scroll', scheduleLayout, { passive: true, capture: true });

  const observer = new MutationObserver(scheduleLayout);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-line', 'class'],
  });

  let polls = 0;
  const poll = window.setInterval(() => {
    scheduleLayout();
    polls += 1;
    if (polls >= 60) {
      window.clearInterval(poll);
    }
  }, 100);
})();
