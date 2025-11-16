import React, { useState, useReducer, useEffect, useCallback, useMemo } from 'react';
import { Plane, MapPin, Trophy, DollarSign, Target, Calendar, AlertCircle, CheckCircle, XCircle, Map as MapIcon, Menu, X } from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type RegionCode = 'QLD' | 'NSW' | 'VIC' | 'TAS' | 'SA' | 'WA' | 'NT' | 'ACT';
type Difficulty = 'easy' | 'medium' | 'hard';
type PlayerName = 'Player' | 'AI';

interface Challenge {
  id: string;
  name: string;
  description: string;
  multiplier: number;
  difficulty: Difficulty;
  baseSuccessChance: number;
}

interface Region {
  code: RegionCode;
  name: string;
  controller: PlayerName | null;
  deposits: Record<PlayerName, number>;
  welcomeBonusAvailable: boolean;
  challenges: Challenge[];
  position: { x: number; y: number }; // For map rendering
}

interface Player {
  name: PlayerName;
  budget: number;
  currentRegion: RegionCode;
  depositsByRegion: Record<RegionCode, number>;
  regionsControlled: RegionCode[];
  visitedRegions: Set<RegionCode>;
}

interface FlightOption {
  destination: RegionCode;
  cost: number;
  departureTime: string;
}

interface GameState {
  day: number;
  players: Record<PlayerName, Player>;
  regions: Record<RegionCode, Region>;
  gameOver: boolean;
  winner: PlayerName | null;
  notifications: Notification[];
  aiThinking: boolean;
}

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'danger';
  timestamp: number;
}

type GameAction =
  | { type: 'TRAVEL'; player: PlayerName; destination: RegionCode; cost: number }
  | { type: 'COMPLETE_CHALLENGE'; player: PlayerName; challenge: Challenge; wager: number; success: boolean }
  | { type: 'DEPOSIT'; player: PlayerName; region: RegionCode; amount: number }
  | { type: 'CLAIM_WELCOME_BONUS'; player: PlayerName; region: RegionCode }
  | { type: 'ADVANCE_DAY' }
  | { type: 'ADD_NOTIFICATION'; notification: Notification }
  | { type: 'CLEAR_NOTIFICATION'; id: string }
  | { type: 'SET_AI_THINKING'; thinking: boolean }
  | { type: 'END_GAME' };

// ============================================================================
// CONSTANTS
// ============================================================================

const REGION_DATA: Record<RegionCode, { name: string; position: { x: number; y: number } }> = {
  QLD: { name: 'Queensland', position: { x: 75, y: 20 } },
  NSW: { name: 'New South Wales', position: { x: 75, y: 45 } },
  VIC: { name: 'Victoria', position: { x: 70, y: 65 } },
  TAS: { name: 'Tasmania', position: { x: 72, y: 85 } },
  SA: { name: 'South Australia', position: { x: 55, y: 55 } },
  WA: { name: 'Western Australia', position: { x: 25, y: 40 } },
  NT: { name: 'Northern Territory', position: { x: 50, y: 25 } },
  ACT: { name: 'Australian Capital Territory', position: { x: 78, y: 55 } },
};

const ADJACENT_REGIONS: Record<RegionCode, RegionCode[]> = {
  QLD: ['NSW', 'NT'],
  NSW: ['QLD', 'VIC', 'SA', 'ACT'],
  VIC: ['NSW', 'SA', 'TAS'],
  TAS: ['VIC'],
  SA: ['NSW', 'VIC', 'NT', 'WA'],
  WA: ['NT', 'SA'],
  NT: ['QLD', 'SA', 'WA'],
  ACT: ['NSW'],
};

