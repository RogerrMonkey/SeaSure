import AsyncStorage from "@react-native-async-storage/async-storage"
import type { AlertItem, AppSettings, CatchLog, Forecast, TripPlan } from "../types"

const KEYS = {
  CATCHES: "cfm.catches",
  TRIPS: "cfm.trips",
  FORECAST: "cfm.forecast",
  ALERTS: "cfm.alerts",
  SETTINGS: "cfm.settings",
}

async function readJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

async function writeJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value))
}

export const Storage = {
  async getCatches(): Promise<CatchLog[]> {
    return readJSON<CatchLog[]>(KEYS.CATCHES, [])
  },
  async saveCatches(items: CatchLog[]) {
    return writeJSON(KEYS.CATCHES, items)
  },
  async getTrips(): Promise<TripPlan[]> {
    return readJSON<TripPlan[]>(KEYS.TRIPS, [])
  },
  async saveTrips(items: TripPlan[]) {
    return writeJSON(KEYS.TRIPS, items)
  },
  async getForecast(): Promise<Forecast | null> {
    return readJSON<Forecast | null>(KEYS.FORECAST, null as any)
  },
  async saveForecast(f: Forecast | null) {
    return writeJSON(KEYS.FORECAST, f)
  },
  async getAlerts(): Promise<AlertItem[]> {
    return readJSON<AlertItem[]>(KEYS.ALERTS, [])
  },
  async saveAlerts(items: AlertItem[]) {
    return writeJSON(KEYS.ALERTS, items)
  },
  async getSettings(): Promise<AppSettings> {
    return readJSON<AppSettings>(KEYS.SETTINGS, { lowPowerMode: true, gpsPollSeconds: 60 })
  },
  async saveSettings(s: AppSettings) {
    return writeJSON(KEYS.SETTINGS, s)
  },
}
