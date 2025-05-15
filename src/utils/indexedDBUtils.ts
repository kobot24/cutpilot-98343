
import { UploadedFile } from "../types/fileTypes";

// Constants for IndexedDB
const DB_NAME = "fileStorageDB";
const DB_VERSION = 1;
const FILE_STORE = "files";

// Open database connection
export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      reject(new Error("Failed to open IndexedDB"));
    };

    request.onsuccess = (event) => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILE_STORE)) {
        db.createObjectStore(FILE_STORE, { keyPath: "id" });
      }
    };
  });
};

// Save files to IndexedDB
export const saveFilesToDB = async (files: UploadedFile[]): Promise<void> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(FILE_STORE, "readwrite");
    const store = transaction.objectStore(FILE_STORE);

    // Clear existing files first
    store.clear();

    // Add all files
    files.forEach(file => {
      store.add(file);
    });

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error("Failed to save files to IndexedDB"));
    });
  } catch (error) {
    console.error("Error saving files to IndexedDB:", error);
    throw error;
  }
};

// Load files from IndexedDB
export const loadFilesFromDB = async (): Promise<UploadedFile[]> => {
  try {
    const db = await openDB();
    const transaction = db.transaction(FILE_STORE, "readonly");
    const store = transaction.objectStore(FILE_STORE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        // Convert date strings back to Date objects
        const files = request.result.map(file => ({
          ...file,
          createdAt: new Date(file.createdAt)
        }));
        resolve(files);
      };
      request.onerror = () => reject(new Error("Failed to load files from IndexedDB"));
    });
  } catch (error) {
    console.error("Error loading files from IndexedDB:", error);
    return [];
  }
};

// Delete IndexedDB database (for testing or clearing all data)
export const deleteDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error("Failed to delete IndexedDB database"));
  });
};
