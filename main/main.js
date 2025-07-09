'use strict';

// Константы для типов карт
const CARD_TYPES = {
    DEFUSE: 'defuse',
    NOPE: 'nope',
    ATTACK: 'attack',
    SKIP: 'skip',
    FAVOR: 'favor',
    SHUFFLE: 'shuffle',
    FUTURE: 'future',
    CAT: 'cat',
    KITTEN: 'kitten'
};

// Карта
class Card {
    constructor(type, name) {
        this.type = type;
        this.name = name;
        this.imageUrl = this.getImageUrl(type);
    }

    getImageUrl(type) {
        const imageMap = {
            [CARD_TYPES.DEFUSE]: '/img/defuse.png',
            [CARD_TYPES.NOPE]: '/img/nope.png',
            [CARD_TYPES.ATTACK]: '/img/attack.png',
            [CARD_TYPES.SKIP]: '/img/skip.png',
            [CARD_TYPES.FAVOR]: '/img/favor.png',
            [CARD_TYPES.SHUFFLE]: '/img/shuffle.png',
            [CARD_TYPES.FUTURE]: '/img/future.png',
            [CARD_TYPES.KITTEN]: '/img/kitten.png',
            [CARD_TYPES.CAT]: this.getRandomCatImage()
        };
        return imageMap[type] || '/img/default.png';
    }

    getRandomCatImage() {
        const catImages = ['/img/cat1.png', '/img/cat2.png', '/img/cat3.png', '/img/cat4.png', '/img/cat5.png'];
        return catImages[Math.floor(Math.random() * catImages.length)];
    }
}

// Игрок
class Player {
    constructor(name) {
        this.name = name;
        this.hand = [];
        this.isActive = true;
        this.hasDefuse = false;
    }

    addCard(card) {
        this.hand.push(card);
        if (card.type === CARD_TYPES.DEFUSE) this.hasDefuse = true;
        card.isNew = true;
        setTimeout(() => {
            card.isNew = false;
            gameInstance.updateUI();
        }, 500);
    }

    removeCard(index) {
        const card = this.hand.splice(index, 1)[0];
        if (card.type === CARD_TYPES.DEFUSE) this.hasDefuse = false;
        return card;
    }
}

// Игра
class Game {
    constructor() {
        this.players = [];
        this.deck = [];
        this.discardPile = [];
        this.currentPlayerIndex = 0;
        this.turnsToMake = 1; // Количество ходов для текущего игрока
        this.combinationMode = false;
        this.selectedCatCards = [];
        this.isModalOpen = false;
        this.isActionTaken = false;
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
        this.shufflePlayers();
        this.createDeck();
        this.dealCards();
        this.isActionTaken = false;
        this.turnsToMake = 1;
        this.updateUI();
    }

    // Создание колоды
    createDeck() {
        this.deck = [];
        const cardCounts = {
            [CARD_TYPES.NOPE]: 5,
            [CARD_TYPES.ATTACK]: 4,
            [CARD_TYPES.SKIP]: 4,
            [CARD_TYPES.FAVOR]: 4,
            [CARD_TYPES.SHUFFLE]: 4,
            [CARD_TYPES.FUTURE]: 5,
            [CARD_TYPES.CAT]: 20 // 5 типов кошкокарт по 4
        };
        Object.entries(cardCounts).forEach(([type, count]) => {
            for (let i = 0; i < count; i++) {
                this.deck.push(new Card(type, this.getCardName(type)));
            }
        });
        this.shuffleDeck();
    }

