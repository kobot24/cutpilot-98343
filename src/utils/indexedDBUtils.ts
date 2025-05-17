
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
    for (const file of files) {
      // Create a clean copy of the file object to prevent cloning errors
      // that can happen with certain complex objects
      const cleanFile = {
        ...file,
        // If convertedPdfUrl is a blob URL, store it as is
        // We'll handle the blob URL management in the useFileStorage hook
        convertedPdfUrl: file.convertedPdfUrl || null
      };
      store.add(cleanFile);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => {
        console.error("IndexedDB transaction error:", event);
        reject(new Error("Failed to save files to IndexedDB"));
      };
    });
  } catch (error) {
    console.error("Error saving files to IndexedDB:", error);
    throw error;
  }
};

// New function to update a single file without clearing the store
export const updateFileInDB = async (file: UploadedFile): Promise<void> => {
  try {
    console.log(`IndexedDB: Updating single file ${file.id} with name ${file.name}`);
    
    const db = await openDB();
    const transaction = db.transaction(FILE_STORE, "readwrite");
    const store = transaction.objectStore(FILE_STORE);

    // First check if the file exists
    const getRequest = store.get(file.id);
    
    return new Promise((resolve, reject) => {
      getRequest.onsuccess = () => {
        // Create a clean copy of the file object
        const cleanFile = {
          ...file,
          convertedPdfUrl: file.convertedPdfUrl || null
        };
        
        // Put (update) or add the file
        const putRequest = store.put(cleanFile);
        
        putRequest.onsuccess = () => {
          console.log(`IndexedDB: Successfully updated file ${file.id}`);
          resolve();
        };
        
        putRequest.onerror = (event) => {
          console.error(`IndexedDB: Error updating file ${file.id}:`, event);
          reject(new Error(`Failed to update file ${file.id} in IndexedDB`));
        };
      };
      
      getRequest.onerror = (event) => {
        console.error(`IndexedDB: Error retrieving file ${file.id}:`, event);
        reject(new Error(`Failed to retrieve file ${file.id} from IndexedDB`));
      };
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = (event) => {
        console.error("IndexedDB transaction error:", event);
        reject(new Error("Failed to complete IndexedDB transaction"));
      };
    });
  } catch (error) {
    console.error(`Error updating file ${file.id} in IndexedDB:`, error);
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
