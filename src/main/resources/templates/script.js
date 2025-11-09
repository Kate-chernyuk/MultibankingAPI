class ApiService {
    constructor() {
        this.baseUrl = 'http://localhost:8090/api/v1';
        this.userId = 'team086-1';
    }

    async makeRequest(url, options = {}) {
        console.log(`API Request: ${url}`, options);

        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                    ...options.headers,
                },
            });

            console.log(`API Response status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`API Error ${response.status}:`, errorText);
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
            }

            const responseText = await response.text();
            console.log(`API Response body:`, responseText);

            if (responseText && responseText.trim() !== '') {
                return JSON.parse(responseText);
            } else {
                return { success: true };
            }
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    async createAccount(bankType, accountType = 'checking', initialBalance = 0) {
        return this.makeRequest(`${this.baseUrl}/accounts/${this.userId}/create`, {
            method: 'POST',
            body: JSON.stringify({
                bankType: bankType.toUpperCase(),
                accountType: accountType,
                initialBalance: initialBalance.toString()
            })
        });
    }

    async closeAccount(bankType, accountId, action, destinationAccountId) {
        return this.makeRequest(`${this.baseUrl}/accounts/${this.userId}/close`, {
            method: 'PUT',
            body: JSON.stringify({
                bankType: bankType.toUpperCase(),
                accountId: accountId,
                action: action,
                destination_account_id: destinationAccountId
            })
        });
    }

    async getAggregatedData(bankTypes = []) {
        const params = bankTypes.length > 0 ? `?bankTypes=${bankTypes.join(',')}` : '';
        return this.makeRequest(`${this.baseUrl}/aggregate/${this.userId}${params}`);
    }

    async getTransactions(bankTypes = []) {
        const params = bankTypes.length > 0 ? `?bankTypes=${bankTypes.join(',')}` : '';
        return this.makeRequest(`${this.baseUrl}/transactions/${this.userId}${params}`);
    }

    async createPayment(fromAccount, toAccount, amount, bankTypeFrom, bankTypeTo) {
        return this.makeRequest(`${this.baseUrl}/payments/${this.userId}`, {
            method: 'POST',
            body: JSON.stringify({
                fromAccount: fromAccount,
                toAccount: toAccount,
                bankTypeFrom: bankTypeFrom,
                bankTypeTo: bankTypeTo,
                amount: {
                    amount: amount.toString(),
                    currency: "RUB"
                }
            })
        });
    }

    async getProductsCatalog(bankType = null, productType = null, sortBy = null) {
        const params = new URLSearchParams();
        if (bankType) params.append('bankType', bankType);
        if (productType) params.append('productType', productType);
        if (sortBy) params.append('sortBy', sortBy);

        const url = `${this.baseUrl}/products/catalog${params.toString() ? `?${params}` : ''}`;
        return this.makeRequest(url);
    }

    async getUserProducts(bankType = null, productType = null, status = null, sortBy = null) {
        const params = new URLSearchParams();
        if (bankType) params.append('bankType', bankType);
        if (productType) params.append('productType', productType);
        if (sortBy) params.append('sortBy', sortBy);
        if (status) params.append('status', status);

        const url = `${this.baseUrl}/products/${this.userId}${params.toString() ? `?${params}` : ''}`;
        return this.makeRequest(url);
    }

    async buyProduct(bankType, productId, amount, sourceAccountId) {
        return this.makeRequest(`${this.baseUrl}/products/${this.userId}/buy`, {
            method: 'POST',
            body: JSON.stringify({
                bankType: bankType,
                productId: productId,
                amount: amount.toString(),
                sourceAccountId: sourceAccountId
            })
        });
    }

    async deleteProduct(bankType, agreementId, repaymentAccountId, repaymentAmount) {
        return this.makeRequest(`${this.baseUrl}/products/${this.userId}/delete`, {
            method: 'DELETE',
            body: JSON.stringify({
                bankType: bankType.toUpperCase(),
                agreementId: agreementId,
                repaymentAccountId: repaymentAccountId,
                repaymentAmount: repaymentAmount.toString()
            })
        });
    }

    async getQuests() {
        return this.makeRequest(`${this.baseUrl}/quests/${this.userId}/available`);
    }

    async getCurrentQuest() {
        return this.makeRequest(`${this.baseUrl}/quests/${this.userId}/currentQuest`);
    }

    async assignQuest(questId) {
        return this.makeRequest(`${this.baseUrl}/quests/${this.userId}/assign/${questId}`, {
            method: 'POST'
        });
    }

    async assignFirstQuest() {
        return this.makeRequest(`${this.baseUrl}/quests/${this.userId}/assignFirst`, {
            method: 'POST'
        });
    }

    async completeQuest(questId) {
        return this.makeRequest(`${this.baseUrl}/quests/${this.userId}/complete/${questId}`, {
            method: 'POST'
        });
    }

    async updateQuestProgress(questType, progressIncrement) {
        return this.makeRequest(`${this.baseUrl}/quests/${this.userId}/updateProgress?questType=${questType}&progressIncrement=${progressIncrement}`, {
            method: 'POST'
        });
    }

    async getQuestDashboard() {
        return this.makeRequest(`${this.baseUrl}/quests/${this.userId}/dashboard`);
    }

    async getUserProfile() {
        return this.makeRequest(`${this.baseUrl}/quests/${this.userId}/profile`);
    }

    async getUserRewards() {
        return this.makeRequest(`${this.baseUrl}/quests/${this.userId}/rewards`);
    }

    async getCards(bankType = null) {
        const params = bankType ? `?bankType=${bankType}` : '';
        return this.makeRequest(`${this.baseUrl}/cards/${this.userId}${params}`);
    }

    async getCardDetails(cardId) {
        return this.makeRequest(`${this.baseUrl}/cards/${this.userId}/${cardId}`);
    }

    async createCard(bankType, accountNumber, cardType = 'debit', cardName = 'Карта') {
        return this.makeRequest(`${this.baseUrl}/cards/${this.userId}/create`, {
            method: 'POST',
            body: JSON.stringify({
                bankType: bankType.toUpperCase(),
                accountNumber: accountNumber,
                cardType: cardType,
                cardName: cardName
            })
        });
    }

    async deleteCard(cardId) {
        return this.makeRequest(`${this.baseUrl}/cards/${this.userId}/${cardId}`, {
            method: 'DELETE'
        });
    }
}

const apiService = new ApiService();

const EventManager = {
    handlers: new Map(),
    addHandler(element, eventType, handler) {
        if (!this.handlers.has(element)) {
            this.handlers.set(element, {
                boundEvents: new Set(),
                blockingHandler: (e) => {
                    if (e.target === element || !element.contains(e.target)) {
                        if (!this.handlers.get(element).boundEvents.has(e.type)) {
                            e.stopPropagation();
                        }
                    }
                }
            });
            const allEvents = ['mousedown', 'mouseup', 'click', 'dblclick', 'mouseover', 'mouseout', 'mouseenter', 'mouseleave'];
            allEvents.forEach(type => {
                element.addEventListener(type, this.handlers.get(element).blockingHandler, true);
            });
        }
        this.handlers.get(element).boundEvents.add(eventType);
        element.addEventListener(eventType, handler);
    }
};

function handle_18_1208_33_2997(event) {
    event.stopPropagation();
    event.preventDefault();
    setTimeout(() => {
    }, 744.2555541992188);
}

function handle_18_1209_33_2997(event) {
    event.stopPropagation();
    event.preventDefault();
    setTimeout(() => {
    }, 744.2555541992188);
}

function handle_18_1253_33_2997(event) {
    event.stopPropagation();
    event.preventDefault();
    setTimeout(() => {
    }, 744.2555541992188);
}

function handle_11_932_33_2997(event) {
    event.stopPropagation();
    event.preventDefault();
    setTimeout(() => {
    }, 744.2555541992188);
}

function handle_13_374_33_2997(event) {
    event.stopPropagation();
    event.preventDefault();
    setTimeout(() => {
    }, 744.2555541992188);
}

function initializeEvents() {
    const element_18_1208 = document.getElementById('18_1208');
    if (element_18_1208) {
        EventManager.addHandler(element_18_1208, 'mouseover', handle_18_1208_33_2997);
    }

    const element_18_1209 = document.getElementById('18_1209');
    if (element_18_1209) {
        EventManager.addHandler(element_18_1209, 'mouseover', handle_18_1209_33_2997);
    }

    const element_18_1253 = document.getElementById('18_1253');
    if (element_18_1253) {
        EventManager.addHandler(element_18_1253, 'mouseover', handle_18_1253_33_2997);
    }

    const element_11_932 = document.getElementById('11_932');
    if (element_11_932) {
        EventManager.addHandler(element_11_932, 'mouseover', handle_11_932_33_2997);
    }

    const element_13_374 = document.getElementById('13_374');
    if (element_13_374) {
        EventManager.addHandler(element_13_374, 'mouseover', handle_13_374_33_2997);
    }
}

let accounts = [];
let products = [];
let operationsHistory = [];
let questData = {
    activePoints: 0,
    currentFreeQuestIndex: 0,
    isPremium: false,
    freeQuests: [],
    premiumQuests: []
};
let infoData = {
    totalBalance: 0,
    activeAccounts: 0,
    transfersThisMonth: 0,
    currentQuest: null
};
let cards = [];
let cardsCatalog = [];
async function loadAllData() {
    try {
        await Promise.all([
            loadAccounts(),
            loadProducts(),
            loadTransactions(),
            loadQuests(),
            loadUserProfile(),
        ]);

        updateUI();
        console.log('Все данные успешно загружены из API');
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        showError('Не удалось загрузить данные. Проверьте подключение к серверу.');
    }
}

async function loadAccounts() {
    try {
        const data = await apiService.getAggregatedData();
        if (data.success && data.accounts) {
            accounts = data.accounts.map(account => ({
                id: account.accountId,
                bank: account.bank,
                accountType: account.accountSubType.toLowerCase(),
                balance: parseFloat(account.availableBalance) || 0,
                accountNumber: account.accountNumber,
                formattedAccountNumber: formatAccountNumber(account.accountNumber),
                apiAccountId: account.accountId,
                currency: account.currency || 'RUB'
            }));

            infoData.totalBalance = parseFloat(data.totalBalance) || 0;
            infoData.activeAccounts = data.activeAccounts || 0;

            updateAccountDisplay();
            updateInfoBlock();
        }
    } catch (error) {
        console.error('Ошибка загрузки счетов:', error);
        throw error;
    }
}

async function loadProducts() {
    try {
        const productsData = await apiService.getUserProducts();

        let allProducts = [];

        if (productsData && productsData.success && productsData.products) {
            const regularProducts = productsData.products.map(product => ({
                id: product.productId || product.agreementId,
                type: product.productType,
                typeDisplay: product.productTypeDisplay,
                name: product.productName,
                amount: parseFloat(product.minAmount) || 0,
                amountRange: product.formattedAmountRange,
                rate: product.formattedInterestRate || '0%',
                status: product.status,
                bank: product.bankType,
                agreementId: product.agreementId,
                term: product.formattedTerm,
                creditDebit: product.creditDebitIndicator,
                isCard: product.productType === 'CARD'
            }));
            allProducts = [...regularProducts];
        }

        console.log('Продукты из основного API:', allProducts.length);

        const hasCards = allProducts.some(p => p.isCard);
        if (!hasCards) {
            try {
                const cardsData = await apiService.getCards();
                console.log('Данные карт:', cardsData);

                if (cardsData.success && cardsData.cards) {
                    const cardProducts = cardsData.cards.map(card => ({
                        id: card.cardId,
                        type: 'CARD',
                        typeDisplay: 'Карта',
                        name: card.cardName,
                        amount: 0,
                        amountRange: '0 ₽',
                        rate: '-',
                        status: card.status === 'active' ? 'ACTIVE' : 'INACTIVE',
                        bank: card.bankType,
                        agreementId: card.cardId,
                        term: `до ${new Date(card.expiryDate).toLocaleDateString('ru-RU')}`,
                        creditDebit: card.cardType === 'credit' ? 'CREDIT' : 'DEBIT',
                        cardNumber: card.cardNumber,
                        formattedCardNumber: card.formattedCardNumber,
                        accountNumber: card.accountNumber,
                        expiryDate: card.expiryDate,
                        cardType: card.cardType,
                        cardTypeDisplay: card.cardTypeDisplay,
                        isCard: true
                    }));
                    allProducts = [...allProducts, ...cardProducts];
                }
            } catch (cardsError) {
                console.warn('Карты не загружены:', cardsError);
            }
        }

        products = allProducts;
        console.log('Всего продуктов после загрузки:', products.length);
        updateProductsDisplay();

    } catch (error) {
        console.error('Ошибка загрузки продуктов:', error);
        products = [];
        updateProductsDisplay();
    }
}

async function loadTransactions() {
    try {
        const data = await apiService.getTransactions();
        console.log('Полные данные транзакций:', data);

        if (data && data.transactions) {
            operationsHistory = data.transactions.map(transaction => {
                console.log('Обрабатываемая транзакция:', transaction);

                const account = accounts.find(acc => acc.apiAccountId === transaction.accountId);

                return {
                    id: transaction.transactionId,
                    date: new Date(transaction.bookingDateTime),
                    type: 'transaction',
                    description: transaction.transactionInformation || 'Транзакция',
                    accountId: transaction.accountId, // ID счета из API
                    accountNumber: account ? account.accountNumber : null, // Номер счета для фильтрации
                    amount: parseFloat(transaction.amount?.amount) || 0,
                    bank: transaction.bankType,
                    currency: transaction.amount?.currency || 'RUB',
                    creditDebit: transaction.creditDebitIndicator,
                    accountInfo: account ? {
                        bank: account.bank,
                        formattedAccountNumber: account.formattedAccountNumber
                    } : null
                };
            });

            console.log('Преобразованные операции:', operationsHistory);
            updateHistoryDisplay();
        }
    } catch (error) {
        console.error('Ошибка загрузки транзакций:', error);
        throw error;
    }
}
async function loadQuests() {
    try {
        console.log('🔄 Загрузка данных квестов...');

        const [currentQuestData, userProfile, availableQuests] = await Promise.all([
            apiService.getCurrentQuest(),
            apiService.getUserProfile(),
            apiService.getQuests()
        ]);

        infoData.currentQuest = null;

        if (currentQuestData && currentQuestData.success !== false) {
            if (currentQuestData.quest) {
                infoData.currentQuest = currentQuestData.quest;
                console.log('✅ Активный квест найден:', infoData.currentQuest);
            } else if (currentQuestData.message && currentQuestData.message.includes('нет активных')) {
                console.log('ℹ️ У пользователя нет активных квестов');
                // Проверяем есть ли доступные квесты
                if (availableQuests && availableQuests.length > 0) {
                    console.log('🎯 Есть доступные квесты, но не назначены');
                    showQuestsAvailableButNotAssigned();
                } else {
                    console.log('❌ Нет доступных квестов');
                    showNoQuestsAvailable();
                }
            } else {
                console.log('ℹ️ Нет данных о текущем квесте');
                showNoQuestsAvailable();
            }
        } else {
            console.log('❌ Ошибка в ответе currentQuest:', currentQuestData);
            showNoQuestsAvailable();
        }

        if (userProfile) {
            questData.activePoints = userProfile.activityPoints || 0;
            questData.isPremium = userProfile.subscriptionTier === "PREMIUM";
            questData.questsCompleted = userProfile.questsCompleted || 0;
            updateActivePointsDisplay();
        }

        updateQuestDisplay();
        console.log('✅ Данные квестов загружены');

    } catch (error) {
        console.error('❌ Ошибка загрузки квестов:', error);
        infoData.currentQuest = null;
        showNoQuestsAvailable();
    }
}

async function loadUserProfile() {
    try {
        const profileData = await apiService.getUserProfile();
        if (profileData) {
            questData.activePoints = profileData.activityPoints || 0;
            questData.isPremium = profileData.subscriptionTier === "PREMIUM";
            questData.questsCompleted = profileData.questsCompleted || 0;
            updateActivePointsDisplay();
        }
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        throw error;
    }
}

let productsCatalog = [];

async function loadProductsCatalog() {
    try {
        const data = await apiService.getProductsCatalog();
        if (data.success && data.products) {
            productsCatalog = data.products.map(product => ({
                id: product.productId,
                type: product.productType,
                typeDisplay: product.productTypeDisplay,
                name: product.productName,
                minAmount: parseFloat(product.minAmount) || 0,
                maxAmount: parseFloat(product.maxAmount) || 0,
                amountRange: product.formattedAmountRange,
                rate: product.formattedInterestRate || '0%',
                bank: product.bankType,
                term: product.formattedTerm,
                description: product.description || ''
            }));
            console.log('Каталог продуктов загружен:', productsCatalog);
        }
    } catch (error) {
        console.error('Ошибка загрузки каталога продуктов:', error);
    }
}

function updateUI() {
    updateInfoBlock();
    updateAccountsDataList();
    updateAccountFilter();
}

function updateInfoBlock() {
    const totalBalanceElement = document.getElementById('totalBalance');
    if (totalBalanceElement) {
        totalBalanceElement.textContent = infoData.totalBalance.toLocaleString() + ' ₽';
    }

    const countAccountElement = document.getElementById('countAccount');
    if (countAccountElement) {
        countAccountElement.textContent = infoData.activeAccounts.toString();
    }

    const currentQuestElement = document.getElementById('currentQuest');
    if (currentQuestElement && infoData.currentQuest) {
        currentQuestElement.innerHTML = infoData.currentQuest.description.replace('\n', '<br>');
    }

    const questPrizeElement = document.getElementById('questPrize');
    if (questPrizeElement && infoData.currentQuest) {
        questPrizeElement.textContent = infoData.currentQuest.prize;
    }

    const transfersCountElement = document.getElementById('transfersCount');
    if (transfersCountElement) {
        transfersCountElement.textContent = infoData.transfersThisMonth.toString();
    }
}

function updateAccountDisplay() {
    const accountsGrid = document.querySelector('#accountsGrid');
    if (!accountsGrid) return;

    accountsGrid.innerHTML = '';

    accounts.forEach(account => {
        const accountCard = createAccountCard(account);
        accountsGrid.appendChild(accountCard);
    });
}

function createAccountCard(account) {
    const newCard = document.createElement('div');
    newCard.id = account.id;
    newCard.className = 'card';
    newCard.innerHTML = `
        <div class="card-header">
            <span class="text-bank text-heading-8_635">${account.bank}</span>
            <button class="close-account-btn" data-account="${account.id}">Закрыть</button>
        </div>
        <span class="text-main">${account.balance.toLocaleString('ru-RU')} ₽</span>
        <span class="text-9_282 text-subheading-5_251">номер: ${account.formattedAccountNumber}</span>
    `;

    const closeBtn = newCard.querySelector('.close-account-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleCloseAccount(account.id);
        });
    }

    account.element = newCard;

    return newCard;
}

function updateProductsDisplay() {
    const productsGrid = document.querySelector('#productsGrid');
    const noProductsText = document.getElementById('12_414');

    if (!productsGrid) {
        console.error('productsGrid not found');
        return;
    }

    productsGrid.innerHTML = '';

    const activeProducts = products.filter(product => {
        const status = product.status?.toLowerCase();
        return status !== 'closed' && status !== 'close' && status !== 'closing';
    });

    console.log('Отображаем продукты:', activeProducts.length);

    if (activeProducts.length === 0) {
        if (noProductsText) {
            noProductsText.style.display = 'block';
            productsGrid.appendChild(noProductsText);
        } else {
            const noProductsMessage = document.createElement('div');
            noProductsMessage.className = 'no-products-message';
            noProductsMessage.textContent = 'Продукты не найдены';
            productsGrid.appendChild(noProductsMessage);
        }
        return;
    }

    if (noProductsText) {
        noProductsText.style.display = 'none';
    }

    activeProducts.forEach(product => {
        const productCard = createProductCard(product);
        if (productCard) {
            productsGrid.appendChild(productCard);
        }
    });
}


function createProductCard(product) {
    if (!product) {
        console.error('Invalid product data');
        return null;
    }

    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.dataset.productId = product.id;

    const isCard = product.isCard;
    const closeButtonText = isCard ? 'Удалить' : 'Закрыть';

    let productHTML = `
        <div class="product-header">
            <div class="product-name">${product.name || 'Без названия'}</div>
            <button class="close-product-btn">${closeButtonText}</button>
        </div>
    `;

    if (isCard) {
        productHTML += `
            <div class="product-card-number">${product.formattedCardNumber || product.cardNumber || 'Номер не указан'}</div>
            <div class="product-details">Тип: ${product.cardTypeDisplay || product.cardType || 'Карта'}</div>
        `;
    } else {
        productHTML += `
            <div class="product-amount">${(product.amount || 0).toLocaleString()} ₽</div>
            <div class="product-details">Ставка: ${product.rate || '0%'}</div>
        `;
    }

    productHTML += `
        <div class="product-details">Статус: ${getProductStatusDisplay(product.status)}</div>
        <div class="product-details">Банк: ${product.bank || 'Не указан'}</div>
    `;

    if (product.term) {
        productHTML += `<div class="product-details">Срок: ${product.term}</div>`;
    }

    productCard.innerHTML = productHTML;

    const closeBtn = productCard.querySelector('.close-product-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleCloseProduct(product.id);
        });
    }

    return productCard;
}

function getProductStatusDisplay(status) {
    const statusMap = {
        'ACTIVE': 'Активный',
        'INACTIVE': 'Неактивный',
        'PENDING': 'В обработке',
        'CLOSED': 'Закрыт',
        'active': 'Активный',
        'inactive': 'Неактивный'
    };
    return statusMap[status] || status || 'Неизвестно';
}

function updateHistoryDisplay() {
    displayHistory();
}

function updateQuestDisplay() {
    const currentQuest = infoData.currentQuest;

    if (!currentQuest) {
        showNoQuestsAvailable();
        return;
    }

    const questDescription = document.getElementById('40_209');
    if (questDescription) {
        questDescription.textContent = currentQuest.description || currentQuest.title || 'Описание квеста';
    }

    updateQuestProgressBar(currentQuest);

    const prizeText = document.getElementById('questPrizeText');
    if (prizeText) {
        prizeText.textContent = `Приз: ${getPrizeDisplayName(currentQuest)}`;
    }

    const completeBtn = document.getElementById('completeQuestBtn');
    if (completeBtn) {
        completeBtn.style.display = 'block';
        completeBtn.onclick = () => { handleCompleteQuest(currentQuest.id), refreshQuests() };
    }
}

function showNoQuestsAvailable() {
    const questDescription = document.getElementById('40_209');
    const progressText = document.getElementById('40_178');
    const prizeText = document.getElementById('questPrizeText');
    const completeBtn = document.getElementById('completeQuestBtn');
    const progressBar = document.querySelector('.rectangle-40_177.quest-progress-bar');

    if (questDescription) {
        questDescription.textContent = "Квесты временно недоступны";
    }

    if (progressText) {
        progressText.textContent = "0/0";
    }

    if (prizeText) {
        prizeText.textContent = "Попробуйте обновить страницу";
    }

    if (completeBtn) {
        completeBtn.style.display = 'none';
    }

    if (progressBar) {
        progressBar.style.width = '0%';
    }
}

function updateActivePointsDisplay() {
    const pointsBar = document.getElementById('activePointsBar');
    if (pointsBar) {
        const pointsText = pointsBar.querySelector('.points-text');
        const progressFill = pointsBar.querySelector('.points-progress-fill');
        const levelText = pointsBar.querySelector('.points-level');

        if (pointsText) {
            pointsText.textContent = `Очки активности: ${questData.activePoints}`;
        }

        if (progressFill) {
            const progressPercent = Math.min(questData.activePoints, 100);
            progressFill.style.width = `${progressPercent}%`;

            if (questData.activePoints >= 100) {
                progressFill.style.background = 'linear-gradient(90deg, #FFD700, #FFA500)';
            } else if (questData.activePoints >= 50) {
                progressFill.style.background = 'linear-gradient(90deg, #C0C0C0, #A0A0A0)';
            } else {
                progressFill.style.background = 'linear-gradient(90deg, #CD7F32, #A0522D)';
            }
        }

        if (levelText) {
            const levelInfo = getLevelInfo(questData.activePoints);
            levelText.textContent = `Уровень: ${levelInfo.level}`;
            levelText.className = `points-level ${levelInfo.level.toLowerCase()}`;
        }
    }
}

function formatAccountNumber(accountNumber) {
    return accountNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function getAccountById(accountId) {
    return accounts.find(account => account.id === accountId);
}

function getAccountByAccountNumber(accountNumber) {
    return accounts.find(account => account.accountNumber === accountNumber);
}

function updateAccountsDataList() {
    const myAccountsDatalist = document.getElementById('myAccounts');
    const allAccountsDatalist = document.getElementById('allAccounts');

    if (myAccountsDatalist && allAccountsDatalist) {
        myAccountsDatalist.innerHTML = '';
        allAccountsDatalist.innerHTML = '';

        accounts.forEach(account => {
            const optionText = `${account.bank} (${account.formattedAccountNumber})`;

            const option1 = document.createElement('option');
            option1.value = account.accountNumber;
            option1.textContent = optionText;

            const option2 = document.createElement('option');
            option2.value = account.accountNumber;
            option2.textContent = optionText;

            myAccountsDatalist.appendChild(option1);
            allAccountsDatalist.appendChild(option2);
        });
    }
}

function updateAccountFilter() {
    const accountFilter = document.getElementById('accountFilter');
    if (!accountFilter) return;

    const currentValue = accountFilter.value;

    accountFilter.innerHTML = '<option value="all">Все счета</option>';

    accounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.accountNumber;
        option.textContent = `${account.bank} (${account.formattedAccountNumber})`;
        accountFilter.appendChild(option);
    });

    if (currentValue && Array.from(accountFilter.options).some(opt => opt.value === currentValue)) {
        accountFilter.value = currentValue;
    }
}

async function createAccount(bankName) {
    try {
        const result = await apiService.createAccount(bankName, 'checking', 0);

        if (result.success) {
            await loadAccounts();
            showSuccess('Счет успешно создан!');
            updateAccountsDataList();
            updateAccountFilter();

            addToHistory({
                type: 'account',
                description: 'Открытие счета',
                account: result.account.accountNumber,
                amount: 0,
                bank: bankName
            });
        } else {
            throw new Error(result.message || 'Ошибка при создании счета');
        }
    } catch (error) {
        console.error('Ошибка создания счета:', error);
        showError('Не удалось создать счет. Попробуйте еще раз.');
    }
}

let closeAccountModal, confirmCloseAccountBtn, transferToAccountSelect;
let currentClosingAccount = null;

async function closeAccount(accountId) {
    const accountToDelete = getAccountById(accountId);
    if (!accountToDelete) {
        return;
    }

    const targetAccount = getAccountById(transferToAccountSelect.value);

    try {
        const result = await apiService.closeAccount(
            accountToDelete.bank,
            accountToDelete.apiAccountId,
            'transfer',
            targetAccount.apiAccountId
        );

        if (result.success) {
            await loadAccounts();
            showSuccess('Счет успешно закрыт!');
        } else {
            throw new Error(result.message || 'Ошибка при закрытии счета');
        }
    } catch (error) {
        console.error('Ошибка закрытия счета:', error);
        showError('Не удалось закрыть счет. Попробуйте еще раз.');
    }
}

function handleCloseAccount(accountId) {
    const account = getAccountById(accountId);
    if (!account) return;

    currentClosingAccount = account;

    document.getElementById('closeAccountBank').textContent = account.bank;
    document.getElementById('closeAccountBalance').textContent = account.balance.toLocaleString() + ' ₽';
    document.getElementById('closeAccountNumber').textContent = account.formattedAccountNumber;

    populateTransferAccounts(accountId);

    closeAccountModal.style.display = 'flex';
}

function populateTransferAccounts(excludeAccountId) {
    if (!transferToAccountSelect) return;

    transferToAccountSelect.innerHTML = '<option value="">Выберите счет для перевода</option>';

    accounts.forEach(account => {
        if (account.id !== excludeAccountId) {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = `${account.bank} (${account.formattedAccountNumber}) - ${account.balance.toLocaleString()} ₽`;
            transferToAccountSelect.appendChild(option);
        }
    });

    if (accounts.length <= 1) {
        confirmCloseAccountBtn.disabled = true;
        confirmCloseAccountBtn.textContent = 'Нет счетов для перевода';
    } else {
        confirmCloseAccountBtn.disabled = false;
        confirmCloseAccountBtn.textContent = 'Перевести и закрыть';
    }
}

function incrementTransfersCount() {
    infoData.transfersThisMonth++;
    updateInfoBlock();
}

async function processTransfer(fromAccount, toAccount, amount) {
    try {
        const fromAccountData = getAccountByAccountNumber(fromAccount);
        const toAccountData = getAccountByAccountNumber(toAccount);

        if (!fromAccountData || !toAccountData) {
            throw new Error('Счет не найден');
        }

        console.log('Processing transfer:', {
            fromAccount,
            toAccount,
            amount,
            fromBank: fromAccountData.bank,
            toBank: toAccountData.bank
        });

        const result = await apiService.createPayment(
            fromAccount,
            toAccount,
            amount,
            fromAccountData.bank,
            toAccountData.bank
        );

        if (result.success) {
            await Promise.all([loadAccounts(), loadTransactions()]);
            showSuccess('Перевод выполнен успешно!');

            if (transferModal) {
                transferModal.style.display = 'none';
            }

            resetTransferForm();

            incrementTransfersCount();

            return true;
        } else {
            throw new Error(result.message || 'Ошибка при переводе');
        }
    } catch (error) {
        console.error('Ошибка перевода:', error);
        showError('Не удалось выполнить перевод. Попробуйте еще раз.');
        return false;
    }
}
function updateAccountBalance(accountId, newBalance) {
    const account = getAccountById(accountId);
    if (account) {
        account.balance = newBalance;
        const balanceElement = account.element.querySelector('.text-main');
        if (balanceElement) {
            balanceElement.textContent = newBalance.toLocaleString() + ' ₽';
        }
        updateInfoBlock();
    }
}

function initializeCloseAccount() {
    closeAccountModal = document.getElementById('closeAccountModal');
    confirmCloseAccountBtn = document.getElementById('confirmCloseAccount');
    transferToAccountSelect = document.getElementById('transferToAccount');

    setupCloseAccountEventListeners();
}

function setupCloseAccountEventListeners() {
    const closeModalBtn = closeAccountModal.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            closeAccountModal.style.display = 'none';
        });
    }

    if (confirmCloseAccountBtn) {
        confirmCloseAccountBtn.addEventListener('click', handleConfirmCloseAccount);
    }

    window.addEventListener('click', (event) => {
        if (event.target === closeAccountModal) {
            closeAccountModal.style.display = 'none';
        }
    });
}

async function handleConfirmCloseAccount() {
    if (!currentClosingAccount) return;

    const selectedAccountId = transferToAccountSelect.value;

    if (!selectedAccountId) {
        alert('Пожалуйста, выберите счет для перевода средств');
        return;
    }

    const targetAccount = getAccountById(selectedAccountId);
    if (!targetAccount) return;

    try {
        await closeAccount(currentClosingAccount.id);
        closeAccountModal.style.display = 'none';
        alert(`Счет успешно закрыт! Средства переведены на счет ${targetAccount.formattedAccountNumber}`);
    } catch (error) {
        console.error('Ошибка при закрытии счета:', error);
        alert('Не удалось закрыть счет. Попробуйте еще раз.');
    }
}

function setupExistingAccountCloseButtons() {
    accounts.forEach(account => {
        const closeBtn = account.element.querySelector('.close-account-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                handleCloseAccount(account.id);
            });
        }
    });
}

let fromAccountInput, toAccountInput, transferAmountInput, transferBtn;
let transferModal, confirmTransferBtn, cancelTransferBtn;

function initializeTransferElements() {
    fromAccountInput = document.getElementById('fromAccount');
    toAccountInput = document.getElementById('toAccount');
    transferAmountInput = document.getElementById('transferAmount');
    transferBtn = document.getElementById('transferBtn');
    transferModal = document.getElementById('transferModal');
    confirmTransferBtn = document.getElementById('confirmTransferBtn');
    cancelTransferBtn = document.getElementById('cancelTransferBtn');
}
function validateTransferForm() {
    if (!fromAccountInput || !toAccountInput || !transferAmountInput || !transferBtn) {
        return;
    }

    const fromAccount = fromAccountInput.value.trim();
    const toAccount = toAccountInput.value.trim();
    const amount = parseFloat(transferAmountInput.value) || 0;

    const fromAccountData = accounts.find(acc => acc.accountNumber === fromAccount);
    const availableBalance = fromAccountData ? fromAccountData.balance : 0;

    const availableBalanceElement = document.getElementById('availableBalance');
    if (availableBalanceElement) {
        availableBalanceElement.textContent = availableBalance.toLocaleString();
    }

    const isFromAccountValid = fromAccountData !== undefined;
    const isToAccountValid = toAccount.length > 0;
    const isAmountValid = amount > 0 && amount <= availableBalance;
    const isSameAccount = fromAccount === toAccount;

    const fromAccountError = document.getElementById('fromAccountError');
    const toAccountError = document.getElementById('toAccountError');
    const amountError = document.getElementById('amountError');

    if (fromAccountError) {
        fromAccountError.textContent =
            !isFromAccountValid ? 'Счет не найден' :
                isSameAccount ? 'Нельзя переводить на тот же счет' : '';
    }

    if (toAccountError) {
        toAccountError.textContent = !isToAccountValid ? 'Введите номер счета' : '';
    }

    if (amountError) {
        amountError.textContent =
            amount === 0 ? 'Введите сумму' :
                amount > availableBalance ? 'Недостаточно средств' : '';
    }

    transferBtn.disabled = !(isFromAccountValid && isToAccountValid && isAmountValid && !isSameAccount);
}

function setupTransferEventListeners() {
    if (fromAccountInput) {
        fromAccountInput.addEventListener('input', validateTransferForm);
    }
    if (toAccountInput) {
        toAccountInput.addEventListener('input', validateTransferForm);
    }
    if (transferAmountInput) {
        transferAmountInput.addEventListener('input', validateTransferForm);
    }
}

function setupTransferButtonHandler() {
    if (!transferBtn) return;

    transferBtn.addEventListener('click', () => {
        const fromAccount = fromAccountInput.value.trim();
        const toAccount = toAccountInput.value.trim();
        const amount = parseInt(transferAmountInput.value);

        const confirmFromAccount = document.getElementById('confirmFromAccount');
        const confirmToAccount = document.getElementById('confirmToAccount');
        const confirmAmount = document.getElementById('confirmAmount');

        if (confirmFromAccount) {
            confirmFromAccount.textContent = fromAccount;
        }
        if (confirmToAccount) {
            confirmToAccount.textContent = toAccount;
        }
        if (confirmAmount) {
            confirmAmount.textContent = `${amount.toLocaleString()} ₽`;
        }

        if (transferModal) {
            transferModal.style.display = 'block';
        }
    });
}

function setupConfirmTransferHandler() {
    if (!confirmTransferBtn) return;

    const newConfirmBtn = confirmTransferBtn.cloneNode(true);
    confirmTransferBtn.parentNode.replaceChild(newConfirmBtn, confirmTransferBtn);
    confirmTransferBtn = newConfirmBtn;

    confirmTransferBtn.addEventListener('click', async function confirmTransferHandler() {
        const fromAccount = fromAccountInput ? fromAccountInput.value.trim() : '';
        const toAccount = toAccountInput ? toAccountInput.value.trim() : '';
        const amount = transferAmountInput ? parseFloat(transferAmountInput.value) : 0;

        if (!fromAccount || !toAccount || amount <= 0) {
            alert('Ошибка: некорректные данные перевода');
            return;
        }

        const fromAccountData = accounts.find(acc => acc.accountNumber === fromAccount);
        const toAccountData = accounts.find(acc => acc.accountNumber === toAccount);

        if (!fromAccountData) {
            alert('Счет отправителя не найден');
            return;
        }

        if (!toAccountData) {
            alert('Счет получателя не найден');
            return;
        }

        if (fromAccountData.balance < amount) {
            alert('Недостаточно средств на счете отправителя');
            return;
        }

        await processTransfer(fromAccount, toAccount, amount);
    });
}

function closeTransferModal() {
    if (transferModal) {
        transferModal.style.display = 'none';
        return true;
    }
    return false;
}

function setupCancelTransferHandler() {
    if (!cancelTransferBtn) return;

    const newCancelBtn = cancelTransferBtn.cloneNode(true);
    cancelTransferBtn.parentNode.replaceChild(newCancelBtn, cancelTransferBtn);
    cancelTransferBtn = newCancelBtn;

    cancelTransferBtn.addEventListener('click', function() {
        closeTransferModal();
    });
}

function setupTransferModalCloseHandler() {
    window.removeEventListener('click', transferModalClickHandler);

    function transferModalClickHandler(event) {
        if (event.target === transferModal) {
            closeTransferModal();
        }
    }

    window.addEventListener('click', transferModalClickHandler);
}

function resetTransferForm() {
    if (fromAccountInput) fromAccountInput.value = '';
    if (toAccountInput) toAccountInput.value = '';
    if (transferAmountInput) transferAmountInput.value = '';
    if (transferBtn) transferBtn.disabled = true;

    const fromAccountError = document.getElementById('fromAccountError');
    const toAccountError = document.getElementById('toAccountError');
    const amountError = document.getElementById('amountError');
    const availableBalanceElement = document.getElementById('availableBalance');

    if (fromAccountError) fromAccountError.textContent = '';
    if (toAccountError) toAccountError.textContent = '';
    if (amountError) amountError.textContent = '';
    if (availableBalanceElement) availableBalanceElement.textContent = '0';
}

function initializeTransfers() {
    initializeTransferElements();
    setupTransferEventListeners();
    setupTransferButtonHandler();
    setupConfirmTransferHandler();
    setupCancelTransferHandler();
    setupTransferModalCloseHandler();
}

let productTypeSelect, productAmountInput, createProductBtn;
let productsGrid, noProductsText, minAmountSpan;
let productModal, productForm, openProductBtn, closeModal;
let accountSelection, sourceAccountSelect, accountBalanceText;

const minAmounts = {
    creditCard: 50000,
    deposit: 10000,
    debitCard: 10000
};

function validateProductForm() {
    if (!productTypeSelect || !productAmountInput || !createProductBtn || !sourceAccountSelect) {
        return;
    }

    const selectedProductId = productTypeSelect.value;
    const amount = parseFloat(productAmountInput.value) || 0;
    const sourceAccountNumber = sourceAccountSelect.value;

    console.log('Валидация формы:', {
        selectedProductId,
        amount,
        sourceAccountNumber
    });

    const selectedProduct = productsCatalog.find(p => p.id === selectedProductId);

    let isValid = false;
    let minAmount = 0;

    if (selectedProduct) {
        minAmount = selectedProduct.minAmount;

        const sourceAccount = getAccountByAccountNumber(sourceAccountNumber);
        if (!sourceAccount) {
            isValid = false;
        } else if (sourceAccount.balance < amount) {
            isValid = false;
        } else {
            isValid = amount >= minAmount;
        }
    }

    if (!sourceAccountNumber) {
        isValid = false;
    }

    if (minAmountSpan) {
        minAmountSpan.textContent = minAmount.toLocaleString();
    }

    if (productAmountInput) {
        productAmountInput.min = minAmount;
        productAmountInput.placeholder = `Минимум ${minAmount.toLocaleString()} руб`;
    }

    createProductBtn.disabled = !isValid;
    console.log('Форма валидна:', isValid);
}

async function createProduct(productId, amount, accountNumber, accountBank) {
    try {
        const catalogProduct = productsCatalog.find(p => p.id === productId);
        if (!catalogProduct) throw new Error('Продукт не найден');

        if (catalogProduct.type === 'card' || catalogProduct.productType === 'card') {
            console.log('Создание карты через Cards API');

            const result = await apiService.createCard(
                accountBank,
                accountNumber,
                'debit',
                catalogProduct.name
            );

            if (result.success) {
                await loadProducts();
                await loadAccounts();
                showSuccess('Карта успешно выпущена!');
                return true;
            }
        } else {
            const result = await apiService.buyProduct(
                catalogProduct.bank.toUpperCase(),
                productId,
                amount,
                accountNumber
            );

            if (result.success) {
                await loadProducts();
                await loadAccounts();
                showSuccess('Продукт успешно создан!');
                return true;
            }
        }

        throw new Error('Ошибка при создании продукта');
    } catch (error) {
        console.error('Ошибка создания продукта:', error);

        if (error.message.includes('404')) {
            showError("К этому счёту невозможно привязать карту, попробуйте другой");
        } else {
            showError('Не удалось приобрести продукт');
        }
        return false;
    }
}

function initializeProductElements() {
    productTypeSelect = document.getElementById('productType');
    productAmountInput = document.getElementById('amount');
    createProductBtn = document.getElementById('createProductBtn');
    productsGrid = document.getElementById('productsGrid');
    noProductsText = document.getElementById('12_414');
    minAmountSpan = document.getElementById('minAmount');
    productModal = document.getElementById('productModal');
    productForm = document.getElementById('productForm');
    openProductBtn = document.getElementById('openProductBtn');
    accountSelection = document.getElementById('accountSelection');
    sourceAccountSelect = document.getElementById('sourceAccount');
    accountBalanceText = document.getElementById('accountBalance')
    closeModal = document.querySelector('#productModal .close-modal');;
}

function populateSourceAccounts() {
    if (!sourceAccountSelect) return;

    sourceAccountSelect.innerHTML = '<option value="" selected disabled>Выберите счет</option>';

    accounts.forEach(account => {
        const option = document.createElement('option');
        option.value = account.accountNumber;
        option.textContent = `${account.bank} (${account.formattedAccountNumber}) - ${account.balance.toLocaleString()} ₽`;
        option.dataset.accountData = JSON.stringify(account);
        sourceAccountSelect.appendChild(option);
    });

    updateAccountBalanceDisplay();
}

function updateAccountBalanceDisplay() {
    const selectedAccountNumber = sourceAccountSelect.value;
    const selectedAccount = getAccountByAccountNumber(selectedAccountNumber);

    if (accountBalanceText && selectedAccount) {
        accountBalanceText.textContent = `Доступно: ${selectedAccount.balance.toLocaleString()} ₽`;
        accountBalanceText.className = 'form-help';

        const amount = parseInt(productAmountInput.value) || 0;
        if (selectedAccount.balance < amount) {
            accountBalanceText.className = 'form-help error';
            accountBalanceText.textContent = `Недостаточно средств. Доступно: ${selectedAccount.balance.toLocaleString()} ₽`;
        }
    } else {
        accountBalanceText.textContent = 'Доступно: 0 ₽';
    }

    validateProductForm();
}

function setupProductEventListeners() {
    if (openProductBtn) {
        openProductBtn.addEventListener('click', () => {
            if (productModal) {
                productModal.style.display = 'block';
                loadProductsCatalog().then(() => {
                    updateProductModalContent();
                    populateSourceAccounts();
                });
            }
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            if (productModal) {
                productModal.style.display = 'none';
                if (productForm) productForm.reset();
                if (createProductBtn) createProductBtn.disabled = true;
                if (minAmountSpan) minAmountSpan.textContent = '0';
                if (accountSelection) accountSelection.style.display = 'block';
            }
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === productModal) {
            productModal.style.display = 'none';
            if (productForm) productForm.reset();
            if (createProductBtn) createProductBtn.disabled = true;
            if (minAmountSpan) minAmountSpan.textContent = '0';
        }
    });

    if (productTypeSelect) {
        productTypeSelect.addEventListener('change', () => {
            const selectedProductId = productTypeSelect.value;
            const selectedOption = productTypeSelect.options[productTypeSelect.selectedIndex];

            if (selectedOption && selectedOption.dataset.product) {
                const product = JSON.parse(selectedOption.dataset.product);
                console.log('Выбран продукт:', product);

                if (minAmountSpan) {
                    minAmountSpan.textContent = product.minAmount.toLocaleString();
                }

                if (productAmountInput) {
                    productAmountInput.min = product.minAmount;
                    productAmountInput.placeholder = `Минимум ${product.minAmount.toLocaleString()} руб`;
                }

                if (accountSelection) {
                    accountSelection.style.display = 'block';
                    populateSourceAccounts();
                }

                updateProductInfo(product);
            } else {
                updateProductInfo(null);
            }

            validateProductForm();
        });
    }

    if (productAmountInput) {
        productAmountInput.addEventListener('input', validateProductForm);
    }

    if (sourceAccountSelect) {
        sourceAccountSelect.addEventListener('change', () => {
            updateAccountBalanceDisplay();
            validateProductForm();
        });
    }

    if (productForm) {
        productForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            console.log('Форма отправлена - начинаем покупку продукта');

            const selectedProductId = productTypeSelect.value;
            const amount = parseInt(productAmountInput.value);
            const selectedAccountNumber = sourceAccountSelect ? sourceAccountSelect.value : null;

            console.log('Данные для покупки:', {
                selectedProductId,
                amount,
                selectedAccountNumber
            });

            const selectedProduct = productsCatalog.find(p => p.id === selectedProductId);
            if (!selectedProduct) {
                showError('Продукт не найден');
                return;
            }

            if (!selectedAccountNumber) {
                showError('Выберите счет для списания средств');
                return;
            }

            const sourceAccount = getAccountByAccountNumber(selectedAccountNumber);
            if (!sourceAccount) {
                showError('Выбранный счет не найден');
                return;
            }

            console.log('Найден счет для покупки:', {
                accountNumber: sourceAccount.accountNumber,
                bank: sourceAccount.bank,
                balance: sourceAccount.balance
            });

            const success = await createProduct(
                selectedProductId,
                amount,
                sourceAccount.accountNumber,
                sourceAccount.bank
            );

            if (success && productModal) {
                productModal.style.display = 'none';
            }

            if (productForm) {
                productForm.reset();
                createProductBtn.disabled = true;
            }

            if (minAmountSpan) {
                minAmountSpan.textContent = '0';
            }
        });
    }
}

function updateProductInfo(product) {
    const productInfo = document.getElementById('productInfo');
    const productBank = document.getElementById('productBank');
    const productTypeDisplay = document.getElementById('productTypeDisplay');
    const productRate = document.getElementById('productRate');
    const productTerm = document.getElementById('productTerm');

    if (productInfo && productBank && productTypeDisplay && productRate && productTerm) {
        if (product) {
            productBank.textContent = product.bank;
            productTypeDisplay.textContent = getProductTypeDisplay(product.type);
            productRate.textContent = product.rate;
            productTerm.textContent = product.term || 'Не указан';
            productInfo.style.display = 'block';
        } else {
            productInfo.style.display = 'none';
        }
    }
}

function initializeProducts() {
    initializeProductElements();
    setupProductEventListeners();
    loadProductsCatalog().then(() => {
        updateProductModalContent();
        populateSourceAccounts();
    });
}

function getProductTypeDisplay(type) {
    const typeMap = {
        'DEPOSIT': 'Вклад',
        'CREDIT_CARD': 'Кредитная карта',
        'DEBIT_CARD': 'Дебетовая карта',
        'SAVING_ACCOUNT': 'Накопительный счет'
    };
    return typeMap[type] || type;
}

function updateProductModalContent() {
    const productTypeSelect = document.getElementById('productType');
    if (!productTypeSelect) return;

    const currentValue = productTypeSelect.value;

    productTypeSelect.innerHTML = '<option value="" selected disabled>Выберите продукт</option>';

    const productsByBank = {};

    productsCatalog.forEach(product => {
        if (!productsByBank[product.bank]) {
            productsByBank[product.bank] = [];
        }
        productsByBank[product.bank].push(product);
    });

    Object.keys(productsByBank).forEach(bank => {
        const bankOption = document.createElement('option');
        bankOption.disabled = true;
        bankOption.textContent = `── ${bank} ──`;
        productTypeSelect.appendChild(bankOption);

        productsByBank[bank].forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} - ${product.rate} (${product.amountRange})`;
            option.dataset.product = JSON.stringify(product);
            productTypeSelect.appendChild(option);
        });
    });

    if (currentValue && Array.from(productTypeSelect.options).some(opt => opt.value === currentValue)) {
        productTypeSelect.value = currentValue;
        productTypeSelect.dispatchEvent(new Event('change'));
    }
}

