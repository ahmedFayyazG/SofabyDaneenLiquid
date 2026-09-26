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
      $$('input[name="options[Fabric]"]', this).forEach(r => on(r, 'change', () => this.filterColours(r.value)));
      $$('input[type=radio]', this).forEach(r => on(r, 'change', () => this.updateVariant()));
      const checked = this.querySelector('input[name="options[Fabric]"]:checked');
      if (checked) this.filterColours(checked.value);
    }
    filterColours(fabric) {
      $$('input[name="options[Colour]"]', this).forEach(input => {
        const opt = input.closest('.swatch-picker__option');
        const supported = (input.dataset.fabrics || '').split('|');
        const ok = !input.dataset.fabrics || supported.includes(fabric);
        opt.style.display = ok ? '' : 'none';
        if (!ok && input.checked) input.checked = false;
      });
      const firstVisible = $$('input[name="options[Colour]"]:not([style*="display: none"])', this)
        .find(i => i.closest('.swatch-picker__option').style.display !== 'none');
      if (firstVisible && !$('input[name="options[Colour]"]:checked', this)) firstVisible.checked = true;
      this.updateVariant();
    }
    updateVariant() {
      const selected = $$('input[type=radio]:checked', this).map(r => r.value);
      const data = JSON.parse(this.dataset.variants || '[]');
      const match = data.find(v => v.options.every((o, i) => o === selected[i]));
      if (match) {
        this.form?.querySelector('[name="id"]')?.setAttribute('value', match.id);
        document.dispatchEvent(new CustomEvent('variant:change', { detail: match }));
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
      on(document, 'variant:change', (e) => {
        if (e.detail.featured_image) this.setImage(e.detail.featured_image.src);
      });
    }
    select(thumb) {
      $$('.gallery__thumb', this).forEach(t => t.setAttribute('aria-current', 'false'));
      thumb.setAttribute('aria-current', 'true');
      this.setImage(thumb.dataset.src);
    }
    setImage(src) { if (this.main) this.main.src = src; }
  }
  customElements.define('product-gallery', ProductGallery);

  // ---------- Init: update cart count on load ----------
  Cart.get().then(cart => {
    $$('[data-cart-count]').forEach(el => { el.textContent = cart.item_count; el.hidden = cart.item_count === 0; });
  });
})();
