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

// Create/Update match data in Firebase (Silent updates)
export const broadcastMatchUpdate = async (roomCode: string, data: SyncData): Promise<boolean> => {
  if (!roomCode) return false;
  const code = roomCode.toUpperCase();
  
  try {
    if (!database) return false;
    const matchRef = ref(database, `live_matches/${code}`);
    
    const payload = {
      match: data.match ? JSON.parse(JSON.stringify(data.match)) : null,
      teams: data.teams ? JSON.parse(JSON.stringify(data.teams)) : [],
      players: data.players ? JSON.parse(JSON.stringify(data.players)) : [],
      timestamp: Date.now(),
      roomCode: code,
    };

    await set(matchRef, payload);
    return true; // Returns silently now, no alert popup spam!
  } catch (error: any) {
    console.error('[Firebase] ❌ Error broadcasting:', error);
    return false;
  }
};

// Subscribe to match updates
export const subscribeToMatch = (
  roomCode: string,
  onUpdate: (data: SyncData) => void
): (() => void) => {
  if (!roomCode) return () => {};
  const code = roomCode.toUpperCase();
  
  const matchRef = ref(database, `live_matches/${code}`);
  
  onValue(matchRef, (snapshot) => {
    const data = snapshot.val();
    if (data && data.match) {
      onUpdate({
        match: data.match,
        teams: data.teams || [],
        players: data.players || [],
        timestamp: data.timestamp,
      });
    }
  }, (error) => {
    console.error('[Firebase] ❌ Subscription error:', error);
  });
  
  return () => {
    off(matchRef);
  };
};

// Check if a room exists and get its data
export const checkRoomExists = async (roomCode: string): Promise<SyncData | null> => {
  if (!roomCode) return null;
  const code = roomCode.toUpperCase();
  
  try {
    const matchRef = ref(database, `live_matches/${code}`);
    const snapshot = await get(matchRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        match: data.match,
        teams: data.teams || [],
        players: data.players || [],
        timestamp: data.timestamp,
      };
    }
    return null;
  } catch (error) {
    console.error('[Firebase] ❌ Error checking room:', error);
    return null;
  }
};

export { database };