const CHALLENGES_BY_REGION: Record<RegionCode, Challenge[]> = {
  NSW: [
    { id: 'nsw1', name: 'Rock Carving', description: 'Create traditional Aboriginal rock art', multiplier: 2, difficulty: 'medium', baseSuccessChance: 0.5 },
    { id: 'nsw2', name: 'AFL Goal', description: 'Score a goal in Australian Football', multiplier: 2, difficulty: 'medium', baseSuccessChance: 0.45 },
    { id: 'nsw3', name: 'Carnival Game', description: 'Win at Luna Park carnival game', multiplier: 3, difficulty: 'hard', baseSuccessChance: 0.3 },
    { id: 'nsw4', name: 'Taste Test', description: 'Identify Australian foods blindfolded', multiplier: 1.5, difficulty: 'easy', baseSuccessChance: 0.7 },
  ],
  TAS: [
    { id: 'tas1', name: 'Signal Flags', description: 'Read and translate maritime signal flags', multiplier: 2, difficulty: 'medium', baseSuccessChance: 0.5 },
    { id: 'tas2', name: 'Kelp Basket', description: 'Weave a basket from kelp', multiplier: 2, difficulty: 'medium', baseSuccessChance: 0.45 },
    { id: 'tas3', name: 'Shrimp on Barbie', description: 'Throw shrimp onto barbie (100 tries)', multiplier: 4, difficulty: 'hard', baseSuccessChance: 0.25 },
    { id: 'tas4', name: 'Tim Tam Slice', description: 'Cut Tim Tam with non-knife object', multiplier: 2, difficulty: 'medium', baseSuccessChance: 0.55 },
  ],
  QLD: [
    { id: 'qld1', name: 'Surf Lesson', description: 'Catch and ride a wave at Gold Coast', multiplier: 2, difficulty: 'medium', baseSuccessChance: 0.5 },
    { id: 'qld2', name: 'Feed Kangaroos', description: 'Successfully feed wild kangaroos', multiplier: 1.5, difficulty: 'easy', baseSuccessChance: 0.75 },
    { id: 'qld3', name: 'Reef Quiz', description: 'Answer Great Barrier Reef trivia', multiplier: 2, difficulty: 'medium', baseSuccessChance: 0.5 },
    { id: 'qld4', name: 'Rainforest Navigation', description: 'Navigate through Daintree Rainforest', multiplier: 3, difficulty: 'hard', baseSuccessChance: 0.35 },
  ],
  VIC: [
    { id: 'vic1', name: 'Coffee Art', description: 'Create latte art in Melbourne cafe', multiplier: 2, difficulty: 'medium', baseSuccessChance: 0.45 },
    { id: 'vic2', name: 'Tram Routes', description: 'Navigate tram system without help', multiplier: 1.5, difficulty: 'easy', baseSuccessChance: 0.7 },
    { id: 'vic3', name: 'Cricket Bowl', description: 'Bowl a wicket at MCG', multiplier: 3, difficulty: 'hard', baseSuccessChance: 0.3 },
    { id: 'vic4', name: 'Penguin Count', description: 'Count penguins at Phillip Island', multiplier: 2, difficulty: 'medium', baseSuccessChance: 0.5 },
  ],
  SA: [
    { id: 'sa1', name: 'Wine Tasting', description: 'Identify Barossa Valley wines', multiplier: 2, difficulty: 'medium', baseSuccessChance: 0.5 },
    { id: 'sa2', name: 'Opal Mining', description: 'Find an opal in Coober Pedy', multiplier: 3, difficulty: 'hard', baseSuccessChance: 0.3 },
    { id: 'sa3', name: 'Adelaide Oval Tour', description: 'Complete cricket ground tour quiz', multiplier: 1.5, difficulty: 'easy', baseSuccessChance: 0.7 },
    { id: 'sa4', name: 'Pie Floater', description: 'Eat traditional SA pie floater', multiplier: 2, difficulty: 'medium', baseSuccessChance: 0.55 },
  ],
  WA: [
    { id: 'wa1', name: 'Quokka Selfie', description: 'Get perfect selfie with quokka', multiplier: 1.5, difficulty: 'easy', baseSuccessChance: 0.7 },
    { id: 'wa2', name: 'Pearl Diving', description: 'Dive for pearls in Broome', multiplier: 3, difficulty: 'hard', baseSuccessChance: 0.3 },
    { id: 'wa3', name: 'Wildflower ID', description: 'Identify WA wildflowers', multiplier: 2, difficulty: 'medium', baseSuccessChance: 0.5 },
    { id: 'wa4', name: 'Beach Cricket', description: 'Score runs in beach cricket', multiplier: 2, difficulty: 'medium', baseSuccessChance: 0.5 },
  ],
  NT: [
    { id: 'nt1', name: 'Crocodile Spotting', description: 'Spot crocodiles in the wild', multiplier: 2, difficulty: 'medium', baseSuccessChance: 0.55 },
    { id: 'nt2', name: 'Didgeridoo Play', description: 'Play didgeridoo for 30 seconds', multiplier: 2, difficulty: 'medium', baseSuccessChance: 0.45 },
    { id: 'nt3', name: 'Outback Navigation', description: 'Navigate outback without GPS', multiplier: 3, difficulty: 'hard', baseSuccessChance: 0.3 },
    { id: 'nt4', name: 'Bush Tucker', description: 'Identify edible bush tucker', multiplier: 2, difficulty: 'medium', baseSuccessChance: 0.5 },
  ],
  ACT: [
    { id: 'act1', name: 'Parliament Quiz', description: 'Answer Australian politics questions', multiplier: 2, difficulty: 'medium', baseSuccessChance: 0.5 },
    { id: 'act2', name: 'War Memorial Tour', description: 'Complete AWM scavenger hunt', multiplier: 1.5, difficulty: 'easy', baseSuccessChance: 0.7 },
    { id: 'act3', name: 'Gallery Art', description: 'Identify artists at National Gallery', multiplier: 2, difficulty: 'medium', baseSuccessChance: 0.45 },
    { id: 'act4', name: 'Balloon Flight', description: 'Navigate hot air balloon landing', multiplier: 3, difficulty: 'hard', baseSuccessChance: 0.35 },
  ],
};

