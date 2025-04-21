<template>
  <div class="min-h-screen bg-emerald-800">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold text-center text-white mb-8">1000</h1>
      <div class="bg-emerald-700 rounded-2xl p-6 shadow-2xl">
        <GameBoard 
          :number-of-players="3"
          :bot-names="['Bart', 'Lisa']"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import GameBoard from './components/GameBoard.vue';
</script>

