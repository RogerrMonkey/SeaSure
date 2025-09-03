import React, { useState, useRef } from "react"
import { View, StyleSheet, Animated } from "react-native"
import LoginScreen from "./LoginScreen"
import RegisterScreen from "./RegisterScreen"
import UserProfileScreen from "./UserProfileScreen"

type AuthState = "login" | "register" | "authenticated" | "profile"

interface AuthManagerProps {
  onAuthenticated: () => void
  onBack: () => void
}

interface User {
  id: string
  fullName: string
  email: string
  avatar?: string
}

export default function AuthManager({ onAuthenticated, onBack }: AuthManagerProps) {
  const [authState, setAuthState] = useState<AuthState>("login")
  const [user, setUser] = useState<User | null>(null)

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

  const handleLogin = (email: string, password: string) => {
    // Simulate login API call
    const mockUser: User = {
      id: "1",
      fullName: "John Fisherman",
      email: email,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    }
    
    setUser(mockUser)
    animateTransition(() => {
      setAuthState("authenticated")
      onAuthenticated()
    })
  }

  const handleRegister = (userData: {
    fullName: string
    email: string
    password: string
    confirmPassword: string
  }) => {
    // Simulate registration API call
    const newUser: User = {
      id: Date.now().toString(),
      fullName: userData.fullName,
      email: userData.email,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    }
    
    setUser(newUser)
    animateTransition(() => {
      setAuthState("authenticated")
      onAuthenticated()
    })
  }

  const handleLogout = () => {
    setUser(null)
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
