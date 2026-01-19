/**
 * Blackjack Practice - Game Engine
 * Core game logic with insurance and card counting
 */

// === Game Constants ===
const GameState = {
    BETTING: 'betting',
    DEALING: 'dealing',
    INSURANCE: 'insurance',
    PLAYER_TURN: 'player_turn',
    DEALER_TURN: 'dealer_turn',
    PAYOUT: 'payout',
    GAME_OVER: 'game_over'
};

const ResultType = {
    WIN: 'win',
    LOSE: 'lose',
    PUSH: 'push',
    BLACKJACK: 'blackjack',
    SURRENDER: 'surrender'
};

// === Configuration Constants ===
const CONFIG = {
    DEFAULT_BALANCE: 10000,
    MIN_BET: 10,
    MAX_BET: 999000000000,
    BLACKJACK_PAYS: 1.5,
    INSURANCE_PAYS: 2,
    EXPIRATION_MS: 7 * 24 * 60 * 60 * 1000,
    CARD_DEAL_DELAY: 180,
    DEALER_TURN_DELAY: 500
};

/**
 * Main game class
 */
class BlackjackGame {
    constructor() {
        this.deck = new Deck(6);
        this.playerHands = [new Hand()];
        this.dealerHand = new Hand();
        this.currentHandIndex = 0;

        this.state = GameState.BETTING;
        this.balance = CONFIG.DEFAULT_BALANCE;
        this.currentBet = 0;

        this.settings = {
            deckCount: 6,
            dealerHitsSoft17: true,
            blackjackPays: CONFIG.BLACKJACK_PAYS,
            doubleAfterSplit: true,
            resplitAces: false,
            surrenderAllowed: true,
            insuranceAllowed: true,
            countingEnabled: false,
            countingSystem: 'hi-lo',
            minBet: CONFIG.MIN_BET,
            maxBet: CONFIG.MAX_BET,
            autoStandOn21: true,
            numHands: 1,
            dealerHoleCard: true  // true = face-down hole card (American), false = all cards face-up
        };

        this.stats = {
            handsPlayed: 0,
            handsWon: 0,
            handsLost: 0,
            handsPushed: 0,
            blackjacks: 0,
            totalWagered: 0,
            netProfit: 0
        };

        // Callbacks
        this.onStateChange = null;
        this.onCardDealt = null;
        this.onHandResult = null;
        this.onBalanceChange = null;
        this.onCountUpdate = null;
        this.onInsurancePrompt = null;
        this.onReshuffle = null;

        this.loadAllData();
        this.deck.shuffle();
    }

    get currentHand() {
        return this.playerHands[this.currentHandIndex];
    }

    placeBet(amount) {
        if (this.state !== GameState.BETTING) return false;
        if (amount < this.settings.minBet || amount > this.settings.maxBet) return false;
        if (amount > this.balance) return false;

        this.currentBet = amount;
        this.balance -= amount;
        this.playerHands[0].bet = amount;
        this.stats.totalWagered += amount;

        this.notifyBalanceChange();
        this.saveBalance();
        return true;
    }

    async deal() {
        if (this.currentBet === 0) return;

        if (this.deck.needsReshuffle()) {
            this.deck.reshuffle();
            if (this.onReshuffle) this.onReshuffle();
        }

        this.state = GameState.DEALING;
        this.notifyStateChange();

        this.playerHands = [new Hand()];
        this.playerHands[0].bet = this.currentBet;
        this.dealerHand.clear();
        this.currentHandIndex = 0;

        // Deal cards
        await this.dealCardToHand(this.currentHand, true);
        await this.dealCardToHand(this.dealerHand, true);
        await this.dealCardToHand(this.currentHand, true);
        await this.dealCardToHand(this.dealerHand, !this.settings.dealerHoleCard); // face-down if hole card enabled

        const dealerUpCard = this.dealerHand.cards[0];

        // Check for insurance
        if (dealerUpCard.isAce && this.settings.insuranceAllowed) {
            this.state = GameState.INSURANCE;
            this.notifyStateChange();
            if (this.onInsurancePrompt) {
                this.onInsurancePrompt(this.currentHand.bet / 2);
            }
            return;
        }

        // Check for player blackjack
        if (this.currentHand.isBlackjack()) {
            await this.handleBlackjack();
            return;
        }

        this.state = GameState.PLAYER_TURN;
        this.notifyStateChange();
    }

