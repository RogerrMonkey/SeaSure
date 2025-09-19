import React, { useState, useEffect, useRef } from "react"
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TouchableOpacity, 
  ScrollView, 
  Animated, 
  Platform,
  Dimensions
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import * as Location from "expo-location"
import MapView, { Marker, Polygon, Circle } from "react-native-maps"

import { theme } from "../theme/colors"
import { ZONES, isFishingAllowed } from "../data/zones"
import { fishPredictionService, FishPrediction } from "../services/fishPrediction"
import { maritimeBoundaryService } from "../services/maritimeBoundary"
import { 
  EnhancedCard, 
  ModernButton, 
  ProfessionalBadge, 
  LoadingOverlay, 
  StatsCard 
} from "../components/modernUI"

const { width, height } = Dimensions.get('window')

interface Position {
  lat: number
  lon: number
}

interface BoundaryStatus {
  isInRestrictedArea: boolean
  nearestBoundary: string
  distanceToNearest: number
  violations: any[]
}

type MapMode = 'zones' | 'predictions' | 'boundaries'

export default function MapScreen() {
  const [position, setPosition] = useState<Position | null>(null)
  const [fishPredictions, setFishPredictions] = useState<FishPrediction[]>([])
  const [boundaryStatus, setBoundaryStatus] = useState<BoundaryStatus | null>(null)
  const [selectedPrediction, setSelectedPrediction] = useState<FishPrediction | null>(null)
  const [mapMode, setMapMode] = useState<MapMode>('zones')
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [showPredictionDetails, setShowPredictionDetails] = useState(false)
  const [loading, setLoading] = useState(false)
  const mapRef = useRef<any>(null)
  const fadeAnim = useRef(new Animated.Value(0)).current

  const region = {
    latitude: 19.0760,
    longitude: 72.8777,
    latitudeDelta: 5.0,
    longitudeDelta: 5.0,
  }

  useEffect(() => {
    getCurrentLocation()
    startBoundaryMonitoring()
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start()
  }, [])

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== "granted") {
        Alert.alert("Permission Required", "Location permission is required for fishing zone navigation.")
        return
      }

      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      })

      if (loc) {
        const userPos = { 
          lat: loc.coords.latitude, 
          lon: loc.coords.longitude 
        }
        setPosition(userPos)
        
        // Get fish predictions for current location
        await loadFishPredictions(userPos)
        
        // Check boundary status
        await checkBoundaryStatus(userPos)
      } else {
        // Fallback to Mumbai coordinates
        const defaultPos = { lat: 19.0760, lon: 72.8777 }
        setPosition(defaultPos)
        await loadFishPredictions(defaultPos)
      }
    } catch (error) {
      console.log("Location error:", error)
      const defaultPos = { lat: 19.0760, lon: 72.8777 }
      setPosition(defaultPos)
      await loadFishPredictions(defaultPos)
    }
  }

  const startBoundaryMonitoring = async () => {
    const success = await maritimeBoundaryService.startBoundaryMonitoring({
      trackingInterval: 30, // 30 seconds
      highAccuracy: true,
      backgroundTracking: false
    })
    
    if (!success) {
      Alert.alert('Boundary Monitoring', 'Could not start boundary monitoring. Please check permissions.')
    }
  }

  const loadFishPredictions = async (location: { lat: number; lon: number }) => {
    setLoading(true)
    try {
      const predictions = await fishPredictionService.generateFishPredictions(location)
      setFishPredictions(predictions.slice(0, 5)) // Show top 5 predictions
    } catch (error) {
      console.error('Error loading fish predictions:', error)
      Alert.alert('Prediction Error', 'Could not load fish predictions. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const checkBoundaryStatus = async (location: { lat: number; lon: number }) => {
    try {
      const status = await maritimeBoundaryService.checkCurrentLocation()
      setBoundaryStatus(status)
    } catch (error) {
      console.error('Error checking boundary status:', error)
    }
  }

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

  const getPredictionColor = (probability: number) => {
    if (probability >= 80) return "#10B981" // High - Green
    if (probability >= 60) return "#F59E0B" // Medium - Yellow
    if (probability >= 40) return "#EF4444" // Low - Red
    return "#94A3B8" // Very Low - Gray
  }

  const onPredictionPress = (prediction: FishPrediction) => {
    setSelectedPrediction(prediction)
    // Animate to prediction location
    mapRef.current?.animateToRegion({
      latitude: prediction.location.lat,
      longitude: prediction.location.lon,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    }, 1000)
  }

  const onMapModeChange = (mode: MapMode) => {
    // Add smooth transition animation
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setMapMode(mode)
      setSelectedPrediction(null)
      setShowPredictionDetails(false)
      
      // Load data for the new mode
      if (mode === 'predictions' && position) {
        loadFishPredictions(position)
      } else if (mode === 'boundaries' && position) {
        checkBoundaryStatus(position)
      }
      
      // Fade back in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start()
    })
  }

  // Quick action handlers
  const quickNavigateToFish = () => {
    if (fishPredictions.length > 0) {
      const bestPrediction = fishPredictions.reduce((best, current) => 
        current.probability > best.probability ? current : best
      )
      
      mapRef.current?.animateToRegion({
        latitude: bestPrediction.location.lat,
        longitude: bestPrediction.location.lon,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 1000)
      
      setSelectedPrediction(bestPrediction)
      setShowPredictionDetails(true)
    }
  }

  const centerOnUser = () => {
    if (position) {
      mapRef.current?.animateToRegion({
        latitude: position.lat,
        longitude: position.lon,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }, 1000)
    }
  }

  const quickPlanTrip = () => {
    if (selectedPrediction) {
      // This would navigate to trip planner with pre-filled data
      Alert.alert(
        "Quick Trip Plan",
        `Plan a trip to catch ${selectedPrediction.species}?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Plan Trip", onPress: () => {
            // Navigate to trip planner
            console.log("Navigate to trip planner")
          }}
        ]
      )
    }
  }

  const refreshData = async () => {
    if (position) {
      await loadFishPredictions(position)
      await checkBoundaryStatus(position)
    }
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Map Mode Selector */}
      <View style={styles.mapModeSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mapModeContent}>
          <TouchableOpacity 
            style={[styles.mapModeButton, mapMode === 'zones' && styles.mapModeButtonActive]}
            onPress={() => onMapModeChange('zones')}
          >
            <Ionicons name="layers" size={20} color={mapMode === 'zones' ? '#FFFFFF' : theme.primary} />
            <Text style={[styles.mapModeText, mapMode === 'zones' && styles.mapModeTextActive]}>Zones</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.mapModeButton, mapMode === 'predictions' && styles.mapModeButtonActive]}
            onPress={() => onMapModeChange('predictions')}
          >
            <Ionicons name="fish" size={20} color={mapMode === 'predictions' ? '#FFFFFF' : theme.primary} />
            <Text style={[styles.mapModeText, mapMode === 'predictions' && styles.mapModeTextActive]}>Fish AI</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.mapModeButton, mapMode === 'boundaries' && styles.mapModeButtonActive]}
            onPress={() => onMapModeChange('boundaries')}
          >
            <Ionicons name="shield-checkmark" size={20} color={mapMode === 'boundaries' ? '#FFFFFF' : theme.primary} />
            <Text style={[styles.mapModeText, mapMode === 'boundaries' && styles.mapModeTextActive]}>Safety</Text>
          </TouchableOpacity>
        </ScrollView>
        
        <TouchableOpacity style={styles.refreshButton} onPress={refreshData}>
          <Ionicons name="refresh" size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Map View */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        mapType="satellite"
      >
        {/* Render fishing zones when in zones mode */}
        {mapMode === 'zones' && ZONES.map((zone) => (
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

        {/* Render fish predictions when in predictions mode */}
        {mapMode === 'predictions' && fishPredictions.map((prediction, index) => (
          <React.Fragment key={`prediction-${index}`}>
            <Circle
              center={{
                latitude: prediction.location.lat,
                longitude: prediction.location.lon
              }}
              radius={prediction.location.radius * 1000} // Convert km to meters
              fillColor={getPredictionColor(prediction.probability) + '40'}
              strokeColor={getPredictionColor(prediction.probability)}
              strokeWidth={2}
            />
            <Marker
              coordinate={{
                latitude: prediction.location.lat,
                longitude: prediction.location.lon
              }}
              onPress={() => onPredictionPress(prediction)}
            >
              <View style={[styles.predictionMarker, { backgroundColor: getPredictionColor(prediction.probability) }]}>
                <Ionicons name="fish" size={16} color="#FFFFFF" />
                <Text style={styles.predictionMarkerText}>{prediction.probability}%</Text>
              </View>
            </Marker>
          </React.Fragment>
        ))}

        {/* Render maritime boundaries when in boundaries mode */}
        {mapMode === 'boundaries' && maritimeBoundaryService.getBoundaries().map((boundary) => (
          <Polygon
            key={boundary.id}
            coordinates={boundary.coordinates.map(coord => ({
              latitude: coord.lat,
              longitude: coord.lon
            }))}
            fillColor="rgba(255, 0, 0, 0.2)"
            strokeColor="#FF0000"
            strokeWidth={3}
          />
        ))}

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

      {/* Bottom Panel */}
      <View style={styles.bottomPanel}>
        {/* Boundary Status Alert */}
        {boundaryStatus && boundaryStatus.violations.length > 0 && (
          <EnhancedCard style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={24} color={theme.warn} />
              <Text style={styles.alertTitle}>Boundary Alert</Text>
            </View>
            <Text style={styles.alertMessage}>
              You are {boundaryStatus.distanceToNearest.toFixed(1)}km from restricted area
            </Text>
            <ProfessionalBadge 
              label="CAUTION" 
              variant="warning" 
              size="small"
            />
          </EnhancedCard>
        )}

        {/* Fish Predictions Panel */}
        {mapMode === 'predictions' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.predictionsScroll}>
            {fishPredictions.map((prediction, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.predictionCard}
                onPress={() => onPredictionPress(prediction)}
              >
                <View style={styles.predictionHeader}>
                  <Text style={styles.predictionSpecies}>{prediction.species}</Text>
                  <ProfessionalBadge 
                    label={`${prediction.probability}%`}
                    variant={prediction.probability >= 70 ? "success" : prediction.probability >= 50 ? "warning" : "danger"}
                    size="small"
                  />
                </View>
                <Text style={styles.predictionTime}>
                  {new Date(prediction.timeWindow.optimalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.predictionNet}>{prediction.recommendations.netType}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Selected Prediction Details */}
        {selectedPrediction && (
          <EnhancedCard style={styles.selectedPredictionCard}>
            <View style={styles.selectedPredictionHeader}>
              <View>
                <Text style={styles.selectedPredictionSpecies}>{selectedPrediction.species}</Text>
                <Text style={styles.selectedPredictionLocation}>
                  {selectedPrediction.location.lat.toFixed(4)}, {selectedPrediction.location.lon.toFixed(4)}
                </Text>
              </View>
              <View style={styles.selectedPredictionStats}>
                <StatsCard
                  title="Probability"
                  value={`${selectedPrediction.probability}%`}
                  icon="analytics"
                  color={getPredictionColor(selectedPrediction.probability)}
                />
                <StatsCard
                  title="Confidence"
                  value={`${selectedPrediction.confidence}%`}
                  icon="checkmark-circle"
                  color={theme.primary}
                />
              </View>
            </View>
            
            <View style={styles.predictionDetails}>
              <View style={styles.predictionDetailItem}>
                <Ionicons name="time" size={16} color={theme.primary} />
                <Text style={styles.predictionDetailText}>
                  Best time: {new Date(selectedPrediction.timeWindow.optimalTime).toLocaleString()}
                </Text>
              </View>
              <View style={styles.predictionDetailItem}>
                <Ionicons name="git-network" size={16} color={theme.primary} />
                <Text style={styles.predictionDetailText}>
                  Net: {selectedPrediction.recommendations.netType}
                </Text>
              </View>
              <View style={styles.predictionDetailItem}>
                <Ionicons name="fish" size={16} color={theme.primary} />
                <Text style={styles.predictionDetailText}>
                  Bait: {selectedPrediction.recommendations.baitType}
                </Text>
              </View>
            </View>
            
            <ModernButton
              title="Plan Trip to This Zone"
              icon="navigate"
              onPress={() => {
                // Navigate to trip planner with this location
                Alert.alert('Feature Coming Soon', 'Trip planning integration will be available soon!')
              }}
              style={styles.planTripButton}
            />
          </EnhancedCard>
        )}

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <StatsCard
            title="Active Zones"
            value={ZONES.filter(z => isFishingAllowed(z)).length.toString()}
            icon="checkmark-circle"
            trend="neutral"
          />
          <StatsCard
            title="Predictions"
            value={fishPredictions.length.toString()}
            icon="analytics"
            trend="up"
            trendValue="+3"
          />
          <StatsCard
            title="Distance"
            value={boundaryStatus ? `${boundaryStatus.distanceToNearest.toFixed(1)}km` : 'N/A'}
            icon="location"
            trend={boundaryStatus?.distanceToNearest && boundaryStatus.distanceToNearest > 10 ? "up" : "down"}
          />
        </View>

        {/* Floating Action Buttons */}
        <View style={styles.floatingActions}>
          {/* Quick Fish Navigation */}
          {fishPredictions.length > 0 && (
            <TouchableOpacity
              style={[styles.floatingButton, styles.primaryFloatingButton]}
              onPress={quickNavigateToFish}
            >
              <Ionicons name="fish" size={24} color="white" />
              <Text style={styles.floatingButtonLabel}>Best Fish</Text>
            </TouchableOpacity>
          )}
          
          {/* Quick Mode Switch */}
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={() => {
              const modes: MapMode[] = ['zones', 'predictions', 'boundaries']
              const currentIndex = modes.indexOf(mapMode)
              const nextMode = modes[(currentIndex + 1) % modes.length]
              onMapModeChange(nextMode)
            }}
          >
            <Ionicons name="swap-horizontal" size={20} color={theme.primary} />
          </TouchableOpacity>
          
          {/* My Location */}
          <TouchableOpacity
            style={styles.floatingButton}
            onPress={centerOnUser}
          >
            <Ionicons name="locate" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Enhanced Prediction Cards with Swipe Actions */}
        {mapMode === 'predictions' && fishPredictions.length > 0 && (
          <View style={styles.enhancedPredictionCards}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.enhancedCardContainer}
            >
              {fishPredictions.slice(0, 3).map((prediction, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.enhancedPredictionCard}
                  onPress={() => {
                    setSelectedPrediction(prediction)
                    setShowPredictionDetails(true)
                    // Center map on this prediction
                    mapRef.current?.animateToRegion({
                      latitude: prediction.location.lat,
                      longitude: prediction.location.lon,
                      latitudeDelta: 0.05,
                      longitudeDelta: 0.05,
                    }, 800)
                  }}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardSpecies}>{prediction.species}</Text>
                    <View style={[styles.probabilityBadge, { backgroundColor: getPredictionColor(prediction.probability) }]}>
                      <Text style={styles.probabilityText}>{prediction.probability}%</Text>
                    </View>
                  </View>
                  
                  <View style={styles.cardDetails}>
                    <View style={styles.cardDetailRow}>
                      <Ionicons name="time" size={14} color={theme.muted} />
                      <Text style={styles.cardDetailText}>
                        {new Date(prediction.timeWindow.optimalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                    <View style={styles.cardDetailRow}>
                      <Ionicons name="git-network" size={14} color={theme.muted} />
                      <Text style={styles.cardDetailText}>{prediction.recommendations.netType}</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={styles.quickActionButton}
                    onPress={(e) => {
                      e.stopPropagation()
                      quickPlanTrip()
                    }}
                  >
                    <Ionicons name="navigate" size={16} color="white" />
                    <Text style={styles.quickActionText}>Plan</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <LoadingOverlay visible={loading} message="Loading fish predictions..." />
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  mapModeSelector: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  mapModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.primary,
  },
  mapModeButtonActive: {
    backgroundColor: theme.primary,
  },
  mapModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.primary,
  },
  mapModeTextActive: {
    color: '#FFFFFF',
  },
  refreshButton: {
    marginLeft: 'auto',
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  map: {
    flex: 1,
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  alertCard: {
    marginBottom: 16,
    backgroundColor: '#FEF2F2',
    borderColor: theme.warn,
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.warn,
  },
  alertMessage: {
    fontSize: 14,
    color: theme.fg,
    marginBottom: 8,
  },
  predictionsScroll: {
    marginBottom: 16,
  },
  predictionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionSpecies: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.fg,
  },
  predictionTime: {
    fontSize: 14,
    color: theme.muted,
    marginBottom: 4,
  },
  predictionNet: {
    fontSize: 12,
    color: theme.primary,
    fontWeight: '600',
  },
  selectedPredictionCard: {
    marginBottom: 16,
  },
  selectedPredictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  selectedPredictionSpecies: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.fg,
    marginBottom: 4,
  },
  selectedPredictionLocation: {
    fontSize: 14,
    color: theme.muted,
  },
  selectedPredictionStats: {
    flexDirection: 'row',
    gap: 8,
  },
  predictionDetails: {
    gap: 12,
    marginBottom: 16,
  },
  predictionDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  predictionDetailText: {
    fontSize: 14,
    color: theme.fg,
  },
  planTripButton: {
    marginTop: 8,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  predictionMarker: {
    borderRadius: 20,
    padding: 8,
    alignItems: 'center',
    minWidth: 60,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  predictionMarkerText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  boatMarker: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  
  // Enhanced UI styles
  floatingActions: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    gap: 12,
    zIndex: 1000,
  },
  floatingButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryFloatingButton: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    width: 120,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  floatingButtonLabel: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  enhancedPredictionCards: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  enhancedCardContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  enhancedPredictionCard: {
    width: width * 0.75,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardSpecies: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.fg,
  },
  probabilityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  probabilityText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
  },
  cardDetails: {
    gap: 8,
    marginBottom: 16,
  },
  cardDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardDetailText: {
    fontSize: 14,
    color: theme.muted,
  },
  quickActionButton: {
    backgroundColor: theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  quickActionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
})