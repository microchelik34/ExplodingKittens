'use strict';

// Константы для типов карт
const CARD_TYPES = {
    DEFUSE: 'defuse',     // Карта обезвреживания
    NOPE: 'nope',         // Карта отмены действия
    ATTACK: 'attack',     // Карта атаки
    SKIP: 'skip',         // Карта пропуска хода
    FAVOR: 'favor',       // Карта просьбы
    SHUFFLE: 'shuffle',   // Карта перемешивания колоды
    FUTURE: 'future',     // Карта предвидения
    CAT: 'cat',           // Кошкокарта
    KITTEN: 'kitten'      // Взрывной котёнок
};

// Класс карты
class Card {
    constructor(type, name) {
        this.type = type;         // Тип карты
        this.name = name;         // Название карты
        this.imageUrl = this.getImageUrl(type); // URL изображения карты
    }

    // Получение URL изображения в зависимости от типа карты
    getImageUrl(type) {
        const imageMap = {
            [CARD_TYPES.DEFUSE]: 'img/defuse.png',
            [CARD_TYPES.NOPE]: 'img/nope.png',
            [CARD_TYPES.ATTACK]: 'img/attack.png',
            [CARD_TYPES.SKIP]: 'img/skip.png',
            [CARD_TYPES.FAVOR]: 'img/favor.png',
            [CARD_TYPES.SHUFFLE]: 'img/shuffle.png',
            [CARD_TYPES.FUTURE]: 'img/future.png',
            [CARD_TYPES.KITTEN]: 'img/kitten.png',
            [CARD_TYPES.CAT]: this.getRandomCatImage()
        };
        return imageMap[type] || 'img/default.png'; // Возвращает путь по умолчанию, если тип неизвестен
    }

    // Случайный выбор изображения для кошкокарты
    getRandomCatImage() {
        const catImages = ['img/cat1.png', 'img/cat2.png', 'img/cat3.png', 'img/cat4.png', 'img/cat5.png'];
        return catImages[Math.floor(Math.random() * catImages.length)];
    }
}

// Класс игрока
class Player {
    constructor(name) {
        this.name = name;          // Имя игрока
        this.hand = [];            // Карты в руке
        this.isActive = true;      // Статус активности игрока
        this.hasDefuse = false;    // Наличие карты обезвреживания
        this.autoNope = false;     // Флаг авто-использования "Неть"
    }

    // Добавление карты в руку
    addCard(card) {
        this.hand.push(card);
        if (card.type === CARD_TYPES.DEFUSE) this.hasDefuse = true;
        card.isNew = true; // Отметка новой карты для анимации
        setTimeout(() => {
            card.isNew = false;
            gameInstance.updateUI(); // Обновление UI после анимации
        }, 500);
    }

    // Удаление карты из руки по индексу
    removeCard(index) {
        const card = this.hand.splice(index, 1)[0];
        if (card.type === CARD_TYPES.DEFUSE) this.hasDefuse = false;
        return card;
    }

    // Проверка наличия карты "Неть" в руке
    hasNope() {
        return this.hand.some(card => card.type === CARD_TYPES.NOPE);
    }
}

// Класс игры
class Game {
    constructor() {
        this.players = [];              // Список игроков
        this.deck = [];                 // Колода карт
        this.discardPile = [];          // Сброс
        this.currentPlayerIndex = 0;    // Индекс текущего игрока
        this.turnsToMake = 1;           // Количество ходов для выполнения
        this.combinationMode = false;   // Режим комбинации кошкокарт
        this.selectedCatCards = [];     // Выбранные кошкокарты
        this.isModalOpen = false;       // Флаг открытого модального окна
        this.isActionTaken = false;     // Флаг выполненного действия
        // Элементы DOM
        this.elements = {
            modal: document.getElementById('card-modal'),
            drawnCard: document.getElementById('drawn-card'),
            playerSelection: document.getElementById('player-selection'),
            availablePlayers: document.getElementById('available-players'),
            playerHand: document.getElementById('player-hand'),
            currentPlayer: document.getElementById('current-player'),
            deckCount: document.getElementById('deck-count'),
            discardPile: document.getElementById('discard-pile'),
            playerList: document.getElementById('player-list'),
            combinationOptions: document.getElementById('combination-options'),
            drawCardBtn: document.getElementById('draw-card'),
            skipTurnBtn: document.getElementById('skip-turn'),
            combineCatsBtn: document.getElementById('combine-cats'),
            customAlert: document.getElementById('custom-alert'),
            customAlertMessage: document.getElementById('custom-alert-message'),
            customAlertClose: document.getElementById('custom-alert-close')
        };
    }

