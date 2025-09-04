import React, { useState, useEffect } from "react"
import { NavigationContainer, DefaultTheme } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { StatusBar, TouchableOpacity, View, ActivityIndicator } from "react-native"
import MapScreen from "./screens/MapScreen"
import LogbookScreen from "./screens/LogbookScreen"
import WeatherScreen from "./screens/WeatherScreen"
import TripPlannerScreen from "./screens/TripPlannerScreen"
import AlertsScreen from "./screens/AlertsScreen"
import SettingsScreen from "./screens/SettingsScreen"
import AuthManager from "./screens/AuthManager"
import UserProfileScreen from "./screens/UserProfileScreen"
import { theme } from "./theme/colors"
import { Ionicons } from "@expo/vector-icons"
import { authService } from "./services/auth"
import { User } from "firebase/auth"

const Tab = createBottomTabNavigator()

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showProfile, setShowProfile] = useState(false)

  useEffect(() => {
    // Listen to authentication state changes
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user)
      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: theme.primary,
      background: theme.bg,
      text: theme.fg,
      card: theme.card,
      border: "#E2E8F0",
      notification: theme.warn,
    },
  }

  const handleAuthenticated = (authenticatedUser: User) => {
    setUser(authenticatedUser)
  }

  const handleLogout = () => {
    setUser(null)
    setShowProfile(false)
  }

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.bg }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </SafeAreaProvider>
    )
  }

  // Show auth screens if not authenticated
  if (!user) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <AuthManager
          onAuthenticated={handleAuthenticated}
          onBack={() => setShowProfile(false)}
        />
      </SafeAreaProvider>
    )
  }

  // Show profile screen if requested
  if (showProfile) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <UserProfileScreen
          onLogout={handleLogout}
          onBack={() => setShowProfile(false)}
        />
      </SafeAreaProvider>
    )
  }

  // Main app navigation
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer theme={navTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: true,
            tabBarActiveTintColor: theme.primary,
            tabBarInactiveTintColor: "#64748B",
            tabBarStyle: { backgroundColor: "#FFFFFF" },
            // Add profile button to header
            headerRight: () => (
              <TouchableOpacity
                onPress={() => setShowProfile(true)}
                style={{ marginRight: 16, padding: 8 }}
              >
                <Ionicons name="person-circle-outline" size={28} color={theme.primary} />
              </TouchableOpacity>
            ),
            tabBarIcon: ({ color, size }) => {
              const map: Record<string, React.ReactNode> = {
                Map: <Ionicons name="map" size={size} color={color} />,
                Logbook: <Ionicons name="list" size={size} color={color} />,
                Weather: <Ionicons name="cloud" size={size} color={color} />,
                Trip: <Ionicons name="navigate" size={size} color={color} />,
                Alerts: <Ionicons name="alert-circle" size={size} color={color} />,
                Settings: <Ionicons name="settings" size={size} color={color} />,
              }
              return (map[route.name] as any) ?? null
            },
          })}
        >
          <Tab.Screen name="Map" component={MapScreen} />
          <Tab.Screen name="Logbook" component={LogbookScreen} />
          <Tab.Screen name="Weather" component={WeatherScreen} />
          <Tab.Screen name="Trip" component={TripPlannerScreen} options={{ title: "Trip" }} />
          <Tab.Screen name="Alerts" component={AlertsScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}
