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

// Хранилище счетов
let accounts = [];

// Изначальный счет
const initialAccount = {
    id: "initialAccount",
    bank: "VBank",
    balance: 100000,
    accountNumber: "4000123456781234",
    formattedAccountNumber: "4000 1234 5678 1234",
    element: document.querySelector('#initialAccount'),
    classes: ["card", "initial-account"]
};

// Данные для информационного блока
let infoData = {
    get totalBalance() {
        return accounts.reduce((sum, account) => sum + account.balance, 0);
    },
    get activeAccounts() {
        return accounts.length;
    },
    transfersThisMonth: 10,
    currentQuest: {
        description: "Соверши покупку на сумму 1 000₽",
        prize: "случайный",
        completed: false
    },
    quests: [
        { description: "Соверши покупку на сумму 1 000₽", prize: "50 баллов", target: 1000 },
        { description: "Открой новый счёт", prize: "50 баллов", target: "new_account" },
        { description: "Соверши 3 перевода", prize: "100 ₽", target: "transfers" },
        { description: "Пополни счёт на 5 000₽", prize: "подарок", target: 5000 }
    ]
};

// Функция обновления информационного блока
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
    if (currentQuestElement) {
        currentQuestElement.innerHTML = infoData.currentQuest.description.replace('\n', '<br>');
    }
    
    const questPrizeElement = document.getElementById('questPrize');
    if (questPrizeElement) {
        questPrizeElement.textContent = infoData.currentQuest.prize;
    }
    
    const transfersCountElement = document.getElementById('transfersCount');
    if (transfersCountElement) {
        transfersCountElement.textContent = infoData.transfersThisMonth.toString();
    }
}

// Функция для увеличения счетчика переводов
function incrementTransfersCount() {
    infoData.transfersThisMonth++;
    updateInfoBlock();
}

// Функция форматирования номера счета (4000 1234 5678 1234)
function formatAccountNumber(accountNumber) {
  return accountNumber.replace(/(\d{4})(?=\d)/g, '$1 ');
}

// Функция генерации номера счета (16 цифр)
function generateAccountNumber() {
  let accountNumber = '4';
  for (let i = 0; i < 15; i++) {
    accountNumber += Math.floor(Math.random() * 10);
  }
  return accountNumber;
}

// Функция для получения счета по ID
function getAccountById(accountId) {
  return accounts.find(account => account.id === accountId);
}

// Функция для получения счета по номеру счета
function getAccountByAccountNumber(accountNumber) {
  return accounts.find(account => account.accountNumber === accountNumber);
}

// Функция обновления баланса счета
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

// Функция создания нового счета
function createAccount(bankName) {
  const accountNumber = generateAccountNumber();
  const formattedAccountNumber = formatAccountNumber(accountNumber);
  
  const accountId = 'account_' + Date.now();
  
  const newCard = document.createElement('div');
  newCard.id = accountId;
  newCard.className = 'card';
  newCard.innerHTML = `
    <span class="text-bank text-heading-8_635">${bankName}</span>
    <span class="text-main">0 ₽</span>
    <span class="text-9_282 text-subheading-5_251">номер счёта: ${formattedAccountNumber}</span>
  `;
  
  const accountsGrid = document.querySelector('#accountsGrid');
  if (accountsGrid) {
    accountsGrid.appendChild(newCard);
  }
  
  const newAccount = {
    id: accountId,
    bank: bankName,
    balance: 0,
    accountNumber: accountNumber,
    formattedAccountNumber: formattedAccountNumber,
    element: newCard,
    classes: ["card"]
  };
  
  accounts.push(newAccount);
  updateInfoBlock();
  
  // Обновляем подсказки для переводов
  updateAccountsDataList();
  
  // Обновляем фильтр в истории
  updateAccountFilter();
  
  // Добавляем в историю
  addToHistory({
    type: 'account',
    description: 'Открытие счета',
    account: accountNumber,
    amount: 0,
    bank: bankName
  });
}

// Функция обновления отображения счета
function updateAccountDisplay(accountNumber, newBalance) {
  const account = getAccountByAccountNumber(accountNumber);
  if (account) {
    account.balance = newBalance;
    const balanceElement = account.element.querySelector('.text-main');
    if (balanceElement) {
      balanceElement.textContent = newBalance.toLocaleString() + ' ₽';
    }
    updateInfoBlock();
  }
}

// Переменные для закрытия счетов
let closeAccountModal, closeAccountBtn, confirmCloseAccountBtn, transferToAccountSelect;
let currentClosingAccount = null;

// Инициализация функционала закрытия счетов
function initializeCloseAccount() {
    closeAccountModal = document.getElementById('closeAccountModal');
    confirmCloseAccountBtn = document.getElementById('confirmCloseAccount');
    transferToAccountSelect = document.getElementById('transferToAccount');
    
    setupCloseAccountEventListeners();
}

// Настройка обработчиков событий для закрытия счетов
function setupCloseAccountEventListeners() {
    // Закрытие модального окна
    const closeModalBtn = closeAccountModal.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            closeAccountModal.style.display = 'none';
        });
    }
    
    // Подтверждение закрытия счета
    if (confirmCloseAccountBtn) {
        confirmCloseAccountBtn.addEventListener('click', handleConfirmCloseAccount);
    }
    
    // Закрытие по клику вне модального окна
    window.addEventListener('click', (event) => {
        if (event.target === closeAccountModal) {
            closeAccountModal.style.display = 'none';
        }
    });
}

// Обработка нажатия кнопки закрытия счета
function handleCloseAccount(accountId) {
    const account = getAccountById(accountId);
    if (!account) return;
    
    currentClosingAccount = account;
    
    // Заполняем информацию о счете
    document.getElementById('closeAccountBank').textContent = account.bank;
    document.getElementById('closeAccountBalance').textContent = account.balance.toLocaleString() + ' ₽';
    document.getElementById('closeAccountNumber').textContent = account.formattedAccountNumber;
    
    // Заполняем список счетов для перевода (исключая текущий)
    populateTransferAccounts(accountId);
    
    // Показываем модальное окно
    closeAccountModal.style.display = 'flex';
}

// Заполнение списка счетов для перевода
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
    
    // Если нет других счетов, делаем кнопку неактивной
    if (accounts.length <= 1) {
        confirmCloseAccountBtn.disabled = true;
        confirmCloseAccountBtn.textContent = 'Нет счетов для перевода';
    } else {
        confirmCloseAccountBtn.disabled = false;
        confirmCloseAccountBtn.textContent = 'Перевести и закрыть';
    }
}

// Подтверждение закрытия счета
function handleConfirmCloseAccount() {
    if (!currentClosingAccount) return;
    
    const selectedAccountId = transferToAccountSelect.value;
    
    if (!selectedAccountId) {
        alert('Пожалуйста, выберите счет для перевода средств');
        return;
    }
    
    const targetAccount = getAccountById(selectedAccountId);
    if (!targetAccount) return;
    
    // Переводим средства
    const transferAmount = currentClosingAccount.balance;
    targetAccount.balance += transferAmount;
    
    // Обновляем отображение баланса целевого счета
    updateAccountBalance(targetAccount.id, targetAccount.balance);
    
    // Добавляем запись в историю
    addToHistory({
        type: 'transfer',
        description: 'Перевод при закрытии счета',
        fromAccount: currentClosingAccount.accountNumber,
        toAccount: targetAccount.accountNumber,
        amount: -transferAmount,
        bank: currentClosingAccount.bank
    });
    
    // Закрываем счет
    closeAccount(currentClosingAccount.id);
    
    // Закрываем модальное окно
    closeAccountModal.style.display = 'none';
    
    alert(`Счет успешно закрыт! Средства переведены на счет ${targetAccount.formattedAccountNumber}`);
}

