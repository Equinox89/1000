# Thousand Card Game

A multiplayer card game implementation of the popular "Thousand" game, supporting 3-4 players with bot opponents.

## Game Rules

Thousand is a trick-taking card game where players bid on the number of points they think they can win in a round. The game is played with a standard deck of cards, and the goal is to be the first player to reach 1000 points.

### Basic Rules:
- 3-4 players
- Standard deck of cards (36 cards, 6-Ace)
- Each player receives 6 cards
- Players bid on the number of points they can win
- The highest bidder chooses the trump suit
- Players must follow suit if possible
- Points are awarded based on card values and tricks won

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:3000`

## Features

- Local multiplayer with 3-4 players
- AI bot opponents
- Future support for online multiplayer via WebSocket
- Modern UI with responsive design

## Project Structure

- `components/` - Vue components for the game interface
- `game/` - Core game logic and rules
- `server/` - WebSocket server for future online multiplayer
- `assets/` - Game assets (cards, images, etc.)
- `types/` - TypeScript type definitions
