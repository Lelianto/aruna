import { storage } from './config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a file to Firebase Storage.
 * Falls back to a mock/placeholder URL if storage is not activated or fails.
 */
export async function uploadDocument(file: File, path: string): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.warn("Firebase Storage upload failed, using fallback mock URL:", error);
    // Return a beautiful public placeholder image
    const cleanedFilename = file.name.replace(/[^a-zA-Z0-9]/g, '_');
    return `https://placehold.co/600x400/003049/ffffff?text=Dokumen+${cleanedFilename}`;
  }
}
