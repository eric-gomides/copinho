import {
  initialize,
  requestPermission,
  insertRecords,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

let _initialized = false;
let _hasPermission = false;

export async function initHealthConnect(): Promise<boolean> {
  try {
    const status = await getSdkStatus();
    if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) return false;
    _initialized = await initialize();
    return _initialized;
  } catch {
    return false;
  }
}

/**
 * Must be called from a user gesture (e.g., button tap) — NOT on app startup.
 * The underlying Android ActivityResultLauncher requires the Activity to be
 * fully resumed before launching a permission dialog.
 */
export async function requestHCPermissions(): Promise<boolean> {
  try {
    if (!_initialized) return false;
    const granted = await requestPermission([
      { accessType: 'write', recordType: 'Hydration' },
      { accessType: 'read',  recordType: 'Hydration' },
    ]);
    _hasPermission = granted.some(p => p.recordType === 'Hydration' && p.accessType === 'write');
    return _hasPermission;
  } catch {
    return false;
  }
}

export async function writeHydrationRecord(ml: number): Promise<void> {
  // Guard: skip if not initialized or no permission
  if (!_initialized) return;
  try {
    const now = new Date().toISOString();
    await insertRecords([
      {
        recordType: 'Hydration',
        volume: { value: ml / 1000, unit: 'liters' },
        startTime: now,
        endTime: now,
      },
    ]);
  } catch {
    // Silent — HC may not be available or permission may not be granted yet
  }
}

export async function readTodayHydration(): Promise<number> {
  if (!_initialized) return 0;
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const records = await readRecords('Hydration', {
      timeRangeFilter: {
        operator: 'between',
        startTime: today.toISOString(),
        endTime: new Date().toISOString(),
      },
    });
    return records.records.reduce((sum: number, r: any) => {
      return sum + (r.volume?.inLiters ?? r.volume?.value ?? 0) * 1000;
    }, 0);
  } catch {
    return 0;
  }
}
