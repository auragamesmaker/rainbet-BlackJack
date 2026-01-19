/**
 * Blackjack Practice - UI Module
 * Complete UI with mobile support, insurance, card counting, split hands
 */

// === UI Constants ===
const UI_CONFIG = {
    ANIMATION_DELAY: 180,
    RESULT_DISPLAY_MS: 800,
    RESULT_FADE_MS: 250,
    RESHUFFLE_COOLDOWN_SEC: 30,
    CHIP_STACK_MAX: 8,
    CHIP_VALUES: [1000, 500, 100, 25, 5, 1],
    CHIP_CLASSES: ['chip-1000', 'chip-500', 'chip-100', 'chip-25', 'chip-5', 'chip-1']
};

class BlackjackUI {
    constructor(game) {
        this.game = game;
        this.elements = {};
        this.soundEnabled = true;
        this.hintsEnabled = false;
        this.countingEnabled = false;
        this.lastBet = 0;
        this.reshuffleCooldown = false;
        this.winStreak = 0;
        this.biggestWin = 0;

        this.soundManager = window.soundManager;
        this.themeManager = window.themeManager;

        this.loadUIPreferences();

        // Bind game callbacks
        this.game.onStateChange = this.handleStateChange.bind(this);
        this.game.onCardDealt = this.handleCardDealt.bind(this);
        this.game.onHandResult = this.handleResult.bind(this);
        this.game.onBalanceChange = this.updateBalance.bind(this);
        this.game.onCountUpdate = this.updateCardCount.bind(this);
        this.game.onInsurancePrompt = this.showInsurancePrompt.bind(this);
        this.game.onReshuffle = this.handleReshuffle.bind(this);

        this.init();
    }

    init() {
        this.cacheElements();
        this.bindEvents();
        this.loadSettingsUI();
        this.updateBalance(this.game.balance);
        this.updateStats();
        this.updateShoeInfo();
        this.updateActionButtons();
        this.updateCountDisplay();
    }

    cacheElements() {
        this.elements = {
            // Main containers
            gameMain: document.querySelector('.game-main'),
            gameContainer: document.querySelector('.game-container'),
            gameControls: document.getElementById('game-controls'),
            
            // Cards
            dealerCards: document.getElementById('dealer-cards'),
            dealerValue: document.getElementById('dealer-value'),
            playerCards: document.getElementById('player-cards'),
            playerValue: document.getElementById('player-value'),
            playerHandsContainer: document.getElementById('player-hands-container'),

            // Betting
            currentBet: document.getElementById('current-bet-value'),
            betIndicator: document.getElementById('bet-indicator'),
            bettingPrompt: document.getElementById('betting-prompt'),
            btnMax: document.getElementById('btn-max'),
            btnRebet: document.getElementById('btn-rebet'),
            btnClearBet: document.getElementById('btn-clear-bet'),

            // Stats
            balance: document.getElementById('balance'),
            statsHands: document.getElementById('stats-hands'),
            statsWinrate: document.getElementById('stats-winrate'),
            statsProfit: document.getElementById('stats-profit'),

            // Shoe
            cardsRemaining: document.getElementById('cards-remaining'),
            cardsTotal: document.getElementById('cards-total'),
            deckInfo: document.getElementById('deck-info'),

            // Actions
            btnDeal: document.getElementById('btn-deal'),
            btnHit: document.getElementById('btn-hit'),
            btnStand: document.getElementById('btn-stand'),
            btnDouble: document.getElementById('btn-double'),
            btnSplit: document.getElementById('btn-split'),
            btnSurrender: document.getElementById('btn-surrender'),
            btnReshuffle: document.getElementById('btn-reshuffle'),

            // Control containers
            bettingControls: document.getElementById('betting-controls'),
            actionControls: document.getElementById('action-controls'),
            chipStacksContainer: document.getElementById('chip-stacks-container'),

            // Modals
            settingsModal: document.getElementById('settings-modal'),
            insuranceModal: document.getElementById('insurance-modal'),
            addMoneyModal: document.getElementById('add-money-modal'),

            // Result
            resultOverlay: document.getElementById('result-overlay'),
            resultText: document.getElementById('result-text'),
            resultAmount: document.getElementById('result-amount'),
            resultIcon: document.getElementById('result-icon'),

            // Hints
            hintContainer: document.getElementById('hint-container'),
            hintText: document.getElementById('hint-text'),

            // Settings
            btnSettings: document.getElementById('btn-settings'),
            btnCloseSettings: document.getElementById('btn-close-settings'),
            settingDeckCount: document.getElementById('setting-deck-count'),
            settingReshuffleAt: document.getElementById('setting-reshuffle-at'),
            settingDealerH17: document.getElementById('setting-dealer-h17'),
            toggleHints: document.getElementById('toggle-hints'),
            toggleSound: document.getElementById('toggle-sound'),
            toggleCounting: document.getElementById('toggle-counting'),

            // Card counting
            countDisplay: document.getElementById('count-display'),
            runningCount: document.getElementById('running-count'),
            trueCount: document.getElementById('true-count'),
            countingSystemGroup: document.getElementById('counting-system-group'),
            settingCountSystem: document.getElementById('setting-count-system'),

            // Insurance
            insuranceCost: document.getElementById('insurance-cost'),
            btnTakeInsurance: document.getElementById('btn-take-insurance'),
            btnDeclineInsurance: document.getElementById('btn-decline-insurance'),

            // Add Money
            btnAddChips: document.getElementById('btn-add-chips'),
            btnCloseAddMoney: document.getElementById('btn-close-add-money'),
            customMoneyAmount: document.getElementById('custom-amount-input'),
            btnConfirmAddMoney: document.getElementById('btn-confirm-add-money'),
            btnResetStats: document.getElementById('btn-reset-stats'),

            // New Settings
            toggleAutostand: document.getElementById('toggle-autostand'),
            themePicker: document.getElementById('theme-picker'),
            settingSoundPack: document.getElementById('setting-sound-pack'),
            settingVolume: document.getElementById('setting-volume')
        };

        // Track placed chips for undo functionality
        this.placedChips = [];
    }

