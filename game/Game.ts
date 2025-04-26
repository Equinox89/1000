import type { Card, GameState, GameConfig, Player, Suit, Rank } from '../types/game';

export class Game {
    private state: GameState;
    private config: GameConfig;
    private declaredMarriages: Record<string, Suit[]> = {};

    constructor(config: GameConfig) {
        this.config = config;
        this.state = this.initializeGame();
    }

    private initializeGame(): GameState {
        const players: Player[] = [];
        const deck = this.createDeck();

        // Create human player
        players.push({
            id: 'player1',
            name: 'You',
            isBot: false,
            hand: [],
            score: 0,
            currentBid: 0,
            marriages: []
        });

        // Create bot players
        for (let i = 0; i < this.config.numberOfPlayers - 1; i++) {
            players.push({
                id: `bot${i + 1}`,
                name: this.config.botNames[i],
                isBot: true,
                hand: [],
                score: 0,
                currentBid: 0,
                marriages: []
            });
        }

        return {
            players,
            currentPlayer: players[0].id,
            dealer: players[0].id,
            trumpSuit: null,
            currentTrick: [],
            deck,
            talon: [],
            phase: 'bidding',
            highestBid: 0,
            highestBidder: null,
            declaredMarriages: {}
        };
    }

    private createDeck(): Card[] {
        const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
        const ranks: Rank[] = ['9', '10', 'J', 'Q', 'K', 'A'];
        const deck: Card[] = [];

        for (const suit of suits) {
            for (const rank of ranks) {
                deck.push({
                    suit,
                    rank,
                    value: this.getCardValue(rank)
                });
            }
        }

        return this.shuffleDeck(deck);
    }

    private getCardValue(rank: Rank): number {
        const values: Record<Rank, number> = {
            '9': 0,
            '10': 10,
            'J': 2,
            'Q': 3,
            'K': 4,
            'A': 11
        };
        return values[rank];
    }

