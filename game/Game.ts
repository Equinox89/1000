import type { Card, GameState, GameConfig, Player, Suit, Rank } from '../types/game';

export class Game {
    private state: GameState;
    private config: GameConfig;

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
            currentBid: 0
        });

        // Create bot players
        for (let i = 0; i < this.config.numberOfPlayers - 1; i++) {
            players.push({
                id: `bot${i + 1}`,
                name: this.config.botNames[i],
                isBot: true,
                hand: [],
                score: 0,
                currentBid: 0
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
            highestBidder: null
        };
    }

    private createDeck(): Card[] {
        const suits: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
        const ranks: Rank[] = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
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
            '6': 6,
            '7': 7,
            '8': 8,
            '9': 9,
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

        // Create prikup
        this.state.talon = this.state.deck.splice(0, talonSize);
    }

    public makeBid(playerId: string, bid: number): boolean {
        if (this.state.phase !== 'bidding') return false;
        if (bid <= this.state.highestBid) return false;

        const player = this.state.players.find(p => p.id === playerId);
        if (!player) return false;

        player.currentBid = bid;
        this.state.highestBid = bid;
        this.state.highestBidder = playerId;

        // Move to next player or end bidding
        const currentIndex = this.state.players.findIndex(p => p.id === playerId);
        const nextIndex = (currentIndex + 1) % this.state.players.length;
        this.state.currentPlayer = this.state.players[nextIndex].id;

        // If we've gone full circle, end bidding
        if (nextIndex === this.state.players.findIndex(p => p.id === this.state.dealer)) {
            this.state.phase = 'playing';
        }

        return true;
    }

    public playCard(playerId: string, cardIndex: number): boolean {
        if (this.state.phase !== 'playing') return false;
        if (this.state.currentPlayer !== playerId) return false;

        const player = this.state.players.find(p => p.id === playerId);
        if (!player) return false;

        const card = player.hand[cardIndex];
        if (!card) return false;

        // Remove card from player's hand
        player.hand.splice(cardIndex, 1);

        // Add card to current trick
        this.state.currentTrick.push(card);

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

    private resolveTrick(): void {
        // Determine trick winner based on trump suit and card values
        // This is a simplified version - you'll need to implement the full rules
        const winningCard = this.state.currentTrick.reduce((winner, card) => {
            if (!winner) return card;
            if (card.suit === this.state.trumpSuit && winner.suit !== this.state.trumpSuit) return card;
            if (card.suit === winner.suit && card.value > winner.value) return card;
            return winner;
        });

        // Clear current trick
        this.state.currentTrick = [];

        // Check if round is over
        if (this.state.players.every(p => p.hand.length === 0)) {
            this.endRound();
        }
    }

    private endRound(): void {
        // Calculate scores and update game state
        // This is a simplified version - you'll need to implement the full scoring rules
        this.state.phase = 'roundEnd';

        // Check if game is over
        if (this.state.players.some(p => p.score >= this.config.targetScore)) {
            this.state.phase = 'gameEnd';
        } else {
            // Start new round
            this.state = this.initializeGame();
        }
    }

    public getState(): GameState {
        return { ...this.state };
    }
} 