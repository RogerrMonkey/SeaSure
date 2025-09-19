import { useEffect, useState } from "react"
import { View, Text, StyleSheet, FlatList } from "react-native"
import { Button, Card, SectionTitle, Badge } from "../components/ui"
import type { AlertItem } from "../types"
import { listAlerts, markAlertRead, seedSeasonalBanIfEmpty } from "../services/alerts"
import { theme } from "../theme/colors"

export default function AlertsScreen() {
  const [items, setItems] = useState<AlertItem[]>([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      await seedSeasonalBanIfEmpty()
      setItems(await listAlerts())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const markRead = async (id: string) => {
    await markAlertRead(id)
    await load()
  }

  return (
    <View style={styles.container}>
      <SectionTitle>Alerts</SectionTitle>
      <Button title="Reload" variant="ghost" onPress={load} style={{ marginBottom: 12 }} />
      <FlatList
        data={items}
        keyExtractor={(a) => a.id}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 8 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={styles.title}>{item.title}</Text>
              {!item.read && <Badge text="New" variant={item.severity === "danger" ? "danger" : "warning"} />}
            </View>
            <Text style={styles.meta}>
              {new Date(item.timestamp).toLocaleString()} • {item.type}
            </Text>
            <Text style={{ color: "#334155", marginTop: 6 }}>{item.message}</Text>
            {!item.read && (
              <Button title="Mark Read" variant="ghost" onPress={() => markRead(item.id)} style={{ marginTop: 8 }} />
            )}
          </Card>
        )}
        ListEmptyComponent={<Text style={{ color: "#64748B" }}>No alerts.</Text>}
        refreshing={loading}
        onRefresh={load}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#FFFFFF" },
  title: { fontSize: 16, fontWeight: "700", color: theme.fg },
  meta: { color: "#475569", marginTop: 4 },
})