    private shuffleDeck(deck: Card[]): Card[] {
        const shuffled = [...deck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    public dealCards(): void {
        const cardsPerPlayer = 7;
        const talonSize = 3;

        // Deal cards to players
        this.state.players.forEach(player => {
            player.hand = this.state.deck.splice(0, cardsPerPlayer);
        });

        // Create talon
        this.state.talon = this.state.deck.splice(0, talonSize);
    }

    private hasMarriage(hand: Card[]): boolean {
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        for (const suit of suits) {
            const hasQueen = hand.some(card => card.suit === suit && card.rank === 'Q');
            const hasKing = hand.some(card => card.suit === suit && card.rank === 'K');
            if (hasQueen && hasKing) {
                return true;
            }
        }
        return false;
    }

    private getMarriageValue(suit: Suit): number {
        return suit === 'hearts' ? 100 : 80;
    }

    public declareMarriage(playerId: string, suit: Suit): boolean {
        const player = this.state.players.find(p => p.id === playerId);
        if (!player) return false;

        const hasQueen = player.hand.some(card => card.suit === suit && card.rank === 'Q');
        const hasKing = player.hand.some(card => card.suit === suit && card.rank === 'K');

        if (hasQueen && hasKing && !this.declaredMarriages[playerId]?.includes(suit)) {
            if (!this.declaredMarriages[playerId]) {
                this.declaredMarriages[playerId] = [];
            }
            this.declaredMarriages[playerId].push(suit);
            player.score += this.getMarriageValue(suit);
            return true;
        }

        return false;
    }

    public makeBid(playerId: string, bid: number): boolean {
        if (this.state.phase !== 'bidding') return false;
        
        const player = this.state.players.find(p => p.id === playerId);
        if (!player) return false;

        // Check if bid is higher than current highest bid
        if (bid <= this.state.highestBid) return false;

        // Check if bid is above 120 and player has marriage
        if (bid > 120 && !this.hasMarriage(player.hand)) return false;

        player.currentBid = bid;
        this.state.highestBid = bid;
        this.state.highestBidder = playerId;

        // If bid is 120 or higher, other players without marriage must pass
        if (bid >= 120) {
            this.state.players.forEach(p => {
                if (p.id !== playerId && !this.hasMarriage(p.hand)) {
                    p.currentBid = 0; // Force pass
                }
            });
        }

        // Move to next player
        const currentIndex = this.state.players.findIndex(p => p.id === playerId);
        const nextIndex = (currentIndex + 1) % this.state.players.length;
        this.state.currentPlayer = this.state.players[nextIndex].id;

        // If we've gone full circle, end bidding
        if (nextIndex === this.state.players.findIndex(p => p.id === this.state.dealer)) {
            this.state.phase = 'playing';
            // Set the highest bidder as the first player
            if (this.state.highestBidder) {
                this.state.currentPlayer = this.state.highestBidder;
                // Give talon cards to the highest bidder
                const highestBidderPlayer = this.state.players.find(p => p.id === this.state.highestBidder);
                if (highestBidderPlayer) {
                    highestBidderPlayer.hand.push(...this.state.talon);
                    this.state.talon = [];
                    
                    // Distribute one card to each player
                    this.state.players.forEach(p => {
                        if (p.id !== this.state.highestBidder) {
                            const lowestCard = this.getLowestValueCard(highestBidderPlayer.hand);
                            const cardIndex = highestBidderPlayer.hand.indexOf(lowestCard);
                            if (cardIndex !== -1) {
                                const [card] = highestBidderPlayer.hand.splice(cardIndex, 1);
                                p.hand.push(card);
                            }
                        }
                    });
                }
            }
        }

        return true;
    }

    private getLowestValueCard(hand: Card[]): Card {
        return hand.reduce((lowest, current) => 
            current.value < lowest.value ? current : lowest
        );
    }

    public playCard(playerId: string, cardIndex: number): boolean {
        if (this.state.phase !== 'playing') return false;
        if (this.state.currentPlayer !== playerId) return false;

        const player = this.state.players.find(p => p.id === playerId);
        if (!player || cardIndex < 0 || cardIndex >= player.hand.length) return false;

        // Check if the card is playable (following suit if possible)
        const card = player.hand[cardIndex];
        if (!this.isCardPlayable(player, card)) return false;

        // Remove card from player's hand
        const [playedCard] = player.hand.splice(cardIndex, 1);

        // Add card to current trick
        this.state.currentTrick.push({
            ...playedCard,
            playedBy: playerId
        });

        // Move to next player
        const currentIndex = this.state.players.findIndex(p => p.id === playerId);
        const nextIndex = (currentIndex + 1) % this.state.players.length;
        this.state.currentPlayer = this.state.players[nextIndex].id;

        // If trick is complete, determine winner and start new trick
        if (this.state.currentTrick.length === this.state.players.length) {
            this.resolveTrick();
        }

        return true;
    }

    private isCardPlayable(player: Player, card: Card): boolean {
        // If it's the first card of the trick, any card is playable
        if (this.state.currentTrick.length === 0) return true;

        // Get the leading suit
        const leadingSuit = this.state.currentTrick[0].suit;

        // If the card matches the leading suit, it's playable
        if (card.suit === leadingSuit) return true;

        // If the player has no cards of the leading suit, any card is playable
        return !player.hand.some(c => c.suit === leadingSuit);
    }

    private resolveTrick(): void {
        const leadingSuit = this.state.currentTrick[0].suit;
        const trumpSuit = this.state.trumpSuit;

        // Find the winning card
        let winningCard = this.state.currentTrick[0];
        let winningPlayerId = this.state.currentTrick[0].playedBy;

        for (let i = 1; i < this.state.currentTrick.length; i++) {
            const currentCard = this.state.currentTrick[i];
            
            // If current card is trump and winning card is not, current card wins
            if (currentCard.suit === trumpSuit && winningCard.suit !== trumpSuit) {
                winningCard = currentCard;
                winningPlayerId = currentCard.playedBy;
            }
            // If both cards are trump or both are not trump, compare values
            else if (currentCard.suit === winningCard.suit) {
                if (currentCard.value > winningCard.value) {
                    winningCard = currentCard;
                    winningPlayerId = currentCard.playedBy;
                }
            }
        }

        // Update scores
        const winningPlayer = this.state.players.find(p => p.id === winningPlayerId);
        if (winningPlayer) {
            const trickValue = this.state.currentTrick.reduce((sum, card) => sum + card.value, 0);
            winningPlayer.score += trickValue;
        }

        // Clear current trick
        this.state.currentTrick = [];

        // Check if round is over
        if (this.state.players.every(p => p.hand.length === 0)) {
            this.endRound();
        } else if (winningPlayerId) {
            // Set the winner as the next player to lead
            this.state.currentPlayer = winningPlayerId;
        }
    }

    private endRound(): void {
        // Calculate final scores and update game state
        this.state.phase = 'roundEnd';

        // Check if the highest bidder didn't meet their bid
        const highestBidder = this.state.players.find(p => p.id === this.state.highestBidder);
        if (highestBidder) {
            if (highestBidder.score < highestBidder.currentBid) {
                // Subtract the bid amount from the player's score
                highestBidder.score -= highestBidder.currentBid;
            }
        }

        // Check if game is over
        if (this.state.players.some(p => p.score >= this.config.targetScore)) {
            this.state.phase = 'gameEnd';
        } else {
            // Start new round
            const newState = this.initializeGame();
            newState.players = this.state.players.map(player => ({
                ...player,
                hand: [],
                currentBid: 0,
                marriages: []
            }));
            this.state = newState;
            this.dealCards();
        }
    }

    public getState(): GameState {
        return { ...this.state };
    }
} 