    async handleInsuranceDecision(takeInsurance) {
        if (this.state !== GameState.INSURANCE) return;

        if (takeInsurance) {
            const insuranceAmount = this.currentHand.bet / 2;
            if (insuranceAmount <= this.balance) {
                this.balance -= insuranceAmount;
                this.currentHand.insuranceBet = insuranceAmount;
                this.notifyBalanceChange();
            }
        }

        // Check for dealer blackjack
        if (this.dealerHand.isBlackjack()) {
            this.dealerHand.cards[1].faceUp = true;
            this.deck.updateCount(this.dealerHand.cards[1]);
            this.notifyCountUpdate();

            if (this.currentHand.insuranceBet > 0) {
                this.balance += this.currentHand.insuranceBet * 3;
                this.notifyBalanceChange();
            }

            if (this.currentHand.isBlackjack()) {
                this.balance += this.currentHand.bet;
                this.stats.handsPushed++;
                this.notifyResult(ResultType.PUSH, 0);
            } else {
                this.stats.handsLost++;
                this.stats.netProfit -= this.currentHand.bet;
                this.notifyResult(ResultType.LOSE, -this.currentHand.bet);
            }
            this.endRound();
            return;
        }

        // No dealer blackjack - lost insurance bet
        if (this.currentHand.isBlackjack()) {
            await this.handleBlackjack();
            return;
        }

        this.state = GameState.PLAYER_TURN;
        this.notifyStateChange();
    }

    async dealCardToHand(hand, faceUp = true) {
        const card = this.deck.deal();
        card.faceUp = faceUp;
        hand.addCard(card);

        if (faceUp) {
            this.deck.updateCount(card);
            this.notifyCountUpdate();
        }

        if (this.onCardDealt) {
            await this.onCardDealt(card, hand);
        }
    }

    async hit() {
        if (this.state !== GameState.PLAYER_TURN) return;

        await this.dealCardToHand(this.currentHand, true);

        if (this.currentHand.isBusted) {
            await this.handleHandComplete();
        } else if (this.currentHand.getValue() === 21 && this.settings.autoStandOn21) {
            // Auto-stand on 21 if setting is enabled
            this.currentHand.isStood = true;
            await this.handleHandComplete();
        }

        this.notifyStateChange();
    }

    async stand() {
        if (this.state !== GameState.PLAYER_TURN) return;
        this.currentHand.isStood = true;
        await this.handleHandComplete();
    }

    async double() {
        if (this.state !== GameState.PLAYER_TURN) return;
        if (!this.currentHand.canDouble()) return;

        const additionalBet = this.currentHand.bet;
        if (additionalBet > this.balance) return;

        this.balance -= additionalBet;
        this.currentHand.bet *= 2;
        this.currentHand.isDoubled = true;
        this.stats.totalWagered += additionalBet;

        this.notifyBalanceChange();

        await this.dealCardToHand(this.currentHand, true);
        this.currentHand.isStood = true;

        await this.handleHandComplete();
    }

    async split() {
        if (this.state !== GameState.PLAYER_TURN) return;
        if (!this.currentHand.canSplit()) return;

        const additionalBet = this.currentHand.bet;
        if (additionalBet > this.balance) return;

        this.balance -= additionalBet;
        this.stats.totalWagered += additionalBet;

        const newHand = new Hand();
        newHand.bet = additionalBet;
        newHand.isSplit = true;
        newHand.addCard(this.currentHand.cards.pop());

        this.currentHand.isSplit = true;
        this.playerHands.splice(this.currentHandIndex + 1, 0, newHand);

        await this.dealCardToHand(this.currentHand, true);

        this.notifyBalanceChange();
        this.notifyStateChange();
    }

