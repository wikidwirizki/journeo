import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, orderBy, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { Trip, ItineraryItem, Expense, Attachment, Outfit, PackingItem } from '../types';
import { getAuth } from 'firebase/auth';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const auth = getAuth();
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const getTrips = async (userId: string): Promise<Trip[]> => {
  try {
    const q = query(collection(db, 'trips'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    const trips = snapshot.docs.map(doc => doc.data() as Trip);
    return trips.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'trips');
    return [];
  }
};

export const getAllTrips = async (): Promise<Trip[]> => {
  try {
    const q = query(collection(db, 'trips'), where('isPublic', '==', true));
    const snapshot = await getDocs(q);
    const trips = snapshot.docs.map(doc => doc.data() as Trip);
    return trips.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'trips_all');
    return [];
  }
};

export const getTrip = async (id: string): Promise<Trip | null> => {
  try {
    const docRef = doc(db, 'trips', id);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? (snapshot.data() as Trip) : null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `trips/${id}`);
    return null;
  }
};

export const saveTrip = async (trip: Trip): Promise<Trip> => {
  try {
    await setDoc(doc(db, 'trips', trip.id), trip);
    return trip;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `trips/${trip.id}`);
    return trip;
  }
};

export const deleteTrip = async (id: string): Promise<void> => {
  try {
    const batch = writeBatch(db);

    const subcollections = ['itinerary', 'expenses', 'attachments', 'outfits', 'packingItems'];
    for (const sub of subcollections) {
      const q = query(collection(db, 'trips', id, sub));
      const snaps = await getDocs(q);
      snaps.forEach(docSnap => {
        batch.delete(docSnap.ref);
      });
    }

    batch.delete(doc(db, 'trips', id));
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `trips/${id}`);
  }
};

export const getTripItinerary = async (tripId: string): Promise<ItineraryItem[]> => {
  try {
    const q = query(collection(db, 'trips', tripId, 'itinerary'));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(doc => doc.data() as ItineraryItem);
    return items.sort((a, b) => {
      if (a.date === b.date) {
        if (!a.time) return 1;
        if (!b.time) return -1;
        return a.time.localeCompare(b.time);
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `trips/${tripId}/itinerary`);
    return [];
  }
};

export const saveItineraryItem = async (item: ItineraryItem): Promise<ItineraryItem> => {
  try {
    await setDoc(doc(db, 'trips', item.tripId, 'itinerary', item.id), item);
    return item;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `trips/${item.tripId}/itinerary/${item.id}`);
    return item;
  }
};

export const deleteItineraryItem = async (tripId: string, id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'trips', tripId, 'itinerary', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `trips/${tripId}/itinerary/${id}`);
  }
};

export const getTripExpenses = async (tripId: string): Promise<Expense[]> => {
  try {
    const q = query(collection(db, 'trips', tripId, 'expenses'));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(doc => doc.data() as Expense);
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `trips/${tripId}/expenses`);
    return [];
  }
};

export const saveExpense = async (item: Expense): Promise<Expense> => {
  try {
    await setDoc(doc(db, 'trips', item.tripId, 'expenses', item.id), item);
    return item;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `trips/${item.tripId}/expenses/${item.id}`);
    return item;
  }
};

export const deleteExpense = async (tripId: string, id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'trips', tripId, 'expenses', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `trips/${tripId}/expenses/${id}`);
  }
};

export const getTripAttachments = async (tripId: string): Promise<Attachment[]> => {
  try {
    const q = query(collection(db, 'trips', tripId, 'attachments'));
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map(doc => doc.data() as Attachment);
    return items.sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `trips/${tripId}/attachments`);
    return [];
  }
};

export const saveAttachment = async (item: Attachment): Promise<Attachment> => {
  try {
    await setDoc(doc(db, 'trips', item.tripId, 'attachments', item.id), item);
    return item;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `trips/${item.tripId}/attachments/${item.id}`);
    return item;
  }
};

export const deleteAttachment = async (tripId: string, id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'trips', tripId, 'attachments', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `trips/${tripId}/attachments/${id}`);
  }
};

export const getTripOutfits = async (tripId: string): Promise<Outfit[]> => {
  try {
    const q = query(collection(db, 'trips', tripId, 'outfits'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as Outfit);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `trips/${tripId}/outfits`);
    return [];
  }
};

export const saveOutfit = async (item: Outfit): Promise<Outfit> => {
  try {
    await setDoc(doc(db, 'trips', item.tripId, 'outfits', item.id), item);
    return item;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `trips/${item.tripId}/outfits/${item.id}`);
    return item;
  }
};

export const deleteOutfit = async (tripId: string, id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'trips', tripId, 'outfits', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `trips/${tripId}/outfits/${id}`);
  }
};

export const getTripPackingList = async (tripId: string): Promise<PackingItem[]> => {
  try {
    const q = query(collection(db, 'trips', tripId, 'packingItems'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as PackingItem);
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, `trips/${tripId}/packingItems`);
    return [];
  }
};

export const savePackingItem = async (item: PackingItem): Promise<PackingItem> => {
  try {
    await setDoc(doc(db, 'trips', item.tripId, 'packingItems', item.id), item);
    return item;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `trips/${item.tripId}/packingItems/${item.id}`);
    return item;
  }
};

export const deletePackingItem = async (tripId: string, id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'trips', tripId, 'packingItems', id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `trips/${tripId}/packingItems/${id}`);
  }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      // If it's not an image, just return the base64
      if (!file.type.startsWith('image/')) {
        return resolve(reader.result as string);
      }
      
      // Create an image to resize
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Max dimension
        const MAX_DIM = 2000;
        if (width > height) {
          if (width > MAX_DIM) {
             height *= MAX_DIM / width;
             width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
             width *= MAX_DIM / height;
             height = MAX_DIM;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // If we are saving as JPEG, fill with white background first to avoid black transparency
          if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
          }
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL(file.type || 'image/png', 0.85); 
          resolve(dataUrl);
        } else {
          resolve(reader.result as string);
        }
      };
      img.onerror = () => resolve(reader.result as string); // fallback
    };
    reader.onerror = error => reject(error);
  });
};
