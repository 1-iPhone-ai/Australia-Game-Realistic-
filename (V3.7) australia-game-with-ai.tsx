import { useState, useEffect, useCallback, useMemo, useReducer, useRef, ChangeEvent } from 'react';

// =========================================
// GAME DATA AND CONSTANTS
// =========================================

// Game regions with enhanced data
const REGIONS = {
  QLD: { 
    name: "Queensland", 
    color: "#f4a261", 
    challenges: [
      {name: "Surf at Gold Coast", difficulty: 1, reward: 1.8, type: "physical"}, 
      {name: "Feed kangaroos", difficulty: 1, reward: 1.5, type: "wildlife"}, 
      {name: "Tour Great Barrier Reef", difficulty: 2, reward: 2.5, type: "educational"},
      {name: "Explore Daintree Rainforest", difficulty: 3, reward: 3.0, type: "physical"}
    ], 
    position: {x: 80, y: 35},
    description: "Known for its beautiful beaches and the Great Barrier Reef.",
    funFact: "Queensland is home to the world's largest sand island, Fraser Island."
  },
  NSW: { 
    name: "New South Wales", 
    color: "#e76f51", 
    challenges: [
      {name: "Visit Sydney Opera House", difficulty: 1, reward: 1.5, type: "educational"}, 
      {name: "Make a rock carving", difficulty: 2, reward: 2.0, type: "social"}, 
      {name: "Tour the Blue Mountains", difficulty: 2, reward: 2.2, type: "physical"},
      {name: "Surf at Bondi Beach", difficulty: 1, reward: 1.6, type: "physical"}
    ], 
    position: {x: 80, y: 65},
    description: "Home to Sydney, Australia's most populous city.",
    funFact: "The Sydney Harbour Bridge is nicknamed 'The Coathanger' due to its arch-based design."
  },
  VIC: { 
    name: "Victoria", 
    color: "#264653", 
    challenges: [
      {name: "Tour Great Ocean Road", difficulty: 2, reward: 2.0, type: "educational"}, 
      {name: "Visit Melbourne Museum", difficulty: 1, reward: 1.5, type: "educational"}, 
      {name: "Wine tasting tour", difficulty: 1, reward: 1.7, type: "social"},
      {name: "Explore Grampians National Park", difficulty: 3, reward: 2.8, type: "physical"}
    ], 
    position: {x: 65, y: 85},
    description: "Known for Melbourne, coffee culture and the Great Ocean Road.",
    funFact: "Melbourne has the largest tram system outside of Europe."
  },
  TAS: { 
    name: "Tasmania", 
    color: "#2a9d8f", 
    challenges: [
      {name: "Hike Cradle Mountain", difficulty: 3, reward: 2.7, type: "physical"}, 
      {name: "Visit Port Arthur", difficulty: 1, reward: 1.5, type: "educational"}, 
      {name: "Spot Tasmanian Devils", difficulty: 2, reward: 2.2, type: "wildlife"},
      {name: "Tour MONA Art Museum", difficulty: 1, reward: 1.6, type: "educational"}
    ], 
    position: {x: 75, y: 100},
    description: "An island state with pristine wilderness and unique wildlife.",
    funFact: "Tasmania has the cleanest air in the world, as measured at Cape Grim."
  },
  SA: { 
    name: "South Australia", 
    color: "#e9c46a", 
    challenges: [
      {name: "Wine tour in Barossa Valley", difficulty: 1, reward: 1.7, type: "social"}, 
      {name: "Explore Adelaide Central Market", difficulty: 1, reward: 1.4, type: "social"}, 
      {name: "Visit Kangaroo Island", difficulty: 2, reward: 2.1, type: "wildlife"},
      {name: "Dive with Great White Sharks", difficulty: 3, reward: 3.2, type: "wildlife"}
    ], 
    position: {x: 45, y: 75},
    description: "Famous for its wine regions and festivals.",
    funFact: "South Australia is home to the world's largest collection of opals."
  },
  WA: { 
    name: "Western Australia", 
    color: "#f4a261", 
    challenges: [
      {name: "Explore Pinnacles Desert", difficulty: 2, reward: 2.0, type: "physical"}, 
      {name: "Swim with whale sharks", difficulty: 3, reward: 3.0, type: "wildlife"}, 
      {name: "Tour Margaret River", difficulty: 1, reward: 1.6, type: "educational"},
      {name: "Visit the pink Lake Hillier", difficulty: 2, reward: 2.3, type: "educational"}
    ], 
    position: {x: 15, y: 55},
    description: "The largest state, known for vast deserts and beautiful coastline.",
    funFact: "Western Australia is so large that if it were a country, it would be the 10th largest in the world."
  },
  NT: { 
    name: "Northern Territory", 
    color: "#e76f51", 
    challenges: [
      {name: "Visit Uluru", difficulty: 2, reward: 2.2, type: "educational"}, 
      {name: "Crocodile spotting", difficulty: 2, reward: 2.0, type: "wildlife"}, 
      {name: "Explore Kakadu National Park", difficulty: 2, reward: 2.1, type: "physical"},
      {name: "Swim at Florence Falls", difficulty: 1, reward: 1.7, type: "physical"}
    ], 
    position: {x: 45, y: 35},
    description: "Home to iconic landmarks like Uluru and tropical national parks.",
    funFact: "Uluru is estimated to be around 600 million years old."
  },
  ACT: { 
    name: "Australian Capital Territory", 
    color: "#264653", 
    challenges: [
      {name: "Tour Parliament House", difficulty: 1, reward: 1.4, type: "educational"}, 
      {name: "Visit Australian War Memorial", difficulty: 1, reward: 1.5, type: "educational"}, 
      {name: "Explore Tidbinbilla Nature Reserve", difficulty: 2, reward: 1.9, type: "wildlife"},
      {name: "Hot air ballooning over Canberra", difficulty: 2, reward: 2.1, type: "social"}
    ], 
    position: {x: 75, y: 70},
    description: "Australia's capital territory, home to Canberra.",
    funFact: "Canberra was created as a compromise when Sydney and Melbourne both wanted to be the capital city."
  },
};

// Adjacent regions for travel logic
const ADJACENT_REGIONS = {
  QLD: ["NSW", "NT"],
  NSW: ["QLD", "VIC", "SA", "ACT"],
  VIC: ["NSW", "SA"],
  TAS: [], // Island
  SA: ["NSW", "VIC", "NT", "WA"],
  WA: ["NT", "SA"],
  NT: ["QLD", "SA", "WA"],
  ACT: ["NSW"],
};

// Regional resources with their types for AI decision making
const REGIONAL_RESOURCES = {
  QLD: ["Coral", "Tropical Fruit", "Sugar Cane"],
  NSW: ["Opals", "Wine", "Coal"],
  VIC: ["Dairy", "Wool", "Wheat"],
  TAS: ["Timber", "Seafood", "Hydropower"],
  SA: ["Uranium", "Opals", "Wine"],
  WA: ["Iron Ore", "Gold", "Natural Gas"],
  NT: ["Crocodile Leather", "Aboriginal Art", "Uranium"],
  ACT: ["Government Grants", "Research Funds", "Education"]
};

// Resource categories for AI strategy
const RESOURCE_CATEGORIES = {
  "Coral": "luxury",
  "Tropical Fruit": "food",
  "Sugar Cane": "agricultural",
  "Opals": "luxury", 
  "Wine": "luxury",
  "Coal": "industrial",
  "Dairy": "food",
  "Wool": "agricultural",
  "Wheat": "agricultural",
  "Timber": "industrial",
  "Seafood": "food",
  "Hydropower": "energy",
  "Uranium": "energy",
  "Iron Ore": "industrial",
  "Gold": "luxury",
  "Natural Gas": "energy",
  "Crocodile Leather": "luxury",
  "Aboriginal Art": "luxury",
  "Government Grants": "financial",
  "Research Funds": "financial",
  "Education": "service"
};

// Enhanced Characters with mastery progression
const CHARACTERS = [
  {
    name: "Tourist",
    ability: "Challenge Bonus",
    description: "Gets a 20% bonus on challenge winnings",
    startingMoney: 1000,
    avatar: "🧳",
    perk: "Has a 10% higher chance of succeeding at challenges",
    startingStats: { strength: 3, charisma: 5, luck: 4, intelligence: 3 },
    specialAbility: {
      name: "Tourist Luck",
      description: "Once per day, can retry a failed challenge with a 20% higher success chance",
      usesLeft: 1
    },
    aiStrategy: "challenge-focused",
    masteryTree: {
      "Lucky Streak": { unlockLevel: 3, effect: "Consecutive challenge wins grant +10% bonus each" },
      "Globe Trotter": { unlockLevel: 5, effect: "Travel costs reduced by additional 15%" },
      "Challenge Master": { unlockLevel: 7, effect: "Can attempt any challenge twice per turn" }
    }
  },
  {
    name: "Businessman",
    ability: "Money Bonus",
    description: "Starts with extra money",
    startingMoney: 1500,
    avatar: "💼",
    perk: "Earns 10% more from all money sources",
    startingStats: { strength: 2, charisma: 4, luck: 3, intelligence: 6 },
    specialAbility: {
      name: "Market Insight",
      description: "Can see resource price trends once per day",
      usesLeft: 1
    },
    aiStrategy: "money-focused",
    masteryTree: {
      "Investment Genius": { unlockLevel: 3, effect: "Resources sold for 15% more" },
      "Negotiator": { unlockLevel: 5, effect: "All costs reduced by 20%" },
      "Mogul": { unlockLevel: 7, effect: "Gain passive income of $100 per turn" }
    }
  },
  {
    name: "Explorer",
    ability: "Travel Discount",
    description: "Pays 25% less for travel",
    startingMoney: 1200,
    avatar: "🗺️",
    perk: "Discovers bonus resources more often",
    startingStats: { strength: 5, charisma: 3, luck: 5, intelligence: 2 },
    specialAbility: {
      name: "Scout Ahead",
      description: "Reveals adjacent regions' resources before traveling",
      usesLeft: 2
    },
    aiStrategy: "exploration-focused",
    masteryTree: {
      "Treasure Hunter": { unlockLevel: 3, effect: "Find rare resources 25% more often" },
      "Fast Travel": { unlockLevel: 5, effect: "Can travel to any region for flat $300" },
      "Pathfinder": { unlockLevel: 7, effect: "Travel costs nothing to adjacent regions" }
    }
  },
  {
    name: "Scientist",
    ability: "Learning Bonus",
    description: "Gains experience faster",
    startingMoney: 1100,
    avatar: "🔬",
    perk: "Gets detailed information about challenge success rates",
    startingStats: { strength: 2, charisma: 2, luck: 2, intelligence: 9 },
    specialAbility: {
      name: "Calculate Odds",
      description: "Guarantee success on next challenge under difficulty 2",
      usesLeft: 1
    },
    aiStrategy: "balanced",
    masteryTree: {
      "Quick Study": { unlockLevel: 3, effect: "Gain 50% more XP from all sources" },
      "Efficiency Expert": { unlockLevel: 5, effect: "Actions have a 30% chance to not consume time" },
      "Mastermind": { unlockLevel: 7, effect: "All stats increased by 2 permanently" }
    }
  },
];

// AI Difficulty Profiles
const AI_DIFFICULTY_PROFILES = {
  easy: {
    name: "Easy",
    description: "Makes random decisions, often inefficient",
    decisionQuality: 0.4,
    riskTolerance: 0.3,
    planningDepth: 1,
    mistakeChance: 0.3,
    thinkingTimeMin: 500,
    thinkingTimeMax: 1000
  },
  medium: {
    name: "Medium",
    description: "Makes decent strategic decisions",
    decisionQuality: 0.7,
    riskTolerance: 0.5,
    planningDepth: 2,
    mistakeChance: 0.15,
    thinkingTimeMin: 800,
    thinkingTimeMax: 1500
  },
  hard: {
    name: "Hard",
    description: "Highly strategic and optimized gameplay",
    decisionQuality: 0.9,
    riskTolerance: 0.6,
    planningDepth: 3,
    mistakeChance: 0.05,
    thinkingTimeMin: 1000,
    thinkingTimeMax: 2000
  },
  expert: {
    name: "Expert",
    description: "Nearly perfect decision-making",
    decisionQuality: 0.95,
    riskTolerance: 0.7,
    planningDepth: 4,
    mistakeChance: 0.02,
    thinkingTimeMin: 1200,
    thinkingTimeMax: 2500
  }
};

// Notification types and their styling
const NOTIFICATION_TYPES = {
  money: { icon: '💰', color: '#10b981', label: 'Money' },
  challenge: { icon: '🎯', color: '#f59e0b', label: 'Challenge' },
  travel: { icon: '✈️', color: '#3b82f6', label: 'Travel' },
  resource: { icon: '📦', color: '#8b5cf6', label: 'Resource' },
  event: { icon: '⚡', color: '#ef4444', label: 'Event' },
  success: { icon: '✅', color: '#10b981', label: 'Success' },
  warning: { icon: '⚠️', color: '#f59e0b', label: 'Warning' },
  error: { icon: '❌', color: '#ef4444', label: 'Error' },
  info: { icon: 'ℹ️', color: '#3b82f6', label: 'Info' },
  levelup: { icon: '⭐', color: '#fbbf24', label: 'Level Up' },
  market: { icon: '📈', color: '#06b6d4', label: 'Market' },
  ai: { icon: '🤖', color: '#ec4899', label: 'AI Action' },
};

// Keyboard shortcuts configuration
const KEYBOARD_SHORTCUTS = {
  ' ': { action: 'endTurn', label: 'End Turn', description: 'End your turn' },
  'c': { action: 'openChallenges', label: 'Challenges', description: 'Open challenges modal' },
  'r': { action: 'openResources', label: 'Resources', description: 'Open resource market' },
  'm': { action: 'openMap', label: 'Map', description: 'Toggle map view' },
  't': { action: 'openTravel', label: 'Travel', description: 'Open travel modal' },
  'n': { action: 'openNotifications', label: 'Notifications', description: 'Open notification history' },
  'p': { action: 'openProgress', label: 'Progress', description: 'Open progress dashboard' },
  '?': { action: 'toggleHelp', label: 'Help', description: 'Toggle keyboard shortcuts help' },
  'Escape': { action: 'closeModal', label: 'Close', description: 'Close any open modal' },
};

const GAME_VERSION = "4.0.0";
const MINIMUM_WAGER = 50; // Minimum wager required for challenges
const MAX_INVENTORY = 50; // Maximum inventory capacity for players and AI

type GameSettingsState = {
  actionLimitsEnabled: boolean;
  maxActionsPerTurn: number;
  aiMaxActionsPerTurn: number;
  allowActionOverride: boolean;
  overrideCost: number;
  totalDays: number;
  playerActionsPerDay: number;
  aiActionsPerDay: number;
  showDayTransition: boolean;
};

type DontAskAgainPrefs = {
  travel: boolean;
  sell: boolean;
  challenge: boolean;
  endDay: boolean;
};

// =========================================
// TYPE DEFINITIONS AND INTERFACES
// =========================================

interface Notification {
  id: string;
  type: keyof typeof NOTIFICATION_TYPES;
  message: string;
  timestamp: number;
  day: number;
  read: boolean;
  persistent?: boolean;
}

interface PersonalRecord {
  highestChallenge: number;
  mostExpensiveResourceSold: { resource: string; price: number };
  consecutiveWins: number;
  maxMoney: number;
  fastestChallengeWin: number;
  totalEarned: number;
}

interface ConfirmationDialog {
  isOpen: boolean;
  type: 'travel' | 'sell' | 'challenge' | 'endDay' | null;
  title: string;
  message: string;
  confirmText: string;
  onConfirm: () => void;
  data?: any;
}

interface AIAction {
  type: 'challenge' | 'travel' | 'sell' | 'collect' | 'think' | 'end_turn' | 'special_ability';
  description: string;
  data?: any;
}

const DEFAULT_GAME_SETTINGS: GameSettingsState = {
  actionLimitsEnabled: true,
  maxActionsPerTurn: 3,
  aiMaxActionsPerTurn: 3,
  allowActionOverride: true,
  overrideCost: 1000,
  totalDays: 30,
  playerActionsPerDay: 3,
  aiActionsPerDay: 3,
  showDayTransition: false
};

const DEFAULT_DONT_ASK: DontAskAgainPrefs = {
  travel: false,
  sell: false,
  challenge: false,
  endDay: false
};

const DEFAULT_PERSONAL_RECORDS: PersonalRecord = {
  highestChallenge: 0,
  mostExpensiveResourceSold: { resource: '', price: 0 },
  consecutiveWins: 0,
  maxMoney: 1000,
  fastestChallengeWin: Infinity,
  totalEarned: 0
};

// =========================================
// REDUCERS
// =========================================

const initialPlayerState = {
  money: 1000,
  currentRegion: "QLD",
  inventory: [],
  visitedRegions: ["QLD"],
  challengesCompleted: [],
  character: CHARACTERS[0],
  level: 1,
  xp: 0,
  stats: { strength: 3, charisma: 5, luck: 4, intelligence: 3 },
  consecutiveWins: 0,
  specialAbilityUses: 1,
  masteryUnlocks: [],
  name: "Player",
  actionsUsedThisTurn: 0
};

type PlayerStateSnapshot = typeof initialPlayerState;

function playerReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_MONEY':
      return { ...state, money: Math.max(0, state.money + action.payload) };
    case 'SET_REGION':
      const newVisited = state.visitedRegions.includes(action.payload)
        ? state.visitedRegions
        : [...state.visitedRegions, action.payload];
      return { ...state, currentRegion: action.payload, visitedRegions: newVisited };
    case 'COMPLETE_CHALLENGE':
      return {
        ...state,
        challengesCompleted: [...state.challengesCompleted, action.payload],
        consecutiveWins: state.consecutiveWins + 1,
        actionsUsedThisTurn: state.actionsUsedThisTurn + 1
      };
    case 'RESET_STREAK':
      return { ...state, consecutiveWins: 0 };
    case 'COLLECT_RESOURCES':
      // Enforce inventory capacity limit
      const newResources = action.payload.resources;
      const availableSpace = MAX_INVENTORY - state.inventory.length;
      const resourcesToAdd = availableSpace > 0 ? newResources.slice(0, availableSpace) : [];
      return { ...state, inventory: [...state.inventory, ...resourcesToAdd] };
    case 'SELL_RESOURCE':
      const updatedInventory = [...state.inventory];
      const index = updatedInventory.indexOf(action.payload.resource);
      if (index > -1) updatedInventory.splice(index, 1);
      return {
        ...state,
        inventory: updatedInventory,
        money: state.money + action.payload.price,
        actionsUsedThisTurn: state.actionsUsedThisTurn + 1
      };
    case 'INCREMENT_ACTIONS':
      return { ...state, actionsUsedThisTurn: state.actionsUsedThisTurn + 1 };
    case 'RESET_ACTIONS':
      return { ...state, actionsUsedThisTurn: 0 };
    case 'USE_ACTION_OVERRIDE':
      return { 
        ...state, 
        money: state.money - action.payload,
        actionsUsedThisTurn: 0
      };
    case 'GAIN_XP':
      const newXp = state.xp + action.payload;
      const xpForNextLevel = state.level * 100;
      if (newXp >= xpForNextLevel) {
        return {
          ...state,
          xp: newXp - xpForNextLevel,
          level: state.level + 1,
          stats: {
            strength: state.stats.strength + 1,
            charisma: state.stats.charisma + 1,
            luck: state.stats.luck + 1,
            intelligence: state.stats.intelligence + 1
          }
        };
      }
      return { ...state, xp: newXp };
    case 'USE_SPECIAL_ABILITY':
      return { ...state, specialAbilityUses: state.specialAbilityUses - 1 };
    case 'RESET_SPECIAL_ABILITY':
      return { ...state, specialAbilityUses: state.character.specialAbility.usesLeft };
    case 'UNLOCK_MASTERY':
      return { ...state, masteryUnlocks: [...state.masteryUnlocks, action.payload] };
    case 'RESET_PLAYER':
      const char = CHARACTERS[action.payload.characterIndex || 0];
      return {
        ...initialPlayerState,
        money: char.startingMoney,
        character: char,
        stats: { ...char.startingStats },
        specialAbilityUses: char.specialAbility.usesLeft,
        name: action.payload.name || "Player"
      };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

const initialGameState = {
  day: 1,
  season: "Summer",
  weather: "Sunny",
  resourcePrices: {},
  activeEvents: [],
  marketTrend: "stable",
  gameMode: "menu",
  selectedMode: null,
  currentTurn: "player", // "player" or "ai"
  isAiThinking: false,
  aiDifficulty: "medium",
  actionsThisTurn: 0,
  maxActionsPerTurn: 3,
  actionLimitsEnabled: true,
  playerActionsThisTurn: 0,
  allChallengesCompleted: false
};

type GameStateSnapshot = typeof initialGameState;

function gameStateReducer(state, action) {
  switch (action.type) {
    case 'NEXT_DAY':
      const newDay = state.day + 1;
      const seasons = ["Summer", "Autumn", "Winter", "Spring"];
      const newSeason = seasons[Math.floor((newDay - 1) / 7) % 4];
      return { ...state, day: newDay, season: newSeason, actionsThisTurn: 0 };
    case 'UPDATE_WEATHER':
      return { ...state, weather: action.payload };
    case 'UPDATE_RESOURCE_PRICES':
      return { ...state, resourcePrices: action.payload };
    case 'ADD_EVENT':
      return { ...state, activeEvents: [...state.activeEvents, action.payload] };
    case 'REMOVE_EVENT':
      return {
        ...state,
        activeEvents: state.activeEvents.filter((e, i) => i !== action.payload)
      };
    case 'UPDATE_MARKET_TREND':
      return { ...state, marketTrend: action.payload };
    case 'SET_GAME_MODE':
      return { ...state, gameMode: action.payload };
    case 'SET_SELECTED_MODE':
      return { ...state, selectedMode: action.payload };
    case 'SET_TURN':
      return { ...state, currentTurn: action.payload, actionsThisTurn: 0 };
    case 'SET_AI_THINKING':
      return { ...state, isAiThinking: action.payload };
    case 'SET_AI_DIFFICULTY':
      return { ...state, aiDifficulty: action.payload };
    case 'INCREMENT_ACTIONS':
      return { ...state, actionsThisTurn: state.actionsThisTurn + 1 };
    case 'RESET_ACTIONS':
      return { ...state, actionsThisTurn: 0 };
    case 'SET_PLAYER_ACTIONS':
      return { ...state, playerActionsThisTurn: action.payload };
    case 'INCREMENT_PLAYER_ACTIONS':
      return { ...state, playerActionsThisTurn: state.playerActionsThisTurn + 1 };
    case 'SET_ACTION_LIMITS_ENABLED':
      return { ...state, actionLimitsEnabled: action.payload };
    case 'SET_MAX_ACTIONS':
      return { ...state, maxActionsPerTurn: action.payload };
    case 'SET_ALL_CHALLENGES_COMPLETED':
      return { ...state, allChallengesCompleted: action.payload };
    case 'RESET_GAME':
      return { 
        ...initialGameState, 
        gameMode: state.gameMode,
        selectedMode: state.selectedMode,
        aiDifficulty: state.aiDifficulty
      };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

interface SaveMetadata {
  timestamp: number;
  gameVersion: string;
  saveDescription: string;
}

interface SaveGameData {
  metadata: SaveMetadata;
  player: PlayerStateSnapshot;
  aiPlayer: PlayerStateSnapshot;
  gameState: GameStateSnapshot;
  gameSettings: GameSettingsState;
  notifications: Notification[];
  personalRecords: PersonalRecord;
  dontAskAgain: DontAskAgainPrefs;
  uiPreferences: {
    theme: string;
  };
  aiRuntime: {
    queue: AIAction[];
    currentAction: AIAction | null;
  };
}

interface LoadPreviewState {
  isOpen: boolean;
  data: SaveGameData | null;
  filename?: string;
  error?: string;
}

// =========================================
// MAIN COMPONENT
// =========================================

function AustraliaGame() {
  // Core game state
  const [player, dispatchPlayer] = useReducer(playerReducer, initialPlayerState);
  const [gameState, dispatchGameState] = useReducer(gameStateReducer, initialGameState);

  // AI opponent state
  const [aiPlayer, setAiPlayer] = useState<PlayerStateSnapshot>({
    money: 1000,
    currentRegion: "QLD",
    inventory: [],
    visitedRegions: ["QLD"],
    challengesCompleted: [],
    character: CHARACTERS[1],
    level: 1,
    xp: 0,
    stats: { strength: 2, charisma: 4, luck: 3, intelligence: 6 },
    consecutiveWins: 0,
    specialAbilityUses: 1,
    masteryUnlocks: [],
    name: "AI Opponent",
    actionsUsedThisTurn: 0
  });

  // AI action queue for visual feedback
  const [aiActionQueue, setAiActionQueue] = useState<AIAction[]>([]);
  const [currentAiAction, setCurrentAiAction] = useState<AIAction | null>(null);

  // Game Settings State
  const [gameSettings, setGameSettings] = useState<GameSettingsState>({ ...DEFAULT_GAME_SETTINGS });

  // UI state
  const [uiState, setUiState] = useState({
    showTravelModal: false,
    showChallenges: false,
    showMarket: false,
    showStats: false,
    showMap: true,
    selectedCharacter: 0,
    playerName: "",
    wagerAmount: 100,
    showCampaignSelect: false,
    theme: "dark",
    showNotifications: false,
    showProgress: false,
    showHelp: false,
    showSettings: false,
    showEndGameModes: false,
    notificationFilter: 'all',
    quickActionsOpen: true,
    showAiStats: false,
    showDayTransition: false,
    showSaveLoadModal: false
  });

  // Day transition state
  const [dayTransitionData, setDayTransitionData] = useState({
    prevDay: 1,
    newDay: 2,
    playerEarned: 0,
    aiEarned: 0
  });

  // Enhanced notification system
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord>({ ...DEFAULT_PERSONAL_RECORDS });

  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = useState<ConfirmationDialog>({
    isOpen: false,
    type: null,
    title: '',
    message: '',
    confirmText: '',
    onConfirm: () => {},
    data: null
  });

  // Don't ask again preferences
  const [dontAskAgain, setDontAskAgain] = useState<DontAskAgainPrefs>({ ...DEFAULT_DONT_ASK });

  const [saveDescription, setSaveDescription] = useState("");
  const [loadPreview, setLoadPreview] = useState<LoadPreviewState>({
    isOpen: false,
    data: null
  });

  // Refs
  const notificationEndRef = useRef<HTMLDivElement>(null);
  const aiTurnTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // =========================================
  // NOTIFICATION SYSTEM
  // =========================================

  const addNotification = useCallback((message: string, type: keyof typeof NOTIFICATION_TYPES = 'info', persistent: boolean = false) => {
    const notification: Notification = {
      id: Date.now().toString() + Math.random(),
      type,
      message,
      timestamp: Date.now(),
      day: gameState.day,
      read: false,
      persistent
    };
    
    setNotifications(prev => [...prev, notification]);
    
    // Auto-remove non-persistent notifications after 5 seconds
    if (!persistent) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
    }
  }, [gameState.day]);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // =========================================
  // SAVE / LOAD SYSTEM
  // =========================================

  const resolveCharacter = useCallback((name?: string) => {
    if (!name) return CHARACTERS[0];
    return CHARACTERS.find(character => character.name === name) || CHARACTERS[0];
  }, []);

  const generateSaveFileName = useCallback((data: SaveGameData) => {
    const safeName = (data.player.name || "Adventurer").replace(/[^a-z0-9]/gi, '') || "Traveler";
    const timestamp = new Date(data.metadata.timestamp);
    const stamp = `${timestamp.getFullYear()}${String(timestamp.getMonth() + 1).padStart(2, '0')}${String(timestamp.getDate()).padStart(2, '0')}_${String(timestamp.getHours()).padStart(2, '0')}${String(timestamp.getMinutes()).padStart(2, '0')}`;
    const money = Math.max(0, Math.floor(data.player.money));
    return `AussieAdventure_Day${data.gameState.day}_${safeName}_Lv${data.player.level}_$${money}_${stamp}.json`;
  }, []);

  const buildSaveData = useCallback((descriptionOverride?: string): SaveGameData => {
    const description = (descriptionOverride ?? saveDescription).trim() || `Manual Save Day ${gameState.day}`;
    return {
      metadata: {
        timestamp: Date.now(),
        gameVersion: GAME_VERSION,
        saveDescription: description
      },
      player,
      aiPlayer,
      gameState,
      gameSettings,
      notifications,
      personalRecords,
      dontAskAgain,
      uiPreferences: {
        theme: uiState.theme
      },
      aiRuntime: {
        queue: aiActionQueue,
        currentAction: currentAiAction
      }
    };
  }, [aiActionQueue, aiPlayer, currentAiAction, dontAskAgain, gameSettings, gameState, notifications, personalRecords, player, saveDescription, uiState.theme]);

  const downloadSaveFile = useCallback((data: SaveGameData) => {
    const filename = generateSaveFileName(data);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }, [generateSaveFileName]);

  const handleSaveGame = useCallback((descriptionOverride?: string) => {
    if (gameState.gameMode === 'menu') {
      addNotification('Start or load a game before saving.', 'warning');
      return;
    }
    try {
      const data = buildSaveData(descriptionOverride);
      downloadSaveFile(data);
      addNotification(`Game saved! Day ${data.gameState.day}, ${data.player.name}`, 'success');
    } catch (error) {
      console.error('Save failed', error);
      addNotification('Failed to save game. Please try again.', 'error');
    }
  }, [addNotification, buildSaveData, downloadSaveFile, gameState.gameMode]);

  const validateSaveData = useCallback((raw: any): SaveGameData => {
    if (!raw || typeof raw !== 'object') {
      throw new Error('Save file is empty or corrupted.');
    }

    const metadata = raw.metadata || {};
    if (typeof metadata.timestamp !== 'number') {
      throw new Error('Save file missing timestamp.');
    }
    if (typeof metadata.gameVersion !== 'string') {
      throw new Error('Save file missing version information.');
    }

    const playerData = raw.player;
    const aiData = raw.aiPlayer;
    const stateData = raw.gameState;
    const settingsData = raw.gameSettings;
    if (!playerData || !aiData || !stateData || !settingsData) {
      throw new Error('Save file missing core state sections.');
    }

    const requiredPlayerFields = [
      'money', 'currentRegion', 'inventory', 'visitedRegions', 'challengesCompleted',
      'character', 'level', 'xp', 'stats', 'consecutiveWins', 'specialAbilityUses',
      'masteryUnlocks', 'name', 'actionsUsedThisTurn'
    ];
    requiredPlayerFields.forEach(field => {
      if (typeof playerData[field] === 'undefined') {
        throw new Error(`Save file missing player field: ${field}`);
      }
      if (typeof aiData[field] === 'undefined') {
        throw new Error(`Save file missing AI field: ${field}`);
      }
    });

    const requiredGameFields = [
      'day', 'season', 'weather', 'resourcePrices', 'activeEvents', 'marketTrend',
      'gameMode', 'selectedMode', 'currentTurn', 'isAiThinking', 'aiDifficulty',
      'actionsThisTurn', 'maxActionsPerTurn', 'actionLimitsEnabled',
      'playerActionsThisTurn', 'allChallengesCompleted'
    ];
    requiredGameFields.forEach(field => {
      if (typeof stateData[field] === 'undefined') {
        throw new Error(`Save file missing game state field: ${field}`);
      }
    });

    const sanitizeStats = (stats: any) => ({
      strength: typeof stats?.strength === 'number' ? stats.strength : initialPlayerState.stats.strength,
      charisma: typeof stats?.charisma === 'number' ? stats.charisma : initialPlayerState.stats.charisma,
      luck: typeof stats?.luck === 'number' ? stats.luck : initialPlayerState.stats.luck,
      intelligence: typeof stats?.intelligence === 'number' ? stats.intelligence : initialPlayerState.stats.intelligence
    });

    const sanitizePlayerState = (data: any, fallbackName: string): PlayerStateSnapshot => {
      const character = resolveCharacter(data?.character?.name);
      const region = REGIONS[data?.currentRegion] ? data.currentRegion : initialPlayerState.currentRegion;
      const visited = Array.isArray(data?.visitedRegions)
        ? data.visitedRegions.filter(regionCode => REGIONS[regionCode]).map(String)
        : [];
      if (!visited.includes(region)) {
        visited.push(region);
      }

      const inventory = Array.isArray(data?.inventory) ? data.inventory.map(String) : [];
      const challenges = Array.isArray(data?.challengesCompleted) ? data.challengesCompleted.map(String) : [];
      const mastery = Array.isArray(data?.masteryUnlocks) ? data.masteryUnlocks.map(String) : [];

      return {
        ...initialPlayerState,
        ...data,
        character,
        currentRegion: region,
        money: typeof data?.money === 'number' ? data.money : initialPlayerState.money,
        visitedRegions: visited,
        inventory,
        challengesCompleted: challenges,
        masteryUnlocks: mastery,
        stats: sanitizeStats(data?.stats),
        level: typeof data?.level === 'number' ? data.level : initialPlayerState.level,
        xp: typeof data?.xp === 'number' ? data.xp : initialPlayerState.xp,
        consecutiveWins: typeof data?.consecutiveWins === 'number' ? data.consecutiveWins : 0,
        specialAbilityUses: typeof data?.specialAbilityUses === 'number' ? data.specialAbilityUses : character.specialAbility.usesLeft,
        name: typeof data?.name === 'string' && data.name.trim() ? data.name : fallbackName,
        actionsUsedThisTurn: typeof data?.actionsUsedThisTurn === 'number' ? data.actionsUsedThisTurn : 0
      };
    };

    const sanitizedGameState: GameStateSnapshot = {
      ...initialGameState,
      ...stateData,
      resourcePrices: typeof stateData.resourcePrices === 'object' && stateData.resourcePrices !== null ? stateData.resourcePrices : {},
      activeEvents: Array.isArray(stateData.activeEvents) ? stateData.activeEvents : [],
      currentTurn: stateData.currentTurn === 'ai' ? 'ai' : 'player',
      selectedMode: stateData.selectedMode || null,
      gameMode: ['menu', 'game', 'end'].includes(stateData.gameMode) ? stateData.gameMode : 'game',
      actionLimitsEnabled: Boolean(stateData.actionLimitsEnabled),
      actionsThisTurn: typeof stateData.actionsThisTurn === 'number' ? stateData.actionsThisTurn : 0,
      maxActionsPerTurn: typeof stateData.maxActionsPerTurn === 'number' ? stateData.maxActionsPerTurn : initialGameState.maxActionsPerTurn,
      playerActionsThisTurn: typeof stateData.playerActionsThisTurn === 'number' ? stateData.playerActionsThisTurn : 0,
      allChallengesCompleted: Boolean(stateData.allChallengesCompleted),
      isAiThinking: Boolean(stateData.isAiThinking)
    };

    const sanitizedGameSettings: GameSettingsState = {
      actionLimitsEnabled: Boolean(settingsData.actionLimitsEnabled),
      maxActionsPerTurn: typeof settingsData.maxActionsPerTurn === 'number' ? settingsData.maxActionsPerTurn : DEFAULT_GAME_SETTINGS.maxActionsPerTurn,
      aiMaxActionsPerTurn: typeof settingsData.aiMaxActionsPerTurn === 'number' ? settingsData.aiMaxActionsPerTurn : DEFAULT_GAME_SETTINGS.aiMaxActionsPerTurn,
      allowActionOverride: Boolean(settingsData.allowActionOverride),
      overrideCost: typeof settingsData.overrideCost === 'number' ? settingsData.overrideCost : DEFAULT_GAME_SETTINGS.overrideCost,
      // New settings with backwards compatibility
      totalDays: typeof settingsData.totalDays === 'number' ? settingsData.totalDays : DEFAULT_GAME_SETTINGS.totalDays,
      playerActionsPerDay: typeof settingsData.playerActionsPerDay === 'number' ? settingsData.playerActionsPerDay : (typeof settingsData.maxActionsPerTurn === 'number' ? settingsData.maxActionsPerTurn : DEFAULT_GAME_SETTINGS.playerActionsPerDay),
      aiActionsPerDay: typeof settingsData.aiActionsPerDay === 'number' ? settingsData.aiActionsPerDay : (typeof settingsData.aiMaxActionsPerTurn === 'number' ? settingsData.aiMaxActionsPerTurn : DEFAULT_GAME_SETTINGS.aiActionsPerDay),
      showDayTransition: typeof settingsData.showDayTransition === 'boolean' ? settingsData.showDayTransition : DEFAULT_GAME_SETTINGS.showDayTransition
    };

    const sanitizedNotifications: Notification[] = Array.isArray(raw.notifications)
      ? raw.notifications
          .filter(n => n && typeof n.message === 'string' && typeof n.type === 'string')
          .map((n) => ({
            id: typeof n.id === 'string' ? n.id : `${n.type}-${n.message}-${Math.random()}`,
            type: n.type in NOTIFICATION_TYPES ? n.type : 'info',
            message: n.message,
            timestamp: typeof n.timestamp === 'number' ? n.timestamp : metadata.timestamp,
            day: typeof n.day === 'number' ? n.day : stateData.day,
            read: Boolean(n.read),
            persistent: Boolean(n.persistent)
          }))
      : [];

    const sanitizedPersonalRecords: PersonalRecord = {
      ...DEFAULT_PERSONAL_RECORDS,
      ...(raw.personalRecords || {})
    };

    const sanitizedDontAskAgain: DontAskAgainPrefs = {
      travel: Boolean(raw.dontAskAgain?.travel),
      sell: Boolean(raw.dontAskAgain?.sell),
      challenge: Boolean(raw.dontAskAgain?.challenge),
      endDay: Boolean(raw.dontAskAgain?.endDay)
    };

    const sanitizedRuntime = {
      queue: Array.isArray(raw.aiRuntime?.queue) ? raw.aiRuntime.queue : [],
      currentAction: raw.aiRuntime?.currentAction || null
    };

    const uiPreferences = {
      theme: raw.uiPreferences?.theme === 'light' ? 'light' : 'dark'
    };

    return {
      metadata: {
        timestamp: metadata.timestamp,
        gameVersion: metadata.gameVersion,
        saveDescription: typeof metadata.saveDescription === 'string' ? metadata.saveDescription : ''
      },
      player: sanitizePlayerState(playerData, "Player"),
      aiPlayer: sanitizePlayerState(aiData, "AI Opponent"),
      gameState: sanitizedGameState,
      gameSettings: sanitizedGameSettings,
      notifications: sanitizedNotifications,
      personalRecords: sanitizedPersonalRecords,
      dontAskAgain: sanitizedDontAskAgain,
      uiPreferences,
      aiRuntime: sanitizedRuntime
    };
  }, [resolveCharacter]);

  const openLoadDialog = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    } else {
      addNotification('Load input not ready. Please try again.', 'error');
    }
  }, [addNotification]);

  const handleLoadFileChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const validated = validateSaveData(parsed);
      setLoadPreview({
        isOpen: true,
        data: validated,
        filename: file.name
      });
    } catch (error) {
      console.error('Load failed', error);
      const message = error instanceof Error ? error.message : 'Unable to load save file.';
      addNotification(message, 'error');
    } finally {
      event.target.value = '';
    }
  }, [addNotification, validateSaveData]);

  const closeLoadPreview = useCallback(() => {
    setLoadPreview({ isOpen: false, data: null });
  }, []);

