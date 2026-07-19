/**
 * MatrixSelect — a searchable grid picker for long, flat option lists
 * (languages, countries, currencies, timezones...) that a native <select>
 * forces into one unscannable vertical list. Zero dependencies,
 * framework-agnostic, ~3KB unminified.
 *
 * Usage:
 *   import { MatrixSelect } from './matrix-select.js';
 *   const picker = MatrixSelect.create(document.getElementById('slot'), {
 *     items: [
 *       { value: 'de', label: 'Deutsch', sublabel: 'German' },
 *       { value: 'th', label: 'ไทย', sublabel: 'Thai' },
 *     ],
 *     value: 'en',
 *     onChange: (value, item) => console.log(value, item),
 *   });
 *
 * RTL is automatic: the panel and option text use CSS logical properties
 * (inset-inline-end, text-align: start), which mirror correctly whenever
 * an ancestor sets dir="rtl" — no JS-side RTL branching required.
 */

const DEFAULTS = {
  items: [],
  value: null,
  placeholder: 'Search…',
  noResultsText: 'No results found',
  triggerLabel: null, // (item) => string; default uses item.label
  columns: 'auto', // 'auto' = responsive auto-fill, or a fixed integer
  minColumnWidth: 140, // px, used when columns === 'auto'
  onChange: null,
  className: '',
};

let instanceCounter = 0;
const activeInstances = new Set();
let globalListenersBound = false;

function ensureGlobalListeners() {
  if (globalListenersBound) return;
  document.addEventListener('click', () => {
    for (const inst of activeInstances) inst.close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    for (const inst of activeInstances) inst.close();
  });
  globalListenersBound = true;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

export class MatrixSelect {
  /** @returns {MatrixSelect} */
  static create(container, options) {
    return new MatrixSelect(container, options);
  }

  constructor(container, options = {}) {
    if (!container) throw new Error('MatrixSelect: container element is required');
    this.container = container;
    this.opts = { ...DEFAULTS, ...options };
    this.id = `matrix-select-${++instanceCounter}`;
    this.value = this.opts.value ?? this.opts.items[0]?.value ?? null;
    this._build();
    this._bind();
    ensureGlobalListeners();
    activeInstances.add(this);
  }

  _build() {
    const { placeholder } = this.opts;
    const root = document.createElement('div');
    root.className = `matrix-select ${this.opts.className}`.trim();
    root.innerHTML = `
      <button type="button" class="matrix-select__trigger" aria-haspopup="listbox" aria-expanded="false" aria-controls="${this.id}-panel">
        <span class="matrix-select__trigger-label" data-ms-trigger-label></span>
        <svg class="matrix-select__chevron" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
      </button>
      <div id="${this.id}-panel" class="matrix-select__panel" hidden>
        <div class="matrix-select__search-row">
          <input type="text" class="matrix-select__search" placeholder="${escapeHtml(placeholder)}" autocomplete="off" spellcheck="false" aria-label="${escapeHtml(placeholder)}" />
        </div>
        <div class="matrix-select__grid" role="listbox"></div>
        <p class="matrix-select__empty" hidden></p>
      </div>
    `;
    this.container.appendChild(root);

    this.root = root;
    this.trigger = root.querySelector('.matrix-select__trigger');
    this.triggerLabelEl = root.querySelector('[data-ms-trigger-label]');
    this.panel = root.querySelector('.matrix-select__panel');
    this.search = root.querySelector('.matrix-select__search');
    this.grid = root.querySelector('.matrix-select__grid');
    this.empty = root.querySelector('.matrix-select__empty');
    this.empty.textContent = this.opts.noResultsText;

    this.grid.style.gridTemplateColumns =
      this.opts.columns === 'auto'
        ? `repeat(auto-fill, minmax(${this.opts.minColumnWidth}px, 1fr))`
        : `repeat(${this.opts.columns}, 1fr)`;

    this._renderOptions(this.opts.items);
    this._updateTriggerLabel();
  }

  _renderOptions(items) {
    this.grid.innerHTML = '';
    this._optionEls = items.map((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'matrix-select__option';
      btn.setAttribute('role', 'option');
      btn.setAttribute('data-value', item.value);
      btn.setAttribute('aria-selected', String(item.value === this.value));
      if (item.value === this.value) btn.classList.add('is-selected');
      const searchText = [item.label, item.sublabel, item.keywords, item.value]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      btn.setAttribute('data-search', searchText);
      btn.innerHTML = `
        <span class="matrix-select__option-label">${escapeHtml(item.label)}</span>
        ${item.sublabel ? `<span class="matrix-select__option-sublabel">${escapeHtml(item.sublabel)}</span>` : ''}
      `;
      btn.addEventListener('click', () => this._select(item));
      this.grid.appendChild(btn);
      return btn;
    });
  }

  _updateTriggerLabel() {
    const item = this.opts.items.find((i) => i.value === this.value);
    this.triggerLabelEl.textContent = this.opts.triggerLabel
      ? this.opts.triggerLabel(item)
      : item?.label ?? '';
  }

  _bind() {
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.isOpen() ? this.close() : this.open();
    });
    // interacting inside the panel (typing, scrolling) must never close it —
    // this is the "pin it open" behavior the native <select> can't offer
    this.panel.addEventListener('click', (e) => e.stopPropagation());
    this.search.addEventListener('input', () => this._filter());
    this.search.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
        this.trigger.focus();
      }
      if (e.key === 'Enter') {
        const firstVisible = this._optionEls.find((el) => !el.hidden);
        if (firstVisible) firstVisible.click();
      }
    });
  }

  _filter() {
    const q = this.search.value.trim().toLowerCase();
    let visible = 0;
    for (const el of this._optionEls) {
      const match = !q || el.getAttribute('data-search').includes(q);
      el.hidden = !match;
      if (match) visible++;
    }
    this.empty.hidden = visible > 0;
    this.grid.hidden = visible === 0;
  }

  _select(item) {
    this.value = item.value;
    for (const el of this._optionEls) {
      const selected = el.getAttribute('data-value') === String(item.value);
      el.classList.toggle('is-selected', selected);
      el.setAttribute('aria-selected', String(selected));
    }
    this._updateTriggerLabel();
    this.close();
    if (typeof this.opts.onChange === 'function') this.opts.onChange(item.value, item);
  }

  isOpen() {
    return !this.panel.hidden;
  }

  /** opens this picker, closing every other MatrixSelect instance on the page */
  open() {
    for (const inst of activeInstances) {
      if (inst !== this) inst.close();
    }
    this.panel.hidden = false;
    this.trigger.setAttribute('aria-expanded', 'true');
    this.search.value = '';
    this._filter();
    requestAnimationFrame(() => this.search.focus());
  }

  close() {
    if (this.panel.hidden) return;
    this.panel.hidden = true;
    this.trigger.setAttribute('aria-expanded', 'false');
  }

  setItems(items) {
    this.opts.items = items;
    this._renderOptions(items);
    this._updateTriggerLabel();
  }

  setValue(value) {
    this.value = value;
    this._renderOptions(this.opts.items);
    this._updateTriggerLabel();
  }

  getValue() {
    return this.value;
  }

  destroy() {
    activeInstances.delete(this);
    this.root.remove();
  }
}
