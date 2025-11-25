class ProductManager {
  constructor() {
    this.products = PRODUCTS_DATA;
    this.selectedProducts = new Map();
    this.init();
  }

  init() {
    this.renderProducts();
    this.attachEventListeners();
    this.updateCartBadge();
  }

  renderProducts(filteredProducts = this.products) {
    const grid = document.getElementById('productsGrid');
    const emptyState = document.getElementById('emptyState');

    if (!grid) return;

    if (filteredProducts.length === 0) {
      grid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }

    grid.style.display = 'grid';
    if (emptyState) emptyState.style.display = 'none';

    grid.innerHTML = filteredProducts.map(product => this.createProductCard(product)).join('');

    this.attachProductListeners();
    this.restoreSelectedStates();
  }

  createProductCard(product) {
    return `
      <article class="product-card" data-product-id="${product.id}" tabindex="0" role="button" aria-label="Selecionar ${product.name}">
        <div class="product-image-wrapper">
          <img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy">
          <input type="checkbox" class="product-checkbox" aria-label="Selecionar ${product.name}">
          <div class="product-checkmark" aria-hidden="true">✓</div>
        </div>
        <div class="product-content">
          <h3 class="product-name">${product.name}</h3>
          <p class="product-price">${this.formatPrice(product.price)}</p>
          <div class="product-controls">
            <label class="product-qty-label" for="qty-${product.id}">Qtd:</label>
            <input
              type="number"
              id="qty-${product.id}"
              class="product-qty-input"
              min="1"
              max="99"
              value="1"
              disabled
              aria-label="Quantidade de ${product.name}"
            >
          </div>
        </div>
      </article>
    `;
  }

  attachProductListeners() {
    const cards = document.querySelectorAll('.product-card');

    cards.forEach(card => {
      const checkbox = card.querySelector('.product-checkbox');
      const qtyInput = card.querySelector('.product-qty-input');
      const productId = parseInt(card.dataset.productId);

      checkbox.addEventListener('change', () => {
        this.handleCheckboxChange(productId, checkbox, qtyInput, card);
      });

      qtyInput.addEventListener('change', () => {
        this.handleQuantityChange(productId, qtyInput);
      });

      card.addEventListener('click', (e) => {
        if (e.target.closest('.product-controls')) return;
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          checkbox.checked = !checkbox.checked;
          checkbox.dispatchEvent(new Event('change'));
        }
      });
    });
  }

  handleCheckboxChange(productId, checkbox, qtyInput, card) {
    if (checkbox.checked) {
      const quantity = parseInt(qtyInput.value) || 1;
      this.selectedProducts.set(productId, quantity);
      qtyInput.disabled = false;
      card.classList.add('selected');
    } else {
      this.selectedProducts.delete(productId);
      qtyInput.disabled = true;
      card.classList.remove('selected');
    }
    this.updateCartBadge();
  }

  handleQuantityChange(productId, qtyInput) {
    const quantity = Math.max(1, parseInt(qtyInput.value) || 1);
    qtyInput.value = quantity;
    if (this.selectedProducts.has(productId)) {
      this.selectedProducts.set(productId, quantity);
      this.updateCartBadge();
    }
  }

  restoreSelectedStates() {
    this.selectedProducts.forEach((quantity, productId) => {
      const card = document.querySelector(`[data-product-id="${productId}"]`);
      if (card) {
        const checkbox = card.querySelector('.product-checkbox');
        const qtyInput = card.querySelector('.product-qty-input');
        checkbox.checked = true;
        qtyInput.value = quantity;
        qtyInput.disabled = false;
        card.classList.add('selected');
      }
    });
  }

  updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const count = document.getElementById('cartCount');

    if (!badge || !count) return;

    const totalItems = Array.from(this.selectedProducts.values()).reduce((sum, qty) => sum + qty, 0);

    if (totalItems > 0) {
      count.textContent = totalItems;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }

  formatPrice(price) {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  }

  searchProducts(query) {
    const normalizedQuery = query.toLowerCase().trim();

    if (!normalizedQuery) {
      this.renderProducts();
      return;
    }

    const filtered = this.products.filter(product =>
      product.name.toLowerCase().includes(normalizedQuery)
    );

    this.renderProducts(filtered);
  }

  buildOrderMessage() {
    if (this.selectedProducts.size === 0) {
      return null;
    }

    const lines = [];
    let total = 0;

    this.selectedProducts.forEach((quantity, productId) => {
      const product = this.products.find(p => p.id === productId);
      if (product) {
        const subtotal = product.price * quantity;
        total += subtotal;
        lines.push(`${quantity}x ${product.name} — ${this.formatPrice(subtotal)}`);
      }
    });

    const header = 'Pedido via site:%0A%0A';
    const body = lines.join('%0A');
    const totalLine = `%0A%0ATotal: ${this.formatPrice(total)}`;
    const footer = '%0A%0APor favor, informe a data e horário desejado para retirada/entrega.';

    return header + body + totalLine + footer;
  }

  sendToWhatsApp() {
    const message = this.buildOrderMessage();

    if (!message) {
      alert('Selecione ao menos um produto para enviar o pedido.');
      return;
    }

    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${message}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  attachEventListeners() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchProducts(e.target.value);
      });
    }

    const orderBtn = document.getElementById('orderBtn');
    if (orderBtn) {
      orderBtn.addEventListener('click', () => this.sendToWhatsApp());
    }

    const orderBtnMobile = document.getElementById('orderBtnMobile');
    if (orderBtnMobile) {
      orderBtnMobile.addEventListener('click', (e) => {
        e.preventDefault();
        this.sendToWhatsApp();
      });
    }

    // Tornar o badge do carrinho clicável e acessível (abre o WhatsApp com o pedido)
    const cartBadge = document.getElementById('cartBadge');
    if (cartBadge) {
      cartBadge.setAttribute('tabindex', '0');
      cartBadge.setAttribute('role', 'button');
      cartBadge.setAttribute('aria-label', 'Enviar pedido pelo WhatsApp');
      cartBadge.addEventListener('click', () => this.sendToWhatsApp());
      cartBadge.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.sendToWhatsApp();
        }
      });
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ProductManager();

  // Mostrar modal de boas-vindas ao carregar a página
  const modal = document.getElementById('welcomeModal');
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');

  function openModal() {
    if (!modal || !overlay) return;
    modal.classList.add('show');
    modal.querySelector('.modal-card')?.classList.add('show');
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }

  function closeModal() {
    if (!modal || !overlay) return;
    modal.classList.remove('show');
    modal.querySelector('.modal-card')?.classList.remove('show');
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  // Abrir com pequeno atraso para dar sensação de pop-in
  setTimeout(openModal, 300);

  // Eventos de fechamento
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Ao clicar em qualquer botão do modal: esconder os botões, desabilitá-los e fechar o modal
  const modalBtns = modal?.querySelectorAll('.modal-btn');
  if (modalBtns && modalBtns.length) {
    modalBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Esconder o contêiner de ações para que os botões desapareçam
        const actions = modal.querySelector('.modal-actions');
        if (actions) actions.style.display = 'none';

        // Desabilitar os botões para evitar cliques subsequentes (não removemos href)
        modalBtns.forEach(b => {
          b.setAttribute('aria-disabled', 'true');
          b.style.pointerEvents = 'none';
        });

        // Fechar overlay/modal para que não fique sobreposto
        closeModal();

        // Não prevenir o comportamento padrão: links ainda irão abrir/navegar.
      });
    });
  }
});
