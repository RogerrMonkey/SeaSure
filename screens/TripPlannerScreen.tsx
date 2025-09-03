import { useEffect, useState } from "react"
import { View, Text, StyleSheet, FlatList, Modal, TextInput } from "react-native"
import { Button, Card, SectionTitle } from "../components/ui"
import { Storage } from "../services/storage"
import type { TripPlan } from "../types"
import { optimizeOrder } from "../utils/geo"
import { theme } from "../theme/colors"

export default function TripPlannerScreen() {
  const [trips, setTrips] = useState<TripPlan[]>([])
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [waypoints, setWaypoints] = useState<{ lat: string; lon: string; label?: string }[]>([
    { lat: "", lon: "", label: "" },
  ])

  useEffect(() => {
    ;(async () => setTrips(await Storage.getTrips()))()
  }, [])

  const addWaypointField = () => setWaypoints([...waypoints, { lat: "", lon: "", label: "" }])

  const plan = async () => {
    const points = waypoints
      .map((w) => ({ lat: Number(w.lat), lon: Number(w.lon), label: w.label?.trim() }))
      .filter((p) => !Number.isNaN(p.lat) && !Number.isNaN(p.lon))
    const start = points[0] ?? { lat: 18.97, lon: 72.82 }
    const order = optimizeOrder(start, points)
    const trip: TripPlan = {
      id: `${Date.now()}`,
      name: name.trim() || "Trip",
      waypoints: points,
      optimizedOrder: order,
      createdAt: Date.now(),
      syncStatus: "pending",
    }
    const next = [trip, ...trips]
    setTrips(next)
    await Storage.saveTrips(next)
    setOpen(false)
    setName("")
    setWaypoints([{ lat: "", lon: "", label: "" }])
  }

  return (
    <View style={styles.container}>
      <SectionTitle>Trip Plans</SectionTitle>
      <Button title="New Trip" onPress={() => setOpen(true)} style={{ marginBottom: 12 }} />
      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 8 }}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.meta}>Waypoints: {item.waypoints.length}</Text>
            {item.optimizedOrder && (
              <Text style={styles.meta}>
                Optimized order: {item.optimizedOrder.map((i) => item.waypoints[i].label || i + 1).join(" ➝ ")}
              </Text>
            )}
            <Text style={{ color: "#475569" }}>Status: {item.syncStatus}</Text>
          </Card>
        )}
        ListEmptyComponent={<Text style={{ color: "#64748B" }}>No trips planned yet.</Text>}
      />

      <Modal transparent animationType="slide" visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Trip</Text>
            <TextInput style={styles.input} placeholder="Trip name" value={name} onChangeText={setName} />
            {waypoints.map((w, idx) => (
              <View key={idx} style={{ gap: 6, marginBottom: 6 }}>
                <Text style={{ fontWeight: "600" }}>Waypoint {idx + 1}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Lat (e.g. 18.97)"
                  keyboardType="numeric"
                  value={w.lat}
                  onChangeText={(t) => {
                    const copy = [...waypoints]
                    copy[idx].lat = t
                    setWaypoints(copy)
                  }}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Lon (e.g. 72.82)"
                  keyboardType="numeric"
                  value={w.lon}
                  onChangeText={(t) => {
                    const copy = [...waypoints]
                    copy[idx].lon = t
                    setWaypoints(copy)
                  }}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Label (optional)"
                  value={w.label}
                  onChangeText={(t) => {
                    const copy = [...waypoints]
                    copy[idx].label = t
                    setWaypoints(copy)
                  }}
                />
              </View>
            ))}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button title="Add Waypoint" variant="ghost" onPress={addWaypointField} style={{ flex: 1 }} />
              <Button title="Save Plan" onPress={plan} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#FFFFFF" },
  title: { fontSize: 16, fontWeight: "700", color: theme.fg, marginBottom: 4 },
  meta: { color: "#475569", marginBottom: 4 },
  modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: "#FFFFFF", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16, gap: 8 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
})