// =========================================
// CONFIRMATION DIALOG SYSTEM
// =========================================

  const showConfirmation = useCallback((
    type: ConfirmationDialog['type'],
    title: string,
    message: string,
    confirmText: string,
    onConfirm: () => void,
    data?: any
  ) => {
    if (dontAskAgain[type as keyof typeof dontAskAgain]) {
      onConfirm();
      return;
    }

    setConfirmationDialog({
      isOpen: true,
      type,
      title,
      message,
      confirmText,
      onConfirm,
      data
    });
  }, [dontAskAgain]);

  const closeConfirmation = useCallback(() => {
    setConfirmationDialog({
      isOpen: false,
      type: null,
      title: '',
      message: '',
      confirmText: '',
      onConfirm: () => {},
      data: null
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmationDialog.onConfirm) {
      confirmationDialog.onConfirm();
    }
    closeConfirmation();
  }, [confirmationDialog, closeConfirmation]);

  // =========================================
  // PERSONAL RECORDS TRACKING
  // =========================================

  const updatePersonalRecords = useCallback((type: string, value: any) => {
    setPersonalRecords(prev => {
      const updated = { ...prev };
      
      switch (type) {
        case 'challenge':
          if (value > updated.highestChallenge) {
            updated.highestChallenge = value;
            addNotification(`New record! Highest challenge reward: $${value}`, 'success', false);
          }
          break;
        case 'resource':
          if (value.price > updated.mostExpensiveResourceSold.price) {
            updated.mostExpensiveResourceSold = value;
            addNotification(`New record! Most valuable sale: ${value.resource} for $${value.price}`, 'success', false);
          }
          break;
        case 'consecutiveWins':
          if (value > updated.consecutiveWins) {
            updated.consecutiveWins = value;
            if (value >= 3) {
              addNotification(`${value} challenges won in a row! 🔥`, 'success', false);
            }
          }
          break;
        case 'money':
          if (value > updated.maxMoney) {
            updated.maxMoney = value;
          }
          break;
        case 'earned':
          updated.totalEarned += value;
          break;
      }
      
      return updated;
    });
  }, [addNotification]);

  // =========================================
  // MONEY VALIDATION HELPERS
  // =========================================

  // Centralized money floor validation - ensures money never goes negative
  const validateMoney = useCallback((amount: number): number => {
    return Math.max(0, Math.floor(amount));
  }, []);

  // Safe money deduction - returns validated amount after deduction
  const deductMoney = useCallback((currentMoney: number, deduction: number): number => {
    return validateMoney(currentMoney - deduction);
  }, [validateMoney]);

  // Safe money addition - returns validated amount after addition
  const addMoney = useCallback((currentMoney: number, addition: number): number => {
    return validateMoney(currentMoney + addition);
  }, [validateMoney]);

  // =========================================
  // AI DECISION MAKING ENGINE
  // =========================================

  const calculateAiSuccessChance = useCallback((challenge, aiState) => {
    const baseChance = 0.5;
    const statBonus = (aiState.stats[
      challenge.type === "physical" ? "strength" :
      challenge.type === "social" ? "charisma" :
      challenge.type === "wildlife" ? "luck" : "intelligence"
    ] || 3) * 0.05;
    
    const difficultyPenalty = challenge.difficulty * 0.1;
    const characterBonus = aiState.character.name === "Tourist" ? 0.1 : 0;
    const levelBonus = aiState.level * 0.02;
    
    return Math.min(0.95, Math.max(0.1, baseChance + statBonus - difficultyPenalty + characterBonus + levelBonus));
  }, []);

  const calculateAiTravelCost = useCallback((fromRegion, toRegion, aiState) => {
    if (ADJACENT_REGIONS[fromRegion]?.includes(toRegion)) {
      let baseCost = 200;
      if (aiState.character.name === "Explorer") {
        baseCost *= 0.75;
      }
      if (aiState.masteryUnlocks.includes("Pathfinder")) {
        return 0;
      }
      return Math.floor(baseCost);
    }
    
    let baseCost = toRegion === "TAS" ? 800 : 500;
    if (aiState.character.name === "Explorer") {
      baseCost *= 0.75;
    }
    if (aiState.masteryUnlocks.includes("Fast Travel")) {
      return 300;
    }
    return Math.floor(baseCost);
  }, []);

  // AI Strategy: Evaluate best challenge to take
  const evaluateChallenge = useCallback((challenge, aiState, difficulty) => {
    // Check if AI can afford minimum wager
    if (aiState.money < MINIMUM_WAGER) {
      return {
        challenge,
        score: -Infinity, // Can't afford challenge
        successChance: 0,
        wager: 0,
        expectedValue: 0
      };
    }

    const successChance = calculateAiSuccessChance(challenge, aiState);
    const maxWager = Math.min(aiState.money, 500);
    const actualWager = Math.max(MINIMUM_WAGER, maxWager); // Ensure at least minimum wager
    const potentialReward = actualWager * challenge.reward;
    const expectedValue = potentialReward * successChance - actualWager * (1 - successChance);

    // Adjust for difficulty profile
    const profile = AI_DIFFICULTY_PROFILES[difficulty];
    const riskAdjusted = expectedValue * profile.riskTolerance;

    // Bonus for strategy match
    let strategyBonus = 0;
    if (aiState.character.aiStrategy === "challenge-focused") {
      strategyBonus = 50;
    }

    return {
      challenge,
      score: riskAdjusted + strategyBonus,
      successChance,
      wager: actualWager,
      expectedValue
    };
  }, [calculateAiSuccessChance]);

  // AI Strategy: Evaluate best region to travel to
  const evaluateTravel = useCallback((region, aiState, difficulty, resourcePrices) => {
    const cost = calculateAiTravelCost(aiState.currentRegion, region, aiState);
    if (aiState.money < cost) return { region, score: -Infinity };
    
    // Value unvisited regions higher
    let score = aiState.visitedRegions.includes(region) ? 10 : 100;
    
    // Value resource richness
    const regionResources = REGIONAL_RESOURCES[region] || [];
    const avgResourceValue = regionResources.reduce((sum, r) => 
      sum + (resourcePrices[r] || 100), 0) / regionResources.length;
    score += avgResourceValue * 0.5;
    
    // Value uncompleted challenges
    const regionChallenges = REGIONS[region]?.challenges || [];
    const uncompletedChallenges = regionChallenges.filter(c => 
      !aiState.challengesCompleted.includes(c.name)
    ).length;
    score += uncompletedChallenges * 30;
    
    // Penalize by cost
    score -= cost * 0.5;
    
    // Strategy bonuses
    if (aiState.character.aiStrategy === "exploration-focused") {
      score += aiState.visitedRegions.includes(region) ? 0 : 150;
    }

    // Penalize travel if inventory is full (can't collect resources)
    const inventoryFullness = aiState.inventory.length / MAX_INVENTORY;
    if (inventoryFullness >= 1.0) {
      // Only travel for challenges, not resources
      score = score * 0.3;
    } else if (inventoryFullness > 0.8) {
      score = score * 0.7; // Reduce travel priority when near full
    }

    return { region, score, cost };
  }, [calculateAiTravelCost]);

  // AI Strategy: Evaluate which resource to sell
  const evaluateResourceSale = useCallback((resource, aiState, resourcePrices) => {
    const price = resourcePrices[resource] || 100;
    let score = price;

    // Strategy adjustments
    if (aiState.character.name === "Businessman") {
      score *= 1.1;
    }

    if (aiState.masteryUnlocks.includes("Investment Genius")) {
      score *= 1.15;
    }

    // Consider inventory count
    const count = aiState.inventory.filter(r => r === resource).length;
    if (count > 3) score *= 1.2; // Sell duplicates

    // Prioritize selling when inventory is getting full
    const inventoryFullness = aiState.inventory.length / MAX_INVENTORY;
    if (inventoryFullness > 0.8) {
      score *= 2.0; // Urgently sell when >80% full
    } else if (inventoryFullness > 0.6) {
      score *= 1.5; // Prioritize selling when >60% full
    }

    return { resource, score, price };
  }, []);

  // AI Strategy: Evaluate special ability usage
  const evaluateSpecialAbility = useCallback((aiState, gameState) => {
    const ability = aiState.character.specialAbility;
    if (!ability || aiState.specialAbilityUses <= 0) return -Infinity;

    let score = 0;

    switch (ability.name) {
      case "Tourist Luck":
        // Use if we have risky challenges available
        const currentRegion = REGIONS[aiState.currentRegion];
        const riskyChallenges = currentRegion?.challenges.filter(c =>
          !aiState.challengesCompleted.includes(c.name) &&
          c.difficulty >= 2
        ) || [];
        score = riskyChallenges.length > 0 ? 80 : 0;
        break;

      case "Market Insight":
        // Use if we have resources to sell
        score = aiState.inventory.length > 5 ? 100 : 30;
        break;

      case "Scout Ahead":
        // Use if we're planning to travel
        const unvisitedRegions = Object.keys(REGIONS).filter(r =>
          r !== aiState.currentRegion && !aiState.visitedRegions.includes(r)
        );
        score = unvisitedRegions.length > 0 ? 60 : 20;
        break;

      case "Calculate Odds":
        // Use on easy challenges for guaranteed win
        const easyChallenges = currentRegion?.challenges.filter(c =>
          !aiState.challengesCompleted.includes(c.name) &&
          c.difficulty < 2 &&
          aiState.money >= MINIMUM_WAGER
        ) || [];
        score = easyChallenges.length > 0 ? 150 : 0; // High priority for guaranteed win
        break;

      default:
        score = 0;
    }

    return score;
  }, []);

  // Main AI decision engine
  const makeAiDecision = useCallback((aiState, gameState, playerState) => {
    try {
      const difficulty = gameState.aiDifficulty;
      const profile = AI_DIFFICULTY_PROFILES[difficulty];

      // Validate AI state
      if (!aiState || !aiState.currentRegion || !REGIONS[aiState.currentRegion]) {
        console.error('Invalid AI state or region:', aiState);
        return {
          type: 'end_turn',
          description: 'Invalid state - ending turn',
          data: null,
          score: 0
        };
      }

      // Sometimes make mistakes based on difficulty
      if (Math.random() < profile.mistakeChance) {
        return {
          type: 'think',
          description: 'Contemplating strategy...',
          data: null
        };
      }

      const decisions: Array<{ type: string; description: string; data: any; score: number }> = [];

      // Evaluate special ability usage
      if (aiState.specialAbilityUses > 0 && aiState.character?.specialAbility) {
        const abilityScore = evaluateSpecialAbility(aiState, gameState);
        if (abilityScore > 0) {
          decisions.push({
            type: 'special_ability',
            description: `Use ${aiState.character.specialAbility.name}`,
            data: { ability: aiState.character.specialAbility },
            score: abilityScore * profile.decisionQuality
          });
        }
      }

      // Evaluate challenges in current region
      const currentRegion = REGIONS[aiState.currentRegion];
      const availableChallenges = currentRegion?.challenges.filter(c =>
        !aiState.challengesCompleted.includes(c.name)
      ) || [];

      availableChallenges.forEach(challenge => {
        try {
          const evaluation = evaluateChallenge(challenge, aiState, difficulty);
          if (evaluation.score > 0 && aiState.money >= evaluation.wager) {
            decisions.push({
              type: 'challenge',
              description: `Attempt ${challenge.name}`,
              data: { challenge, wager: evaluation.wager, successChance: evaluation.successChance },
              score: evaluation.score * profile.decisionQuality
            });
          }
        } catch (error) {
          console.error('Error evaluating challenge:', challenge, error);
        }
      });

      // Evaluate travel options
      Object.keys(REGIONS).forEach(region => {
        if (region !== aiState.currentRegion) {
          try {
            const evaluation = evaluateTravel(region, aiState, difficulty, gameState.resourcePrices);
            if (evaluation.score > 0) {
              decisions.push({
                type: 'travel',
                description: `Travel to ${REGIONS[region].name}`,
                data: { region, cost: evaluation.cost },
                score: evaluation.score * profile.decisionQuality
              });
            }
          } catch (error) {
            console.error('Error evaluating travel to region:', region, error);
          }
        }
      });

      // Evaluate selling resources
      const uniqueResources = Array.from(new Set(aiState.inventory));
      uniqueResources.forEach(resource => {
        try {
          const evaluation = evaluateResourceSale(resource, aiState, gameState.resourcePrices);
          if (evaluation.score > 100) { // Only sell if price is decent
            decisions.push({
              type: 'sell',
              description: `Sell ${resource}`,
              data: { resource, price: evaluation.price },
              score: evaluation.score * profile.decisionQuality
            });
          }
        } catch (error) {
          console.error('Error evaluating resource sale:', resource, error);
        }
      });

      // If we have good options, choose the best one
      if (decisions.length > 0) {
        decisions.sort((a, b) => b.score - a.score);
        const bestDecision = decisions[0];

        // Add some randomness to make AI less predictable
        const randomIndex = Math.floor(Math.random() * Math.min(3, decisions.length));
        return decisions[randomIndex];
      }

      // No good options, end turn
      return {
        type: 'end_turn',
        description: 'Ending turn',
        data: null,
        score: 0
      };
    } catch (error) {
      console.error('Critical error in AI decision making:', error);
      // Graceful fallback - end turn
      return {
        type: 'end_turn',
        description: 'Error - ending turn safely',
        data: null,
        score: 0
      };
    }
  }, [evaluateChallenge, evaluateTravel, evaluateResourceSale, evaluateSpecialAbility, calculateAiSuccessChance]);

  // Execute AI action with validation
  const executeAiAction = useCallback((action: AIAction) => {
    setCurrentAiAction(action);

    // Validate action before execution
    try {
      switch (action.type) {
        case 'challenge':
          // Validate AI has money for wager
          if (action.data?.wager && aiPlayer.money < action.data.wager) {
            addNotification(`🤖 ${aiPlayer.name} can't afford challenge (needs $${action.data.wager})`, 'ai', false);
            return;
          }
          break;

        case 'travel':
          // Validate AI has money for travel
          if (action.data?.cost && aiPlayer.money < action.data.cost) {
            addNotification(`🤖 ${aiPlayer.name} can't afford travel (needs $${action.data.cost})`, 'ai', false);
            return;
          }
          // Validate region exists
          if (action.data?.region && !REGIONS[action.data.region]) {
            console.error('Invalid region:', action.data.region);
            return;
          }
          break;

        case 'sell':
          // Validate AI has resource in inventory
          if (action.data?.resource && !aiPlayer.inventory.includes(action.data.resource)) {
            addNotification(`🤖 ${aiPlayer.name} doesn't have ${action.data.resource} to sell`, 'ai', false);
            return;
          }
          break;

        case 'special_ability':
          // Validate AI has special ability uses left
          if (aiPlayer.specialAbilityUses <= 0) {
            addNotification(`🤖 ${aiPlayer.name} has no special ability uses left`, 'ai', false);
            return;
          }
          break;
      }
    } catch (error) {
      console.error('Action validation error:', error);
      return;
    }

    // Execute validated action
    switch (action.type) {
      case 'challenge':
        const { challenge, wager, successChance } = action.data;
        const success = Math.random() < successChance;
        
        if (success) {
          let reward = Math.floor(wager * challenge.reward);

          if (aiPlayer.character.name === "Tourist") {
            reward = Math.floor(reward * 1.2);
          }

          if (aiPlayer.character.name === "Businessman") {
            reward = Math.floor(reward * 1.1);
          }

          // Calculate XP gain and check for level up
          const xpGain = challenge.difficulty * 20;
          const newXp = aiPlayer.xp + xpGain;
          const xpForNextLevel = aiPlayer.level * 100;

          let levelUpData = {};
          let didLevelUp = false;

          if (newXp >= xpForNextLevel) {
            // Level up!
            didLevelUp = true;
            levelUpData = {
              xp: newXp - xpForNextLevel,
              level: aiPlayer.level + 1,
              stats: {
                strength: aiPlayer.stats.strength + 1,
                charisma: aiPlayer.stats.charisma + 1,
                luck: aiPlayer.stats.luck + 1,
                intelligence: aiPlayer.stats.intelligence + 1
              }
            };
          } else {
            levelUpData = {
              xp: newXp
            };
          }

          setAiPlayer(prev => ({
            ...prev,
            money: addMoney(prev.money, reward),
            challengesCompleted: [...prev.challengesCompleted, challenge.name],
            consecutiveWins: prev.consecutiveWins + 1,
            ...levelUpData
          }));

          addNotification(
            `🤖 ${aiPlayer.name} completed ${challenge.name} and won $${reward}!`,
            'ai',
            false
          );

          if (didLevelUp) {
            addNotification(
              `🤖 ${aiPlayer.name} leveled up to level ${aiPlayer.level + 1}!`,
              'levelup',
              true
            );
          }

          // Check for mastery unlocks (after state update, so we use the old level + 1)
          const newLevel = didLevelUp ? aiPlayer.level + 1 : aiPlayer.level;
          Object.entries(aiPlayer.character.masteryTree || {}).forEach(([name, mastery]) => {
            if (newLevel >= (mastery as any).unlockLevel && !aiPlayer.masteryUnlocks.includes(name)) {
              setAiPlayer(prev => ({
                ...prev,
                masteryUnlocks: [...prev.masteryUnlocks, name]
              }));
              addNotification(
                `🤖 ${aiPlayer.name} unlocked mastery: ${name}!`,
                'levelup',
                true
              );
            }
          });
        } else {
          setAiPlayer(prev => ({
            ...prev,
            money: deductMoney(prev.money, wager),
            consecutiveWins: 0
          }));
          
          addNotification(
            `🤖 ${aiPlayer.name} failed ${challenge.name} and lost $${wager}`,
            'ai',
            false
          );
        }
        break;
        
      case 'travel':
        const { region, cost } = action.data;
        setAiPlayer(prev => ({
          ...prev,
          currentRegion: region,
          money: deductMoney(prev.money, cost),
          visitedRegions: prev.visitedRegions.includes(region)
            ? prev.visitedRegions
            : [...prev.visitedRegions, region]
        }));
        
        // Collect resource (if inventory not full)
        const regionResources = REGIONAL_RESOURCES[region] || [];
        if (regionResources.length > 0) {
          const collectedResource = regionResources[Math.floor(Math.random() * regionResources.length)];

          // Check inventory capacity
          if (aiPlayer.inventory.length < MAX_INVENTORY) {
            setAiPlayer(prev => ({
              ...prev,
              inventory: [...prev.inventory, collectedResource]
            }));

            addNotification(
              `🤖 ${aiPlayer.name} traveled to ${REGIONS[region].name} and found ${collectedResource}`,
              'ai',
              false
            );
          } else {
            addNotification(
              `🤖 ${aiPlayer.name} traveled to ${REGIONS[region].name} (inventory full, couldn't collect ${collectedResource})`,
              'ai',
              false
            );
          }
        } else {
          addNotification(
            `🤖 ${aiPlayer.name} traveled to ${REGIONS[region].name}`,
            'ai',
            false
          );
        }
        break;
        
      case 'sell':
        const { resource, price } = action.data;
        const index = aiPlayer.inventory.indexOf(resource);
        if (index > -1) {
          let finalPrice = price;
          
          if (aiPlayer.character.name === "Businessman") {
            finalPrice = Math.floor(price * 1.1);
          }
          
          if (aiPlayer.masteryUnlocks.includes("Investment Genius")) {
            finalPrice = Math.floor(finalPrice * 1.15);
          }
          
          setAiPlayer(prev => {
            const newInventory = [...prev.inventory];
            newInventory.splice(index, 1);
            return {
              ...prev,
              inventory: newInventory,
              money: addMoney(prev.money, finalPrice)
            };
          });
          
          addNotification(
            `🤖 ${aiPlayer.name} sold ${resource} for $${finalPrice}`,
            'ai',
            false
          );
        }
        break;
        
      case 'special_ability':
        const { ability } = action.data;

        // Use the special ability
        setAiPlayer(prev => ({
          ...prev,
          specialAbilityUses: Math.max(0, prev.specialAbilityUses - 1)
        }));

        addNotification(
          `🤖 ${aiPlayer.name} used ${ability.name}!`,
          'ai',
          true
        );

        // Note: The actual effect of special abilities is applied during challenge/sell/travel
        // This just marks that the ability was used and decrements the counter
        break;

      case 'think':
        addNotification(
          `🤖 ${aiPlayer.name} is thinking...`,
          'ai',
          false
        );
        break;
    }

    dispatchGameState({ type: 'INCREMENT_ACTIONS' });
  }, [aiPlayer, addNotification, addMoney, deductMoney]);

  // AI Turn Management
  const performAiTurn = useCallback(async () => {
    if (gameState.currentTurn !== 'ai' || gameState.isAiThinking) return;

    dispatchGameState({ type: 'SET_AI_THINKING', payload: true });
    dispatchGameState({ type: 'RESET_ACTIONS' });

    const profile = AI_DIFFICULTY_PROFILES[gameState.aiDifficulty];
    const maxActions = gameSettings.aiActionsPerDay;
    
    addNotification(`🤖 ${aiPlayer.name}'s turn begins`, 'ai', true);
    
    // AI takes multiple actions per turn
    for (let i = 0; i < maxActions; i++) {
      // Thinking delay
      const thinkingTime = profile.thinkingTimeMin + 
        Math.random() * (profile.thinkingTimeMax - profile.thinkingTimeMin);
      
      await new Promise(resolve => setTimeout(resolve, thinkingTime));
      
      // Make decision
      const decision = makeAiDecision(aiPlayer, gameState, player);
      
      if (decision.type === 'end_turn') {
        break;
      }
      
      // Execute action
      executeAiAction(decision as AIAction);
      
      // Small delay between actions for visibility
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    // End AI turn
    await new Promise(resolve => setTimeout(resolve, 1000));

    addNotification(`🤖 ${aiPlayer.name} ended their turn`, 'ai', true);
    dispatchGameState({ type: 'SET_AI_THINKING', payload: false });

    // In AI mode, advance the day after AI completes their turn
    // This happens BEFORE switching back to player
    advanceDay();

    // Now switch to player turn for the new day
    dispatchGameState({ type: 'SET_TURN', payload: 'player' });
    setCurrentAiAction(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, aiPlayer, player, makeAiDecision, executeAiAction, addNotification, gameSettings]);

  // Auto-trigger AI turn
  useEffect(() => {
    if (gameState.gameMode === 'game' && 
        gameState.selectedMode === 'ai' && 
        gameState.currentTurn === 'ai' && 
        !gameState.isAiThinking) {
      
      aiTurnTimeoutRef.current = setTimeout(() => {
        performAiTurn();
      }, 1000);
    }
    
    return () => {
      if (aiTurnTimeoutRef.current) {
        clearTimeout(aiTurnTimeoutRef.current);
      }
    };
  }, [gameState.currentTurn, gameState.gameMode, gameState.selectedMode, gameState.isAiThinking, performAiTurn]);

  // =========================================
  // KEYBOARD SHORTCUTS
  // =========================================

  useEffect(() => {
    if (gameState.gameMode !== 'game') return;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && key === 's') {
        e.preventDefault();
        handleSaveGame();
        return;
      }

      const shortcut = KEYBOARD_SHORTCUTS[key];

      if (!shortcut) return;

      e.preventDefault();

      switch (shortcut.action) {
        case 'endTurn':
          if (gameState.currentTurn === 'player' && gameState.day < 30) {
            handleEndTurn();
          }
          break;
        case 'openChallenges':
          if (gameState.currentTurn === 'player') {
            updateUiState({ showChallenges: !uiState.showChallenges });
          }
          break;
        case 'openResources':
          if (gameState.currentTurn === 'player') {
            updateUiState({ showMarket: !uiState.showMarket });
          }
          break;
        case 'openMap':
          updateUiState({ showMap: !uiState.showMap });
          break;
        case 'openTravel':
          if (gameState.currentTurn === 'player') {
            updateUiState({ showTravelModal: !uiState.showTravelModal });
          }
          break;
        case 'openNotifications':
          updateUiState({ showNotifications: !uiState.showNotifications });
          break;
        case 'openProgress':
          updateUiState({ showProgress: !uiState.showProgress });
          break;
        case 'toggleHelp':
          updateUiState({ showHelp: !uiState.showHelp });
          break;
        case 'closeModal':
          updateUiState({
            showChallenges: false,
            showMarket: false,
            showTravelModal: false,
            showStats: false,
            showNotifications: false,
            showProgress: false,
            showHelp: false,
            showAiStats: false
          });
          closeConfirmation();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.gameMode, gameState.day, gameState.currentTurn, uiState, handleSaveGame]);

  // =========================================
  // HELPER FUNCTIONS
  // =========================================

  const updateUiState = useCallback((updates) => {
    setUiState(prev => ({ ...prev, ...updates }));
  }, []);

  const applyLoadedState = useCallback((data: SaveGameData) => {
    if (aiTurnTimeoutRef.current) {
      clearTimeout(aiTurnTimeoutRef.current);
      aiTurnTimeoutRef.current = null;
    }
    closeConfirmation();
    dispatchPlayer({ type: 'LOAD_STATE', payload: data.player });
    dispatchGameState({ type: 'LOAD_STATE', payload: data.gameState });
    setAiPlayer(data.aiPlayer);
    setGameSettings(data.gameSettings);
    setNotifications(data.notifications || []);
    setPersonalRecords(data.personalRecords || { ...DEFAULT_PERSONAL_RECORDS });
    setDontAskAgain(data.dontAskAgain || { ...DEFAULT_DONT_ASK });
    setAiActionQueue(data.aiRuntime?.queue || []);
    setCurrentAiAction(data.aiRuntime?.currentAction || null);
    const selectedCharacterIndex = CHARACTERS.findIndex(char => char.name === data.player.character.name);
    updateUiState({
      theme: data.uiPreferences?.theme || uiState.theme,
      showTravelModal: false,
      showChallenges: false,
      showMarket: false,
      showStats: false,
      showNotifications: false,
      showProgress: false,
      showHelp: false,
      showSettings: false,
      showEndGameModes: false,
      showCampaignSelect: false,
      showAiStats: false,
      playerName: data.player.name,
      selectedCharacter: selectedCharacterIndex >= 0 ? selectedCharacterIndex : uiState.selectedCharacter
    });
    setSaveDescription(data.metadata.saveDescription || '');
    closeLoadPreview();
    addNotification(`Loaded save from Day ${data.gameState.day}`, 'success', true);
  }, [addNotification, closeConfirmation, closeLoadPreview, dispatchGameState, dispatchPlayer, setAiActionQueue, setAiPlayer, setCurrentAiAction, setDontAskAgain, setGameSettings, setNotifications, setPersonalRecords, uiState.selectedCharacter, uiState.theme, updateUiState]);

  const confirmLoadGame = useCallback(() => {
    if (!loadPreview.data) {
      closeLoadPreview();
      return;
    }
    applyLoadedState(loadPreview.data);
  }, [applyLoadedState, closeLoadPreview, loadPreview]);

  const calculateTravelCost = useCallback((fromRegion, toRegion) => {
    if (ADJACENT_REGIONS[fromRegion]?.includes(toRegion)) {
      let baseCost = 200;
      if (player.character.name === "Explorer") {
        baseCost *= 0.75;
      }
      if (player.masteryUnlocks.includes("Pathfinder")) {
        return 0;
      }
      return Math.floor(baseCost);
    }
    
    let baseCost = toRegion === "TAS" ? 800 : 500;
    if (player.character.name === "Explorer") {
      baseCost *= 0.75;
    }
    if (player.masteryUnlocks.includes("Fast Travel")) {
      return 300;
    }
    return Math.floor(baseCost);
  }, [player.character, player.masteryUnlocks]);

  const calculateSuccessChance = useCallback((challenge) => {
    const baseChance = 0.5;
    const statBonus = (player.stats[
      challenge.type === "physical" ? "strength" :
      challenge.type === "social" ? "charisma" :
      challenge.type === "wildlife" ? "luck" : "intelligence"
    ] || 3) * 0.05;
    
    const difficultyPenalty = challenge.difficulty * 0.1;
    const characterBonus = player.character.name === "Tourist" ? 0.1 : 0;
    const levelBonus = player.level * 0.02;
    
    return Math.min(0.95, Math.max(0.1, baseChance + statBonus - difficultyPenalty + characterBonus + levelBonus));
  }, [player.stats, player.character, player.level]);

  const calculateFinalScore = useCallback((playerData) => {
    return playerData.money + 
           (playerData.challengesCompleted?.length || 0) * 100 +
           (playerData.visitedRegions?.length || 0) * 50;
  }, []);

  const getInventoryValue = useMemo(() => {
    return player.inventory.reduce((total, resource) => {
      return total + (gameState.resourcePrices[resource] || 100);
    }, 0);
  }, [player.inventory, gameState.resourcePrices]);

  const getNetWorth = useMemo(() => {
    return player.money + getInventoryValue;
  }, [player.money, getInventoryValue]);

  const getAiInventoryValue = useMemo(() => {
    return aiPlayer.inventory.reduce((total, resource) => {
      return total + (gameState.resourcePrices[resource] || 100);
    }, 0);
  }, [aiPlayer.inventory, gameState.resourcePrices]);

  const getAiNetWorth = useMemo(() => {
    return aiPlayer.money + getAiInventoryValue;
  }, [aiPlayer.money, getAiInventoryValue]);

  // =========================================
  // GAME LOGIC FUNCTIONS
  // =========================================

  const travelToRegion = useCallback((region) => {
    const cost = calculateTravelCost(player.currentRegion, region);
    
    const confirmTravel = () => {
      if (player.money >= cost) {
        dispatchPlayer({ type: 'UPDATE_MONEY', payload: -cost });
        dispatchPlayer({ type: 'SET_REGION', payload: region });
        updateUiState({ showTravelModal: false });
        addNotification(`Traveled to ${REGIONS[region].name} for $${cost}`, 'travel');
        
        // Collect resources (if inventory not full)
        const regionResources = REGIONAL_RESOURCES[region] || [];
        if (regionResources.length > 0) {
          const collectedResource = regionResources[Math.floor(Math.random() * regionResources.length)];

          if (player.inventory.length < MAX_INVENTORY) {
            dispatchPlayer({ type: 'COLLECT_RESOURCES', payload: { resources: [collectedResource] } });
            addNotification(`Found ${collectedResource}!`, 'resource');
          } else {
            addNotification(`Inventory full (${MAX_INVENTORY}/${MAX_INVENTORY})! Couldn't collect ${collectedResource}`, 'warning');
          }
        }
        
        dispatchGameState({ type: 'INCREMENT_ACTIONS' });
      }
    };

    showConfirmation(
      'travel',
      'Confirm Travel',
      `Travel to ${REGIONS[region].name} for $${cost}?`,
      'Travel',
      confirmTravel,
      { region, cost }
    );
  }, [player, calculateTravelCost, addNotification, showConfirmation]);

  const takeChallenge = useCallback((challenge, wager) => {
    const successChance = calculateSuccessChance(challenge);
    
    const confirmChallenge = () => {
      if (player.money < wager) {
        addNotification('Not enough money!', 'error');
        return;
      }

      const success = Math.random() < successChance;
      
      if (success) {
        let reward = Math.floor(wager * challenge.reward);
        
        if (player.character.name === "Tourist") {
          reward = Math.floor(reward * 1.2);
        }
        
        if (player.character.name === "Businessman") {
          reward = Math.floor(reward * 1.1);
        }
        
        dispatchPlayer({ type: 'UPDATE_MONEY', payload: reward });
        dispatchPlayer({ type: 'COMPLETE_CHALLENGE', payload: challenge.name });
        dispatchPlayer({ type: 'GAIN_XP', payload: challenge.difficulty * 20 });
        
        addNotification(`${challenge.name} completed! Won $${reward}`, 'success');
        updatePersonalRecords('challenge', reward);
        updatePersonalRecords('consecutiveWins', player.consecutiveWins + 1);
        updatePersonalRecords('earned', reward);
        
        // Check for mastery unlocks
        Object.entries(player.character.masteryTree || {}).forEach(([name, mastery]) => {
          if (player.level >= (mastery as any).unlockLevel && !player.masteryUnlocks.includes(name)) {
            dispatchPlayer({ type: 'UNLOCK_MASTERY', payload: name });
            addNotification(`Mastery Unlocked: ${name}!`, 'levelup', true);
          }
        });
      } else {
        dispatchPlayer({ type: 'UPDATE_MONEY', payload: -wager });
        dispatchPlayer({ type: 'RESET_STREAK' });
        addNotification(`${challenge.name} failed. Lost $${wager}`, 'error');
      }
      
      updateUiState({ showChallenges: false });
      dispatchGameState({ type: 'INCREMENT_ACTIONS' });
    };

    if (successChance < 0.5) {
      showConfirmation(
        'challenge',
        'Risky Challenge',
        `This challenge has only a ${Math.round(successChance * 100)}% success rate. Wager $${wager}?`,
        'Take Challenge',
        confirmChallenge,
        { challenge, wager, successChance }
      );
    } else {
      confirmChallenge();
    }
  }, [player, calculateSuccessChance, addNotification, showConfirmation, updatePersonalRecords]);

  const sellResource = useCallback((resource, price) => {
    const confirmSell = () => {
      const index = player.inventory.indexOf(resource);
      if (index > -1) {
        let finalPrice = price;
        
        if (player.character.name === "Businessman") {
          finalPrice = Math.floor(price * 1.1);
        }
        
        if (player.masteryUnlocks.includes("Investment Genius")) {
          finalPrice = Math.floor(finalPrice * 1.15);
        }
        
        dispatchPlayer({ type: 'SELL_RESOURCE', payload: { resource, price: finalPrice } });
        addNotification(`Sold ${resource} for $${finalPrice}`, 'money');
        updatePersonalRecords('resource', { resource, price: finalPrice });
        updatePersonalRecords('earned', finalPrice);
        updatePersonalRecords('money', player.money + finalPrice);
        dispatchGameState({ type: 'INCREMENT_ACTIONS' });
      }
    };

    if (price >= 200) {
      showConfirmation(
        'sell',
        'Confirm Sale',
        `Sell ${resource} for $${price}?`,
        'Sell',
        confirmSell,
        { resource, price }
      );
    } else {
      confirmSell();
    }
  }, [player, addNotification, showConfirmation, updatePersonalRecords]);

  const handleEndTurn = useCallback(() => {
    if (gameState.currentTurn !== 'player') return;
    
    const confirmEndTurn = () => {
      // Reset special ability
      dispatchPlayer({ type: 'RESET_SPECIAL_ABILITY' });
      
      // Update resource prices based on market trend
      const newPrices = {};
      const currentPrices = gameState.resourcePrices;

      Object.keys(RESOURCE_CATEGORIES).forEach(resource => {
        const currentPrice = currentPrices[resource] || 100;
        let variance = Math.random() * 100 - 50; // Base variance: -50 to +50

        // Apply market trend bias
        switch (gameState.marketTrend) {
          case 'rising':
            variance += 30; // Bias towards higher prices (+30 to +80)
            break;
          case 'falling':
            variance -= 30; // Bias towards lower prices (-80 to -30)
            break;
          case 'volatile':
            variance *= 1.5; // Larger swings (-75 to +75)
            break;
          case 'stable':
            variance *= 0.5; // Smaller changes (-25 to +25)
            break;
        }

        // Apply change to current price rather than base price
        const newPrice = currentPrice + variance;
        newPrices[resource] = Math.max(50, Math.min(250, Math.floor(newPrice))); // Cap at 50-250
      });
      dispatchGameState({ type: 'UPDATE_RESOURCE_PRICES', payload: newPrices });
      
      addNotification('Your turn ended', 'info');
      
      if (gameState.selectedMode === 'ai') {
        // Switch to AI turn
        dispatchGameState({ type: 'SET_TURN', payload: 'ai' });
      } else {
        // Single player mode - advance day
        advanceDay();
      }
      
      updatePersonalRecords('money', player.money);
    };

    const hasUnusedResources = player.inventory.length > 0;
    const hasHighMoney = player.money > 1000;
    
    if ((hasUnusedResources || hasHighMoney) && gameState.actionsThisTurn < 2) {
      showConfirmation(
        'endDay',
        'End Turn?',
        hasUnusedResources 
          ? `You have ${player.inventory.length} unsold resources. End turn anyway?`
          : `You have $${player.money}. Sure you want to end your turn?`,
        'End Turn',
        confirmEndTurn
      );
    } else {
      confirmEndTurn();
    }
  }, [player, gameState, addNotification, showConfirmation, updatePersonalRecords]);

  const advanceDay = useCallback(() => {
    const prevDay = gameState.day;
    const newDay = prevDay + 1;

    // Show day transition screen if enabled
    if (gameSettings.showDayTransition) {
      setDayTransitionData({
        prevDay: prevDay,
        newDay: newDay,
        playerEarned: player.money - (personalRecords.maxMoney || player.character.startingMoney),
        aiEarned: aiPlayer.money - (aiPlayer.character.startingMoney || 1000)
      });
      updateUiState({ showDayTransition: true });

      // Auto-dismiss after 2 seconds
      setTimeout(() => {
        updateUiState({ showDayTransition: false });
      }, 2000);
    } else {
      // Show brief notification instead
      addNotification(`Day ${newDay} begins`, 'info', true);
    }

    dispatchGameState({ type: 'NEXT_DAY' });

    // Update weather
    const weatherOptions = ["Sunny", "Cloudy", "Rainy", "Stormy"];
    const newWeather = weatherOptions[Math.floor(Math.random() * weatherOptions.length)];
    dispatchGameState({ type: 'UPDATE_WEATHER', payload: newWeather });

    // Market trend
    const trends = ["rising", "falling", "stable", "volatile"];
    const newTrend = trends[Math.floor(Math.random() * trends.length)];
    dispatchGameState({ type: 'UPDATE_MARKET_TREND', payload: newTrend });

    if (!gameSettings.showDayTransition) {
      addNotification(`Market trend: ${newTrend}`, 'market', true);
      addNotification(`Weather: ${newWeather}`, 'info', true);
    }

    // Check for game end - use configurable totalDays
    if (gameState.day >= gameSettings.totalDays) {
      dispatchGameState({ type: 'SET_GAME_MODE', payload: 'end' });
      addNotification(`Game Over! Final Day Reached (${gameSettings.totalDays} days)`, 'success', true);
    }
  }, [gameState, gameSettings, player, aiPlayer, personalRecords, addNotification]);

  // When turn switches to player, reset their actions
  useEffect(() => {
    if (gameState.currentTurn === 'player') {
      dispatchPlayer({ type: 'RESET_ACTIONS' });
    }
  }, [gameState.currentTurn]);

  // Lock body scroll when modals are open
  useEffect(() => {
    if (uiState.showSettings || uiState.showProgress || uiState.showSaveLoadModal || uiState.showNotifications || loadPreview.isOpen) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [uiState.showSettings, uiState.showProgress, uiState.showSaveLoadModal, uiState.showNotifications, loadPreview.isOpen]);

  // Initialize resource prices
  useEffect(() => {
    if (Object.keys(gameState.resourcePrices).length === 0) {
      const initialPrices = {};
      Object.keys(RESOURCE_CATEGORIES).forEach(resource => {
        initialPrices[resource] = 100;
      });
      dispatchGameState({ type: 'UPDATE_RESOURCE_PRICES', payload: initialPrices });
    }
  }, [gameState.resourcePrices]);

  // =========================================
  // THEME SYSTEM
  // =========================================

  const themeStyles = useMemo(() => {
    const isDark = uiState.theme === "dark";
    return {
      background: isDark ? "bg-gray-900" : "bg-gray-100",
      text: isDark ? "text-white" : "text-gray-900",
      card: isDark ? "bg-gray-800" : "bg-white",
      border: isDark ? "border-gray-700" : "border-gray-300",
      button: isDark ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600",
      buttonSecondary: isDark ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-300 hover:bg-gray-400",
      accent: isDark ? "bg-purple-600" : "bg-purple-500",
      shadow: isDark ? "shadow-2xl" : "shadow-lg",
      overlay: isDark ? "bg-black bg-opacity-70" : "bg-black bg-opacity-50",
      success: isDark ? "bg-green-700" : "bg-green-500",
      error: isDark ? "bg-red-700" : "bg-red-500",
      warning: isDark ? "bg-yellow-700" : "bg-yellow-500",
      ai: isDark ? "bg-pink-600" : "bg-pink-500",
    };
  }, [uiState.theme]);

  // =========================================
  // ACTION LIMIT & END-GAME HELPERS
  // =========================================

  // Helper function to check if action limit reached
  const isActionLimitReached = () => {
    return gameSettings.actionLimitsEnabled && player.actionsUsedThisTurn >= gameSettings.playerActionsPerDay;
  };

  // Helper function to check if all challenges are completed
  const checkAllChallengesCompleted = () => {
    const totalChallenges = Object.values(REGIONS).reduce(
      (sum, region: any) => sum + region.challenges.length,
      0
    );
    return player.challengesCompleted.length === totalChallenges;
  };

  // Update game state when all challenges are completed
  useEffect(() => {
    const allCompleted = checkAllChallengesCompleted();
    if (allCompleted !== gameState.allChallengesCompleted) {
      dispatchGameState({ type: 'SET_ALL_CHALLENGES_COMPLETED', payload: allCompleted });
      if (allCompleted) {
        addNotification('🎉 You have completed all challenges! Access End-Game Modes!', 'success', true);
      }
    }
  }, [player.challengesCompleted]);

  // =========================================
  // CONTEXT-AWARE QUICK ACTIONS
  // =========================================

  const getQuickActions = useMemo(() => {
    if (gameState.currentTurn !== 'player') return [];
    
    const actions = [];
    const actionLimitReached = isActionLimitReached();
    
    // Resources to sell
    if (player.inventory.length > 0) {
      actions.push({
        label: `Sell Resources (${player.inventory.length}/${MAX_INVENTORY})`,
        icon: '💰',
        action: () => {
          if (actionLimitReached) {
            showConfirmation(
              'endDay',
              'Action Limit Reached',
              `You have reached your action limit (${gameSettings.playerActionsPerDay}). Pay $${gameSettings.overrideCost} to continue?`,
              'Pay & Continue',
              () => {
                if (player.money >= gameSettings.overrideCost && gameSettings.allowActionOverride) {
                  dispatchPlayer({ type: 'USE_ACTION_OVERRIDE', payload: gameSettings.overrideCost });
                  addNotification(`💸 Paid $${gameSettings.overrideCost} to override action limit`, 'warning');
                  updateUiState({ showMarket: true });
                } else {
                  addNotification('Not enough money for override', 'error');
                }
              }
            );
          } else {
            updateUiState({ showMarket: true });
          }
        },
        hotkey: 'R',
        disabled: actionLimitReached && gameSettings.actionLimitsEnabled
      });
    }
    
    // Available challenges
    const currentChallenges = REGIONS[player.currentRegion]?.challenges || [];
    const availableChallenges = currentChallenges.filter(
      c => !player.challengesCompleted.includes(c.name)
    );
    
    if (availableChallenges.length > 0) {
      actions.push({
        label: `Challenges (${availableChallenges.length})`,
        icon: '🎯',
        action: () => {
          if (actionLimitReached) {
            showConfirmation(
              'endDay',
              'Action Limit Reached',
              `You have reached your action limit (${gameSettings.playerActionsPerDay}). Pay $${gameSettings.overrideCost} to continue?`,
              'Pay & Continue',
              () => {
                if (player.money >= gameSettings.overrideCost && gameSettings.allowActionOverride) {
                  dispatchPlayer({ type: 'USE_ACTION_OVERRIDE', payload: gameSettings.overrideCost });
                  addNotification(`💸 Paid $${gameSettings.overrideCost} to override action limit`, 'warning');
                  updateUiState({ showChallenges: true });
                } else {
                  addNotification('Not enough money for override', 'error');
                }
              }
            );
          } else {
            updateUiState({ showChallenges: true });
          }
        },
        hotkey: 'C',
        disabled: actionLimitReached && gameSettings.actionLimitsEnabled
      });
    }
    
    // Can travel
    if (player.money >= 200) {
      const unvisitedRegions = Object.keys(REGIONS).filter(
        r => !player.visitedRegions.includes(r)
      );
      if (unvisitedRegions.length > 0) {
        actions.push({
          label: `Explore (${unvisitedRegions.length} new)`,
          icon: '🗺️',
          action: () => {
            if (actionLimitReached) {
              showConfirmation(
                'endDay',
                'Action Limit Reached',
                `You have reached your action limit (${gameSettings.maxActionsPerTurn}). Pay $${gameSettings.overrideCost} to continue?`,
                'Pay & Continue',
                () => {
                  if (player.money >= gameSettings.overrideCost && gameSettings.allowActionOverride) {
                    dispatchPlayer({ type: 'USE_ACTION_OVERRIDE', payload: gameSettings.overrideCost });
                    addNotification(`💸 Paid $${gameSettings.overrideCost} to override action limit`, 'warning');
                    updateUiState({ showTravelModal: true });
                  } else {
                    addNotification('Not enough money for override', 'error');
                  }
                }
              );
            } else {
              updateUiState({ showTravelModal: true });
            }
          },
          hotkey: 'T',
          disabled: actionLimitReached && gameSettings.actionLimitsEnabled
        });
      }
    }

    // End-Game Modes (when all challenges completed)
    if (gameState.allChallengesCompleted) {
      actions.push({
        label: 'End-Game Modes 🏆',
        icon: '⚡',
        action: () => updateUiState({ showEndGameModes: true }),
        hotkey: 'E',
        disabled: false
      });
    }
    
    // End turn
    if (gameState.day < gameSettings.totalDays) {
      actions.push({
        label: 'End Turn',
        icon: '⏭️',
        action: handleEndTurn,
        hotkey: 'Space',
        disabled: false
      });
    }
    
    return actions;
  }, [player, gameState.day, gameState.currentTurn, gameState.allChallengesCompleted, gameSettings]);

  // =========================================
  // RENDER FUNCTIONS - SETTINGS & END-GAME
  // =========================================

  // Settings Modal
  const renderSettingsModal = () => {
    if (!uiState.showSettings) return null;

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-hidden"
        onClick={() => updateUiState({ showSettings: false })}
      >
        <div
          className={`${themeStyles.card} ${themeStyles.border} border rounded-xl max-w-2xl w-full h-[90vh] flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fixed Header */}
          <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-700">
            <h3 className="text-2xl font-bold">⚙️ Game Settings</h3>
            <button
              onClick={() => updateUiState({ showSettings: false })}
              className={`${themeStyles.buttonSecondary} px-3 py-1 rounded`}
            >
              ✕
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-scroll p-6 pt-4" style={{ maxHeight: 'calc(90vh - 180px)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' }}>
            <div className="space-y-6">
              <div className={`${themeStyles.border} border rounded-lg p-4`}>
                <h4 className="text-lg font-bold mb-4">🎮 Game Rules</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold mb-2">Total Days: {gameSettings.totalDays}</label>
                    <input type="range" min="10" max="100" value={gameSettings.totalDays} onChange={(e) => setGameSettings(prev => ({ ...prev, totalDays: parseInt(e.target.value) }))} className="w-full" />
                    <div className="text-xs opacity-75 mt-1">Currently: Day {gameState.day} of {gameSettings.totalDays}</div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Player Actions Per Day: {gameSettings.playerActionsPerDay}</label>
                    <input type="range" min="1" max="10" value={gameSettings.playerActionsPerDay} onChange={(e) => setGameSettings(prev => ({ ...prev, playerActionsPerDay: parseInt(e.target.value), maxActionsPerTurn: parseInt(e.target.value) }))} className="w-full" />
                    <div className="text-xs opacity-75 mt-1">Current: {player.actionsUsedThisTurn} / {gameSettings.playerActionsPerDay}</div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">AI Actions Per Day: {gameSettings.aiActionsPerDay}</label>
                    <input type="range" min="1" max="10" value={gameSettings.aiActionsPerDay} onChange={(e) => setGameSettings(prev => ({ ...prev, aiActionsPerDay: parseInt(e.target.value), aiMaxActionsPerTurn: parseInt(e.target.value) }))} className="w-full" />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Show Day Transition Screen</div>
                      <div className="text-sm opacity-75">Display summary between days</div>
                    </div>
                    <button
                      onClick={() => setGameSettings(prev => ({ ...prev, showDayTransition: !prev.showDayTransition }))}
                      className={`px-4 py-2 rounded font-semibold ${gameSettings.showDayTransition ? themeStyles.success : themeStyles.buttonSecondary} text-white`}
                    >
                      {gameSettings.showDayTransition ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>
              <div className={`${themeStyles.border} border rounded-lg p-4`}>
                <h4 className="text-lg font-bold mb-4">⏱️ Action Limits</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Enable Action Limits</div>
                      <div className="text-sm opacity-75">Restrict actions per turn</div>
                    </div>
                    <button
                      onClick={() => {
                        setGameSettings(prev => ({ ...prev, actionLimitsEnabled: !prev.actionLimitsEnabled }));
                      }}
                      className={`px-4 py-2 rounded font-semibold ${gameSettings.actionLimitsEnabled ? themeStyles.success : themeStyles.buttonSecondary} text-white`}
                    >
                      {gameSettings.actionLimitsEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Max Actions (Human): {gameSettings.maxActionsPerTurn}</label>
                    <input type="range" min="1" max="10" value={gameSettings.maxActionsPerTurn} onChange={(e) => setGameSettings(prev => ({ ...prev, maxActionsPerTurn: parseInt(e.target.value) }))} className="w-full" disabled />
                    <div className="text-xs opacity-75 mt-1">Use "Player Actions Per Day" above to adjust</div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Max Actions (AI): {gameSettings.aiMaxActionsPerTurn}</label>
                    <input type="range" min="1" max="10" value={gameSettings.aiMaxActionsPerTurn} onChange={(e) => setGameSettings(prev => ({ ...prev, aiMaxActionsPerTurn: parseInt(e.target.value) }))} className="w-full" disabled />
                    <div className="text-xs opacity-75 mt-1">Use "AI Actions Per Day" above to adjust</div>
                  </div>
                </div>
              </div>
              <div className={`${themeStyles.border} border rounded-lg p-4`}>
                <h4 className="text-lg font-bold mb-4">💸 Action Override</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Allow Override</div>
                      <div className="text-sm opacity-75">Pay to exceed limit</div>
                    </div>
                    <button
                      onClick={() => setGameSettings(prev => ({ ...prev, allowActionOverride: !prev.allowActionOverride }))}
                      className={`px-4 py-2 rounded font-semibold ${gameSettings.allowActionOverride ? themeStyles.success : themeStyles.buttonSecondary} text-white`}
                    >
                      {gameSettings.allowActionOverride ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div>
                    <label className="block font-semibold mb-2">Override Cost: ${gameSettings.overrideCost}</label>
                    <input type="range" min="100" max="5000" step="100" value={gameSettings.overrideCost} onChange={(e) => setGameSettings(prev => ({ ...prev, overrideCost: parseInt(e.target.value) }))} className="w-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="p-6 pt-4 border-t border-gray-700">
            <button onClick={() => updateUiState({ showSettings: false })} className={`${themeStyles.button} text-white px-6 py-3 rounded-lg w-full font-bold`}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  // Save/Load Game Modal
  const renderSaveLoadModal = () => {
    if (!uiState.showSaveLoadModal) return null;

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-hidden"
        onClick={() => updateUiState({ showSaveLoadModal: false })}
      >
        <div
          className={`${themeStyles.card} ${themeStyles.border} border rounded-xl max-w-lg w-full flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fixed Header */}
          <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-700">
            <h3 className="text-2xl font-bold">💾 Save / Load Game</h3>
            <button
              onClick={() => updateUiState({ showSaveLoadModal: false })}
              className={`${themeStyles.buttonSecondary} px-3 py-1 rounded`}
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-4">
              {/* Save Game Section */}
              <div className={`${themeStyles.border} border rounded-lg p-4`}>
                <h4 className="font-bold text-lg mb-3">💾 Save Current Game</h4>
                <p className="text-sm opacity-75 mb-4">
                  Download your current game progress as a JSON file. You can load it later to continue from where you left off.
                </p>
                <div className="mb-3">
                  <label className="block text-sm font-semibold mb-2">Save Description (Optional)</label>
                  <input
                    type="text"
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    placeholder={`Day ${gameState.day} - ${player.name}`}
                    className={`w-full px-3 py-2 rounded ${themeStyles.input} border ${themeStyles.border}`}
                    maxLength={50}
                  />
                  <p className="text-xs opacity-75 mt-1">Appears in the save preview and filename.</p>
                </div>
                <button
                  onClick={() => {
                    handleSaveGame(saveDescription);
                    updateUiState({ showSaveLoadModal: false });
                  }}
                  disabled={gameState.gameMode === 'menu'}
                  className={`${themeStyles.button} text-white px-6 py-3 rounded-lg w-full font-bold disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  💾 Download Save File
                </button>
                {gameState.gameMode === 'menu' && (
                  <p className="text-xs text-yellow-500 mt-2">Start a game first before saving</p>
                )}
              </div>

              {/* Load Game Section */}
              <div className={`${themeStyles.border} border rounded-lg p-4`}>
                <h4 className="font-bold text-lg mb-3">📂 Load Saved Game</h4>
                <p className="text-sm opacity-75 mb-4">
                  Upload a previously saved JSON file to restore your game progress.
                </p>
                <button
                  onClick={() => {
                    openLoadDialog();
                    updateUiState({ showSaveLoadModal: false });
                  }}
                  className={`${themeStyles.buttonSecondary} px-6 py-3 rounded-lg w-full font-bold`}
                >
                  📂 Upload Save File
                </button>
              </div>

              {/* Quick Tip */}
              <div className="text-xs opacity-75 text-center pt-2 border-t border-gray-700">
                💡 Quick tip: Press <kbd className="px-2 py-1 bg-black bg-opacity-30 rounded">Ctrl+S</kbd> anytime to quick save
              </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="p-6 pt-4 border-t border-gray-700">
            <button onClick={() => updateUiState({ showSaveLoadModal: false })} className={`${themeStyles.button} text-white px-6 py-3 rounded-lg w-full font-bold`}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  // End-Game Modes Modal
  const renderEndGameModesModal = () => {
    if (!uiState.showEndGameModes || !gameState.allChallengesCompleted) return null;

    const endGameModes = {
      "Time Attack": { name: "Time Attack", icon: "⏱️", description: "Re-complete challenges faster for bonus money", reward: "Earn 50% more money" },
      "Hardcore Mode": { name: "Hardcore Mode", icon: "💀", description: "Increased difficulty challenges", reward: "Earn 2x XP and 2x money" },
      "Treasure Hunt": { name: "Treasure Hunt", icon: "🗺️", description: "Find hidden treasures", reward: "Rare resources worth $200-$1000" },
      "Master Challenges": { name: "Master Challenges", icon: "🏆", description: "All challenges in one turn", reward: "Triple rewards" }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className={`${themeStyles.card} ${themeStyles.border} border rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold">🏆 End-Game Modes</h3>
            <button onClick={() => updateUiState({ showEndGameModes: false })} className={`${themeStyles.buttonSecondary} px-3 py-1 rounded`}>✕</button>
          </div>
          <div className="mb-4 p-4 bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg">
            <div className="font-semibold">🎉 Congratulations!</div>
            <div className="text-sm">You completed all challenges! Access new gameplay modes.</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {Object.entries(endGameModes).map(([key, mode]) => (
              <div key={key} onClick={() => { addNotification(`🎮 Started ${mode.name}!`, 'event', true); updateUiState({ showEndGameModes: false }); }} className={`${themeStyles.border} border rounded-lg p-4 hover:scale-105 transition cursor-pointer`}>
                <div className="text-4xl mb-2">{mode.icon}</div>
                <div className="font-bold text-lg mb-2">{mode.name}</div>
                <div className="text-sm opacity-75 mb-3">{mode.description}</div>
                <div className={`text-sm p-2 rounded ${themeStyles.accent} text-white`}>✨ {mode.reward}</div>
              </div>
            ))}
          </div>
          <button onClick={() => updateUiState({ showEndGameModes: false })} className={`${themeStyles.button} text-white px-6 py-3 rounded-lg w-full font-bold`}>Return to Game</button>
        </div>
      </div>
    );
  };

  // =========================================
  // RENDER FUNCTIONS (CONTINUED IN NEXT PART)
  // =========================================

  // Notification Display Component
  const renderNotificationBar = () => {
    const recentNotifications = notifications.slice(-3);
    
    return (
      <div className="fixed top-4 right-4 z-40 space-y-2 max-w-md">
        {recentNotifications.map(notification => {
          const notifType = NOTIFICATION_TYPES[notification.type];
          return (
            <div
              key={notification.id}
              className={`${themeStyles.card} border-l-4 rounded-lg p-3 ${themeStyles.shadow} transform transition-all duration-300 hover:scale-105 cursor-pointer`}
              style={{ borderLeftColor: notifType.color }}
              onClick={() => markNotificationRead(notification.id)}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{notifType.icon}</span>
                <div className="flex-1">
                  <div className="text-xs opacity-75 mb-1">
                    {notifType.label} • Day {notification.day}
                  </div>
                  <div className="text-sm">{notification.message}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearNotification(notification.id);
                  }}
                  className="text-gray-400 hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderLoadPreviewModal = () => {
    if (!loadPreview.isOpen || !loadPreview.data) return null;
    const data = loadPreview.data;
    const saveDate = new Date(data.metadata.timestamp).toLocaleString();
    const totalDays = data.gameSettings?.totalDays || 30;
    const progressPercent = Math.min(100, Math.round((data.gameState.day / totalDays) * 100));
    const regionName = REGIONS[data.player.currentRegion]?.name || data.player.currentRegion;
    const netWorth = data.player.money + (Array.isArray(data.player.inventory)
      ? data.player.inventory.reduce((total, resource) => {
          return total + (data.gameState.resourcePrices?.[resource] || 100);
        }, 0)
      : 0);
    const isAiMode = data.gameState.selectedMode === 'ai';
    const difficultyLabel = isAiMode
      ? (AI_DIFFICULTY_PROFILES[data.gameState.aiDifficulty]?.name || data.gameState.aiDifficulty)
      : 'Single Player';

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 overflow-hidden"
        onClick={closeLoadPreview}
      >
        <div
          className={`${themeStyles.card} ${themeStyles.border} border rounded-xl w-full max-w-2xl h-[90vh] flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fixed Header */}
          <div className="p-6 pb-4 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold">Load Save Preview</h3>
                <p className="text-sm opacity-75">{loadPreview.filename || 'Manual Save File'}</p>
              </div>
              <button onClick={closeLoadPreview} className={`${themeStyles.buttonSecondary} px-3 py-1 rounded`}>
                ✕
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-scroll p-6 pt-4" style={{ maxHeight: 'calc(90vh - 200px)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className={`${themeStyles.border} border rounded-lg p-4`}>
              <div className="font-bold mb-2">Save Details</div>
              <p>Saved At: {saveDate}</p>
              <p>Version: {data.metadata.gameVersion}</p>
              <p>Description: {data.metadata.saveDescription || 'Manual Save'}</p>
              <p>Day: {data.gameState.day} / {totalDays} ({progressPercent}%)</p>
            </div>

            <div className={`${themeStyles.border} border rounded-lg p-4`}>
              <div className="font-bold mb-2">Player Snapshot</div>
              <p>Character: {data.player.character.name}</p>
              <p>Level: {data.player.level}</p>
              <p>Money: ${data.player.money.toLocaleString()}</p>
              <p>Net Worth: ${netWorth.toLocaleString()}</p>
            </div>

            <div className={`${themeStyles.border} border rounded-lg p-4`}>
              <div className="font-bold mb-2">World State</div>
              <p>Region: {regionName}</p>
              <p>Weather: {data.gameState.weather}</p>
              <p>Season: {data.gameState.season}</p>
              <p>Current Turn: {data.gameState.currentTurn === 'ai' ? 'AI' : 'Player'}</p>
            </div>

            <div className={`${themeStyles.border} border rounded-lg p-4`}>
              <div className="font-bold mb-2">Mode & Progress</div>
              <p>Mode: {isAiMode ? 'AI Battle' : 'Single Player'}</p>
              {isAiMode && (
                <p>AI Difficulty: {difficultyLabel}</p>
              )}
              <p>Challenges Won: {data.player.challengesCompleted.length}</p>
              <p>Regions Visited: {data.player.visitedRegions.length}/8</p>
            </div>
            </div>

            {gameState.gameMode === 'game' && (
              <div className="mt-4 p-3 rounded-lg bg-red-500 bg-opacity-20 text-sm text-red-200">
                Loading will overwrite your current game progress. Continue?
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className="p-6 pt-4 border-t border-gray-700">
            <div className="flex flex-col md:flex-row md:justify-end gap-3">
              <button onClick={closeLoadPreview} className={`${themeStyles.buttonSecondary} px-6 py-2 rounded-lg w-full md:w-auto`}>
                Cancel
              </button>
              <button onClick={confirmLoadGame} className={`${themeStyles.button} text-white px-6 py-2 rounded-lg w-full md:w-auto`}>
                Load Game
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Turn Indicator Component
  const renderTurnIndicator = () => {
    if (gameState.selectedMode !== 'ai') return null;
    
    const isPlayerTurn = gameState.currentTurn === 'player';
    const isAiTurn = gameState.currentTurn === 'ai';
    
    return (
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40">
        <div className={`${isPlayerTurn ? themeStyles.success : themeStyles.ai} ${themeStyles.shadow} rounded-full px-6 py-3 flex items-center space-x-3 animate-pulse`}>
          <span className="text-2xl">{isPlayerTurn ? '👤' : '🤖'}</span>
          <div>
            <div className="font-bold text-white">
              {isPlayerTurn ? 'YOUR TURN' : "AI'S TURN"}
            </div>
            {isAiTurn && gameState.isAiThinking && (
              <div className="text-xs text-white opacity-75">
                Thinking...
              </div>
            )}
            {currentAiAction && isAiTurn && (
              <div className="text-xs text-white opacity-75">
                {currentAiAction.description}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Day Transition Screen
  const renderDayTransitionScreen = () => {
    if (!uiState.showDayTransition) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
        <div className={`${themeStyles.card} ${themeStyles.border} border rounded-xl p-8 max-w-md w-full text-center ${themeStyles.shadow}`}>
          <div className="text-4xl mb-4">🌅</div>
          <h3 className="text-3xl font-bold mb-4">Day {dayTransitionData.prevDay} Complete</h3>

          {gameState.selectedMode === 'ai' && (
            <div className="space-y-3 mb-6">
              <div className={`${themeStyles.border} border rounded-lg p-3`}>
                <div className="text-sm opacity-75 mb-1">Your Earnings</div>
                <div className="text-2xl font-bold text-green-400">${dayTransitionData.playerEarned.toLocaleString()}</div>
              </div>
              <div className={`${themeStyles.border} border rounded-lg p-3`}>
                <div className="text-sm opacity-75 mb-1">AI Earnings</div>
                <div className="text-2xl font-bold text-pink-400">${dayTransitionData.aiEarned.toLocaleString()}</div>
              </div>
            </div>
          )}

          <div className="text-xl mb-6">Starting Day {dayTransitionData.newDay}...</div>

          <button
            onClick={() => updateUiState({ showDayTransition: false })}
            className={`${themeStyles.button} text-white px-6 py-3 rounded-lg font-bold w-full`}
          >
            Continue
          </button>
        </div>
      </div>
    );
  };

  // AI Stats Modal
  const renderAiStatsModal = () => {
    if (!uiState.showAiStats || gameState.selectedMode !== 'ai') return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className={`${themeStyles.card} ${themeStyles.border} border rounded-xl p-6 max-w-2xl w-full`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">🤖 AI Opponent Stats</h3>
            <button
              onClick={() => updateUiState({ showAiStats: false })}
              className={`${themeStyles.buttonSecondary} px-3 py-1 rounded`}
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-4">
            <div className={`${themeStyles.border} border rounded-lg p-4`}>
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-4xl">{aiPlayer.character.avatar}</span>
                <div>
                  <div className="font-bold text-lg">{aiPlayer.name}</div>
                  <div className="text-sm opacity-75">{aiPlayer.character.name}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="opacity-75">Money</div>
                  <div className="font-bold text-green-500">${aiPlayer.money}</div>
                </div>
                <div>
                  <div className="opacity-75">Net Worth</div>
                  <div className="font-bold text-blue-500">${getAiNetWorth}</div>
                </div>
                <div>
                  <div className="opacity-75">Level</div>
                  <div className="font-bold">{aiPlayer.level}</div>
                </div>
                <div>
                  <div className="opacity-75">Inventory</div>
                  <div className="font-bold">{aiPlayer.inventory.length}/{MAX_INVENTORY} items</div>
                </div>
                <div>
                  <div className="opacity-75">Current Region</div>
                  <div className="font-bold">{REGIONS[aiPlayer.currentRegion].name}</div>
                </div>
                <div>
                  <div className="opacity-75">Challenges Won</div>
                  <div className="font-bold">{aiPlayer.challengesCompleted.length}</div>
                </div>
                <div>
                  <div className="opacity-75">Regions Visited</div>
                  <div className="font-bold">{aiPlayer.visitedRegions.length}/8</div>
                </div>
                <div>
                  <div className="opacity-75">Win Streak</div>
                  <div className="font-bold">{aiPlayer.consecutiveWins} 🔥</div>
                </div>
              </div>
            </div>
            
            <div className={`${themeStyles.border} border rounded-lg p-4`}>
              <h4 className="font-bold mb-2">Stats</h4>
              <div className="grid grid-cols-4 gap-3 text-center text-sm">
                <div>
                  <div className="opacity-75">STR</div>
                  <div className="text-lg font-bold">{aiPlayer.stats.strength}</div>
                </div>
                <div>
                  <div className="opacity-75">CHA</div>
                  <div className="text-lg font-bold">{aiPlayer.stats.charisma}</div>
                </div>
                <div>
                  <div className="opacity-75">LCK</div>
                  <div className="text-lg font-bold">{aiPlayer.stats.luck}</div>
                </div>
                <div>
                  <div className="opacity-75">INT</div>
                  <div className="text-lg font-bold">{aiPlayer.stats.intelligence}</div>
                </div>
              </div>
            </div>
            
            <div className={`${themeStyles.border} border rounded-lg p-4`}>
              <h4 className="font-bold mb-2">Difficulty: {AI_DIFFICULTY_PROFILES[gameState.aiDifficulty].name}</h4>
              <p className="text-sm opacity-75">
                {AI_DIFFICULTY_PROFILES[gameState.aiDifficulty].description}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Progress Dashboard Modal (keeping existing, adding AI comparison)
  const renderProgressDashboard = () => {
    if (!uiState.showProgress) return null;
    
    const totalRegions = Object.keys(REGIONS).length;
    const visitedCount = player.visitedRegions.length;
    const regionsProgress = (visitedCount / totalRegions) * 100;
    
    const totalChallenges = Object.values(REGIONS).reduce(
      (sum, region: any) => sum + region.challenges.length,
      0
    );
    const completedCount = player.challengesCompleted.length;
    const challengesProgress = (completedCount / totalChallenges) * 100;
    
    const playerScore = calculateFinalScore(player);
    const aiScore = gameState.selectedMode === 'ai' ? calculateFinalScore(aiPlayer) : 0;
    const scoreComparison = playerScore - aiScore;
    
    const daysRemaining = 30 - gameState.day;
    const timeProgress = (gameState.day / 30) * 100;
    
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-hidden"
        onClick={() => updateUiState({ showProgress: false })}
      >
        <div
          className={`${themeStyles.card} ${themeStyles.border} border rounded-xl max-w-4xl w-full h-[90vh] flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fixed Header */}
          <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-700">
            <h3 className="text-2xl font-bold">📊 Progress Dashboard</h3>
            <button
              onClick={() => updateUiState({ showProgress: false })}
              className={`${themeStyles.buttonSecondary} px-3 py-1 rounded`}
            >
              ✕
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-scroll p-6 pt-4" style={{ maxHeight: 'calc(90vh - 180px)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Time Progress */}
            <div className={`${themeStyles.border} border rounded-lg p-4`}>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold">⏰ Time</h4>
                <span className="text-sm">Day {gameState.day} / 30</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
                <div
                  className="bg-blue-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${timeProgress}%` }}
                />
              </div>
              <div className="text-sm text-center">
                {daysRemaining} days remaining
              </div>
            </div>
            
            {/* Net Worth */}
            <div className={`${themeStyles.border} border rounded-lg p-4`}>
              <h4 className="font-bold mb-2">💎 Net Worth</h4>
              <div className="text-3xl font-bold text-green-500 mb-2">
                ${getNetWorth.toLocaleString()}
              </div>
              <div className="text-sm space-y-1">
                <div>Cash: ${player.money.toLocaleString()}</div>
                <div>Inventory: ${getInventoryValue.toLocaleString()}</div>
              </div>
            </div>
            
            {/* Regions Explored */}
            <div className={`${themeStyles.border} border rounded-lg p-4`}>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold">🗺️ Regions</h4>
                <span className="text-sm">{visitedCount} / {totalRegions}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
                <div
                  className="bg-purple-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${regionsProgress}%` }}
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.keys(REGIONS).map(region => (
                  <span
                    key={region}
                    className={`text-xs px-2 py-1 rounded ${
                      player.visitedRegions.includes(region)
                        ? 'bg-purple-600'
                        : 'bg-gray-700'
                    }`}
                  >
                    {region}
                  </span>
                ))}
              </div>
            </div>
            
            {/* Challenges Completed */}
            <div className={`${themeStyles.border} border rounded-lg p-4`}>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold">🎯 Challenges</h4>
                <span className="text-sm">{completedCount} / {totalChallenges}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
                <div
                  className="bg-yellow-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${challengesProgress}%` }}
                />
              </div>
              <div className="text-sm">
                Win streak: {player.consecutiveWins} 🔥
              </div>
            </div>
            
            {/* AI Comparison */}
            {gameState.selectedMode === 'ai' && (
              <div className={`${themeStyles.border} border rounded-lg p-4 md:col-span-2`}>
                <h4 className="font-bold mb-3">⚔️ VS {aiPlayer.name}</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm opacity-75 mb-1">Your Score</div>
                    <div className="text-2xl font-bold text-green-500">
                      {playerScore}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm opacity-75 mb-1">AI Score</div>
                    <div className="text-2xl font-bold text-pink-500">
                      {aiScore}
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-center">
                  {scoreComparison > 0 ? (
                    <div className="text-green-500">
                      ✅ Leading by {scoreComparison} points!
                    </div>
                  ) : scoreComparison < 0 ? (
                    <div className="text-red-500">
                      ⚠️ Behind by {Math.abs(scoreComparison)} points
                    </div>
                  ) : (
                    <div className="text-yellow-500">
                      🤝 Tied!
                    </div>
                  )}
                </div>
                <button
                  onClick={() => updateUiState({ showAiStats: true, showProgress: false })}
                  className={`${themeStyles.ai} text-white px-4 py-2 rounded-lg w-full mt-3 text-sm`}
                >
                  View AI Stats
                </button>
              </div>
            )}
            
            {/* Personal Records */}
            <div className={`${themeStyles.border} border rounded-lg p-4 md:col-span-2`}>
              <h4 className="font-bold mb-3">🏆 Personal Records</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div>
                  <div className="opacity-75">Highest Challenge Win</div>
                  <div className="font-bold text-lg">
                    ${personalRecords.highestChallenge}
                  </div>
                </div>
                <div>
                  <div className="opacity-75">Most Valuable Sale</div>
                  <div className="font-bold text-lg">
                    ${personalRecords.mostExpensiveResourceSold.price}
                  </div>
                  {personalRecords.mostExpensiveResourceSold.resource && (
                    <div className="text-xs opacity-75">
                      ({personalRecords.mostExpensiveResourceSold.resource})
                    </div>
                  )}
                </div>
                <div>
                  <div className="opacity-75">Best Win Streak</div>
                  <div className="font-bold text-lg">
                    {personalRecords.consecutiveWins} 🔥
                  </div>
                </div>
                <div>
                  <div className="opacity-75">Peak Money</div>
                  <div className="font-bold text-lg">
                    ${personalRecords.maxMoney.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="opacity-75">Total Earned</div>
                  <div className="font-bold text-lg">
                    ${personalRecords.totalEarned.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="opacity-75">Current Level</div>
                  <div className="font-bold text-lg">
                    Level {player.level}
                  </div>
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="p-6 pt-4 border-t border-gray-700">
            <button onClick={() => updateUiState({ showProgress: false })} className={`${themeStyles.button} text-white px-6 py-3 rounded-lg w-full font-bold`}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  // [Continue with remaining render functions - Menu, Game, etc. - keeping existing implementations]
  // Due to length constraints, I'll include the key changes and mention that other render functions remain the same

  // Menu Screen with AI Mode Option
  const renderMenu = () => {
    return (
      <div className={`min-h-screen ${themeStyles.background} ${themeStyles.text} flex items-center justify-center p-6`}>
        <div className={`${themeStyles.card} ${themeStyles.border} border rounded-xl p-8 max-w-lg w-full text-center ${themeStyles.shadow}`}>
          <h1 className="text-5xl font-bold mb-2">🦘</h1>
          <h1 className="text-4xl font-bold mb-4">Aussie Adventure</h1>
          <p className="mb-6 opacity-75">Explore Australia, take on challenges, and become the ultimate adventurer!</p>
          
          {/* Character Selection */}
          <div className="mb-6">
            <h3 className="font-bold mb-3 text-lg">Choose Your Character</h3>
            <div className="grid grid-cols-2 gap-3">
              {CHARACTERS.map((char, index) => (
                <button
                  key={index}
                  onClick={() => updateUiState({ selectedCharacter: index })}
                  className={`${themeStyles.border} border-2 rounded-lg p-4 transition-all ${
                    uiState.selectedCharacter === index
                      ? 'border-blue-500 bg-blue-500 bg-opacity-20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <div className="text-4xl mb-2">{char.avatar}</div>
                  <div className="font-bold">{char.name}</div>
                  <div className="text-xs opacity-75 mt-1">{char.ability}</div>
                  <div className="text-xs mt-1">${char.startingMoney}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Player Name Input */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Enter your name"
              value={uiState.playerName}
              onChange={(e) => updateUiState({ playerName: e.target.value })}
              className={`${themeStyles.card} ${themeStyles.border} border rounded-lg px-4 py-2 w-full`}
            />
          </div>
          
          {/* Game Mode Selection */}
          <div className="space-y-3">
            <button
              onClick={() => {
                dispatchPlayer({
                  type: 'RESET_PLAYER',
                  payload: {
                    characterIndex: uiState.selectedCharacter,
                    name: uiState.playerName || "Player"
                  }
                });
                dispatchGameState({ type: 'SET_SELECTED_MODE', payload: 'single' });
                dispatchGameState({ type: 'SET_GAME_MODE', payload: 'game' });
                dispatchGameState({ type: 'SET_TURN', payload: 'player' });
                dispatchGameState({ type: 'RESET_GAME' });
                addNotification('Welcome to Australia! 🦘', 'info', true);
                addNotification('Press ? for keyboard shortcuts', 'info', true);
              }}
              className={`${themeStyles.button} text-white px-6 py-3 rounded-lg w-full font-bold`}
            >
              🎮 Single Player Mode
            </button>
            
            <button
              onClick={() => updateUiState({ showCampaignSelect: true })}
              className={`${themeStyles.accent} text-white px-6 py-3 rounded-lg w-full font-bold`}
            >
              🤖 AI Opponent Mode
            </button>
            <button
              onClick={() => updateUiState({ showSaveLoadModal: true })}
              className={`${themeStyles.buttonSecondary} px-6 py-3 rounded-lg w-full font-bold`}
            >
              💾 Save / Load Game
            </button>
          </div>
          
          {/* Theme Toggle */}
          <button
            onClick={() => updateUiState({ theme: uiState.theme === "dark" ? "light" : "dark" })}
            className={`${themeStyles.buttonSecondary} px-4 py-2 rounded-lg mt-6`}
          >
            {uiState.theme === "dark" ? "☀️" : "🌙"} Toggle Theme
          </button>
        </div>
      </div>
    );
  };

  // Campaign/AI Difficulty Selection
  const renderCampaignSelect = () => {
    if (!uiState.showCampaignSelect) return null;
    
    return (
      <div className={`min-h-screen ${themeStyles.background} ${themeStyles.text} flex items-center justify-center p-6`}>
        <div className={`${themeStyles.card} ${themeStyles.border} border rounded-xl p-8 max-w-2xl w-full ${themeStyles.shadow}`}>
          <h2 className="text-3xl font-bold mb-6 text-center">🤖 Select AI Difficulty</h2>
          
          <div className="space-y-4">
            {Object.entries(AI_DIFFICULTY_PROFILES).map(([key, profile]) => (
              <button
                key={key}
                onClick={() => {
                  const aiCharIndex = Math.floor(Math.random() * CHARACTERS.length);
                  const aiChar = CHARACTERS[aiCharIndex];
                  
                  dispatchPlayer({
                    type: 'RESET_PLAYER',
                    payload: {
                      characterIndex: uiState.selectedCharacter,
                      name: uiState.playerName || "Player"
                    }
                  });
                  
                  setAiPlayer({
                    money: aiChar.startingMoney,
                    currentRegion: "QLD",
                    inventory: [],
                    visitedRegions: ["QLD"],
                    challengesCompleted: [],
                    character: aiChar,
                    level: 1,
                    xp: 0,
                    stats: { ...aiChar.startingStats },
                    consecutiveWins: 0,
                    specialAbilityUses: aiChar.specialAbility.usesLeft,
                    masteryUnlocks: [],
                    name: `${aiChar.name} AI`,
                    actionsUsedThisTurn: 0
                  });
                  
                  dispatchGameState({ type: 'SET_SELECTED_MODE', payload: 'ai' });
                  dispatchGameState({ type: 'SET_AI_DIFFICULTY', payload: key });
                  dispatchGameState({ type: 'SET_TURN', payload: 'player' });
                  dispatchGameState({ type: 'SET_GAME_MODE', payload: 'game' });
                  dispatchGameState({ type: 'RESET_GAME' });
                  updateUiState({ showCampaignSelect: false });
                  addNotification(`AI Battle started! Difficulty: ${profile.name}`, 'ai', true);
                  addNotification('Press ? for keyboard shortcuts', 'info', true);
                }}
                className={`${themeStyles.border} border rounded-lg p-6 w-full text-left hover:border-blue-500 transition-all`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-bold text-lg mb-2">{profile.name}</div>
                    <p className="text-sm opacity-75 mb-2">{profile.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs opacity-75">
                      <div>Decision Quality: {Math.round(profile.decisionQuality * 100)}%</div>
                      <div>Risk Tolerance: {Math.round(profile.riskTolerance * 100)}%</div>
                      <div>Planning Depth: Level {profile.planningDepth}</div>
                      <div>Mistake Rate: {Math.round(profile.mistakeChance * 100)}%</div>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded text-sm ml-4 ${
                    key === 'easy' ? 'bg-green-600' :
                    key === 'medium' ? 'bg-yellow-600' :
                    key === 'hard' ? 'bg-red-600' :
                    'bg-purple-600'
                  }`}>
                    {profile.name.toUpperCase()}
                  </div>
                </div>
              </button>
            ))}
          </div>
          
          <button
            onClick={() => updateUiState({ showCampaignSelect: false })}
            className={`${themeStyles.buttonSecondary} px-6 py-2 rounded-lg w-full mt-6`}
          >
            Back
          </button>
        </div>
      </div>
    );
  };

  // Main Game Screen (keeping existing with minor additions)
  const renderGame = () => {
    const currentRegion = REGIONS[player.currentRegion];
    const adjacentRegions = ADJACENT_REGIONS[player.currentRegion] || [];
    const isPlayerTurn = gameState.currentTurn === 'player';
    
    return (
      <div className={`min-h-screen ${themeStyles.background} ${themeStyles.text} p-4`}>
        {/* Notification Bar */}
        {renderNotificationBar()}
        
        {/* Turn Indicator */}
        {renderTurnIndicator()}

        {/* Day Transition Screen */}
        {renderDayTransitionScreen()}

        {/* Quick Actions Bar - only show on player turn */}
        {isPlayerTurn && getQuickActions.length > 0 && uiState.quickActionsOpen && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
            <div className={`${themeStyles.card} ${themeStyles.border} border rounded-xl p-3 ${themeStyles.shadow}`}>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold opacity-75 mr-2">Quick Actions:</span>
                {getQuickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    disabled={!isPlayerTurn}
                    className={`${themeStyles.button} text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:scale-105 transform transition-all disabled:opacity-50`}
                  >
                    <span>{action.icon}</span>
                    <span className="text-sm">{action.label}</span>
                    <kbd className="ml-2 px-2 py-0.5 bg-black bg-opacity-30 rounded text-xs">
                      {action.hotkey}
                    </kbd>
                  </button>
                ))}
                <button
                  onClick={() => updateUiState({ quickActionsOpen: false })}
                  className={`${themeStyles.buttonSecondary} px-2 py-2 rounded ml-2`}
                  title="Hide quick actions"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Top Status Bar */}
        <div className={`${themeStyles.card} ${themeStyles.border} border rounded-xl p-4 mb-4 ${themeStyles.shadow}`}>
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center space-x-4">
              <div>
                <div className="text-sm opacity-75">Player</div>
                <div className="font-bold">{player.name}</div>
              </div>
              <div>
                <div className="text-sm opacity-75">Money</div>
                <div className="font-bold text-green-500">${player.money}</div>
              </div>
              <div>
                <div className="text-sm opacity-75">Net Worth</div>
                <div className="font-bold text-blue-500">${getNetWorth}</div>
              </div>
              <div>
                <div className="text-sm opacity-75">Level</div>
                <div className="font-bold text-purple-500">{player.level}</div>
              </div>
              {gameState.selectedMode === 'ai' && (
                <>
                  <div className="border-l border-gray-600 h-10 mx-2"></div>
                  <div>
                    <div className="text-sm opacity-75">AI Money</div>
                    <div className="font-bold text-pink-500">${aiPlayer.money}</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-75">AI Level</div>
                    <div className="font-bold text-pink-500">{aiPlayer.level}</div>
                  </div>
                  <button
                    onClick={() => updateUiState({ showAiStats: true })}
                    className={`${themeStyles.ai} text-white px-3 py-1 rounded text-sm`}
                  >
                    AI Stats
                  </button>
                </>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div>
                <div className="text-sm opacity-75">Day</div>
                <div className="font-bold">{gameState.day} / {gameSettings.totalDays}</div>
              </div>
              <div>
                <div className="text-sm opacity-75">
                  {gameState.currentTurn === 'player' ? 'Your Actions' : 'AI Actions'}
                </div>
                <div className="font-bold">
                  {gameState.currentTurn === 'player' ? (
                    <>
                      {player.actionsUsedThisTurn} / {gameSettings.playerActionsPerDay}
                      {player.actionsUsedThisTurn > gameSettings.playerActionsPerDay && ' ⚡'}
                    </>
                  ) : (
                    <>
                      {aiPlayer.actionsUsedThisTurn} / {gameSettings.aiActionsPerDay}
                    </>
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm opacity-75">Season</div>
                <div className="font-bold">{gameState.season}</div>
              </div>
              <div>
                <div className="text-sm opacity-75">Weather</div>
                <div className="font-bold">{gameState.weather}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons Bar */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => updateUiState({ showSaveLoadModal: true })}
            className={`${themeStyles.buttonSecondary} px-4 py-2 rounded-lg flex items-center space-x-2`}
          >
            <span>💾</span>
            <span>Save / Load</span>
            <kbd className="ml-2 px-2 py-0.5 bg-black bg-opacity-30 rounded text-xs">Ctrl+S</kbd>
          </button>
          <button
            onClick={() => updateUiState({ showChallenges: true })}
            disabled={!isPlayerTurn}
            className={`${themeStyles.button} text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50`}
          >
            <span>🎯</span>
            <span>Challenges</span>
            <kbd className="ml-2 px-2 py-0.5 bg-black bg-opacity-30 rounded text-xs">C</kbd>
          </button>
          
          <button
            onClick={() => updateUiState({ showTravelModal: true })}
            disabled={!isPlayerTurn}
            className={`${themeStyles.button} text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50`}
          >
            <span>✈️</span>
            <span>Travel</span>
            <kbd className="ml-2 px-2 py-0.5 bg-black bg-opacity-30 rounded text-xs">T</kbd>
          </button>
          
          <button
            onClick={() => updateUiState({ showMarket: true })}
            disabled={!isPlayerTurn}
            className={`${themeStyles.button} text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50`}
          >
            <span>💰</span>
            <span>Market ({player.inventory.length}/{MAX_INVENTORY})</span>
            <kbd className="ml-2 px-2 py-0.5 bg-black bg-opacity-30 rounded text-xs">R</kbd>
          </button>
          
          <button
            onClick={() => updateUiState({ showProgress: true })}
            className={`${themeStyles.accent} text-white px-4 py-2 rounded-lg flex items-center space-x-2`}
          >
            <span>📊</span>
            <span>Progress</span>
            <kbd className="ml-2 px-2 py-0.5 bg-black bg-opacity-30 rounded text-xs">P</kbd>
          </button>
          
          <button
            onClick={() => updateUiState({ showNotifications: true })}
            className={`${themeStyles.buttonSecondary} px-4 py-2 rounded-lg flex items-center space-x-2 relative`}
          >
            <span>📜</span>
            <span>History</span>
            <kbd className="ml-2 px-2 py-0.5 bg-black bg-opacity-30 rounded text-xs">N</kbd>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => updateUiState({ showHelp: true })}
            className={`${themeStyles.buttonSecondary} px-4 py-2 rounded-lg`}
          >
            <span>❓</span>
          </button>
          
          <button
            onClick={() => updateUiState({ showSettings: true })}
            className={`${themeStyles.buttonSecondary} px-4 py-2 rounded-lg`}
          >
            <span>⚙️</span>
          </button>
          
          <div className="flex-1"></div>
          
          <button
            onClick={handleEndTurn}
            disabled={!isPlayerTurn || gameState.day >= 30}
            className={`${themeStyles.button} text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 flex items-center space-x-2`}
          >
            <span>⏭️</span>
            <span>End Turn</span>
            <kbd className="ml-2 px-2 py-0.5 bg-black bg-opacity-30 rounded text-xs">Space</kbd>
          </button>
        </div>
        
        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Current Region Info */}
          <div className={`${themeStyles.card} ${themeStyles.border} border rounded-xl p-6 ${themeStyles.shadow}`}>
            <h3 className="text-2xl font-bold mb-3">📍 {currentRegion.name}</h3>
            <p className="text-sm opacity-75 mb-4">{currentRegion.description}</p>
            
            <div className="mb-4">
              <div className="text-sm font-bold mb-2">💡 Fun Fact</div>
              <p className="text-sm opacity-75">{currentRegion.funFact}</p>
            </div>
            
            <div className="mb-4">
              <div className="text-sm font-bold mb-2">📦 Resources</div>
              <div className="flex flex-wrap gap-2">
                {REGIONAL_RESOURCES[player.currentRegion]?.map((resource, index) => (
                  <span key={index} className={`${themeStyles.border} border rounded px-2 py-1 text-xs`}>
                    {resource}
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <div className="text-sm font-bold mb-2">✈️ Adjacent Regions</div>
              <div className="space-y-2">
                {adjacentRegions.map(regionCode => {
                  const cost = calculateTravelCost(player.currentRegion, regionCode);
                  return (
                    <button
                      key={regionCode}
                      onClick={() => travelToRegion(regionCode)}
                      disabled={player.money < cost || !isPlayerTurn}
                      className={`${themeStyles.border} border rounded px-3 py-2 text-sm w-full text-left hover:border-blue-500 disabled:opacity-50 transition-all`}
                    >
                      <div className="flex justify-between">
                        <span>{REGIONS[regionCode].name}</span>
                        <span>${cost}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Middle Column - Map */}
          {uiState.showMap && (
            <div className={`${themeStyles.card} ${themeStyles.border} border rounded-xl p-6 ${themeStyles.shadow} lg:col-span-2`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">🗺️ Australia Map</h3>
                <button
                  onClick={() => updateUiState({ showMap: false })}
                  className={`${themeStyles.buttonSecondary} px-3 py-1 rounded text-sm`}
                >
                  Hide Map
                </button>
              </div>
              
              <div className="relative w-full h-96 bg-gray-800 rounded-lg overflow-hidden">
                {Object.entries(REGIONS).map(([code, region]: [string, any]) => {
                  const isPlayerHere = player.currentRegion === code;
                  const isAiHere = gameState.selectedMode === 'ai' && aiPlayer.currentRegion === code;
                  const isPlayerVisited = player.visitedRegions.includes(code);
                  const isAdjacent = adjacentRegions.includes(code);
                  
                  return (
                    <div
                      key={code}
                      className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all hover:scale-110 ${
                        isPlayerHere || isAiHere ? 'z-20' : 'z-10'
                      }`}
                      style={{
                        left: `${region.position.x}%`,
                        top: `${region.position.y}%`,
                      }}
                      onClick={() => {
                        if (isPlayerTurn && (isAdjacent || code === "TAS")) {
                          travelToRegion(code);
                        }
                      }}
                    >
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-sm border-4 ${
                          isPlayerHere
                            ? 'border-green-500 bg-green-500 text-white animate-pulse'
                            : isAiHere
                            ? 'border-pink-500 bg-pink-500 text-white animate-pulse'
                            : isPlayerVisited
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-gray-600 bg-gray-700 text-gray-400'
                        } ${themeStyles.shadow}`}
                      >
                        {code}
                      </div>
                      {isPlayerHere && (
                        <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap bg-green-500 text-white px-2 py-1 rounded font-bold">
                          You
                        </div>
                      )}
                      {isAiHere && (
                        <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 text-xs whitespace-nowrap bg-pink-500 text-white px-2 py-1 rounded font-bold">
                          AI
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-4 flex justify-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span>You</span>
                </div>
                {gameState.selectedMode === 'ai' && (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-pink-500 rounded-full"></div>
                    <span>AI</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span>Visited</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-700 rounded-full"></div>
                  <span>Unvisited</span>
                </div>
              </div>
            </div>
          )}
          
          {!uiState.showMap && (
            <div className={`${themeStyles.card} ${themeStyles.border} border rounded-xl p-6 ${themeStyles.shadow} lg:col-span-2 flex items-center justify-center`}>
              <button
                onClick={() => updateUiState({ showMap: true })}
                className={`${themeStyles.button} text-white px-6 py-3 rounded-lg flex items-center space-x-2`}
              >
                <span>🗺️</span>
                <span>Show Map</span>
                <kbd className="ml-2 px-2 py-0.5 bg-black bg-opacity-30 rounded text-xs">M</kbd>
              </button>
            </div>
          )}
        </div>
        
        {/* Player Stats Row */}
        <div className={`${themeStyles.card} ${themeStyles.border} border rounded-xl p-4 mt-4 ${themeStyles.shadow}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-sm opacity-75">Strength</div>
              <div className="text-2xl font-bold">{player.stats.strength}</div>
            </div>
            <div>
              <div className="text-sm opacity-75">Charisma</div>
              <div className="text-2xl font-bold">{player.stats.charisma}</div>
            </div>
            <div>
              <div className="text-sm opacity-75">Luck</div>
              <div className="text-2xl font-bold">{player.stats.luck}</div>
            </div>
            <div>
              <div className="text-sm opacity-75">Intelligence</div>
              <div className="text-2xl font-bold">{player.stats.intelligence}</div>
            </div>
          </div>
          
          {/* XP Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Level {player.level}</span>
              <span>{player.xp} / {player.level * 100} XP</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(player.xp / (player.level * 100)) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Modals */}
        {renderAiStatsModal()}
        {renderProgressDashboard()}
        {renderHelpModal()}
        {renderSettingsModal()}
        {renderEndGameModesModal()}
        {renderConfirmationDialog()}
        {renderNotificationHistory()}
        
        {/* Travel Modal */}
        {uiState.showTravelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${themeStyles.card} ${themeStyles.border} border rounded-xl p-6 max-w-2xl w-full max-h-96 overflow-y-auto`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">✈️ Travel</h3>
                <button
                  onClick={() => updateUiState({ showTravelModal: false })}
                  className={`${themeStyles.buttonSecondary} px-3 py-1 rounded`}
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                {Object.entries(REGIONS).map(([code, region]: [string, any]) => {
                  if (code === player.currentRegion) return null;
                  
                  const cost = calculateTravelCost(player.currentRegion, code);
                  const canAfford = player.money >= cost;
                  const isAdjacent = adjacentRegions.includes(code);
                  
                  return (
                    <div key={code} className={`${themeStyles.border} border rounded-lg p-4`}>
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-bold">{region.name}</div>
                          <div className="text-sm opacity-75">
                            {isAdjacent ? '📍 Adjacent' : code === 'TAS' ? '🏝️ Island' : '📍 Distant'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${canAfford ? 'text-green-500' : 'text-red-500'}`}>
                            ${cost}
                          </div>
                          <button
                            onClick={() => travelToRegion(code)}
                            disabled={!canAfford || !isPlayerTurn}
                            className={`${themeStyles.button} text-white px-3 py-1 rounded mt-1 disabled:opacity-50 text-sm`}
                          >
                            Travel
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {/* Challenges Modal */}
        {uiState.showChallenges && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${themeStyles.card} ${themeStyles.border} border rounded-xl p-6 max-w-2xl w-full max-h-96 overflow-y-auto`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">🎯 Challenges in {currentRegion.name}</h3>
                <button
                  onClick={() => updateUiState({ showChallenges: false })}
                  className={`${themeStyles.buttonSecondary} px-3 py-1 rounded`}
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                {currentRegion.challenges.map((challenge: any, index: number) => {
                  const isCompleted = player.challengesCompleted.includes(challenge.name);
                  const successChance = calculateSuccessChance(challenge);
                  const maxWager = Math.min(player.money, 500);
                  
                  return (
                    <div key={index} className={`${themeStyles.border} border rounded-lg p-4 ${isCompleted ? 'opacity-50' : ''}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-bold">{challenge.name}</div>
                          <div className="text-sm opacity-75">{challenge.type} challenge</div>
                          <div className="text-sm">Success: {Math.round(successChance * 100)}%</div>
                          {isCompleted && <div className="text-sm text-green-500">✅ Completed</div>}
                        </div>
                        <div className="text-right">
                          <div className="text-sm">Difficulty: {challenge.difficulty}/3</div>
                          <div className="text-sm">Reward: {challenge.reward}x</div>
                        </div>
                      </div>
                      
                      {!isCompleted && (
                        <>
                          <div className="flex items-center space-x-2 mb-2">
                            <input
                              type="range"
                              min="50"
                              max={maxWager}
                              value={uiState.wagerAmount}
                              onChange={(e) => updateUiState({ wagerAmount: parseInt(e.target.value) })}
                              className="flex-1"
                            />
                            <span className="text-sm font-bold">${uiState.wagerAmount}</span>
                          </div>
                          
                          <button
                            onClick={() => takeChallenge(challenge, uiState.wagerAmount)}
                            disabled={player.money < uiState.wagerAmount || !isPlayerTurn}
                            className={`${themeStyles.button} text-white px-4 py-2 rounded-lg w-full disabled:opacity-50`}
                          >
                            Take Challenge (Wager ${uiState.wagerAmount})
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        
        {/* Market Modal */}
        {uiState.showMarket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${themeStyles.card} ${themeStyles.border} border rounded-xl p-6 max-w-2xl w-full max-h-96 overflow-y-auto`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">💰 Resource Market</h3>
                <button
                  onClick={() => updateUiState({ showMarket: false })}
                  className={`${themeStyles.buttonSecondary} px-3 py-1 rounded`}
                >
                  ✕
                </button>
              </div>
              
              {/* Market Trend Display */}
              <div className={`${themeStyles.border} border rounded-lg p-3 mb-4`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Market Trend:</span>
                  <span className={`font-bold ${
                    gameState.marketTrend === 'rising' ? 'text-green-500' :
                    gameState.marketTrend === 'falling' ? 'text-red-500' :
                    gameState.marketTrend === 'volatile' ? 'text-yellow-500' :
                    'text-blue-500'
                  }`}>
                    {gameState.marketTrend === 'rising' ? '📈 Rising' :
                     gameState.marketTrend === 'falling' ? '📉 Falling' :
                     gameState.marketTrend === 'volatile' ? '⚡ Volatile' :
                     '➡️ Stable'}
                  </span>
                </div>
              </div>
              
              {player.inventory.length === 0 ? (
                <div className="text-center py-8 opacity-60">
                  No resources to sell. Collect some resources first!
                </div>
              ) : (
                <div className="space-y-3">
                  {Array.from(new Set(player.inventory)).map(resource => {
                    const count = player.inventory.filter(item => item === resource).length;
                    const price = gameState.resourcePrices[resource] || 100;
                    
                    return (
                      <div key={resource} className={`${themeStyles.border} border rounded-lg p-4`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-bold">{resource}</div>
                            <div className="text-sm opacity-75">Owned: {count}</div>
                            <div className="text-xs opacity-75 mt-1">
                              Category: {RESOURCE_CATEGORIES[resource] || 'unknown'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-500">${price} each</div>
                            <div className="text-xs opacity-75 mb-2">
                              Total: ${price * count}
                            </div>
                            <button
                              onClick={() => sellResource(resource, price)}
                              disabled={!isPlayerTurn}
                              className={`${themeStyles.accent} text-white px-4 py-1 rounded text-sm disabled:opacity-50`}
                            >
                              Sell One
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // [Additional helper render functions like renderHelpModal, renderConfirmationDialog, renderNotificationHistory - keeping existing implementations]
  
  // Keyboard Shortcuts Help Modal
  const renderHelpModal = () => {
    if (!uiState.showHelp) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className={`${themeStyles.card} ${themeStyles.border} border rounded-xl p-6 max-w-2xl w-full`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">⌨️ Keyboard Shortcuts</h3>
            <button
              onClick={() => updateUiState({ showHelp: false })}
              className={`${themeStyles.buttonSecondary} px-3 py-1 rounded`}
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(KEYBOARD_SHORTCUTS).map(([key, shortcut]) => (
              <div key={key} className={`${themeStyles.border} border rounded p-3`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold">{shortcut.label}</div>
                    <div className="text-sm opacity-75">{shortcut.description}</div>
                  </div>
                  <kbd className="px-3 py-1 bg-gray-700 rounded text-sm font-mono">
                    {key === ' ' ? 'Space' : key.toUpperCase()}
                  </kbd>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-sm opacity-75 text-center">
            Press any key while focused on the game to use shortcuts
          </div>
        </div>
      </div>
    );
  };

  // Confirmation Dialog Component
  const renderConfirmationDialog = () => {
    if (!confirmationDialog.isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
        <div className={`${themeStyles.card} ${themeStyles.border} border rounded-xl p-6 max-w-md w-full ${themeStyles.shadow}`}>
          <h3 className="text-xl font-bold mb-3">{confirmationDialog.title}</h3>
          <p className="mb-6">{confirmationDialog.message}</p>
          
          {/* Show relevant data */}
          {confirmationDialog.data && confirmationDialog.type === 'travel' && (
            <div className={`${themeStyles.border} border rounded p-3 mb-4 text-sm`}>
              <div className="flex justify-between mb-1">
                <span>Destination:</span>
                <span className="font-bold">{REGIONS[confirmationDialog.data.region]?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Cost:</span>
                <span className="font-bold text-red-500">${confirmationDialog.data.cost}</span>
              </div>
            </div>
          )}
          
          {confirmationDialog.data && confirmationDialog.type === 'challenge' && (
            <div className={`${themeStyles.border} border rounded p-3 mb-4 text-sm`}>
              <div className="flex justify-between mb-1">
                <span>Success Chance:</span>
                <span className={`font-bold ${confirmationDialog.data.successChance >= 0.5 ? 'text-green-500' : 'text-red-500'}`}>
                  {Math.round(confirmationDialog.data.successChance * 100)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Wager:</span>
                <span className="font-bold text-yellow-500">${confirmationDialog.data.wager}</span>
              </div>
            </div>
          )}
          
          <div className="flex space-x-3">
            <button
              onClick={handleConfirm}
              className={`${themeStyles.button} text-white px-6 py-2 rounded-lg flex-1 font-bold`}
            >
              {confirmationDialog.confirmText}
            </button>
            <button
              onClick={closeConfirmation}
              className={`${themeStyles.buttonSecondary} px-6 py-2 rounded-lg flex-1`}
            >
              Cancel
            </button>
          </div>
          
          {/* Don't ask again option */}
          {confirmationDialog.type && (
            <label className="flex items-center space-x-2 mt-4 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={dontAskAgain[confirmationDialog.type as keyof typeof dontAskAgain]}
                onChange={(e) => {
                  setDontAskAgain(prev => ({
                    ...prev,
                    [confirmationDialog.type as string]: e.target.checked
                  }));
                }}
                className="form-checkbox"
              />
              <span className="opacity-75">Don't ask me again</span>
            </label>
          )}
        </div>
      </div>
    );
  };

  // Notification History Modal
  const renderNotificationHistory = () => {
    if (!uiState.showNotifications) return null;
    
    const filteredNotifications = notifications.filter(n => 
      uiState.notificationFilter === 'all' || n.type === uiState.notificationFilter
    );
    
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-hidden"
        onClick={() => updateUiState({ showNotifications: false })}
      >
        <div
          className={`${themeStyles.card} ${themeStyles.border} border rounded-xl max-w-3xl w-full h-[90vh] flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fixed Header */}
          <div className="p-6 pb-4 border-b border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">📜 Notification History</h3>
              <button
                onClick={() => updateUiState({ showNotifications: false })}
                className={`${themeStyles.buttonSecondary} px-3 py-1 rounded`}
              >
                ✕
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
            <button
              onClick={() => updateUiState({ notificationFilter: 'all' })}
              className={`px-3 py-1 rounded text-sm ${
                uiState.notificationFilter === 'all' 
                  ? themeStyles.button 
                  : themeStyles.buttonSecondary
              }`}
            >
              All ({notifications.length})
            </button>
            {Object.entries(NOTIFICATION_TYPES).map(([type, config]) => {
              const count = notifications.filter(n => n.type === type).length;
              if (count === 0) return null;
              return (
                <button
                  key={type}
                  onClick={() => updateUiState({ notificationFilter: type })}
                  className={`px-3 py-1 rounded text-sm flex items-center space-x-1 ${
                    uiState.notificationFilter === type 
                      ? themeStyles.button 
                      : themeStyles.buttonSecondary
                  }`}
                >
                  <span>{config.icon}</span>
                  <span>({count})</span>
                </button>
              );
            })}
            </div>

            {/* Clear all button */}
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className={`${themeStyles.error} text-white px-4 py-2 rounded mt-3 text-sm w-full`}
              >
                Clear All
              </button>
            )}
          </div>

          {/* Scrollable Notifications List */}
          <div className="flex-1 overflow-y-scroll p-6 pt-4" style={{ maxHeight: 'calc(90vh - 280px)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' }}>
            <div className="space-y-2">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8 opacity-60">
                No notifications yet
              </div>
            ) : (
              filteredNotifications.reverse().map(notification => {
                const notifType = NOTIFICATION_TYPES[notification.type];
                return (
                  <div
                    key={notification.id}
                    className={`${themeStyles.border} border-l-4 rounded p-3 ${
                      notification.read ? 'opacity-60' : ''
                    }`}
                    style={{ borderLeftColor: notifType.color }}
                  >
                    <div className="flex items-start space-x-3">
                      <span className="text-xl">{notifType.icon}</span>
                      <div className="flex-1">
                        <div className="text-xs opacity-75 mb-1">
                          {notifType.label} • Day {notification.day} • {
                            new Date(notification.timestamp).toLocaleTimeString()
                          }
                        </div>
                        <div className="text-sm">{notification.message}</div>
                      </div>
                      {notification.persistent && (
                        <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded">
                          Important
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={notificationEndRef} />
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="p-6 pt-4 border-t border-gray-700">
            <button onClick={() => updateUiState({ showNotifications: false })} className={`${themeStyles.button} text-white px-6 py-3 rounded-lg w-full font-bold`}>Close</button>
          </div>
        </div>
      </div>
    );
  };

  // Game Over Screen
  const renderGameOver = () => {
    const playerScore = calculateFinalScore(player);
    const aiScore = gameState.selectedMode === 'ai' ? calculateFinalScore(aiPlayer) : 0;
    const won = gameState.selectedMode === 'ai' ? playerScore > aiScore : true;
    
    return (
      <div className={`min-h-screen ${themeStyles.background} ${themeStyles.text} flex items-center justify-center p-6`}>
        <div className={`${themeStyles.card} ${themeStyles.border} border rounded-xl p-8 max-w-md w-full text-center ${themeStyles.shadow}`}>
          <div className="text-6xl mb-4">{won ? '🏆' : '😔'}</div>
          <h2 className="text-3xl font-bold mb-4">{won ? 'Victory!' : 'Defeat'}</h2>
          
          <div className="space-y-2 mb-6">
            <div className="flex justify-between">
              <span>Your Score:</span>
              <span className="font-bold">{playerScore}</span>
            </div>
            {gameState.selectedMode === 'ai' && (
              <div className="flex justify-between">
                <span>{aiPlayer.name}:</span>
                <span className="font-bold">{aiScore}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Net Worth:</span>
              <span className="font-bold text-green-500">${getNetWorth}</span>
            </div>
            <div className="flex justify-between">
              <span>Regions Explored:</span>
              <span className="font-bold">{player.visitedRegions.length}/8</span>
            </div>
            <div className="flex justify-between">
              <span>Challenges Won:</span>
              <span className="font-bold">{player.challengesCompleted.length}</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                dispatchGameState({ type: 'SET_GAME_MODE', payload: 'menu' });
                dispatchPlayer({
                  type: 'RESET_PLAYER',
                  payload: { 
                    characterIndex: uiState.selectedCharacter, 
                    name: uiState.playerName 
                  }
                });
                setAiPlayer({
                  money: 1000,
                  currentRegion: "QLD",
                  inventory: [],
                  visitedRegions: ["QLD"],
                  challengesCompleted: [],
                  character: CHARACTERS[1],
                  level: 1,
                  xp: 0,
                  stats: { strength: 2, charisma: 4, luck: 3, intelligence: 6 },
                  consecutiveWins: 0,
                  specialAbilityUses: 1,
                  masteryUnlocks: [],
                  name: "AI Opponent",
                  actionsUsedThisTurn: 0
                });
                setNotifications([]);
                setPersonalRecords({
                  highestChallenge: 0,
                  mostExpensiveResourceSold: { resource: '', price: 0 },
                  consecutiveWins: 0,
                  maxMoney: 1000,
                  fastestChallengeWin: Infinity,
                  totalEarned: 0
                });
              }}
              className={`${themeStyles.button} text-white px-6 py-3 rounded-lg w-full font-bold`}
            >
              Return to Menu
            </button>
          </div>
        </div>
      </div>
    );
  };

  // =========================================
  // MAIN RENDER
  // =========================================

  return (
    <div className="font-sans">
      {gameState.gameMode === "menu" && renderMenu()}
      {uiState.showCampaignSelect && renderCampaignSelect()}
      {gameState.gameMode === "game" && renderGame()}
      {gameState.gameMode === "end" && renderGameOver()}
      {renderSaveLoadModal()}
      {renderLoadPreviewModal()}
      <input
        type="file"
        accept="application/json"
        ref={fileInputRef}
        onChange={handleLoadFileChange}
        className="hidden"
      />
    </div>
  );
}

export default AustraliaGame;
