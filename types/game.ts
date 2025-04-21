export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

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
}

export interface GameConfig {
    numberOfPlayers: 3 | 4;
    botNames: string[];
    startingScore: number;
    targetScore: number;
} 