// Закрытие счета
function closeAccount(accountId) {
    const accountIndex = accounts.findIndex(acc => acc.id === accountId);
    if (accountIndex === -1) return;
    
    const account = accounts[accountIndex];
    
    // Удаляем элемент из DOM
    if (account.element && account.element.parentNode) {
        account.element.remove();
    }
    
    // Удаляем из массива счетов
    accounts.splice(accountIndex, 1);
    
    // Обновляем информационный блок
    updateInfoBlock();
    
    // Обновляем подсказки для переводов
    updateAccountsDataList();
    
    // Обновляем фильтр в истории
    updateAccountFilter();
    
    console.log(`Счет ${accountId} закрыт`);
}

// Обновление функции создания счета для добавления кнопки закрытия
function createAccount(bankName) {
    const accountNumber = generateAccountNumber();
    const formattedAccountNumber = formatAccountNumber(accountNumber);
    
    const accountId = 'account_' + Date.now();
    
    const newCard = document.createElement('div');
    newCard.id = accountId;
    newCard.className = 'card';
    newCard.innerHTML = `
        <div class="card-header">
            <span class="text-bank text-heading-8_635">${bankName}</span>
            <button class="close-account-btn" data-account="${accountId}">Закрыть</button>
        </div>
        <span class="text-main">0 ₽</span>
        <span class="text-9_282 text-subheading-5_251">номер: ${formattedAccountNumber}</span>
    `;
    
    const accountsGrid = document.querySelector('#accountsGrid');
    if (accountsGrid) {
        accountsGrid.appendChild(newCard);
    }
    
    const newAccount = {
        id: accountId,
        bank: bankName,
        balance: 0,
        accountNumber: accountNumber,
        formattedAccountNumber: formattedAccountNumber,
        element: newCard,
        classes: ["card"]
    };
    
    accounts.push(newAccount);
    updateInfoBlock();
    
    // Добавляем обработчик для кнопки закрытия
    const closeBtn = newCard.querySelector('.close-account-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            handleCloseAccount(accountId);
        });
    }
    
    // Обновляем подсказки для переводов
    updateAccountsDataList();
    
    // Обновляем фильтр в истории
    updateAccountFilter();
    
    // Добавляем в историю
    addToHistory({
        type: 'account',
        description: 'Открытие счета',
        account: accountNumber,
        amount: 0,
        bank: bankName
    });
}

// Добавляем обработчики для существующих счетов при инициализации
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

// Функция для подсказок в переводах
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

// Переменные для переводов
let fromAccountInput, toAccountInput, transferAmountInput, transferBtn;
let transferModal, confirmTransferBtn, cancelTransferBtn;

// Инициализация элементов переводов
function initializeTransferElements() {
  fromAccountInput = document.getElementById('fromAccount');
  toAccountInput = document.getElementById('toAccount');
  transferAmountInput = document.getElementById('transferAmount');
  transferBtn = document.getElementById('transferBtn');
  transferModal = document.getElementById('transferModal');
  confirmTransferBtn = document.getElementById('confirmTransferBtn');
  cancelTransferBtn = document.getElementById('cancelTransferBtn');
  
  console.log('Transfer elements initialized:', {
    fromAccountInput: !!fromAccountInput,
    toAccountInput: !!toAccountInput,
    transferAmountInput: !!transferAmountInput,
    transferBtn: !!transferBtn,
    transferModal: !!transferModal,
    confirmTransferBtn: !!confirmTransferBtn,
    cancelTransferBtn: !!cancelTransferBtn
  });
}

// Валидация формы перевода
function validateTransferForm() {
  if (!fromAccountInput || !toAccountInput || !transferAmountInput || !transferBtn) {
    return;
  }

  const fromAccount = fromAccountInput.value.trim();
  const toAccount = toAccountInput.value.trim();
  const amount = parseInt(transferAmountInput.value) || 0;
  
  // Находим счет отправителя
  const fromAccountData = accounts.find(acc => acc.accountNumber === fromAccount);
  const availableBalance = fromAccountData ? fromAccountData.balance : 0;
  
  // Обновляем доступный баланс
  const availableBalanceElement = document.getElementById('availableBalance');
  if (availableBalanceElement) {
    availableBalanceElement.textContent = availableBalance.toLocaleString();
  }
  
  // Проверяем условия
  const isFromAccountValid = fromAccountData !== undefined;
  const isToAccountValid = toAccount.length > 0;
  const isAmountValid = amount > 0 && amount <= availableBalance;
  const isSameAccount = fromAccount === toAccount;
  
  // Показываем ошибки
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
  
  // Активируем кнопку
  transferBtn.disabled = !(isFromAccountValid && isToAccountValid && isAmountValid && !isSameAccount);
}

// Слушатели событий для валидации переводов
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

// Обработка нажатия кнопки перевода
function setupTransferButtonHandler() {
  if (!transferBtn) return;

  transferBtn.addEventListener('click', () => {
    const fromAccount = fromAccountInput.value.trim();
    const toAccount = toAccountInput.value.trim();
    const amount = parseInt(transferAmountInput.value);
    
    // Заполняем модальное окно
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
    
    // Показываем модальное окно
    if (transferModal) {
      transferModal.style.display = 'block';
    }
  });
}

// Подтверждение перевода - ПЕРЕПИСАННАЯ ФУНКЦИЯ
function setupConfirmTransferHandler() {
  if (!confirmTransferBtn) {
    console.error('confirmTransferBtn not found');
    return;
  }

  console.log('Setting up confirm transfer handler');
  
  // Удаляем все предыдущие обработчики
  const newConfirmBtn = confirmTransferBtn.cloneNode(true);
  confirmTransferBtn.parentNode.replaceChild(newConfirmBtn, confirmTransferBtn);
  confirmTransferBtn = newConfirmBtn;

  confirmTransferBtn.addEventListener('click', function confirmTransferHandler() {
    console.log('Confirm transfer button clicked');
    
    const fromAccount = fromAccountInput ? fromAccountInput.value.trim() : '';
    const toAccount = toAccountInput ? toAccountInput.value.trim() : '';
    const amount = transferAmountInput ? parseInt(transferAmountInput.value) : 0;
    
    console.log('Transfer details:', { fromAccount, toAccount, amount });
    console.log('Transfer modal state before:', transferModal ? transferModal.style.display : 'modal not found');
    
    // Проверяем наличие счетов
    if (!fromAccount || !toAccount || amount <= 0) {
      alert('Ошибка: некорректные данные перевода');
      return;
    }
    
    // Находим счета
    const fromAccountData = accounts.find(acc => acc.accountNumber === fromAccount);
    const toAccountData = accounts.find(acc => acc.accountNumber === toAccount);
    
    console.log('Account data:', { fromAccountData, toAccountData });
    
    if (!fromAccountData) {
      alert('Счет отправителя не найден');
      return;
    }
    
    if (!toAccountData) {
      alert('Счет получателя не найден');
      return;
    }
    
    // Проверяем достаточность средств
    if (fromAccountData.balance < amount) {
      alert('Недостаточно средств на счете отправителя');
      return;
    }
    
    // Выполняем перевод
    fromAccountData.balance -= amount;
    toAccountData.balance += amount;
    
    // Обновляем отображение балансов
    updateAccountBalance(fromAccountData.id, fromAccountData.balance);
    updateAccountBalance(toAccountData.id, toAccountData.balance);
    
    // Добавляем в историю
    addToHistory({
      type: 'transfer',
      description: 'Перевод между счетами',
      fromAccount: fromAccount,
      toAccount: toAccount,
      amount: -amount,
      bank: fromAccountData.bank
    });
    
    // ЗАКРЫВАЕМ МОДАЛЬНОЕ ОКНО - ГАРАНТИРОВАННО
    if (transferModal) {
      console.log('Closing transfer modal');
      transferModal.style.display = 'none';
      transferModal.setAttribute('aria-hidden', 'true');
    } else {
      console.error('Transfer modal not found for closing');
    }
    
    // Сбрасываем форму
    resetTransferForm();
    
    // Показываем уведомление об успехе
    alert('Перевод выполнен успешно!');
    
    // Увеличиваем счетчик переводов
    incrementTransfersCount();
    
    console.log('Transfer completed successfully');
    console.log('Transfer modal state after:', transferModal ? transferModal.style.display : 'modal not found');
  });
}

