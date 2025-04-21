<template>
  <div class="card-container" :class="[
    { 'card-back': isBack },
    !isBack && (card.suit === 'hearts' || card.suit === 'diamonds') ? 'text-red-600' : 'text-gray-900'
  ]">
    <div v-if="!isBack" class="card-front">
      <div class="card-corner top-left">
        <div class="rank">{{ displayRank }}</div>
        <div class="suit">{{ suitSymbol }}</div>
      </div>
      <div class="card-center suit">{{ suitSymbol }}</div>
      <div class="card-corner bottom-right">
        <div class="rank">{{ displayRank }}</div>
        <div class="suit">{{ suitSymbol }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Card } from '../types/game';

const props = defineProps<{
  card: Card;
  isBack?: boolean;
}>();

const suitSymbol = computed(() => {
  const symbols: Record<string, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠'
  };
  return symbols[props.card.suit];
});

const displayRank = computed(() => {
  return props.card.rank;
});
</script>

<style scoped>
.card-container {
  width: 70px;
  height: 98px;
  background: white;
  border-radius: 5px;
  border: 1px solid #ddd;
  position: relative;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
  user-select: none;
}

.card-container:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.card-back {
  background: #1a4731;
  background-image: repeating-linear-gradient(
    45deg,
    #1a4731 0%,
    #1a4731 5%,
    #15392a 5%,
    #15392a 10%
  );
  border-color: #15392a;
}

.card-front {
  height: 100%;
  padding: 5px;
  position: relative;
}

.card-corner {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 14px;
  font-weight: bold;
  line-height: 1;
}

.top-left {
  top: 5px;
  left: 5px;
}

.bottom-right {
  bottom: 5px;
  right: 5px;
  transform: rotate(180deg);
}

.card-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
}

.suit {
  font-size: 16px;
  line-height: 1;
}

.rank {
  font-size: 14px;
  line-height: 1;
}
</style> 