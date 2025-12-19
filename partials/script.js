// Aguarda o carregamento completo do DOM para garantir que todos os elementos existam
document.addEventListener('DOMContentLoaded', () => {

    // --- FUNÇÕES GLOBAIS DE DADOS ---
    const getAppData = () => {
        const data = localStorage.getItem('estoqueFacilData');
        return data ? JSON.parse(data) : { orders: {}, tableStatuses: {}, suppliers: [] };
    };
    const saveAppData = (data) => {
        localStorage.setItem('estoqueFacilData', JSON.stringify(data));
    };

    // --- LÓGICA DA BARRA LATERAL (SIDEBAR) ---
    // Encapsulada em função para permitir inicialização após partial ser carregado
    function initSidebar() {
        const sidebar = document.getElementById('sidebar');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const mainContent = document.getElementById('main-content');
        if (!sidebar || !sidebarToggle || !mainContent) return;

        const linkTexts = sidebar.querySelectorAll('.sidebar-link-text');

        const applySidebarState = (isExpanded) => {
            // Usamos classes e CSS para controlar largura e visibilidade; evita manipular estilos inline
            sidebar.classList.toggle('expanded', isExpanded);
            document.body.classList.toggle('sidebar-expanded', isExpanded);
            // atualiza atributo para acessibilidade
            sidebar.setAttribute('aria-expanded', String(!!isExpanded));
        };

        sidebarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isCurrentlyExpanded = sidebar.classList.contains('expanded');
            const newState = !isCurrentlyExpanded;
            localStorage.setItem('sidebarState', newState ? 'expanded' : 'collapsed');
            applySidebarState(newState);
        });

        // Inicializa estado salvo
        const initialState = localStorage.getItem('sidebarState') === 'expanded';
        applySidebarState(initialState);
    }

    // --- LÓGICA PARA SINALIZAR O LINK DA PÁGINA ATUAL NA SIDEBAR ---
    function highlightCurrentPageLink() {
        const currentPage = window.location.pathname.split('/').pop().split('?')[0];
        // Se a página for a raiz (index.html), trata como dashboard.html para o highlight
        const activePage = (currentPage === '' || currentPage === 'index.html') ? 'dashboard.html' : currentPage;
        const menuItems = document.querySelectorAll('.item-menu');
        menuItems.forEach(item => {
            const itemHref = item.getAttribute('href').split('/').pop();
            if (itemHref === activePage) {
                item.classList.add('bg-orange-700', 'dark:bg-gray-700');
            }
        });
    }

    // ESVUAZIAR: Inicializa se sidebar já estiver presente (página que não usa includes)
    if (document.getElementById('sidebar')) {
        initSidebar();
        highlightCurrentPageLink();
    }

    // Inicializa quando o partial for carregado via includes.js
    document.addEventListener('partial:loaded', (ev) => {
        if (ev && ev.detail && ev.detail.name === 'sidebar') {
            initSidebar();
            highlightCurrentPageLink();
        }
    });

    // --- LÓGICA DA PÁGINA DE CADASTRO DE PRODUTOS ---
    if (!!document.getElementById('add-ingredient-form')) {
        const productPriceInput = document.getElementById('product-price');
        const totalCostInput = document.getElementById('total-cost');
        const profitMarginInput = document.getElementById('profit-margin');
        const profitMarginPercentageInput = document.getElementById('profit-margin-percentage');
        const dropzoneFileInput = document.getElementById('dropzone-file');
        const imagePreview = document.getElementById('image-preview');
        const imagePreviewPlaceholder = document.getElementById('image-preview-placeholder');
        const addIngredientForm = document.getElementById('add-ingredient-form');
        const ingredientsTableBody = document.getElementById('ingredients-table-body');
        const noIngredientsMessage = document.getElementById('no-ingredients-message');
        const ingredientsTableFooter = document.getElementById('ingredients-table-footer');
        const totalIngredientsCostCell = document.getElementById('total-ingredients-cost');
        const addIngredientModalElement = document.getElementById('add-ingredient-modal');
        const modal = new Modal(addIngredientModalElement);

        dropzoneFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    imagePreview.src = e.target.result;
                    imagePreview.classList.remove('hidden');
                    imagePreviewPlaceholder.classList.add('hidden');
                };
                reader.readAsDataURL(file);
            }
        });

        addIngredientForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const name = document.getElementById('ingredient-name').value;
            const value = parseFloat(document.getElementById('ingredient-value').value);
            const quantity = parseFloat(document.getElementById('ingredient-quantity').value);
            const unit = document.getElementById('ingredient-unit').value;
            if (!unit) {
                alert("Por favor, selecione uma unidade para o ingrediente.");
                return;
            }
            const newRow = document.createElement('tr');
            newRow.className = 'bg-white border-b dark:bg-gray-800 dark:border-gray-700';
            newRow.setAttribute('data-cost', value);
            newRow.setAttribute('data-quantity', quantity);
            newRow.innerHTML = `
                <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">${name}</th>
                <td class="px-6 py-4">R$ ${value.toFixed(2)}</td>
                <td class="px-6 py-4">${quantity}</td>
                <td class="px-6 py-4">${unit}</td>
                <td class="px-6 py-4 text-center">
                    <button type="button" class="text-red-500 hover:text-red-700 delete-ingredient-btn"><i class="bi bi-trash-fill"></i></button>
                </td>
            `;
            ingredientsTableBody.appendChild(newRow);
            updateNoIngredientsMessage();
            updateCostsAndProfit();
            addIngredientForm.reset();
            modal.hide();
        });

        ingredientsTableBody.addEventListener('click', (event) => {
            const deleteButton = event.target.closest('.delete-ingredient-btn');
            if (deleteButton) {
                deleteButton.closest('tr').remove();
                updateNoIngredientsMessage();
                updateCostsAndProfit();
            }
        });

        productPriceInput.addEventListener('input', updateCostsAndProfit);

        function updateCostsAndProfit() {
            let totalCost = 0;
            ingredientsTableBody.querySelectorAll('tr').forEach(row => {
                const cost = parseFloat(row.getAttribute('data-cost'));
                const quantity = parseFloat(row.getAttribute('data-quantity'));
                if (!isNaN(cost) && !isNaN(quantity)) {
                    totalCost += (cost * quantity);
                }
            });
            totalIngredientsCostCell.textContent = `R$ ${totalCost.toFixed(2)}`;
            totalCostInput.value = `R$ ${totalCost.toFixed(2)}`;
            const salePrice = parseFloat(productPriceInput.value);
            if (!isNaN(salePrice) && salePrice > 0) {
                const profitMargin = salePrice - totalCost;
                profitMarginInput.value = `R$ ${profitMargin.toFixed(2)}`;
                const profitPercentage = (profitMargin / salePrice) * 100;
                profitMarginPercentageInput.value = `${profitPercentage.toFixed(2)}%`;
            } else {
                profitMarginInput.value = 'R$ 0.00';
                profitMarginPercentageInput.value = '0.00%';
            }
        }

        const updateNoIngredientsMessage = () => {
            if (ingredientsTableBody.children.length === 0) {
                noIngredientsMessage.classList.remove('hidden');
                ingredientsTableFooter.classList.add('hidden');
            } else {
                noIngredientsMessage.classList.add('hidden');
                ingredientsTableFooter.classList.remove('hidden');
            }
        };
        updateNoIngredientsMessage();
        updateCostsAndProfit();
    }
    
    // --- LÓGICA DA PÁGINA DE GESTÃO DE ESTOQUE ---
    if (!!document.getElementById('stock-table-body')) {
        const searchInput = document.getElementById('stock-search-input');
        const tableBody = document.getElementById('stock-table-body');
        const addItemForm = document.getElementById('add-item-form');
        const addItemModalElement = document.getElementById('add-item-modal');
        const modal = new Modal(addItemModalElement);

        searchInput.addEventListener('keyup', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const rows = tableBody.getElementsByTagName('tr');
            Array.from(rows).forEach(row => {
                const ingredientCell = row.cells[2];
                if (ingredientCell) {
                    const ingredientText = ingredientCell.textContent.toLowerCase();
                    if (ingredientText.includes(searchTerm)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                }
            });
        });

        addItemForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const code = document.getElementById('item-code').value;
            const ingredient = document.getElementById('item-ingredient').value;
            const receiptDate = document.getElementById('item-receipt-date').value;
            const stockQuantity = document.getElementById('item-stock-quantity').value;
            const formattedDate = receiptDate ? new Date(receiptDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/A';
            const newRow = document.createElement('tr');
            newRow.className = 'bg-white border-b dark:bg-gray-800 dark:border-gray-700';
            newRow.innerHTML = `
                <td class="w-4 p-4"><input type="checkbox" class="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"></td>
                <td class="px-6 py-4 font-medium">${code || 'N/A'}</td>
                <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">${ingredient}</td>
                <td class="px-6 py-4">${formattedDate}</td>
                <td class="px-6 py-4">${stockQuantity || 0}</td>
                <td class="px-6 py-4">0</td>
                <td class="px-6 py-4"><span class="bg-green-100 text-green-800 text-xs font-medium me-2 px-2.5 py-0.5 rounded dark:bg-green-900 dark:text-green-300">Normal</span></td>
                <td class="px-6 py-4 text-center space-x-2">
                    <button class="text-blue-500 hover:text-blue-700 edit-btn"><i class="bi bi-pencil-fill"></i></button>
                    <button class="text-red-500 hover:text-red-700 delete-btn"><i class="bi bi-trash-fill"></i></button>
                </td>
            `;
            tableBody.appendChild(newRow);
            addItemForm.reset();
            modal.hide();
        });

        tableBody.addEventListener('click', (event) => {
            const deleteButton = event.target.closest('.delete-btn');
            if (deleteButton) {
                deleteButton.closest('tr').remove();
            }
        });
    }

    // --- LÓGICA DA PÁGINA DE ATENDIMENTO DE MESAS ---
    if (!!document.getElementById('tables-grid')) {
        const tablesGrid = document.getElementById('tables-grid');
        const tableOptionsModalElement = document.getElementById('table-options-modal');
        const tableOptionsModal = new Modal(tableOptionsModalElement);
        const modalTableNumber = document.getElementById('modal-table-number');
        const modalTableStatus = document.getElementById('modal-table-status');
        const modalStartOrderBtn = document.getElementById('modal-start-order-btn');
        const modalEditOrderBtn = document.getElementById('modal-edit-order-btn');
        const modalChangeStatusBtn = document.getElementById('modal-change-status-btn');
        
        const changeStatusModalElement = document.getElementById('change-status-modal');
        const changeStatusModal = new Modal(changeStatusModalElement);
        const changeStatusTitle = document.getElementById('change-status-title');
        const statusOptionButtons = document.querySelectorAll('.change-status-option-btn');
        
        let selectedTableNumber = null;

        const updateTableDisplay = () => {
            const appData = getAppData();
            tablesGrid.querySelectorAll('.table-button').forEach(button => {
                const number = button.dataset.tableNumber;
                const status = appData.tableStatuses[number] || 'disponivel';
                const orderData = appData.orders[number];
                const totalSpan = button.querySelector('.table-total');
                
                button.dataset.status = status;
                button.classList.remove('bg-green-500', 'hover:bg-green-600', 'bg-orange-500', 'hover:bg-orange-600', 'bg-red-500', 'hover:bg-red-600', 'bg-gray-600', 'hover:bg-gray-700');

                switch(status) {
                    case 'atendimento': button.classList.add('bg-orange-500', 'hover:bg-orange-600'); break;
                    case 'reserva': button.classList.add('bg-red-500', 'hover:bg-red-600'); break;
                    case 'indisponivel': button.classList.add('bg-gray-600', 'hover:bg-gray-700'); break;
                    default: button.classList.add('bg-green-500', 'hover:bg-green-600'); break;
                }

                if (orderData && orderData.items && orderData.items.length > 0) {
                    let subtotal = 0;
                    orderData.items.forEach(item => {
                        subtotal += item.price * item.quantity;
                    });
                    const total = subtotal * 1.10;
                    totalSpan.textContent = `R$ ${total.toFixed(2)}`;
                } else {
                    totalSpan.textContent = '';
                }
            });
        };

        tablesGrid.addEventListener('click', (event) => {
            const tableButton = event.target.closest('.table-button');
            if (tableButton && tableButton.dataset.tableNumber) {
                selectedTableNumber = tableButton.dataset.tableNumber;
                const tableStatus = tableButton.dataset.status;
                modalTableNumber.textContent = `Mesa ${selectedTableNumber}`;
                modalStartOrderBtn.classList.add('hidden');
                modalEditOrderBtn.classList.add('hidden');
                
                switch(tableStatus) {
                    case 'disponivel':
                        modalTableStatus.textContent = 'Disponível';
                        modalTableStatus.className = 'mb-4 text-lg font-medium text-green-500';
                        modalStartOrderBtn.classList.remove('hidden');
                        break;
                    case 'atendimento':
                        modalTableStatus.textContent = 'Em Atendimento';
                        modalTableStatus.className = 'mb-4 text-lg font-medium text-orange-500';
                        modalEditOrderBtn.classList.remove('hidden');
                        break;
                    default:
                        modalTableStatus.textContent = tableStatus.charAt(0).toUpperCase() + tableStatus.slice(1);
                        modalTableStatus.className = 'mb-4 text-lg font-medium text-gray-500';
                        break;
                }
            }
        });

        const redirectToOrderPage = () => {
             if (selectedTableNumber) {
                const appData = getAppData();
                if (!appData.tableStatuses[selectedTableNumber] || appData.tableStatuses[selectedTableNumber] === 'disponivel') {
                    appData.tableStatuses[selectedTableNumber] = 'atendimento';
                    saveAppData(appData);
                }
                window.location.href = `/pages/atendimento_pedido.html?mesa=${selectedTableNumber}`;
            }
        }

        modalStartOrderBtn.addEventListener('click', redirectToOrderPage);
        modalEditOrderBtn.addEventListener('click', redirectToOrderPage);
        
        modalChangeStatusBtn.addEventListener('click', () => {
            if(selectedTableNumber) {
                changeStatusTitle.textContent = `Alterar Status da Mesa ${selectedTableNumber}`;
                tableOptionsModal.hide();
                changeStatusModal.show();
            }
        });

        statusOptionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const newStatus = button.dataset.newStatus;
                if (selectedTableNumber && newStatus) {
                    const appData = getAppData();
                    appData.tableStatuses[selectedTableNumber] = newStatus;
                    if (newStatus === 'disponivel') {
                        delete appData.orders[selectedTableNumber];
                    }
                    saveAppData(appData);
                    updateTableDisplay();
                    changeStatusModal.hide();
                }
            });
        });
        updateTableDisplay();
    }
    
    // --- LÓGICA DA PÁGINA DE ATENDIMENTO DE PEDIDO (PDV) ---
    if (!!document.getElementById('table-display') && !document.getElementById('table-select')) {
        const tableDisplay = document.getElementById('table-display');
        const menuItemsContainer = document.getElementById('menu-items');
        const orderItemsContainer = document.getElementById('order-items');
        const emptyOrderMessage = document.getElementById('empty-order-message');
        const subtotalEl = document.getElementById('subtotal');
        const serviceChargeEl = document.getElementById('service-charge');
        const totalEl = document.getElementById('total');
        const finalizeOrderBtn = document.getElementById('finalize-order-btn');

        const urlParams = new URLSearchParams(window.location.search);
        const tableNumber = urlParams.get('mesa');
        if (tableNumber) {
            tableDisplay.textContent = `MESA ${tableNumber}`;
        }

        const saveOrder = () => {
            if (!tableNumber) return;
            const appData = getAppData();
            const orderItems = [];
            orderItemsContainer.querySelectorAll('.order-item').forEach(itemEl => {
                orderItems.push({
                    name: itemEl.dataset.name,
                    price: parseFloat(itemEl.dataset.price),
                    quantity: parseInt(itemEl.querySelector('.item-quantity').textContent)
                });
            });

            const existingOrder = appData.orders[tableNumber];
            const createdAt = (existingOrder && existingOrder.createdAt) ? existingOrder.createdAt : new Date().toISOString();

            if (orderItems.length > 0) {
                appData.orders[tableNumber] = { items: orderItems, createdAt: createdAt };
                appData.tableStatuses[tableNumber] = 'atendimento';
            } else {
                delete appData.orders[tableNumber];
                appData.tableStatuses[tableNumber] = 'disponivel';
            }
            saveAppData(appData);
        };
        
        const updateTotals = () => {
            let subtotal = 0;
            orderItemsContainer.querySelectorAll('.order-item').forEach(item => {
                subtotal += parseFloat(item.dataset.price) * parseInt(item.querySelector('.item-quantity').textContent);
            });
            const serviceCharge = subtotal * 0.10;
            const total = subtotal + serviceCharge;
            subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
            serviceChargeEl.textContent = `R$ ${serviceCharge.toFixed(2)}`;
            totalEl.textContent = `R$ ${total.toFixed(2)}`;
            emptyOrderMessage.classList.toggle('hidden', orderItemsContainer.children.length > 1);
            saveOrder();
        };

        const createOrderItemElement = (name, price, quantity) => {
            const orderItem = document.createElement('div');
            orderItem.className = 'order-item flex justify-between items-center';
            orderItem.setAttribute('data-name', name);
            orderItem.setAttribute('data-price', price);
            orderItem.innerHTML = `
                <div>
                    <p class="font-semibold text-gray-800 dark:text-white">${name}</p>
                    <p class="text-sm text-gray-500">R$ ${price.toFixed(2)}</p>
                </div>
                <div class="flex items-center gap-3">
                    <button class="quantity-btn decrease-qty bg-gray-200 rounded-md px-2">-</button>
                    <span class="item-quantity font-bold">${quantity}</span>
                    <button class="quantity-btn increase-qty bg-gray-200 rounded-md px-2">+</button>
                    <button class="remove-item-btn text-red-500 hover:text-red-700"><i class="bi bi-trash-fill"></i></button>
                </div>
            `;
            orderItemsContainer.appendChild(orderItem);
        };

        const loadOrder = () => {
            if (!tableNumber) return;
            const appData = getAppData();
            const savedOrderData = appData.orders[tableNumber];
            orderItemsContainer.innerHTML = '';
            orderItemsContainer.appendChild(emptyOrderMessage);
            if (savedOrderData && savedOrderData.items && savedOrderData.items.length > 0) {
                savedOrderData.items.forEach(item => createOrderItemElement(item.name, item.price, item.quantity));
            }
            updateTotals();
        };

        menuItemsContainer.addEventListener('click', (event) => {
            const addButton = event.target.closest('.add-to-order-btn');
            if (addButton) {
                const menuItem = addButton.closest('.menu-item');
                const name = menuItem.dataset.name;
                const price = parseFloat(menuItem.dataset.price);
                const existingItem = orderItemsContainer.querySelector(`[data-name="${name}"]`);
                if (existingItem) {
                    const quantityEl = existingItem.querySelector('.item-quantity');
                    quantityEl.textContent = parseInt(quantityEl.textContent) + 1;
                } else {
                    createOrderItemElement(name, price, 1);
                }
                updateTotals();
            }
        });

        orderItemsContainer.addEventListener('click', (event) => {
            const orderItem = event.target.closest('.order-item');
            if (!orderItem) return;
            if (event.target.matches('.increase-qty')) {
                const quantityEl = orderItem.querySelector('.item-quantity');
                quantityEl.textContent = parseInt(quantityEl.textContent) + 1;
            } else if (event.target.matches('.decrease-qty')) {
                const quantityEl = orderItem.querySelector('.item-quantity');
                if (parseInt(quantityEl.textContent) > 1) {
                    quantityEl.textContent = parseInt(quantityEl.textContent) - 1;
                } else {
                    orderItem.remove();
                }
            } else if (event.target.closest('.remove-item-btn')) {
                orderItem.remove();
            }
            updateTotals();
        });
        
        finalizeOrderBtn.addEventListener('click', () => {
            const appData = getAppData();
            delete appData.orders[tableNumber];
            appData.tableStatuses[tableNumber] = 'disponivel';
            saveAppData(appData);
            window.location.href = '/pages/atendimento_mesas.html';
        });

        loadOrder();
    }

    // --- LÓGICA DA PÁGINA PDV ---
    const isPdvPage = !!document.getElementById('table-select');
    if(isPdvPage) {
        const tableSelect = document.getElementById('table-select');
        const orderItemsContainer = document.getElementById('order-items');
        const emptyOrderMessage = document.getElementById('empty-order-message');
        const subtotalEl = document.getElementById('subtotal');
        const serviceChargeEl = document.getElementById('service-charge');
        const totalEl = document.getElementById('total');
        const finalizeOrderBtn = document.getElementById('finalize-order-btn');
        const finalizeOrderModalElement = document.getElementById('finalize-order-modal');
        const finalizeOrderModal = new Modal(finalizeOrderModalElement);
        
        let currentTableNumber = null;

        const populateTableSelect = () => {
            const appData = getAppData();
            const tablesInService = Object.keys(appData.orders);

            tableSelect.innerHTML = '<option selected disabled>Escolha uma mesa</option>';

            if (tablesInService.length > 0) {
                tablesInService.forEach(tableNumber => {
                    const option = document.createElement('option');
                    option.value = tableNumber;
                    option.textContent = `Mesa ${tableNumber}`;
                    tableSelect.appendChild(option);
                });
            }
        };

        const createOrderItemElement = (name, price, quantity) => {
            const orderItem = document.createElement('div');
            orderItem.className = 'order-item flex justify-between items-center';
            orderItem.setAttribute('data-name', name);
            orderItem.setAttribute('data-price', price);
            orderItem.innerHTML = `
                <div>
                    <p class="font-semibold text-gray-800 dark:text-white">${name}</p>
                    <p class="text-sm text-gray-500">R$ ${price.toFixed(2)}</p>
                </div>
                <div class="flex items-center gap-3">
                    <span class="font-bold">${quantity}x</span>
                </div>
            `;
            orderItemsContainer.appendChild(orderItem);
        }

        const loadOrderForTable = (tableNumber) => {
            currentTableNumber = tableNumber;
            const appData = getAppData();
            const orderData = appData.orders[tableNumber];
            
            orderItemsContainer.innerHTML = ''; 

            if (orderData && orderData.items && orderData.items.length > 0) {
                emptyOrderMessage.classList.add('hidden');
                orderData.items.forEach(item => {
                    createOrderItemElement(item.name, item.price, item.quantity);
                });
                finalizeOrderBtn.disabled = false;
            } else {
                orderItemsContainer.appendChild(emptyOrderMessage);
                emptyOrderMessage.textContent = 'Nenhum pedido para esta mesa.';
                emptyOrderMessage.classList.remove('hidden');
                finalizeOrderBtn.disabled = true;
            }
            updateTotals();
        };
        
        const updateTotals = () => {
             let subtotal = 0;
            orderItemsContainer.querySelectorAll('.order-item').forEach(item => {
                subtotal += parseFloat(item.dataset.price) * parseInt(item.querySelector('span.font-bold').textContent.replace('x',''));
            });
            const serviceCharge = subtotal * 0.10;
            const total = subtotal + serviceCharge;
            subtotalEl.textContent = `R$ ${subtotal.toFixed(2)}`;
            serviceChargeEl.textContent = `R$ ${serviceCharge.toFixed(2)}`;
            totalEl.textContent = `R$ ${total.toFixed(2)}`;
        };

        tableSelect.addEventListener('change', () => {
            loadOrderForTable(tableSelect.value);
        });

        finalizeOrderModalElement.addEventListener('click', (event) => {
            const paymentButton = event.target.closest('.payment-method-btn');
            if (paymentButton) {
                const method = paymentButton.dataset.method;
                
                const appData = getAppData();
                delete appData.orders[currentTableNumber];
                appData.tableStatuses[currentTableNumber] = 'disponivel';
                saveAppData(appData);

                finalizeOrderModal.hide();
                alert(`Pagamento com ${method} confirmado! Mesa ${currentTableNumber} liberada.`);

                populateTableSelect();
                orderItemsContainer.innerHTML = '';
                orderItemsContainer.appendChild(emptyOrderMessage);
                emptyOrderMessage.textContent = 'Selecione uma mesa para ver o pedido.';
                emptyOrderMessage.classList.remove('hidden');
                updateTotals();
                finalizeOrderBtn.disabled = true;
            }
        });

        populateTableSelect();
    }

    // --- LÓGICA DA PÁGINA PAINEL DA COZINHA ---
    const isKitchenPage = !!document.getElementById('kitchen-board');
    if(isKitchenPage) {
        const kitchenBoard = document.getElementById('kitchen-board');
        const receivedColumn = document.getElementById('received-column');
        const inProgressColumn = document.getElementById('in-progress-column');
        const completedColumn = document.getElementById('completed-column');
        const receivedCount = document.getElementById('received-count');
        const inProgressCount = document.getElementById('in-progress-count');
        const completedCount = document.getElementById('completed-count');
        const timers = {};

        const createOrderCard = (tableNumber, orderData) => {
            const itemsHtml = orderData.items.map(item => `
                <li class="text-sm text-gray-600 dark:text-gray-400">
                    <span class="font-semibold">${item.quantity}x</span> ${item.name}
                </li>
            `).join('');
            
            const createdAt = new Date(orderData.createdAt);
            const formattedTime = createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

            const card = document.createElement('div');
            card.className = 'order-card bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md';
            card.setAttribute('data-table', tableNumber);
            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-lg text-gray-800 dark:text-white">Mesa ${tableNumber}</h3>
                    <span class="status-badge text-xs font-medium px-2.5 py-0.5 rounded"></span>
                </div>
                <div class="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span>Iniciado às: ${formattedTime}</span>
                    <span class="timer font-semibold"></span>
                </div>
                <ul class="space-y-1 mb-4 list-disc list-inside">${itemsHtml}</ul>
                <div class="flex justify-end gap-2">
                    <button class="text-xs font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 px-3 py-1.5 rounded-md">Alerta</button>
                    <button class="conclude-btn text-xs font-medium text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-md">Avançar</button>
                </div>
            `;
            return card;
        };

        const updateCardStatus = (card, newStatus) => {
            card.dataset.status = newStatus;
            const statusBadge = card.querySelector('.status-badge');
            const concludeBtn = card.querySelector('.conclude-btn');
            const tableNumber = card.dataset.table;

            if (timers[tableNumber]) {
                clearInterval(timers[tableNumber]);
                delete timers[tableNumber];
            }

            switch(newStatus) {
                case 'recebido':
                    statusBadge.textContent = 'Recebido';
                    statusBadge.className = 'status-badge bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded';
                    break;
                case 'andamento':
                    statusBadge.textContent = 'Em Andamento';
                    statusBadge.className = 'status-badge bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded';
                    const startTime = Date.now();
                    card.dataset.startTime = startTime;
                    timers[tableNumber] = setInterval(() => {
                        const elapsed = Math.floor((Date.now() - startTime) / 1000);
                        const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0');
                        const seconds = String(elapsed % 60).padStart(2, '0');
                        card.querySelector('.timer').textContent = `${minutes}:${seconds}`;
                    }, 1000);
                    break;
                case 'concluido':
                    statusBadge.textContent = 'Concluído';
                    statusBadge.className = 'status-badge bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded';
                    concludeBtn.textContent = 'Finalizado';
                    concludeBtn.disabled = true;
                    concludeBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
                    concludeBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
                    const finalTime = card.querySelector('.timer').textContent;
                    if (finalTime) {
                        card.querySelector('.timer').textContent = `Feito em: ${finalTime}`;
                    }
                    break;
            }
        };
        
        const updateCounts = () => {
             receivedCount.textContent = receivedColumn.children.length;
             inProgressCount.textContent = inProgressColumn.children.length;
             completedCount.textContent = completedColumn.children.length;
        };
        
        const loadOrders = () => {
            const appData = getAppData();
            const hasSavedOrders = Object.keys(appData.orders).length > 0;

            if (hasSavedOrders) {
                receivedColumn.innerHTML = '';
                inProgressColumn.innerHTML = '';
                completedColumn.innerHTML = '';

                for (const tableNumber in appData.orders) {
                    const orderData = appData.orders[tableNumber];
                    if (orderData && orderData.items.length > 0) {
                        const card = createOrderCard(tableNumber, orderData);
                        updateCardStatus(card, 'recebido');
                        receivedColumn.appendChild(card);
                    }
                }
            } else {
                document.querySelectorAll('#kitchen-board .order-card').forEach(card => {
                    const status = card.dataset.status;
                    if(status === 'andamento'){
                        updateCardStatus(card, 'andamento');
                    } else {
                        updateCardStatus(card, status);
                    }
                });
            }
            updateCounts();
        };

        kitchenBoard.addEventListener('click', (event) => {
            const concludeBtn = event.target.closest('.conclude-btn');
            if(concludeBtn && !concludeBtn.disabled) {
                const card = concludeBtn.closest('.order-card');
                const currentStatus = card.dataset.status;

                if (currentStatus === 'recebido') {
                    updateCardStatus(card, 'andamento');
                    inProgressColumn.appendChild(card);
                } else if (currentStatus === 'andamento') {
                    updateCardStatus(card, 'concluido');
                    completedColumn.appendChild(card);
                }
                updateCounts();
            }
        });

        loadOrders();
    }
});

// --- LÓGICA DE LOGIN (moved from inline in index.html) ---
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const notification = document.getElementById('notification');
    const notificationMessage = document.getElementById('notification-message');

    // Elementos do novo layout com abas
    const registerForm = document.getElementById('registerForm');
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const toRegisterBtn = document.getElementById('toRegister');
    const toLoginBtn = document.getElementById('toLogin');

    // Se não for a página de login, não faz nada
    if (!loginForm || !registerForm || !tabLogin || !tabRegister || !toRegisterBtn || !toLoginBtn) return;

    const showLoginForm = () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.style.display = 'flex';
        registerForm.style.display = 'none';
    };

    const showRegisterForm = () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerForm.style.display = 'flex';
        loginForm.style.display = 'none';
    };

    // Lógica para alternar entre abas
    tabLogin.addEventListener('click', showLoginForm);
    tabRegister.addEventListener('click', showRegisterForm);

    // Lógica para alternar com os botões "ghost"
    toRegisterBtn.addEventListener('click', showRegisterForm);
    toLoginBtn.addEventListener('click', showLoginForm);

    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        // Credenciais de exemplo (trocar por backend em produção)
        const correctEmail = 'admin@estoquefacil.com';
        const correctPassword = '1234';

        if (email === correctEmail && password === correctPassword) {
            showNotification('Login realizado com sucesso! Redirecionando...', 'success');
            setTimeout(() => { window.location.href = '/pages/dashboard.html'; }, 2000);
        } else {
            showNotification('E-mail ou senha inválidos. Tente novamente.', 'error');
        }
    });

    function showNotification(message, type) {
        notificationMessage.textContent = message;
        notification.classList.remove('bg-green-500', 'bg-red-500', 'hidden');
        if (type === 'success') notification.classList.add('bg-green-500');
        else notification.classList.add('bg-red-500');
        notification.classList.remove('hidden');
        setTimeout(() => { notification.classList.add('hidden'); }, 3000);
    }
});
