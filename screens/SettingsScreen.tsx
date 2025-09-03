import { useEffect, useState } from "react"
import { View, Text, StyleSheet, Switch, Alert } from "react-native"
import { Button, Card, SectionTitle } from "../components/ui"
import { Storage } from "../services/storage"
import type { AppSettings } from "../types"
import { theme } from "../theme/colors"

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings>({ lowPowerMode: true, gpsPollSeconds: 60 })

  useEffect(() => {
    ;(async () => setSettings(await Storage.getSettings()))()
  }, [])

  const update = async (next: Partial<AppSettings>) => {
    const merged = { ...settings, ...next }
    setSettings(merged)
    await Storage.saveSettings(merged)
  }

  const clearCache = async () => {
    await Storage.saveCatches([])
    await Storage.saveTrips([])
    await Storage.saveForecast(null)
    await Storage.saveAlerts([])
    Alert.alert("Cleared", "Offline cache cleared.")
  }

  const syncNow = async () => {
    // TODO: integrate Firebase Firestore sync
    Alert.alert("Sync", "Offline items queued for sync (stub).")
  }

  return (
    <View style={styles.container}>
      <SectionTitle>Settings</SectionTitle>

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.label}>Low Power Mode</Text>
        <View style={styles.row}>
          <Text style={styles.help}>Reduces GPS polling to save battery.</Text>
          <Switch value={settings.lowPowerMode} onValueChange={(v) => update({ lowPowerMode: v })} />
        </View>
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.label}>GPS Poll Interval (seconds)</Text>
        <View style={styles.row}>
          <Button
            title="-30"
            variant="ghost"
            onPress={() => update({ gpsPollSeconds: Math.max(30, settings.gpsPollSeconds - 30) })}
          />
          <Text style={styles.value}>{settings.gpsPollSeconds}</Text>
          <Button
            title="+30"
            variant="ghost"
            onPress={() => update({ gpsPollSeconds: Math.min(300, settings.gpsPollSeconds + 30) })}
          />
        </View>
      </Card>

      <Card style={{ marginBottom: 12 }}>
        <Text style={styles.label}>Offline Data</Text>
        <View style={styles.row}>
          <Button title="Clear Cache" variant="danger" onPress={clearCache} />
          <Button title="Sync Now" onPress={syncNow} />
        </View>
      </Card>

      <Text style={{ color: "#64748B" }}>
        API and Firebase integration are intentionally stubbed to emphasize the offline-first frontend.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#FFFFFF" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8 },
  label: { fontSize: 16, fontWeight: "700", color: theme.fg },
  help: { color: "#475569", flex: 1, marginRight: 8 },
  value: { fontWeight: "700", color: theme.fg },
})