const STARTING_BUDGET = 1000;
const WELCOME_BONUS = 750;
const TOTAL_DAYS = 4;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateFlightCost(from: RegionCode, to: RegionCode): number {
  const isAdjacent = ADJACENT_REGIONS[from].includes(to);
  const isIsland = to === 'TAS' || from === 'TAS';

  if (isIsland) {
    return Math.floor(700 + Math.random() * 200); // 700-900
  } else if (isAdjacent) {
    return Math.floor(200 + Math.random() * 100); // 200-300
  } else {
    return Math.floor(400 + Math.random() * 200); // 400-600
  }
}

function generateFlightOptions(from: RegionCode, currentDay: number): FlightOption[] {
  const allRegions = Object.keys(REGION_DATA) as RegionCode[];
  const destinations = allRegions.filter(r => r !== from);

  return destinations.map(dest => {
    const hour = 8 + Math.floor(Math.random() * 10); // 8 AM to 6 PM
    const minute = Math.random() > 0.5 ? '00' : '30';
    return {
      destination: dest,
      cost: calculateFlightCost(from, dest),
      departureTime: `${hour}:${minute} ${hour < 12 ? 'AM' : 'PM'}`,
    };
  }).sort((a, b) => a.cost - b.cost);
}

function calculateRegionController(region: Region): PlayerName | null {
  const playerDeposit = region.deposits.Player || 0;
  const aiDeposit = region.deposits.AI || 0;

  if (playerDeposit > aiDeposit) return 'Player';
  if (aiDeposit > playerDeposit) return 'AI';
  return null;
}

function updateRegionControllers(state: GameState): GameState {
  const updatedRegions = { ...state.regions };
  const playerControlled: RegionCode[] = [];
  const aiControlled: RegionCode[] = [];

  Object.entries(updatedRegions).forEach(([code, region]) => {
    const controller = calculateRegionController(region);
    updatedRegions[code as RegionCode] = { ...region, controller };

    if (controller === 'Player') playerControlled.push(code as RegionCode);
    if (controller === 'AI') aiControlled.push(code as RegionCode);
  });

  return {
    ...state,
    regions: updatedRegions,
    players: {
      ...state.players,
      Player: { ...state.players.Player, regionsControlled: playerControlled },
      AI: { ...state.players.AI, regionsControlled: aiControlled },
    },
  };
}

function checkWinCondition(state: GameState): { gameOver: boolean; winner: PlayerName | null } {
  if (state.day > TOTAL_DAYS) {
    const playerRegions = state.players.Player.regionsControlled.length;
    const aiRegions = state.players.AI.regionsControlled.length;

    if (playerRegions > aiRegions) {
      return { gameOver: true, winner: 'Player' };
    } else if (aiRegions > playerRegions) {
      return { gameOver: true, winner: 'AI' };
    } else {
      // Tiebreaker: total money deposited
      const playerTotal = Object.values(state.players.Player.depositsByRegion).reduce((a, b) => a + b, 0);
      const aiTotal = Object.values(state.players.AI.depositsByRegion).reduce((a, b) => a + b, 0);

      if (playerTotal > aiTotal) return { gameOver: true, winner: 'Player' };
      if (aiTotal > playerTotal) return { gameOver: true, winner: 'AI' };

      // Final tiebreaker: remaining budget
      return {
        gameOver: true,
        winner: state.players.Player.budget >= state.players.AI.budget ? 'Player' : 'AI',
      };
    }
  }

  return { gameOver: false, winner: null };
}

