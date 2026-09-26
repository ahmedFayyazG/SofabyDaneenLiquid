/* ==========================================================
   Sofas By Daneen — Theme JS
   Vanilla ES modules, Web Components. No framework. ~15 KB.
   ========================================================== */
(() => {
  'use strict';

  // ---------- Small utilities ----------
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const money = (cents) => {
    const val = (cents / 100).toFixed(2);
    return `£${val.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };
  const announce = (msg) => {
    const region = $('#Announcements');
    if (region) { region.textContent = ''; setTimeout(() => region.textContent = msg, 50); }
  };

  // ---------- Cart API ----------
  const Cart = {
    async get() {
      const r = await fetch('/cart.js', { headers: { Accept: 'application/json' }});
      return r.json();
    },
    async add(id, qty = 1, properties = {}) {
      const r = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items: [{ id, quantity: qty, properties }] })
      });
      if (!r.ok) throw new Error((await r.json()).description || 'Add to cart failed');
      return r.json();
    },
    async change(key, quantity) {
      const r = await fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: key, quantity })
      });
      return r.json();
    }
  };

  // ---------- Cart drawer ----------
  class CartDrawer extends HTMLElement {
    connectedCallback() {
      this.drawer = this.querySelector('.drawer');
      this.body = this.querySelector('.drawer__body');
      on(document, 'cart:add', (e) => this.open(e.detail));
      on(document, 'cart:open', () => this.open());
      $$('[data-cart-toggle]').forEach(b => on(b, 'click', () => this.open()));
      $$('[data-drawer-close]', this).forEach(b => on(b, 'click', () => this.close()));
    }
    async open(cart) {
      if (!cart) cart = await Cart.get();
      this.render(cart);
      this.drawer.setAttribute('open', '');
      document.body.style.overflow = 'hidden';
    }
    close() {
      this.drawer.removeAttribute('open');
      document.body.style.overflow = '';
    }
    render(cart) {
      const count = cart.item_count;
      $$('[data-cart-count]').forEach(el => { el.textContent = count; el.hidden = count === 0; });
      if (!cart.items?.length) {
        this.body.innerHTML = `<p class="text-center text-muted" style="padding:3rem 0">Your basket is empty.</p>`;
        return;
      }
      this.body.innerHTML = cart.items.map(i => `
        <div class="cart-item" data-key="${i.key}">
          <img src="${i.image}" alt="${i.product_title}" width="80" height="80" loading="lazy" style="border-radius:4px">
          <div style="flex:1">
            <a href="${i.url}"><strong>${i.product_title}</strong></a>
            <div class="text-muted" style="font-size:.85rem">${i.variant_title || ''}</div>
            <div class="money">${money(i.final_line_price)}</div>
            <div class="qty" style="margin-top:.5rem">
              <button data-qty="-1" aria-label="Decrease">−</button>
              <span>${i.quantity}</span>
              <button data-qty="1" aria-label="Increase">+</button>
              <button data-remove aria-label="Remove" style="margin-left:auto">✕</button>
            </div>
          </div>
        </div>
      `).join('');
      const foot = this.querySelector('.drawer__footer');
      if (foot) foot.innerHTML = `
        <div class="flex flex--between" style="margin-bottom:1rem"><strong>Subtotal</strong><strong class="money">${money(cart.total_price)}</strong></div>
        <a href="/checkout" class="btn btn--primary btn--full btn--lg">Checkout</a>
      `;
      this.wireItemActions();
    }
    wireItemActions() {
      $$('.cart-item', this).forEach(item => {
        const key = item.dataset.key;
        item.querySelectorAll('[data-qty]').forEach(b => on(b, 'click', async () => {
          const cur = parseInt(item.querySelector('.qty span').textContent, 10);
          const cart = await Cart.change(key, cur + parseInt(b.dataset.qty, 10));
          this.render(cart);
        }));
        on(item.querySelector('[data-remove]'), 'click', async () => {
          const cart = await Cart.change(key, 0);
          this.render(cart);
        });
      });
    }
  }
  customElements.define('cart-drawer', CartDrawer);

  // ---------- Swatch picker with dependent colours ----------
  class SwatchPicker extends HTMLElement {
    connectedCallback() {
      this.form = this.closest('form[action*="/cart/add"]');
      $$('input[type=radio]', this).forEach(r => on(r, 'change', () => this.updateVariant()));
      this.updateVariant();
    }
    updateVariant() {
      const selected = $$('input[type=radio]:checked', this).map(r => r.value);
      const data = JSON.parse(this.dataset.variants || '[]');
      const match = data.find(v => v.options.every((o, i) => o === selected[i]));
      const submit = this.form?.querySelector('[type="submit"]');
      if (match) {
        const idInput = this.form?.querySelector('[name="id"]');
        if (idInput) idInput.value = match.id;
        const price = document.querySelector('[data-price]');
        if (price) price.innerHTML = money(match.price) + (match.compare_at_price > match.price ? ` <s>${money(match.compare_at_price)}</s>` : '');
        if (submit) {
          submit.disabled = !match.available;
          submit.textContent = match.available ? 'Add to basket' : 'Sold out';
        }
        $$('input[type=radio]:checked', this).forEach(r => {
          const label = r.closest('.swatch-picker')?.querySelector('[data-selected]');
          if (label) label.textContent = r.value;
        });
        const url = new URL(window.location.href);
        url.searchParams.set('variant', match.id);
        history.replaceState({}, '', url);
        document.dispatchEvent(new CustomEvent('variant:change', { detail: match }));
      } else if (submit) {
        submit.disabled = true;
        submit.textContent = 'Unavailable';
      }
    }
  }
  customElements.define('swatch-picker', SwatchPicker);

  // ---------- Product form (add to cart) ----------
  class ProductForm extends HTMLElement {
    connectedCallback() {
      this.form = this.querySelector('form');
      on(this.form, 'submit', async (e) => {
        e.preventDefault();
        const btn = this.form.querySelector('[type=submit]');
        btn.setAttribute('aria-busy', 'true');
        try {
          const fd = new FormData(this.form);
          const id = fd.get('id'), qty = parseInt(fd.get('quantity') || '1', 10);
          await Cart.add(id, qty);
          const cart = await Cart.get();
          document.dispatchEvent(new CustomEvent('cart:add', { detail: cart }));
          announce('Added to basket');
        } catch (err) {
          announce(err.message);
        } finally {
          btn.removeAttribute('aria-busy');
        }
      });
    }
  }
  customElements.define('product-form', ProductForm);

  // ---------- Gallery ----------
  class ProductGallery extends HTMLElement {
    connectedCallback() {
      this.main = $('.gallery__main img', this);
      $$('.gallery__thumb', this).forEach(t => on(t, 'click', () => this.select(t)));
      on(this.querySelector('[data-gallery-prev]'), 'click', () => this.step(-1));
      on(this.querySelector('[data-gallery-next]'), 'click', () => this.step(1));
      on(document, 'variant:change', (e) => {
        if (e.detail.featured_image) {
          const thumb = $$('.gallery__thumb', this).find(t => new URL(t.dataset.src, location.href).pathname === new URL(e.detail.featured_image.src, location.href).pathname);
          if (thumb) this.select(thumb);
          else this.setImage(e.detail.featured_image.src);
        }
      });
    }
    select(thumb) {
      $$('.gallery__thumb', this).forEach(t => t.setAttribute('aria-current', 'false'));
      thumb.setAttribute('aria-current', 'true');
      this.setImage(thumb.dataset.src);
    }
    step(direction) {
      const thumbs = $$('.gallery__thumb', this);
      const index = thumbs.findIndex(t => t.getAttribute('aria-current') === 'true');
      if (thumbs.length) this.select(thumbs[(index + direction + thumbs.length) % thumbs.length]);
    }
    setImage(src) { if (this.main) { this.main.removeAttribute('srcset'); this.main.src = src; } }
  }
  customElements.define('product-gallery', ProductGallery);

  const siteHeader = document.querySelector('.header');
  const updateHeader = () => siteHeader?.classList.toggle('header--scrolled', window.scrollY > 60);
  on(window, 'scroll', updateHeader, { passive: true });
  updateHeader();

  $$('[data-size-more]').forEach(button => on(button, 'click', () => {
    const expanded = button.closest('.size-section').querySelector('[data-size-grid]').classList.toggle('is-expanded');
    button.setAttribute('aria-expanded', String(expanded));
    button.textContent = expanded ? 'View fewer sizes' : 'View more sizes';
  }));

  // ---------- Storefront search and favourites ----------
  const searchPanel = document.querySelector('[data-search-panel]');
  on(document.querySelector('[data-search-toggle]'), 'click', () => {
    searchPanel.hidden = !searchPanel.hidden;
    if (!searchPanel.hidden) searchPanel.querySelector('input')?.focus();
  });
  on(document.querySelector('[data-search-close]'), 'click', () => { searchPanel.hidden = true; });
  const wishlistPanel = document.querySelector('[data-wishlist-panel]');
  const getWishlist = () => { try { return JSON.parse(localStorage.getItem('sofas-wishlist') || '[]'); } catch { return []; } };
  const saveWishlist = (list) => localStorage.setItem('sofas-wishlist', JSON.stringify(list));
  const renderWishlist = () => {
    const list = getWishlist();
    const target = document.querySelector('[data-wishlist-items]');
    if (!target) return;
    target.replaceChildren();
    if (!list.length) { const p = document.createElement('p'); p.textContent = 'No favourites yet.'; target.append(p); }
    list.forEach(item => {
      const row = document.createElement('div'); row.className = 'wishlist-panel__item';
      const img = document.createElement('img'); img.src = item.image; img.alt = '';
      const box = document.createElement('div');
      const link = document.createElement('a'); link.href = item.url; const title = document.createElement('strong'); title.textContent = item.title; link.append(title);
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Remove';
      on(remove, 'click', () => { saveWishlist(getWishlist().filter(p => p.id !== item.id)); renderWishlist(); updateHearts(); });
      box.append(link, document.createElement('br'), remove); row.append(img, box); target.append(row);
    });
  };
  const updateHearts = () => {
    const ids = getWishlist().map(item => item.id);
    $$('[data-wishlist-add]').forEach(button => {
      const saved = ids.includes(button.dataset.id);
      button.setAttribute('aria-pressed', String(saved));
      button.textContent = saved ? '♥' : '♡';
      button.setAttribute('aria-label', (saved ? 'Remove ' : 'Add ') + button.dataset.title + (saved ? ' from' : ' to') + ' wishlist');
    });
  };
  $$('[data-wishlist-add]').forEach(button => on(button, 'click', () => {
    const item = { id: button.dataset.id, title: button.dataset.title, url: button.dataset.url, image: button.dataset.image };
    const existing = getWishlist();
    saveWishlist(existing.some(p => p.id === item.id) ? existing.filter(p => p.id !== item.id) : [...existing, item]);
    updateHearts(); renderWishlist();
  }));
  on(document.querySelector('[data-wishlist-toggle]'), 'click', () => { wishlistPanel.hidden = false; renderWishlist(); });
  on(document.querySelector('[data-wishlist-close]'), 'click', () => { wishlistPanel.hidden = true; });
  updateHearts();

  // ---------- Accessible mobile navigation ----------
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const mobileMenu = document.querySelector('#MobileMenu');
  on(menuToggle, 'click', () => {
    const open = mobileMenu.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  on(document, 'keydown', (event) => {
    if (event.key === 'Escape' && mobileMenu?.classList.contains('is-open')) {
      mobileMenu.classList.remove('is-open');
      menuToggle?.setAttribute('aria-expanded', 'false');
      menuToggle?.focus();
    }
  });

  // ---------- Init: update cart count on load ----------
  Cart.get().then(cart => {
    $$('[data-cart-count]').forEach(el => { el.textContent = cart.item_count; el.hidden = cart.item_count === 0; });
  });
})();
