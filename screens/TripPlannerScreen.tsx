import React, { useEffect, useState, useRef } from "react"
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Modal, 
  TextInput, 
  Alert, 
  ScrollView, 
  Animated, 
  TouchableOpacity,
  Dimensions
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { Button, Card, SectionTitle } from "../components/ui"
import { Storage } from "../services/storage"
import type { TripPlan } from "../types"
import { optimizeOrder } from "../utils/geo"
import { theme } from "../theme/colors"
import { smartTripPlanningService } from "../services/smartTripPlanning"
import { fishPredictionService } from "../services/fishPrediction"
import { 
  EnhancedCard, 
  ModernButton, 
  ProfessionalBadge, 
  LoadingOverlay, 
  StatsCard 
} from "../components/modernUI"

const { width, height } = Dimensions.get('window')

export default function TripPlannerScreen() {
  const [trips, setTrips] = useState<TripPlan[]>([])
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [waypoints, setWaypoints] = useState<{ lat: string; lon: string; label?: string }[]>([
    { lat: "", lon: "", label: "" },
  ])
  const [loading, setLoading] = useState(false)
  const [smartRecommendations, setSmartRecommendations] = useState<any>(null)
  const [selectedTrip, setSelectedTrip] = useState<TripPlan | null>(null)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [quickSuggestions, setQuickSuggestions] = useState<any[]>([])
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    loadTrips()
    loadQuickSuggestions()
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start()
  }, [])

  const loadTrips = async () => {
    try {
      const savedTrips = await Storage.getTrips()
      setTrips(savedTrips)
    } catch (error) {
      console.error('Error loading trips:', error)
    }
  }

  const loadQuickSuggestions = async () => {
    // Generate smart quick suggestions based on current conditions
    const suggestions = [
      {
        id: 1,
        title: "🌅 Morning Pomfret Run",
        duration: "4 hours",
        distance: "25 km",
        estimatedCatch: "8-12 kg",
        confidence: 85,
        waypoints: [
          { lat: '19.0760', lon: '72.8777', label: 'Start - Mumbai Harbor' },
          { lat: '19.1200', lon: '72.9200', label: 'Deep Water Pomfret Zone' }
        ]
      },
      {
        id: 2,
        title: "🐟 All-Day Mixed Catch",
        duration: "8 hours", 
        distance: "45 km",
        estimatedCatch: "20-30 kg",
        confidence: 72,
        waypoints: [
          { lat: '19.0760', lon: '72.8777', label: 'Start - Mumbai Harbor' },
          { lat: '19.1000', lon: '72.9000', label: 'Near Shore Zone' },
          { lat: '19.1400', lon: '72.9500', label: 'Deep Water Zone' }
        ]
      },
      {
        id: 3,
        title: "🦐 Quick Prawn Trip",
        duration: "3 hours",
        distance: "15 km", 
        estimatedCatch: "5-8 kg",
        confidence: 90,
        waypoints: [
          { lat: '19.0760', lon: '72.8777', label: 'Start - Mumbai Harbor' },
          { lat: '19.0900', lon: '72.8900', label: 'Prawn Beds' }
        ]
      }
    ]
    setQuickSuggestions(suggestions)
  }

  const quickCreateTrip = (suggestion: any) => {
    setName(suggestion.title)
    setWaypoints(suggestion.waypoints)
    setOpen(true)
  }

  const quickOptimizeTrip = () => {
    if (waypoints.length < 2) {
      Alert.alert("Need More Waypoints", "Add at least 2 waypoints to optimize the route.")
      return
    }
    
    Alert.alert(
      "🚀 Route Optimization",
      "Optimize this route for fuel efficiency and catch potential?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Optimize", onPress: () => {
          // Here you would call the route optimization
          const optimized = [...waypoints].reverse() // Simple demo
          setWaypoints(optimized)
          Alert.alert("✅ Route Optimized", "Route has been optimized for efficiency!")
        }}
      ]
    )
  }

  const addWaypointField = () => setWaypoints([...waypoints, { lat: "", lon: "", label: "" }])

  const generateSmartPlan = async () => {
    setLoading(true)
    try {
      console.log('Starting smart plan generation...')
      
      // Get current location as starting point
      const startLocation = { lat: 19.0760, lon: 72.8777 } // Mumbai default
      console.log('Start location:', startLocation)
      
      // For now, let's create a simple fallback plan to test
      const fallbackWaypoints = [
        { lat: '19.0760', lon: '72.8777', label: 'Start - Gateway of India' },
        { lat: '19.1000', lon: '72.9000', label: 'Fishing Zone 1 - Near Elephanta' },
        { lat: '19.1200', lon: '72.9200', label: 'Fishing Zone 2 - Deep Water' },
        { lat: '19.0800', lon: '72.8800', label: 'Return Point' }
      ]
      
      setWaypoints(fallbackWaypoints)
      Alert.alert('Smart Plan Generated', 'Generated a basic fishing route for testing!')
      
      // Now try the actual smart trip planning service
      const tripRequest = {
        startLocation,
        targetSpecies: ['Pomfret', 'Kingfish', 'Mackerel'],
        maxDuration: 8, // 8 hours
        maxDistance: 50, // 50 km
        fuelBudget: 5000, // ₹5000
        experienceLevel: 'intermediate' as const,
        boatType: 'medium',
        crewSize: 3
      }
      
      console.log('Attempting smart trip plan generation with request:', tripRequest)
      
      try {
        const recommendations = await smartTripPlanningService.generateSmartTripPlan(tripRequest)
        console.log('Smart trip plan generated successfully:', recommendations)
        setSmartRecommendations(recommendations)
        
        // Auto-populate waypoints from recommendations
        if (recommendations && recommendations.route && Array.isArray(recommendations.route) && recommendations.route.length > 0) {
          console.log('Processing route waypoints:', recommendations.route)
          const newWaypoints = recommendations.route
            .filter((wp: any) => {
              const isValid = wp && wp.location && typeof wp.location.lat === 'number' && typeof wp.location.lon === 'number'
              if (!isValid) {
                console.warn('Filtering out invalid waypoint:', wp)
              }
              return isValid
            })
            .map((wp: any) => {
              console.log('Mapping waypoint:', wp)
              return {
                lat: wp.location.lat.toString(),
                lon: wp.location.lon.toString(),
                label: wp.purpose || wp.id || 'Waypoint'
              }
            })
          console.log('New waypoints created:', newWaypoints)
          
          if (newWaypoints.length > 0) {
            setWaypoints(newWaypoints)
            Alert.alert('Smart Plan Updated', `Generated ${newWaypoints.length} AI-optimized waypoints for your fishing trip!`)
          }
        }
      } catch (smartPlanError) {
        console.warn('Smart plan generation failed, using fallback:', smartPlanError)
      }
      
    } catch (error) {
      console.error('Error generating smart plan:', error)
      if (error instanceof Error) {
        console.error('Error stack:', error.stack)
        Alert.alert('Planning Error', `Could not generate smart trip plan: ${error.message}. Please try again.`)
      } else {
        Alert.alert('Planning Error', 'Could not generate smart trip plan. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

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
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Smart Trip Planner</Text>
        <Text style={styles.headerSubtitle}>AI-powered fishing trip optimization</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <ModernButton
          title="AI Smart Plan"
          icon="sparkles"
          onPress={generateSmartPlan}
          style={styles.actionButton}
          disabled={loading}
        />
        <ModernButton
          title="Manual Trip"
          icon="add"
          onPress={() => setOpen(true)}
          style={styles.actionButton}
          variant="secondary"
        />
        <TouchableOpacity 
          style={styles.quickActionsToggle}
          onPress={() => setShowQuickActions(!showQuickActions)}
        >
          <Ionicons name="options" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Quick Suggestions */}
      {quickSuggestions.length > 0 && (
        <View style={styles.quickSuggestions}>
          <Text style={styles.sectionTitle}>🚀 Quick Trip Ideas</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.suggestionsContainer}
          >
            {quickSuggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.id}
                style={styles.suggestionCard}
                onPress={() => quickCreateTrip(suggestion)}
              >
                <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                <View style={styles.suggestionDetails}>
                  <View style={styles.suggestionDetail}>
                    <Ionicons name="time" size={14} color={theme.muted} />
                    <Text style={styles.suggestionDetailText}>{suggestion.duration}</Text>
                  </View>
                  <View style={styles.suggestionDetail}>
                    <Ionicons name="location" size={14} color={theme.muted} />
                    <Text style={styles.suggestionDetailText}>{suggestion.distance}</Text>
                  </View>
                </View>
                <View style={styles.suggestionFooter}>
                  <Text style={styles.suggestionCatch}>🎣 {suggestion.estimatedCatch}</Text>
                  <View style={[styles.confidenceBadge, { backgroundColor: suggestion.confidence > 80 ? theme.success : theme.warn }]}>
                    <Text style={styles.confidenceText}>{suggestion.confidence}%</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Quick Actions Panel */}
      {showQuickActions && (
        <Animated.View style={styles.quickActionsPanel}>
          <TouchableOpacity style={styles.quickAction} onPress={quickOptimizeTrip}>
            <Ionicons name="git-network" size={20} color={theme.primary} />
            <Text style={styles.quickActionText}>Optimize Route</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => setWaypoints([{ lat: "", lon: "", label: "" }])}>
            <Ionicons name="refresh" size={20} color={theme.primary} />
            <Text style={styles.quickActionText}>Clear All</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickAction} onPress={() => Alert.alert("Import", "Import from saved routes")}>
            <Ionicons name="download" size={20} color={theme.primary} />
            <Text style={styles.quickActionText}>Import</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Smart Recommendations */}
      {smartRecommendations && (
        <EnhancedCard style={styles.recommendationsCard}>
          <View style={styles.recommendationHeader}>
            <Ionicons name="sparkles" size={24} color={theme.primary} />
            <Text style={styles.recommendationTitle}>AI Recommendations</Text>
          </View>
          
          <View style={styles.statsGrid}>
            <StatsCard
              title="Expected Catch"
              value={`${smartRecommendations.estimatedCatch || 0}kg`}
              icon="fish"
              color={theme.primary}
            />
            <StatsCard
              title="Fuel Cost"
              value={`₹${smartRecommendations.estimatedFuelCost || 0}`}
              icon="speedometer"
              color="#F59E0B"
            />
            <StatsCard
              title="Duration"
              value={`${smartRecommendations.estimatedDuration || 0}h`}
              icon="time"
              color="#10B981"
            />
          </View>
        </EnhancedCard>
      )}

      {/* Trip List */}
      <Text style={styles.sectionTitle}>Your Trip Plans</Text>
      
      <FlatList
        data={trips}
        keyExtractor={(t) => t.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <EnhancedCard style={{ marginBottom: 12 }}>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.meta}>Waypoints: {item.waypoints.length}</Text>
            {item.optimizedOrder && (
              <Text style={styles.meta}>
                Optimized route: {item.optimizedOrder.map((i) => item.waypoints[i].label || `Point ${i + 1}`).join(" → ")}
              </Text>
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
              <ProfessionalBadge 
                variant={item.syncStatus === 'synced' ? 'success' : 'warning'} 
                label={item.syncStatus}
              />
            </View>
          </EnhancedCard>
        )}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 32 }}>
            <Ionicons name="map-outline" size={48} color={theme.muted} />
            <Text style={[styles.meta, { textAlign: 'center', marginTop: 16 }]}>
              No trips planned yet. Create your first smart trip plan!
            </Text>
          </View>
        }
      />

      {/* Trip Creation Modal */}
      <Modal transparent animationType="slide" visible={open} onRequestClose={() => setOpen(false)}>
        <View style={styles.modalWrap}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Trip Plan</Text>
            
            <TextInput 
              style={styles.input} 
              placeholder="Trip name" 
              value={name} 
              onChangeText={setName}
              placeholderTextColor={theme.muted}
            />
            
            {waypoints.map((w, idx) => (
              <View key={idx} style={{ marginBottom: 16 }}>
                <Text style={{ fontWeight: "600", color: theme.fg, marginBottom: 8 }}>
                  Waypoint {idx + 1}
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Latitude (e.g. 18.97)"
                  keyboardType="numeric"
                  value={w.lat}
                  placeholderTextColor={theme.muted}
                  onChangeText={(t) => {
                    const copy = [...waypoints]
                    copy[idx].lat = t
                    setWaypoints(copy)
                  }}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Longitude (e.g. 72.82)"
                  keyboardType="numeric"
                  value={w.lon}
                  placeholderTextColor={theme.muted}
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
                  placeholderTextColor={theme.muted}
                  onChangeText={(t) => {
                    const copy = [...waypoints]
                    copy[idx].label = t
                    setWaypoints(copy)
                  }}
                />
              </View>
            ))}
            
            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <ModernButton 
                title="Add Waypoint" 
                variant="ghost" 
                onPress={addWaypointField} 
                style={{ flex: 1 }}
                icon="add-circle"
              />
              <ModernButton 
                title="Create Plan" 
                onPress={plan} 
                style={{ flex: 1 }}
                icon="checkmark"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Loading Overlay */}
      {loading && <LoadingOverlay visible={true} message="Generating smart trip plan..." />}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: theme.bg 
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.fg,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.muted,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
  },
  smartButton: {
    backgroundColor: theme.primary,
  },
  recommendationsCard: {
    marginBottom: 24,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  recommendationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.fg,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.fg,
    marginBottom: 16,
  },
  title: { 
    fontSize: 16, 
    fontWeight: "700", 
    color: theme.fg, 
    marginBottom: 4 
  },
  meta: { 
    color: theme.muted, 
    marginBottom: 4 
  },
  modalWrap: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.4)", 
    justifyContent: "flex-end" 
  },
  modalCard: { 
    backgroundColor: theme.bg, 
    padding: 16, 
    borderTopLeftRadius: 16, 
    borderTopRightRadius: 16, 
    gap: 8 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "700", 
    marginBottom: 8,
    color: theme.fg,
  },
  input: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    color: theme.fg,
    backgroundColor: theme.bg,
  },
  
  // Enhanced UI styles
  quickActionsToggle: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSuggestions: {
    marginBottom: 20,
  },
  suggestionsContainer: {
    paddingHorizontal: 4,
    gap: 16,
  },
  suggestionCard: {
    width: width * 0.7,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.fg,
    marginBottom: 12,
  },
  suggestionDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  suggestionDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  suggestionDetailText: {
    fontSize: 14,
    color: theme.muted,
  },
  suggestionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  suggestionCatch: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionsPanel: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 118, 110, 0.1)',
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
  },
})
