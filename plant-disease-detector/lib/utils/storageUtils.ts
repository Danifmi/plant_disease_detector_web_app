// Utilidades para almacenamiento local

import { openDB, IDBPDatabase } from 'idb';
import { AnalysisResult, HistoryItem } from '@/types/analysis';
import { STORAGE_KEYS } from '@/lib/constants/config';

const DB_NAME = 'PlantDiseaseDetector';
const DB_VERSION = 1;
const STORE_HISTORY = 'history';
const STORE_IMAGES = 'images';

let dbInstance: IDBPDatabase | null = null;

/**
 * Inicializa la base de datos IndexedDB
 */
async function initDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store para historial de análisis
      if (!db.objectStoreNames.contains(STORE_HISTORY)) {
        const historyStore = db.createObjectStore(STORE_HISTORY, { keyPath: 'id' });
        historyStore.createIndex('timestamp', 'timestamp');
      }

      // Store para imágenes (blobs)
      if (!db.objectStoreNames.contains(STORE_IMAGES)) {
        db.createObjectStore(STORE_IMAGES, { keyPath: 'id' });
      }
    }
  });

  return dbInstance;
}

/**
 * Guarda un resultado de análisis en el historial
 */
export async function saveAnalysisToHistory(
  result: AnalysisResult,
  imageBlob?: Blob
): Promise<void> {
  const db = await initDB();

  // Guardar imagen si se proporciona
  if (imageBlob) {
    await db.put(STORE_IMAGES, { id: result.id, blob: imageBlob });
  }

  // Guardar resultado
  const historyItem: HistoryItem = {
    ...result,
    imageUrl: imageBlob ? `indexeddb://${result.id}` : result.imageUrl
  };

  await db.put(STORE_HISTORY, historyItem);
}

/**
 * Obtiene todo el historial de análisis
 */
export async function getAnalysisHistory(): Promise<HistoryItem[]> {
  const db = await initDB();
  const items = await db.getAllFromIndex(STORE_HISTORY, 'timestamp');
  return items.reverse(); // Más recientes primero
}

/**
 * Obtiene un análisis específico por ID
 */
export async function getAnalysisById(id: string): Promise<HistoryItem | undefined> {
  const db = await initDB();
  return db.get(STORE_HISTORY, id);
}

/**
 * Obtiene la imagen asociada a un análisis
 */
export async function getAnalysisImage(id: string): Promise<Blob | undefined> {
  const db = await initDB();
  const record = await db.get(STORE_IMAGES, id);
  return record?.blob;
}

/**
 * Elimina un análisis del historial
 */
export async function deleteAnalysis(id: string): Promise<void> {
  const db = await initDB();
  await db.delete(STORE_HISTORY, id);
  await db.delete(STORE_IMAGES, id);
}

/**
 * Limpia todo el historial
 */
export async function clearHistory(): Promise<void> {
  const db = await initDB();
  await db.clear(STORE_HISTORY);
  await db.clear(STORE_IMAGES);
}

/**
 * Obtiene todo el historial (alias para getAnalysisHistory)
 */
export async function getHistory(): Promise<HistoryItem[]> {
  return getAnalysisHistory();
}

/**
 * Elimina un item del historial (alias para deleteAnalysis)
 */
export async function deleteHistoryItem(id: string): Promise<void> {
  return deleteAnalysis(id);
}

// LocalStorage helpers para preferencias simples
export const storage = {
  get<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  remove(key: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  }
};

// Preferencias de usuario
export interface UserPreferences {
  autoSaveHistory: boolean;
  showTutorial: boolean;
  defaultCamera: 'environment' | 'user';
  language: 'es' | 'en';
}

const DEFAULT_PREFERENCES: UserPreferences = {
  autoSaveHistory: true,
  showTutorial: true,
  defaultCamera: 'environment',
  language: 'es'
};

export function getUserPreferences(): UserPreferences {
  return storage.get(STORAGE_KEYS.userPreferences, DEFAULT_PREFERENCES);
}

export function setUserPreferences(prefs: Partial<UserPreferences>): void {
  const current = getUserPreferences();
  storage.set(STORAGE_KEYS.userPreferences, { ...current, ...prefs });
}