    bindEvents() {
        // New chip buttons (modern design)
        // Left-click to add chip, right-click to remove chip of that value
        document.querySelectorAll('.chip-btn').forEach(chip => {
            chip.addEventListener('click', () => {
                this.addChipToBet(parseInt(chip.dataset.value));
                this.playSound('chip');
            });
            chip.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                const value = parseInt(chip.dataset.value);
                this.removeChipFromBet(value);
                this.playSound('chipRemove');
            });
        });

        // Quick bet buttons
        this.elements.btnMax?.addEventListener('click', () => this.maxBet());
        this.elements.btnRebet?.addEventListener('click', () => this.rebet());
        this.elements.btnClearBet?.addEventListener('click', () => this.clearBet());

        // Game actions
        this.elements.btnDeal?.addEventListener('click', () => this.handleDeal());
        this.elements.btnHit?.addEventListener('click', () => this.handleHit());
        this.elements.btnStand?.addEventListener('click', () => this.handleStand());
        this.elements.btnDouble?.addEventListener('click', () => this.handleDouble());
        this.elements.btnSplit?.addEventListener('click', () => this.handleSplit());
        this.elements.btnSurrender?.addEventListener('click', () => this.handleSurrender());
        this.elements.btnReshuffle?.addEventListener('click', () => this.handleReshuffleClick());
        this.elements.btnNewRound?.addEventListener('click', () => this.startNewRound());

        // Settings modal
        this.elements.btnSettings?.addEventListener('click', () => this.openSettings());
        this.elements.btnCloseSettings?.addEventListener('click', () => this.closeSettings());
        this.elements.settingsModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.settingsModal) this.closeSettings();
        });

        // Settings controls
        this.elements.settingDeckCount?.addEventListener('change', (e) => {
            this.game.updateSettings({ deckCount: parseInt(e.target.value) });
            this.updateShoeInfo();
        });

        this.elements.settingReshuffleAt?.addEventListener('change', (e) => {
            this.game.deck.setPenetration(parseFloat(e.target.value) / 100);
        });

        this.elements.settingDealerH17?.addEventListener('change', (e) => {
            this.game.updateSettings({ dealerHitsSoft17: e.target.checked });
        });

        this.elements.toggleInsurance?.addEventListener('change', (e) => {
            this.game.updateSettings({ insuranceAllowed: e.target.checked });
        });

        this.elements.toggleHints?.addEventListener('change', (e) => {
            this.hintsEnabled = e.target.checked;
            this.updateHint();
            this.saveUIPreferences();
        });

        this.elements.toggleCounting?.addEventListener('change', (e) => {
            this.countingEnabled = e.target.checked;
            this.game.updateSettings({ countingEnabled: this.countingEnabled });
            this.updateCountDisplay();
            if (this.elements.countingSystemGroup) {
                this.elements.countingSystemGroup.style.display = this.countingEnabled ? 'flex' : 'none';
            }
            this.saveUIPreferences();
        });

        this.elements.settingCountSystem?.addEventListener('change', (e) => {
            this.game.updateSettings({ countingSystem: e.target.value });
            this.game.deck.setCountingSystem(e.target.value);
        });

        this.elements.toggleSound?.addEventListener('change', (e) => {
            this.soundEnabled = e.target.checked;
            if (this.soundManager) {
                this.soundManager.setEnabled(this.soundEnabled);
            }
            this.saveUIPreferences();
        });

        // Auto-stand on 21 toggle
        this.elements.toggleAutostand?.addEventListener('change', (e) => {
            this.game.updateSettings({ autoStandOn21: e.target.checked });
        });

        // Number of hands selector
        this.elements.settingNumHands?.addEventListener('change', (e) => {
            const numHands = parseInt(e.target.value);
            this.game.updateSettings({ numHands });
            this.showToast(`${numHands} hand${numHands > 1 ? 's' : ''} per round`);
        });

        // Theme picker
        this.elements.themePicker?.querySelectorAll('.theme-option').forEach(btn => {
            btn.addEventListener('click', () => {
                const theme = btn.dataset.theme;
                if (this.themeManager) {
                    this.themeManager.applyTheme(theme);
                    // Update active state
                    this.elements.themePicker.querySelectorAll('.theme-option').forEach(b => {
                        b.classList.remove('active');
                    });
                    btn.classList.add('active');
                    this.showToast(`Theme: ${btn.querySelector('.theme-name').textContent}`);
                }
            });
        });

        // Sound pack selector
        this.elements.settingSoundPack?.addEventListener('change', (e) => {
            if (this.soundManager) {
                this.soundManager.setSoundPack(e.target.value);
                this.playSound('chip'); // Preview sound
            }
        });

        // Volume slider
        this.elements.settingVolume?.addEventListener('input', (e) => {
            const volume = parseInt(e.target.value) / 100;
            if (this.soundManager) {
                this.soundManager.setVolume(volume);
            }
        });

        // Insurance modal
        this.elements.btnTakeInsurance?.addEventListener('click', () => {
            this.closeInsuranceModal();
            this.game.handleInsuranceDecision(true);
        });

        this.elements.btnDeclineInsurance?.addEventListener('click', () => {
            this.closeInsuranceModal();
            this.game.handleInsuranceDecision(false);
        });

        // Add Money modal
        this.elements.btnAddChips?.addEventListener('click', () => this.openAddMoneyModal());
        this.elements.btnCloseAddMoney?.addEventListener('click', () => this.closeAddMoneyModal());
        this.elements.addMoneyModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.addMoneyModal) this.closeAddMoneyModal();
        });
        this.elements.btnConfirmAddMoney?.addEventListener('click', () => this.confirmAddMoney());

        document.querySelectorAll('.quick-amount-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const amount = parseInt(btn.dataset.amount);
                if (this.elements.customMoneyAmount) {
                    this.elements.customMoneyAmount.value = amount;
                }
            });
        });

        this.elements.customMoneyAmount?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.confirmAddMoney();
        });

        this.elements.btnResetStats?.addEventListener('click', () => {
            this.game.resetStats();
            this.winStreak = 0;
            this.biggestWin = 0;
            this.saveUIPreferences();
            this.updateStats();
            this.showToast('Statistics reset');
            this.closeSettings();
        });

        // Keyboard
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Result overlay click
        this.elements.resultOverlay?.addEventListener('click', (e) => {
            if (e.target === this.elements.resultOverlay && this.game.state === GameState.GAME_OVER) {
                this.startNewRound();
            }
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSettings();
                this.closeAddMoneyModal();
                this.closeInsuranceModal();
            }
        });
    }

    // === Betting ===
    halfBet() {
        if (this.game.state !== GameState.BETTING) return;
        const half = Math.floor(this.getCurrentBet() / 2);
        if (half >= this.game.settings.minBet) {
            this.placedChips = this.convertAmountToChips(half);
            this.setBet(half);
            this.renderChipStacks();
        }
    }

    doubleBet() {
        if (this.game.state !== GameState.BETTING) return;
        const doubled = Math.min(this.getCurrentBet() * 2, this.game.balance, this.game.settings.maxBet);
        this.placedChips = this.convertAmountToChips(doubled);
        this.setBet(doubled);
        this.renderChipStacks();
        this.playSound('chip');
    }

    maxBet() {
        if (this.game.state !== GameState.BETTING) return;
        const amount = Math.min(this.game.balance, this.game.settings.maxBet);
        this.placedChips = this.convertAmountToChips(amount);
        this.setBet(amount);
        this.renderChipStacks();
        this.playSound('chip');
    }

    rebet() {
        if (this.game.state !== GameState.BETTING) return;
        if (this.lastBet > 0 && this.lastBet <= this.game.balance) {
            this.placedChips = this.convertAmountToChips(this.lastBet);
            this.setBet(this.lastBet);
            this.renderChipStacks();
            this.playSound('chip');
        }
    }
    
    // Helper to convert an amount to chip array
    convertAmountToChips(amount) {
        const chips = [];
        let remaining = amount;
        const chipValues = [1000, 500, 100, 25, 5, 1];
        
        chipValues.forEach(value => {
            while (remaining >= value) {
                chips.push(value);
                remaining -= value;
            }
        });
        
        return chips;
    }

    getCurrentBet() {
        return parseInt((this.elements.currentBet?.textContent || '0').replace(/,/g, ''));
    }

    setBet(amount) {
        if (this.elements.currentBet) {
            this.elements.currentBet.textContent = amount.toLocaleString();
        }
        if (this.elements.mobileBetValue) {
            this.elements.mobileBetValue.textContent = this.formatCurrency(amount);
        }
        
        // Toggle has-bet class for CSS visibility of betting prompt
        if (this.elements.gameContainer) {
            this.elements.gameContainer.classList.toggle('has-bet', amount > 0);
        }
        
        this.updateChipStack(amount);
        this.updateActionButtons();
    }

    formatCurrency(amount) {
        if (amount >= 1000000000) return '$' + (amount / 1000000000).toFixed(1) + 'B';
        if (amount >= 1000000) return '$' + (amount / 1000000).toFixed(1) + 'M';
        if (amount >= 1000) return '$' + (amount / 1000).toFixed(1) + 'K';
        return '$' + amount;
    }

    updateChipStack(amount) {
        // Just update the bet display value - chip rendering is handled by renderChipStacks
        if (!this.elements.betAmountDisplay) return;

        const valEl = this.elements.betAmountDisplay.querySelector('#current-bet-value');
        if (valEl) {
            valEl.textContent = amount > 0 ? amount.toLocaleString() : '0';
        }
    }

    addToBet(amount) {
        if (this.game.state !== GameState.BETTING) return;
        this.setBet(Math.min(this.getCurrentBet() + amount, this.game.balance, this.game.settings.maxBet));
    }

    removeFromBet(amount) {
        if (this.game.state !== GameState.BETTING) return;
        this.setBet(Math.max(this.getCurrentBet() - amount, 0));
    }

    clearBet() {
        if (this.game.state !== GameState.BETTING) return;
        this.placedChips = [];
        this.setBet(0);
        this.renderChipStacks();
    }

    // === Graphic Betting System ===
    addChipToBet(value) {
        if (this.game.state !== GameState.BETTING) return;
        const currentBet = this.getCurrentBet();
        const newBet = Math.min(currentBet + value, this.game.balance, this.game.settings.maxBet);

        if (newBet > currentBet) {
            this.placedChips.push(value);
            this.setBet(newBet);
            this.renderChipStacks();
        }
    }

    removeChipFromBet(value) {
        if (this.game.state !== GameState.BETTING) return;
        const currentBet = this.getCurrentBet();
        const newBet = Math.max(currentBet - value, 0);

        // Remove chip from placedChips array (last occurrence)
        const idx = this.placedChips.lastIndexOf(value);
        if (idx !== -1) {
            this.placedChips.splice(idx, 1);
        }

        this.setBet(newBet);
        this.renderChipStacks();
    }

    undoLastChip() {
        if (this.game.state !== GameState.BETTING) return;
        if (this.placedChips.length === 0) return;

        const lastChip = this.placedChips.pop();
        const currentBet = this.getCurrentBet();
        this.setBet(Math.max(currentBet - lastChip, 0));
        this.renderChipStacks();
    }

    renderChipStacks() {
        if (!this.elements.chipStacksContainer) return;

        const currentBet = this.getCurrentBet();

        // Update bet amount display
        if (this.elements.betAmountDisplay) {
            const betValue = this.elements.betAmountDisplay.querySelector('#current-bet-value');
            if (betValue) {
                betValue.textContent = currentBet.toLocaleString();
            }
        }

        this.elements.chipStacksContainer.innerHTML = '';

        if (this.placedChips.length === 0) return;

        // Create ONE single stack
        const MAX_VISIBLE_CHIPS = 5;
        const totalChips = this.placedChips.length;
        
        const stack = document.createElement('div');
        stack.className = 'chip-stack';
        
        // Show count badge if more than visible chips
        if (totalChips > MAX_VISIBLE_CHIPS) {
            stack.dataset.count = `×${totalChips}`;
        }

        // Only show last N chips (stacked visually)
        const visibleChips = this.placedChips.slice(-MAX_VISIBLE_CHIPS);
        
        visibleChips.forEach((value) => {
            const chip = document.createElement('div');
            chip.className = 'stacked-chip';
            chip.dataset.value = value;
            chip.textContent = value >= 1000 ? '1K' : value;
            stack.appendChild(chip);
        });

        // Click anywhere on stack to undo last chip
        stack.addEventListener('click', (e) => {
            e.stopPropagation();
            this.undoLastChip();
            this.playSound('chipRemove');
        });
        stack.title = 'Click to remove last chip';

        this.elements.chipStacksContainer.appendChild(stack);
    }

    // === Game Actions ===
    async handleDeal() {
        const bet = this.getCurrentBet();
        if (bet < this.game.settings.minBet) {
            this.showToast(`Minimum bet is $${this.game.settings.minBet}`, 'error');
            return;
        }

        this.lastBet = bet;
        if (!this.game.placeBet(bet)) return;

        this.clearCards();
        this.updateShoeInfo();
        await this.game.deal();
    }

    async handleHit() {
        if (!this.game.canHit()) return;
        this.playSound('card');
        await this.game.hit();
        this.updateShoeInfo();
    }

    async handleStand() {
        if (!this.game.canStand()) return;
        await this.game.stand();
    }

    async handleDouble() {
        if (!this.game.canDouble()) return;
        this.playSound('chip');
        await this.game.double();
        this.updateShoeInfo();
    }

    async handleSplit() {
        if (!this.game.canSplit()) return;
        this.playSound('chip');
        await this.game.split();
        this.renderPlayerHands();
    }

    async handleSurrender() {
        if (!this.game.canSurrender()) return;
        await this.game.surrender();
    }

    handleReshuffleClick() {
        if (this.reshuffleCooldown || this.game.state !== GameState.BETTING) {
            if (this.game.state !== GameState.BETTING) {
                this.showToast('Cannot reshuffle during a hand', 'error');
            }
            return;
        }
        this.game.reshuffle();
    }

    handleReshuffle() {
        this.updateShoeInfo();
        
        // Play shuffle sound
        this.playSound('shuffle');
        
        // Add shuffling animation class
        if (this.elements.gameContainer) {
            this.elements.gameContainer.classList.add('shuffling');
            setTimeout(() => {
                this.elements.gameContainer.classList.remove('shuffling');
            }, 700);
        }
        
        // Add deck info animation
        if (this.elements.deckInfo) {
            this.elements.deckInfo.classList.add('shuffling');
            setTimeout(() => {
                this.elements.deckInfo.classList.remove('shuffling');
            }, 600);
        }
        
        this.showToast('Deck reshuffled');

        this.reshuffleCooldown = true;
        if (this.elements.btnReshuffle) {
            this.elements.btnReshuffle.disabled = true;
            this.elements.btnReshuffle.innerHTML = '<i class="fa-solid fa-hourglass-half"></i><span>30s</span>';
        }

        let countdown = UI_CONFIG.RESHUFFLE_COOLDOWN_SEC;
        const interval = setInterval(() => {
            countdown--;
            if (this.elements.btnReshuffle) {
                this.elements.btnReshuffle.innerHTML = `<i class="fa-solid fa-hourglass-half"></i><span>${countdown}s</span>`;
            }
            if (countdown <= 0) {
                clearInterval(interval);
                this.reshuffleCooldown = false;
                if (this.elements.btnReshuffle) {
                    this.elements.btnReshuffle.disabled = false;
                    this.elements.btnReshuffle.innerHTML = '<i class="fa-solid fa-rotate"></i><span>Reshuffle</span>';
                }
            }
        }, 1000);
    }

    startNewRound() {
        this.hideResult();
        this.game.newRound();
        this.clearCards();
        this.placedChips = [];
        this.setBet(0);
        this.renderChipStacks();
        this.updateShoeInfo();
        if (this.elements.dealerValue) this.elements.dealerValue.textContent = '-';
        if (this.elements.playerValue) this.elements.playerValue.textContent = '-';
    }

    // === Rendering ===
    clearCards() {
        if (this.elements.dealerCards) this.elements.dealerCards.innerHTML = '';
        if (this.elements.playerCards) this.elements.playerCards.innerHTML = '';
        if (this.elements.playerHandsContainer) {
            this.elements.playerHandsContainer.innerHTML = `
                <div class="hand-wrapper" role="region" aria-label="Your Hand">
                    <div class="hand-badge" id="player-value" aria-live="polite">-</div>
                    <div class="cards-area" id="player-cards" role="list" aria-label="Your Cards"></div>
                </div>
            `;
            this.elements.playerCards = document.getElementById('player-cards');
            this.elements.playerValue = document.getElementById('player-value');
        }
    }

    createCardElement(card, faceUp = true) {
        const cardEl = document.createElement('div');
        cardEl.className = `card ${card.color} dealing`;
        cardEl.setAttribute('role', 'listitem');
        cardEl.setAttribute('aria-label', faceUp ? `${card.rank} of ${card.suit}` : 'Face down card');
        if (!faceUp) cardEl.classList.add('flipped');

        cardEl.innerHTML = `
            <div class="card-face card-front">
                <div class="card-corner top-left">
                    <span class="card-rank">${card.rank}</span>
                    <span class="card-suit">${card.suit}</span>
                </div>
                <span class="card-center">${card.suit}</span>
                <div class="card-corner bottom-right">
                    <span class="card-rank">${card.rank}</span>
                    <span class="card-suit">${card.suit}</span>
                </div>
            </div>
            <div class="card-face card-back"></div>
        `;

        return cardEl;
    }

    async handleCardDealt(card, hand, isReveal = false) {
        return new Promise(resolve => {
            const isDealer = hand === this.game.dealerHand;
            const container = isDealer ? this.elements.dealerCards : this.elements.playerCards;

            if (!container) { resolve(); return; }

            if (isReveal) {
                const holeCard = container.querySelector('.flipped');
                if (holeCard) {
                    holeCard.classList.remove('flipped');
                    holeCard.setAttribute('aria-label', `${card.rank} of ${card.suit}`);
                    this.playSound('card');
                }
            } else {
                container.appendChild(this.createCardElement(card, card.faceUp !== false));
                this.playSound('card');
            }

            this.updateHandValue(hand, isDealer);
            setTimeout(resolve, UI_CONFIG.ANIMATION_DELAY);
        });
    }

    updateHandValue(hand, isDealer) {
        const valueEl = isDealer ? this.elements.dealerValue : this.elements.playerValue;
        if (!valueEl) return;

        if (isDealer && this.game.state === GameState.PLAYER_TURN) {
            // Show only the face-up card value during player's turn
            const faceUpCard = hand.cards.find(c => c.faceUp !== false);
            valueEl.textContent = faceUpCard?.value || '-';
            valueEl.classList.remove('blackjack', 'bust');
        } else {
            valueEl.textContent = hand.getValueDisplay() || '-';
            valueEl.classList.remove('blackjack', 'bust');
            if (hand.isBlackjack()) valueEl.classList.add('blackjack');
            if (hand.isBusted) valueEl.classList.add('bust');
        }
    }

    renderPlayerHands() {
        if (this.game.playerHands.length <= 1) return;

        this.elements.playerHandsContainer.innerHTML = '';

        this.game.playerHands.forEach((hand, i) => {
            const isActive = i === this.game.currentHandIndex;
            const handWrapper = document.createElement('div');
            handWrapper.className = `hand-wrapper split-hand ${isActive ? 'active-hand' : 'inactive-hand'}`;
            handWrapper.setAttribute('role', 'region');
            handWrapper.setAttribute('aria-label', `Hand ${i + 1}`);

            const label = document.createElement('div');
            label.className = 'split-hand-label';
            label.textContent = `Hand ${i + 1}`;
            handWrapper.appendChild(label);

            const handBadge = document.createElement('div');
            handBadge.className = `hand-badge ${hand.isBusted ? 'bust' : ''}`;
            handBadge.setAttribute('aria-live', 'polite');
            handBadge.textContent = hand.getValueDisplay();
            handWrapper.appendChild(handBadge);

            const cardsArea = document.createElement('div');
            cardsArea.className = 'cards-area';
            cardsArea.setAttribute('role', 'list');
            hand.cards.forEach(card => {
                cardsArea.appendChild(this.createCardElement(card, true));
            });
            handWrapper.appendChild(cardsArea);

            this.elements.playerHandsContainer.appendChild(handWrapper);
        });
    }

    handleStateChange(state) {
        // Update data-state attribute for CSS-based visibility
        // Set on both gameMain (for controls) and gameContainer (for game table elements)
        const main = this.elements.gameMain;
        const container = this.elements.gameContainer;
        
        // Map game states to UI states
        const uiStateMap = {
            [GameState.BETTING]: 'betting',
            [GameState.DEALING]: 'playing',
            [GameState.PLAYER_TURN]: 'playing',
            [GameState.DEALER_TURN]: 'playing',
            [GameState.INSURANCE]: 'playing',
            [GameState.PAYOUT]: 'result',
            [GameState.GAME_OVER]: 'result'
        };
        
        const uiState = uiStateMap[state] || 'betting';
        
        if (main) main.dataset.state = uiState;
        if (container) container.dataset.state = uiState;

        this.updateActionButtons();
        this.updateHint();
        this.updateMobileBar(state);

        if (state === GameState.DEALER_TURN) {
            this.updateHandValue(this.game.dealerHand, true);
        }

        if (this.game.playerHands.length > 1) {
            this.renderPlayerHands();
        }
    }

    updateMobileBar(state) {
        const isBetting = state === GameState.BETTING;
        if (this.elements.mobileBettingRow) {
            this.elements.mobileBettingRow.style.display = isBetting ? 'flex' : 'none';
        }
    }

    updateActionButtons() {
        const state = this.game.state;
        const bet = this.getCurrentBet();

        const isBetting = state === GameState.BETTING;
        const isPlaying = state === GameState.PLAYER_TURN;

        // Deal button - only enable when betting and bet meets minimum
        if (this.elements.btnDeal) {
            this.elements.btnDeal.disabled = !isBetting || bet < this.game.settings.minBet;
        }

        // Action buttons - enable/disable based on game rules
        if (this.elements.btnHit) this.elements.btnHit.disabled = !isPlaying || !this.game.canHit();
        if (this.elements.btnStand) this.elements.btnStand.disabled = !isPlaying || !this.game.canStand();
        if (this.elements.btnDouble) this.elements.btnDouble.disabled = !isPlaying || !this.game.canDouble();
        if (this.elements.btnSplit) this.elements.btnSplit.disabled = !isPlaying || !this.game.canSplit();
        if (this.elements.btnSurrender) this.elements.btnSurrender.disabled = !isPlaying || !this.game.canSurrender();
    }

    updateShoeInfo() {
        if (this.elements.cardsRemaining) this.elements.cardsRemaining.textContent = this.game.deck.remaining;
        if (this.elements.cardsTotal) this.elements.cardsTotal.textContent = this.game.deck.total;
        if (this.elements.deckCount) this.elements.deckCount.textContent = this.game.deck.deckCount;
    }

    updateBalance(balance, previousBalance = null) {
        if (!this.elements.balance) return;
        
        const balanceEl = this.elements.balance;
        const parentEl = balanceEl.closest('.bankroll-amount');
        
        // Animate if we have a previous balance to compare
        if (previousBalance !== null && previousBalance !== balance && parentEl) {
            parentEl.classList.remove('increasing', 'decreasing');
            // Force reflow
            void parentEl.offsetWidth;
            
            if (balance > previousBalance) {
                parentEl.classList.add('increasing');
            } else if (balance < previousBalance) {
                parentEl.classList.add('decreasing');
            }
            
            // Remove animation class after it completes
            setTimeout(() => {
                parentEl.classList.remove('increasing', 'decreasing');
            }, 500);
        }
        
        // Animate number counting
        this.animateValue(balanceEl, parseInt(balanceEl.textContent.replace(/,/g, '')) || 0, balance, 300);
    }
    
    animateValue(element, start, end, duration) {
        if (start === end) {
            element.textContent = end.toLocaleString();
            return;
        }
        
        const range = end - start;
        const startTime = performance.now();
        
        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + range * easeOut);
            
            element.textContent = current.toLocaleString();
            
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };
        
        requestAnimationFrame(step);
    }

    updateCardCount(runningCount, trueCount) {
        if (!this.countingEnabled) return;

        if (this.elements.runningCount) {
            this.elements.runningCount.textContent = runningCount >= 0 ? `+${runningCount}` : runningCount;
            this.elements.runningCount.className = 'count-value ' +
                (runningCount > 0 ? 'positive' : runningCount < 0 ? 'negative' : '');
        }
        if (this.elements.trueCount) {
            this.elements.trueCount.textContent = trueCount >= 0 ? `+${trueCount}` : trueCount;
            this.elements.trueCount.className = 'count-value ' +
                (trueCount > 0 ? 'positive' : trueCount < 0 ? 'negative' : '');
        }
    }

    updateCountDisplay() {
        if (this.elements.countDisplay) {
            this.elements.countDisplay.style.display = this.countingEnabled ? 'flex' : 'none';
        }
    }

    updateStats() {
        const stats = this.game.stats;

        if (this.elements.statsHands) this.elements.statsHands.textContent = stats.handsPlayed;

        if (this.elements.statsWinrate) {
            const rate = stats.handsPlayed > 0 ? Math.round((stats.handsWon / stats.handsPlayed) * 100) : 0;
            this.elements.statsWinrate.textContent = `${rate}%`;
        }

        if (this.elements.statsProfit) {
            const profit = stats.netProfit;
            this.elements.statsProfit.textContent = `${profit >= 0 ? '+' : '-'}$${Math.abs(profit).toLocaleString()}`;
            // Update class for bankroll-stat styling
            this.elements.statsProfit.classList.toggle('positive', profit >= 0);
            this.elements.statsProfit.classList.toggle('negative', profit < 0);
        }

        if (this.elements.statsBlackjacks) this.elements.statsBlackjacks.textContent = stats.blackjacks || 0;
        if (this.elements.statsStreak) this.elements.statsStreak.textContent = this.winStreak;
        if (this.elements.statsBiggest) this.elements.statsBiggest.textContent = `$${this.biggestWin.toLocaleString()}`;
    }

    handleResult(result, amount) {
        if (result === ResultType.WIN || result === ResultType.BLACKJACK) {
            this.winStreak++;
            if (amount > this.biggestWin) this.biggestWin = amount;
        } else if (result === ResultType.LOSE) {
            this.winStreak = 0;
        }

        this.saveUIPreferences();
        this.updateStats();

        const resultData = {
            [ResultType.BLACKJACK]: { text: 'BLACKJACK!', className: 'blackjack', cardClass: 'blackjack-card', icon: '<i class="fa-solid fa-crown"></i>', sound: 'blackjack', badgeAnim: 'blackjack-celebration' },
            [ResultType.WIN]: { text: 'YOU WIN!', className: 'win', cardClass: 'win-card', icon: '<i class="fa-solid fa-trophy"></i>', sound: 'win', badgeAnim: 'win-pulse' },
            [ResultType.LOSE]: { text: 'DEALER WINS', className: 'lose', cardClass: 'lose-card', icon: '<i class="fa-solid fa-face-sad-tear"></i>', sound: 'lose', badgeAnim: 'bust-shake' },
            [ResultType.PUSH]: { text: 'PUSH', className: 'push', cardClass: 'push-card', icon: '<i class="fa-solid fa-handshake"></i>', sound: 'push', badgeAnim: '' },
            [ResultType.SURRENDER]: { text: 'SURRENDER', className: 'push', cardClass: 'push-card', icon: '<i class="fa-solid fa-flag"></i>', sound: 'lose', badgeAnim: '' }
        };

        const data = resultData[result] || { text: '', className: '', cardClass: '', icon: '', sound: '', badgeAnim: '' };

        const resultCard = this.elements.resultOverlay?.querySelector('.result-card');
        if (resultCard) resultCard.className = `result-card ${data.cardClass}`;
        if (this.elements.resultIcon) this.elements.resultIcon.innerHTML = data.icon;
        if (this.elements.resultText) {
            this.elements.resultText.textContent = data.text;
            this.elements.resultText.className = `result-text ${data.className}`;
        }
        if (this.elements.resultAmount) {
            this.elements.resultAmount.textContent = `${amount >= 0 ? '+' : ''}$${Math.abs(amount).toLocaleString()}`;
            this.elements.resultAmount.className = 'result-amount ' +
                (amount > 0 ? 'positive' : amount < 0 ? 'negative' : 'neutral');
        }

        // Animate player hand badge
        if (data.badgeAnim && this.elements.playerValue) {
            this.elements.playerValue.classList.remove('win-pulse', 'blackjack-celebration', 'bust-shake');
            // Force reflow to restart animation
            void this.elements.playerValue.offsetWidth;
            this.elements.playerValue.classList.add(data.badgeAnim);
        }

        // Play appropriate sound
        if (data.sound) this.playSound(data.sound);

        this.showResult();
    }

    showResult() {
        if (this.resultTimeout) clearTimeout(this.resultTimeout);

        const overlay = this.elements.resultOverlay;
        if (!overlay) return;

        overlay.classList.remove('fade-out');
        overlay.classList.add('visible');

        // Auto-dismiss after configured delay
        this.resultTimeout = setTimeout(() => {
            overlay.classList.add('fade-out');
            setTimeout(() => {
                this.hideResult();
                if (this.game.state === GameState.GAME_OVER) {
                    this.startNewRound();
                }
            }, UI_CONFIG.RESULT_FADE_MS);
        }, UI_CONFIG.RESULT_DISPLAY_MS);
    }

    hideResult() {
        if (this.resultTimeout) {
            clearTimeout(this.resultTimeout);
            this.resultTimeout = null;
        }
        const overlay = this.elements.resultOverlay;
        if (overlay) overlay.classList.remove('visible', 'fade-out');
    }

    updateHint() {
        if (!this.hintsEnabled || this.game.state !== GameState.PLAYER_TURN) {
            if (this.elements.hintContainer) this.elements.hintContainer.style.display = 'none';
            return;
        }

        const hint = this.game.getStrategyHint();
        if (hint && this.elements.hintText) {
            this.elements.hintText.textContent = hint;
            if (this.elements.hintContainer) this.elements.hintContainer.style.display = '';
        }
    }

    // === Insurance ===
    showInsurancePrompt(cost) {
        if (this.elements.insuranceCost) {
            this.elements.insuranceCost.textContent = `$${cost.toLocaleString()}`;
        }
        this.elements.insuranceModal?.classList.add('visible');
    }

    closeInsuranceModal() {
        this.elements.insuranceModal?.classList.remove('visible');
    }

    // === Modals ===
    openSettings() { this.elements.settingsModal?.classList.add('visible'); }
    closeSettings() { this.elements.settingsModal?.classList.remove('visible'); }

    openAddMoneyModal() {
        this.elements.addMoneyModal?.classList.add('visible');
        setTimeout(() => {
            this.elements.customMoneyAmount?.focus();
            this.elements.customMoneyAmount?.select();
        }, 100);
    }

    closeAddMoneyModal() {
        this.elements.addMoneyModal?.classList.remove('visible');
    }

    confirmAddMoney() {
        const input = this.elements.customMoneyAmount;
        if (!input) return;

        const amount = parseInt(input.value);
        if (isNaN(amount) || amount <= 0) {
            this.showToast('Please enter a valid amount', 'error');
            return;
        }

        if (amount > 1000000) {
            this.showToast('Maximum amount is $1,000,000', 'error');
            return;
        }

        this.game.addChips(amount);
        this.showToast(`Added $${amount.toLocaleString()}`);
        this.closeAddMoneyModal();
        input.value = '10000';
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('visible'));
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => toast.remove(), 150);
        }, 2500);
    }

    playSound(type) {
        if (!this.soundEnabled) return;

        // Use SoundManager if available
        if (this.soundManager) {
            this.soundManager.play(type);
            return;
        }

        // Fallback to Web Audio API beeps
        if (!this.audioContext) {
            try { this.audioContext = new (window.AudioContext || window.webkitAudioContext)(); }
            catch { return; }
        }

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        const sounds = {
            card: [800, 0.025, 0.03],
            chip: [1200, 0.025, 0.02],
            win: [523.25, 0.05, 0.25],
            lose: [300, 0.03, 0.1]
        };

        const [freq, vol, dur] = sounds[type] || [440, 0.02, 0.05];
        osc.frequency.value = freq;
        gain.gain.value = vol;
        if (type === 'lose') osc.type = 'sawtooth';
        osc.start();

        if (type === 'win') {
            setTimeout(() => osc.frequency.value = 659.25, 70);
            setTimeout(() => osc.frequency.value = 783.99, 140);
        }

        osc.stop(this.audioContext.currentTime + dur);
    }

    handleKeyboard(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

        const chipKeyMap = { '1': 1, '2': 5, '3': 25, '4': 100, '5': 500, '6': 1000 };

        if (chipKeyMap[e.key] && this.game.state === GameState.BETTING) {
            this.addToBet(chipKeyMap[e.key]);
            this.playSound('chip');
            return;
        }

        const keyMap = {
            'h': () => this.handleHit(),
            's': () => this.handleStand(),
            'd': () => this.handleDouble(),
            'p': () => this.handleSplit(),
            'r': () => !e.ctrlKey && this.handleSurrender(),
            'enter': () => {
                if (this.game.state === GameState.BETTING) this.handleDeal();
                else if (this.game.state === GameState.GAME_OVER) this.startNewRound();
            },
            ' ': () => {
                if (this.game.state === GameState.BETTING) this.handleDeal();
                else if (this.game.state === GameState.GAME_OVER) this.startNewRound();
            },
            'c': () => {
                if (this.game.state === GameState.BETTING) this.clearBet();
            }
        };

        const action = keyMap[e.key.toLowerCase()];
        if (action) {
            action();
            if (e.key === 'Enter' || e.key === ' ') e.preventDefault();
        }
    }

    // === Persistence ===
    saveUIPreferences() {
        try {
            const prefs = {
                soundEnabled: this.soundEnabled,
                hintsEnabled: this.hintsEnabled,
                countingEnabled: this.countingEnabled,
                lastBet: this.lastBet,
                winStreak: this.winStreak,
                biggestWin: this.biggestWin
            };
            localStorage.setItem('blackjack_ui_prefs', JSON.stringify(prefs));
        } catch (e) { }
    }

    loadUIPreferences() {
        try {
            const saved = localStorage.getItem('blackjack_ui_prefs');
            if (saved) {
                const prefs = JSON.parse(saved);
                this.soundEnabled = prefs.soundEnabled ?? true;
                this.hintsEnabled = prefs.hintsEnabled ?? false;
                this.countingEnabled = prefs.countingEnabled ?? false;
                this.lastBet = prefs.lastBet ?? 0;
                this.winStreak = prefs.winStreak ?? 0;
                this.biggestWin = prefs.biggestWin ?? 0;
            }
        } catch (e) { }
    }

    loadSettingsUI() {
        if (this.elements.toggleSound) {
            this.elements.toggleSound.checked = this.soundEnabled;
        }
        if (this.elements.toggleHints) {
            this.elements.toggleHints.checked = this.hintsEnabled;
        }
        if (this.elements.toggleCounting) {
            this.elements.toggleCounting.checked = this.countingEnabled;
            this.game.updateSettings({ countingEnabled: this.countingEnabled });
        }
        if (this.elements.countingSystemGroup) {
            this.elements.countingSystemGroup.style.display = this.countingEnabled ? 'flex' : 'none';
        }
        if (this.elements.toggleInsurance) {
            this.elements.toggleInsurance.checked = !!this.game.settings.insuranceAllowed;
        }
        if (this.elements.settingDealerH17) {
            this.elements.settingDealerH17.checked = !!this.game.settings.dealerHitsSoft17;
        }
        if (this.elements.settingDeckCount) {
            this.elements.settingDeckCount.value = this.game.settings.deckCount;
        }
        if (this.elements.settingReshuffleAt && this.game.deck.penetration) {
            this.elements.settingReshuffleAt.value = Math.round(this.game.deck.penetration * 100);
        }
        if (this.elements.settingCountSystem) {
            this.elements.settingCountSystem.value = this.game.settings.countingSystem || 'hi-lo';
        }

        // Auto-stand on 21
        if (this.elements.toggleAutostand) {
            this.elements.toggleAutostand.checked = !!this.game.settings.autoStandOn21;
        }

        // Number of hands
        if (this.elements.settingNumHands) {
            this.elements.settingNumHands.value = this.game.settings.numHands || 1;
        }

        // Theme picker - set active theme
        if (this.elements.themePicker && this.themeManager) {
            const currentTheme = this.themeManager.getCurrentTheme();
            this.elements.themePicker.querySelectorAll('.theme-option').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.theme === currentTheme);
            });
        }

        // Sound pack
        if (this.elements.settingSoundPack && this.soundManager) {
            this.elements.settingSoundPack.value = this.soundManager.currentPack || 'classic';
        }

        // Volume slider
        if (this.elements.settingVolume && this.soundManager) {
            this.elements.settingVolume.value = Math.round((this.soundManager.volume || 0.5) * 100);
        }
    }
}

// === Global Export ===
window.BlackjackUI = BlackjackUI;
window.UI_CONFIG = UI_CONFIG;