let currentDisplayCount = 5;
const operationsPerPage = 5;

function initializeHistory() {
    initializeHistoryFilters();

    const loadMoreText = document.getElementById('13_664');
    if (loadMoreText) {
        loadMoreText.textContent = 'Показано 0 из 0 операций';
    }

    displayHistory();
    setupLoadMoreButton();
}

function initializeHistoryFilters() {
    const accountFilter = document.getElementById('accountFilter');
    const bankFilter = document.getElementById('bankFilter');
    const periodFilter = document.getElementById('periodFilter');

    updateAccountFilter();

    if (accountFilter) {
        accountFilter.addEventListener('change', displayHistory);
    }
    if (bankFilter) {
        bankFilter.addEventListener('change', displayHistory);
    }
    if (periodFilter) {
        periodFilter.addEventListener('change', displayHistory);
    }
}

function displayHistory() {
    const historyContainer = document.getElementById('historyContainer');
    if (!historyContainer) return;

    const accountFilter = document.getElementById('accountFilter')?.value || 'all';
    const bankFilter = document.getElementById('bankFilter')?.value || 'all';
    const periodFilter = document.getElementById('periodFilter')?.value || 'all';

    console.log('Фильтры:', { accountFilter, bankFilter, periodFilter });
    console.log('Все операции:', operationsHistory);

    let filteredOperations = operationsHistory.filter(operation => {
        console.log('Проверка операции:', operation);

        if (accountFilter !== 'all') {
            if (operation.accountNumber !== accountFilter) {
                console.log('Операция отфильтрована по счету:', {
                    operationAccount: operation.accountNumber,
                    filterAccount: accountFilter
                });
                return false;
            }
        }

        if (bankFilter !== 'all') {
            let operationBank = operation.bank;

            if (!operationBank && operation.accountNumber) {
                const account = accounts.find(acc => acc.accountNumber === operation.accountNumber);
                operationBank = account?.bank;
            }

            if (!operationBank || operationBank.toUpperCase() !== bankFilter.toUpperCase()) {
                console.log('Операция отфильтрована по банку:', {
                    operationBank: operationBank,
                    filterBank: bankFilter
                });
                return false;
            }
        }


        if (periodFilter !== 'all') {
            const now = new Date();
            const operationDate = new Date(operation.date);

            switch (periodFilter) {
                case 'today':
                    const isToday = operationDate.toDateString() === now.toDateString();
                    if (!isToday) console.log('Операция отфильтрована по сегодняшнему дню');
                    return isToday;
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    const isThisWeek = operationDate >= weekAgo;
                    if (!isThisWeek) console.log('Операция отфильтрована по неделе');
                    return isThisWeek;
                case 'month':
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    const isThisMonth = operationDate >= monthAgo;
                    if (!isThisMonth) console.log('Операция отфильтрована по месяцу');
                    return isThisMonth;
                case 'year':
                    const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    const isThisYear = operationDate >= yearAgo;
                    if (!isThisYear) console.log('Операция отфильтрована по году');
                    return isThisYear;
                default:
                    return true;
            }
        }

        return true;
    });

    console.log('Отфильтрованные операции:', filteredOperations);
    filteredOperations.sort((a, b) => new Date(b.date) - new Date(a.date));
    renderHistory(filteredOperations);
}

