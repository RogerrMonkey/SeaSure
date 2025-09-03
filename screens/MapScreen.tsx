import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native"
import MapView, { Marker, Polygon } from "react-native-maps"
import { ZONES, isFishingAllowed } from "../data/zones"
import { theme } from "../theme/colors"
import { Ionicons } from "@expo/vector-icons"
import * as Location from "expo-location"

export default function MapScreen() {
  const [position, setPosition] = useState<{ lat: number; lon: number } | null>(null)
  
  // Initial position - Mumbai coast as default
  const [region] = useState({
    latitude: 19.0760,
    longitude: 72.8777,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  })

  // Get user location
  useEffect(() => {
    ;(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({ 
            accuracy: Location.Accuracy.Balanced 
          })
          setPosition({ 
            lat: loc.coords.latitude, 
            lon: loc.coords.longitude 
          })
        }
      } catch (error) {
        console.log("Location error:", error)
        // Fallback to Mumbai coordinates
        setPosition({ lat: 19.0760, lon: 72.8777 })
      }
    })()
  }, [])

  const getZoneColor = (zone: any) => {
    if (zone.kind === "restricted") return "rgba(255, 0, 0, 0.3)"
    if (zone.season === "banned") return "rgba(255, 165, 0, 0.3)"
    if (!isFishingAllowed(zone)) return "rgba(255, 255, 0, 0.3)"
    return "rgba(0, 255, 0, 0.3)"
  }

  const getZoneStrokeColor = (zone: any) => {
    if (zone.kind === "restricted") return "#ff0000"
    if (zone.season === "banned") return "#ffa500"
    if (!isFishingAllowed(zone)) return "#ffff00"
    return "#00ff00"
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
      >
        {/* Render fishing zones */}
        {ZONES.map((zone) => (
          <Polygon
            key={zone.id}
            coordinates={zone.coordinates.map(coord => ({
              latitude: coord.lat,
              longitude: coord.lon
            }))}
            fillColor={getZoneColor(zone)}
            strokeColor={getZoneStrokeColor(zone)}
            strokeWidth={2}
          />
        ))}

        {/* Default Mumbai marker */}
        <Marker
          coordinate={{
            latitude: 19.0760,
            longitude: 72.8777
          }}
          title="Mumbai Coast"
          description="Indian fishing waters"
        />

        {/* User location marker */}
        {position && (
          <Marker
            coordinate={{
              latitude: position.lat,
              longitude: position.lon
            }}
            title="Your Location"
            description="Current position"
          >
            <View style={styles.boatMarker}>
              <Ionicons name="boat" size={24} color={theme.primary} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Info overlay */}
      <View style={styles.overlay}>
        <View style={styles.infoCard}>
          <Text style={styles.title}>Indian Fishing Zones</Text>
          <Text style={styles.subtitle}>
            � Safe Zones  🟡 Restricted  🔴 Prohibited
          </Text>
          {position ? (
            <Text style={styles.coordinates}>
              📍 {position.lat.toFixed(4)}°N, {position.lon.toFixed(4)}°E
            </Text>
          ) : (
            <Text style={styles.coordinates}>
              📍 Mumbai Coast - 19.0760°N, 72.8777°E
            </Text>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  map: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.fg,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.muted,
    marginBottom: 8,
  },
  coordinates: {
    fontSize: 12,
    color: theme.muted,
  },
  boatMarker: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
})