    // Инициализация игры
    init(playerNames) {
        this.players = playerNames.map(name => new Player(name));
        this.shufflePlayers(); // Перемешивание порядка игроков
        this.createDeck();    // Создание колоды
        this.dealCards();     // Раздача карт
        this.isActionTaken = false;
        this.turnsToMake = 1;
        this.updateUI();      // Обновление интерфейса
    }

    // Создание колоды карт
    createDeck() {
        this.deck = [];
        const cardCounts = {
            [CARD_TYPES.NOPE]: 5,
            [CARD_TYPES.ATTACK]: 4,
            [CARD_TYPES.SKIP]: 4,
            [CARD_TYPES.FAVOR]: 4,
            [CARD_TYPES.SHUFFLE]: 4,
            [CARD_TYPES.FUTURE]: 5,
            [CARD_TYPES.CAT]: 20
        };
        Object.entries(cardCounts).forEach(([type, count]) => {
            for (let i = 0; i < count; i++) {
                this.deck.push(new Card(type, this.getCardName(type)));
            }
        });
        this.shuffleDeck();
    }

    // Получение названия карты по её типу
    getCardName(type) {
        const names = {
            [CARD_TYPES.DEFUSE]: 'Обезвредить',
            [CARD_TYPES.NOPE]: 'Неть',
            [CARD_TYPES.ATTACK]: 'Нападай',
            [CARD_TYPES.SKIP]: 'Слиняй',
            [CARD_TYPES.FAVOR]: 'Подлижись',
            [CARD_TYPES.SHUFFLE]: 'Затасуй',
            [CARD_TYPES.FUTURE]: 'Подсмотри грядущее',
            [CARD_TYPES.CAT]: 'Кошкокарта',
            [CARD_TYPES.KITTEN]: 'Взрывной котёнок'
        };
        return names[type] || 'Неизвестная карта';
    }

    // Раздача карт игрокам
    dealCards() {
        this.players.forEach(player => {
            for (let i = 0; i < 7; i++) {
                if (this.deck.length) player.addCard(this.deck.pop());
            }
            player.addCard(new Card(CARD_TYPES.DEFUSE, 'Обезвредить')); // Каждому игроку даётся карта обезвреживания
        });
        for (let i = 0; i < 6 - this.players.length; i++) {
            this.deck.push(new Card(CARD_TYPES.DEFUSE, 'Обезвредить')); // Добавление оставшихся карт обезвреживания
        }
        for (let i = 0; i < this.players.length - 1; i++) {
            this.deck.push(new Card(CARD_TYPES.KITTEN, 'Взрывной котёнок')); // Добавление взрывных котят
        }
        this.shuffleDeck();
    }