// ============================================================================
// GAME REDUCER
// ============================================================================

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'TRAVEL': {
      const { player, destination, cost } = action;
      const currentPlayer = state.players[player];

      if (currentPlayer.budget < cost) return state;

      const newBudget = currentPlayer.budget - cost;
      const newVisited = new Set(currentPlayer.visitedRegions);
      newVisited.add(destination);

      return {
        ...state,
        players: {
          ...state.players,
          [player]: {
            ...currentPlayer,
            budget: newBudget,
            currentRegion: destination,
            visitedRegions: newVisited,
          },
        },
      };
    }

    case 'CLAIM_WELCOME_BONUS': {
      const { player, region } = action;
      const regionData = state.regions[region];

      if (!regionData.welcomeBonusAvailable) return state;

      const currentPlayer = state.players[player];

      return {
        ...state,
        players: {
          ...state.players,
          [player]: {
            ...currentPlayer,
            budget: currentPlayer.budget + WELCOME_BONUS,
          },
        },
        regions: {
          ...state.regions,
          [region]: {
            ...regionData,
            welcomeBonusAvailable: false,
          },
        },
      };
    }

    case 'COMPLETE_CHALLENGE': {
      const { player, challenge, wager, success } = action;
      const currentPlayer = state.players[player];

      if (currentPlayer.budget < wager) return state;

      let newBudget: number;
      if (success) {
        const winnings = Math.floor(wager * challenge.multiplier);
        newBudget = currentPlayer.budget - wager + winnings;
      } else {
        newBudget = currentPlayer.budget - wager;
      }

      return {
        ...state,
        players: {
          ...state.players,
          [player]: {
            ...currentPlayer,
            budget: Math.max(0, newBudget),
          },
        },
      };
    }

    case 'DEPOSIT': {
      const { player, region, amount } = action;
      const currentPlayer = state.players[player];
      const regionData = state.regions[region];

      if (currentPlayer.budget < amount || currentPlayer.currentRegion !== region) {
        return state;
      }

      const newBudget = currentPlayer.budget - amount;
      const currentDeposit = currentPlayer.depositsByRegion[region] || 0;
      const newDepositsByRegion = {
        ...currentPlayer.depositsByRegion,
        [region]: currentDeposit + amount,
      };

      const newRegionDeposits = {
        ...regionData.deposits,
        [player]: (regionData.deposits[player] || 0) + amount,
      };

      const updatedState = {
        ...state,
        players: {
          ...state.players,
          [player]: {
            ...currentPlayer,
            budget: newBudget,
            depositsByRegion: newDepositsByRegion,
          },
        },
        regions: {
          ...state.regions,
          [region]: {
            ...regionData,
            deposits: newRegionDeposits,
          },
        },
      };

      return updateRegionControllers(updatedState);
    }

    case 'ADVANCE_DAY': {
      const newDay = state.day + 1;
      const { gameOver, winner } = checkWinCondition({ ...state, day: newDay });

      return {
        ...state,
        day: newDay,
        gameOver,
        winner,
      };
    }

    case 'ADD_NOTIFICATION': {
      return {
        ...state,
        notifications: [...state.notifications, action.notification],
      };
    }

    case 'CLEAR_NOTIFICATION': {
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.id),
      };
    }

    case 'SET_AI_THINKING': {
      return {
        ...state,
        aiThinking: action.thinking,
      };
    }

    case 'END_GAME': {
      const { gameOver, winner } = checkWinCondition(state);
      return {
        ...state,
        gameOver,
        winner,
      };
    }

    default:
      return state;
  }
}

// ============================================================================
// INITIAL STATE
// ============================================================================

function createInitialState(): GameState {
  const regions: Record<RegionCode, Region> = {} as Record<RegionCode, Region>;

  Object.entries(REGION_DATA).forEach(([code, data]) => {
    regions[code as RegionCode] = {
      code: code as RegionCode,
      name: data.name,
      controller: null,
      deposits: { Player: 0, AI: 0 },
      welcomeBonusAvailable: true,
      challenges: CHALLENGES_BY_REGION[code as RegionCode],
      position: data.position,
    };
  });

  const startingRegion: RegionCode = 'NSW';

  return {
    day: 1,
    players: {
      Player: {
        name: 'Player',
        budget: STARTING_BUDGET,
        currentRegion: startingRegion,
        depositsByRegion: {} as Record<RegionCode, number>,
        regionsControlled: [],
        visitedRegions: new Set([startingRegion]),
      },
      AI: {
        name: 'AI',
        budget: STARTING_BUDGET,
        currentRegion: 'QLD', // AI starts in different region
        depositsByRegion: {} as Record<RegionCode, number>,
        regionsControlled: [],
        visitedRegions: new Set(['QLD']),
      },
    },
    regions,
    gameOver: false,
    winner: null,
    notifications: [],
    aiThinking: false,
  };
}

// ============================================================================
// AI LOGIC
// ============================================================================

interface AIDecision {
  type: 'travel' | 'challenge' | 'deposit' | 'wait';
  value: number;
  data?: any;
}

