/**
 * Deck.js - Creating a standard deck of cards
 * Responsible for generating, shuffling and dealing a deck of cards
 */

const SUITS = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const RANK_VALUES = {
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'J': 11,
    'Q': 12,
    'K': 13,
    'A': 14
}

class Deck {
    // Create a standard 52-card deck
    static createDeck() {
        const deck = [];
        for (let suit of SUITS) {
            for(let rank of RANKS) {
                deck.push({
                    suit, rank, value: RANK_VALUES[rank]
                });
            }
        }
        return deck;
    }
    // Shuffle the deck using Fisher-Yates algorithm
    static shuffle(deck) {
        const shuffled = [...deck];
        for (let i = shuffled.length -1; i>0 ; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; 
        }
        return shuffled;
    }

    // Deal cards to players
    static dealCards(numPlayers, cardsPerPlayer) {
        const deck = Deck.shuffle(Deck.createDeck());
        const hands = [];

        for (let i = 0; i < numPlayers; i++){
            const startIndex = i * cardsPerPlayer;
            const endIndex = startIndex + cardsPerPlayer;
            hands.push(deck.slice(startIndex, endIndex));
        }

        return hands;
    }

    // Check cards colors

    static isRed(card) {
        return card.suit === 'Hearts' || card.suit === 'Diamonds';
    }

    static isBlack(card){
        return card.suit === 'Clubs' || card.suit === 'Spades';
    }
}

module.exports = Deck;

