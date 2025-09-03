import { useEffect, useState } from "react"
import { View, Text, StyleSheet, FlatList, Modal, TextInput } from "react-native"
import { Button, Card, SectionTitle } from "../components/ui"
import { Storage } from "../services/storage"
import type { CatchLog } from "../types"
import { theme } from "../theme/colors"

export default function LogbookScreen() {
  const [items, setItems] = useState<CatchLog[]>([])
  const [open, setOpen] = useState(false)
  const [species, setSpecies] = useState("")
  const [weight, setWeight] = useState("")
  const [qty, setQty] = useState("")

  useEffect(() => {
    ;(async () => {
      setItems(await Storage.getCatches())
    })()
  }, [])

  const add = async () => {
    const entry: CatchLog = {
      id: `${Date.now()}`,
      species: species.trim() || "Unknown",
      weightKg: weight ? Number(weight) : undefined,
      quantity: qty ? Number(qty) : undefined,
      timestamp: Date.now(),
      syncStatus: "pending",
    }
    const next = [entry, ...items]
    setItems(next)
    await Storage.saveCatches(next)
    setOpen(false)
    setSpecies("")
    setWeight("")
    setQty("")
  }

  return (
    <View style={styles.container}>
      <SectionTitle>Catches</SectionTitle>
      <Button title="Add Catch" onPress={() => setOpen(true)} style={{ marginBottom: 12 }} />
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 8 }}>
            <Text style={styles.itemTitle}>{item.species}</Text>
            <Text style={styles.itemMeta}>
              {item.quantity ? `${item.quantity} • ` : ""}
              {item.weightKg ? `${item.weightKg} kg • ` : ""}
              {new Date(item.timestamp).toLocaleString()}
            </Text>
            <Text style={{ color: "#475569" }}>Status: {item.syncStatus}</Text>
          </Card>
        )}
        ListEmptyComponent={<Text style={{ color: "#64748B" }}>No catches logged yet.</Text>}
      />

      <Modal transparent animationType="slide" visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Log Catch</Text>
            <TextInput style={styles.input} placeholder="Species" value={species} onChangeText={setSpecies} />
            <TextInput
              style={styles.input}
              placeholder="Weight (kg)"
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />
            <TextInput
              style={styles.input}
              placeholder="Quantity"
              keyboardType="numeric"
              value={qty}
              onChangeText={setQty}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button title="Cancel" variant="ghost" onPress={() => setOpen(false)} style={{ flex: 1 }} />
              <Button title="Save" onPress={add} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#FFFFFF" },
  itemTitle: { fontSize: 16, fontWeight: "700", color: theme.fg },
  itemMeta: { color: "#475569", marginTop: 4, marginBottom: 4 },
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
