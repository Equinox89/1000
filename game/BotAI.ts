import type { Card, GameState, Player, Suit } from '../types/game';

export class BotAI {
    private state: GameState;

    constructor(state: GameState) {
        this.state = state;
    }

    public makeBid(player: Player): number {
        // Simple bidding strategy: bid based on card values and potential tricks
        const handValue = this.calculateHandValue(player.hand);
        const minBid = this.state.highestBid + 5;
        const maxBid = Math.min(handValue + 50, 120); // Cap at 120 for safety

        // Add some randomness to make bots more interesting
        const randomFactor = Math.random() * 20 - 10;
        const bid = Math.max(minBid, Math.min(maxBid, handValue + randomFactor));

        return Math.floor(bid);
    }

    public chooseCard(player: Player): number {
        const leadingSuit = this.state.currentTrick[0]?.suit;
        const trumpSuit = this.state.trumpSuit;

        // If leading the trick
        if (!leadingSuit) {
            return this.chooseLeadingCard(player.hand);
        }

        // If following suit
        const cardsOfSuit = player.hand.filter(card => card.suit === leadingSuit);
        if (cardsOfSuit.length > 0) {
            return this.chooseFollowingCard(cardsOfSuit, player.hand);
        }

        // If no cards of leading suit, play trump or lowest card
        return this.chooseDiscardCard(player.hand, trumpSuit);
    }

    private calculateHandValue(hand: Card[]): number {
        return hand.reduce((sum, card) => sum + card.value, 0);
    }

    private chooseLeadingCard(hand: Card[]): number {
        // Prefer high-value cards when leading
        const sortedHand = [...hand].sort((a, b) => b.value - a.value);
        return hand.indexOf(sortedHand[0]);
    }

    private chooseFollowingCard(cardsOfSuit: Card[], hand: Card[]): number {
        const trickCards = this.state.currentTrick;
        const highestTrickCard = trickCards.reduce((highest, card) => {
            if (!highest) return card;
            return card.value > highest.value ? card : highest;
        });

        // Try to win the trick if possible
        const winningCards = cardsOfSuit.filter(card => card.value > highestTrickCard.value);
        if (winningCards.length > 0) {
            const bestCard = winningCards.sort((a, b) => b.value - a.value)[0];
            return hand.indexOf(bestCard);
        }

        // If can't win, play lowest card
        const lowestCard = cardsOfSuit.sort((a, b) => a.value - b.value)[0];
        return hand.indexOf(lowestCard);
    }

    private chooseDiscardCard(hand: Card[], trumpSuit: Suit | null): number {
        // If have trump cards, play lowest trump
        if (trumpSuit) {
            const trumpCards = hand.filter(card => card.suit === trumpSuit);
            if (trumpCards.length > 0) {
                const lowestTrump = trumpCards.sort((a, b) => a.value - b.value)[0];
                return hand.indexOf(lowestTrump);
            }
        }

        // Otherwise play lowest non-trump card
        const nonTrumpCards = trumpSuit 
            ? hand.filter(card => card.suit !== trumpSuit)
            : hand;
        
        const lowestCard = nonTrumpCards.sort((a, b) => a.value - b.value)[0];
        return hand.indexOf(lowestCard);
    }
} 