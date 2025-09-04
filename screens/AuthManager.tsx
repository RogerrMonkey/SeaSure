import React, { useState, useRef } from "react"
import { View, StyleSheet, Animated } from "react-native"
import LoginScreen from "./LoginScreen"
import RegisterScreen from "./RegisterScreen"
import UserProfileScreen from "./UserProfileScreen"
import { User } from "firebase/auth"

type AuthState = "login" | "register" | "authenticated" | "profile"

interface AuthManagerProps {
  onAuthenticated: (user: User) => void
  onBack: () => void
}

export default function AuthManager({ onAuthenticated, onBack }: AuthManagerProps) {
  const [authState, setAuthState] = useState<AuthState>("login")
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Animation for smooth transitions
  const fadeAnim = useRef(new Animated.Value(1)).current

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
    
    setTimeout(callback, 200)
  }

  const handleLogin = (user: User) => {
    setCurrentUser(user)
    animateTransition(() => {
      setAuthState("authenticated")
      onAuthenticated(user)
    })
  }

  const handleRegister = (user: User) => {
    setCurrentUser(user)
    animateTransition(() => {
      setAuthState("authenticated")
      onAuthenticated(user)
    })
  }

  const handleLogout = () => {
    setCurrentUser(null)
    animateTransition(() => {
      setAuthState("login")
    })
  }

  const handleForgotPassword = () => {
    // Handle forgot password logic
    console.log("Forgot password requested")
  }

  const navigateToProfile = () => {
    animateTransition(() => {
      setAuthState("profile")
    })
  }

  const navigateToLogin = () => {
    animateTransition(() => {
      setAuthState("login")
    })
  }

  const navigateToRegister = () => {
    animateTransition(() => {
      setAuthState("register")
    })
  }

  const renderScreen = () => {
    switch (authState) {
      case "login":
        return (
          <LoginScreen
            onLogin={handleLogin}
            onNavigateToRegister={navigateToRegister}
            onForgotPassword={handleForgotPassword}
          />
        )
      case "register":
        return (
          <RegisterScreen
            onRegister={handleRegister}
            onNavigateToLogin={navigateToLogin}
          />
        )
      case "profile":
        return (
          <UserProfileScreen
            onLogout={handleLogout}
            onBack={onBack}
          />
        )
      default:
        return null
    }
  }

  // If authenticated and not viewing profile, return null (let main app handle)
  if (authState === "authenticated") {
    return null
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.screenContainer, { opacity: fadeAnim }]}>
        {renderScreen()}
      </Animated.View>
    </View>
  )
}

// Export the profile navigation function for use in main app
export const useAuthManager = () => {
  const [authManagerRef, setAuthManagerRef] = useState<{
    navigateToProfile: () => void
  } | null>(null)

  return {
    authManagerRef,
    setAuthManagerRef,
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
  },
})
