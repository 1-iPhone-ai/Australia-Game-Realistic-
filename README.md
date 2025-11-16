# 🦘 Jet Lag: Australia Racing Game (Real-Time Edition)

A browser-based **real-time strategy racing game** inspired by "Jet Lag: The Game - Australia". Race against an AI opponent to control Australia's 8 regions through simultaneous gameplay - NO turn-based mechanics!

## ⚠️ Key Features

### ✅ REAL-TIME SIMULTANEOUS GAMEPLAY
- Both you and the AI act **at the same time** - no waiting for turns!
- AI makes decisions continuously (every 5-15 seconds)
- Player actions are **always available** (unless busy with a challenge or traveling)
- Live notifications show opponent actions in real-time

### 🗺️ Region Control System
- **Win Condition**: Control more of Australia's 8 regions than your opponent
- Deposit money in regions to claim control
- Regions can be **stolen** by depositing more than the current controller
- Deposits are permanent (money is locked)

### 🏆 Welcome Bonus Racing
- First player to arrive at an unvisited region gets **$750 bonus**
- Creates racing dynamics - rush to claim bonuses before AI!
- Only awarded once per region

### 🎯 Challenge System
- 4 unique challenges per region with varying difficulty
- Challenge durations: 3-18 seconds (simulated)
- Win multipliers: 1.5x to 4.0x
- Success rates: 25% to 70%

### ✈️ Flight System
- Real-time flights with progress bars
- Flight costs: $50-$650 depending on distance
- Flight durations: 3-35 seconds
- Can't take actions while traveling (but can observe)

### ⏱️ Day/Time System
- 4 days total
- Each day = 3 minutes (can be adjusted)
- Days advance automatically
- Game ends after Day 4 - player with most regions wins!

## 🎮 How to Play

### Installation
This is a **single React/TypeScript component** designed for Claude.ai Artifacts or any React environment.

**For Claude.ai Artifacts:**
1. Copy the entire contents of `australia-racing-realtime.tsx`
2. Paste into a Claude conversation
3. Ask Claude to "render this as an artifact"
4. Play directly in the browser!

**For Local Development:**
```bash
# Copy the file into your React project
# Import and render the component
import AustraliaRacingGame from './australia-racing-realtime'

function App() {
  return <AustraliaRacingGame />
}
```

### Game Rules

**Starting Position:**
- You start in New South Wales with $1,000
- AI starts in Queensland with $1,000
- Both can immediately take actions

**Actions Available:**
1. **🎯 Do Challenge** - Attempt challenges to win money
   - Select challenge and wager amount
   - Higher multipliers = harder challenges
   - You're "busy" during the challenge duration

2. **✈️ Travel** - Fly to other regions
   - View all available flights with costs and durations
   - Yellow star (★) indicates welcome bonus available
   - You're traveling during flight duration

3. **💰 Deposit Money** - Lock money in current region to control it
   - Whoever deposits the most controls the region
   - Deposits cannot be withdrawn
   - Steal regions by depositing more than opponent

**Winning:**
- Game ends after Day 4
- Player who controls the **most regions** wins
- Budget is tiebreaker if region count is equal

## 🤖 AI Behavior

The AI opponent:
- Acts continuously every 5-15 seconds
- Evaluates all possible actions (challenges, flights, deposits)
- Prioritizes:
  1. Stealing your regions (high value)
  2. Claiming welcome bonuses
  3. Defending its own regions
  4. High-value challenges
- Shows live activity so you can react strategically

## 🎨 Technical Details

**Built with:**
- React 18+ with hooks (useState, useEffect, useCallback)
- TypeScript for type safety
- Tailwind CSS for styling (core utilities only)
- Lucide-react for icons
- **No external dependencies** beyond React
- **No web workers** (uses setTimeout/setInterval for timing)
- Browser-based only
- Personal use only (non-commercial)

**Architecture:**
- Real-time state management with React hooks
- Continuous AI decision loop via async functions
- Progress tracking for challenges and flights
- Live activity feed with notifications
- Automatic day advancement
- Win condition checking

## 📋 Game Data

**8 Australian Regions:**
- Queensland (QLD)
- New South Wales (NSW)
- Victoria (VIC)
- Tasmania (TAS)
- South Australia (SA)
- Western Australia (WA)
- Northern Territory (NT)
- Australian Capital Territory (ACT)

**32 Unique Challenges:**
- 4 challenges per region
- Examples: "Make Rock Carving", "Throw Shrimp on Barbie", "Great Barrier Reef Tour"
- Varying difficulties and multipliers

**Flight Network:**
- All 56 possible flight routes (8×7)
- Dynamic pricing based on distance
- Realistic durations

## 🎯 Strategy Tips

1. **Race for Bonuses** - Book flights early to claim $750 welcome bonuses
2. **Challenge Wisely** - Balance risk vs reward on challenge wagers
3. **Defend Regions** - Monitor AI's location and defend your regions
4. **Steal Strategically** - Wait for AI to deposit, then deposit slightly more
5. **Budget Management** - Don't lock all your money in deposits too early
6. **Time Pressure** - Days advance automatically - act quickly!

## 🚀 Future Enhancements (Optional)

- Sound effects for actions
- Longer game durations (15 min per day)
- Multiplayer support (2 human players)
- Difficulty levels for AI
- Additional regions or challenges
- Save/load game state
- Statistics and leaderboards

## 📄 License

Personal use only. Non-commercial. Based on the "Jet Lag: The Game" concept.

---

**Enjoy racing across Australia! 🦘🏆**
