<template>
  <div class="max-w-7xl mx-auto">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div v-for="player in gameState.players" 
           :key="player.id" 
           :class="[
             'border-2 rounded-lg p-4 transition-all duration-200 backdrop-blur-sm bg-white/10',
             player.id === gameState.currentPlayer 
               ? 'border-yellow-400 bg-yellow-50/20' 
               : 'border-white/30'
           ]">
        <h3 class="text-lg font-semibold text-white">{{ player.name }}</h3>
        <div class="text-sm text-white/80">Score: {{ player.score }}</div>
        <div v-if="gameState.phase === 'bidding'" class="text-sm text-white/80">
          Current Bid: {{ player.currentBid }}
        </div>
        <div class="flex flex-wrap gap-2 mt-3">
          <div v-for="(card, index) in player.hand" 
               :key="index"
               :class="[
                 'cursor-pointer transition-all duration-200',
                 isCardPlayable(player, card) ? 'hover:shadow-lg hover:-translate-y-1 hover:shadow-yellow-200/50' : ''
               ]"
               @click="playCard(player, index)">
            <PlayingCard :card="card" :is-back="player.isBot" />
          </div>
        </div>
      </div>
    </div>

    <div class="trick-area" v-if="gameState.currentTrick.length > 0">
      <h3>Current Trick</h3>
      <div class="trick-cards">
        <div v-for="(card, index) in gameState.currentTrick" 
             :key="index">
          <PlayingCard :card="card" />
        </div>
      </div>
    </div>

    <!-- Add Prikup display -->
    <div class="talon-area mb-6">
      <h3 class="text-lg font-semibold text-white mb-3">Talon</h3>
      <div class="flex gap-3">
        <div v-for="(card, index) in gameState.talon" 
             :key="index">
          <PlayingCard :card="card" :is-back="true" />
        </div>
      </div>
    </div>

    <div v-if="gameState.phase === 'bidding' && isCurrentPlayer" 
         class="flex items-center gap-4 mb-6">
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
        <input type="number" 
               v-model="currentBid" 
               :min="gameState.highestBid + 5"
               :max="120"
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
      </template>
    </div>

    <div class="backdrop-blur-sm bg-white/10 rounded-lg p-4 border-2 border-white/30">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { GameState, Player, Card } from '../types/game';
import { Game } from '../game/Game';
import { BotAI } from '../game/BotAI';
import PlayingCard from './PlayingCard.vue';

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
const showAllHands = ref(false);
const hasChosenBiddingType = ref(false);
const biddingType = ref<'dark' | 'light' | null>(null);

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

  if (gameState.value.phase === 'bidding') {
    setTimeout(processBotActions, 1000);
  }
};

const playCard = (player: Player, cardIndex: number) => {
  if (!isCardPlayable(player, gameState.value.players[0].hand[cardIndex])) return;

  game.playCard(player.id, cardIndex);
  gameState.value = game.getState();

  if (gameState.value.phase === 'playing') {
    setTimeout(processBotActions, 1000);
  }
};

const processBotActions = () => {
  const currentPlayer = gameState.value.players.find(p => p.id === gameState.value.currentPlayer);
  if (!currentPlayer || !currentPlayer.isBot) return;

  const botAI = new BotAI(gameState.value);

  if (gameState.value.phase === 'bidding') {
    const bid = botAI.makeBid(currentPlayer);
    game.makeBid(currentPlayer.id, bid);
  } else if (gameState.value.phase === 'playing') {
    const cardIndex = botAI.chooseCard(currentPlayer);
    game.playCard(currentPlayer.id, cardIndex);
  }

  gameState.value = game.getState();

  if (gameState.value.phase === 'bidding' || gameState.value.phase === 'playing') {
    setTimeout(processBotActions, 1000);
  }
};
</script>

<style scoped>

</style> 