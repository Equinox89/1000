<template>
  <div class="max-w-7xl mx-auto min-h-screen flex flex-col" @click="handleGameClick">
    <!-- Game table with players' cards -->
    <div class="relative flex-1 min-h-[600px] bg-emerald-800 rounded-3xl p-8 shadow-2xl grid grid-cols-2">
      <!-- Center area for current trick and talon -->
      <div class="flex items-center justify-center">
        <div class="flex flex-col items-center gap-8">
          <!-- Current trick -->
          <div v-if="gameState.currentTrick.length > 0" class="trick-area">
            <h3 class="text-lg font-semibold text-white mb-3">Current Trick</h3>
            <div class="flex gap-3">
              <div v-for="(card, index) in gameState.currentTrick" 
                   :key="index">
                <PlayingCard :card="card" />
              </div>
            </div>
          </div>

          <!-- Talon -->
          <div class="talon-area row-start-2">
            <h3 class="text-lg font-semibold text-white mb-3">Talon</h3>
            <div class="flex gap-3">
              <div v-for="(card, index) in gameState.talon" 
                   :key="index">
                <PlayingCard :card="card" :is-back="true" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Player areas -->
      <!-- Left player -->
      <div v-if="gameState.players[1]" class="">
        <div class="flex flex-col items-center">
          <h3 class="text-lg font-semibold text-white mb-2">{{ gameState.players[1].name }}</h3>
          <div class="flex gap-2">
            <div v-for="(card, index) in gameState.players[1].hand" 
                 :key="index">
              <PlayingCard :card="card" :is-back="gameState.players[1].isBot" />
            </div>
          </div>
        </div>
      </div>

      <!-- Right player -->
      <div v-if="gameState.players[2]" class="">
        <div class="flex flex-col items-center">
          <h3 class="text-lg font-semibold text-white mb-2">{{ gameState.players[2].name }}</h3>
          <div class="flex gap-2">
            <div v-for="(card, index) in gameState.players[2].hand" 
                 :key="index">
              <PlayingCard :card="card" :is-back="gameState.players[2].isBot" />
            </div>
          </div>
        </div>
      </div>

      <!-- Top player (for 4 players) -->
      <div v-if="gameState.players[3]" class="">
        <div class="flex flex-col items-center">
          <h3 class="text-lg font-semibold text-white mb-2">{{ gameState.players[3].name }}</h3>
          <div class="flex gap-2">
            <div v-for="(card, index) in gameState.players[3].hand" 
                 :key="index">
              <PlayingCard :card="card" :is-back="gameState.players[3].isBot" />
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom player (human) -->
      <div class="">
        <div class="flex flex-col items-center">
          <h3 class="text-lg font-semibold text-white mb-2">{{ gameState.players[0].name }}</h3>
          <div class="flex gap-2">
            <div v-for="(card, index) in gameState.players[0].hand" 
                 :key="index"
                 :class="[
                   'cursor-pointer transition-all duration-200',
                   isCardPlayable(gameState.players[0], card) ? 'hover:shadow-lg hover:-translate-y-1 hover:shadow-yellow-200/50' : ''
                 ]"
                 @click="playCard(gameState.players[0], index)">
              <PlayingCard :card="card" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bidding controls -->
    <div v-if="gameState.phase === 'bidding' && isCurrentPlayer" 
         class="mt-8 flex items-center justify-center gap-4">
      <template v-if="!hasChosenBiddingType">
        <button @click="chooseBiddingType('dark')"
                class="px-4 py-2 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-emerald-700 transition-colors duration-200">
          В темну
        </button>
        <button @click="chooseBiddingType('light')"
                class="px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-emerald-700 transition-colors duration-200">
          В світлу
        </button>
      </template>
      <template v-else>
        <div class="flex items-center gap-4">
          <input type="number" 
                 v-model="currentBid" 
                 :min="gameState.highestBid + 5"
                 :max="hasMarriage ? 1000 : 120"
                 placeholder="100"
                 step="5"
                 class="w-24 px-3 py-2 border-2 border-white/30 rounded-lg bg-white/10 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent">
          <button @click="makeBid"
                  class="px-4 py-2 bg-green-400 text-white font-semibold rounded-lg hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-emerald-700 transition-colors duration-200">
            Гра
          </button>
          <button @click="makeBid"
                  class="px-4 py-2 bg-red-500 text-white font-semibold rounded-lg hover:bg-yellow-300 focus:outline-none transition-colors duration-200">
            Пас
          </button>
          <div v-if="hasMarriage" class="text-yellow-400 font-semibold">
            У вас є марьяж! Можете робити ставки вище 120
          </div>
        </div>
      </template>
    </div>

    <!-- Show talon cards after bidding -->
    <div v-if="gameState.phase === 'playing' && gameState.talon.length === 0" 
         class="mb-6 p-4 bg-yellow-400/20 rounded-lg">
      <h3 class="text-lg font-semibold text-white mb-3">Карти з прикупа отримав {{ getHighestBidderName }}</h3>
      <div class="flex gap-3">
        <div v-for="(card, index) in gameState.players.find(p => p.id === gameState.highestBidder)?.hand.slice(-3)" 
             :key="index">
          <PlayingCard :card="card" />
        </div>
      </div>
    </div>

    <!-- Game info and history -->
    <div class="mt-8 backdrop-blur-sm bg-white/10 rounded-lg p-4 border-2 border-white/30">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div class="text-sm">
          <span class="font-medium text-white">Етап:</span>
          <span class="ml-2 text-white/80">{{ gameState.phase }}</span>
        </div>
        <div class="text-sm">
          <span class="font-medium text-white">Козир:</span>
          <span class="ml-2 text-white/80">{{ gameState.trumpSuit || 'Not set' }}</span>
        </div>
        <div class="text-sm">
          <span class="font-medium text-white">Найвища ставка:</span>
          <span class="ml-2 text-white/80">{{ gameState.highestBid }}</span>
        </div>
      </div>

      <!-- Score table -->
      <div class="mt-4">
        <h3 class="text-lg font-semibold text-white mb-2">Таблиця очок</h3>
        <table class="w-full text-white">
          <thead>
            <tr class="border-b border-white/30">
              <th class="text-left py-2">Гравець</th>
              <th class="text-right py-2">Очки</th>
              <th class="text-right py-2">Ставка</th>
              <th class="text-right py-2">Марьяжі</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="player in gameState.players" 
                :key="player.id"
                :class="[
                  'border-b border-white/10',
                  player.id === gameState.currentPlayer ? 'bg-yellow-400/10' : ''
                ]">
              <td class="py-2">{{ player.name }}</td>
              <td class="text-right">{{ player.score }}</td>
              <td class="text-right">{{ player.currentBid }}</td>
              <td class="text-right">{{ player.marriages.length }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Game History -->
      <div class="mt-8">
        <h3 class="text-lg font-semibold text-white mb-2">Історія ігор</h3>
        <div class="overflow-x-auto">
          <table class="w-full text-white">
            <thead>
              <tr class="border-b border-white/30">
                <th class="text-left py-2">Дата</th>
                <th v-for="player in gameState.players" 
                    :key="player.id" 
                    class="text-right py-2">
                  {{ player.name }}
                </th>
                <th class="text-right py-2">Переможець</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="game in gameHistory.games.slice().reverse()" 
                  :key="game.date"
                  class="border-b border-white/10">
                <td class="py-2">{{ new Date(game.date).toLocaleDateString() }}</td>
                <td v-for="player in gameState.players" 
                    :key="player.id"
                    class="text-right">
                  {{ game.players.find(p => p.name === player.name)?.score || 0 }}
                </td>
                <td class="text-right">{{ game.winner }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Total Scores -->
        <div class="mt-4">
          <h3 class="text-lg font-semibold text-white mb-2">Загальний рахунок</h3>
          <table class="w-full text-white">
            <thead>
              <tr class="border-b border-white/30">
                <th class="text-left py-2">Гравець</th>
                <th class="text-right py-2">Загальні очки</th>
                <th class="text-right py-2">Кількість ігор</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="player in gameState.players" 
                  :key="player.id"
                  class="border-b border-white/10">
                <td class="py-2">{{ player.name }}</td>
                <td class="text-right">{{ gameHistory.totalScores[player.name] || 0 }}</td>
                <td class="text-right">
                  {{ gameHistory.games.filter(game => 
                    game.players.some(p => p.name === player.name)
                  ).length }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Add trick completion indicator -->
    <div v-if="gameState.currentTrick.length === gameState.players.length" 
         class="fixed inset-0 flex items-center justify-center pointer-events-none">
      <div class="bg-yellow-400/20 p-4 rounded-lg text-white text-lg font-semibold">
        Клікніть для продовження
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { GameState, Player, Card, Suit } from '../types/game';
import { Game } from '../game/Game';
import { BotAI } from '../game/BotAI';
import PlayingCard from './PlayingCard.vue';
import { GameHistoryService } from '../services/gameHistory';

const props = defineProps<{
  numberOfPlayers: 3 | 4;
  botNames: string[];
}>();

const game = new Game({
  numberOfPlayers: props.numberOfPlayers,
  botNames: props.botNames,
  startingScore: 0,
  targetScore: 1000
});

// Deal cards when component is created
game.dealCards();
const gameState = ref<GameState>(game.getState());
const currentBid = ref(100);
const hasChosenBiddingType = ref(false);
const biddingType = ref<'dark' | 'light' | null>(null);
const gameHistory = ref(GameHistoryService.getHistory());
const isTrickComplete = ref(false);

// Add computed property for marriage check
const hasMarriage = computed(() => {
  const currentPlayer = gameState.value.players.find(p => p.id === gameState.value.currentPlayer);
  if (!currentPlayer) return false;
  
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  for (const suit of suits) {
    const hasQueen = currentPlayer.hand.some(card => card.suit === suit && card.rank === 'Q');
    const hasKing = currentPlayer.hand.some(card => card.suit === suit && card.rank === 'K');
    if (hasQueen && hasKing) {
      return true;
    }
  }
  return false;
});

// Add computed property for highest bidder name
const getHighestBidderName = computed(() => {
  const highestBidder = gameState.value.players.find(p => p.id === gameState.value.highestBidder);
  return highestBidder?.name || '';
});

// Add watch for game state changes
watch(gameState, (newState) => {
  if (newState.phase === 'gameEnd') {
    const winner = newState.players.reduce((prev, current) => 
      (prev.score > current.score) ? prev : current
    );
    
    GameHistoryService.saveGame({
      date: new Date().toISOString(),
      players: newState.players.map(p => ({
        name: p.name,
        score: p.score,
        bid: p.currentBid
      })),
      winner: winner.name
    });
    
    gameHistory.value = GameHistoryService.getHistory();
  }
}, { deep: true });

const isCurrentPlayer = computed(() => {
  const currentPlayer = gameState.value.players.find(p => p.id === gameState.value.currentPlayer);
  return currentPlayer && !currentPlayer.isBot;
});

const getSuitSymbol = (suit: string) => {
  const symbols: Record<string, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };
  return symbols[suit] || suit;
};

const isCardPlayable = (player: Player, card: Card) => {
  if (player.id !== gameState.value.currentPlayer) return false;
  if (gameState.value.phase !== 'playing') return false;

  const leadingSuit = gameState.value.currentTrick[0]?.suit;
  if (!leadingSuit) return true;

  const hasCardsOfSuit = player.hand.some(c => c.suit === leadingSuit);
  if (!hasCardsOfSuit) return true;

  return card.suit === leadingSuit;
};

const chooseBiddingType = (type: 'dark' | 'light') => {
  biddingType.value = type;
  hasChosenBiddingType.value = true;
  // Here you can add any additional logic for dark/light bidding
};

const makeBid = () => {
  if (currentBid.value <= gameState.value.highestBid) return;
  
  const currentPlayer = gameState.value.players.find(p => p.id === gameState.value.currentPlayer);
  if (!currentPlayer) return;

  game.makeBid(currentPlayer.id, currentBid.value);
  gameState.value = game.getState();

  // Process bot bidding if needed
  if (gameState.value.phase === 'bidding') {
    setTimeout(() => {
      const currentPlayer = gameState.value.players.find(p => p.id === gameState.value.currentPlayer);
      if (currentPlayer && currentPlayer.isBot) {
        processBotActions();
      }
    }, 1000);
  }
};

const playCard = (player: Player, cardIndex: number) => {
  if (!isCardPlayable(player, gameState.value.players[0].hand[cardIndex])) return;

  game.playCard(player.id, cardIndex);
  gameState.value = game.getState();
  isTrickComplete.value = false;

  // Start automatic bot playing
  if (gameState.value.phase === 'playing') {
    setTimeout(processBotActions, 1000);
  }
};

const handleGameClick = (event: MouseEvent) => {
  // Ignore clicks on cards and buttons
  if ((event.target as HTMLElement).closest('.card') || 
      (event.target as HTMLElement).closest('button')) {
    return;
  }

  // Only process clicks when trick is complete
  if (gameState.value.currentTrick.length === gameState.value.players.length) {
    isTrickComplete.value = true;
    // Clear current trick and continue game
    gameState.value.currentTrick = [];
    gameState.value.currentPlayer = gameState.value.players[0].id; // Reset to first player
  }
};

const processBotActions = () => {
  const currentPlayer = gameState.value.players.find(p => p.id === gameState.value.currentPlayer);
  if (!currentPlayer || !currentPlayer.isBot) return;

  const botAI = new BotAI(gameState.value);

  if (gameState.value.phase === 'bidding') {
    const bid = botAI.makeBid(currentPlayer);
    game.makeBid(currentPlayer.id, bid);
    gameState.value = game.getState();

    // Continue bidding if needed
    if (gameState.value.phase === 'bidding') {
      const nextPlayer = gameState.value.players.find(p => p.id === gameState.value.currentPlayer);
      if (nextPlayer && nextPlayer.isBot) {
        setTimeout(processBotActions, 1000);
      }
    }
  } else if (gameState.value.phase === 'playing' && !isTrickComplete.value) {
    const cardIndex = botAI.chooseCard(currentPlayer);
    game.playCard(currentPlayer.id, cardIndex);
    gameState.value = game.getState();

    // Continue playing if trick is not complete
    if (gameState.value.currentTrick.length < gameState.value.players.length) {
      setTimeout(processBotActions, 1000);
    }
  }
};
</script>

<style scoped>
.card-container {
  margin-left: 50px;
}

/* Add hover effect for playable cards */
.cursor-pointer:hover {
  transform: translateY(-10px);
  transition: transform 0.2s ease-in-out;
}
</style> 