    async surrender() {
        if (this.state !== GameState.PLAYER_TURN) return;
        if (this.currentHand.cards.length !== 2) return;
        if (!this.settings.surrenderAllowed) return;

        this.currentHand.isSurrendered = true;
        const returnAmount = this.currentHand.bet / 2;
        this.balance += returnAmount;

        this.notifyBalanceChange();
        await this.handleHandComplete();
    }

    async handleBlackjack() {
        this.dealerHand.cards[1].faceUp = true;
        this.deck.updateCount(this.dealerHand.cards[1]);
        this.notifyCountUpdate();

        if (this.dealerHand.isBlackjack()) {
            this.balance += this.currentHand.bet;
            this.stats.handsPushed++;
            this.notifyResult(ResultType.PUSH, 0);
        } else {
            const winnings = this.currentHand.bet * (1 + this.settings.blackjackPays);
            this.balance += winnings;
            this.stats.handsWon++;
            this.stats.blackjacks++;
            this.stats.netProfit += winnings - this.currentHand.bet;
            this.notifyResult(ResultType.BLACKJACK, winnings - this.currentHand.bet);
        }

        this.notifyBalanceChange();
        this.endRound();
    }

    async handleHandComplete() {
        if (this.currentHandIndex < this.playerHands.length - 1) {
            this.currentHandIndex++;

            if (this.currentHand.cards.length === 1) {
                await this.dealCardToHand(this.currentHand, true);
            }

            this.notifyStateChange();
            return;
        }

        await this.dealerTurn();
    }

    async dealerTurn() {
        const allBustedOrSurrendered = this.playerHands.every(h => h.isBusted || h.isSurrendered);

        if (allBustedOrSurrendered) {
            this.dealerHand.cards[1].faceUp = true;
            this.deck.updateCount(this.dealerHand.cards[1]);
            this.notifyCountUpdate();
            this.resolveHands();
            return;
        }

        this.state = GameState.DEALER_TURN;
        this.notifyStateChange();

        this.dealerHand.cards[1].faceUp = true;
        this.deck.updateCount(this.dealerHand.cards[1]);
        this.notifyCountUpdate();

        if (this.onCardDealt) {
            await this.onCardDealt(this.dealerHand.cards[1], this.dealerHand, true);
        }

        while (this.shouldDealerHit()) {
            await new Promise(resolve => setTimeout(resolve, CONFIG.DEALER_TURN_DELAY));
            await this.dealCardToHand(this.dealerHand, true);
        }

        this.resolveHands();
    }

    shouldDealerHit() {
        const value = this.dealerHand.getValue();
        if (value < 17) return true;
        if (value === 17 && this.dealerHand.isSoft() && this.settings.dealerHitsSoft17) {
            return true;
        }
        return false;
    }

    resolveHands() {
        this.state = GameState.PAYOUT;

        const dealerValue = this.dealerHand.getValue();
        const dealerBusted = this.dealerHand.isBusted;
        let totalWinnings = 0;

        for (const hand of this.playerHands) {
            const playerValue = hand.getValue();
            let result;
            let payout = 0;

            if (hand.isSurrendered) {
                result = ResultType.SURRENDER;
                payout = hand.bet / 2;
            } else if (hand.isBusted) {
                result = ResultType.LOSE;
                this.stats.handsLost++;
                this.stats.netProfit -= hand.bet;
            } else if (dealerBusted) {
                result = ResultType.WIN;
                payout = hand.bet * 2;
                this.stats.handsWon++;
                this.stats.netProfit += hand.bet;
            } else if (playerValue > dealerValue) {
                result = ResultType.WIN;
                payout = hand.bet * 2;
                this.stats.handsWon++;
                this.stats.netProfit += hand.bet;
            } else if (playerValue < dealerValue) {
                result = ResultType.LOSE;
                this.stats.handsLost++;
                this.stats.netProfit -= hand.bet;
            } else {
                result = ResultType.PUSH;
                payout = hand.bet;
                this.stats.handsPushed++;
            }

            this.balance += payout;
            totalWinnings += payout - hand.bet;
        }

        this.stats.handsPlayed++;
        this.saveStats();

        this.notifyBalanceChange();

        const overallResult = totalWinnings > 0 ? ResultType.WIN :
            totalWinnings < 0 ? ResultType.LOSE : ResultType.PUSH;
        this.notifyResult(overallResult, totalWinnings);

        this.endRound();
    }

