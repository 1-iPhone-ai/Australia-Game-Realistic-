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
  const [wagerAmount, setWagerAmount] = useState<number>(100);
  const [depositAmount, setDepositAmount] = useState<number>(100);

  const aiIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const gameStartTime = useRef<number>(Date.now());
  const aiActionLockRef = useRef<boolean>(false);
  const gameStatusRef = useRef<'active' | 'ended'>(gameState.gameStatus);
  const aiStateRef = useRef(aiState);
  const regionsRef = useRef(regions);
  const gameStateRef = useRef(gameState);

  // PLAYER REFS - FIX #1: Add player state tracking refs
  const playerStateRef = useRef(playerState);
  const playerActionLockRef = useRef<boolean>(false);
  const travelProgressRef = useRef<NodeJS.Timeout | null>(null);

  // =========================================
  // UTILITY FUNCTIONS
  // =========================================

  const addLog = useCallback((message: string, type: ActivityLog['type'], player: 'player' | 'ai') => {
    setActivityLog(prev => [...prev, { timestamp: Date.now(), message, type, player }].slice(-20));
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

  // FIX #1: Sync player state ref
  useEffect(() => {
    playerStateRef.current = playerState;
  }, [playerState]);

  // FIX #8: Auto-close modals when game ends
  useEffect(() => {
    if (gameState.gameStatus === 'ended') {
      setShowChallengeModal(false);
      setShowTravelModal(false);
      setShowDepositModal(false);
      setSelectedChallenge(null);
    }
  }, [gameState.gameStatus]);

  // FIX #12: Cleanup on unmount
  useEffect(() => {
    return () => {
      // Clean up travel progress interval
      if (travelProgressRef.current) {
        clearInterval(travelProgressRef.current);
      }
      // Reset locks
      playerActionLockRef.current = false;
    };
  }, []);

  // =========================================
  // PLAYER VALIDATION HELPERS
  // =========================================

  // FIX #2: Time validation for player actions
  const playerHasTimeFor = useCallback((duration: number): boolean => {
    const timeLeft = gameStateRef.current.timeRemaining;
    const buffer = 5; // 5 second safety buffer
    return timeLeft >= (duration + buffer);
  }, []);

  // FIX #9: Input validation and sanitization
  const validateAndParseAmount = useCallback((value: number, max: number, min: number = 1): number | null => {
    if (isNaN(value)) return null;
    if (!Number.isFinite(value)) return null;
    if (value < min) return null;
    if (value > max) return null;
    return Math.floor(value); // Ensure integer
  }, []);

  // FIX #7: Region validation
  const validateRegion = useCallback((regionKey: string): boolean => {
    if (!REGIONS[regionKey]) {
      console.error(`Invalid region: ${regionKey}`);
      return false;
    }
    if (!regionsRef.current[regionKey]) {
      console.error(`Region state missing for: ${regionKey}`);
      return false;
    }
    return true;
  }, []);

  // FIX #10: Get suggested wager amount
  const getSuggestedWager = useCallback((budget: number, challenge: Challenge): number => {
    const conservative = Math.floor(budget * 0.15);
    return Math.min(conservative, 500, budget);
  }, []);

  // FIX #13: Comprehensive action availability check
  const canPlayerAct = useCallback((): boolean => {
    return (
      gameStatusRef.current === 'active' &&
      !playerStateRef.current.isBusy &&
      !playerStateRef.current.isTraveling &&
      gameStateRef.current.timeRemaining > 10
    );
  }, []);

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
    // FIX #1 & #6: Check action lock to prevent concurrent actions
    if (playerActionLockRef.current) {
      alert("You have an action in progress!");
      return;
    }

    if (playerState.isBusy || playerState.isTraveling) {
      alert("You're currently busy!");
      return;
    }

    // FIX #2: Validate time availability
    if (!playerHasTimeFor(challenge.duration)) {
      alert(`Not enough time! Need ${challenge.duration}s but only ${gameState.timeRemaining}s left.`);
      return;
    }

    // FIX #9: Validate wager amount
    const validatedWager = validateAndParseAmount(wager, playerState.budget);
    if (validatedWager === null) {
      alert(`Invalid wager amount! Must be between $1 and $${playerState.budget}`);
      return;
    }

    if (validatedWager > playerState.budget) {
      alert("Insufficient budget!");
      return;
    }

    // FIX #6: Set action lock
    playerActionLockRef.current = true;

    try {
      setPlayerState(prev => ({
        ...prev,
        isBusy: true,
        currentActivity: `Attempting ${challenge.name}...`,
      }));

      addLog(`🎯 Started "${challenge.name}" (wagered $${validatedWager})`, 'info', 'player');
      setShowChallengeModal(false);

      // Simulate challenge duration
      await delay(challenge.duration * 1000);

      // FIX #1: Validate game still active after delay
      if (gameStatusRef.current !== 'active') {
        setPlayerState(prev => ({ ...prev, isBusy: false, currentActivity: null }));
        return;
      }

      const success = Math.random() < challenge.baseSuccessChance;

      if (success) {
        const winnings = Math.floor(validatedWager * challenge.multiplier);
        setPlayerState(prev => ({
          ...prev,
          budget: Math.max(0, prev.budget + winnings), // FIX #6 & #15: Prevent negative budget
          isBusy: false,
          currentActivity: null,
        }));
        addLog(`✅ Completed "${challenge.name}"! Won $${winnings} (profit: $${winnings - validatedWager})`, 'success', 'player');
      } else {
        setPlayerState(prev => ({
          ...prev,
          budget: Math.max(0, prev.budget - validatedWager), // FIX #6 & #15: Prevent negative budget
          isBusy: false,
          currentActivity: null,
        }));
        addLog(`❌ Failed "${challenge.name}". Lost $${validatedWager}`, 'error', 'player');
      }
    } catch (error) {
      // FIX #10: Error boundary
      console.error('Player challenge error:', error);
      addLog(`❌ Challenge failed due to error. Please try again.`, 'error', 'player');

      // Recover state
      setPlayerState(prev => ({
        ...prev,
        isBusy: false,
        currentActivity: null,
      }));
    } finally {
      // FIX #6: Always release lock
      playerActionLockRef.current = false;
    }
  };

  const handlePlayerTravel = async (destination: string, cost: number, duration: number) => {
    // FIX #1: Check action lock
    if (playerActionLockRef.current) {
      alert("You have an action in progress!");
      return;
    }

    if (playerState.isBusy || playerState.isTraveling) {
      alert("You're currently busy!");
      return;
    }

    // FIX #7: Validate destination region
    if (!validateRegion(destination)) {
      alert("Invalid destination!");
      return;
    }

    // FIX #2: Validate time availability
    if (!playerHasTimeFor(duration)) {
      alert(`Not enough time! Need ${duration}s but only ${gameState.timeRemaining}s left.`);
      return;
    }

    if (cost > playerState.budget) {
      alert("Insufficient budget for this flight!");
      return;
    }

    // FIX #1: Set action lock
    playerActionLockRef.current = true;

    try {
      // FIX #3: Clear any existing progress interval
      if (travelProgressRef.current) {
        clearInterval(travelProgressRef.current);
        travelProgressRef.current = null;
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
        // FIX #3: Check game status in interval
        if (gameStatusRef.current !== 'active') {
          clearInterval(progressInterval);
          return;
        }

        const now = Date.now();
        const progress = Math.min(100, ((now - startTime) / (duration * 1000)) * 100);
        setPlayerState(prev => ({ ...prev, travelProgress: progress }));

        if (now >= endTime) {
          clearInterval(progressInterval);
        }
      }, 100);

      // FIX #3: Store interval ref for cleanup
      travelProgressRef.current = progressInterval;

      // Wait for travel to complete
      await delay(duration * 1000);

      // FIX #1 & #3: Validate game still active after delay
      if (gameStatusRef.current !== 'active') {
        clearInterval(progressInterval);
        travelProgressRef.current = null;
        setPlayerState(prev => ({
          ...prev,
          isTraveling: false,
          travelDestination: null,
          travelProgress: 0,
        }));
        return;
      }

      // FIX #4: Revalidate bonus availability after delay
      const currentRegionState = regionsRef.current[destination];
      if (!currentRegionState) {
        console.error(`Region state missing after travel: ${destination}`);
        clearInterval(progressInterval);
        travelProgressRef.current = null;
        setPlayerState(prev => ({
          ...prev,
          isTraveling: false,
          travelDestination: null,
          travelProgress: 0,
        }));
        return;
      }

      const bonusAwarded = currentRegionState.welcomeBonusAvailable;
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
        budget: Math.max(0, prev.budget + bonusAmount), // FIX #15: Prevent negative budget
        visitedRegions: prev.visitedRegions.includes(destination)
          ? prev.visitedRegions
          : [...prev.visitedRegions, destination],
      }));

      setRegions(prev => ({
        ...prev,
        [destination]: { ...prev[destination], playerVisited: true },
      }));

      addLog(`📍 Arrived in ${REGIONS[destination].name}${bonusAwarded ? ' (bonus claimed!)' : ''}`, 'success', 'player');

      // FIX #3: Clean up interval ref
      clearInterval(progressInterval);
      travelProgressRef.current = null;
    } catch (error) {
      // FIX #10: Error boundary
      console.error('Player travel error:', error);
      addLog(`❌ Travel failed due to error. Cost refunded.`, 'error', 'player');

      // Refund cost and recover state
      setPlayerState(prev => ({
        ...prev,
        budget: Math.max(0, prev.budget + cost),
        isTraveling: false,
        travelDestination: null,
        travelProgress: 0,
      }));

      // Clean up interval
      if (travelProgressRef.current) {
        clearInterval(travelProgressRef.current);
        travelProgressRef.current = null;
      }
    } finally {
      // FIX #1: Always release lock
      playerActionLockRef.current = false;
    }
  };

  const handlePlayerDeposit = (amount: number) => {
    try {
      // FIX #9: Validate amount
      const validatedAmount = validateAndParseAmount(amount, playerState.budget);
      if (validatedAmount === null) {
        alert(`Invalid deposit amount! Must be between $1 and $${playerState.budget}`);
        return;
      }

      if (validatedAmount > playerState.budget) {
        alert("Insufficient budget!");
        return;
      }

      if (validatedAmount <= 0) {
        alert("Please enter a valid amount!");
        return;
      }

      const region = playerState.currentRegion;

      // FIX #7: Validate current region
      if (!validateRegion(region)) {
        alert("Error: Invalid current location!");
        return;
      }

      const currentRegionState = regions[region];
      const newPlayerDeposit = currentRegionState.playerDeposit + validatedAmount;
      const aiDeposit = currentRegionState.aiDeposit;

      setPlayerState(prev => ({
        ...prev,
        budget: Math.max(0, prev.budget - validatedAmount), // FIX #15: Prevent negative budget
      }));

      const wasControlled = currentRegionState.controller;
      const newController = newPlayerDeposit > aiDeposit ? 'player' : (aiDeposit > newPlayerDeposit ? 'ai' : null);

      setRegions(prev => ({
        ...prev,
        [region]: {
          ...prev[region],
          playerDeposit: newPlayerDeposit,
          controller: newController,
        },
      }));

      // FIX #11: Better logging for all controller change scenarios
      if (wasControlled !== newController && newController === 'player') {
        addLog(`🏆 You now control ${REGIONS[region].name}! ($${newPlayerDeposit} deposited)`, 'success', 'player');
      } else if (wasControlled === 'player' && newController === 'ai') {
        addLog(`⚠️ Lost control of ${REGIONS[region].name} (AI: $${aiDeposit}, You: $${newPlayerDeposit})`, 'warning', 'player');
      } else if (wasControlled === 'player' && newController === null) {
        addLog(`⚠️ ${REGIONS[region].name} now tied! Deposit more to regain control.`, 'warning', 'player');
      } else if (wasControlled !== newController && newController === 'ai') {
        addLog(`💰 Deposited $${validatedAmount} in ${REGIONS[region].name} (total: $${newPlayerDeposit}, AI controls)`, 'info', 'player');
      } else {
        addLog(`💰 Deposited $${validatedAmount} in ${REGIONS[region].name} (total: $${newPlayerDeposit})`, 'info', 'player');
      }

      setShowDepositModal(false);
    } catch (error) {
      // FIX #10: Error boundary
      console.error('Player deposit error:', error);
      addLog(`❌ Deposit failed due to error. Please try again.`, 'error', 'player');
    }
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
  // AI DECISION ENGINE
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

      // Evaluate all possible actions
      const actions: Array<{ type: string; value: number; data: any }> = [];

      // 1. Evaluate challenges
      const currentRegionChallenges = REGIONS[currentAiState.currentRegion].challenges;
      currentRegionChallenges.forEach(challenge => {
        // CRITICAL FIX #8: Check time before adding action
        if (!hasTimeFor(challenge.duration)) return;

        // CRITICAL FIX #2 & #9: Calculate wager with proper budget constraints
        const maxWager = Math.floor(currentAiState.budget * 0.3);
        const optimalWager = Math.min(maxWager, 500);
        if (optimalWager < 50) return;

        // CRITICAL FIX #2: Validate affordability
        if (!canAfford(optimalWager)) return;

        // CRITICAL FIX #9: Improved expected value with risk consideration
        const expectedReturn = challenge.multiplier * challenge.baseSuccessChance * optimalWager;
        const expectedLoss = optimalWager * (1 - challenge.baseSuccessChance);
        const expectedValue = expectedReturn - expectedLoss;

        // Consider time efficiency
        const valuePerSecond = expectedValue / challenge.duration;

        actions.push({
          type: 'challenge',
          value: valuePerSecond * 100, // Weight by efficiency
          data: { challenge, wager: optimalWager },
        });
      });

      // 2. Evaluate flights
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

        // CRITICAL FIX #5: Use current regions state for bonus check
        const welcomeBonus = currentRegions[destination].welcomeBonusAvailable ? 750 : 0;
        const value = welcomeBonus - cost + 200;

        actions.push({
          type: 'travel',
          value,
          data: { destination, cost, duration },
        });
      });

      // 3. Evaluate deposits
      const currentRegion = currentRegions[currentAiState.currentRegion];
      if (!currentRegion) return; // CRITICAL FIX #4: Validate region exists

      const aiDeposit = currentRegion.aiDeposit;
      const playerDeposit = currentRegion.playerDeposit;

      // Try to steal player regions
      if (currentRegion.controller === 'player') {
        // CRITICAL FIX #10: Proper deposit calculation within budget
        const amountToSteal = playerDeposit - aiDeposit + 1;
        const maxAffordable = Math.floor(currentAiState.budget * 0.4);
        const actualAmount = Math.min(amountToSteal + 50, maxAffordable);

        if (actualAmount > 0 && canAfford(actualAmount)) {
          actions.push({
            type: 'deposit',
            value: 600, // High value to steal
            data: { amount: actualAmount },
          });
        }
      }

      // Secure uncontrolled regions
      if (currentRegion.controller === null) {
        // CRITICAL FIX #10: Ensure amount doesn't exceed budget
        const maxAffordable = Math.floor(currentAiState.budget * 0.2);
        const actualAmount = Math.min(200, maxAffordable);

        if (actualAmount > 0 && canAfford(actualAmount)) {
          actions.push({
            type: 'deposit',
            value: 300,
            data: { amount: actualAmount },
          });
        }
      }

      // Defend regions
      if (currentRegion.controller === 'ai' &&
          playerState.currentRegion === currentAiState.currentRegion &&
          playerState.budget > aiDeposit) {
        // CRITICAL FIX #10: Proper calculation
        const defenseAmount = Math.floor(aiDeposit * 0.5);
        const maxAffordable = Math.floor(currentAiState.budget * 0.3);
        const actualAmount = Math.min(defenseAmount, maxAffordable);

        if (actualAmount > 0 && canAfford(actualAmount)) {
          actions.push({
            type: 'deposit',
            value: 500,
            data: { amount: actualAmount },
          });
        }
      }

      // Pick best action
      if (actions.length === 0) return;

      // CRITICAL FIX #3: Sort and verify best action is affordable
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
        } else if (wasControlled !== newController && newController === 'ai') {
          addLog(`🤖 AI now controls ${REGIONS[region].name}! ($${newAiDeposit})`, 'warning', 'ai');
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
  }, [playerState, addLog, canAfford, hasTimeFor, validateBudgetTransaction, revalidateRegionState]);

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
              <div className="text-center bg-blue-100 px-4 py-2 rounded">
                <div className="text-xs text-gray-600 flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  Time Left
                </div>
                <div className="text-xl font-bold text-blue-600">{formatTime(gameState.timeRemaining)}</div>
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
                  <span className="text-xl font-bold text-green-600">${Math.max(0, playerState.budget)}</span>
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
                  onClick={() => {
                    setShowChallengeModal(true);
                    setWagerAmount(Math.min(100, playerState.budget));
                  }}
                  disabled={!canPlayerAct()}
                  className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-semibold transition-colors"
                  title={
                    gameState.gameStatus !== 'active' ? 'Game ended' :
                    playerState.isBusy ? 'Currently busy with challenge' :
                    playerState.isTraveling ? 'Currently traveling' :
                    gameState.timeRemaining <= 10 ? 'Not enough time left in day' :
                    'Start a challenge'
                  }
                >
                  🎯 Do Challenge
                </button>
                <button
                  onClick={() => setShowTravelModal(true)}
                  disabled={!canPlayerAct()}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-semibold transition-colors"
                  title={
                    gameState.gameStatus !== 'active' ? 'Game ended' :
                    playerState.isBusy ? 'Currently busy with challenge' :
                    playerState.isTraveling ? 'Currently traveling' :
                    gameState.timeRemaining <= 10 ? 'Not enough time left in day' :
                    'Book a flight'
                  }
                >
                  ✈️ Travel
                </button>
                <button
                  onClick={() => {
                    setShowDepositModal(true);
                    setDepositAmount(Math.min(100, playerState.budget));
                  }}
                  disabled={!canPlayerAct()}
                  className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-semibold transition-colors"
                  title={
                    gameState.gameStatus !== 'active' ? 'Game ended' :
                    playerState.isBusy ? 'Currently busy with challenge' :
                    playerState.isTraveling ? 'Currently traveling' :
                    gameState.timeRemaining <= 10 ? 'Not enough time left in day' :
                    'Deposit money to control region'
                  }
                >
                  💰 Deposit Money
                </button>
              </div>

              {/* FIX #16: Visual feedback for disabled actions */}
              {playerState.isBusy && (
                <div className="mt-3 text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200">
                  ⏳ {playerState.currentActivity}
                </div>
              )}

              {playerState.isTraveling && (
                <div className="mt-3 text-xs text-blue-700 bg-blue-50 p-2 rounded border border-blue-200">
                  ✈️ Traveling to {REGIONS[playerState.travelDestination!].name}
                </div>
              )}

              {gameState.timeRemaining < 10 && gameState.gameStatus === 'active' && !playerState.isBusy && !playerState.isTraveling && (
                <div className="mt-3 text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
                  ⏰ Less than 10 seconds left - wait for next day
                </div>
              )}
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

                  return (
                    <div
                      key={key}
                      className={`absolute w-12 h-12 rounded-full border-4 flex items-center justify-center font-bold text-xs transition-all ${
                        state.controller === 'player' ? 'bg-green-400 border-green-600' :
                        state.controller === 'ai' ? 'bg-red-400 border-red-600' :
                        'bg-gray-300 border-gray-500'
                      }`}
                      style={{
                        left: `${region.position.x}%`,
                        top: `${region.position.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      title={`${region.name}\nController: ${state.controller || 'None'}\nYou: $${state.playerDeposit} | AI: $${state.aiDeposit}`}
                    >
                      <div className="text-center">
                        <div className="text-white drop-shadow">{key}</div>
                        {state.welcomeBonusAvailable && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-yellow-600 text-xs">
                            ★
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

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
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {[...activityLog].reverse().map((log, idx) => (
                  <div
                    key={log.timestamp + idx}
                    className={`text-sm p-2 rounded ${
                      log.type === 'success' ? 'bg-green-50 text-green-700' :
                      log.type === 'error' ? 'bg-red-50 text-red-700' :
                      log.type === 'warning' ? 'bg-orange-50 text-orange-700' :
                      'bg-gray-50 text-gray-700'
                    }`}
                  >
                    {log.message}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Challenge Modal - FIX #5: Use controlled components */}
      {showChallengeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Choose Challenge - {REGIONS[playerState.currentRegion].name}</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {REGIONS[playerState.currentRegion].challenges.map((challenge, idx) => (
                <div
                  key={idx}
                  className="border border-gray-300 rounded-lg p-3 hover:border-purple-500 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedChallenge(challenge);
                    // FIX #10: Set suggested wager when challenge selected
                    setWagerAmount(getSuggestedWager(playerState.budget, challenge));
                  }}
                >
                  <div className="font-semibold text-gray-800">{challenge.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    <div>Multiplier: {challenge.multiplier}x</div>
                    <div>Duration: {challenge.duration}s</div>
                    <div>Success Rate: {(challenge.baseSuccessChance * 100).toFixed(0)}%</div>
                  </div>
                  {selectedChallenge === challenge && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Wager Amount:</label>
                      <input
                        type="number"
                        min="1"
                        max={playerState.budget}
                        value={wagerAmount}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setWagerAmount(Math.max(0, Math.min(value, playerState.budget)));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Suggested: ${getSuggestedWager(playerState.budget, challenge)} (15% of budget)
                        {wagerAmount > playerState.budget * 0.5 && (
                          <span className="text-red-600 font-bold ml-2">
                            ⚠️ High risk! Over 50% of budget
                          </span>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (wagerAmount > 0 && wagerAmount <= playerState.budget) {
                            handlePlayerChallenge(challenge, wagerAmount);
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
              ))}
            </div>
            <button
              onClick={() => {
                setShowChallengeModal(false);
                setSelectedChallenge(null);
              }}
              className="w-full mt-4 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-semibold"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Travel Modal */}
      {showTravelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Book Flight from {REGIONS[playerState.currentRegion].name}</h2>
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
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Deposit Modal - FIX #5: Use controlled components */}
      {showDepositModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Deposit in {REGIONS[playerState.currentRegion].name}</h2>

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
                {/* FIX #17: Warning about AI potentially depositing */}
                {aiState.currentRegion === playerState.currentRegion && (
                  <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded border border-yellow-200 mt-2">
                    ⚠️ AI is in same region - amounts may change!
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Deposit Amount:</label>
              <input
                type="number"
                min="1"
                max={playerState.budget}
                value={depositAmount}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setDepositAmount(Math.max(0, Math.min(value, playerState.budget)));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <div className="text-xs text-gray-500 mt-1">Available budget: ${Math.max(0, playerState.budget)}</div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (depositAmount > 0 && depositAmount <= playerState.budget) {
                    handlePlayerDeposit(depositAmount);
                  } else {
                    alert('Invalid deposit amount!');
                  }
                }}
                disabled={depositAmount <= 0 || depositAmount > playerState.budget}
                className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded font-semibold"
              >
                Deposit
              </button>
              <button
                onClick={() => setShowDepositModal(false)}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-semibold"
              >
                Cancel
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
    </div>
  );
}
