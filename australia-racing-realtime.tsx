import { useState, useEffect, useCallback, useRef } from 'react';
import { Plane, Trophy, DollarSign, Timer, MapPin, Zap, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

// =========================================
// TYPE DEFINITIONS
// =========================================

interface Challenge {
  name: string;
  multiplier: number;
  duration: number; // seconds
  baseSuccessChance: number;
}

interface RegionData {
  name: string;
  position: { x: number; y: number };
  challenges: Challenge[];
  startingRegion?: boolean;
  island?: boolean;
}

interface RegionState {
  controller: 'player' | 'ai' | null;
  playerDeposit: number;
  aiDeposit: number;
  welcomeBonusAvailable: boolean;
  playerVisited: boolean;
  aiVisited: boolean;
}

interface PlayerState {
  budget: number;
  currentRegion: string;
  isBusy: boolean;
  isTraveling: boolean;
  currentActivity: string | null;
  travelDestination: string | null;
  travelProgress: number;
  visitedRegions: string[];
}

interface GameState {
  day: number;
  timeRemaining: number; // seconds
  gameStatus: 'active' | 'ended';
  winner: 'player' | 'ai' | 'tie' | null;
}

interface ActivityLog {
  timestamp: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  player: 'player' | 'ai';
}

interface Flight {
  from: string;
  to: string;
  cost: number;
  duration: number;
}

// =========================================
// GAME DATA
// =========================================

const REGIONS: Record<string, RegionData> = {
  QLD: {
    name: "Queensland",
    startingRegion: true,
    position: { x: 80, y: 30 },
    challenges: [
      { name: "Taste Test Aussie Foods", multiplier: 1.5, duration: 3, baseSuccessChance: 0.7 },
      { name: "Surf at Gold Coast", multiplier: 2.0, duration: 6, baseSuccessChance: 0.5 },
      { name: "Great Barrier Reef Tour", multiplier: 2.5, duration: 9, baseSuccessChance: 0.4 },
      { name: "Crocodile Dundee Challenge", multiplier: 3.0, duration: 12, baseSuccessChance: 0.3 },
    ]
  },
  NSW: {
    name: "New South Wales",
    startingRegion: true,
    position: { x: 80, y: 65 },
    challenges: [
      { name: "Opera House Photo Challenge", multiplier: 1.5, duration: 3, baseSuccessChance: 0.7 },
      { name: "Make Rock Carving", multiplier: 2.0, duration: 9, baseSuccessChance: 0.5 },
      { name: "Score AFL Goal", multiplier: 2.0, duration: 6, baseSuccessChance: 0.4 },
      { name: "Win Carnival Game", multiplier: 3.0, duration: 12, baseSuccessChance: 0.3 },
    ]
  },
  VIC: {
    name: "Victoria",
    position: { x: 65, y: 85 },
    challenges: [
      { name: "Melbourne Coffee Taste Test", multiplier: 1.5, duration: 3, baseSuccessChance: 0.65 },
      { name: "Great Ocean Road Challenge", multiplier: 2.0, duration: 9, baseSuccessChance: 0.5 },
      { name: "AFL Kick Accuracy", multiplier: 2.5, duration: 6, baseSuccessChance: 0.4 },
      { name: "Wine Barrel Rolling Race", multiplier: 3.0, duration: 12, baseSuccessChance: 0.25 },
    ]
  },
  TAS: {
    name: "Tasmania",
    island: true,
    position: { x: 75, y: 100 },
    challenges: [
      { name: "Read Signal Flags", multiplier: 2.0, duration: 9, baseSuccessChance: 0.5 },
      { name: "Create Kelp Basket", multiplier: 2.0, duration: 10, baseSuccessChance: 0.5 },
      { name: "Throw Shrimp on Barbie (100 tries)", multiplier: 4.0, duration: 18, baseSuccessChance: 0.25 },
      { name: "Cut Tim Tam Without Knife", multiplier: 2.0, duration: 6, baseSuccessChance: 0.4 },
    ]
  },
  SA: {
    name: "South Australia",
    position: { x: 45, y: 75 },
    challenges: [
      { name: "Barossa Wine Identification", multiplier: 1.7, duration: 5, baseSuccessChance: 0.6 },
      { name: "Adelaide Market Haggling", multiplier: 1.5, duration: 4, baseSuccessChance: 0.7 },
      { name: "Opal Mining Challenge", multiplier: 2.5, duration: 10, baseSuccessChance: 0.4 },
      { name: "Great White Shark Cage Dive", multiplier: 3.2, duration: 15, baseSuccessChance: 0.3 },
    ]
  },
  WA: {
    name: "Western Australia",
    position: { x: 15, y: 55 },
    challenges: [
      { name: "Pinnacles Desert Navigation", multiplier: 2.0, duration: 8, baseSuccessChance: 0.5 },
      { name: "Whale Shark Spotting", multiplier: 3.0, duration: 12, baseSuccessChance: 0.3 },
      { name: "Margaret River Surf", multiplier: 2.3, duration: 7, baseSuccessChance: 0.45 },
      { name: "Find Pink Lake Hillier", multiplier: 2.5, duration: 10, baseSuccessChance: 0.35 },
    ]
  },
  NT: {
    name: "Northern Territory",
    position: { x: 45, y: 35 },
    challenges: [
      { name: "Uluru Sunrise Photo", multiplier: 2.2, duration: 8, baseSuccessChance: 0.5 },
      { name: "Crocodile Spotting", multiplier: 2.0, duration: 7, baseSuccessChance: 0.5 },
      { name: "Kakadu Survival Challenge", multiplier: 2.8, duration: 14, baseSuccessChance: 0.35 },
      { name: "Didgeridoo Playing Contest", multiplier: 2.0, duration: 6, baseSuccessChance: 0.45 },
    ]
  },
  ACT: {
    name: "Australian Capital Territory",
    position: { x: 75, y: 70 },
    challenges: [
      { name: "Parliament House Tour Quiz", multiplier: 1.5, duration: 5, baseSuccessChance: 0.65 },
      { name: "National Museum Scavenger Hunt", multiplier: 2.0, duration: 8, baseSuccessChance: 0.5 },
      { name: "Hot Air Balloon Navigation", multiplier: 2.5, duration: 10, baseSuccessChance: 0.4 },
      { name: "War Memorial History Challenge", multiplier: 1.8, duration: 6, baseSuccessChance: 0.55 },
    ]
  },
};

const FLIGHT_COSTS: Record<string, Record<string, number>> = {
  QLD: { NSW: 180, VIC: 280, TAS: 350, SA: 320, WA: 450, NT: 220, ACT: 200 },
  NSW: { QLD: 180, VIC: 150, TAS: 250, SA: 280, WA: 500, NT: 350, ACT: 50 },
  VIC: { QLD: 280, NSW: 150, TAS: 180, SA: 200, WA: 480, NT: 420, ACT: 120 },
  TAS: { QLD: 350, NSW: 250, VIC: 180, SA: 280, WA: 650, NT: 520, ACT: 230 },
  SA: { QLD: 320, NSW: 280, VIC: 200, TAS: 280, WA: 350, NT: 280, ACT: 250 },
  WA: { QLD: 450, NSW: 500, VIC: 480, TAS: 650, SA: 350, NT: 380, ACT: 520 },
  NT: { QLD: 220, NSW: 350, VIC: 420, TAS: 520, SA: 280, WA: 380, ACT: 370 },
  ACT: { QLD: 200, NSW: 50, VIC: 120, TAS: 230, SA: 250, WA: 520, NT: 370 },
};

const FLIGHT_DURATIONS: Record<string, Record<string, number>> = {
  QLD: { NSW: 9, VIC: 18, TAS: 21, SA: 18, WA: 30, NT: 12, ACT: 10 },
  NSW: { QLD: 9, VIC: 9, TAS: 15, SA: 18, WA: 32, NT: 20, ACT: 3 },
  VIC: { QLD: 18, NSW: 9, TAS: 10, SA: 12, WA: 30, NT: 25, ACT: 7 },
  TAS: { QLD: 21, NSW: 15, VIC: 10, SA: 16, WA: 35, NT: 28, ACT: 14 },
  SA: { QLD: 18, NSW: 18, VIC: 12, TAS: 16, WA: 20, NT: 18, ACT: 16 },
  WA: { QLD: 30, NSW: 32, VIC: 30, TAS: 35, SA: 20, NT: 22, ACT: 32 },
  NT: { QLD: 12, NSW: 20, VIC: 25, TAS: 28, SA: 18, WA: 22, ACT: 22 },
  ACT: { QLD: 10, NSW: 3, VIC: 7, TAS: 14, SA: 16, WA: 32, NT: 22 },
};

// =========================================
// MAIN GAME COMPONENT
// =========================================

export default function AustraliaRacingGame() {
  // Core state
  const [playerState, setPlayerState] = useState<PlayerState>({
    budget: 1000,
    currentRegion: 'NSW',
    isBusy: false,
    isTraveling: false,
    currentActivity: null,
    travelDestination: null,
    travelProgress: 0,
    visitedRegions: ['NSW'],
  });

  const [aiState, setAiState] = useState<PlayerState>({
    budget: 1000,
    currentRegion: 'QLD',
    isBusy: false,
    isTraveling: false,
    currentActivity: null,
    travelDestination: null,
    travelProgress: 0,
    visitedRegions: ['QLD'],
  });

  const [regions, setRegions] = useState<Record<string, RegionState>>(() => {
    const initial: Record<string, RegionState> = {};
    Object.keys(REGIONS).forEach(key => {
      initial[key] = {
        controller: null,
        playerDeposit: 0,
        aiDeposit: 0,
        welcomeBonusAvailable: true,
        playerVisited: key === 'NSW',
        aiVisited: key === 'QLD',
      };
    });
    return initial;
  });

  const [gameState, setGameState] = useState<GameState>({
    day: 1,
    timeRemaining: 180, // 3 minutes per day for demo (900 for 15 min)
    gameStatus: 'active',
    winner: null,
  });

  const [activityLog, setActivityLog] = useState<ActivityLog[]>([
    { timestamp: Date.now(), message: "🎮 Game started! Race to control Australia!", type: 'info', player: 'player' },
    { timestamp: Date.now() + 1, message: "💰 Starting budget: $1,000", type: 'info', player: 'player' },
    { timestamp: Date.now() + 2, message: "🏁 Day 1 begins - Good luck!", type: 'success', player: 'player' },
  ]);

  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [showTravelModal, setShowTravelModal] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [recentEvents, setRecentEvents] = useState<Record<string, { type: 'stolen' | 'claimed' | 'threat'; timestamp: number }>>({});
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error'; visible: boolean }>({ message: '', type: 'success', visible: false });

  const activityFeedRef = useRef<HTMLDivElement>(null);

  const aiIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const gameStartTime = useRef<number>(Date.now());
  const aiActionLockRef = useRef<boolean>(false);
  const gameStatusRef = useRef<'active' | 'ended'>(gameState.gameStatus);
  const aiStateRef = useRef(aiState);
  const regionsRef = useRef(regions);
  const gameStateRef = useRef(gameState);

  // AI SOPHISTICATION: Track action history for strategic diversity
  const aiActionHistory = useRef<Array<{
    type: 'challenge' | 'travel' | 'deposit';
    timestamp: number;
    challengeName?: string;
    region?: string;
    wager?: number;
  }>>([]);
  const aiLastChallengesByRegion = useRef<Record<string, string>>({});
  const aiConsecutiveActionTypes = useRef<string[]>([]);
  const aiLastActionTimestamp = useRef<number>(0);

  // =========================================
  // UTILITY FUNCTIONS
  // =========================================

  const addLog = useCallback((message: string, type: ActivityLog['type'], player: 'player' | 'ai') => {
    setActivityLog(prev => [...prev, { timestamp: Date.now(), message, type, player }].slice(-20));
    // Auto-scroll to bottom after adding new log
    setTimeout(() => {
      if (activityFeedRef.current) {
        activityFeedRef.current.scrollTop = 0; // Scroll to top since we reverse the array
      }
    }, 100);
  }, []);

  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  const getRegionsControlled = useCallback((player: 'player' | 'ai'): string[] => {
    return Object.keys(regions).filter(regionKey => regions[regionKey].controller === player);
  }, [regions]);

  // =========================================
  // SMART DEFAULT VALUE CALCULATIONS
  // =========================================

  const calculateSmartWager = useCallback((challenge: Challenge): number => {
    const budget = playerState.budget;
    const day = gameState.day;

    // Base percentage based on game phase
    let basePercentage = 0.15; // 15% default
    if (day === 1) basePercentage = 0.10; // Conservative early game
    else if (day === 2) basePercentage = 0.15;
    else if (day === 3) basePercentage = 0.20; // More aggressive
    else if (day === 4) basePercentage = 0.25; // Very aggressive endgame

    // Adjust by challenge success rate (bet more on safer challenges)
    const safetyFactor = challenge.baseSuccessChance;
    basePercentage *= (0.8 + safetyFactor * 0.4); // 80-120% based on safety

    // Calculate base wager
    let wager = Math.floor(budget * basePercentage);

    // Bounds
    const minWager = Math.min(50, budget);
    const maxWager = Math.floor(budget * 0.4); // Max 40% of budget

    return Math.max(minWager, Math.min(maxWager, wager));
  }, [playerState.budget, gameState.day]);

  const calculateSmartDeposit = useCallback((regionKey: string): number => {
    const region = regions[regionKey];
    const budget = playerState.budget;

    // If AI controls, calculate amount to steal
    if (region.controller === 'ai') {
      const amountToSteal = region.aiDeposit - region.playerDeposit + 50;
      return Math.min(amountToSteal, Math.floor(budget * 0.4));
    }

    // If player controls, suggest defense amount
    if (region.controller === 'player') {
      return Math.min(Math.floor(region.playerDeposit * 0.3), Math.floor(budget * 0.2));
    }

    // If unclaimed, suggest claim amount
    return Math.min(150, Math.floor(budget * 0.25));
  }, [regions, playerState.budget]);

  // =========================================
  // REFS SYNC (Keep refs updated)
  // =========================================

  useEffect(() => {
    gameStatusRef.current = gameState.gameStatus;
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    aiStateRef.current = aiState;
  }, [aiState]);

  useEffect(() => {
    regionsRef.current = regions;
  }, [regions]);

  // =========================================
  // VISUAL ALERTS & EVENTS CLEANUP
  // =========================================

  useEffect(() => {
    // Clean up old events after 3 seconds
    const cleanup = setInterval(() => {
      const now = Date.now();
      setRecentEvents(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(key => {
          if (now - updated[key].timestamp > 3000) {
            delete updated[key];
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(cleanup);
  }, []);

  // =========================================
  // KEYBOARD SHORTCUTS
  // =========================================

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if typing in input field
      if (e.target instanceof HTMLInputElement) return;

      // Don't trigger if player is busy or game ended
      if (gameState.gameStatus !== 'active') return;

      const key = e.key.toLowerCase();

      // ESC - Close all modals
      if (key === 'escape') {
        setShowChallengeModal(false);
        setShowTravelModal(false);
        setShowDepositModal(false);
        setSelectedChallenge(null);
        setSelectedRegion(null);
        return;
      }

      // Don't allow other shortcuts if player is busy
      if (playerState.isBusy || playerState.isTraveling) return;

      // C - Open Challenges
      if (key === 'c') {
        setShowChallengeModal(true);
        setShowTravelModal(false);
        setShowDepositModal(false);
      }

      // T - Open Travel
      if (key === 't') {
        setShowTravelModal(true);
        setShowChallengeModal(false);
        setShowDepositModal(false);
      }

      // D - Open Deposit
      if (key === 'd') {
        setShowDepositModal(true);
        setShowChallengeModal(false);
        setShowTravelModal(false);
      }

      // 1-4 - Select challenge in modal
      if (showChallengeModal && ['1', '2', '3', '4'].includes(key)) {
        const index = parseInt(key) - 1;
        const challenges = REGIONS[playerState.currentRegion].challenges;
        if (challenges[index]) {
          setSelectedChallenge(challenges[index]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.gameStatus, playerState.isBusy, playerState.isTraveling, playerState.currentRegion, showChallengeModal]);

  // =========================================
  // DAY TIMER (AUTO-ADVANCE)
  // =========================================

  useEffect(() => {
    if (gameState.gameStatus !== 'active') return;

    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timeRemaining <= 1) {
          // Day ended
          if (prev.day >= 4) {
            // Game over
            const playerRegions = getRegionsControlled('player').length;
            const aiRegions = getRegionsControlled('ai').length;
            let winner: 'player' | 'ai' | 'tie' = 'tie';

            if (playerRegions > aiRegions) winner = 'player';
            else if (aiRegions > playerRegions) winner = 'ai';

            addLog(`🏁 GAME OVER! Final Score - You: ${playerRegions} regions, AI: ${aiRegions} regions`, 'success', 'player');
            setShowGameOverModal(true);

            return { ...prev, gameStatus: 'ended', winner, timeRemaining: 0 };
          } else {
            // Advance day
            addLog(`📅 Day ${prev.day + 1} begins!`, 'info', 'player');
            return { ...prev, day: prev.day + 1, timeRemaining: 180 }; // Reset timer
          }
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.gameStatus, gameState.day, addLog, getRegionsControlled]);

  // =========================================
  // PLAYER ACTIONS
  // =========================================

  const handlePlayerChallenge = async (challenge: Challenge, wager: number) => {
    if (playerState.isBusy || playerState.isTraveling) {
      alert("You're currently busy!");
      return;
    }

    if (wager > playerState.budget) {
      alert("Insufficient budget!");
      return;
    }

    setPlayerState(prev => ({
      ...prev,
      isBusy: true,
      currentActivity: `Attempting ${challenge.name}...`,
    }));

    addLog(`🎯 Started "${challenge.name}" (wagered $${wager})`, 'info', 'player');
    setShowChallengeModal(false);

    // Simulate challenge duration
    await delay(challenge.duration * 1000);

    const success = Math.random() < challenge.baseSuccessChance;

    if (success) {
      const winnings = Math.floor(wager * challenge.multiplier);
      const profit = winnings - wager;
      setPlayerState(prev => ({
        ...prev,
        budget: prev.budget + winnings,
        isBusy: false,
        currentActivity: null,
      }));
      addLog(`✅ Completed "${challenge.name}"! Won $${winnings} (profit: $${profit})`, 'success', 'player');
      showNotification(`🎉 Challenge Success! +$${profit} profit`, 'success');
    } else {
      setPlayerState(prev => ({
        ...prev,
        budget: prev.budget - wager,
        isBusy: false,
        currentActivity: null,
      }));
      addLog(`❌ Failed "${challenge.name}". Lost $${wager}`, 'error', 'player');
      showNotification(`💔 Challenge Failed! -$${wager}`, 'error');
    }
  };

  const handlePlayerTravel = async (destination: string, cost: number, duration: number) => {
    if (playerState.isBusy || playerState.isTraveling) {
      alert("You're currently busy!");
      return;
    }

    if (cost > playerState.budget) {
      alert("Insufficient budget for this flight!");
      return;
    }

    setPlayerState(prev => ({
      ...prev,
      budget: prev.budget - cost,
      isTraveling: true,
      travelDestination: destination,
      travelProgress: 0,
    }));

    addLog(`✈️ Flying to ${REGIONS[destination].name}... (${duration}s)`, 'info', 'player');
    setShowTravelModal(false);

    // Animate travel progress
    const startTime = Date.now();
    const endTime = startTime + (duration * 1000);

    const progressInterval = setInterval(() => {
      const now = Date.now();
      const progress = Math.min(100, ((now - startTime) / (duration * 1000)) * 100);
      setPlayerState(prev => ({ ...prev, travelProgress: progress }));

      if (now >= endTime) {
        clearInterval(progressInterval);
      }
    }, 100);

    // Wait for travel to complete
    await delay(duration * 1000);

    // Check for welcome bonus
    const bonusAwarded = regions[destination].welcomeBonusAvailable;
    let bonusAmount = 0;

    if (bonusAwarded) {
      bonusAmount = 750;
      setRegions(prev => ({
        ...prev,
        [destination]: { ...prev[destination], welcomeBonusAvailable: false },
      }));
      addLog(`✅ Claimed welcome bonus! +$${bonusAmount}`, 'success', 'player');
    }

    setPlayerState(prev => ({
      ...prev,
      currentRegion: destination,
      isTraveling: false,
      travelDestination: null,
      travelProgress: 0,
      budget: prev.budget + bonusAmount,
      visitedRegions: prev.visitedRegions.includes(destination)
        ? prev.visitedRegions
        : [...prev.visitedRegions, destination],
    }));

    setRegions(prev => ({
      ...prev,
      [destination]: { ...prev[destination], playerVisited: true },
    }));

    addLog(`📍 Arrived in ${REGIONS[destination].name}${bonusAwarded ? ' (bonus claimed!)' : ''}`, 'success', 'player');
  };

  const handlePlayerDeposit = (amount: number) => {
    if (amount > playerState.budget) {
      alert("Insufficient budget!");
      return;
    }

    if (amount <= 0) {
      alert("Please enter a valid amount!");
      return;
    }

    const region = playerState.currentRegion;
    const newPlayerDeposit = regions[region].playerDeposit + amount;
    const aiDeposit = regions[region].aiDeposit;

    setPlayerState(prev => ({
      ...prev,
      budget: prev.budget - amount,
    }));

    const wasControlled = regions[region].controller;
    const newController = newPlayerDeposit > aiDeposit ? 'player' : (aiDeposit > newPlayerDeposit ? 'ai' : null);

    setRegions(prev => ({
      ...prev,
      [region]: {
        ...prev[region],
        playerDeposit: newPlayerDeposit,
        controller: newController,
      },
    }));

    if (wasControlled !== newController && newController === 'player') {
      addLog(`🏆 You now control ${REGIONS[region].name}! ($${newPlayerDeposit} deposited)`, 'success', 'player');
      setRecentEvents(prev => ({ ...prev, [region]: { type: 'claimed', timestamp: Date.now() } }));
    } else if (wasControlled !== newController && newController === 'ai') {
      addLog(`💰 Deposited $${amount} in ${REGIONS[region].name} (total: $${newPlayerDeposit})`, 'info', 'player');
    } else {
      addLog(`💰 Deposited $${amount} in ${REGIONS[region].name} (total: $${newPlayerDeposit})`, 'info', 'player');
    }

    setShowDepositModal(false);
  };

  // =========================================
  // AI VALIDATION HELPERS
  // =========================================

  const canAfford = useCallback((cost: number): boolean => {
    const currentBudget = aiStateRef.current.budget;
    const reserveFund = Math.max(100, currentBudget * 0.1); // Keep 10% or $100 reserve
    return cost > 0 && cost <= (currentBudget - reserveFund);
  }, []);

  const hasTimeFor = useCallback((duration: number): boolean => {
    const timeLeft = gameStateRef.current.timeRemaining;
    const buffer = 5; // 5 second safety buffer
    return timeLeft >= (duration + buffer);
  }, []);

  const validateBudgetTransaction = useCallback((cost: number): boolean => {
    if (cost <= 0) return false;
    if (cost > aiStateRef.current.budget) return false;
    return true;
  }, []);

  const revalidateRegionState = useCallback((regionKey: string) => {
    const currentRegions = regionsRef.current;
    if (!currentRegions[regionKey]) return null;
    return currentRegions[regionKey];
  }, []);

  // =========================================
  // AI STRATEGIC INTELLIGENCE SYSTEM
  // =========================================

  // Detect game phase for strategic adjustment
  const getGamePhase = useCallback((): 'early' | 'mid' | 'late' | 'endgame' => {
    const day = gameStateRef.current.day;
    const timeRemaining = gameStateRef.current.timeRemaining;

    if (day === 1 && timeRemaining > 120) return 'early';
    if (day <= 2) return 'mid';
    if (day === 3 || (day === 4 && timeRemaining > 60)) return 'late';
    return 'endgame';
  }, []);

  // Calculate score differential for strategy adjustment
  const getScoreDifferential = useCallback((): number => {
    const currentRegions = regionsRef.current;
    const playerRegions = Object.keys(currentRegions).filter(k => currentRegions[k].controller === 'player').length;
    const aiRegions = Object.keys(currentRegions).filter(k => currentRegions[k].controller === 'ai').length;
    return aiRegions - playerRegions; // Positive = AI winning, Negative = AI losing
  }, []);

  // Calculate risk tolerance based on game state
  const getRiskTolerance = useCallback((): number => {
    const phase = getGamePhase();
    const scoreDiff = getScoreDifferential();
    const budgetRatio = aiStateRef.current.budget / 1000; // Relative to starting budget

    // Base risk tolerance
    let risk = 0.5;

    // Adjust by phase
    if (phase === 'early') risk = 0.3; // Conservative early
    else if (phase === 'mid') risk = 0.5; // Balanced mid
    else if (phase === 'late') risk = 0.6; // Slightly aggressive late
    else if (phase === 'endgame') risk = 0.8; // Very aggressive endgame

    // Adjust by score (if losing, take more risks)
    if (scoreDiff < -2) risk += 0.3; // Far behind - risky
    else if (scoreDiff < 0) risk += 0.15; // Behind - more risk
    else if (scoreDiff > 2) risk -= 0.2; // Far ahead - conservative
    else if (scoreDiff > 0) risk -= 0.1; // Ahead - slightly conservative

    // Adjust by budget (low budget = more risk to recover)
    if (budgetRatio < 0.5) risk += 0.2;
    else if (budgetRatio > 2) risk -= 0.15;

    return Math.max(0.1, Math.min(0.95, risk)); // Clamp between 0.1 and 0.95
  }, [getGamePhase, getScoreDifferential]);

  // Check if challenge was recently done (cooldown)
  const isChallengeOnCooldown = useCallback((challengeName: string, regionKey: string): boolean => {
    const lastChallenge = aiLastChallengesByRegion.current[regionKey];

    // Prevent doing the same challenge twice in a row in same region
    if (lastChallenge === challengeName) return true;

    // Check recent history (last 3 actions)
    const recentActions = aiActionHistory.current.slice(-3);
    const recentChallengeCount = recentActions.filter(
      a => a.type === 'challenge' && a.challengeName === challengeName
    ).length;

    // Don't spam the same challenge
    if (recentChallengeCount >= 2) return true;

    return false;
  }, []);

  // Check action type diversity (prevent spamming same action type)
  const shouldEnforceDiversity = useCallback((actionType: string): boolean => {
    const recent = aiConsecutiveActionTypes.current;

    // If last 3 actions were all the same type, force diversity
    if (recent.length >= 3) {
      const lastThree = recent.slice(-3);
      if (lastThree.every(t => t === actionType)) {
        return true; // Block this action type
      }
    }

    // If last 2 actions were same type and it's a challenge, enforce diversity
    if (recent.length >= 2 && actionType === 'challenge') {
      const lastTwo = recent.slice(-2);
      if (lastTwo.every(t => t === 'challenge')) {
        return true; // Force travel or deposit
      }
    }

    return false;
  }, []);

  // Calculate sophisticated wager with variation
  const calculateDynamicWager = useCallback((
    challenge: Challenge,
    budget: number,
    phase: 'early' | 'mid' | 'late' | 'endgame'
  ): number => {
    const riskTolerance = getRiskTolerance();

    // Base wager on phase and risk
    let basePercentage = 0.15; // 15% default

    if (phase === 'early') basePercentage = 0.10; // Conservative 10%
    else if (phase === 'mid') basePercentage = 0.20; // Moderate 20%
    else if (phase === 'late') basePercentage = 0.25; // Aggressive 25%
    else if (phase === 'endgame') basePercentage = 0.35; // Very aggressive 35%

    // Adjust by risk tolerance
    basePercentage *= riskTolerance;

    // Adjust by challenge success rate (bet more on safer challenges)
    const safetyFactor = challenge.baseSuccessChance;
    basePercentage *= (0.7 + safetyFactor * 0.6); // Scale between 70-130%

    // Calculate base wager
    let wager = Math.floor(budget * basePercentage);

    // Add random variation (±20%) to prevent predictability
    const variation = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
    wager = Math.floor(wager * variation);

    // Apply bounds
    const minWager = Math.min(50, budget * 0.05);
    const maxWager = Math.min(budget * 0.5, 800); // Never more than 50% or $800

    return Math.max(minWager, Math.min(maxWager, wager));
  }, [getRiskTolerance]);

  // Record action for history tracking
  const recordAiAction = useCallback((
    type: 'challenge' | 'travel' | 'deposit',
    details: { challengeName?: string; region?: string; wager?: number }
  ) => {
    const now = Date.now();

    // Add to history
    aiActionHistory.current.push({
      type,
      timestamp: now,
      ...details
    });

    // Keep only last 20 actions
    if (aiActionHistory.current.length > 20) {
      aiActionHistory.current = aiActionHistory.current.slice(-20);
    }

    // Track consecutive action types
    aiConsecutiveActionTypes.current.push(type);
    if (aiConsecutiveActionTypes.current.length > 5) {
      aiConsecutiveActionTypes.current = aiConsecutiveActionTypes.current.slice(-5);
    }

    // Track last challenge by region
    if (type === 'challenge' && details.challengeName && details.region) {
      aiLastChallengesByRegion.current[details.region] = details.challengeName;
    }

    aiLastActionTimestamp.current = now;
  }, []);

  // Strategic region targeting
  const getRegionStrategicValue = useCallback((regionKey: string): number => {
    const currentRegions = regionsRef.current;
    const region = currentRegions[regionKey];
    const phase = getGamePhase();

    let value = 100; // Base value

    // Value based on control status
    if (region.controller === 'player') {
      value += 300; // High value to steal from player
    } else if (region.controller === null) {
      value += 200; // Good value to claim unclaimed
    } else if (region.controller === 'ai') {
      value += 50; // Some value to strengthen
    }

    // Value based on deposits
    const depositDifference = region.playerDeposit - region.aiDeposit;
    if (depositDifference > 0 && depositDifference < 200) {
      value += 150; // Close race - high priority
    }

    // Visited bonus available?
    if (region.welcomeBonusAvailable) {
      value += 400; // Very high value
    }

    // Phase adjustments
    if (phase === 'early' && region.welcomeBonusAvailable) {
      value += 200; // Prioritize bonuses early
    } else if (phase === 'endgame' && region.controller === 'player') {
      value += 250; // Prioritize stealing in endgame
    }

    return value;
  }, [getGamePhase]);

  // =========================================
  // AI DECISION ENGINE (SOPHISTICATED)
  // =========================================

  const aiTakeAction = useCallback(async () => {
    // CRITICAL FIX #1 & #7: Check action lock to prevent concurrent actions
    if (aiActionLockRef.current) return;
    if (aiStateRef.current.isBusy || aiStateRef.current.isTraveling) return;
    if (gameStatusRef.current !== 'active') return;

    // CRITICAL FIX #7: Set action lock
    aiActionLockRef.current = true;

    try {
      // CRITICAL FIX #4: Use refs for latest state
      const currentAiState = aiStateRef.current;
      const currentRegions = regionsRef.current;
      const currentGameState = gameStateRef.current;

      // SOPHISTICATED AI: Get strategic context
      const gamePhase = getGamePhase();
      const scoreDifferential = getScoreDifferential();
      const riskTolerance = getRiskTolerance();

      // Evaluate all possible actions with sophisticated scoring
      const actions: Array<{
        type: string;
        value: number;
        data: any;
        diversityPenalty: number;
      }> = [];

      // 1. SOPHISTICATED CHALLENGE EVALUATION
      const currentRegionChallenges = REGIONS[currentAiState.currentRegion].challenges;
      currentRegionChallenges.forEach(challenge => {
        // CRITICAL FIX #8: Check time before adding action
        if (!hasTimeFor(challenge.duration)) return;

        // SOPHISTICATION: Check cooldown to prevent repetition
        if (isChallengeOnCooldown(challenge.name, currentAiState.currentRegion)) {
          return; // Skip challenges on cooldown
        }

        // SOPHISTICATION: Dynamic wager calculation
        const dynamicWager = calculateDynamicWager(challenge, currentAiState.budget, gamePhase);

        if (dynamicWager < 50) return; // Skip if wager too small

        // CRITICAL FIX #2: Validate affordability
        if (!canAfford(dynamicWager)) return;

        // SOPHISTICATION: Multi-factor scoring
        const expectedReturn = challenge.multiplier * challenge.baseSuccessChance * dynamicWager;
        const expectedLoss = dynamicWager * (1 - challenge.baseSuccessChance);
        const expectedValue = expectedReturn - expectedLoss;

        // Time efficiency
        const timeEfficiency = expectedValue / challenge.duration;

        // Risk-adjusted value (favor safer challenges when conservative)
        const riskAdjustedValue = timeEfficiency * (0.5 + challenge.baseSuccessChance * 0.5);

        // Phase bonuses
        let phaseBonus = 1.0;
        if (gamePhase === 'early' && challenge.baseSuccessChance > 0.6) phaseBonus = 1.3; // Favor safe early
        if (gamePhase === 'endgame' && challenge.multiplier > 2.5) phaseBonus = 1.4; // Favor high reward late

        // Calculate final value
        const finalValue = riskAdjustedValue * phaseBonus * 100;

        // Diversity penalty
        let diversityPenalty = 0;
        if (shouldEnforceDiversity('challenge')) {
          diversityPenalty = 500; // Heavy penalty to force other action types
        }

        actions.push({
          type: 'challenge',
          value: finalValue,
          data: { challenge, wager: dynamicWager },
          diversityPenalty
        });
      });

      // 2. SOPHISTICATED TRAVEL EVALUATION
      const unvisitedRegions = Object.keys(REGIONS).filter(
        r => r !== currentAiState.currentRegion && !currentAiState.visitedRegions.includes(r)
      );

      unvisitedRegions.forEach(destination => {
        const cost = FLIGHT_COSTS[currentAiState.currentRegion][destination];
        const duration = FLIGHT_DURATIONS[currentAiState.currentRegion][destination];

        // CRITICAL FIX #8: Check time
        if (!hasTimeFor(duration)) return;

        // CRITICAL FIX #2: Validate budget
        if (!validateBudgetTransaction(cost)) return;
        if (!canAfford(cost)) return;

        // SOPHISTICATION: Strategic region targeting
        const strategicValue = getRegionStrategicValue(destination);

        // CRITICAL FIX #5: Use current regions state for bonus check
        const welcomeBonus = currentRegions[destination].welcomeBonusAvailable ? 750 : 0;

        // Multi-factor travel value
        const netGain = welcomeBonus - cost;
        const timeValue = netGain / (duration / 10); // Favor quick trips

        // Combined value with strategic importance
        const travelValue = (timeValue * 0.4) + (strategicValue * 0.6);

        // Phase-based travel priority
        let travelPhaseBonus = 1.0;
        if (gamePhase === 'early') travelPhaseBonus = 1.5; // Prioritize travel early to collect bonuses
        if (gamePhase === 'endgame' && welcomeBonus === 0) travelPhaseBonus = 0.3; // Deprioritize late travel without bonus

        const finalTravelValue = travelValue * travelPhaseBonus;

        // Diversity penalty
        let diversityPenalty = 0;
        if (shouldEnforceDiversity('travel')) {
          diversityPenalty = 500;
        }

        actions.push({
          type: 'travel',
          value: finalTravelValue,
          data: { destination, cost, duration },
          diversityPenalty
        });
      });

      // 3. SOPHISTICATED DEPOSIT EVALUATION
      const currentRegion = currentRegions[currentAiState.currentRegion];
      if (!currentRegion) return; // CRITICAL FIX #4: Validate region exists

      const aiDeposit = currentRegion.aiDeposit;
      const playerDeposit = currentRegion.playerDeposit;

      // Diversity penalty for deposits
      let depositDiversityPenalty = 0;
      if (shouldEnforceDiversity('deposit')) {
        depositDiversityPenalty = 500;
      }

      // SOPHISTICATION: Try to steal player regions
      if (currentRegion.controller === 'player') {
        const amountToSteal = playerDeposit - aiDeposit + 1;
        const maxAffordable = Math.floor(currentAiState.budget * (0.3 + riskTolerance * 0.3)); // Adjust by risk
        const actualAmount = Math.min(amountToSteal + 50, maxAffordable);

        if (actualAmount > 0 && canAfford(actualAmount)) {
          // Higher value in endgame, lower in early game
          let stealValue = 400;
          if (gamePhase === 'endgame') stealValue = 700;
          if (gamePhase === 'early') stealValue = 250;

          // Boost if close race
          if (Math.abs(scoreDifferential) <= 1) stealValue += 200;

          actions.push({
            type: 'deposit',
            value: stealValue,
            data: { amount: actualAmount },
            diversityPenalty: depositDiversityPenalty
          });
        }
      }

      // SOPHISTICATION: Secure uncontrolled regions
      if (currentRegion.controller === null) {
        const maxAffordable = Math.floor(currentAiState.budget * 0.25);
        const baseAmount = Math.min(150, maxAffordable);

        // Vary amount based on phase
        let actualAmount = baseAmount;
        if (gamePhase === 'early') actualAmount = Math.floor(baseAmount * 1.2); // More aggressive early
        if (gamePhase === 'endgame') actualAmount = Math.floor(baseAmount * 0.8); // Less in endgame

        if (actualAmount > 0 && canAfford(actualAmount)) {
          // Value based on strategic importance
          const regionValue = getRegionStrategicValue(currentAiState.currentRegion);
          const depositValue = Math.min(regionValue * 0.5, 500);

          actions.push({
            type: 'deposit',
            value: depositValue,
            data: { amount: actualAmount },
            diversityPenalty: depositDiversityPenalty
          });
        }
      }

      // SOPHISTICATION: Defend regions
      if (currentRegion.controller === 'ai' &&
          playerState.currentRegion === currentAiState.currentRegion &&
          playerState.budget > aiDeposit) {
        const defenseAmount = Math.floor(aiDeposit * 0.4);
        const maxAffordable = Math.floor(currentAiState.budget * 0.35);
        const actualAmount = Math.min(defenseAmount, maxAffordable);

        if (actualAmount > 0 && canAfford(actualAmount)) {
          // High value for defense
          let defenseValue = 550;
          if (gamePhase === 'endgame') defenseValue = 800; // Critical defense in endgame
          if (scoreDifferential > 2) defenseValue = 350; // Lower priority if winning comfortably

          actions.push({
            type: 'deposit',
            value: defenseValue,
            data: { amount: actualAmount },
            diversityPenalty: depositDiversityPenalty
          });
        }
      }

      // SOPHISTICATION: Pick best action with diversity enforcement
      if (actions.length === 0) return;

      // Apply diversity penalties to values
      actions.forEach(action => {
        action.value -= action.diversityPenalty;
      });

      // Sort by adjusted value
      actions.sort((a, b) => b.value - a.value);

      // Find first affordable action
      let bestAction = null;
      for (const action of actions) {
        if (action.type === 'challenge' && canAfford(action.data.wager)) {
          bestAction = action;
          break;
        } else if (action.type === 'travel' && canAfford(action.data.cost)) {
          bestAction = action;
          break;
        } else if (action.type === 'deposit' && canAfford(action.data.amount)) {
          bestAction = action;
          break;
        }
      }

      if (!bestAction) return;

      // Execute action
      if (bestAction.type === 'challenge') {
        const { challenge, wager } = bestAction.data;

        // CRITICAL FIX #2 & #4: Revalidate budget before spending
        if (!validateBudgetTransaction(wager)) {
          addLog(`🤖 AI skipped challenge - insufficient budget`, 'info', 'ai');
          return;
        }

        // CRITICAL FIX #8: Recheck time availability
        if (!hasTimeFor(challenge.duration)) {
          addLog(`🤖 AI skipped challenge - insufficient time`, 'info', 'ai');
          return;
        }

        // SOPHISTICATION: Record action
        recordAiAction('challenge', {
          challengeName: challenge.name,
          region: currentAiState.currentRegion,
          wager
        });

        setAiState(prev => ({
          ...prev,
          isBusy: true,
          currentActivity: `Attempting ${challenge.name}...`,
        }));

        addLog(`🤖 AI attempting "${challenge.name}" ($${wager} wagered)`, 'warning', 'ai');

        await delay(challenge.duration * 1000);

        // CRITICAL FIX #1: Check game still active after delay
        if (gameStatusRef.current !== 'active') {
          setAiState(prev => ({ ...prev, isBusy: false, currentActivity: null }));
          return;
        }

        const success = Math.random() < challenge.baseSuccessChance;

        if (success) {
          const winnings = Math.floor(wager * challenge.multiplier);
          setAiState(prev => ({
            ...prev,
            budget: prev.budget + winnings,
            isBusy: false,
            currentActivity: null,
          }));
          addLog(`🤖 AI completed "${challenge.name}"! Won $${winnings}`, 'warning', 'ai');
        } else {
          setAiState(prev => ({
            ...prev,
            budget: prev.budget - wager,
            isBusy: false,
            currentActivity: null,
          }));
          addLog(`🤖 AI failed "${challenge.name}". Lost $${wager}`, 'info', 'ai');
        }
      } else if (bestAction.type === 'travel') {
        const { destination, cost, duration } = bestAction.data;

        // CRITICAL FIX #2 & #4: Revalidate budget before spending
        if (!validateBudgetTransaction(cost)) {
          addLog(`🤖 AI skipped travel - insufficient budget`, 'info', 'ai');
          return;
        }

        // CRITICAL FIX #8: Recheck time availability
        if (!hasTimeFor(duration)) {
          addLog(`🤖 AI skipped travel - insufficient time`, 'info', 'ai');
          return;
        }

        // SOPHISTICATION: Record action
        recordAiAction('travel', {
          region: destination
        });

        setAiState(prev => ({
          ...prev,
          budget: prev.budget - cost,
          isTraveling: true,
          travelDestination: destination,
          travelProgress: 0,
        }));

        addLog(`🤖 AI flying to ${REGIONS[destination].name}...`, 'warning', 'ai');

        const startTime = Date.now();
        const endTime = startTime + (duration * 1000);

        const progressInterval = setInterval(() => {
          const now = Date.now();
          const progress = Math.min(100, ((now - startTime) / (duration * 1000)) * 100);
          setAiState(prev => ({ ...prev, travelProgress: progress }));

          if (now >= endTime) {
            clearInterval(progressInterval);
          }
        }, 100);

        await delay(duration * 1000);

        // CRITICAL FIX #1: Check game still active after delay
        if (gameStatusRef.current !== 'active') {
          clearInterval(progressInterval);
          setAiState(prev => ({ ...prev, isTraveling: false, travelDestination: null, travelProgress: 0 }));
          return;
        }

        // CRITICAL FIX #5: Revalidate bonus availability
        const currentRegionState = revalidateRegionState(destination);
        const bonusAwarded = currentRegionState?.welcomeBonusAvailable || false;
        let bonusAmount = 0;

        if (bonusAwarded) {
          bonusAmount = 750;
          setRegions(prev => ({
            ...prev,
            [destination]: { ...prev[destination], welcomeBonusAvailable: false },
          }));
          addLog(`⚠️ AI claimed welcome bonus in ${REGIONS[destination].name}! +$${bonusAmount}`, 'warning', 'ai');
        }

        setAiState(prev => ({
          ...prev,
          currentRegion: destination,
          isTraveling: false,
          travelDestination: null,
          travelProgress: 0,
          budget: prev.budget + bonusAmount,
          visitedRegions: prev.visitedRegions.includes(destination)
            ? prev.visitedRegions
            : [...prev.visitedRegions, destination],
        }));

        setRegions(prev => ({
          ...prev,
          [destination]: { ...prev[destination], aiVisited: true },
        }));

        addLog(`🤖 AI arrived in ${REGIONS[destination].name}`, 'warning', 'ai');
      } else if (bestAction.type === 'deposit') {
        const { amount } = bestAction.data;

        // CRITICAL FIX #2 & #4: Revalidate budget before spending
        if (!validateBudgetTransaction(amount)) {
          addLog(`🤖 AI skipped deposit - insufficient budget`, 'info', 'ai');
          return;
        }

        // CRITICAL FIX #4: Use current state refs
        const region = aiStateRef.current.currentRegion;
        const currentRegionState = revalidateRegionState(region);

        if (!currentRegionState) {
          addLog(`🤖 AI skipped deposit - invalid region state`, 'info', 'ai');
          return;
        }

        // SOPHISTICATION: Record action
        recordAiAction('deposit', {
          region
        });

        const newAiDeposit = currentRegionState.aiDeposit + amount;
        const playerDeposit = currentRegionState.playerDeposit;

        setAiState(prev => ({
          ...prev,
          budget: prev.budget - amount,
        }));

        const wasControlled = currentRegionState.controller;
        const newController = newAiDeposit > playerDeposit ? 'ai' : (playerDeposit > newAiDeposit ? 'player' : null);

        setRegions(prev => ({
          ...prev,
          [region]: {
            ...prev[region],
            aiDeposit: newAiDeposit,
            controller: newController,
          },
        }));

        if (wasControlled === 'player' && newController === 'ai') {
          addLog(`⚠️ AI STOLE ${REGIONS[region].name} from you! ($${newAiDeposit} deposited)`, 'error', 'ai');
          setRecentEvents(prev => ({ ...prev, [region]: { type: 'stolen', timestamp: Date.now() } }));
        } else if (wasControlled !== newController && newController === 'ai') {
          addLog(`🤖 AI now controls ${REGIONS[region].name}! ($${newAiDeposit})`, 'warning', 'ai');
          setRecentEvents(prev => ({ ...prev, [region]: { type: 'claimed', timestamp: Date.now() } }));
        } else {
          addLog(`🤖 AI deposited $${amount} in ${REGIONS[region].name}`, 'info', 'ai');
        }
      }
    } catch (error) {
      // CRITICAL FIX #6: Error handling
      console.error('AI action failed:', error);
      addLog(`🤖 AI encountered an error and skipped action`, 'info', 'ai');

      // Reset AI state if stuck
      setAiState(prev => ({
        ...prev,
        isBusy: false,
        isTraveling: false,
        currentActivity: null,
        travelDestination: null,
        travelProgress: 0,
      }));
    } finally {
      // CRITICAL FIX #7: Always release lock
      aiActionLockRef.current = false;
    }
  }, [
    playerState,
    addLog,
    canAfford,
    hasTimeFor,
    validateBudgetTransaction,
    revalidateRegionState,
    getGamePhase,
    getScoreDifferential,
    getRiskTolerance,
    isChallengeOnCooldown,
    shouldEnforceDiversity,
    calculateDynamicWager,
    recordAiAction,
    getRegionStrategicValue
  ]);

  // =========================================
  // AI CONTINUOUS LOOP
  // =========================================

  useEffect(() => {
    // CRITICAL FIX #1: Use ref for game status to avoid stale closure
    if (gameStatusRef.current !== 'active') {
      return;
    }

    // CRITICAL FIX #12: Track if component is mounted for cleanup
    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const runAI = async () => {
      // CRITICAL FIX #1: Check ref instead of closure variable
      while (isMounted && gameStatusRef.current === 'active') {
        // CRITICAL FIX #8: Don't start new action if time is running out
        if (gameStateRef.current.timeRemaining < 10) {
          // Less than 10 seconds left, wait for next day
          await delay(1000);
          continue;
        }

        await aiTakeAction();

        // Random delay between 5-15 seconds for demo
        const delayMs = Math.random() * 10000 + 5000;

        // CRITICAL FIX #12: Use breakable delay for cleanup
        await new Promise<void>((resolve) => {
          timeoutId = setTimeout(() => {
            if (isMounted && gameStatusRef.current === 'active') {
              resolve();
            } else {
              resolve(); // Still resolve to prevent hanging
            }
          }, delayMs);
        });

        // CRITICAL FIX #1: Double-check game status after delay
        if (gameStatusRef.current !== 'active') {
          break;
        }
      }
    };

    runAI();

    // CRITICAL FIX #12: Cleanup function
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Release lock if held during unmount
      aiActionLockRef.current = false;
    };
  }, [aiTakeAction]);

  // =========================================
  // RENDER
  // =========================================

  const playerRegionsControlled = getRegionsControlled('player');
  const aiRegionsControlled = getRegionsControlled('ai');

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-orange-600 flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                Jet Lag: Australia Racing
              </h1>
              <p className="text-sm text-gray-600">Real-time simultaneous racing game</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center bg-orange-100 px-4 py-2 rounded">
                <div className="text-xs text-gray-600">Day</div>
                <div className="text-xl font-bold text-orange-600">{gameState.day} / 4</div>
              </div>
              <div className={`text-center px-4 py-2 rounded transition-colors ${
                gameState.timeRemaining < 20 ? 'bg-red-100 animate-pulse' :
                gameState.timeRemaining < 30 ? 'bg-red-100' :
                gameState.timeRemaining < 60 ? 'bg-yellow-100' :
                'bg-blue-100'
              }`}>
                <div className={`text-xs flex items-center gap-1 ${
                  gameState.timeRemaining < 30 ? 'text-red-600' :
                  gameState.timeRemaining < 60 ? 'text-yellow-700' :
                  'text-gray-600'
                }`}>
                  <Timer className="w-3 h-3" />
                  Time Left
                </div>
                <div className={`text-xl font-bold ${
                  gameState.timeRemaining < 30 ? 'text-red-600' :
                  gameState.timeRemaining < 60 ? 'text-yellow-700' :
                  'text-blue-600'
                }`}>
                  {formatTime(gameState.timeRemaining)}
                  {gameState.timeRemaining <= 10 && gameState.timeRemaining > 0 && (
                    <span className="text-sm ml-2 animate-pulse">⚠️</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - Player Stats */}
          <div className="space-y-4">
            {/* Player Panel */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-bold text-green-600 mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                YOU
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Budget:</span>
                  <span className="text-xl font-bold text-green-600">${playerState.budget}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-semibold">{REGIONS[playerState.currentRegion].name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Regions:</span>
                  <span className="font-bold text-green-600">{playerRegionsControlled.length} / 8</span>
                </div>

                {playerState.currentActivity && (
                  <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                    <div className="text-sm font-semibold text-blue-700">{playerState.currentActivity}</div>
                  </div>
                )}

                {playerState.isTraveling && (
                  <div className="mt-3">
                    <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <Plane className="w-4 h-4" />
                      Flying to {REGIONS[playerState.travelDestination!].name}...
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${playerState.travelProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => setShowChallengeModal(true)}
                  disabled={playerState.isBusy || playerState.isTraveling}
                  className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-semibold transition-colors flex items-center justify-between"
                  title={playerState.isBusy ? 'Busy with challenge' : playerState.isTraveling ? 'Currently traveling' : 'Press C'}
                >
                  <span>🎯 Do Challenge</span>
                  <span className="text-xs opacity-75">C</span>
                </button>
                {(playerState.isBusy || playerState.isTraveling) && (
                  <div className="text-xs text-gray-500 text-center -mt-1">
                    {playerState.isBusy ? '⏳ Busy with challenge...' : '✈️ Currently traveling...'}
                  </div>
                )}
                <button
                  onClick={() => setShowTravelModal(true)}
                  disabled={playerState.isBusy || playerState.isTraveling}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-semibold transition-colors flex items-center justify-between"
                  title={playerState.isBusy ? 'Busy with challenge' : playerState.isTraveling ? 'Currently traveling' : 'Press T'}
                >
                  <span>✈️ Travel</span>
                  <span className="text-xs opacity-75">T</span>
                </button>
                <button
                  onClick={() => setShowDepositModal(true)}
                  disabled={playerState.isBusy || playerState.isTraveling}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-semibold transition-colors flex items-center justify-between"
                  title={playerState.isBusy ? 'Busy with challenge' : playerState.isTraveling ? 'Currently traveling' : 'Press D'}
                >
                  <span>💰 Deposit Money</span>
                  <span className="text-xs opacity-75">D</span>
                </button>
              </div>
            </div>

            {/* AI Panel */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-bold text-red-600 mb-3 flex items-center gap-2">
                🤖 AI OPPONENT
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Budget:</span>
                  <span className="text-xl font-bold text-red-600">${aiState.budget}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-semibold">{REGIONS[aiState.currentRegion].name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Regions:</span>
                  <span className="font-bold text-red-600">{aiRegionsControlled.length} / 8</span>
                </div>

                {aiState.currentActivity && (
                  <div className="mt-3 p-2 bg-orange-50 rounded border border-orange-200">
                    <div className="text-sm font-semibold text-orange-700">{aiState.currentActivity}</div>
                  </div>
                )}

                {aiState.isTraveling && (
                  <div className="mt-3">
                    <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                      <Plane className="w-4 h-4" />
                      Flying to {REGIONS[aiState.travelDestination!].name}...
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${aiState.travelProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {!aiState.isBusy && !aiState.isTraveling && (
                  <div className="mt-3 p-2 bg-gray-50 rounded border border-gray-200">
                    <div className="text-sm text-gray-600">🤔 Thinking...</div>
                  </div>
                )}
              </div>
            </div>

            {/* Region Control Summary */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="font-bold text-gray-700 mb-2">Region Control</h3>
              <div className="space-y-1 text-sm">
                {Object.keys(REGIONS).map(key => {
                  const region = regions[key];
                  const controller = region.controller;

                  return (
                    <div key={key} className="flex justify-between items-center">
                      <span className="text-gray-600">{REGIONS[key].name}:</span>
                      <span className={`font-semibold ${
                        controller === 'player' ? 'text-green-600' :
                        controller === 'ai' ? 'text-red-600' :
                        'text-gray-400'
                      }`}>
                        {controller === 'player' ? '✅ You' :
                         controller === 'ai' ? '🤖 AI' :
                         '⚪ None'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Middle Column - Map */}
          <div className="lg:col-span-2 space-y-4">
            {/* Map */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Australia Map
              </h2>
              <div className="relative w-full h-[500px] bg-gradient-to-br from-blue-100 to-green-100 rounded-lg border-2 border-gray-300">
                {/* Regions */}
                {Object.keys(REGIONS).map(key => {
                  const region = REGIONS[key];
                  const state = regions[key];
                  const isPlayerHere = playerState.currentRegion === key;
                  const isAiHere = aiState.currentRegion === key;
                  const hasRecentEvent = recentEvents[key];
                  const isHovered = hoveredRegion === key;
                  const isBothHere = isPlayerHere && isAiHere;

                  // Check if region is under threat (AI has more budget and is nearby)
                  const isUnderThreat = state.controller === 'player' &&
                                        aiState.budget > state.playerDeposit - state.aiDeposit + 100 &&
                                        (isAiHere || Object.keys(FLIGHT_COSTS[aiState.currentRegion] || {}).includes(key));

                  return (
                    <div
                      key={key}
                      className={`absolute w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-xs transition-all cursor-pointer hover:scale-110 ${
                        state.controller === 'player' ? 'bg-green-400 border-green-600' :
                        state.controller === 'ai' ? 'bg-red-400 border-red-600' :
                        'bg-gray-300 border-gray-500'
                      } ${hasRecentEvent?.type === 'stolen' ? 'animate-pulse ring-4 ring-red-500' : ''}
                      ${hasRecentEvent?.type === 'claimed' ? 'animate-pulse ring-4 ring-green-500' : ''}
                      ${isUnderThreat ? 'ring-2 ring-yellow-500' : ''}
                      ${isHovered ? 'scale-125 z-10' : ''}`}
                      style={{
                        left: `${region.position.x}%`,
                        top: `${region.position.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onMouseEnter={() => setHoveredRegion(key)}
                      onMouseLeave={() => setHoveredRegion(null)}
                      onClick={() => {
                        setSelectedRegion(key);
                        if (key === playerState.currentRegion) {
                          setShowDepositModal(true);
                        } else {
                          setShowTravelModal(true);
                        }
                      }}
                    >
                      <div className="text-center">
                        <div className="text-white drop-shadow">{key}</div>
                        {state.welcomeBonusAvailable && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-yellow-600 text-xs">
                            ★
                          </div>
                        )}
                        {isBothHere && (
                          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-orange-600 text-white text-[10px] px-1 rounded whitespace-nowrap font-bold animate-pulse">
                            ⚔️ BOTH HERE
                          </div>
                        )}
                        {isUnderThreat && !isBothHere && (
                          <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-yellow-600 text-white text-[10px] px-1 rounded whitespace-nowrap">
                            ⚠️ THREAT
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Region Tooltip */}
                {hoveredRegion && (
                  <div
                    className="absolute bg-white border-2 border-gray-300 rounded-lg p-3 shadow-xl z-50 pointer-events-none"
                    style={{
                      left: `${REGIONS[hoveredRegion].position.x}%`,
                      top: `${REGIONS[hoveredRegion].position.y}%`,
                      transform: 'translate(-50%, -120%)',
                      minWidth: '200px',
                    }}
                  >
                    <div className="text-sm font-bold text-gray-800 mb-2">{REGIONS[hoveredRegion].name}</div>
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Controller:</span>
                        <span className={`font-semibold ${
                          regions[hoveredRegion].controller === 'player' ? 'text-green-600' :
                          regions[hoveredRegion].controller === 'ai' ? 'text-red-600' :
                          'text-gray-500'
                        }`}>
                          {regions[hoveredRegion].controller === 'player' ? 'You ✅' :
                           regions[hoveredRegion].controller === 'ai' ? 'AI 🤖' :
                           'None ⚪'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Your Deposit:</span>
                        <span className="font-semibold text-green-600">${regions[hoveredRegion].playerDeposit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">AI Deposit:</span>
                        <span className="font-semibold text-red-600">${regions[hoveredRegion].aiDeposit}</span>
                      </div>
                      {regions[hoveredRegion].welcomeBonusAvailable && (
                        <div className="flex justify-between text-yellow-700 font-bold">
                          <span>Bonus Available:</span>
                          <span>★ $750</span>
                        </div>
                      )}
                      {hoveredRegion !== playerState.currentRegion && FLIGHT_COSTS[playerState.currentRegion]?.[hoveredRegion] && (
                        <div className="flex justify-between border-t pt-1 mt-1">
                          <span className="text-gray-600">Flight Cost:</span>
                          <span className="font-semibold">${FLIGHT_COSTS[playerState.currentRegion][hoveredRegion]}</span>
                        </div>
                      )}
                      <div className="text-center mt-2 text-[10px] text-gray-500">
                        Click to {hoveredRegion === playerState.currentRegion ? 'deposit' : 'travel'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Player indicator */}
                <div
                  className="absolute w-8 h-8 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center animate-pulse"
                  style={{
                    left: `${REGIONS[playerState.currentRegion].position.x}%`,
                    top: `${REGIONS[playerState.currentRegion].position.y}%`,
                    transform: 'translate(-50%, -80px)',
                  }}
                  title="Your location"
                >
                  <span className="text-white font-bold text-xs">YOU</span>
                </div>

                {/* AI indicator */}
                <div
                  className="absolute w-8 h-8 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center"
                  style={{
                    left: `${REGIONS[aiState.currentRegion].position.x}%`,
                    top: `${REGIONS[aiState.currentRegion].position.y}%`,
                    transform: 'translate(-50%, 40px)',
                  }}
                  title="AI location"
                >
                  <span className="text-white font-bold text-xs">AI</span>
                </div>
              </div>

              {/* Map Legend */}
              <div className="mt-4 flex flex-wrap gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-green-400 border-2 border-green-600 rounded-full"></div>
                  <span>Your Control</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-red-400 border-2 border-red-600 rounded-full"></div>
                  <span>AI Control</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-gray-300 border-2 border-gray-500 rounded-full"></div>
                  <span>Unclaimed</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-xs">★</div>
                  <span>Welcome Bonus Available</span>
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                📊 Live Activity Feed
              </h3>
              <div
                ref={activityFeedRef}
                className="space-y-1 max-h-60 overflow-y-auto scroll-smooth"
              >
                {[...activityLog]
                  .reverse()
                  .filter((log, idx) => {
                    // Only show startup messages if we're still in early game
                    const isStartupMessage = log.message.includes('Game started') ||
                                            log.message.includes('Starting budget') ||
                                            (log.message.includes('Day 1 begins') && gameState.day === 1);
                    if (isStartupMessage && gameState.day > 1) return false;
                    return true;
                  })
                  .map((log, idx) => (
                    <div
                      key={log.timestamp + idx}
                      className={`text-sm p-2 rounded transition-all ${
                        log.type === 'success' ? 'bg-green-50 text-green-700 border-l-4 border-green-500' :
                        log.type === 'error' ? 'bg-red-50 text-red-700 border-l-4 border-red-500' :
                        log.type === 'warning' ? 'bg-orange-50 text-orange-700 border-l-4 border-orange-500' :
                        'bg-gray-50 text-gray-700 border-l-4 border-gray-300'
                      } ${log.player === 'ai' ? 'ml-2' : ''}`}
                    >
                      {log.message}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Modal */}
      {showChallengeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Choose Challenge - {REGIONS[playerState.currentRegion].name}</h2>
              <div className="text-xs text-gray-500">Press ESC to close</div>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {REGIONS[playerState.currentRegion].challenges.map((challenge, idx) => {
                const smartWager = calculateSmartWager(challenge);
                const expectedProfit = Math.floor(smartWager * challenge.multiplier * challenge.baseSuccessChance - smartWager * (1 - challenge.baseSuccessChance));

                return (
                  <div
                    key={idx}
                    className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                      selectedChallenge === challenge
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-300 hover:border-purple-300'
                    }`}
                    onClick={() => setSelectedChallenge(challenge)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="font-semibold text-gray-800">
                        {idx + 1}. {challenge.name}
                        <span className="ml-2 text-xs text-gray-500">(Press {idx + 1})</span>
                      </div>
                      {expectedProfit > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          +${expectedProfit} avg
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 mt-1 flex gap-3">
                      <div>Multiplier: {challenge.multiplier}x</div>
                      <div>Duration: {challenge.duration}s</div>
                      <div className="flex items-center gap-1">
                        Success: {(challenge.baseSuccessChance * 100).toFixed(0)}%
                        <span>
                          {'⭐'.repeat(Math.ceil(challenge.baseSuccessChance * 3))}
                        </span>
                      </div>
                    </div>
                    {selectedChallenge === challenge && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">
                          Wager Amount: <span className="text-xs text-gray-500">(Smart: ${smartWager})</span>
                        </label>
                        <input
                          type="number"
                          id={`wager-input-${idx}`}
                          min="1"
                          max={playerState.budget}
                          defaultValue={smartWager}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          Available: ${playerState.budget} | Max win: ${Math.floor(smartWager * challenge.multiplier)}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const wager = parseInt((document.getElementById(`wager-input-${idx}`) as HTMLInputElement).value);
                            if (wager > 0 && wager <= playerState.budget) {
                              handlePlayerChallenge(challenge, wager);
                            } else {
                              alert('Invalid wager amount!');
                            }
                          }}
                          className="w-full mt-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded font-semibold"
                        >
                          Attempt Challenge
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => {
                setShowChallengeModal(false);
                setSelectedChallenge(null);
              }}
              className="w-full mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-semibold"
            >
              Cancel (ESC)
            </button>
          </div>
        </div>
      )}

      {/* Travel Modal */}
      {showTravelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Book Flight from {REGIONS[playerState.currentRegion].name}</h2>
              <div className="text-xs text-gray-500">Press ESC to close</div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {Object.keys(REGIONS)
                .filter(key => key !== playerState.currentRegion)
                .map(destination => {
                  const cost = FLIGHT_COSTS[playerState.currentRegion][destination];
                  const duration = FLIGHT_DURATIONS[playerState.currentRegion][destination];
                  const bonusAvailable = regions[destination].welcomeBonusAvailable;

                  return (
                    <button
                      key={destination}
                      onClick={() => handlePlayerTravel(destination, cost, duration)}
                      disabled={cost > playerState.budget}
                      className="w-full text-left border border-gray-300 rounded-lg p-3 hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-gray-800">{REGIONS[destination].name}</div>
                          <div className="text-sm text-gray-600">
                            Cost: ${cost} | Duration: {duration}s
                          </div>
                        </div>
                        {bonusAvailable && (
                          <div className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold">
                            ★ +$750
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
            <button
              onClick={() => setShowTravelModal(false)}
              className="w-full mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-semibold"
            >
              Cancel (ESC)
            </button>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Deposit in {REGIONS[playerState.currentRegion].name}</h2>
              <div className="text-xs text-gray-500">Press ESC to close</div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Controller:</span>
                  <span className={`font-semibold ${
                    regions[playerState.currentRegion].controller === 'player' ? 'text-green-600' :
                    regions[playerState.currentRegion].controller === 'ai' ? 'text-red-600' :
                    'text-gray-500'
                  }`}>
                    {regions[playerState.currentRegion].controller === 'player' ? 'You ✅' :
                     regions[playerState.currentRegion].controller === 'ai' ? 'AI 🤖' :
                     'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Your Deposit:</span>
                  <span className="font-semibold text-green-600">${regions[playerState.currentRegion].playerDeposit}</span>
                </div>
                {regions[playerState.currentRegion].aiVisited && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">AI Deposit:</span>
                    <span className="font-semibold text-red-600">${regions[playerState.currentRegion].aiDeposit}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-gray-600">Amount to Control:</span>
                  <span className="font-bold text-purple-600">
                    ${Math.max(regions[playerState.currentRegion].aiDeposit - regions[playerState.currentRegion].playerDeposit + 1, 1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Deposit Amount: <span className="text-xs text-gray-500">(Smart: ${calculateSmartDeposit(playerState.currentRegion)})</span>
              </label>
              <input
                type="number"
                id="deposit-input"
                min="1"
                max={playerState.budget}
                defaultValue={calculateSmartDeposit(playerState.currentRegion)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="text-xs text-gray-500 mt-1">Available budget: ${playerState.budget}</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  const amount = parseInt((document.getElementById('deposit-input') as HTMLInputElement).value);
                  if (amount > 0) {
                    handlePlayerDeposit(amount);
                  }
                }}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold"
              >
                Deposit
              </button>
              <button
                onClick={() => setShowDepositModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-semibold"
              >
                Cancel (ESC)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {showGameOverModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-8">
            <div className="text-center">
              <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Game Over!</h2>

              <div className="my-6 p-6 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold mb-4">
                  {gameState.winner === 'player' && (
                    <div className="text-green-600">🎉 YOU WIN! 🎉</div>
                  )}
                  {gameState.winner === 'ai' && (
                    <div className="text-red-600">AI WINS</div>
                  )}
                  {gameState.winner === 'tie' && (
                    <div className="text-gray-600">IT'S A TIE!</div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-lg">
                    <span>Your Regions:</span>
                    <span className="font-bold text-green-600">{playerRegionsControlled.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg">
                    <span>AI Regions:</span>
                    <span className="font-bold text-red-600">{aiRegionsControlled.length}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-3 mt-3">
                    <div className="flex justify-between items-center text-sm">
                      <span>Your Final Budget:</span>
                      <span className="font-semibold">${playerState.budget}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span>AI Final Budget:</span>
                      <span className="font-semibold">${aiState.budget}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-gray-700">Your Controlled Regions:</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {playerRegionsControlled.map(region => (
                    <span key={region} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                      {REGIONS[region].name}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => window.location.reload()}
                className="mt-6 bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-bold text-lg"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Challenge Outcome Notification */}
      {notification.visible && (
        <div className={`fixed top-24 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-lg shadow-2xl border-4 transition-all duration-300 ${
          notification.type === 'success'
            ? 'bg-green-500 border-green-600 text-white'
            : 'bg-red-500 border-red-600 text-white'
        } animate-bounce`}>
          <div className="text-xl font-bold text-center">
            {notification.message}
          </div>
        </div>
      )}
    </div>
  );
}
