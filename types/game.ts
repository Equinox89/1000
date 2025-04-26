export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
    suit: Suit;
    rank: Rank;
    value: number;
}

export interface Player {
    id: string;
    name: string;
    isBot: boolean;
    hand: Card[];
    score: number;
    currentBid: number;
    marriages: Suit[];
}

export interface GameState {
    players: Player[];
    currentPlayer: string;
    dealer: string;
    trumpSuit: Suit | null;
    currentTrick: Card[];
    deck: Card[];
    talon: Card[];
    phase: 'bidding' | 'playing' | 'roundEnd' | 'gameEnd';
    highestBid: number;
    highestBidder: string | null;
    declaredMarriages: Record<string, Suit[]>;
}

export interface GameConfig {
    numberOfPlayers: 3 | 4;
    botNames: string[];
    startingScore: number;
    targetScore: number;
}

export interface GameResult {
    date: string;
    players: {
        name: string;
        score: number;
        bid: number;
    }[];
    winner: string;
}

export interface GameHistory {
    games: GameResult[];
    totalScores: Record<string, number>;
} 