function evaluateAIActions(state: GameState): AIDecision {
  const ai = state.players.AI;
  const currentRegion = state.regions[ai.currentRegion];
  const decisions: AIDecision[] = [];

  // Evaluate deposits (defensive and offensive)
  Object.entries(state.regions).forEach(([code, region]) => {
    const regionCode = code as RegionCode;
    const playerDeposit = region.deposits.Player || 0;
    const aiDeposit = region.deposits.AI || 0;

    // Defensive: protect controlled regions
    if (region.controller === 'AI' && playerDeposit > aiDeposit - 200) {
      const neededDeposit = playerDeposit - aiDeposit + 150;
      if (ai.budget > neededDeposit && ai.currentRegion === regionCode) {
        decisions.push({
          type: 'deposit',
          value: 800, // High priority to defend
          data: { region: regionCode, amount: neededDeposit },
        });
      }
    }

    // Offensive: steal regions
    if (region.controller === 'Player' && ai.budget > (playerDeposit - aiDeposit + 100) * 2) {
      const neededDeposit = playerDeposit - aiDeposit + 100;
      if (ai.currentRegion === regionCode) {
        decisions.push({
          type: 'deposit',
          value: 600, // Medium-high priority to steal
          data: { region: regionCode, amount: neededDeposit },
        });
      }
    }

    // Claim uncontrolled regions cheaply
    if (!region.controller && ai.currentRegion === regionCode && ai.budget > 300) {
      const safeAmount = Math.min(400, Math.floor(ai.budget * 0.3));
      decisions.push({
        type: 'deposit',
        value: 500,
        data: { region: regionCode, amount: safeAmount },
      });
    }
  });

  // Evaluate travel options
  const flights = generateFlightOptions(ai.currentRegion, state.day);
  flights.forEach(flight => {
    const destRegion = state.regions[flight.destination];
    let value = 0;

    // Welcome bonus is very valuable
    if (destRegion.welcomeBonusAvailable) {
      value += WELCOME_BONUS - flight.cost;
    }

    // Uncontrolled regions are attractive
    if (!destRegion.controller) {
      value += 300;
    }

    // Prefer cheaper flights
    value -= flight.cost * 0.5;

    if (value > 100 && ai.budget > flight.cost + 300) {
      decisions.push({
        type: 'travel',
        value: value * 0.7, // Travel is less urgent than deposits
        data: flight,
      });
    }
  });

  // Evaluate challenges
  currentRegion.challenges.forEach(challenge => {
    const maxWager = Math.min(Math.floor(ai.budget * 0.4), 500);
    const expectedValue = maxWager * challenge.multiplier * challenge.baseSuccessChance - maxWager;

    if (expectedValue > 100 && ai.budget > maxWager * 2) {
      const riskTolerance = 0.6;
      const value = expectedValue * (challenge.baseSuccessChance + riskTolerance * 0.2);

      decisions.push({
        type: 'challenge',
        value: value * 0.5, // Challenges are risky
        data: { challenge, wager: maxWager },
      });
    }
  });

  // Pick best decision
  if (decisions.length === 0) {
    return { type: 'wait', value: 0 };
  }

  decisions.sort((a, b) => b.value - a.value);
  return decisions[0];
}

// ============================================================================
// NOTIFICATION SYSTEM
// ============================================================================

function createNotification(message: string, type: Notification['type'] = 'info'): Notification {
  return {
    id: `notif-${Date.now()}-${Math.random()}`,
    message,
    type,
    timestamp: Date.now(),
  };
}

// ============================================================================
// MAIN GAME COMPONENT
// ============================================================================

