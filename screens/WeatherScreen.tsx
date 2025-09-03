import React, { useEffect, useState } from "react"
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert } from "react-native"
import { Card, Badge } from "../components/ui"
import { theme } from "../theme/colors"
import { Ionicons } from "@expo/vector-icons"
import * as Location from "expo-location"
import { weatherService, type MarineWeather } from "../services/weather"

export default function WeatherScreen() {
  const [weather, setWeather] = useState<MarineWeather | null>(null)
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState<{ lat: number; lon: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchWeatherData = async () => {
    if (!position) return
    
    setLoading(true)
    setError(null)
    
    try {
      const data = await weatherService.getCurrentWeather(position.lat, position.lon)
      setWeather(data)
    } catch (err) {
      console.error("Weather fetch error:", err)
      setError("Failed to fetch weather data. Please check your internet connection.")
    } finally {
      setLoading(false)
    }
  }

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission needed", "Location access is required for marine weather data.")
        return
      }

      const loc = await Location.getCurrentPositionAsync({ 
        accuracy: Location.Accuracy.Balanced 
      })
      
      setPosition({ 
        lat: loc.coords.latitude, 
        lon: loc.coords.longitude 
      })
    } catch (error) {
      console.error("Location error:", error)
      setError("Could not get your location. Using default coordinates.")
      // Default to Mumbai coast
      setPosition({ lat: 19.0760, lon: 72.8777 })
    }
  }

  useEffect(() => {
    getLocation()
  }, [])

  useEffect(() => {
    if (position) {
      fetchWeatherData()
    }
  }, [position])

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case "Excellent": return "sunny"
      case "Good": return "partly-sunny"
      case "Poor": return "cloudy"
      case "Dangerous": return "thunderstorm"
      default: return "help-circle"
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "Excellent": return "#10b981"
      case "Good": return "#3b82f6"
      case "Poor": return "#f59e0b"
      case "Dangerous": return "#ef4444"
      default: return theme.muted
    }
  }

  if (error && !weather) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="warning" size={48} color={theme.warn} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    )
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchWeatherData} />
      }
    >
      <View style={styles.content}>
        <Text style={styles.title}>Marine Weather</Text>
        
        {position && (
          <Text style={styles.locationText}>
            📍 {position.lat.toFixed(4)}°N, {position.lon.toFixed(4)}°E
          </Text>
        )}

        {weather ? (
          <>
            {/* Current Conditions */}
            <Card style={styles.mainCard}>
              <View style={styles.conditionsHeader}>
                <Ionicons 
                  name={getConditionIcon(weather.fishingConditions)} 
                  size={40} 
                  color={getConditionColor(weather.fishingConditions)} 
                />
                <View style={styles.conditionsInfo}>
                  <Text style={styles.temperature}>{weather.temperature}°C</Text>
                  <Badge 
                    label={weather.fishingConditions} 
                    tone={
                      weather.fishingConditions === "Excellent" ? "success" :
                      weather.fishingConditions === "Dangerous" ? "danger" :
                      weather.fishingConditions === "Poor" ? "warn" : "default"
                    }
                  />
                </View>
              </View>
            </Card>

            {/* Marine Details */}
            <View style={styles.detailsGrid}>
              <Card style={styles.detailCard}>
                <Ionicons name="speedometer" size={24} color={theme.primary} />
                <Text style={styles.detailLabel}>Wind Speed</Text>
                <Text style={styles.detailValue}>{weather.windSpeed} km/h</Text>
                <Text style={styles.detailExtra}>{weather.windDirection}°</Text>
              </Card>

              <Card style={styles.detailCard}>
                <Ionicons name="water" size={24} color={theme.primary} />
                <Text style={styles.detailLabel}>Wave Height</Text>
                <Text style={styles.detailValue}>{weather.waveHeight}m</Text>
              </Card>

              <Card style={styles.detailCard}>
                <Ionicons name="eye" size={24} color={theme.primary} />
                <Text style={styles.detailLabel}>Visibility</Text>
                <Text style={styles.detailValue}>{weather.visibility} km</Text>
              </Card>

              <Card style={styles.detailCard}>
                <Ionicons name="thermometer" size={24} color={theme.primary} />
                <Text style={styles.detailLabel}>Humidity</Text>
                <Text style={styles.detailValue}>{weather.humidity}%</Text>
              </Card>
            </View>

            {/* Additional Info */}
            <Card style={styles.infoCard}>
              <Text style={styles.infoTitle}>Marine Conditions</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Barometric Pressure:</Text>
                <Text style={styles.infoValue}>{weather.pressure} hPa</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>UV Index:</Text>
                <Text style={styles.infoValue}>{weather.uvIndex}</Text>
              </View>
            </Card>

            {/* Warnings */}
            {weather.warnings.length > 0 && (
              <Card style={styles.warningsCard}>
                <View style={styles.warningsHeader}>
                  <Ionicons name="warning" size={20} color={theme.warn} />
                  <Text style={styles.warningsTitle}>Weather Warnings</Text>
                </View>
                {weather.warnings.map((warning, index) => (
                  <Text key={index} style={styles.warningText}>• {warning}</Text>
                ))}
              </Card>
            )}

            {/* Fishing Recommendations */}
            <Card style={styles.recommendationsCard}>
              <Text style={styles.recommendationsTitle}>Fishing Recommendations</Text>
              <Text style={styles.recommendationsText}>
                {weather.fishingConditions === "Excellent" && "Perfect conditions for deep sea fishing! Calm waters and good visibility."}
                {weather.fishingConditions === "Good" && "Good fishing conditions. Take standard safety precautions."}
                {weather.fishingConditions === "Poor" && "Challenging conditions. Consider staying closer to shore."}
                {weather.fishingConditions === "Dangerous" && "Dangerous conditions! Return to shore immediately and avoid fishing until conditions improve."}
              </Text>
            </Card>
          </>
        ) : (
          <View style={styles.centerContent}>
            <Ionicons name="cloud-download" size={48} color={theme.muted} />
            <Text style={styles.loadingText}>Loading weather data...</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  content: {
    padding: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: theme.fg,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: theme.muted,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 16,
    color: theme.muted,
    textAlign: "center",
    marginTop: 16,
  },
  loadingText: {
    fontSize: 16,
    color: theme.muted,
    marginTop: 16,
  },
  mainCard: {
    marginBottom: 20,
  },
  conditionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  conditionsInfo: {
    flex: 1,
    marginLeft: 16,
  },
  temperature: {
    fontSize: 32,
    fontWeight: "700",
    color: theme.fg,
    marginBottom: 8,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  detailCard: {
    width: "48%",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: theme.muted,
    marginTop: 8,
    textAlign: "center",
  },
  detailValue: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.fg,
    marginTop: 4,
  },
  detailExtra: {
    fontSize: 12,
    color: theme.muted,
    marginTop: 2,
  },
  infoCard: {
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.fg,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: theme.muted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.fg,
  },
  warningsCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.warn,
    marginBottom: 20,
  },
  warningsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  warningsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.fg,
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    color: theme.muted,
    marginBottom: 4,
  },
  recommendationsCard: {
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.primary,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.primary,
    marginBottom: 8,
  },
  recommendationsText: {
    fontSize: 14,
    color: theme.fg,
    lineHeight: 20,
  },
})