// Функция для принудительного закрытия модального окна переводов
function closeTransferModal() {
  if (transferModal) {
    console.log('Force closing transfer modal');
    transferModal.style.display = 'none';
    transferModal.setAttribute('aria-hidden', 'true');
    
    // Добавляем дополнительные способы скрытия
    transferModal.classList.remove('show');
    transferModal.classList.add('hide');
    
    // Убедимся, что нет inline стилей, которые могут мешать
    transferModal.removeAttribute('style');
    
    return true;
  }
  return false;
}

// Отмена перевода
function setupCancelTransferHandler() {
  if (!cancelTransferBtn) return;

  // Удаляем старые обработчики
  const newCancelBtn = cancelTransferBtn.cloneNode(true);
  cancelTransferBtn.parentNode.replaceChild(newCancelBtn, cancelTransferBtn);
  cancelTransferBtn = newCancelBtn;

  cancelTransferBtn.addEventListener('click', function() {
    console.log('Cancel transfer button clicked');
    closeTransferModal();
  });
}

// Закрытие модального окна переводов при клике вне его
function setupTransferModalCloseHandler() {
  // Удаляем старые обработчики
  window.removeEventListener('click', transferModalClickHandler);
  
  function transferModalClickHandler(event) {
    if (event.target === transferModal) {
      console.log('Closing modal by outside click');
      closeTransferModal();
    }
  }
  
  window.addEventListener('click', transferModalClickHandler);
}

// Сброс формы перевода
function resetTransferForm() {
  if (fromAccountInput) fromAccountInput.value = '';
  if (toAccountInput) toAccountInput.value = '';
  if (transferAmountInput) transferAmountInput.value = '';
  if (transferBtn) transferBtn.disabled = true;
  
  // Очищаем ошибки
  const fromAccountError = document.getElementById('fromAccountError');
  const toAccountError = document.getElementById('toAccountError');
  const amountError = document.getElementById('amountError');
  const availableBalanceElement = document.getElementById('availableBalance');
  
  if (fromAccountError) fromAccountError.textContent = '';
  if (toAccountError) toAccountError.textContent = '';
  if (amountError) amountError.textContent = '';
  if (availableBalanceElement) availableBalanceElement.textContent = '0';
}

// Инициализация переводов
function initializeTransfers() {
  initializeTransferElements();
  setupTransferEventListeners();
  setupTransferButtonHandler();
  setupConfirmTransferHandler();
  setupCancelTransferHandler();
  setupTransferModalCloseHandler();
  
  // Добавляем глобальную функцию для отладки
  window.closeAllModals = function() {
    closeTransferModal();
    if (productModal) {
      productModal.style.display = 'none';
    }
    console.log('All modals closed');
  };
}

// Переменные для продуктов
let productTypeSelect, productAmountInput, createProductBtn;
let productsGrid, noProductsText, minAmountSpan;
let productModal, productForm, openProductBtn, closeModal;
let accountSelection, sourceAccountSelect, accountBalanceText;

const minAmounts = {
  creditCard: 50000,
  deposit: 10000,
  debitCard: 10000
};

// Хранилище продуктов
let products = [];

// Функция валидации формы продуктов
function validateProductForm() {
  if (!productTypeSelect || !productAmountInput || !createProductBtn) {
    return;
  }

  const selectedProduct = productTypeSelect.value;
  const amount = parseInt(productAmountInput.value) || 0;
  const minAmount = minAmounts[selectedProduct] || 0;
  
  let isValid = selectedProduct && amount >= minAmount;
  
  // Дополнительная валидация для вклада и дебетовой карты
  if (selectedProduct === 'deposit' || selectedProduct === 'debitCard') {
    const sourceAccountId = sourceAccountSelect.value;
    const sourceAccount = getAccountById(sourceAccountId);
    
    if (!sourceAccount || sourceAccount.balance < amount) {
      isValid = false;
    }
  }
  
  createProductBtn.disabled = !isValid;
}

// Функция создания продукта
function createProduct(productType, amount, sourceAccountId = null) {
  const productNames = {
    creditCard: 'Кредитная карта',
    deposit: 'Вклад',
    debitCard: 'Дебетовая карта'
  };
  
  const productRates = {
    creditCard: '16%',
    deposit: '12%',
    debitCard: '0%'
  };
  
  const productName = productNames[productType];
  const productRate = productRates[productType];
  
  // Создаем ID продукта
  const productId = 'product_' + Date.now();
  
  // Обработка разных типов продуктов
  let newAccount = null;
  
  if (productType === 'creditCard') {
    // Для кредитной карты создаем новый счет
    newAccount = createProductAccount(productName, amount, productId);
  } else if (productType === 'debitCard') {
    // Для дебетовой карты создаем новый счет и списываем средства
    newAccount = createProductAccount(productName, amount, productId);
    if (sourceAccountId) {
      const sourceAccount = getAccountById(sourceAccountId);
      if (sourceAccount) {
        sourceAccount.balance -= amount;
        updateAccountBalance(sourceAccount.id, sourceAccount.balance);
        
        // Добавляем в историю
        addToHistory({
          type: 'product',
          description: `Открытие ${productName}`,
          fromAccount: sourceAccount.accountNumber,
          toAccount: newAccount.accountNumber,
          amount: -amount,
          bank: sourceAccount.bank
        });
      }
    }
  } else if (productType === 'deposit') {
    // Для вклада списываем средства с выбранного счета
    if (sourceAccountId) {
      const sourceAccount = getAccountById(sourceAccountId);
      if (sourceAccount) {
        sourceAccount.balance -= amount;
        updateAccountBalance(sourceAccount.id, sourceAccount.balance);
        
        // Добавляем в историю
        addToHistory({
          type: 'product',
          description: `Открытие ${productName}`,
          account: sourceAccount.accountNumber,
          amount: -amount,
          bank: sourceAccount.bank
        });
      }
    }
  }
   // Создаем карточку продукта
  const productCard = document.createElement('div');
  productCard.className = 'product-card';
  productCard.dataset.productId = productId;
  productCard.innerHTML = `
    <div class="product-header">
      <div class="product-name">${productName}</div>
      <button class="close-product-btn" data-product="${productId}">Закрыть</button>
    </div>
    <div class="product-amount">${amount.toLocaleString()} ₽</div>
    <div class="product-details">Ставка: ${productRate}</div>
    <div class="product-details">Тип: ${productName}</div>
    ${newAccount ? `<div class="product-details">Счет: ${newAccount.formattedAccountNumber}</div>` : ''}
    <div class="product-details">ID: ${productId.slice(-6)}</div>
  `;
  
  // Добавляем в сетку продуктов
  if (productsGrid) {
    productsGrid.appendChild(productCard);
  }
  
  // Сохраняем продукт
  const product = {
    id: productId,
    type: productType,
    name: productName,
    amount: amount,
    rate: productRate,
    accountId: newAccount ? newAccount.id : null,
    sourceAccountId: sourceAccountId,
    element: productCard
  };
  
  products.push(product);
  
  // Добавляем обработчик для кнопки закрытия
  const closeBtn = productCard.querySelector('.close-product-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleCloseProduct(productId);
    });
  }
  
  // Скрываем текст "нет активных продуктов"
  if (noProductsText) {
    noProductsText.style.display = 'none';
  }
  
  // Обновляем прогресс квеста (если есть квест на кредитную карту)
  if (productType === 'creditCard') {
    updateQuestProgress('product', 1);
  }
}