function renderHistory(operations) {
    const historyContainer = document.getElementById('historyContainer');
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    const loadMoreText = document.getElementById('13_664');

    if (!historyContainer) return;

    historyContainer.innerHTML = '';

    if (operations.length === 0) {
        historyContainer.innerHTML = '<div class="no-history">Операций не найдено</div>';
        if (loadMoreBtn) {
            loadMoreBtn.disabled = true;
        }
        if (loadMoreText) {
            loadMoreText.textContent = 'Показано 0 из 0 операций';
        }
        return;
    }

    const operationsToShow = operations.slice(0, currentDisplayCount);

    operationsToShow.forEach(operation => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';

        const operationDate = new Date(operation.date);
        const dateStr = operationDate.toLocaleDateString('ru-RU');
        const timeStr = operationDate.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });

        // Получаем информацию о счете
        let accountDisplay = '';
        let bankDisplay = '';

        if (operation.accountNumber) {
            const account = accounts.find(acc => acc.accountNumber === operation.accountNumber);
            if (account) {
                accountDisplay = account.formattedAccountNumber;
                bankDisplay = account.bank;
            } else {
                accountDisplay = formatAccountNumber(operation.accountNumber);
                bankDisplay = operation.bank || 'Неизвестный банк';
            }
        } else if (operation.accountInfo) {
            accountDisplay = operation.accountInfo.formattedAccountNumber;
            bankDisplay = operation.accountInfo.bank;
        } else {
            accountDisplay = 'Счет не указан';
            bankDisplay = operation.bank || 'Неизвестный банк';
        }

        let amountClass = 'neutral';
        if (operation.amount > 0) amountClass = 'positive';
        else if (operation.amount < 0) amountClass = 'negative';

        historyItem.innerHTML = `
            <div class="history-date">
                <span class="history-date-main">${dateStr}</span>
                <span class="history-date-time">${timeStr}</span>
            </div>
            <div class="history-description">
                <div class="history-description-main">${operation.description}</div>
                <div class="history-bank">${bankDisplay}</div>
            </div>
            <div class="history-account">
                <div class="history-account-number">${accountDisplay}</div>
            </div>
            <span class="history-amount ${amountClass}">
                ${operation.amount > 0 ? '+' : ''}${operation.amount.toLocaleString()} ₽
            </span>
        `;

        historyContainer.appendChild(historyItem);
    });

    const totalOperations = operations.length;
    const shownOperations = Math.min(currentDisplayCount, totalOperations);

    if (loadMoreBtn) {
        loadMoreBtn.disabled = shownOperations >= totalOperations;
    }

    if (loadMoreText) {
        loadMoreText.textContent = `Показано ${shownOperations} из ${totalOperations} операций`;
    }
}