    // Перемешивание колоды
    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    // Получение текущего игрока
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    // Отрисовка карт в руке текущего игрока
    renderPlayerHand() {
        const { playerHand } = this.elements;
        playerHand.innerHTML = '';
        const player = this.getCurrentPlayer();
        player.hand.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = `card ${card.type} ${card.isNew ? 'drawn' : ''} ${this.combinationMode && this.selectedCatCards.includes(index) ? 'selected' : ''}`;
            cardElement.dataset.index = index;
            cardElement.innerHTML = `
                <img src="${card.imageUrl}" alt="${card.name}" title="${card.name}">
                <span class="card-name">${card.name}</span>
            `;
            if (this.combinationMode && card.type === CARD_TYPES.CAT) {
                cardElement.addEventListener('click', () => this.toggleCatCardSelection(index));
            } else {
                cardElement.addEventListener('click', () => this.playCard(index));
            }
            playerHand.appendChild(cardElement);
        });
    }

    // Обновление интерфейса игры
    updateUI() {
        const player = this.getCurrentPlayer();
        const { currentPlayer, deckCount, discardPile, playerSelection, combinationOptions, drawCardBtn, skipTurnBtn, combineCatsBtn } = this.elements;
        currentPlayer.textContent = player.name;
        deckCount.textContent = this.deck.length;
        discardPile.textContent = this.discardPile.length;
        playerSelection.style.display = 'none';
        combinationOptions.style.display = this.combinationMode ? 'block' : 'none';
        drawCardBtn.disabled = this.combinationMode || this.isModalOpen;
        skipTurnBtn.disabled = this.combinationMode || this.isModalOpen || !player.hand.some(card => card.type === CARD_TYPES.SKIP);
        combineCatsBtn.disabled = this.combinationMode || !player.hand.filter(card => card.type === CARD_TYPES.CAT).some((card, i, arr) => arr.findIndex(c => c.imageUrl === card.imageUrl) !== i);

        this.renderPlayerHand();
        this.updatePlayerList();
    }

    // Обновление списка игроков с чекбоксами "Авто-Неть"
    updatePlayerList() {
        const { playerList } = this.elements;
        playerList.innerHTML = '';
        this.players.forEach((player, index) => {
            const li = document.createElement('li');
            li.className = `player-list-item ${player.isActive ? '' : 'dead'}`;
            li.innerHTML = `
                <span>${player.name} - ${player.hand.length} карт</span>
                <label>
                    <input type="checkbox" class="auto-nope" data-player-index="${index}" ${player.autoNope ? 'checked' : ''}>
                    Авто-Неть
                </label>
            `;
            playerList.appendChild(li);
        });

        document.querySelectorAll('.auto-nope').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const playerIndex = e.target.dataset.playerIndex;
                this.players[playerIndex].autoNope = e.target.checked; // Обновление флага "Авто-Неть"
            });
        });
    }

    // Взятие карты из колоды
    drawCard() {
        if (!this.deck.length) {
            showCustomAlert('Колода пуста!');
            return;
        }
        if (this.isActionTaken && this.turnsToMake === 1) return;
        this.isActionTaken = true;
        const card = this.deck.pop();
        const player = this.getCurrentPlayer();
        this.isModalOpen = true;
        this.showModalCard(card, card.name, card.type === CARD_TYPES.KITTEN, () => {
            this.isModalOpen = false;
            if (card.type === CARD_TYPES.KITTEN) {
                this.handleKitten(player, card);
            } else {
                player.addCard(card);
                this.endTurn();
            }
        });
    }

    // Отображение карты в модальном окне
    showModalCard(card, nameText, showExplosion = false, callback) {
        const { modal, drawnCard, playerSelection } = this.elements;
        drawnCard.innerHTML = '';
        playerSelection.style.display = 'none';

        const cardElement = document.createElement('div');
        cardElement.className = 'card drawn';
        cardElement.innerHTML = `
            <img src="${card.imageUrl}" alt="${card.name}">
            <span class="card-name">${nameText}</span>
        `;
        drawnCard.appendChild(cardElement);
        cardElement.addEventListener('click', e => e.stopPropagation());

        if (showExplosion) {
            for (let i = 0; i < 10; i++) {
                const explosion = document.createElement('div');
                explosion.className = 'explosion';
                explosion.textContent = '💥';
                explosion.style.left = `${Math.random() * 100}vw`;
                explosion.style.top = `${Math.random() * 100}vh`;
                document.body.appendChild(explosion);
                setTimeout(() => explosion.remove(), 1000);
            }
        }

        modal.style.display = 'block';
        this.isModalOpen = true;
        const closeModal = e => {
            if (e.target === modal) {
                modal.style.display = 'none';
                playerSelection.style.display = 'none';
                this.isModalOpen = false;
                modal.removeEventListener('click', closeModal);
                callback();
            }
        };
        modal.addEventListener('click', closeModal);
    }

    // Показ верхних трёх карт колоды (карта "Подсмотри грядущее")
    showFutureCards() {
        const { modal, drawnCard, playerSelection } = this.elements;
        drawnCard.innerHTML = '';
        playerSelection.style.display = 'none';

        const topCards = this.deck.slice(-3).reverse();
        topCards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.innerHTML = `
                <img src="${card.imageUrl}" alt="${card.name}">
                <span class="card-name">${card.name}</span>
            `;
            cardElement.addEventListener('click', e => e.stopPropagation());
            drawnCard.appendChild(cardElement);
        });

        modal.style.display = 'block';
        this.isModalOpen = true;
        const closeModal = e => {
            if (e.target === modal) {
                modal.style.display = 'none';
                playerSelection.style.display = 'none';
                this.isModalOpen = false;
                modal.removeEventListener('click', closeModal);
                this.isActionTaken = false;
                this.updateUI();
            }
        };
        modal.addEventListener('click', closeModal);
    }

    // Обработка взрывного котёнка
    handleKitten(player, card) {
        if (player.hasDefuse) {
            const defuseIndex = player.hand.findIndex(c => c.type === CARD_TYPES.DEFUSE);
            if (defuseIndex !== -1) {
                const defuseCard = player.removeCard(defuseIndex);
                this.discardPile.push(defuseCard);
                const insertIndex = Math.floor(Math.random() * this.deck.length);
                this.deck.splice(insertIndex, 0, card); // Котёнок возвращается в колоду
                this.updateUI();
                showCustomAlert(`${player.name} обезвредил взрывного котёнка!`, () => this.endTurn());
                return;
            }
        }
        player.isActive = false; // Игрок выбывает
        this.discardPile.push(card);
        this.updateUI();
        showCustomAlert(`${player.name} взорвался!`, () => {
            if (this.checkGameEnd()) {
                showCustomAlert(`Игра окончена! Победитель: ${this.getWinner().name}`);
            } else {
                this.endTurn();
            }
        });
    }

    // Получение индекса следующего активного игрока
    getNextPlayerIndex() {
        let nextIndex = (this.currentPlayerIndex + 1) % this.players.length;
        while (!this.players[nextIndex].isActive) {
            nextIndex = (nextIndex + 1) % this.players.length;
        }
        return nextIndex;
    }

    // Завершение хода
    endTurn() {
        this.turnsToMake--;
        if (this.turnsToMake > 0) {
            this.isActionTaken = false;
        } else {
            this.turnsToMake = 1;
            this.currentPlayerIndex = this.getNextPlayerIndex();
            this.isActionTaken = false;
        }
        this.updateUI();
    }

    // Проверка окончания игры
    checkGameEnd() {
        return this.players.filter(player => player.isActive).length === 1;
    }

    // Определение победителя
    getWinner() {
        return this.players.find(player => player.isActive);
    }

    // Перемешивание порядка игроков
    shufflePlayers() {
        for (let i = this.players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.players[i], this.players[j]] = [this.players[j], this.players[i]];
        }
    }

    // Разыгрывание карты
    playCard(index) {
        if (this.isActionTaken && this.turnsToMake === 1) return;
        const player = this.getCurrentPlayer();
        const card = player.removeCard(index);

        const canBeNoped = card.type !== CARD_TYPES.KITTEN && card.type !== CARD_TYPES.DEFUSE;
        if (canBeNoped) {
            const opponents = this.players.filter(
                (p, i) => p.isActive && i !== this.currentPlayerIndex && p.autoNope && p.hasNope()
            );
            if (opponents.length > 0) {
                const randomOpponent = opponents[Math.floor(Math.random() * opponents.length)];
                const nopeIndex = randomOpponent.hand.findIndex(c => c.type === CARD_TYPES.NOPE);
                const nopeCard = randomOpponent.removeCard(nopeIndex);
                this.discardPile.push(card, nopeCard);
                showCustomAlert(`${randomOpponent.name} использовал "Неть" и отменил "${card.name}"!`, () => {
                    this.isActionTaken = true;
                    this.endTurn();
                });
                return;
            }
        }

        this.discardPile.push(card);
        switch (card.type) {
            case CARD_TYPES.ATTACK:
                this.turnsToMake = this.turnsToMake > 0 ? this.turnsToMake + 1 : 2;
                this.currentPlayerIndex = this.getNextPlayerIndex();
                this.isActionTaken = false;
                this.updateUI();
                break;
            case CARD_TYPES.SKIP:
                this.isActionTaken = true;
                this.endTurn();
                break;
            case CARD_TYPES.SHUFFLE:
                this.shuffleDeck();
                this.isActionTaken = false;
                this.updateUI();
                break;
            case CARD_TYPES.FUTURE:
                this.isActionTaken = false;
                this.showFutureCards();
                break;
            case CARD_TYPES.FAVOR:
                this.isActionTaken = false;
                this.showPlayerSelection(this.handleFavorCard.bind(this));
                break;
            default:
                this.isActionTaken = true;
                this.endTurn();
        }
    }

    // Отображение выбора игрока для карт "Подлижись" или комбинации
    showPlayerSelection(callback) {
        const { modal, playerSelection, drawnCard, availablePlayers } = this.elements;
        drawnCard.innerHTML = '';
        availablePlayers.innerHTML = '';

        this.players.forEach((player, i) => {
            if (player.isActive && i !== this.currentPlayerIndex && player.hand.length > 0) {
                const btn = document.createElement('button');
                btn.className = 'player-selection-btn';
                btn.textContent = player.name;
                btn.addEventListener('click', () => {
                    callback(i);
                    modal.style.display = 'none';
                    playerSelection.style.display = 'none';
                    this.isModalOpen = false;
                });
                availablePlayers.appendChild(btn);
            }
        });

        modal.style.display = 'block';
        this.isModalOpen = true;
        playerSelection.style.display = 'block';
    }

    // Обработка карты "Подлижись"
    handleFavorCard(targetPlayerIndex) {
        const targetPlayer = this.players[targetPlayerIndex];
        const currentPlayer = this.getCurrentPlayer();

        if (targetPlayer.hand.length === 0) {
            showCustomAlert(`${targetPlayer.name} не имеет карт для передачи!`, () => {
                this.isActionTaken = false;
                this.updateUI();
            });
            return;
        }

        const randomIndex = Math.floor(Math.random() * targetPlayer.hand.length);
        const stolenCard = targetPlayer.removeCard(randomIndex);
        currentPlayer.addCard(stolenCard);

        this.showModalCard(stolenCard, `От ${targetPlayer.name}: ${stolenCard.name}`, false, () => {
            this.isModalOpen = false;
            this.isActionTaken = false;
            this.updateUI();
        });
    }

    // Переключение режима комбинации кошкокарт
    toggleCombinationMode() {
        this.combinationMode = !this.combinationMode;
        if (!this.combinationMode) {
            this.selectedCatCards = [];
            this.isActionTaken = false;
        } else {
            this.isActionTaken = false;
        }
        this.updateUI();
    }

    // Выбор кошкокарт для комбинации
    toggleCatCardSelection(index) {
        if (this.selectedCatCards.includes(index)) {
            this.selectedCatCards = this.selectedCatCards.filter(i => i !== index);
        } else if (this.selectedCatCards.length < 2) {
            this.selectedCatCards.push(index);
        }
        this.updateUI();
    }

    // Подтверждение комбинации кошкокарт
    confirmCombination() {
        if (this.selectedCatCards.length !== 2) {
            showCustomAlert('Выберите ровно две кошкокарты!');
            return;
        }

        const player = this.getCurrentPlayer();
        const card1 = player.hand[this.selectedCatCards[0]];
        const card2 = player.hand[this.selectedCatCards[1]];

        if (card1.imageUrl !== card2.imageUrl) {
            showCustomAlert('Выбранные кошкокарты должны быть одинаковыми!');
            return;
        }

        const removedCard1 = player.removeCard(this.selectedCatCards[1]);
        const removedCard2 = player.removeCard(this.selectedCatCards[0]);
        this.discardPile.push(removedCard1, removedCard2);
        this.combinationMode = false;
        this.selectedCatCards = [];
        this.isActionTaken = false;

        this.showPlayerSelection(this.handleCatSteal.bind(this));
    }

    // Обработка кражи карты с помощью комбинации
    handleCatSteal(targetPlayerIndex) {
        const targetPlayer = this.players[targetPlayerIndex];
        const currentPlayer = this.getCurrentPlayer();

        if (targetPlayer.hand.length === 0) {
            showCustomAlert(`${targetPlayer.name} не имеет карт для передачи!`, () => {
                this.isActionTaken = false;
                this.updateUI();
            });
            return;
        }

        const randomIndex = Math.floor(Math.random() * targetPlayer.hand.length);
        const stolenCard = targetPlayer.removeCard(randomIndex);
        currentPlayer.addCard(stolenCard);

        this.showModalCard(stolenCard, `От ${targetPlayer.name}: ${stolenCard.name}`, false, () => {
            this.isModalOpen = false;
            this.isActionTaken = false;
            this.updateUI();
        });
    }

    // Отмена режима комбинации
    cancelCombination() {
        this.combinationMode = false;
        this.selectedCatCards = [];
        this.elements.modal.style.display = 'none';
        this.isModalOpen = false;
        this.isActionTaken = false;
        this.updateUI();
    }

    // Сброс игры
    resetGame() {
        this.players = [];
        this.deck = [];
        this.discardPile = [];
        this.currentPlayerIndex = 0;
        this.turnsToMake = 1;
        this.combinationMode = false;
        this.selectedCatCards = [];
        this.isModalOpen = false;
        this.isActionTaken = false;
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('setup-screen').classList.add('active');
        this.updateUI();
    }

    // Начало следующего раунда
    nextRound() {
        this.deck = [];
        this.discardPile = [];
        this.currentPlayerIndex = 0;
        this.turnsToMake = 1;
        this.combinationMode = false;
        this.selectedCatCards = [];
        this.isModalOpen = false;
        this.isActionTaken = false;
        this.players.forEach(p => {
            p.hand = [];
            p.isActive = true;
            p.hasDefuse = false;
            p.autoNope = false;
        });
        this.createDeck();
        this.dealCards();
        this.updateUI();
    }
}

