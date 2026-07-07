import { useState, useEffect } from 'react';
import { localDb } from './local-db';
import { SyncQueueItem } from '@/types';

// Simple event emitter for reactive updates on sync status changes
class SyncStatusEmitter extends EventTarget {
  notify() {
    this.dispatchEvent(new Event('change'));
  }
}

export const syncEmitter = new SyncStatusEmitter();

let isSyncing = false;
let retryTimers: Record<string, NodeJS.Timeout> = {};

// Helper to determine if we are currently online
export function isOnline(): boolean {
  if (typeof window === 'undefined') return false;
  return window.navigator.onLine;
}

// Exponential backoff mapping
function getBackoffDelay(retryCount: number): number {
  const base = 5000; // 5 seconds
  const delay = base * Math.pow(2, Math.min(retryCount, 6)); // cap at 2^6 * 5s = 320s (~5 mins)
  return delay;
}

// Map of temporary IDs generated offline to permanent IDs returned by the server
const tempIdMap: Record<string, string> = {};

/**
 * Resolves temporary IDs in payloads with their final server-synced IDs.
 */
function resolvePayloadReferences(payload: any): any {
  let jsonStr = JSON.stringify(payload);
  
  // Search and replace all instances of temporary IDs with permanent ones
  Object.entries(tempIdMap).forEach(([tempId, realId]) => {
    // Replace exact occurrences inside the JSON string
    const regex = new RegExp(tempId, 'g');
    jsonStr = jsonStr.replace(regex, realId);
  });

  return JSON.parse(jsonStr);
}

/**
 * Main function to trigger sync processing.
 */
export async function triggerSync(): Promise<void> {
  if (isSyncing || !localDb || !isOnline()) return;

  isSyncing = true;
  syncEmitter.notify();

  try {
    // Pull pending queue items ordered by creation time
    const pendingItems = await localDb.sync_queue
      .where('sync_status')
      .anyOf(['pending', 'failed'])
      .sortBy('created_at');

    for (const item of pendingItems) {
      // Process items sequentially to preserve order of execution (idempotency)
      await processQueueItem(item);
    }
  } catch (error) {
    console.error('Error running synchronization loop:', error);
  } finally {
    isSyncing = false;
    syncEmitter.notify();
  }
}

/**
 * Process a single queue item.
 */
async function processQueueItem(item: SyncQueueItem): Promise<void> {
  if (!localDb) return;

  // Mark status as processing
  await localDb.sync_queue.update(item.id, { sync_status: 'processing' });
  syncEmitter.notify();

  // Resolve temporary foreign key references
  const resolvedPayload = resolvePayloadReferences(item.payload);

  try {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: item.id,
        entity_type: item.entity_type,
        action: item.action,
        payload: resolvedPayload
      })
    });

    if (response.ok) {
      const data = await response.json();

      // If the server resolved a temporary ID to a permanent database ID, record the mapping
      if (data.tempId && data.realId) {
        tempIdMap[data.tempId] = data.realId;
      }

      // Update the local store status of the item that was processed
      await updateLocalStoreAfterSync(item.entity_type, resolvedPayload, data.realId || resolvedPayload.id);

      // Successfully synced: remove from queue
      await localDb.sync_queue.delete(item.id);
      console.log(`Synced successfully: ${item.entity_type} ${item.action}`);
    } else {
      const errorMsg = await response.text();
      throw new Error(`Server returned ${response.status}: ${errorMsg}`);
    }
  } catch (error) {
    console.error(`Failed to sync item ${item.id}:`, error);

    // Calculate retry delay with backoff
    const nextRetryCount = item.retry_count + 1;
    const delay = getBackoffDelay(item.retry_count);

    await localDb.sync_queue.update(item.id, {
      sync_status: 'failed',
      retry_count: nextRetryCount,
      last_retry_time: Date.now()
    });

    // Schedule automatic retry
    if (retryTimers[item.id]) clearTimeout(retryTimers[item.id]);
    retryTimers[item.id] = setTimeout(() => {
      triggerSync();
    }, delay);
  } finally {
    syncEmitter.notify();
  }
}

/**
 * Updates IndexedDB entity table after a successful sync to set status to 'synced'.
 */
async function updateLocalStoreAfterSync(
  entityType: SyncQueueItem['entity_type'],
  payload: any,
  realId: string
): Promise<void> {
  if (!localDb) return;

  try {
    switch (entityType) {
      case 'product':
        // Update the commodity ID if server generated a new one
        if (payload.id !== realId) {
          const item = await localDb.commodities.get(payload.id);
          if (item) {
            await localDb.commodities.delete(payload.id);
            await localDb.commodities.put({ ...item, id: realId });
          }
        }
        break;

      case 'member':
        if (payload.id !== realId) {
          const item = await localDb.members.get(payload.id);
          if (item) {
            await localDb.members.delete(payload.id);
            await localDb.members.put({ ...item, id: realId });
          }
        }
        break;

      case 'sale':
        await localDb.transactions.update(payload.id, { status: 'synced' });
        break;

      case 'purchase':
        await localDb.purchases.update(payload.id, { status: 'synced' });
        break;

      case 'stock_opname':
        await localDb.stock_opnames.update(payload.id, { status: 'synced' });
        break;
      
      case 'stock':
        // Raw stock update, local is already updated optimistically
        break;
    }
  } catch (err) {
    console.error('Error updating local entity status after sync:', err);
  }
}

/**
 * Custom React hook to observe connection status and synchronization queues.
 */
export function useSyncStatus() {
  const [online, setOnline] = useState<boolean>(true);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setOnline(window.navigator.onLine);

    const handleOnline = () => {
      setOnline(true);
      triggerSync();
    };
    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check and trigger
    triggerSync();

    // Query queue count periodically and listen to sync updates
    const updateStats = async () => {
      if (localDb) {
        const count = await localDb.sync_queue.count();
        setQueueCount(count);
      }
      setSyncing(isSyncing);
    };

    updateStats();
    syncEmitter.addEventListener('change', updateStats);

    // Poll every 10 seconds to check queue count & trigger retry if needed
    const pollInterval = setInterval(() => {
      updateStats();
      if (window.navigator.onLine && queueCount > 0) {
        triggerSync();
      }
    }, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      syncEmitter.removeEventListener('change', updateStats);
      clearInterval(pollInterval);
    };
  }, [queueCount]);

  let statusText = 'Semua data telah tersinkron';
  if (!online) {
    statusText = queueCount > 0 
      ? `Ada ${queueCount} data menunggu internet untuk sinkronisasi` 
      : 'Bekerja secara offline (lokal)';
  } else if (syncing) {
    statusText = 'Sedang menyinkronkan data ke server...';
  } else if (queueCount > 0) {
    statusText = `Menyinkronkan ulang data (${queueCount} antrean)...`;
  } else {
    statusText = 'Semua data telah tersinkron ke server';
  }

  return {
    online,
    queueCount,
    syncing,
    statusText
  };
}