    endRound() {
        this.state = GameState.GAME_OVER;
        this.notifyStateChange();
    }

    newRound() {
        this.playerHands = [new Hand()];
        this.dealerHand.clear();
        this.currentHandIndex = 0;
        this.currentBet = 0;
        this.state = GameState.BETTING;
        this.notifyStateChange();
    }

    reshuffle() {
        this.deck.reshuffle();
        if (this.onReshuffle) this.onReshuffle();
    }

    addChips(amount) {
        this.balance += amount;
        this.notifyBalanceChange();
        this.saveBalance();
    }

    // Action checks
    canHit() {
        return this.state === GameState.PLAYER_TURN &&
            !this.currentHand.isStood &&
            !this.currentHand.isBusted;
    }

    canStand() {
        return this.state === GameState.PLAYER_TURN &&
            !this.currentHand.isStood &&
            !this.currentHand.isBusted;
    }

    canDouble() {
        return this.state === GameState.PLAYER_TURN &&
            this.currentHand.canDouble() &&
            this.currentHand.bet <= this.balance &&
            !this.currentHand.isStood;
    }

    canSplit() {
        if (this.state !== GameState.PLAYER_TURN) return false;
        if (!this.currentHand.canSplit()) return false;
        if (this.currentHand.bet > this.balance) return false;
        if (this.playerHands.length >= 4) return false;
        return true;
    }

    canSurrender() {
        return this.state === GameState.PLAYER_TURN &&
            this.settings.surrenderAllowed &&
            this.currentHand.cards.length === 2 &&
            !this.currentHand.isSplit;
    }

    updateSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };

        if (newSettings.deckCount !== undefined) {
            this.deck.setDeckCount(newSettings.deckCount);
        }

        if (newSettings.countingSystem !== undefined) {
            this.deck.setCountingSystem(newSettings.countingSystem);
        }

        this.saveSettings();
    }

    getStrategyHint() {
        if (this.state !== GameState.PLAYER_TURN) return null;

        // Pass true count when counting is enabled for deviation indices
        const trueCount = this.settings.countingEnabled ? this.deck.getTrueCount() : null;

        return getBasicStrategyRecommendation(
            this.currentHand,
            this.dealerHand.cards[0],
            this.canDouble(),
            this.canSplit(),
            this.canSurrender(),
            trueCount
        );
    }

    getDeviationInfo() {
        if (this.state !== GameState.PLAYER_TURN) return { isDeviation: false };
        if (!this.settings.countingEnabled) return { isDeviation: false };

        const trueCount = this.deck.getTrueCount();
        const dealerValue = this.dealerHand.cards[0].value === 11 ? 11 : this.dealerHand.cards[0].value;

        return getDeviationInfo(this.currentHand, dealerValue, trueCount);
    }

    // Notifications
    notifyStateChange() {
        if (this.onStateChange) this.onStateChange(this.state);
    }

    notifyBalanceChange() {
        if (this.onBalanceChange) this.onBalanceChange(this.balance);
    }

    notifyResult(result, amount) {
        if (this.onHandResult) this.onHandResult(result, amount);
    }

    notifyCountUpdate() {
        if (this.onCountUpdate && this.settings.countingEnabled) {
            this.onCountUpdate(this.deck.getRunningCount(), this.deck.getTrueCount());
        }
    }

    // === Persistence ===
    saveWithTimestamp(key, data) {
        try {
            const wrapper = { timestamp: Date.now(), data: data };
            localStorage.setItem(key, JSON.stringify(wrapper));
        } catch (e) {
            console.warn(`Could not save ${key}:`, e);
        }
    }

    loadWithExpiration(key) {
        try {
            const saved = localStorage.getItem(key);
            if (!saved) return null;

            const wrapper = JSON.parse(saved);
            if (!wrapper.timestamp || Date.now() - wrapper.timestamp > CONFIG.EXPIRATION_MS) {
                localStorage.removeItem(key);
                return null;
            }

            return wrapper.data;
        } catch (e) {
            return null;
        }
    }

    refreshTimestamp(key) {
        try {
            const saved = localStorage.getItem(key);
            if (saved) {
                const wrapper = JSON.parse(saved);
                wrapper.timestamp = Date.now();
                localStorage.setItem(key, JSON.stringify(wrapper));
            }
        } catch (e) { }
    }

    saveStats() { this.saveWithTimestamp('blackjack_stats', this.stats); }
    loadStats() {
        const saved = this.loadWithExpiration('blackjack_stats');
        if (saved) this.stats = { ...this.stats, ...saved };
    }

    resetStats() {
        this.stats = {
            handsPlayed: 0, handsWon: 0, handsLost: 0, handsPushed: 0,
            blackjacks: 0, totalWagered: 0, netProfit: 0
        };
        this.saveStats();
    }

    saveAllData() {
        this.saveBalance();
        this.saveSettings();
        this.saveStats();
    }

    loadAllData() {
        this.loadBalance();
        this.loadSettings();
        this.loadStats();
        this.refreshTimestamp('blackjack_balance');
        this.refreshTimestamp('blackjack_settings');
        this.refreshTimestamp('blackjack_stats');
    }

    saveBalance() { this.saveWithTimestamp('blackjack_balance', this.balance); }
    loadBalance() {
        const saved = this.loadWithExpiration('blackjack_balance');
        if (saved !== null) this.balance = saved;
    }

    saveSettings() { this.saveWithTimestamp('blackjack_settings', this.settings); }
    loadSettings() {
        const saved = this.loadWithExpiration('blackjack_settings');
        if (saved) {
            this.settings = { ...this.settings, ...saved };
            if (saved.deckCount) this.deck.setDeckCount(saved.deckCount);
            if (saved.countingSystem) this.deck.setCountingSystem(saved.countingSystem);
        }
    }
}

/**
 * Illustrious 18 - Most important true count deviations
 * Format: { playerValue_dealerValue: { threshold, action } }
 * When true count >= threshold, use the deviation action instead of basic strategy
 */
const DEVIATION_INDICES = {
    // Insurance (not a play, but included for completeness)
    'insurance': { threshold: 3, action: 'TAKE_INSURANCE' },

    // 16 vs 10: Stand at TC >= 0 (instead of hit)
    '16_10': { threshold: 0, action: 'STAND', normal: 'HIT' },

    // 15 vs 10: Stand at TC >= 4 (instead of hit)
    '15_10': { threshold: 4, action: 'STAND', normal: 'HIT' },

    // 10 vs 10: Double at TC >= 4 (instead of hit)
    '10_10': { threshold: 4, action: 'DOUBLE', normal: 'HIT' },

    // 12 vs 3: Stand at TC >= 2 (instead of hit)
    '12_3': { threshold: 2, action: 'STAND', normal: 'HIT' },

    // 12 vs 2: Stand at TC >= 3 (instead of hit)
    '12_2': { threshold: 3, action: 'STAND', normal: 'HIT' },

    // 11 vs A: Double at TC >= 1 (instead of hit in some rules)
    '11_11': { threshold: 1, action: 'DOUBLE', normal: 'HIT' },

    // 9 vs 2: Double at TC >= 1 (instead of hit)
    '9_2': { threshold: 1, action: 'DOUBLE', normal: 'HIT' },

    // 10 vs A: Double at TC >= 4 (instead of hit)
    '10_11': { threshold: 4, action: 'DOUBLE', normal: 'HIT' },

    // 9 vs 7: Double at TC >= 3 (instead of hit)
    '9_7': { threshold: 3, action: 'DOUBLE', normal: 'HIT' },

    // 16 vs 9: Stand at TC >= 5 (instead of hit)
    '16_9': { threshold: 5, action: 'STAND', normal: 'HIT' },

    // 13 vs 2: Stand at TC >= -1 (stand even more)
    '13_2': { threshold: -1, action: 'STAND', normal: 'STAND' },

    // 12 vs 4: Hit at TC < 0 (instead of stand)
    '12_4': { threshold: 0, belowAction: 'HIT', action: 'STAND', normal: 'STAND' },

    // 12 vs 5: Hit at TC < -2 (instead of stand)
    '12_5': { threshold: -2, belowAction: 'HIT', action: 'STAND', normal: 'STAND' },

    // 12 vs 6: Hit at TC < -1 (instead of stand)
    '12_6': { threshold: -1, belowAction: 'HIT', action: 'STAND', normal: 'STAND' },

    // 13 vs 3: Hit at TC < -2 (instead of stand)
    '13_3': { threshold: -2, belowAction: 'HIT', action: 'STAND', normal: 'STAND' },

    // TT vs 5: Split at TC >= 5
    'TT_5': { threshold: 5, action: 'SPLIT', normal: 'STAND' },

    // TT vs 6: Split at TC >= 4
    'TT_6': { threshold: 4, action: 'SPLIT', normal: 'STAND' }
};