// Создание счета для продукта
function createProductAccount(bankName, amount, productId) {
  const accountNumber = generateAccountNumber();
  const formattedAccountNumber = formatAccountNumber(accountNumber);
  
  const accountId = 'account_product_' + productId;
  
  const newCard = document.createElement('div');
  newCard.id = accountId;
  newCard.className = 'card product-account';
  newCard.innerHTML = `
    <div class="card-header">
      <span class="text-bank text-heading-8_635">${bankName}</span>
      <button class="close-account-btn" data-account="${accountId}">Закрыть</button>
    </div>
    <span class="text-main">${amount.toLocaleString()} ₽</span>
    <span class="text-9_282 text-subheading-5_251">номер: ${formattedAccountNumber}</span>
    <div class="account-product-info">Связан с продуктом</div>
  `;
  
  const accountsGrid = document.querySelector('#accountsGrid');
  if (accountsGrid) {
    accountsGrid.appendChild(newCard);
  }
  
  const newAccount = {
    id: accountId,
    bank: bankName,
    balance: amount,
    accountNumber: accountNumber,
    formattedAccountNumber: formattedAccountNumber,
    element: newCard,
    classes: ["card", "product-account"],
    productId: productId
  };
  
  accounts.push(newAccount);
  updateInfoBlock();
  
  // Добавляем обработчик для кнопки закрытия
  const closeBtn = newCard.querySelector('.close-account-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleCloseProductAccount(accountId);
    });
  }
  
  // Обновляем подсказки для переводов
  updateAccountsDataList();
  
  return newAccount;
}

// Закрытие счета продукта
function handleCloseProductAccount(accountId) {
  const account = getAccountById(accountId);
  if (!account || !account.productId) return;
  
  // Находим связанный продукт
  const product = products.find(p => p.id === account.productId);
  if (product) {
    showProductCloseModal(product);
  }
}

// Закрытие продукта
function handleCloseProduct(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  showProductCloseModal(product);
}

// Модальное окно закрытия продукта
function showProductCloseModal(product) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay product-close-modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>Закрытие продукта</h2>
        <span class="close-modal">&times;</span>
      </div>
      <div class="modal-body">
        <p>Вы собираетесь закрыть продукт:</p>
        <div class="product-info">
          <div class="info-row">
            <span class="info-label">Продукт:</span>
            <span class="info-value">${product.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Сумма:</span>
            <span class="info-value">${product.amount.toLocaleString()} ₽</span>
          </div>
        </div>
        
        ${product.accountId ? `
        <div class="transfer-section">
          <h3>Что делать с остатком средств?</h3>
          <select id="productTransferAccount" class="form-select">
            <option value="">Выберите счет для перевода</option>
          </select>
        </div>
        ` : `
        <div class="warning-message">
          <p>⚠️ При закрытии этого продукта средства будут возвращены на исходный счет.</p>
        </div>
        `}
      </div>
      <div class="modal-footer">
        <button id="confirmCloseProduct" class="btn-transfer-close">
          ${product.accountId ? 'Перевести и закрыть' : 'Закрыть продукт'}
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Заполняем список счетов для перевода (если есть связанный счет)
  if (product.accountId) {
    populateProductTransferAccounts(product.accountId);
  }
  
  // Обработчики событий
  modal.querySelector('.close-modal').addEventListener('click', () => {
    modal.remove();
  });
  
  modal.querySelector('#confirmCloseProduct').addEventListener('click', () => {
    closeProduct(product.id, modal);
  });
  
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// Заполнение списка счетов для перевода при закрытии продукта
function populateProductTransferAccounts(excludeAccountId) {
  const transferSelect = document.getElementById('productTransferAccount');
  if (!transferSelect) return;
  
  transferSelect.innerHTML = '<option value="">Выберите счет для перевода</option>';
  
  accounts.forEach(account => {
    if (account.id !== excludeAccountId && !account.productId) {
      const option = document.createElement('option');
      option.value = account.id;
      option.textContent = `${account.bank} (${account.formattedAccountNumber}) - ${account.balance.toLocaleString()} ₽`;
      transferSelect.appendChild(option);
    }
  });
}

// Закрытие продукта
function closeProduct(productId, modal) {
  const productIndex = products.findIndex(p => p.id === productId);
  if (productIndex === -1) return;
  
  const product = products[productIndex];
  
  // Обработка возврата средств
  if (product.type === 'deposit') {
    // Возвращаем средства на исходный счет
    const sourceAccount = getAccountById(product.sourceAccountId);
    if (sourceAccount) {
      sourceAccount.balance += product.amount;
      updateAccountBalance(sourceAccount.id, sourceAccount.balance);
      
      addToHistory({
        type: 'product',
        description: `Закрытие ${product.name}`,
        account: sourceAccount.accountNumber,
        amount: product.amount,
        bank: sourceAccount.bank
      });
    }
  } else if (product.accountId) {
    // Для продуктов со счетом переводим средства
    const productAccount = getAccountById(product.accountId);
    const transferAccountId = document.getElementById('productTransferAccount')?.value;
    
    if (productAccount && transferAccountId) {
      const targetAccount = getAccountById(transferAccountId);
      if (targetAccount) {
        targetAccount.balance += productAccount.balance;
        updateAccountBalance(targetAccount.id, targetAccount.balance);
        
        addToHistory({
          type: 'product',
          description: `Закрытие ${product.name}`,
          fromAccount: productAccount.accountNumber,
          toAccount: targetAccount.accountNumber,
          amount: -productAccount.balance,
          bank: productAccount.bank
        });
      }
    }
    
    // Закрываем счет продукта
    closeAccount(product.accountId);
  }
  
  // Удаляем элемент продукта
  if (product.element && product.element.parentNode) {
    product.element.remove();
  }
  
  // Удаляем из массива продуктов
  products.splice(productIndex, 1);
  
  // Показываем текст "нет продуктов" если нужно
  if (products.length === 0 && noProductsText) {
    noProductsText.style.display = 'block';
  }
  
  // Закрываем модальное окно
  modal.remove();
  
  alert('Продукт успешно закрыт!');
}

// Инициализация элементов продуктов
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
  closeModal = document.querySelector('.close-modal');
  accountSelection = document.getElementById('accountSelection');
  sourceAccountSelect = document.getElementById('sourceAccount');
  accountBalanceText = document.getElementById('accountBalance');
}

// Обновленная функция для заполнения счетов
function populateSourceAccounts() {
  if (!sourceAccountSelect) return;
  
  sourceAccountSelect.innerHTML = '<option value="" selected disabled>Выберите счет</option>';
  
  accounts.forEach(account => {
    if (!account.productId) { // Не показываем счета продуктов
      const option = document.createElement('option');
      option.value = account.id;
      option.textContent = `${account.bank} (${account.formattedAccountNumber}) - ${account.balance.toLocaleString()} ₽`;
      sourceAccountSelect.appendChild(option);
    }
  });
}

