/**
 * SyncService
 *
 * Monitors network connectivity and uploads queued attendance records
 * to AWS (API Gateway → Lambda → DynamoDB) when connectivity returns.
 *
 * Features:
 *  - NetInfo-driven trigger (fires on network reconnect)
 *  - Batch upload (configurable batch size)
 *  - Exponential back-off retry with cap
 *  - Local purge on confirmed upload
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import {
  getPendingSyncItems,
  markSyncSuccess,
  incrementRetryCount,
  removeFailedSyncItems,
  getPendingSyncCount,
} from './Database';
import { AWS_CONFIG, SYNC_BATCH_SIZE, SYNC_RETRY_LIMIT, SYNC_RETRY_DELAY_MS } from '../constants';

type SyncStatus = 'IDLE' | 'SYNCING' | 'ERROR' | 'DONE';

let _status: SyncStatus = 'IDLE';
let _unsubscribe: (() => void) | null = null;
let _onStatusChange: ((status: SyncStatus, pendingCount: number) => void) | null = null;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Starts watching network state.  Call once on app mount.
 */
export function startSyncMonitor(
  onStatusChange?: (status: SyncStatus, pendingCount: number) => void
): void {
  _onStatusChange = onStatusChange ?? null;

  _unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
    if (state.isConnected && state.isInternetReachable) {
      triggerSync();
    }
  });

  // Also attempt immediately in case already online
  NetInfo.fetch().then(state => {
    if (state.isConnected && state.isInternetReachable) triggerSync();
  });
}

/**
 * Stops the network monitor.  Call on app unmount.
 */
export function stopSyncMonitor(): void {
  _unsubscribe?.();
  _unsubscribe = null;
}

/**
 * Manually trigger a sync attempt (e.g. pull-to-refresh).
 */
export async function triggerSync(): Promise<void> {
  if (_status === 'SYNCING') return;
  _status = 'SYNCING';
  _emit();

  try {
    await syncBatch();
    await removeFailedSyncItems(SYNC_RETRY_LIMIT);
    _status = 'DONE';
  } catch {
    _status = 'ERROR';
  }

  _emit();
  setTimeout(() => { _status = 'IDLE'; _emit(); }, 3000);
}

// ─── Internal ─────────────────────────────────────────────────────────────────

async function syncBatch(): Promise<void> {
  let items = await getPendingSyncItems(SYNC_BATCH_SIZE);

  while (items.length > 0) {
    for (const item of items) {
      let success = false;
      let delay = SYNC_RETRY_DELAY_MS;

      for (let attempt = 0; attempt <= SYNC_RETRY_LIMIT; attempt++) {
        try {
          await uploadRecord(item.payload);
          await markSyncSuccess(item.id, item.recordId);
          success = true;
          break;
        } catch {
          if (attempt < SYNC_RETRY_LIMIT) {
            await sleep(delay);
            delay = Math.min(delay * 2, 30000); // cap at 30s
          }
        }
      }

      if (!success) await incrementRetryCount(item.id);
    }

    items = await getPendingSyncItems(SYNC_BATCH_SIZE);
  }
}

async function uploadRecord(payload: string): Promise<void> {
  const response = await fetch(`${AWS_CONFIG.apiEndpoint}/attendance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'YOUR_API_KEY', // replace with Cognito / IAM auth in production
    },
    body: payload,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

async function _emit(): Promise<void> {
  if (!_onStatusChange) return;
  const count = await getPendingSyncCount();
  _onStatusChange(_status, count);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export type { SyncStatus };
