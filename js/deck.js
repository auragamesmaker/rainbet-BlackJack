/**
 * Blackjack Practice - Deck Module
 * Implements fair card shuffling using Fisher-Yates algorithm
 */

// Card suits and ranks
const SUITS = ['♠', '♥', '♦', '♣'];
const SUIT_NAMES = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

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
    /**
     * @param {number} deckCount - Number of standard 52-card decks to use
     */
    constructor(deckCount = 6) {
        this.deckCount = deckCount;
        this.cards = [];
        this.dealtCards = [];
        this.penetration = 0.75; // Reshuffle when 75% of shoe is dealt
        this.initialize();
    }

    /**
     * Initialize the deck(s) with all cards
     */
    initialize() {
        this.cards = [];
        this.dealtCards = [];
        
        for (let d = 0; d < this.deckCount; d++) {
            for (const suit of SUITS) {
                for (const rank of RANKS) {
                    this.cards.push(createCard(suit, rank));
                }
            }
        }
    }

    /**
     * Fisher-Yates shuffle algorithm - mathematically proven fair shuffle
     * Each permutation has equal probability of occurring
     */
    shuffle() {
        const array = this.cards;
        
        // Fisher-Yates (Knuth) shuffle
        for (let i = array.length - 1; i > 0; i--) {
            // Generate cryptographically secure random number if available
            let j;
            if (window.crypto && window.crypto.getRandomValues) {
                const randomBuffer = new Uint32Array(1);
                window.crypto.getRandomValues(randomBuffer);
                j = randomBuffer[0] % (i + 1);
            } else {
                // Fallback to Math.random (still fair, just not crypto-secure)
                j = Math.floor(Math.random() * (i + 1));
            }
            
            // Swap elements
            [array[i], array[j]] = [array[j], array[i]];
        }
        
        this.dealtCards = [];
        console.log(`🎴 Deck shuffled: ${this.cards.length} cards`);
    }

    /**
     * Deal a card from the top of the deck
     * @returns {Object|null} Card object or null if deck is empty
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
     * Check if deck needs reshuffling based on penetration
     * @returns {boolean} True if reshuffle needed
     */
    needsReshuffle() {
        const totalCards = this.deckCount * 52;
        const dealtRatio = this.dealtCards.length / totalCards;
        return dealtRatio >= this.penetration;
    }

    /**
     * Get number of remaining cards
     * @returns {number} Cards remaining in deck
     */
    get remaining() {
        return this.cards.length;
    }

    /**
     * Get total number of cards in a full shoe
     * @returns {number} Total cards
     */
    get total() {
        return this.deckCount * 52;
    }

    /**
     * Reshuffle all cards back into the deck
     */
    reshuffle() {
        this.cards = [...this.cards, ...this.dealtCards];
        this.dealtCards = [];
        this.shuffle();
    }

    /**
     * Set the number of decks and reinitialize
     * @param {number} count - Number of decks
     */
    setDeckCount(count) {
        this.deckCount = count;
        this.initialize();
        this.shuffle();
    }

    /**
     * Set penetration level for auto-reshuffle
     * @param {number} level - Penetration level (0.5 to 0.9)
     */
    setPenetration(level) {
        this.penetration = Math.max(0.5, Math.min(0.9, level));
    }
}

/**
 * Hand class for managing a player's or dealer's hand
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

    /**
     * Add a card to the hand
     * @param {Object} card - Card object
     */
    addCard(card) {
        this.cards.push(card);
        this.checkBust();
    }

    /**
     * Calculate the best value of the hand
     * Automatically handles soft/hard ace values
     * @returns {number} Hand value
     */
    getValue() {
        let value = 0;
        let aces = 0;

        for (const card of this.cards) {
            value += card.value;
            if (card.isAce) aces++;
        }

        // Convert aces from 11 to 1 as needed
        while (value > 21 && aces > 0) {
            value -= 10;
            aces--;
        }

        return value;
    }

    /**
     * Check if hand is soft (has an ace counted as 11)
     * @returns {boolean} True if soft hand
     */
    isSoft() {
        let value = 0;
        let aces = 0;

        for (const card of this.cards) {
            value += card.value;
            if (card.isAce) aces++;
        }

        // If we have aces and value is 21 or less, it's soft
        return aces > 0 && value <= 21;
    }

    /**
     * Check if hand is a natural blackjack
     * @returns {boolean} True if blackjack
     */
    isBlackjack() {
        return this.cards.length === 2 && this.getValue() === 21 && !this.isSplit;
    }

    /**
     * Check if hand can be split
     * @returns {boolean} True if splittable
     */
    canSplit() {
        if (this.cards.length !== 2) return false;
        return this.cards[0].rank === this.cards[1].rank;
    }

    /**
     * Check if hand can double down
     * @param {boolean} anyCards - Allow double on any cards (not just first two)
     * @returns {boolean} True if can double
     */
    canDouble(anyCards = false) {
        if (this.isDoubled) return false;
        if (anyCards) return true;
        return this.cards.length === 2;
    }

    /**
     * Check if hand is busted
     */
    checkBust() {
        if (this.getValue() > 21) {
            this.isBusted = true;
        }
    }

    /**
     * Clear the hand
     */
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

    /**
     * Get display string for hand value
     * @returns {string} Value string (e.g., "Soft 17" or "21")
     */
    getValueDisplay() {
        const value = this.getValue();
        if (this.isBlackjack()) return 'Blackjack!';
        if (this.isBusted) return `Bust (${value})`;
        if (this.isSoft() && value <= 21) return `Soft ${value}`;
        return value.toString();
    }
}

// Export for use in other modules
window.Deck = Deck;
window.Hand = Hand;
window.createCard = createCard;
window.SUITS = SUITS;
window.RANKS = RANKS;