// Обновление баланса при выборе счета
function updateAccountBalanceDisplay() {
  const selectedAccountId = sourceAccountSelect.value;
  const selectedAccount = getAccountById(selectedAccountId);
  
  if (accountBalanceText && selectedAccount) {
    accountBalanceText.textContent = `Доступно: ${selectedAccount.balance.toLocaleString()} ₽`;
    accountBalanceText.className = 'form-help';
    
    // Проверяем достаточно ли средств
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

// Инициализация обработчиков продуктов
function setupProductEventListeners() {
  // Открытие модального окна
  if (openProductBtn) {
    openProductBtn.addEventListener('click', () => {
      if (productModal) {
        productModal.style.display = 'block';
        populateSourceAccounts();
      }
    });
  }

  // Закрытие модального окна
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      if (productModal) {
        productModal.style.display = 'none';
        if (productForm) productForm.reset();
        if (createProductBtn) createProductBtn.disabled = true;
        if (minAmountSpan) minAmountSpan.textContent = '0';
        if (accountSelection) accountSelection.style.display = 'none';
      }
    });
  }

  // Изменение типа продукта
  if (productTypeSelect) {
    productTypeSelect.addEventListener('change', () => {
      const selectedProduct = productTypeSelect.value;
      const minAmount = minAmounts[selectedProduct] || 0;
      
      // Обновляем минимальную сумму
      if (minAmountSpan) {
        minAmountSpan.textContent = minAmount.toLocaleString();
      }
      if (productAmountInput) {
        productAmountInput.min = minAmount;
        productAmountInput.placeholder = `Минимум ${minAmount.toLocaleString()} руб`;
      }
      
      // Показываем/скрываем выбор счета
      if (accountSelection) {
        if (selectedProduct === 'deposit' || selectedProduct === 'debitCard') {
          accountSelection.style.display = 'block';
          populateSourceAccounts();
        } else {
          accountSelection.style.display = 'none';
        }
      }
      
      validateProductForm();
    });
  }

  // Ввод суммы
  if (productAmountInput) {
    productAmountInput.addEventListener('input', validateProductForm);
  }

  // Выбор счета
  if (sourceAccountSelect) {
    sourceAccountSelect.addEventListener('change', () => {
      updateAccountBalanceDisplay();
      validateProductForm();
    });
  }

  // Отправка формы
  if (productForm) {
    productForm.addEventListener('submit', (event) => {
      event.preventDefault();
      
      const selectedProduct = productTypeSelect.value;
      const amount = parseInt(productAmountInput.value);
      const sourceAccountId = sourceAccountSelect.value;
      
      // Создаем продукт
      createProduct(selectedProduct, amount, sourceAccountId);
      
      // Закрываем модальное окно и сбрасываем форму
      if (productModal) {
        productModal.style.display = 'none';
      }
      productForm.reset();
      createProductBtn.disabled = true;
      
      // Сбрасываем минимальную сумму
      if (minAmountSpan) {
        minAmountSpan.textContent = '0';
      }
      
      // Скрываем выбор счета
      if (accountSelection) {
        accountSelection.style.display = 'none';
      }
    });
  }

  // Закрытие модального окна при клике вне его
  window.addEventListener('click', (event) => {
    if (event.target === productModal) {
      productModal.style.display = 'none';
      if (productForm) productForm.reset();
      if (createProductBtn) createProductBtn.disabled = true;
      if (minAmountSpan) minAmountSpan.textContent = '0';
      if (accountSelection) accountSelection.style.display = 'none';
    }
  });
}

// Инициализация продуктов
function initializeProducts() {
  initializeProductElements();
  setupProductEventListeners();
}

// История операций
let operationsHistory = [];
let currentDisplayCount = 5;
const operationsPerPage = 5;

// Инициализация истории операций
function initializeHistory() {
  // Создаем начальные тестовые данные
  createSampleHistory();
  
  // Инициализируем фильтры
  initializeHistoryFilters();
  
  // Устанавливаем начальный текст для кнопки
  const loadMoreText = document.getElementById('13_664');
  if (loadMoreText) {
    loadMoreText.textContent = 'Показано 0 из 0 операций';
  }
  
  // Отображаем историю
  displayHistory();
  
  // Настраиваем кнопку "Загрузить еще"
  setupLoadMoreButton();
}

// Создание тестовых данных истории
function createSampleHistory() {
  const sampleOperations = [
    {
      id: 1,
      date: new Date('2024-01-15T10:30:00'),
      type: 'transfer',
      description: 'Перевод между счетами',
      fromAccount: '4000123456781234',
      toAccount: '4000987654321098',
      amount: -5000,
      bank: 'VBank'
    },
    {
      id: 2,
      date: new Date('2024-01-14T14:20:00'),
      type: 'product',
      description: 'Открытие вклада',
      account: '4000123456781234',
      amount: 10000,
      bank: 'VBank'
    },
    {
      id: 3,
      date: new Date('2024-01-13T09:15:00'),
      type: 'transfer',
      description: 'Перевод на карту',
      fromAccount: '4000123456781234',
      toAccount: '4000111122223333',
      amount: -15000,
      bank: 'VBank'
    },
    {
      id: 4,
      date: new Date('2024-01-12T16:45:00'),
      type: 'account',
      description: 'Открытие счета',
      account: '4000555566667777',
      amount: 0,
      bank: 'ABank'
    },
    {
      id: 5,
      date: new Date('2024-01-11T11:20:00'),
      type: 'product',
      description: 'Кредитная карта',
      account: '4000123456781234',
      amount: 50000,
      bank: 'VBank'
    }
  ];

  operationsHistory = sampleOperations;
}