// Инициализация DOM-элементов
const elements = {
    decreaseBtn: document.getElementById('decrease-players'),
    increaseBtn: document.getElementById('increase-players'),
    playerCountEl: document.getElementById('player-count'),
    playerInputsContainer: document.getElementById('player-inputs'),
    startBtn: document.getElementById('start-game'),
    drawCardBtn: document.getElementById('draw-card'),
    skipTurnBtn: document.getElementById('skip-turn'),
    nextRoundBtn: document.getElementById('next-round'),
    newGameBtn: document.getElementById('new-game'),
    combineCatsBtn: document.getElementById('combine-cats'),
    confirmCombinationBtn: document.getElementById('confirm-combination'),
    cancelCombinationBtn: document.getElementById('cancel-combination')
};

let playerCount = 2; // Начальное количество игроков
let gameInstance = null; // Экземпляр игры

// Обновление полей ввода имён игроков
function updatePlayerInputs() {
    elements.playerInputsContainer.innerHTML = '';
    for (let i = 1; i <= playerCount; i++) {
        const playerInput = document.createElement('div');
        playerInput.className = 'player-input';
        playerInput.innerHTML = `<input type="text" placeholder="Игрок ${i}" id="player-${i}">`;
        elements.playerInputsContainer.appendChild(playerInput);
    }
}

