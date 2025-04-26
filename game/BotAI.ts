import type { GameState, Player, Card, Suit } from '../types/game';

export class BotAI {
    private state: GameState;
    private playedCards: Card[] = [];

    constructor(state: GameState) {
        this.state = state;
    }

    public makeBid(player: Player): number {
        // Calculate hand strength
        const handStrength = this.calculateHandStrength(player);
        
        // Check for marriages
        const hasMarriage = this.hasMarriage(player);
        
        // Base bid calculation
        let bid = Math.floor(handStrength * 1.2); // Add 20% margin
        
        // Round to nearest 5
        bid = Math.ceil(bid / 5) * 5;
        
        // If we have marriage, we can bid higher
        if (hasMarriage) {
            bid = Math.min(bid + 20, 1000); // Add bonus for marriage
        } else {
            bid = Math.min(bid, 120); // Cap at 120 without marriage
        }
        
        // Ensure bid is higher than current highest bid
        bid = Math.max(bid, this.state.highestBid + 5);
        
        return bid;
    }

    public chooseCard(player: Player): number {
        const leadingSuit = this.state.currentTrick[0]?.suit;
        const trumpSuit = this.state.trumpSuit;
        
        // If we're leading
        if (!leadingSuit) {
            return this.chooseLeadCard(player);
        }
        
        // If we have to follow suit
        const cardsOfSuit = player.hand.filter(card => card.suit === leadingSuit);
        if (cardsOfSuit.length > 0) {
            return this.chooseFollowCard(player, cardsOfSuit, leadingSuit);
        }
        
        // If we don't have to follow suit
        return this.chooseDiscardCard(player);
    }

    private calculateHandStrength(player: Player): number {
        let strength = 0;
        
        // Count high cards
        const highCards = player.hand.filter(card => 
            card.rank === 'A' || card.rank === '10' || card.rank === 'K'
        );
        strength += highCards.length * 10;
        
        // Count trump cards
        const trumpCards = player.hand.filter(card => card.suit === this.state.trumpSuit);
        strength += trumpCards.length * 5;
        
        // Check for potential marriages
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as Suit[];
        for (const suit of suits) {
            const hasQueen = player.hand.some(card => card.suit === suit && card.rank === 'Q');
            const hasKing = player.hand.some(card => card.suit === suit && card.rank === 'K');
            if (hasQueen && hasKing) {
                strength += 20; // Bonus for marriage
            }
        }
        
        return strength;
    }

    private hasMarriage(player: Player): boolean {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as Suit[];
        for (const suit of suits) {
            const hasQueen = player.hand.some(card => card.suit === suit && card.rank === 'Q');
            const hasKing = player.hand.some(card => card.suit === suit && card.rank === 'K');
            if (hasQueen && hasKing) {
                return true;
            }
        }
        return false;
    }

    private chooseLeadCard(player: Player): number {
        // Try to lead with high non-trump cards first
        const nonTrumpCards = player.hand.filter(card => card.suit !== this.state.trumpSuit);
        const highNonTrump = nonTrumpCards.filter(card => 
            card.rank === 'A' || card.rank === '10' || card.rank === 'K'
        );
        
        if (highNonTrump.length > 0) {
            return player.hand.indexOf(highNonTrump[0]);
        }
        
        // If no high non-trump cards, lead with lowest trump
        const trumpCards = player.hand.filter(card => card.suit === this.state.trumpSuit);
        if (trumpCards.length > 0) {
            const lowestTrump = this.getLowestCard(trumpCards);
            return player.hand.indexOf(lowestTrump);
        }
        
        // If no trump cards, lead with lowest card
        return player.hand.indexOf(this.getLowestCard(player.hand));
    }

    private chooseFollowCard(player: Player, cardsOfSuit: Card[], leadingSuit: Suit): number {
        const currentTrick = this.state.currentTrick;
        const highestCard = this.getHighestCardInTrick(currentTrick);
        
        // If we can win the trick
        const winningCards = cardsOfSuit.filter(card => 
            this.compareCards(card, highestCard) > 0
        );
        
        if (winningCards.length > 0) {
            // Play the lowest winning card
            return player.hand.indexOf(this.getLowestCard(winningCards));
        }
        
        // If we can't win, play the lowest card
        return player.hand.indexOf(this.getLowestCard(cardsOfSuit));
    }

    private chooseDiscardCard(player: Player): number {
        // Try to discard lowest non-trump card
        const nonTrumpCards = player.hand.filter(card => card.suit !== this.state.trumpSuit);
        if (nonTrumpCards.length > 0) {
            return player.hand.indexOf(this.getLowestCard(nonTrumpCards));
        }
        
        // If only trump cards left, play the lowest one
        return player.hand.indexOf(this.getLowestCard(player.hand));
    }

    private getHighestCardInTrick(trick: Card[]): Card {
        return trick.reduce((highest, current) => 
            this.compareCards(current, highest) > 0 ? current : highest
        );
    }

    private getLowestCard(cards: Card[]): Card {
        return cards.reduce((lowest, current) => 
            this.compareCards(current, lowest) < 0 ? current : lowest
        );
    }

    private compareCards(card1: Card, card2: Card): number {
        // If one is trump and other isn't, trump wins
        if (card1.suit === this.state.trumpSuit && card2.suit !== this.state.trumpSuit) return 1;
        if (card2.suit === this.state.trumpSuit && card1.suit !== this.state.trumpSuit) return -1;
        
        // If same suit, compare ranks
        if (card1.suit === card2.suit) {
            const rankValues: Record<string, number> = {
                '9': 0, 'J': 1, 'Q': 2, 'K': 3, '10': 4, 'A': 5
            };
            return rankValues[card1.rank] - rankValues[card2.rank];
        }
        
        // Different non-trump suits are equal
        return 0;
    }
} 