// Инициализация фильтров истории
function initializeHistoryFilters() {
  const accountFilter = document.getElementById('accountFilter');
  const bankFilter = document.getElementById('bankFilter');
  const periodFilter = document.getElementById('periodFilter');

  // Заполняем фильтр счетов
  updateAccountFilter();

  // Настраиваем обработчики изменений фильтров
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

// Обновление фильтра счетов
function updateAccountFilter() {
  const accountFilter = document.getElementById('accountFilter');
  if (!accountFilter) return;

  // Сохраняем текущее значение
  const currentValue = accountFilter.value;

  // Очищаем опции (кроме "Все счета")
  accountFilter.innerHTML = '<option value="all">Все счета</option>';

  // Добавляем счета из accounts
  accounts.forEach(account => {
    const option = document.createElement('option');
    option.value = account.accountNumber;
    option.textContent = `${account.bank} (${account.formattedAccountNumber})`;
    accountFilter.appendChild(option);
  });

  // Восстанавливаем значение если оно еще существует
  if (currentValue && Array.from(accountFilter.options).some(opt => opt.value === currentValue)) {
    accountFilter.value = currentValue;
  }
}

// Отображение истории операций
function displayHistory() {
  const historyContainer = document.getElementById('historyContainer');
  if (!historyContainer) return;

  // Получаем значения фильтров
  const accountFilter = document.getElementById('accountFilter')?.value || 'all';
  const bankFilter = document.getElementById('bankFilter')?.value || 'all';
  const periodFilter = document.getElementById('periodFilter')?.value || 'all';

  // Фильтруем операции
  let filteredOperations = operationsHistory.filter(operation => {
    // Фильтр по счету
    if (accountFilter !== 'all') {
      const hasFromAccount = operation.fromAccount === accountFilter;
      const hasToAccount = operation.toAccount === accountFilter;
      const hasAccount = operation.account === accountFilter;
      if (!hasFromAccount && !hasToAccount && !hasAccount) return false;
    }

    // Фильтр по банку
    if (bankFilter !== 'all' && operation.bank !== bankFilter) {
      return false;
    }

    // Фильтр по периоду
    if (periodFilter !== 'all') {
      const now = new Date();
      const operationDate = new Date(operation.date);
      
      switch (periodFilter) {
        case 'today':
          return operationDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return operationDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return operationDate >= monthAgo;
        case 'year':
          const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          return operationDate >= yearAgo;
      }
    }

    return true;
  });

  // Сортируем по дате (новые сверху)
  filteredOperations.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Отображаем операции
  renderHistory(filteredOperations);
}

// Рендер истории операций
// Рендер истории операций
function renderHistory(operations) {
  const historyContainer = document.getElementById('historyContainer');
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  const loadMoreText = document.getElementById('13_664'); // Получаем span напрямую
  
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

  // Отображаем только currentDisplayCount операций
  const operationsToShow = operations.slice(0, currentDisplayCount);

  operationsToShow.forEach(operation => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';

    // Форматируем дату
    const operationDate = new Date(operation.date);
    const dateStr = operationDate.toLocaleDateString('ru-RU');
    const timeStr = operationDate.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    // Определяем счет для отображения
    let accountDisplay = '';
    if (operation.fromAccount && operation.toAccount) {
      // Перевод
      const fromAccount = accounts.find(acc => acc.accountNumber === operation.fromAccount);
      const toAccount = accounts.find(acc => acc.accountNumber === operation.toAccount);
      accountDisplay = `${fromAccount?.formattedAccountNumber} → ${toAccount?.formattedAccountNumber}`;
    } else if (operation.account) {
      // Продукт или счет
      const account = accounts.find(acc => acc.accountNumber === operation.account);
      accountDisplay = account?.formattedAccountNumber || operation.account;
    }

    // Определяем класс для суммы
    let amountClass = 'neutral';
    if (operation.amount > 0) amountClass = 'positive';
    else if (operation.amount < 0) amountClass = 'negative';

    historyItem.innerHTML = `
      <div class="history-date">
        <span class="history-date-main">${dateStr}</span>
        <span class="history-date-time">${timeStr}</span>
      </div>
      <span class="history-description">${operation.description}</span>
      <span class="history-account">${accountDisplay}</span>
      <span class="history-amount ${amountClass}">${operation.amount > 0 ? '+' : ''}${operation.amount.toLocaleString()} ₽</span>
    `;

    historyContainer.appendChild(historyItem);
  });

  // Обновляем кнопку и текст
  const totalOperations = operations.length;
  const shownOperations = Math.min(currentDisplayCount, totalOperations);
  
  if (loadMoreBtn) {
    loadMoreBtn.disabled = shownOperations >= totalOperations;
  }
  
  if (loadMoreText) {
    loadMoreText.textContent = `Показано ${shownOperations} из ${totalOperations} операций`;
  }
}

// Настройка кнопки "Загрузить еще"
function setupLoadMoreButton() {
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      currentDisplayCount += operationsPerPage;
      displayHistory();
    });
  }
}

// Функция для добавления новой операции в историю
function addToHistory(operation) {
  const newOperation = {
    id: operationsHistory.length + 1,
    date: new Date(),
    ...operation
  };
  
  operationsHistory.unshift(newOperation); // Добавляем в начало
  currentDisplayCount = 5; // Сбрасываем счетчик отображения
  displayHistory(); // Обновляем отображение
}


// Данные для квестов
let questData = {
    activePoints: 0,
    currentFreeQuestIndex: 0,
    isPremium: false,
    freeQuests: [
        { 
            id: 1, 
            description: "Соверши покупку на сумму 10 000₽", 
            prize: "случайный подарок", 
            target: 10000, 
            currentProgress: 10000, 
            completed: false,
            points: 5,
            type: "purchase"
        },
        { 
            id: 2, 
            description: "Открой новый счёт", 
            prize: "50 баллов", 
            target: "new_account", 
            currentProgress: 1, 
            completed: false,
            points: 10,
            type: "account"
        },
        { 
            id: 3, 
            description: "Соверши 3 перевода", 
            prize: "100 ₽", 
            target: "transfers", 
            currentProgress: 3, 
            completed: false,
            points: 15,
            type: "transfer"
        }
    ],
    premiumQuests: [
        { 
            id: 4, 
            description: "Пополни счёт на 5 000₽", 
            prize: "премиум подарок", 
            target: 5000, 
            currentProgress: 5000, 
            completed: false,
            points: 10,
            type: "deposit"
        },
        { 
            id: 5, 
            description: "Пополни счёт на 5 000₽", 
            prize: "премиум подарок", 
            target: 5000, 
            currentProgress: 5000, 
            completed: false,
            points: 10,
            type: "deposit"
        },
        { 
            id: 6, 
            description: "Используй мобильный банк 7 дней", 
            prize: "премиум на месяц", 
            target: "mobile_bank", 
            currentProgress: 7, 
            completed: false,
            points: 20,
            type: "usage"
        },
        { 
            id: 7, 
            description: "Соверши 5 платежей", 
            prize: "300 ₽", 
            target: "payments", 
            currentProgress: 5, 
            completed: false,
            points: 15,
            type: "payment"
        },
        { 
            id: 8, 
            description: "Пополни счёт на 5 000₽", 
            prize: "премиум подарок", 
            target: 5000, 
            currentProgress: 5000, 
            completed: false,
            points: 10,
            type: "deposit"
        },
        { 
            id: 9, 
            description: "Пополни счёт на 5 000₽", 
            prize: "премиум подарок", 
            target: 5000, 
            currentProgress: 5000, 
            completed: false,
            points: 10,
            type: "deposit"
        },
        { 
            id: 10, 
            description: "Пополни счёт на 5 000₽", 
            prize: "премиум подарок", 
            target: 5000, 
            currentProgress: 5000, 
            completed: false,
            points: 10,
            type: "deposit"
        }
    ]
};

// Инициализация квестов
function initializeQuests() {
    setupQuestEventListeners();
    updateQuestDisplay();
    updateActivePointsDisplay();
    hidePremiumBlock(); // Скрываем премиум блок по умолчанию

    // Устанавливаем изначальный фон
    setInitialQuestBackground();

    // Предзагружаем изображения квестов
    preloadQuestImages();
}

// Настройка обработчиков событий
function setupQuestEventListeners() {
// Кнопка "Выполнить"
    const completeBtn = document.getElementById('completeQuestBtn');
    if (completeBtn) {
        completeBtn.addEventListener('click', handleCompleteQuest);
    }
    
    // Кнопка "Купить Premium"
    const buyPremiumBtn = document.getElementById('buyPremiumBtn');
    if (buyPremiumBtn) {
        buyPremiumBtn.addEventListener('mouseenter', showPremiumBlock);
        buyPremiumBtn.addEventListener('mouseleave', hidePremiumBlock);
        buyPremiumBtn.addEventListener('click', showPremiumModal);
    }
}