export default function AustraliaGame() {
  const [state, dispatch] = useReducer(gameReducer, null, createInitialState);
  const [selectedRegion, setSelectedRegion] = useState<RegionCode | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showTravelModal, setShowTravelModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [wagerAmount, setWagerAmount] = useState(100);
  const [depositAmount, setDepositAmount] = useState(100);
  const [challengeInProgress, setChallengeInProgress] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const player = state.players.Player;
  const ai = state.players.AI;
  const currentRegion = state.regions[player.currentRegion];

  // Add notification
  const addNotification = useCallback((message: string, type: Notification['type'] = 'info') => {
    const notification = createNotification(message, type);
    dispatch({ type: 'ADD_NOTIFICATION', notification });

    setTimeout(() => {
      dispatch({ type: 'CLEAR_NOTIFICATION', id: notification.id });
    }, 5000);
  }, []);

  // Auto-claim welcome bonus
  useEffect(() => {
    if (currentRegion.welcomeBonusAvailable && !player.visitedRegions.has(player.currentRegion)) {
      dispatch({ type: 'CLAIM_WELCOME_BONUS', player: 'Player', region: player.currentRegion });
      addNotification(`Welcome to ${currentRegion.name}! You received $${WELCOME_BONUS}!`, 'success');
    }
  }, [player.currentRegion]);

  // AI Turn Logic
  useEffect(() => {
    if (state.gameOver || state.aiThinking) return;

    const aiTurnDelay = setTimeout(() => {
      dispatch({ type: 'SET_AI_THINKING', thinking: true });

      setTimeout(() => {
        const decision = evaluateAIActions(state);

        switch (decision.type) {
          case 'travel': {
            const { destination, cost } = decision.data;
            dispatch({ type: 'TRAVEL', player: 'AI', destination, cost });
            addNotification(`AI flew to ${state.regions[destination].name} for $${cost}`, 'info');

            // Check for welcome bonus
            if (state.regions[destination].welcomeBonusAvailable) {
              setTimeout(() => {
                dispatch({ type: 'CLAIM_WELCOME_BONUS', player: 'AI', region: destination });
                addNotification(`AI claimed $${WELCOME_BONUS} welcome bonus in ${state.regions[destination].name}!`, 'warning');
              }, 1000);
            }
            break;
          }

          case 'challenge': {
            const { challenge, wager } = decision.data;
            const success = Math.random() < challenge.baseSuccessChance;
            dispatch({ type: 'COMPLETE_CHALLENGE', player: 'AI', challenge, wager, success });

            if (success) {
              const winnings = Math.floor(wager * challenge.multiplier);
              addNotification(`AI completed '${challenge.name}' and won $${winnings}!`, 'warning');
            } else {
              addNotification(`AI failed '${challenge.name}' and lost $${wager}`, 'info');
            }
            break;
          }

          case 'deposit': {
            const { region, amount } = decision.data;
            const previousController = state.regions[region].controller;
            dispatch({ type: 'DEPOSIT', player: 'AI', region, amount });

            setTimeout(() => {
              const newController = calculateRegionController({
                ...state.regions[region],
                deposits: {
                  ...state.regions[region].deposits,
                  AI: (state.regions[region].deposits.AI || 0) + amount,
                },
              });

              if (newController === 'AI' && previousController !== 'AI') {
                addNotification(`AI deposited $${amount} and STOLE ${state.regions[region].name}!`, 'danger');
              } else {
                addNotification(`AI deposited $${amount} in ${state.regions[region].name}`, 'info');
              }
            }, 100);
            break;
          }
        }

        dispatch({ type: 'SET_AI_THINKING', thinking: false });
      }, 2000);
    }, 30000 + Math.random() * 30000); // 30-60 seconds

    return () => clearTimeout(aiTurnDelay);
  }, [state, addNotification]);

  // Handle travel
  const handleTravel = useCallback((flight: FlightOption) => {
    if (player.budget >= flight.cost) {
      dispatch({ type: 'TRAVEL', player: 'Player', destination: flight.destination, cost: flight.cost });
      addNotification(`Flew to ${state.regions[flight.destination].name} for $${flight.cost}`, 'success');
      setShowTravelModal(false);
    }
  }, [player.budget, state.regions, addNotification]);

  // Handle challenge
  const handleStartChallenge = useCallback((challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setWagerAmount(Math.min(100, player.budget));
    setShowChallengeModal(true);
  }, [player.budget]);

  const handleCompleteChallenge = useCallback(() => {
    if (!selectedChallenge || wagerAmount > player.budget) return;

    setChallengeInProgress(true);
    setShowChallengeModal(false);

    setTimeout(() => {
      const success = Math.random() < selectedChallenge.baseSuccessChance;
      dispatch({
        type: 'COMPLETE_CHALLENGE',
        player: 'Player',
        challenge: selectedChallenge,
        wager: wagerAmount,
        success,
      });

      if (success) {
        const winnings = Math.floor(wagerAmount * selectedChallenge.multiplier);
        addNotification(`Success! You won $${winnings}!`, 'success');
      } else {
        addNotification(`Failed! You lost $${wagerAmount}`, 'danger');
      }

      setChallengeInProgress(false);
      setSelectedChallenge(null);
    }, 2000);
  }, [selectedChallenge, wagerAmount, player.budget, addNotification]);

  // Handle deposit
  const handleDeposit = useCallback(() => {
    if (depositAmount > 0 && depositAmount <= player.budget) {
      const previousController = currentRegion.controller;
      dispatch({ type: 'DEPOSIT', player: 'Player', region: player.currentRegion, amount: depositAmount });

      setTimeout(() => {
        const newController = calculateRegionController({
          ...currentRegion,
          deposits: {
            ...currentRegion.deposits,
            Player: (currentRegion.deposits.Player || 0) + depositAmount,
          },
        });

        if (newController === 'Player' && previousController !== 'Player') {
          addNotification(`You now control ${currentRegion.name}!`, 'success');
        } else {
          addNotification(`Deposited $${depositAmount} in ${currentRegion.name}`, 'success');
        }
      }, 100);

      setShowDepositModal(false);
      setDepositAmount(100);
    }
  }, [depositAmount, player.budget, player.currentRegion, currentRegion, addNotification]);

  // Advance day
  const handleAdvanceDay = useCallback(() => {
    dispatch({ type: 'ADVANCE_DAY' });
    addNotification(`Day ${state.day + 1} begins!`, 'info');
  }, [state.day, addNotification]);

  // Flight options
  const flightOptions = useMemo(() => {
    return generateFlightOptions(player.currentRegion, state.day);
  }, [player.currentRegion, state.day]);

  // Difficulty colors
  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
    }
  };

  const getDifficultyBg = (difficulty: Difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100';
      case 'medium': return 'bg-yellow-100';
      case 'hard': return 'bg-red-100';
    }
  };

  if (state.gameOver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-2xl w-full">
          <div className="text-center">
            <Trophy className="w-24 h-24 mx-auto text-yellow-500 mb-4" />
            <h1 className="text-4xl font-bold mb-4">
              {state.winner === 'Player' ? 'You Win!' : 'AI Wins!'}
            </h1>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <div className="font-semibold">Player</div>
                  <div className="text-2xl">{player.regionsControlled.length} regions</div>
                  <div className="text-sm text-gray-600">${player.budget} remaining</div>
                </div>
                <div className="bg-red-50 p-4 rounded">
                  <div className="font-semibold">AI</div>
                  <div className="text-2xl">{ai.regionsControlled.length} regions</div>
                  <div className="text-sm text-gray-600">${ai.budget} remaining</div>
                </div>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Jet Lag: Australia</h1>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="md:hidden p-2"
            >
              {showMenu ? <X /> : <Menu />}
            </button>
          </div>

          <div className={`grid md:grid-cols-3 gap-4 ${showMenu ? 'block' : 'hidden md:grid'}`}>
            {/* Player Stats */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-blue-900">Player</div>
                  <div className="text-2xl font-bold text-blue-600">${player.budget}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm">
                    <Trophy className="w-4 h-4" />
                    <span>{player.regionsControlled.length}/8</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{currentRegion.name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Day Info */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Calendar className="w-5 h-5" />
                  <span className="font-semibold">Day {state.day}/{TOTAL_DAYS}</span>
                </div>
                <button
                  onClick={handleAdvanceDay}
                  className="bg-gray-600 text-white px-4 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
                >
                  End Day
                </button>
              </div>
            </div>

            {/* AI Stats */}
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-red-900">AI Opponent</div>
                  <div className="text-2xl font-bold text-red-600">${ai.budget}</div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm">
                    <Trophy className="w-4 h-4" />
                    <span>{ai.regionsControlled.length}/8</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{state.regions[ai.currentRegion].name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
        {state.notifications.map(notification => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg animate-slide-in ${
              notification.type === 'success' ? 'bg-green-100 text-green-800' :
              notification.type === 'danger' ? 'bg-red-100 text-red-800' :
              notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}
          >
            {notification.message}
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <MapIcon className="w-5 h-5" />
                Australia Map
              </h2>

              <div className="relative w-full" style={{ paddingBottom: '75%' }}>
                <svg
                  viewBox="0 0 100 100"
                  className="absolute inset-0 w-full h-full"
                >
                  {/* Regions */}
                  {Object.values(state.regions).map(region => {
                    const color =
                      region.controller === 'Player' ? '#3b82f6' :
                      region.controller === 'AI' ? '#ef4444' :
                      '#9ca3af';

                    const isPlayerHere = player.currentRegion === region.code;
                    const isAIHere = ai.currentRegion === region.code;

                    return (
                      <g key={region.code}>
                        <circle
                          cx={region.position.x}
                          cy={region.position.y}
                          r="8"
                          fill={color}
                          stroke="white"
                          strokeWidth="0.5"
                          className="cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedRegion(region.code)}
                        />
                        <text
                          x={region.position.x}
                          y={region.position.y - 10}
                          textAnchor="middle"
                          className="text-xs font-semibold fill-gray-700"
                          style={{ fontSize: '3px' }}
                        >
                          {region.code}
                        </text>

                        {/* Player marker */}
                        {isPlayerHere && (
                          <circle
                            cx={region.position.x - 3}
                            cy={region.position.y}
                            r="2"
                            fill="white"
                            stroke="#3b82f6"
                            strokeWidth="0.5"
                          />
                        )}

                        {/* AI marker */}
                        {isAIHere && (
                          <circle
                            cx={region.position.x + 3}
                            cy={region.position.y}
                            r="2"
                            fill="white"
                            stroke="#ef4444"
                            strokeWidth="0.5"
                          />
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="mt-4 flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span>Player Controlled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span>AI Controlled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-400 rounded-full"></div>
                  <span>Unclaimed</span>
                </div>
              </div>
            </div>

            {/* Region Details */}
            {selectedRegion && (
              <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
                <h3 className="text-xl font-bold mb-4">{state.regions[selectedRegion].name}</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Controller</div>
                    <div className="font-semibold">
                      {state.regions[selectedRegion].controller || 'Unclaimed'}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Your Deposit</div>
                    <div className="font-semibold">
                      ${state.regions[selectedRegion].deposits.Player || 0}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">AI Deposit</div>
                    <div className="font-semibold">
                      ${state.regions[selectedRegion].deposits.AI || 0}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-gray-600">Welcome Bonus</div>
                    <div className="font-semibold">
                      {state.regions[selectedRegion].welcomeBonusAvailable ? '✓ Available' : '✗ Claimed'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRegion(null)}
                  className="w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            )}
          </div>

          {/* Actions Panel */}
          <div className="space-y-4">
            {/* Current Location */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Current: {currentRegion.name}
              </h3>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-gray-600">Controller:</span>{' '}
                  <span className="font-semibold">{currentRegion.controller || 'None'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">Your Deposit:</span>{' '}
                  <span className="font-semibold">${currentRegion.deposits.Player || 0}</span>
                </div>
                <button
                  onClick={() => {
                    setDepositAmount(Math.min(100, player.budget));
                    setShowDepositModal(true);
                  }}
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <DollarSign className="w-4 h-4" />
                  Deposit Money
                </button>
              </div>
            </div>

            {/* Travel */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Plane className="w-4 h-4" />
                Travel
              </h3>
              <button
                onClick={() => setShowTravelModal(true)}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Book Flight
              </button>
            </div>

            {/* Challenges */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Challenges in {currentRegion.name}
              </h3>
              <div className="space-y-2">
                {currentRegion.challenges.map(challenge => (
                  <button
                    key={challenge.id}
                    onClick={() => handleStartChallenge(challenge)}
                    disabled={challengeInProgress}
                    className={`w-full p-3 rounded text-left hover:shadow-md transition-shadow ${getDifficultyBg(challenge.difficulty)}`}
                  >
                    <div className="font-semibold text-sm">{challenge.name}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-xs ${getDifficultyColor(challenge.difficulty)}`}>
                        {challenge.difficulty.toUpperCase()}
                      </span>
                      <span className="text-xs font-bold">{challenge.multiplier}x</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}

      {/* Travel Modal */}
      {showTravelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Book Flight from {currentRegion.name}</h2>
              <div className="space-y-3">
                {flightOptions.map((flight, idx) => {
                  const region = state.regions[flight.destination];
                  const canAfford = player.budget >= flight.cost;

                  return (
                    <div
                      key={idx}
                      className={`p-4 border rounded-lg ${canAfford ? 'hover:border-blue-500 cursor-pointer' : 'opacity-50'}`}
                      onClick={() => canAfford && handleTravel(flight)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold">{region.name}</div>
                          <div className="text-sm text-gray-600">Departs: {flight.departureTime}</div>
                          {region.welcomeBonusAvailable && (
                            <div className="text-xs text-green-600 font-semibold mt-1">
                              ⭐ Welcome Bonus Available!
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">${flight.cost}</div>
                          {!canAfford && (
                            <div className="text-xs text-red-600">Can't afford</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => setShowTravelModal(false)}
                className="mt-4 w-full bg-gray-200 text-gray-800 py-2 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Challenge Modal */}
      {showChallengeModal && selectedChallenge && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-2">{selectedChallenge.name}</h2>
              <p className="text-gray-600 mb-4">{selectedChallenge.description}</p>

              <div className="bg-gray-50 p-4 rounded mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Difficulty</div>
                    <div className={`font-semibold ${getDifficultyColor(selectedChallenge.difficulty)}`}>
                      {selectedChallenge.difficulty.toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Multiplier</div>
                    <div className="font-semibold">{selectedChallenge.multiplier}x</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Success Chance</div>
                    <div className="font-semibold">{Math.round(selectedChallenge.baseSuccessChance * 100)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Potential Win</div>
                    <div className="font-semibold text-green-600">
                      ${Math.floor(wagerAmount * selectedChallenge.multiplier)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">
                  Wager Amount: ${wagerAmount}
                </label>
                <input
                  type="range"
                  min="50"
                  max={Math.min(player.budget, 500)}
                  step="50"
                  value={wagerAmount}
                  onChange={(e) => setWagerAmount(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>$50</span>
                  <span>${Math.min(player.budget, 500)}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCompleteChallenge}
                  className="flex-1 bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 transition-colors"
                >
                  Attempt Challenge
                </button>
                <button
                  onClick={() => {
                    setShowChallengeModal(false);
                    setSelectedChallenge(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">Deposit in {currentRegion.name}</h2>

              <div className="bg-gray-50 p-4 rounded mb-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Controller:</span>
                  <span className="font-semibold">{currentRegion.controller || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Your Current Deposit:</span>
                  <span className="font-semibold">${currentRegion.deposits.Player || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">AI Deposit:</span>
                  <span className="font-semibold">${currentRegion.deposits.AI || 0}</span>
                </div>
                {currentRegion.controller !== 'Player' && currentRegion.deposits.AI > 0 && (
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="text-gray-600">To Take Control:</span>
                    <span className="font-semibold text-green-600">
                      ${currentRegion.deposits.AI - currentRegion.deposits.Player + 1}
                    </span>
                  </div>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">
                  Deposit Amount: ${depositAmount}
                </label>
                <input
                  type="range"
                  min="50"
                  max={Math.min(player.budget, 1000)}
                  step="50"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>$50</span>
                  <span>${Math.min(player.budget, 1000)}</span>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 p-3 rounded mb-4">
                <p className="text-xs text-yellow-800">
                  Deposits are permanent and cannot be withdrawn!
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDeposit}
                  disabled={depositAmount > player.budget}
                  className="flex-1 bg-green-600 text-white py-3 rounded font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Deposit
                </button>
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Challenge In Progress */}
      {challengeInProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-8 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <div className="text-xl font-semibold">Attempting Challenge...</div>
          </div>
        </div>
      )}

      {/* AI Thinking Indicator */}
      {state.aiThinking && (
        <div className="fixed bottom-4 right-4 bg-red-100 text-red-800 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <div className="animate-pulse w-2 h-2 bg-red-600 rounded-full"></div>
          <span className="font-semibold">AI is thinking...</span>
        </div>
      )}
    </div>
  );
}
