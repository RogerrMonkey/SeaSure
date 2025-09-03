import React from "react"
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle, type TextStyle, Animated } from "react-native"
import { theme } from "../theme/colors"

export function Card(props: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, props.style]}>{props.children}</View>
}

export function Button(props: {
  title: string
  onPress?: () => void
  variant?: "primary" | "ghost" | "warn" | "danger"
  style?: ViewStyle
  textStyle?: TextStyle
  disabled?: boolean
}) {
  const { variant = "primary", disabled } = props
  const [scale] = React.useState(new Animated.Value(1))

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start()
  }

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start()
  }

  const base = [styles.btn, variantStyles[variant], disabled && { opacity: 0.6 }]
  const txt = [styles.btnText, variantTextStyles[variant], props.textStyle]
  
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        accessibilityRole="button"
        onPress={props.onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        style={[...base, props.style]}
      >
        <Text style={txt}>{props.title}</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

export function Badge(props: { label: string; tone?: "default" | "warn" | "danger" | "success" }) {
  const tone = props.tone ?? "default"
  return (
    <View
      style={[
        styles.badge,
        tone === "warn" && { backgroundColor: theme.warn },
        tone === "danger" && { backgroundColor: theme.danger },
        tone === "success" && { backgroundColor: "#10b981" },
      ]}
    >
      <Text style={[
        styles.badgeText,
        tone === "success" && { color: "#ffffff" },
        tone === "danger" && { color: "#ffffff" },
      ]}>{props.label}</Text>
    </View>
  )
}

export function SectionTitle(props: { children: React.ReactNode }) {
  return <Text style={styles.sectionTitle}>{props.children}</Text>
}

const styles = StyleSheet.create({
  card: { 
    backgroundColor: "#FFFFFF", 
    borderRadius: 16, 
    padding: 16, 
    borderColor: "#E2E8F0", 
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  btn: { 
    paddingVertical: 14, 
    paddingHorizontal: 20, 
    borderRadius: 12, 
    alignItems: "center", 
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  btnText: { fontSize: 16, fontWeight: "600" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
    alignSelf: "flex-start",
  },
  badgeText: { color: "#0F172A", fontWeight: "600", fontSize: 12 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: theme.fg, marginBottom: 12 },
})

const variantStyles = StyleSheet.create({
  primary: { backgroundColor: theme.primary },
  ghost: { backgroundColor: "#FFFFFF", borderColor: "#CBD5E1", borderWidth: 1 },
  warn: { backgroundColor: theme.warn },
  danger: { backgroundColor: theme.danger },
})

const variantTextStyles = StyleSheet.create({
  primary: { color: "#FFFFFF" },
  ghost: { color: theme.fg },
  warn: { color: "#0F172A" },
  danger: { color: "#FFFFFF" },
})
