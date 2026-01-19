/**
 * Blackjack Practice - Deck Module
 * Implements fair card shuffling using Fisher-Yates algorithm
 * Includes card counting systems
 */

// === Constants ===
const SUITS = ['♠', '♥', '♦', '♣'];
const SUIT_NAMES = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Card counting systems - values for each rank
const COUNTING_SYSTEMS = {
    'hi-lo': { 'A': -1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 0, '8': 0, '9': 0, '10': -1, 'J': -1, 'Q': -1, 'K': -1 },
    'ko': { 'A': -1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1, '7': 1, '8': 0, '9': 0, '10': -1, 'J': -1, 'Q': -1, 'K': -1 },
    'omega2': { 'A': 0, '2': 1, '3': 1, '4': 2, '5': 2, '6': 2, '7': 1, '8': 0, '9': -1, '10': -2, 'J': -2, 'Q': -2, 'K': -2 },
    'hi-opt1': { 'A': 0, '2': 0, '3': 1, '4': 1, '5': 1, '6': 1, '7': 0, '8': 0, '9': 0, '10': -1, 'J': -1, 'Q': -1, 'K': -1 },
    'hi-opt2': { 'A': 0, '2': 1, '3': 1, '4': 2, '5': 2, '6': 1, '7': 1, '8': 0, '9': 0, '10': -2, 'J': -2, 'Q': -2, 'K': -2 }
};

/**
 * Creates a single card object
 * @param {string} suit - Card suit symbol
 * @param {string} rank - Card rank
 * @returns {Object} Card object
 */
function createCard(suit, rank) {
    const isRed = suit === '♥' || suit === '♦';
    const value = getCardValue(rank);

    return {
        suit,
        rank,
        isRed,
        color: isRed ? 'red' : 'black',
        value,
        isAce: rank === 'A',
        isFaceCard: ['J', 'Q', 'K'].includes(rank),
        id: `${rank}${suit}`,
        faceUp: true,
        toString() {
            return `${this.rank}${this.suit}`;
        }
    };
}

/**
 * Gets the blackjack value of a card
 * @param {string} rank - Card rank
 * @returns {number} Card value (Ace = 11, face cards = 10)
 */
function getCardValue(rank) {
    if (rank === 'A') return 11;
    if (['J', 'Q', 'K'].includes(rank)) return 10;
    return parseInt(rank);
}

/**
 * Deck class for managing multiple decks of cards
 */
class Deck {
    constructor(deckCount = 6) {
        this.deckCount = deckCount;
        this.cards = [];
        this.dealtCards = [];
        this.penetration = 0.75;
        this.runningCount = 0;
        this.countingSystem = 'hi-lo';
        this.initialize();
    }

    initialize() {
        this.cards = [];
        this.dealtCards = [];
        this.runningCount = 0;

        for (let d = 0; d < this.deckCount; d++) {
            for (const suit of SUITS) {
                for (const rank of RANKS) {
                    this.cards.push(createCard(suit, rank));
                }
            }
        }
    }

    /**
     * Fisher-Yates shuffle
     */
    shuffle() {
        const array = this.cards;

        for (let i = array.length - 1; i > 0; i--) {
            let j;
            if (window.crypto && window.crypto.getRandomValues) {
                const randomBuffer = new Uint32Array(1);
                window.crypto.getRandomValues(randomBuffer);
                j = randomBuffer[0] % (i + 1);
            } else {
                j = Math.floor(Math.random() * (i + 1));
            }
            [array[i], array[j]] = [array[j], array[i]];
        }

        this.dealtCards = [];
        this.runningCount = 0;
    }

    /**
     * Deal a card and update count
     */
    deal() {
        if (this.cards.length === 0) {
            console.warn('Deck is empty!');
            return null;
        }

        const card = this.cards.pop();
        this.dealtCards.push(card);
        return card;
    }

    /**
     * Update running count for a revealed card
     */
    updateCount(card) {
        if (!card || !card.faceUp) return;
        const system = COUNTING_SYSTEMS[this.countingSystem];
        if (system) {
            this.runningCount += system[card.rank] || 0;
        }
    }

    /**
     * Get the true count
     */
    getTrueCount() {
        const decksRemaining = this.cards.length / 52;
        if (decksRemaining < 0.5) return this.runningCount;
        return Math.round(this.runningCount / decksRemaining);
    }

    getRunningCount() {
        return this.runningCount;
    }

    setCountingSystem(system) {
        if (COUNTING_SYSTEMS[system]) {
            this.countingSystem = system;
        }
    }

    needsReshuffle() {
        const totalCards = this.deckCount * 52;
        const dealtRatio = this.dealtCards.length / totalCards;
        return dealtRatio >= this.penetration;
    }

    get remaining() {
        return this.cards.length;
    }

    get total() {
        return this.deckCount * 52;
    }

    reshuffle() {
        this.cards = [...this.cards, ...this.dealtCards];
        this.dealtCards = [];
        this.runningCount = 0;
        this.shuffle();
    }

    setDeckCount(count) {
        this.deckCount = count;
        this.initialize();
        this.shuffle();
    }

    setPenetration(level) {
        this.penetration = Math.max(0.5, Math.min(1, level));
    }
}

/**
 * Hand class for managing cards
 */
class Hand {
    constructor() {
        this.cards = [];
        this.bet = 0;
        this.isDoubled = false;
        this.isSplit = false;
        this.isStood = false;
        this.isBusted = false;
        this.isSurrendered = false;
        this.insuranceBet = 0;
    }

    addCard(card) {
        this.cards.push(card);
        this.checkBust();
    }

    getValue() {
        let value = 0;
        let aces = 0;

        for (const card of this.cards) {
            value += card.value;
            if (card.isAce) aces++;
        }

        while (value > 21 && aces > 0) {
            value -= 10;
            aces--;
        }

        return value;
    }

    isSoft() {
        let value = 0;
        let aces = 0;

        for (const card of this.cards) {
            value += card.value;
            if (card.isAce) aces++;
        }

        return aces > 0 && value <= 21;
    }

    isBlackjack() {
        return this.cards.length === 2 && this.getValue() === 21 && !this.isSplit;
    }

    canSplit() {
        if (this.cards.length !== 2) return false;
        return this.cards[0].rank === this.cards[1].rank;
    }

    canDouble(anyCards = false) {
        if (this.isDoubled) return false;
        if (anyCards) return true;
        return this.cards.length === 2;
    }

    checkBust() {
        if (this.getValue() > 21) {
            this.isBusted = true;
        }
    }

    clear() {
        this.cards = [];
        this.bet = 0;
        this.isDoubled = false;
        this.isSplit = false;
        this.isStood = false;
        this.isBusted = false;
        this.isSurrendered = false;
        this.insuranceBet = 0;
    }

    getValueDisplay() {
        const value = this.getValue();
        if (this.isBlackjack()) return 'BJ!';
        if (this.isBusted) return `${value}`;
        if (this.isSoft() && value <= 21) return `${value}`;
        return value.toString();
    }
}

// === Global Exports ===
window.Deck = Deck;
window.Hand = Hand;
window.createCard = createCard;
window.SUITS = SUITS;
window.RANKS = RANKS;
window.COUNTING_SYSTEMS = COUNTING_SYSTEMS;
