import type { GameResult, GameHistory } from '../types/game';

const STORAGE_KEY = 'thousand_game_history';

export class GameHistoryService {
    private static isLocalStorageAvailable(): boolean {
        if (typeof window === 'undefined') return false;
        
        try {
            const testKey = '__test__';
            window.localStorage.setItem(testKey, testKey);
            window.localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    public static saveGame(result: GameResult): void {
        if (!this.isLocalStorageAvailable()) return;

        const history = this.getHistory();
        history.games.push(result);

        // Update total scores
        result.players.forEach(player => {
            if (!history.totalScores[player.name]) {
                history.totalScores[player.name] = 0;
            }
            // Add the score to the total (negative scores are already handled in the game logic)
            history.totalScores[player.name] += player.score;
        });

        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }

    public static getHistory(): GameHistory {
        if (!this.isLocalStorageAvailable()) {
            return {
                games: [],
                totalScores: {}
            };
        }

        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return {
                games: [],
                totalScores: {}
            };
        }

        return JSON.parse(stored);
    }

    public static clearHistory(): void {
        if (!this.isLocalStorageAvailable()) return;
        window.localStorage.removeItem(STORAGE_KEY);
    }
} 