// Уменьшение числа игроков
elements.decreaseBtn.addEventListener('click', () => {
    if (playerCount > 2) {
        playerCount--;
        elements.playerCountEl.textContent = playerCount;
        updatePlayerInputs();
    }
});

// Увеличение числа игроков
elements.increaseBtn.addEventListener('click', () => {
    if (playerCount < 4) {
        playerCount++;
        elements.playerCountEl.textContent = playerCount;
        updatePlayerInputs();
    }
});

// Старт игры
elements.startBtn.addEventListener('click', () => {
    const playerNames = [];
    for (let i = 1; i <= playerCount; i++) {
        const input = document.getElementById(`player-${i}`);
        playerNames.push(input.value || `Игрок ${i}`);
    }
    gameInstance = new Game();
    gameInstance.init(playerNames);
    document.getElementById('setup-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
});

// Обработчики кнопок
elements.drawCardBtn.addEventListener('click', () => gameInstance?.drawCard());
elements.skipTurnBtn.addEventListener('click', () => {
    if (gameInstance) {
        const player = gameInstance.getCurrentPlayer();
        const skipIndex = player.hand.findIndex(c => c.type === CARD_TYPES.SKIP);
        if (skipIndex !== -1) gameInstance.playCard(skipIndex);
    }
});
elements.nextRoundBtn.addEventListener('click', () => gameInstance?.nextRound());
elements.newGameBtn.addEventListener('click', () => gameInstance?.resetGame());
elements.combineCatsBtn.addEventListener('click', () => gameInstance?.toggleCombinationMode());
elements.confirmCombinationBtn.addEventListener('click', () => gameInstance?.confirmCombination());
elements.cancelCombinationBtn.addEventListener('click', () => gameInstance?.cancelCombination());

updatePlayerInputs();

// Показ пользовательского уведомления
function showCustomAlert(message, callback = () => {}) {
    const customAlert = document.getElementById('custom-alert');
    const customAlertMessage = document.getElementById('custom-alert-message');
    const customAlertClose = document.getElementById('custom-alert-close');

    customAlertMessage.textContent = message;
    customAlert.style.display = 'block';

    const closeAlert = () => {
        customAlert.style.display = 'none';
        customAlertClose.removeEventListener('click', closeAlert);
        callback();
    };

    customAlertClose.addEventListener('click', closeAlert);
}