function setupLoadMoreButton() {
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            currentDisplayCount += operationsPerPage;
            displayHistory();
        });
    }
}

function addToHistory(operation) {
    const newOperation = {
        id: operationsHistory.length + 1,
        date: new Date(),
        ...operation
    };

    operationsHistory.unshift(newOperation);
    currentDisplayCount = 5;
    displayHistory();
}

function handleCloseProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        console.error('Продукт не найден:', productId);
        return;
    }

    if (product.isCard || product.type === 'CARD') {
        showCardDeleteModal(product);
    } else {
        showProductCloseModal(product);
    }
}

function showCardDeleteModal(card) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay card-delete-modal';

    modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Удаление карты</h2>
        <span class="close-modal">&times;</span>
      </div>
      <div class="modal-body">
        <p>Вы уверены, что хотите удалить карту?</p>
        <div class="card-info">
          <div class="info-row">
            <span class="info-label">Карта:</span>
            <span class="info-value">${card.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Номер:</span>
            <span class="info-value">${card.formattedCardNumber || card.cardNumber}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Банк:</span>
            <span class="info-value">${card.bank}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Привязанный счет:</span>
            <span class="info-value">${formatAccountNumber(card.accountNumber)}</span>
          </div>
        </div>
        <div class="warning-message">
          <p>⚠️ Удаление карты не затронет привязанный счет. Вы можете выпустить новую карту в любое время.</p>
        </div>
      </div>
      <div class="modal-footer">
        <button id="confirmDeleteCard" class="btn-transfer-close">
          Удалить карту
        </button>
        <button id="cancelDeleteCard" class="btn-cancel">
          Отмена
        </button>
      </div>
    </div>
  `;

    document.body.appendChild(modal);

    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });

    modal.querySelector('#cancelDeleteCard').addEventListener('click', () => {
        modal.remove();
    });

    modal.querySelector('#confirmDeleteCard').addEventListener('click', async () => {
        try {
            await deleteCard(card.id, modal);
        } catch (error) {
            console.error('Ошибка удаления карты:', error);
            showError('Не удалось удалить карту');
        }
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

async function closeProduct(productId, modal, repaymentAccountId, isLoanProduct) {
    try {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        if (product.isCard) {
            await deleteCard(productId, modal);
            return;
        }
        const repaymentAccount = getAccountById(repaymentAccountId);
        if (!repaymentAccount) throw new Error('Счет не найден');

        const result = await apiService.deleteProduct(
            product.bank,
            product.agreementId,
            repaymentAccount.apiAccountId,
            product.amount.toString()
        );

        if (result.success) {
            await loadProducts();
            await loadAccounts();
            modal.remove();
            showSuccess('Продукт успешно закрыт!');
        }
    } catch (error) {
        console.error('Ошибка закрытия продукта:', error);
        showError('Не удалось завершить операцию');
    }
}

async function deleteCard(cardId, modal) {
    try {
        const result = await apiService.deleteCard(cardId);

        if (result.success) {
            await loadProducts();
            if (modal) modal.remove();
            showSuccess('Карта успешно удалена!');
        }
    } catch (error) {
        console.error('Ошибка удаления карты:', error);
        showError('Не удалось удалить карту');
    }
}

function showProductCloseModal(product) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay product-close-modal';

    const availableAccounts = accounts.filter(acc => !acc.productId);

    const isCardProduct = product.type && product.type.toLowerCase().includes('card');
    const isLoanProduct = product.type && product.type.toLowerCase().includes('loan');

    console.log('Информация о продукте для закрытия:', {
        name: product.name,
        type: product.type,
        isCardProduct: isCardProduct,
        isLoanProduct: isLoanProduct
    });

    let accountOptions = '';
    availableAccounts.forEach(account => {
        accountOptions += `
            <option value="${account.id}">
                ${account.bank} (${account.formattedAccountNumber}) - ${account.balance.toLocaleString()} ₽
            </option>
        `;
    });

    let modalTitle, actionDescription, accountLabel, buttonText, showAccountSelection;

    if (isCardProduct) {
        modalTitle = 'Удаление карты';
        actionDescription = 'Карта будет удалена. Привязанный счет останется активным.';
        accountLabel = 'Подтвердите удаление:';
        buttonText = 'Удалить карту';
        showAccountSelection = false;
    } else if (isLoanProduct) {
        modalTitle = 'Погашение кредита';
        actionDescription = 'Для погашения кредита выберите счет, с которого будут списаны средства';
        accountLabel = 'Счет для погашения:';
        buttonText = 'Погасить кредит';
        showAccountSelection = true;
    } else {
        modalTitle = 'Закрытие продукта';
        actionDescription = 'При закрытии средства будут возвращены на выбранный счет';
        accountLabel = 'Счет для возврата средств:';
        buttonText = 'Закрыть продукт';
        showAccountSelection = true;
    }

    modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${modalTitle}</h2>
        <span class="close-modal">&times;</span>
      </div>
      <div class="modal-body">
        <p>${actionDescription}</p>
        <div class="product-info">
          <div class="info-row">
            <span class="info-label">Продукт:</span>
            <span class="info-value">${product.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Тип:</span>
            <span class="info-value">${product.type}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Операция:</span>
            <span class="info-value">${isCardProduct ? 'Удаление карты' : isLoanProduct ? 'Погашение кредита' : 'Возврат средств'}</span>
          </div>
          ${!isCardProduct ? `
          <div class="info-row">
            <span class="info-label">Сумма:</span>
            <span class="info-value">${product.amount.toLocaleString()} ₽</span>
          </div>
          ` : ''}
          <div class="info-row">
            <span class="info-label">Банк:</span>
            <span class="info-value">${product.bank}</span>
          </div>
        </div>
        
        ${showAccountSelection ? `
        <div class="form-group">
          <label>${accountLabel}</label>
          <select id="repaymentAccountSelect" class="form-select">
            <option value="">Выберите счет</option>
            ${accountOptions}
          </select>
          <div id="repaymentAccountBalance" class="form-help">Доступно: 0 ₽</div>
        </div>
        ` : `
        <div class="form-group">
          <p><strong>Внимание:</strong> Карта будет удалена безвозвратно. Счет ${product.accountNumber} останется активным.</p>
        </div>
        `}
        
        <div class="warning-message">
          ${isCardProduct ?
        '<p>⚠️ Удаление карты не затронет привязанный счет. Вы можете выпустить новую карту в любое время.</p>' :
        isLoanProduct ?
            '<p>⚠️ Для погашения кредита необходимо иметь достаточные средства на выбранном счете.</p>' :
            '<p>⚠️ При закрытии этого продукта средства будут возвращены на выбранный счет.</p>'
    }
          <p id="repaymentWarning" style="color: #d32f2f; font-weight: bold; display: none;"></p>
        </div>
      </div>
      <div class="modal-footer">
        <button id="confirmCloseProduct" class="btn-transfer-close" ${showAccountSelection ? 'disabled' : ''}>
          ${buttonText}
        </button>
      </div>
    </div>
  `;

    document.body.appendChild(modal);

    if (showAccountSelection) {
        const repaymentAccountSelect = modal.querySelector('#repaymentAccountSelect');
        const repaymentAccountBalance = modal.querySelector('#repaymentAccountBalance');
        const repaymentWarning = modal.querySelector('#repaymentWarning');
        const confirmCloseBtn = modal.querySelector('#confirmCloseProduct');

        function updateRepaymentAccountInfo() {
            const selectedAccountId = repaymentAccountSelect.value;
            const selectedAccount = getAccountById(selectedAccountId);

            if (selectedAccount) {
                const availableBalance = selectedAccount.balance;
                const requiredAmount = product.amount;

                repaymentAccountBalance.textContent = `Доступно: ${availableBalance.toLocaleString()} ₽`;

                if (isLoanProduct && availableBalance < requiredAmount) {
                    repaymentAccountBalance.className = 'form-help error';
                    repaymentWarning.textContent = `Недостаточно средств! Нужно: ${requiredAmount.toLocaleString()} ₽, доступно: ${availableBalance.toLocaleString()} ₽`;
                    repaymentWarning.style.display = 'block';
                    confirmCloseBtn.disabled = true;
                } else {
                    repaymentAccountBalance.className = 'form-help';
                    repaymentWarning.style.display = 'none';
                    confirmCloseBtn.disabled = false;
                }
            } else {
                repaymentAccountBalance.textContent = 'Доступно: 0 ₽';
                repaymentWarning.style.display = 'none';
                confirmCloseBtn.disabled = true;
            }
        }

        repaymentAccountSelect.addEventListener('change', updateRepaymentAccountInfo);
        updateRepaymentAccountInfo();
    }

    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });

    const confirmCloseBtn = modal.querySelector('#confirmCloseProduct');
    confirmCloseBtn.addEventListener('click', () => {
        if (isCardProduct) {
            deleteCard(product.id, modal);
        } else {
            const repaymentAccountId = modal.querySelector('#repaymentAccountSelect')?.value;
            if (!repaymentAccountId && showAccountSelection) {
                alert('Пожалуйста, выберите счет');
                return;
            }

            closeProduct(product.id, modal, repaymentAccountId, isLoanProduct);
        }
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function initializeQuests() {
    setupQuestEventListeners();
    updateQuestDisplay();
    updateActivePointsDisplay();
}

function setupQuestEventListeners() {
    const completeBtn = document.getElementById('completeQuestBtn');
    if (completeBtn) {
        completeBtn.addEventListener('click', handleCompleteQuest);
    }
}

function calculateProgressPercent(quest) {
    if (typeof quest.target === 'number') {
        return Math.min((quest.currentProgress / quest.target) * 100, 100);
    } else {
        switch (quest.target) {
            case 'new_account':
                return quest.completed ? 100 : 0;
            case 'transfers':
                return Math.min((quest.currentProgress / 3) * 100, 100);
            case 'credit_card':
                return quest.completed ? 100 : 0;
            case 'mobile_bank':
                return Math.min((quest.currentProgress / 7) * 100, 100);
            case 'payments':
                return Math.min((quest.currentProgress / 5) * 100, 100);
            case 'referral':
                return quest.completed ? 100 : 0;
            case 'autopayment':
                return quest.completed ? 100 : 0;
            case 'all_services':
                return Math.min((quest.currentProgress / 5) * 100, 100);
            default:
                return 0;
        }
    }
}

function getProgressText(quest) {
    if (typeof quest.target === 'number') {
        return `${quest.currentProgress}/${quest.target}₽`;
    } else {
        switch (quest.target) {
            case 'new_account':
                return quest.completed ? '1/1' : '0/1';
            case 'transfers':
                return `${quest.currentProgress}/3`;
            case 'credit_card':
                return quest.completed ? '1/1' : '0/1';
            case 'mobile_bank':
                return `${quest.currentProgress}/7`;
            case 'payments':
                return `${quest.currentProgress}/5`;
            case 'referral':
                return quest.completed ? '1/1' : '0/1';
            case 'autopayment':
                return quest.completed ? '1/1' : '0/1';
            case 'all_services':
                return `${quest.currentProgress}/5`;
            default:
                return '0/1';
        }
    }
}

function getLevelInfo(points) {
    if (points >= 100) {
        return {
            level: 'Золотой',
            color: '#FFD700',
            minPoints: 100,
            maxPoints: Infinity
        };
    } else if (points >= 50) {
        return {
            level: 'Серебряный',
            color: '#C0C0C0',
            minPoints: 50,
            maxPoints: 99
        };
    } else {
        return {
            level: 'Бронзовый',
            color: '#CD7F32',
            minPoints: 0,
            maxPoints: 49
        };
    }
}

function updateQuestProgressBar(quest) {
    const progressText = document.getElementById('40_178');
    const progressBar = document.querySelector('.rectangle-40_177.quest-progress-bar');

    if (!progressText || !progressBar) return;

    const progressValue = calculateQuestProgress(quest);
    const progressTextValue = getQuestProgressText(quest);

    progressText.textContent = progressTextValue;
    progressBar.style.width = `${progressValue}%`;
}

function calculateQuestProgress(quest) {
    if (!quest.currentProgress || !quest.targetProgress) return 0;
    return Math.min((quest.currentProgress / quest.targetProgress) * 100, 100);
}

function getQuestProgressText(quest) {
    if (quest.minOperations) {
        return `${quest.currentProgress || 0}/${quest.minOperations}`;
    }
    if (quest.minAmount) {
        return quest.currentProgress >= 1 ? '1/1' : '0/1';
    }
    return `${quest.currentProgress || 0}/1`;
}

const progressNotificationStyles = `
.progress-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 12px;
    padding: 15px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.2);
    z-index: 10000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    border-left: 4px solid #6750a4;
    max-width: 300px;
}

.progress-notification.show {
    transform: translateX(0);
}

.notification-content {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.notification-icon {
    font-size: 20px;
    text-align: center;
}

.notification-text {
    font-weight: 600;
    color: #333;
    text-align: center;
    font-size: 14px;
}

.notification-progress {
    height: 6px;
    background: #f0f0f0;
    border-radius: 3px;
    overflow: hidden;
}

.notification-bar {
    height: 100%;
    background: #6750a4;
    border-radius: 3px;
    transition: width 0.5s ease;
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = progressNotificationStyles;
document.head.appendChild(styleSheet);

function getCurrentQuest() {
    return infoData.currentQuest;
}

function calculateTargetProgress(quest) {
    if (quest.minOperations) {
        return quest.minOperations;
    }
    if (quest.minAmount) {
        return 1;
    }
    return 1;
}

function getPrizeDisplayName(quest) {
    if (quest.rewards && quest.rewards.prizeName) {
        return quest.rewards.prizeName;
    }

    const rewards = quest.rewards || {};
    switch (rewards.questType) {
        case 'partner_discount':
            return `Скидка ${rewards.value}% у партнера`;
        case 'cashback':
            return `Кэшбэк ${rewards.value}% ${getCategoryDisplay(rewards.category)}`;
        case 'bonus_points':
            return `${rewards.value} бонусных баллов`;
        case 'premium_service':
            return `Бесплатный ${rewards.duration} обслуживания`;
        case 'premium_cashback':
            return `Премиальный кэшбэк ${rewards.value}%`;
        default:
            return rewards.questType || 'Награда';
    }
}

function getCategoryDisplay(category) {
    const categoryMap = {
        'restaurants': 'на рестораны',
        'shopping': 'на покупки',
        'all': 'на все покупки',
        'savings': 'по накоплениям',
        'credit': 'по кредитам',
        'cards': 'по картам',
        'premium': 'премиум'
    };
    return categoryMap[category] || '';
}



function showPremiumBlock() {
    const premiumBlock = document.getElementById('11_927');
    if (premiumBlock && !questData.isPremium) {
        premiumBlock.style.display = 'block';
    }
}

function hidePremiumBlock() {
    const premiumBlock = document.getElementById('11_927');
    if (premiumBlock && !questData.isPremium) {
        premiumBlock.style.display = 'none';
    }
}

function showPremiumBlockPermanent() {
    const premiumBlock = document.getElementById('11_927');
    if (premiumBlock && !questData.isPremium) {
        premiumBlock.style.display = 'block';
    }
}

async function handleCompleteQuest(questId) {
    if (!questId && infoData.currentQuest) {
        questId = infoData.currentQuest.id;
    }

    if (!questId) {
        showError('Квест не найден');
        return;
    }

    try {
        console.log('🎯 Завершение квеста:', questId);

        const result = await apiService.completeQuest(questId);
        console.log('📋 Результат завершения квеста:', result);

        if (result && (result.success || result.message?.includes('уже завершен') || result.message?.includes('already completed'))) {
            console.log('ℹ️ Квест уже завершен, обновляем данные...');
            await loadQuests();
            showSuccess('✅ Данные квестов обновлены!');
            return;
        }

        if (result && result.success) {
            showSuccess('✅ Квест завершен! Обновляем данные...');
            await loadQuests();
            showSuccess('🎉 Квест успешно завершен!');
        } else {
            const errorMsg = result?.message || 'Не удалось завершить квест';
            showError(errorMsg);
        }
    } catch (error) {
        console.error('💥 Ошибка завершения квеста:', error);

        if (error.message.includes('уже завершен') || error.message.includes('already completed') || error.message.includes('Квест уже завершен')) {
            console.log('ℹ️ Квест уже завершен, обновляем данные...');
            await loadQuests();
            showSuccess('✅ Данные квестов обновлены!');
            return;
        }

        if (error.message.includes('Failed to fetch')) {
            showError('❌ Ошибка соединения с сервером. Проверьте подключение.');
        } else if (error.message.includes('404') || error.message.includes('не найден')) {
            showError('🔍 Квест не найден. Обновляем список...');
            await loadQuests();
        } else if (error.message.includes('еще не выполнен') || error.message.includes('not completed')) {
            showError('⏳ Квест еще не выполнен! Продолжайте выполнять условия.');
        } else if (error.message.includes('Все доступные квесты уже завершены')) {
            showSuccess('🎉 Все квесты завершены! Ожидайте новые задания.');
            await loadQuests();
        } else {
            showError('❌ Не удалось завершить квест: ' + error.message);
        }
    }
}

async function refreshQuests() {
    try {
        console.log('🔄 Принудительное обновление квестов...');
        await loadQuests();
        console.log('✅ Квесты обновлены');
    } catch (error) {
        console.error('❌ Ошибка обновления квестов:', error);
    }
}

function getPrizeDisplayName(quest) {
    if (!quest) return 'Награда';

    if (quest.prize) {
        return quest.prize;
    }

    if (quest.rewards) {
        if (typeof quest.rewards === 'string') {
            return quest.rewards;
        }
        if (quest.rewards.prizeName) {
            return quest.rewards.prizeName;
        }
    }

    if (quest.points) {
        return `${quest.points} очков активности`;
    }

    return 'Секретная награда';
}

function updateQuestProgressFromBackend() {
    if (!infoData.currentQuest) return;

    console.log('🔄 Принудительное обновление прогресса квеста:', infoData.currentQuest.id);

    updateQuestProgressBar(infoData.currentQuest);

    updateQuestDisplay();
}

/*
async function checkQuestCompletion(questId) {
    const currentQuest = getCurrentQuest();
    if (!currentQuest) return false;

    switch (currentQuest.type) {
        case 'ACCOUNT_OPENING':
            return await checkAccountOpeningQuest();
        case 'TRANSFER_AMOUNT':
            return await checkTransferAmountQuest(currentQuest);
        case 'PRODUCT_PURCHASE':
            return await checkProductPurchaseQuest(currentQuest);
        case 'DEPOSIT_AMOUNT':
            return await checkDepositAmountQuest(currentQuest);
        case 'REFERRAL':
            return await checkReferralQuest();
        default:
            return false;
    }
}*/

function showQuestCompletedModal(quest) {
    const modal = createModal('quest-completed-modal');
    modal.innerHTML = `
        <div class="modal-content quest-modal completed">
            <div class="modal-header">
                <h2>Квест выполнен!</h2>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <p class="text-heading-8_635 fw-bold my-3 mb-4">Поздравляем! Вы выполнили квест:</p>
                <p class="quest-description text-40_209 quest-description">"${quest.description}"</p>
                <div class="reward-info">
                    <p class="quest-reward">Награда: ${quest.prize}</p>
                    <p class="quest-points">⭐ +${quest.points} очков активности</p>
                </div>
            </div>
            <div class="modal-footer">
                <button id="nextQuestBtn" class="btn-next-quest">
                    Следующий квест →
                </button>
            </div>
        </div>
    `;

    setupModalEvents(modal);

    modal.querySelector('#nextQuestBtn').addEventListener('click', () => {
        completeQuest(quest);
        modal.remove();
    });
}

function showQuestNotCompletedModal(quest) {
    const modal = createModal('quest-not-completed-modal');
    modal.innerHTML = `
        <div class="modal-content quest-modal not-completed">
            <div class="modal-header">
                <h2>Квест не выполнен</h2>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <p class="text-heading-8_635 fw-bold my-3 mb-4">Вы еще не выполнили условия квеста:</p>
                <p class="quest-description text-40_209 quest-description">"${quest.description}"</p>
                <div class="progress-info">
                    <p class="quest-progress">Прогресс: ${getProgressText(quest)}</p>
                    <p class="quest-hint">Продолжайте выполнять условия для получения награды!</p>
                </div>
            </div>
        </div>
    `;

    setupModalEvents(modal);
}

function completeQuest(quest) {
    if (!quest) return;

    quest.completed = true;
    questData.activePoints += quest.points;

    updateQuestBackground(quest);

    if (questData.isPremium) {
        console.log('Премиум квест выполнен, ищем следующий...');
    } else {
        questData.currentFreeQuestIndex++;

        if (questData.currentFreeQuestIndex >= questData.freeQuests.length) {
            console.log('Все бесплатные квесты выполнены! Предлагаем премиум...');
            showAllQuestsCompletedModal();
            return;
        }
    }

    updateQuestDisplay();
    updateActivePointsDisplay();
}

function updateQuestBackground(quest) {
    const questContainer = document.getElementById('11_718');
    if (!questContainer) return;

    const questImages = {
        0: 'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/bfdb91fe-e7d6-415a-8312-d5d986cb1a45/1762620237.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYyNjIwMjM3IiwicmVzb3VyY2VfY2hhdF9pZCI6IjFlMGVmODhhLTRjZmItNGQ3Zi1hMmEyLWY4MThkZTk0ODMzNiJ9.l0lJ2jOZa7l-cGr95UB9tCoXYUxSJWR27Z9LZpclzRo',
        1: 'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/27fbf883-b0b7-47c1-b391-a57e3ce1ee1d/1761802384.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYxODAyMzg0IiwicmVzb3VyY2VfY2hhdF9pZCI6ImM0YThhYTEyLTc2YzYtNGZjZi1hZmYzLTM5MmM5ZWEyYTMyYiJ9.Ec_GggWaPH5vk5KmNp4qU47-Pr8eaBnRTDV0gaTb2KU',
        2: 'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/8ab4c7e9-f0c0-4f6f-9bb9-8046bec579cf/1761802639.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYxODAyNjM5IiwicmVzb3VyY2VfY2hhdF9pZCI6ImM0YThhYTEyLTc2YzYtNGZjZi1hZmYzLTM5MmM5ZWEyYTMyYiJ9.3pZHBq3hEkaIiy746Ogx6nQSjRrGAA0oc30VSR9c2EM',
        3: 'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/83dcd951-d3c5-4e6d-bf7a-e0041531f3f1/1761802859.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYxODAyODU5IiwicmVzb3VyY2VfY2hhdF9pZCI6ImM0YThhYTEyLTc2YzYtNGZjZi1hZmYzLTM5MmM5ZWEyYTMyYiJ9.qDejIWJlWLEX6NKl8IiLrcxIGyI2UAgUKypJ2XS2Z3o',
        4: 'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/550affeb-aa15-4b75-9868-66dc43d748a1/1761802924.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYxODAyOTI0IiwicmVzb3VyY2VfY2hhdF9pZCI6ImM0YThhYTEyLTc2YzYtNGZjZi1hZmYzLTM5MmM5ZWEyYTMyYiJ9.YAiBGbzgM4Mdv4a52khoZlZ7j8H27pQ7pLJeLL0G1rA',
        5: 'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/63d42c05-f7c1-4096-8eab-df86c3b578d6/1762611369.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYyNjExMzY5IiwicmVzb3VyY2VfY2hhdF9pZCI6ImM0YThhYTEyLTc2YzYtNGZjZi1hZmYzLTM5MmM5ZWEyYTMyYiJ9.WL9uVgYQtmv-j7telHgj2Zil782sFiyuNf5ft3BLoW8',
        6: 'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/001cf91d-ee44-4a02-8f0b-49df8979976f/1762611621.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYyNjExNjIxIiwicmVzb3VyY2VfY2hhdF9pZCI6ImM0YThhYTEyLTc2YzYtNGZjZi1hZmYzLTM5MmM5ZWEyYTMyYiJ9.P15HPWozoiyok7tEq_r05YrPCwZA2i65zySKABTLOzI',
        7: 'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/951c77bf-d469-433e-9be6-02dc7994d250/1762611651.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYyNjExNjUxIiwicmVzb3VyY2VfY2hhdF9pZCI6ImM0YThhYTEyLTc2YzYtNGZjZi1hZmYzLTM5MmM5ZWEyYTMyYiJ9.pjq5c1CYqt0BhIHZlNnAuCDLE-e48KtmYQaW8JP-dFc',
        8: 'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/143e8ba5-8f8d-49f2-be08-6094941f259b/1762611828.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYyNjExODI4IiwicmVzb3VyY2VfY2hhdF9pZCI6ImM0YThhYTEyLTc2YzYtNGZjZi1hZmYzLTM5MmM5ZWEyYTMyYiJ9.W3i9kmHshJJUpymQpUe4AJjtrkSCPxqLESDW_6qWwNs',
        9: 'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/7d993dc0-a1c6-4b31-808b-17be46dafcbf/1762611974.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYyNjExOTc0IiwicmVzb3VyY2VfY2hhdF9pZCI6ImM0YThhYTEyLTc2YzYtNGZjZi1hZmYzLTM5MmM5ZWEyYTMyYiJ9.CRc-_Z2KGbYZynm5D3g5xZg74TC5Ms6YGnbFZKfSNSM',
        10: 'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/76d978f3-c72b-4d63-a4d7-435905344ae2/1762612077.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYyNjEyMDc3IiwicmVzb3VyY2VfY2hhdF9pZCI6ImM0YThhYTEyLTc2YzYtNGZjZi1hZmYzLTM5MmM5ZWEyYTMyYiJ9.2WEkZ7DEG2MMt1-LnUbZlHwha5RLO4-_Dp1zKFPqZEs'
    };

    const fallbackGradients = {
        purchase: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        account: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        transfer: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        deposit: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        product: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        usage: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        payment: 'linear-gradient(135deg, #cd9cf2 0%, #f6f3ff 100%)',
        referral: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
        autopayment: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
        services: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)'
    };

    const imageUrl = questImages[quest.id] || questImages[0];
    const fallbackGradient = fallbackGradients[quest.type] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

    console.log(`Setting permanent quest background for quest ${quest.id}:`, imageUrl);

    const img = new Image();
    img.onload = function() {
        console.log('Quest background image loaded successfully - setting permanently');

        questContainer.style.backgroundImage = `url("${imageUrl}")`;
        questContainer.style.backgroundSize = 'cover';
        questContainer.style.backgroundPosition = 'center';
        questContainer.style.backgroundRepeat = 'no-repeat';
        questContainer.style.transition = 'all 0.8s ease';

        questContainer.style.transform = 'scale(1.02)';
        setTimeout(() => {
            questContainer.style.transform = 'scale(1)';
        }, 300);

        questContainer.style.position = 'relative';

        let overlay = questContainer.querySelector('.bg-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'bg-overlay';
            overlay.style.position = 'absolute';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.borderRadius = 'inherit';
            overlay.style.zIndex = '1';
            overlay.style.transition = 'all 0.8s ease';
            questContainer.appendChild(overlay);
        }

        const questContent = questContainer.querySelector('.frame-11_720') ||
            questContainer.querySelector('[id*="11_720"]') ||
            questContainer.children[1];

        if (questContent) {
            questContent.style.position = 'relative';
            questContent.style.zIndex = '2';
        }
    };

    img.onerror = function() {
        console.warn('Quest background image failed to load, using fallback gradient permanently');

        questContainer.style.background = fallbackGradient;
        questContainer.style.backgroundImage = '';
        questContainer.style.backgroundSize = 'cover';
        questContainer.style.backgroundPosition = 'center';
        questContainer.style.transition = 'all 0.8s ease';

        questContainer.style.transform = 'scale(1.02)';
        setTimeout(() => {
            questContainer.style.transform = 'scale(1)';
        }, 300);

        const overlay = questContainer.querySelector('.bg-overlay');
        if (overlay && overlay.parentNode) {
            overlay.remove();
        }

        const questContent = questContainer.querySelector('.frame-11_720') ||
            questContainer.querySelector('[id*="11_720"]') ||
            questContainer.children[1];

        if (questContent) {
            questContent.style.position = '';
            questContent.style.zIndex = '';
        }
    };

    img.src = imageUrl;

    setTimeout(() => {
        if (!img.complete && img.naturalWidth === 0) {
            console.warn('Quest background image loading timeout, using fallback permanently');
            questContainer.style.background = fallbackGradient;
            questContainer.style.backgroundImage = '';
        }
    }, 2000);
}

function preloadQuestImages() {
    console.log('Preloading quest images from CDN...');

    const questImages = [
        'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/bfdb91fe-e7d6-415a-8312-d5d986cb1a45/1762620237.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYyNjIwMjM3IiwicmVzb3VyY2VfY2hhdF9pZCI6IjFlMGVmODhhLTRjZmItNGQ3Zi1hMmEyLWY4MThkZTk0ODMzNiJ9.l0lJ2jOZa7l-cGr95UB9tCoXYUxSJWR27Z9LZpclzRo',
        'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/27fbf883-b0b7-47c1-b391-a57e3ce1ee1d/1761802384.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYxODAyMzg0IiwicmVzb3VyY2VfY2hhdF9pZCI6ImM0YThhYTEyLTc2YzYtNGZjZi1hZmYzLTM5MmM5ZWEyYTMyYiJ9.Ec_GggWaPH5vk5KmNp4qU47-Pr8eaBnRTDV0gaTb2KU',
        'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/8ab4c7e9-f0c0-4f6f-9bb9-8046bec579cf/1761802639.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYxODAyNjM5IiwicmVzb3VyY2VfY2hhdF9pZCI6ImM0YThhYTEyLTc2YzYtNGZjZi1hZmYzLTM5MmM5ZWEyYTMyYiJ9.3pZHBq3hEkaIiy746Ogx6nQSjRrGAA0oc30VSR9c2EM',
        'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/83dcd951-d3c5-4e6d-bf7a-e0041531f3f1/1761802859.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYxODAyODU5IiwicmVzb3VyY2VfY2hhdF9pZCI6ImM0YThhYTEyLTc2YzYtNGZjZi1hZmYzLTM5MmM5ZWEyYTMyYiJ9.qDejIWJlWLEX6NKl8IiLrcxIGyI2UAgUKypJ2XS2Z3o',
        'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/550affeb-aa15-4b75-9868-66dc43d748a1/1761802924.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYxODAyOTI0IiwicmVzb3VyY2VfY2hhdF9pZCI6ImM0YThhYTEyLTc2YzYtNGZjZi1hZmYzLTM5MmM5ZWEyYTMyYiJ9.YAiBGbzgM4Mdv4a52khoZlZ7j8H27pQ7pLJeLL0G1rA',
        'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/63d42c05-f7c1-4096-8eab-df86c3b578d6/1762611369.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYyNjExMzY5IiwicmVzb3VyY2VfY2hhdF9pZCI6ImM0YThhYTEyLTc2YzYtNGZjZi1hZmYzLTM5MmM5ZWEyYTMyYiJ9.WL9uVgYQtmv-j7telHgj2Zil782sFiyuNf5ft3BLoW8',
        'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/001cf91d-ee44-4a02-8f0b-49df8979976f/1762611621.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYyNjExNjIxIiwicmVzb3VyY2VfY2hhdF9pZCI6ImM0YThhYTEyLTc2YzYtNGZjZi1hZmYzLTM5MmM5ZWEyYTMyYiJ9.P15HPWozoiyok7tEq_r05YrPCwZA2i65zySKABTLOzI',
        'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/951c77bf-d469-433e-9be6-02dc7994d250/1762611651.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYyNjExNjUxIiwicmVzb3VyY2VfY2hhdF9pZCI6ImM0YThhYTEyLTc2YzYtNGZjZi1hZmYzLTM5MmM5ZWEyYTMyYiJ9.pjq5c1CYqt0BhIHZlNnAuCDLE-e48KtmYQaW8JP-dFc',
        'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/143e8ba5-8f8d-49f2-be08-6094941f259b/1762611828.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYyNjExODI4IiwicmVzb3VyY2VfY2hhdF9pZCI6ImM0YThhYTEyLTc2YzYtNGZjZi1hZmYzLTM5MmM5ZWEyYTMyYiJ9.W3i9kmHshJJUpymQpUe4AJjtrkSCPxqLESDW_6qWwNs',
        'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/7d993dc0-a1c6-4b31-808b-17be46dafcbf/1762611974.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYyNjExOTc0IiwicmVzb3VyY2VfY2hhdF9pZCI6ImM0YThhYTEyLTc2YzYtNGZjZi1hZmYzLTM5MmM5ZWEyYTMyYiJ9.CRc-_Z2KGbYZynm5D3g5xZg74TC5Ms6YGnbFZKfSNSM',
        'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/76d978f3-c72b-4d63-a4d7-435905344ae2/1762612077.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYyNjEyMDc3IiwicmVzb3VyY2VfY2hhdF9pZCI6ImM0YThhYTEyLTc2YzYtNGZjZi1hZmYzLTM5MmM5ZWEyYTMyYiJ9.2WEkZ7DEG2MMt1-LnUbZlHwha5RLO4-_Dp1zKFPqZEs'
    ];

    questImages.forEach((imageUrl, index) => {
        const img = new Image();
        img.src = imageUrl;
        img.onload = () => console.log(`Preloaded quest image ${index}`);
        img.onerror = () => console.warn(`Failed to preload quest image ${index}`);
    });
}

function setInitialQuestBackground() {
    const questContainer = document.getElementById('11_718');
    if (!questContainer) return;

    const initialImageUrl = 'https://cdn.qwenlm.ai/output/0b8df528-bad2-4883-a483-3c746b03c234/t2i/bfdb91fe-e7d6-415a-8312-d5d986cb1a45/1762620237.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoiMGI4ZGY1MjgtYmFkMi00ODgzLWE0ODMtM2M3NDZiMDNjMjM0IiwicmVzb3VyY2VfaWQiOiIxNzYyNjIwMjM3IiwicmVzb3VyY2VfY2hhdF9pZCI6IjFlMGVmODhhLTRjZmItNGQ3Zi1hMmEyLWY4MThkZTk0ODMzNiJ9.l0lJ2jOZa7l-cGr95UB9tCoXYUxSJWR27Z9LZpclzRo';

    const img = new Image();
    img.onload = function() {
        questContainer.style.backgroundImage = `url("${initialImageUrl}")`;
        questContainer.style.backgroundSize = 'cover';
        questContainer.style.backgroundPosition = 'center';
        questContainer.style.backgroundRepeat = 'no-repeat';
        console.log('Initial quest background set successfully');
    };
    img.onerror = function() {
        console.warn('Failed to load initial quest background');
        questContainer.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    };
    img.src = initialImageUrl;
}

function showAllQuestsCompletedModal() {
    const modal = createModal('all-quests-completed-modal');
    modal.innerHTML = `
        <div class="modal-content premium-modal" style="max-width: 500px;">
            <div class="modal-header">
                <div class="frame-12_369" style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                    <div class="vector-12_368"></div>
                    <span class="text-12_370 text-heading-8_635">Все квесты завершены!</span>
                    <div class="vector-12_371"></div>
                </div>
                <span class="close-modal">&times;</span>
            </div>
            
            <div class="modal-body">
                <div style="text-align: center; margin-bottom: 20px;">
                    <p class="text-heading-8_635 mb-3">Поздравляем!</p>
                    <p class="text-9_282 text-subheading-5_251">Вы успешно завершили все бесплатные квесты и получили все награды!</p>
                </div>
                
                <div style="background: #f8f9fa; border-radius: 12px; padding: 15px; margin: 15px 0;">
                    <p class="text-3_1 text-heading-8_635 mb-2 ">Ваши достижения:</p>
                    <p>✅ Выполнено 3 квеста</p>
                    <p>⭐ Получено ${questData.activePoints} очков активности</p>
                    <p>🎁 Получены все бесплатные награды</p>
                </div>

                <p class="text-body-strong-5_642 mb-3" style="color: white;">Хотите больше квестов и наград?</p>
                <div class="frame-12_325" style="background: #667eea; border-radius: 12px; padding: 20px; text-align: center; color: white; margin: 20px 0;">
                    <div class="frame-12_326" style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 5px;">
                        <span class="text-12_328" style="font-size: 32px; font-weight: bold; color: white">299 ₽</span>
                        <span class="text-12_315" style="text-decoration: line-through; opacity: 0.7;">1000 ₽</span>
                    </div>
                    <span class="text-12_329 text-white">в месяц</span>
                </div>
                
                <div class="frame-11_964">
                    <div class="frame-11_965">
                        <div class="frame-11_966">
                            <span class="text-3_50 text-body-strong-5_642">Premium преимущества</span>
                        </div>
                    </div>
                    <div class="premium-benefits-list" style="margin-top: 15px;">
                        <div style="display: flex; align-items: start; gap: 10px; margin: 10px 0;">
                            <div style="color: #667eea; font-weight: bold;">✓</div>
                            <span class="text-9_282 text-subheading-5_251">10 уникальных квестов вместо 3</span>
                        </div>
                        <div style="display: flex; align-items: start; gap: 10px; margin: 10px 0;">
                            <div style="color: #667eea; font-weight: bold;">✓</div>
                            <span class="text-9_282 text-subheading-5_251">Увеличенные награды и бонусы</span>
                        </div>
                        <div style="display: flex; align-items: start; gap: 10px; margin: 10px 0;">
                            <div style="color: #667eea; font-weight: bold;">✓</div>
                            <span class="text-9_282 text-subheading-5_251">Эксклюзивные Premium-призы</span>
                        </div>
                        <div style="display: flex; align-items: start; gap: 10px; margin: 10px 0;">
                            <div style="color: #667eea; font-weight: bold;">✓</div>
                            <span class="text-9_282 text-subheading-5_251">В 3 раза больше очков активности</span>
                        </div>
                    </div>
                </div>
                
                <!-- Блок выбора счета для оплаты -->
                <div id="paymentAccountSelection" class="form-group" style="margin: 20px 0;">
                    <label class="text-12_414 text-subheading-5_251" style="display: block; margin-bottom: 8px;">Выберите счет для оплаты:</label>
                    <select id="paymentSourceAccount" class="form-select" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                        <option value="">Выберите счет</option>
                    </select>
                    <div id="paymentAccountBalance" class="form-help" style="margin-top: 5px; font-size: 12px; color: #666;"></div>
                </div>
            </div>
            
            <div class="modal-footer" style="display: flex; gap: 10px; flex-direction: column;">
                <button id="buyPremiumFromAccount" class="frame-11_932 buy-premium-btn" style="width: 100%; cursor: pointer; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 8px; padding: 15px; color: white; text-align: center; font-weight: bold;">
                    <span class="text-single-linebody-base-5_123">Оформить Premium - 299 ₽/месяц</span>
                </button>
                <button id="continueFree" class="frame-11_932" style="width: 100%; cursor: pointer; background: #f0f0f0; border: none; border-radius: 8px; padding: 12px; color: #666; text-align: center;">
                    <span class="text-body-base-5_123">Продолжить бесплатно</span>
                </button>
            </div>
        </div>
    `;

    setupModalEvents(modal);

    populatePaymentAccounts();

    const paymentAccountSelect = document.getElementById('paymentSourceAccount');
    if (paymentAccountSelect) {
        paymentAccountSelect.addEventListener('change', updatePaymentAccountBalance);
    }

    modal.querySelector('#buyPremiumFromAccount').addEventListener('click', function() {
        console.log('Premium payment button clicked');
        processPremiumPayment(modal);
    });

    modal.querySelector('#continueFree').addEventListener('click', function() {
        console.log('Continue free button clicked');
        modal.remove();
    });

    return modal;
}

function populatePaymentAccounts() {
    const paymentAccountSelect = document.getElementById('paymentSourceAccount');
    if (!paymentAccountSelect) return;

    paymentAccountSelect.innerHTML = '<option value="">Выберите счет</option>';

    accounts.forEach(account => {
        if (!account.productId) {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = `${account.bank} (${account.formattedAccountNumber}) - ${account.balance.toLocaleString()} ₽`;
            paymentAccountSelect.appendChild(option);
        }
    });

    updatePaymentAccountBalance();
}

function updatePaymentAccountBalance() {
    const paymentAccountSelect = document.getElementById('paymentSourceAccount');
    const balanceText = document.getElementById('paymentAccountBalance');
    const payButton = document.getElementById('buyPremiumFromAccount');

    if (!paymentAccountSelect || !balanceText || !payButton) return;

    const selectedAccountId = paymentAccountSelect.value;
    const selectedAccount = getAccountById(selectedAccountId);

    if (selectedAccount) {
        balanceText.textContent = `Доступно: ${selectedAccount.balance.toLocaleString()} ₽`;
        balanceText.className = 'form-help';

        if (selectedAccount.balance < 299) {
            balanceText.className = 'form-help error';
            balanceText.textContent = `Недостаточно средств. Нужно 299 ₽, доступно: ${selectedAccount.balance.toLocaleString()} ₽`;
            payButton.disabled = true;
            payButton.style.opacity = '0.6';
        } else {
            payButton.disabled = false;
            payButton.style.opacity = '1';
        }
    } else {
        balanceText.textContent = 'Доступно: 0 ₽';
        payButton.disabled = true;
        payButton.style.opacity = '0.6';
    }
}

function processPremiumPayment(modal) {
    const paymentAccountSelect = document.getElementById('paymentSourceAccount');
    if (!paymentAccountSelect) return;

    const selectedAccountId = paymentAccountSelect.value;

    if (!selectedAccountId) {
        alert('Пожалуйста, выберите счет для оплаты');
        return;
    }

    const selectedAccount = getAccountById(selectedAccountId);
    if (!selectedAccount) return;

    if (selectedAccount.balance < 299) {
        alert('Недостаточно средств на выбранном счете');
        return;
    }

    selectedAccount.balance -= 299;
    updateAccountBalance(selectedAccount.id, selectedAccount.balance);

    addToHistory({
        type: 'premium',
        description: 'Оплата Premium подписки',
        account: selectedAccount.accountNumber,
        amount: -299,
        bank: selectedAccount.bank
    });

    buyPremium();

    modal.remove();

    alert('🎉 Premium подписка успешно активирована! Средства списаны со счета.');
}

function buyPremium() {
    questData.isPremium = true;
    alert('🎉 Поздравляем! Вы приобрели Premium подписку!');

    if (!localStorage.getItem('premiumPurchased')) {
        resetPremiumQuests();
        localStorage.setItem('premiumPurchased', 'true');
    }

    updateQuestDisplay();
    hidePremiumBlock();

    const currentQuest = getCurrentQuest();
    if (currentQuest) {
        updateQuestProgressBar(currentQuest);
    }
}

function resetFreeQuests() {
    questData.currentFreeQuestIndex = 0;
    questData.freeQuests.forEach(quest => {
        quest.completed = false;
    });
    console.log('Бесплатные квесты сброшены');
}

function resetPremiumQuests() {
    questData.premiumQuests.forEach(quest => {
        quest.completed = false;
    });
    console.log('Премиум квесты сброшены');
}

function showPremiumModal() {
    const modal = createModal('premium-modal');
    modal.innerHTML = `
        <div class="modal-content premium-modal">
            <div class="modal-header">
                <h2>🌟 Premium Квесты</h2>
                <span class="close-modal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="premium-benefits">
                    <h3>Преимущества Premium:</h3>
                    <ul>
                        <li>✅ 10 уникальных квестов вместо 3</li>
                        <li>✅ Увеличенные награды</li>
                        <li>✅ Эксклюзивные бонусы</li>
                        <li>✅ Больше очков активности</li>
                        <li>✅ Приоритетная поддержка</li>
                    </ul>
                </div>
                <div class="premium-pricing">
                    <div class="price-old">1000 ₽</div>
                    <div class="price-new">299 ₽ в месяц</div>
                    <div class="price-save">Экономия 70%</div>
                </div>
            </div>
            <div class="modal-footer">
                <button id="confirmPremiumBtn" class="btn-buy-premium">
                    💎 Купить Premium - 299 ₽/мес
                </button>
            </div>
        </div>
    `;

    setupModalEvents(modal);

    modal.querySelector('#confirmPremiumBtn').addEventListener('click', () => {
        buyPremium();
        modal.remove();
    });
}

function createModal(className) {
    const modal = document.createElement('div');
    modal.className = `modal-overlay ${className}`;
    document.body.appendChild(modal);
    return modal;
}

function setupModalEvents(modal, onClose = null) {
    const closeBtn = modal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (onClose) onClose();
            modal.remove();
        });
    }

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            if (onClose) onClose();
            modal.remove();
        }
    });
}

function updateQuestProgress(type, value = 1) {
    const currentQuest = getCurrentQuest();

    if (!currentQuest || currentQuest.completed) return;

    if (currentQuest.type === type) {
        if (typeof currentQuest.target === 'number') {
            currentQuest.currentProgress += value;
        } else {
            currentQuest.currentProgress += value;
        }

        updateQuestDisplay();
    }
}

function showSuccess(message) {
    alert('✅ ' + message);
}

function showError(message) {
    alert('❌ ' + message);
}

async function checkAPIHealth() {
    try {
        const response = await fetch('http://localhost:8090/api/v1/aggregate/team086-1');
        console.log('API Health Check - Status:', response.status);
        console.log('API Health Check - Headers:', response.headers);
        return response.ok;
    } catch (error) {
        console.error('API Health Check failed:', error);
        return false;
    }
}

function initializeCloseAccountModal() {
    closeAccountModal = document.getElementById('closeAccountModal');
    confirmCloseAccountBtn = document.getElementById('confirmCloseAccount');
    transferToAccountSelect = document.getElementById('transferToAccount');

    if (!closeAccountModal) {
        console.error('closeAccountModal not found');
        return;
    }

    if (!confirmCloseAccountBtn) {
        console.error('confirmCloseAccountBtn not found');
        return;
    }

    if (!transferToAccountSelect) {
        console.error('transferToAccountSelect not found');
        return;
    }

    console.log('Close account modal elements initialized successfully');

    setupCloseAccountEventListeners();
}

async function initializeApp() {
    console.log('Initializing app...');

    const apiHealthy = await checkAPIHealth();
    console.log('API Health:', apiHealthy ? 'OK' : 'FAILED');

    if (!apiHealthy) {
        showError('Сервер недоступен. Проверьте, запущен ли бэкенд на localhost:8090');
        return;
    }

    await loadAllData();

    const button = document.querySelector('#buttonFormChet');
    const form = document.querySelector('#FormChet');
    const bankForm = document.querySelector('#bankForm');
    const bankSelect = document.querySelector('#bankSelect');
    const submitButton = document.querySelector('#btn-site');

    if (button && form && bankSelect && submitButton) {
        submitButton.disabled = true;

        button.addEventListener('click', () => {
            button.style.display = 'none';
            form.classList.add('open');
            form.classList.remove('close');
        });

        bankSelect.addEventListener('change', () => {
            submitButton.disabled = bankSelect.value === '';
        });

        submitButton.addEventListener('click', () => {
            const selectedBank = bankSelect.value;

            if (!selectedBank) {
                alert('Пожалуйста, выберите банк');
                bankSelect.focus();
                return;
            }

            createAccount(selectedBank);

            form.classList.remove('open');
            form.classList.add('close');
            button.style.display = 'inline-block';

            bankForm.reset();
            submitButton.disabled = true;
        });
    }

    setupExistingAccountCloseButtons();

    initializeCloseAccount();
    initializeTransfers();
    initializeProducts();
    initializeHistory();
    initializeQuests();

    closeAccountModal = document.getElementById('closeAccountModal');
    confirmCloseAccountBtn = document.getElementById('confirmCloseAccount');
    transferToAccountSelect = document.getElementById('transferToAccount');

    if (closeAccountModal && confirmCloseAccountBtn) {
        setupCloseAccountEventListeners();
    }

    console.log('Приложение инициализировано');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeEvents();
        initializeApp();
    });
} else {
    initializeEvents();
    initializeApp();
}