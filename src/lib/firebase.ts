import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue, off, get } from 'firebase/database';
import type { Match, Team, Player } from '../types';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAvW4QkmebZ7R_ksjJ4GFN1ka5_TwvTeWU",
  authDomain: "crickashmir-c3b80.firebaseapp.com",
  databaseURL: "https://crickashmir-c3b80-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "crickashmir-c3b80",
  storageBucket: "crickashmir-c3b80.firebasestorage.app",
  messagingSenderId: "263849608085",
  appId: "1:263849608085:web:2dccee6b2764e9d7666c9c"
};

// Initialize Firebase
console.log('[Firebase] Initializing...');
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
console.log('[Firebase] Initialized successfully');

export interface SyncData {
  match: Match;
  teams: Team[];
  players: Player[];
  timestamp: number;
}

// Generate a unique room code
export const generateRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Create/Update match data in Firebase
export const broadcastMatchUpdate = async (roomCode: string, data: SyncData): Promise<boolean> => {
  if (!roomCode) {
    console.warn('[Firebase] No room code provided');
    return false;
  }
  
  const code = roomCode.toUpperCase();
  console.log('[Firebase] Broadcasting to room:', code);
  
  try {
    const matchRef = ref(database, `live_matches/${code}`);
    await set(matchRef, {
      match: JSON.parse(JSON.stringify(data.match)), // Deep clone to avoid proxies
      teams: JSON.parse(JSON.stringify(data.teams)),
      players: JSON.parse(JSON.stringify(data.players)),
      timestamp: Date.now(),
      roomCode: code,
    });
    console.log('[Firebase] ✅ Broadcast successful for room:', code);
    return true;
  } catch (error) {
    console.error('[Firebase] ❌ Error broadcasting:', error);
    return false;
  }
};

// Subscribe to match updates
export const subscribeToMatch = (
  roomCode: string,
  onUpdate: (data: SyncData) => void
): (() => void) => {
  if (!roomCode) {
    console.warn('[Firebase] No room code for subscription');
    return () => {};
  }
  
  const code = roomCode.toUpperCase();
  console.log('[Firebase] Subscribing to room:', code);
  
  const matchRef = ref(database, `live_matches/${code}`);
  
  onValue(matchRef, (snapshot) => {
    const data = snapshot.val();
    if (data && data.match) {
      console.log('[Firebase] 📥 Received update for room:', code, 'at', new Date(data.timestamp).toLocaleTimeString());
      onUpdate({
        match: data.match,
        teams: data.teams || [],
        players: data.players || [],
        timestamp: data.timestamp,
      });
    } else {
      console.log('[Firebase] No data in snapshot for room:', code);
    }
  }, (error) => {
    console.error('[Firebase] ❌ Subscription error:', error);
  });
  
  // Return unsubscribe function
  return () => {
    console.log('[Firebase] Unsubscribing from room:', code);
    off(matchRef);
  };
};

// Check if a room exists and get its data
export const checkRoomExists = async (roomCode: string): Promise<SyncData | null> => {
  if (!roomCode) {
    console.warn('[Firebase] No room code to check');
    return null;
  }
  
  const code = roomCode.toUpperCase();
  console.log('[Firebase] Checking if room exists:', code);
  
  try {
    const matchRef = ref(database, `live_matches/${code}`);
    const snapshot = await get(matchRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log('[Firebase] ✅ Room found:', code);
      return {
        match: data.match,
        teams: data.teams || [],
        players: data.players || [],
        timestamp: data.timestamp,
      };
    }
    
    console.log('[Firebase] ❌ Room not found:', code);
    return null;
  } catch (error) {
    console.error('[Firebase] ❌ Error checking room:', error);
    return null;
  }
};

export { database };
