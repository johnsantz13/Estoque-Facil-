const productModalOverlay = document.getElementById('product-modal-overlay');
const cartSidebar = document.getElementById('cart-sidebar');
const cartOverlay = document.getElementById('cart-overlay');

const precoBaseEl = document.getElementById('precoBase');
const qtdEl = document.getElementById('quantidade');
const totalEl = document.getElementById('total');
const adicionaisEls = document.querySelectorAll('.adicionais input');
const adicionaisContainer = document.querySelector('#product-modal-overlay .adicionais');
const tituloProdutoEl = document.getElementById('tituloProduto');
const skuEl = document.getElementById('modal-sku');
const imgEl = document.getElementById('modal-img');
const obsEl = document.getElementById('modal-obs');

let precoBase = 0;
let qtd = 1;

function abrirModalProduto(buttonElement) {
    const card = buttonElement.closest('.product-card');
    precoBase = parseFloat(card.dataset.price);
    const category = card.dataset.category;

    // Preenche o modal com os dados do produto
    tituloProdutoEl.textContent = card.dataset.name;
    skuEl.textContent = `SKU: ${card.dataset.sku}`;
    imgEl.src = card.dataset.image;
    imgEl.alt = card.dataset.name;
    precoBaseEl.textContent = precoBase.toFixed(2);

    // Mostra ou esconde a seção de adicionais com base na categoria
    if (adicionaisContainer) {
        adicionaisContainer.style.display = (category === 'hamburgueres') ? 'block' : 'none';
    }

    // Reseta o modal para o estado inicial
    qtd = 1;
    qtdEl.textContent = '1';
    adicionaisEls.forEach(el => el.checked = false);
    obsEl.value = '';
    
    calcularTotal();
    productModalOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
} window.abrirModalProduto = abrirModalProduto;

function fecharModalProduto(e) {
    if (!e || e.target === productModalOverlay) {
        productModalOverlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
} window.fecharModalProduto = fecharModalProduto;

function alterarQtd(valor) {
    qtd = Math.min(99, Math.max(1, qtd + valor));
    qtdEl.textContent = qtd;
    calcularTotal();
}

function calcularTotal() {
    let totalAdicionais = 0;
    adicionaisEls.forEach(el => {
        if (el.checked) totalAdicionais += parseFloat(el.value);
    });
    let total = (precoBase + totalAdicionais) * qtd;
    totalEl.textContent = total.toFixed(2);
}

adicionaisEls.forEach(el => el.addEventListener('change', calcularTotal));

function adicionarCarrinho() {
    const adicionais = [];
    adicionaisEls.forEach(el => {
        if (el.checked) {
            adicionais.push({
                text: el.dataset.text,
                value: parseFloat(el.value)
            });
        }
    });

    const item = {
        id: `${skuEl.textContent}-${Date.now()}`, // ID único para o item no carrinho
        name: tituloProdutoEl.textContent,
        sku: skuEl.textContent.replace('SKU: ', ''),
        price: precoBase,
        quantity: qtd,
        extras: adicionais,
        observations: obsEl.value,
        total: parseFloat(totalEl.textContent)
    };

    adicionarItemAoCarrinho(item); // Função definida em script.js
    alert(`${item.name} foi adicionado ao carrinho!`);
    fecharModalProduto(); // Fecha o modal de detalhes do produto
    abrirCarrinhoModal(); // Abre a barra lateral do carrinho
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        fecharModalProduto();
        fecharCarrinhoModal();
    }
});

function finalizarCompraWhatsApp() {
    const cart = getCart(); // Pega o carrinho do script.js
    if (cart.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    const numeroWhatsApp = "5500000000000"; // Substitua pelo seu número com código do país
    let totalGeral = 0;
    
    let mensagem = "Olá! Gostaria de fazer o seguinte pedido:\n\n";

    cart.forEach(item => {
        mensagem += `*${item.quantity}x ${item.name}*\n`;
        if (item.extras.length > 0) {
            item.extras.forEach(extra => {
                mensagem += `  - _Adicional: ${extra.text}_\n`;
            });
        }
        if (item.observations) {
            mensagem += `  - _Obs: ${item.observations}_\n`;
        }
        mensagem += `  - Subtotal: R$ ${item.total.toFixed(2)}\n\n`;
        totalGeral += item.total;
    });

    mensagem += `*TOTAL DO PEDIDO: R$ ${totalGeral.toFixed(2)}*`;

    const linkWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensagem)}`;
    
    window.open(linkWhatsApp, '_blank');
    limparCarrinho(false); // Limpa o carrinho sem pedir confirmação
    fecharCarrinhoModal();
} window.finalizarCompraWhatsApp = finalizarCompraWhatsApp;

// Funções para o modal do carrinho
function abrirCarrinhoModal() {
    renderizarCarrinho(); // Função definida em script.js
    cartOverlay.classList.remove('hidden');
    cartSidebar.classList.remove('translate-x-full');
    document.body.style.overflow = 'hidden';
}
window.abrirCarrinhoModal = abrirCarrinhoModal;

function fecharCarrinhoModal(e) {
    // Fecha se clicar no botão 'fechar' ou no overlay
    if (!e || e.target.id === 'cart-overlay' || e.target.classList.contains('fechar')) {
        cartOverlay.classList.add('hidden');
        cartSidebar.classList.add('translate-x-full');
        document.body.style.overflow = 'auto';
    }
} window.fecharCarrinhoModal = fecharCarrinhoModal;