/**
 * Basic strategy with deviation indices
 */
function getBasicStrategyRecommendation(playerHand, dealerUpCard, canDouble, canSplit, canSurrender, trueCount = null) {
    const playerValue = playerHand.getValue();
    const dealerValue = dealerUpCard.value === 11 ? 11 : dealerUpCard.value;
    const isSoft = playerHand.isSoft();
    const isPair = playerHand.canSplit();

    // Check for deviation indices when true count is available
    let deviation = null;
    if (trueCount !== null) {
        deviation = checkDeviationIndex(playerHand, dealerValue, trueCount, canDouble, canSplit);
        if (deviation) {
            return deviation;
        }
    }

    if (isPair && canSplit) {
        const pairRank = playerHand.cards[0].rank;
        const pairStrategy = {
            'A': 'SPLIT', '8': 'SPLIT',
            '2': dealerValue <= 7 ? 'SPLIT' : 'HIT',
            '3': dealerValue <= 7 ? 'SPLIT' : 'HIT',
            '4': (dealerValue === 5 || dealerValue === 6) ? 'SPLIT' : 'HIT',
            '5': dealerValue <= 9 && canDouble ? 'DOUBLE' : 'HIT',
            '6': dealerValue <= 6 ? 'SPLIT' : 'HIT',
            '7': dealerValue <= 7 ? 'SPLIT' : 'HIT',
            '9': [7, 10, 11].includes(dealerValue) ? 'STAND' : 'SPLIT',
            '10': 'STAND', 'J': 'STAND', 'Q': 'STAND', 'K': 'STAND'
        };
        if (pairStrategy[pairRank]) return pairStrategy[pairRank];
    }

    if (isSoft) {
        if (playerValue >= 19) return 'STAND';
        if (playerValue === 18) {
            if (dealerValue <= 6 && canDouble) return 'DOUBLE';
            if (dealerValue <= 8) return 'STAND';
            return 'HIT';
        }
        if (playerValue === 17) {
            if (dealerValue >= 3 && dealerValue <= 6 && canDouble) return 'DOUBLE';
            return 'HIT';
        }
        if (playerValue >= 15 && playerValue <= 16) {
            if (dealerValue >= 4 && dealerValue <= 6 && canDouble) return 'DOUBLE';
            return 'HIT';
        }
        if (playerValue >= 13 && playerValue <= 14) {
            if (dealerValue >= 5 && dealerValue <= 6 && canDouble) return 'DOUBLE';
            return 'HIT';
        }
        return 'HIT';
    }

    if (playerValue >= 17) return 'STAND';

    if (playerValue >= 13 && playerValue <= 16) {
        if (dealerValue <= 6) return 'STAND';
        if (playerValue === 16 && canSurrender && dealerValue >= 9) return 'SURRENDER';
        if (playerValue === 15 && canSurrender && dealerValue === 10) return 'SURRENDER';
        return 'HIT';
    }

    if (playerValue === 12) {
        if (dealerValue >= 4 && dealerValue <= 6) return 'STAND';
        return 'HIT';
    }

    if (playerValue === 11) return canDouble ? 'DOUBLE' : 'HIT';
    if (playerValue === 10) {
        if (dealerValue <= 9 && canDouble) return 'DOUBLE';
        return 'HIT';
    }
    if (playerValue === 9) {
        if (dealerValue >= 3 && dealerValue <= 6 && canDouble) return 'DOUBLE';
        return 'HIT';
    }

    return 'HIT';
}

