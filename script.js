/* 7kSlowClub — vitrine demonstrativa.
   Integração futura: substitua os campos mercadoLivreUrl abaixo pelos links
   reais dos anúncios quando publicados. Não exponha tokens de API neste JS.
   Para um checkout de múltiplos itens, será necessária uma integração própria.
*/
const PRODUCTS = Object.freeze({
  preta: {
    title: 'Camiseta oversized preta SlowClub',
    description: 'Camisa preta de algodão arte gengar.',
    front: 'assets/preta-frente.webp',
    back: 'assets/preta-costas.webp',
    color: 'Preta',
    mercadoLivreUrl: ''
  },
  branca: {
    title: 'Camiseta oversized branca 7kSlowClub',
    description: 'Camisa preta de algodão arte Civic g6.',
    front: 'assets/branca-frente.webp',
    back: 'assets/branca-costas.webp',
    color: 'Branca',
    mercadoLivreUrl: ''
  }
});
const SIZES = ['PP', 'P', 'M', 'G', 'GG'];
const STORAGE_KEY = '7kslowclub-cart-v1';

function loadCart() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(data)) return [];
    return data.filter(i => i && PRODUCTS[i.id] && SIZES.includes(i.size) && Number.isInteger(i.qty) && i.qty > 0 && i.qty <= 99)
      .map(i => ({ id: i.id, size: i.size, qty: i.qty }));
  } catch { return []; }
}
let cart = loadCart();
let previousFocus = null;
let toastTimeout;
const drawer = document.getElementById('cartDrawer');
const overlay = document.getElementById('cartOverlay');
const cartItems = document.getElementById('cartItems');
const emptyCart = document.getElementById('emptyCart');
const drawerFooter = document.getElementById('drawerFooter');

function saveCart() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch { /* Bloqueio de armazenamento: carrinho continua na sessão. */ }
  renderCart();
}
function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('visible'), 2900);
}
function openCart() {
  previousFocus = document.activeElement;
  overlay.hidden = false;
  drawer.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => { overlay.classList.add('is-open'); drawer.classList.add('is-open'); drawer.querySelector('#closeCart').focus(); });
}
function closeCart() {
  overlay.classList.remove('is-open');
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden','true');
  document.body.style.overflow = '';
  setTimeout(() => { if (!drawer.classList.contains('is-open')) overlay.hidden = true; }, 310);
  if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
}
function changeQuantity(id, size, delta) {
  const item = cart.find(i => i.id === id && i.size === size);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i !== item);
  if (item.qty > 99) item.qty = 99;
  saveCart();
}
function removeItem(id, size) {
  cart = cart.filter(i => !(i.id === id && i.size === size));
  saveCart();
}
function renderCart() {
  const count = cart.reduce((sum,i) => sum + i.qty,0);
  document.getElementById('cartCount').textContent = count;
  document.getElementById('drawerCount').textContent = `(${count})`;
  emptyCart.hidden = cart.length > 0;
  drawerFooter.hidden = cart.length === 0;
  cartItems.replaceChildren();
  cart.forEach(item => {
    const product = PRODUCTS[item.id];
    const card = document.createElement('div');
    card.className = 'cart-item';
    const image = document.createElement('img');
    image.src = product.front;
    image.alt = product.title;
    const detail = document.createElement('div');
    const name = document.createElement('h3');
    name.textContent = product.title;
    const meta = document.createElement('div');
    meta.className = 'cart-item-meta';
    meta.textContent = `Tamanho ${item.size} · ${product.color}`;
    const actions = document.createElement('div');
    actions.className = 'cart-item-actions';
    const controls = document.createElement('div');
    controls.className = 'quantity-controls';
    const minus = document.createElement('button');
    minus.type='button'; minus.textContent='−'; minus.setAttribute('aria-label', `Diminuir quantidade de ${product.title} tamanho ${item.size}`);
    minus.addEventListener('click', () => changeQuantity(item.id,item.size,-1));
    const value = document.createElement('span');
    value.textContent = item.qty;
    value.setAttribute('aria-label', `Quantidade: ${item.qty}`);
    const plus = document.createElement('button');
    plus.type='button'; plus.textContent='+'; plus.setAttribute('aria-label', `Aumentar quantidade de ${product.title} tamanho ${item.size}`);
    plus.addEventListener('click', () => changeQuantity(item.id,item.size,1));
    controls.append(minus,value,plus);
    const remove = document.createElement('button');
    remove.type='button'; remove.className='remove-item'; remove.textContent='Remover';
    remove.addEventListener('click', () => removeItem(item.id,item.size));
    actions.append(controls,remove);
    detail.append(name,meta,actions);
    card.append(image,detail);
    cartItems.append(card);
  });
}

document.querySelectorAll('.product-card').forEach(card => {
  const id = card.dataset.productId;
  const product = PRODUCTS[id];
  let selectedSize = null;
  const picture = card.querySelector('.product-image');
  card.querySelectorAll('.image-switch-button').forEach(button => {
    button.addEventListener('click', () => {
      const front = button.dataset.side === 'front';
      picture.src = front ? product.front : product.back;
      picture.alt = `${front ? 'Frente' : 'Costas'} da ${product.title}`;
      card.querySelectorAll('.image-switch-button').forEach(b => {
        b.classList.toggle('is-current', b === button);
        b.setAttribute('aria-pressed', String(b === button));
      });
    });
  });
  card.querySelectorAll('[data-size]').forEach(button => {
    button.addEventListener('click', () => {
      selectedSize = button.dataset.size;
      card.querySelector('.size-fieldset').classList.remove('needs-size');
      card.querySelectorAll('[data-size]').forEach(b => {
        b.classList.toggle('is-selected',b === button);
        b.setAttribute('aria-pressed',String(b === button));
      });
    });
  });
  card.querySelector('.add-button').addEventListener('click', () => {
    if (!selectedSize) {
      card.querySelector('.size-fieldset').classList.add('needs-size');
      showToast('Selecione um tamanho antes de adicionar.');
      card.querySelector('[data-size]').focus();
      return;
    }
    const item = cart.find(i => i.id === id && i.size === selectedSize);
    if (item) item.qty = Math.min(99,item.qty+1);
    else cart.push({ id, size: selectedSize, qty: 1 });
    saveCart();
    showToast(`${product.title} (${selectedSize}) adicionada ao carrinho!`);
  });
});

document.getElementById('openCart').addEventListener('click',openCart);
document.getElementById('closeCart').addEventListener('click',closeCart);
document.getElementById('cartOverlay').addEventListener('click',closeCart);
document.getElementById('continueShopping').addEventListener('click',closeCart);
document.getElementById('keepShopping').addEventListener('click',closeCart);
document.addEventListener('keydown', e => {
  if (!drawer.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeCart();
  if (e.key === 'Tab') {
    const focusables = Array.from(drawer.querySelectorAll('button:not(:disabled),a[href]')).filter(el => el.getClientRects().length > 0);
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length-1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});
document.getElementById('year').textContent = new Date().getFullYear();
renderCart();