// Обновление отображения квеста
function updateQuestDisplay() {
    const currentQuest = getCurrentQuest();
    
    if (!currentQuest) {
        // Если квестов нет, показываем сообщение
        const questDescription = document.getElementById('40_209');
        const progressText = document.getElementById('40_178');
        const prizeText = document.getElementById('questPrizeText');
        const completeBtn = document.getElementById('completeQuestBtn');
        
        if (questDescription) {
            questDescription.textContent = questData.isPremium 
                ? "Все премиум квесты выполнены!" 
                : "Все бесплатные квесты выполнены!";
        }
        
        if (progressText) {
            progressText.textContent = questData.isPremium ? "10/10" : "3/3";
        }
        
        if (prizeText) {
            prizeText.textContent = "Отличная работа!";
        }
        
        if (completeBtn) {
            completeBtn.style.display = 'none';
        }
        
        // Показываем блок премиум, если пользователь не премиум
        if (!questData.isPremium) {
            showPremiumBlock();
        }
        
        return;
    }
    
    // Обновляем описание квеста
    const questDescription = document.getElementById('40_209');
    if (questDescription) {
        questDescription.textContent = currentQuest.description;
    }
    
    // Обновляем прогресс
    updateQuestProgressBar(currentQuest);
    
    // Обновляем приз
    const prizeText = document.getElementById('questPrizeText');
    if (prizeText) {
        prizeText.textContent = `Приз: ${currentQuest.prize}`;
    }
    
    // Показываем кнопку выполнения
    const completeBtn = document.getElementById('completeQuestBtn');
    if (completeBtn) {
        completeBtn.style.display = 'block';
    }
}

// Показ сообщения когда квестов нет
function showNoQuestsMessage() {
    const questDescription = document.getElementById('40_209');
    const progressText = document.getElementById('40_178');
    const prizeText = document.getElementById('questPrizeText');
    const completeBtn = document.getElementById('completeQuestBtn');
    const progressBar = document.querySelector('.rectangle-40_177.quest-progress-bar');
    
    if (questDescription) {
        questDescription.textContent = questData.isPremium 
            ? "Все премиум квесты выполнены!" 
            : "Все бесплатные квесты выполнены!";
    }
    
    if (progressText) {
        progressText.textContent = questData.isPremium ? "10/10" : "3/3";
    }
    
    if (prizeText) {
        prizeText.textContent = "Отличная работа!";
    }
    
    if (completeBtn) {
        completeBtn.style.display = 'none';
    }
    
    if (progressBar) {
        progressBar.style.width = '100%';
    }
    
    // Показываем блок премиум, если пользователь не премиум
    if (!questData.isPremium) {
        showPremiumBlockPermanent();
    }
}

// Расчет процента прогресса
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

// Получение текста прогресса
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

// Обновление очков активности
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
            
            // Меняем цвет прогресс-бара в зависимости от уровня
            if (questData.activePoints >= 100) {
                progressFill.style.background = 'linear-gradient(90deg, #FFD700, #FFA500)'; // Золотой
            } else if (questData.activePoints >= 50) {
                progressFill.style.background = 'linear-gradient(90deg, #C0C0C0, #A0A0A0)'; // Серебряный
            } else {
                progressFill.style.background = 'linear-gradient(90deg, #CD7F32, #A0522D)'; // Бронзовый
            }
        }
        
        if (levelText) {
            const levelInfo = getLevelInfo(questData.activePoints);
            levelText.textContent = `Уровень: ${levelInfo.level}`;
            levelText.className = `points-level ${levelInfo.level.toLowerCase()}`;
        }
    }
}

// Функция для получения информации об уровне
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

// Функция для получения прогресса до следующего уровня
function getNextLevelProgress(points) {
    const currentLevel = getLevelInfo(points);
    
    if (currentLevel.level === 'Золотой') {
        return {
            nextLevel: null,
            pointsNeeded: 0,
            progressPercent: 100
        };
    }
    
    const nextLevelMin = currentLevel.maxPoints + 1;
    const pointsInCurrentLevel = points - currentLevel.minPoints;
    const totalPointsInLevel = currentLevel.maxPoints - currentLevel.minPoints + 1;
    const progressPercent = (pointsInCurrentLevel / totalPointsInLevel) * 100;
    
    let nextLevelName = '';
    if (currentLevel.level === 'Бронзовый') {
        nextLevelName = 'Серебряный';
    } else if (currentLevel.level === 'Серебряный') {
        nextLevelName = 'Золотой';
    }
    
    return {
        nextLevel: nextLevelName,
        pointsNeeded: nextLevelMin - points,
        progressPercent: Math.min(progressPercent, 100)
    };
}


// Обновление прогресс-бара квеста
function updateQuestProgressBar(quest) {
    const progressText = document.getElementById('40_178');
    const progressBar = document.querySelector('.rectangle-40_177.quest-progress-bar');
    
    if (!progressText || !progressBar) return;
    
    const progressValue = calculateProgressPercent(quest);
    const progressTextValue = getProgressText(quest);
    
    // Обновляем текст прогресса
    progressText.textContent = progressTextValue;
    
    // Обновляем прогресс-бар
    progressBar.style.width = `${progressValue}%`;
}

// Обновляем стили для уведомлений о прогрессе
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

// Добавляем стили для уведомлений
const styleSheet = document.createElement('style');
styleSheet.textContent = progressNotificationStyles;
document.head.appendChild(styleSheet);

// Получение текущего квеста
function getCurrentQuest() {
    if (questData.isPremium) {
        // Для премиум пользователей ищем первый невыполненный квест
        const activeQuest = questData.premiumQuests.find(q => !q.completed);
        return activeQuest || null;
    } else {
        // Для бесплатных пользователей используем индекс
        if (questData.currentFreeQuestIndex < questData.freeQuests.length) {
            return questData.freeQuests[questData.currentFreeQuestIndex];
        }
        return null;
    }
}

// Показ/скрытие блока Premium
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

// Постоянное отображение блока Premium (когда квесты закончились)
function showPremiumBlockPermanent() {
    const premiumBlock = document.getElementById('11_927');
    if (premiumBlock && !questData.isPremium) {
        premiumBlock.style.display = 'block';
    }
}

// Обработка выполнения квеста
function handleCompleteQuest() {
 const currentQuest = getCurrentQuest();
    
    if (!currentQuest) {
        showAllQuestsCompletedModal();
        return;
    }
    
    const isCompleted = checkQuestCompletion(currentQuest);
    
    if (isCompleted) {
        showQuestCompletedModal(currentQuest);
    } else {
        showQuestNotCompletedModal(currentQuest);
    }
}

// Проверка выполнения квеста
function checkQuestCompletion(quest) {
if (typeof quest.target === 'number') {
        return quest.currentProgress >= quest.target;
    } else {
        switch (quest.target) {
            case 'new_account':
                return accounts.length > 1;
            case 'transfers':
                return quest.currentProgress >= 3;
            case 'credit_card':
                // Здесь можно добавить проверку наличия кредитной карты
                return false;
            case 'mobile_bank':
                return quest.currentProgress >= 7;
            case 'payments':
                return quest.currentProgress >= 5;
            case 'referral':
                return quest.completed;
            case 'autopayment':
                return quest.completed;
            case 'all_services':
                return quest.currentProgress >= 5;
            default:
                return false;
        }
    }
}

// Модальное окно "Квест выполнен"
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

// Модальное окно "Квест не выполнен"
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

// Завершение квеста
function completeQuest(quest) {
    if (!quest) return;
    
    quest.completed = true;
    questData.activePoints += quest.points;
    
    // Обновляем фон при выполнении квеста
    updateQuestBackground(quest);
    
    // Переходим к следующему квесту
    if (questData.isPremium) {
        // Для премиум пользователей просто отмечаем квест выполненным
        // Следующий квест будет выбран автоматически в getCurrentQuest()
        console.log('Премиум квест выполнен, ищем следующий...');
    } else {
        // Для бесплатных пользователей увеличиваем индекс
        questData.currentFreeQuestIndex++;
        
        // Если все бесплатные квесты выполнены, показываем предложение премиум
        if (questData.currentFreeQuestIndex >= questData.freeQuests.length) {
            console.log('Все бесплатные квесты выполнены! Предлагаем премиум...');
            // Не сбрасываем квесты, а показываем, что все выполнено
            showAllQuestsCompletedModal();
            return;
        }
    }
    
    updateQuestDisplay();
    updateActivePointsDisplay();
}