    // Названия карт
    getCardName(type) {
        const names = {
            [CARD_TYPES.DEFUSE]: 'Обезвредить',
            [CARD_TYPES.NOPE]: 'Нет',
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

    // Раздача карт
    dealCards() {
        this.players.forEach(player => {
            for (let i = 0; i < 7; i++) {
                if (this.deck.length) player.addCard(this.deck.pop());
            }
            player.addCard(new Card(CARD_TYPES.DEFUSE, 'Обезвредить'));
        });
        for (let i = 0; i < 6 - this.players.length; i++) {
            this.deck.push(new Card(CARD_TYPES.DEFUSE, 'Обезвредить'));
        }
        for (let i = 0; i < this.players.length - 1; i++) {
            this.deck.push(new Card(CARD_TYPES.KITTEN, 'Взрывной котёнок'));
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

    // Текущий игрок
    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    // Отрисовка руки игрока
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
            if (this.combinationMode) {
                if (card.type === CARD_TYPES.CAT) {
                    cardElement.addEventListener('click', () => this.toggleCatCardSelection(index));
                }
            } else {
                cardElement.addEventListener('click', () => this.playCard(index));
            }
            playerHand.appendChild(cardElement);
        });
    }

    // Обновление интерфейса
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

    // Обновление списка игроков
    updatePlayerList() {
        const { playerList } = this.elements;
        playerList.innerHTML = '';
        this.players.forEach(player => {
            const li = document.createElement('li');
            li.className = `player-list-item ${player.isActive ? '' : 'dead'}`;
            li.textContent = `${player.name} - ${player.hand.length} карт`;
            playerList.appendChild(li);
        });
    }

    // Взятие карты
    drawCard() {
        if (!this.deck.length) {
            showCustomAlert('Колода пуста!');
            return;
        }
        if (this.isActionTaken && this.turnsToMake === 1) {
            return;
        }
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

    // Показ одной карты в модальном окне
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

    // Показ трех карт для "Подсмотри грядущее"
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
                this.isActionTaken = false; // Разрешаем следующее действие
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
                this.deck.splice(insertIndex, 0, card);
                this.updateUI();
                showCustomAlert(`${player.name} обезвредил взрывного котёнка!`, () => {
                    this.endTurn();
                });
                return;
            }
        }
        player.isActive = false;
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

    // Следующий игрок
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

    // Получение победителя
    getWinner() {
        return this.players.find(player => player.isActive);
    }

    // Перемешивание игроков
    shufflePlayers() {
        for (let i = this.players.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.players[i], this.players[j]] = [this.players[j], this.players[i]];
        }
    }

    // Разыгрывание карты
    playCard(index) {
        if (this.isActionTaken && this.turnsToMake === 1) {
            return;
        }
        const player = this.getCurrentPlayer();
        const card = player.removeCard(index);
        this.discardPile.push(card);

        switch (card.type) {
            case CARD_TYPES.ATTACK:
                // Передаем оставшиеся ходы + 2 следующему игроку
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
                this.isActionTaken = false; // Позволяем действие после просмотра
                this.showFutureCards();
                break;
            case CARD_TYPES.FAVOR:
                this.isActionTaken = false; // Позволяем действие после кражи
                this.showPlayerSelection(this.handleFavorCard.bind(this));
                break;
            default:
                this.isActionTaken = true;
                this.endTurn();
        }
    }

    // Показ выбора игрока
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
            this.isActionTaken = false; // Позволяем следующее действие
            this.updateUI();
        });
    }

    // Режим комбинации кошкокарт
    toggleCombinationMode() {
        this.combinationMode = !this.combinationMode;
        if (!this.combinationMode) {
            this.selectedCatCards = [];
            this.isActionTaken = false;
        } else {
            this.isActionTaken = false; // Позволяем выбрать карты
        }
        this.updateUI();
    }

    // Выбор кошкокарт
    toggleCatCardSelection(index) {
        if (this.selectedCatCards.includes(index)) {
            this.selectedCatCards = this.selectedCatCards.filter(i => i !== index);
        } else if (this.selectedCatCards.length < 2) {
            this.selectedCatCards.push(index);
        }
        this.updateUI();
    }

    // Подтверждение комбинации
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
        this.isActionTaken = false; // Позволяем следующее действие

        this.showPlayerSelection(this.handleCatSteal.bind(this));
    }

    // Обработка кражи кошкокарт
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
            this.isActionTaken = false; // Позволяем следующее действие
            this.updateUI();
        });
    }

    // Отмена комбинации
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

    // Новый раунд
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

let playerCount = 2;
let gameInstance = null;

// Обновление полей ввода игроков
function updatePlayerInputs() {
    elements.playerInputsContainer.innerHTML = '';
    for (let i = 1; i <= playerCount; i++) {
        const playerInput = document.createElement('div');
        playerInput.className = 'player-input';
        playerInput.innerHTML = `<input type="text" placeholder="Игрок ${i}" id="player-${i}">`;
        elements.playerInputsContainer.appendChild(playerInput);
    }
}

// Обработчики событий
elements.decreaseBtn.addEventListener('click', () => {
    if (playerCount > 2) {
        playerCount--;
        elements.playerCountEl.textContent = playerCount;
        updatePlayerInputs();
    }
});

elements.increaseBtn.addEventListener('click', () => {
    if (playerCount < 4) {
        playerCount++;
        elements.playerCountEl.textContent = playerCount;
        updatePlayerInputs();
    }
});

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

// Функция для отображения кастомного модального окна
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