/**
 * Check if a deviation index applies
 */
function checkDeviationIndex(playerHand, dealerValue, trueCount, canDouble, canSplit) {
    const playerValue = playerHand.getValue();
    const isPair = playerHand.canSplit();

    // Check for TT (ten-ten pair) deviations
    if (isPair && playerHand.cards[0].value === 10 && canSplit) {
        const key = `TT_${dealerValue}`;
        const dev = DEVIATION_INDICES[key];
        if (dev && trueCount >= dev.threshold) {
            return dev.action;
        }
    }

    // Check for regular deviations
    const key = `${playerValue}_${dealerValue}`;
    const dev = DEVIATION_INDICES[key];

    if (dev) {
        // Some deviations apply when TC is below threshold
        if (dev.belowAction && trueCount < dev.threshold) {
            return dev.belowAction;
        }
        // Most deviations apply when TC is at or above threshold
        if (trueCount >= dev.threshold) {
            // Check if action is possible (e.g., can we double?)
            if (dev.action === 'DOUBLE' && !canDouble) {
                return null; // Can't double, use basic strategy
            }
            if (dev.action === 'SPLIT' && !canSplit) {
                return null;
            }
            return dev.action;
        }
    }

    return null; // No deviation applies
}

/**
 * Get deviation info for display (shows when a deviation applies)
 */
function getDeviationInfo(playerHand, dealerValue, trueCount) {
    const playerValue = playerHand.getValue();
    const isPair = playerHand.canSplit();

    // Check TT deviations
    if (isPair && playerHand.cards[0].value === 10) {
        const key = `TT_${dealerValue}`;
        const dev = DEVIATION_INDICES[key];
        if (dev && trueCount >= dev.threshold) {
            return {
                isDeviation: true,
                threshold: dev.threshold,
                action: dev.action,
                reason: `TC ${trueCount >= 0 ? '+' : ''}${trueCount} >= ${dev.threshold >= 0 ? '+' : ''}${dev.threshold}`
            };
        }
    }

    const key = `${playerValue}_${dealerValue}`;
    const dev = DEVIATION_INDICES[key];

    if (dev) {
        if (dev.belowAction && trueCount < dev.threshold) {
            return {
                isDeviation: true,
                threshold: dev.threshold,
                action: dev.belowAction,
                reason: `TC ${trueCount >= 0 ? '+' : ''}${trueCount} < ${dev.threshold >= 0 ? '+' : ''}${dev.threshold}`
            };
        }
        if (trueCount >= dev.threshold) {
            return {
                isDeviation: true,
                threshold: dev.threshold,
                action: dev.action,
                reason: `TC ${trueCount >= 0 ? '+' : ''}${trueCount} >= ${dev.threshold >= 0 ? '+' : ''}${dev.threshold}`
            };
        }
    }

    return { isDeviation: false };
}

// === Global Exports ===
window.BlackjackGame = BlackjackGame;
window.GameState = GameState;
window.ResultType = ResultType;
window.CONFIG = CONFIG;
window.DEVIATION_INDICES = DEVIATION_INDICES;
window.getBasicStrategyRecommendation = getBasicStrategyRecommendation;
window.getDeviationInfo = getDeviationInfo;