let currentBgIndex = 0;

// Обновление фона при выполнении квеста
function updateQuestBackground(quest) {
    const questContainer = document.getElementById('11_718');
    if (!questContainer) return;
    
    // Ссылки на изображения для каждого квеста
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
    
    // Fallback градиенты на случай проблем с загрузкой
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
    
    // Получаем URL изображения для текущего квеста
    const imageUrl = questImages[quest.id] || questImages[0];
    const fallbackGradient = fallbackGradients[quest.type] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    
    console.log(`Setting permanent quest background for quest ${quest.id}:`, imageUrl);
    
    // Пробуем загрузить изображение
    const img = new Image();
    img.onload = function() {
        console.log('Quest background image loaded successfully - setting permanently');
        
        // Применяем изображение как постоянный фон
        questContainer.style.backgroundImage = `url("${imageUrl}")`;
        questContainer.style.backgroundSize = 'cover';
        questContainer.style.backgroundPosition = 'center';
        questContainer.style.backgroundRepeat = 'no-repeat';
        questContainer.style.transition = 'all 0.8s ease';
        
        // Добавляем анимацию
        questContainer.style.transform = 'scale(1.02)';
        setTimeout(() => {
            questContainer.style.transform = 'scale(1)';
        }, 300);
        
        // Добавляем overlay для лучшей читаемости текста
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
        
        // Находим контент
        const questContent = questContainer.querySelector('.frame-11_720') || 
                             questContainer.querySelector('[id*="11_720"]') ||
                             questContainer.children[1];
        
        if (questContent) {
            questContent.style.position = 'relative';
            questContent.style.zIndex = '2';
        }
        
        // УДАЛЕНО: Таймер возврата к исходному фону
        // Теперь фон останется постоянным до следующего выполнения квеста
    };
    
    img.onerror = function() {
        console.warn('Quest background image failed to load, using fallback gradient permanently');
        
        // Используем градиент как постоянный фон
        questContainer.style.background = fallbackGradient;
        questContainer.style.backgroundImage = '';
        questContainer.style.backgroundSize = 'cover';
        questContainer.style.backgroundPosition = 'center';
        questContainer.style.transition = 'all 0.8s ease';
        
        // Добавляем анимацию
        questContainer.style.transform = 'scale(1.02)';
        setTimeout(() => {
            questContainer.style.transform = 'scale(1)';
        }, 300);
        
        // Убираем overlay если он есть
        const overlay = questContainer.querySelector('.bg-overlay');
        if (overlay && overlay.parentNode) {
            overlay.remove();
        }
        
        // Возвращаем позиционирование
        const questContent = questContainer.querySelector('.frame-11_720') || 
                             questContainer.querySelector('[id*="11_720"]') ||
                             questContainer.children[1];
        
        if (questContent) {
            questContent.style.position = '';
            questContent.style.zIndex = '';
        }
        
        // УДАЛЕНО: Таймер возврата к исходному фону
    };
    
    // Начинаем загрузку
    img.src = imageUrl;
    
    // Устанавливаем таймаут для загрузки изображения
    setTimeout(() => {
        if (!img.complete && img.naturalWidth === 0) {
            console.warn('Quest background image loading timeout, using fallback permanently');
            questContainer.style.background = fallbackGradient;
            questContainer.style.backgroundImage = '';
        }
    }, 2000);
}

// Предзагрузка изображений квестов
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

// Модальное окно "Все квесты выполнены" в стиле Premium блока
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
    
    // Заполняем счета при открытии
    populatePaymentAccounts();
    
    // Обработчики событий для выбора счета
    const paymentAccountSelect = document.getElementById('paymentSourceAccount');
    if (paymentAccountSelect) {
        paymentAccountSelect.addEventListener('change', updatePaymentAccountBalance);
    }
    
    // ОБРАБОТЧИК ОПЛАТЫ - ИСПРАВЛЕННЫЙ
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

// Заполнение списка счетов для оплаты
function populatePaymentAccounts() {
    const paymentAccountSelect = document.getElementById('paymentSourceAccount');
    if (!paymentAccountSelect) return;
    
    paymentAccountSelect.innerHTML = '<option value="">Выберите счет</option>';
    
    accounts.forEach(account => {
        if (!account.productId) { // Не показываем счета продуктов
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = `${account.bank} (${account.formattedAccountNumber}) - ${account.balance.toLocaleString()} ₽`;
            paymentAccountSelect.appendChild(option);
        }
    });
    
    // Обновляем отображение баланса
    updatePaymentAccountBalance();
}

// Обновление отображения баланса выбранного счета
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
        
        // Проверяем достаточно ли средств для оплаты (299 ₽)
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

// Обработка оплаты Premium
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
    
    // Проверяем достаточно ли средств
    if (selectedAccount.balance < 299) {
        alert('Недостаточно средств на выбранном счете');
        return;
    }
    
    // Списание средств за Premium
    selectedAccount.balance -= 299;
    updateAccountBalance(selectedAccount.id, selectedAccount.balance);
    
    // Добавляем запись в историю
    addToHistory({
        type: 'premium',
        description: 'Оплата Premium подписки',
        account: selectedAccount.accountNumber,
        amount: -299,
        bank: selectedAccount.bank
    });
    
    // Активируем Premium
    buyPremium();
    
    // Закрываем модальное окно
    modal.remove();
    
    alert('🎉 Premium подписка успешно активирована! Средства списаны со счета.');
}

// Обновленная функция покупки Premium
function buyPremium() {
    questData.isPremium = true;
    alert('🎉 Поздравляем! Вы приобрели Premium подписку!');
    
    // Сбрасываем прогресс премиум квестов при первой покупке
    if (!localStorage.getItem('premiumPurchased')) {
        resetPremiumQuests();
        localStorage.setItem('premiumPurchased', 'true');
    }
    
    updateQuestDisplay();
    hidePremiumBlock();
    
    // Обновляем отображение, чтобы показать премиум квесты
    const currentQuest = getCurrentQuest();
    if (currentQuest) {
        updateQuestProgressBar(currentQuest);
    }
}

// Сброс квестов
function resetFreeQuests() {
    questData.currentFreeQuestIndex = 0;
    questData.freeQuests.forEach(quest => {
        quest.completed = false;
        // Не сбрасываем прогресс, чтобы сохранить достижения пользователя
    });
    console.log('Бесплатные квесты сброшены');
}

// Модальное окно покупки Premium
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

// Вспомогательные функции для модальных окон
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

// Функции обновления прогресса (вызывать из других модулей)
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




// Основная инициализация
function initializeApp() {
    // Сохраняем изначальный счет в хранилище
    accounts.push(initialAccount);
    
    // Инициализация счетов
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

    // Добавляем обработчики для кнопок закрытия существующих счетов
    setupExistingAccountCloseButtons();
    
    // Инициализация закрытия счетов
    initializeCloseAccount();

    console.log('Initializing transfers...');
    // Инициализация переводов
    initializeTransfers();

    // Инициализация продуктов
    initializeProducts();

    // Инициализация истории операций
    initializeHistory();

    // Инициализация квестов
    initializeQuests();

    // Обновляем информационный блок
    updateInfoBlock();
    
    // Обновляем подсказки для счетов
    updateAccountsDataList();
    
    console.log('Приложение инициализировано');
    console.log('Доступные счета:', accounts);
}

// Запуск приложения
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initializeEvents();
    initializeApp();
  });
} else {
  initializeEvents();
  initializeApp();
}