import React, { useState, useRef } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  Alert,
  Animated,
  Dimensions,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import { theme } from "../theme/colors"
import { Card, Button } from "../components/ui"

const { width } = Dimensions.get("window")

interface UserProfileScreenProps {
  onLogout: () => void
  onBack: () => void
}

interface UserData {
  fullName: string
  email: string
  phone: string
  location: string
  bio: string
  avatar: string
  memberSince: string
  totalCatches: number
  totalTrips: number
  favoriteSpot: string
}

export default function UserProfileScreen({ onLogout, onBack }: UserProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [userData, setUserData] = useState<UserData>({
    fullName: "John Fisherman",
    email: "john.fisherman@seasure.com",
    phone: "+1 (555) 123-4567",
    location: "San Diego, CA",
    bio: "Passionate angler with 15+ years of coastal fishing experience. Love exploring new fishing spots and sharing knowledge with fellow fishermen.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    memberSince: "January 2023",
    totalCatches: 127,
    totalTrips: 45,
    favoriteSpot: "La Jolla Cove",
  })

  const [editedData, setEditedData] = useState(userData)

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const handleSave = () => {
    setUserData(editedData)
    setIsEditing(false)
    Alert.alert("Success", "Profile updated successfully!")
  }

  const handleCancel = () => {
    setEditedData(userData)
    setIsEditing(false)
  }

  const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: string }) => (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={24} color={theme.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  )

  const ProfileField = ({
    label,
    value,
    onChangeText,
    multiline = false,
    editable = true,
  }: {
    label: string
    value: string
    onChangeText?: (text: string) => void
    multiline?: boolean
    editable?: boolean
  }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing && editable ? (
        <TextInput
          style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
          value={value}
          onChangeText={onChangeText}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      ) : (
        <Text style={styles.fieldValue}>{value}</Text>
      )}
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[theme.primary, "#0891b2"]}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            onPress={isEditing ? handleCancel : () => setIsEditing(true)}
            style={styles.editButton}
          >
            <Ionicons
              name={isEditing ? "close" : "create-outline"}
              size={24}
              color="#ffffff"
            />
          </TouchableOpacity>
        </View>

        <Animated.View
          style={[
            styles.profileSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.avatarContainer}>
            <Image source={{ uri: userData.avatar }} style={styles.avatar} />
            <TouchableOpacity style={styles.avatarEditButton}>
              <Ionicons name="camera" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{userData.fullName}</Text>
          <Text style={styles.userLocation}>{userData.location}</Text>
          <Text style={styles.memberSince}>Member since {userData.memberSince}</Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <StatCard title="Total Catches" value={userData.totalCatches} icon="fish" />
          <StatCard title="Total Trips" value={userData.totalTrips} icon="boat" />
          <StatCard title="Favorite Spot" value={userData.favoriteSpot} icon="location" />
        </View>

        {/* Profile Information */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <ProfileField
            label="Full Name"
            value={editedData.fullName}
            onChangeText={(text) => setEditedData({ ...editedData, fullName: text })}
          />
          
          <ProfileField
            label="Email"
            value={editedData.email}
            onChangeText={(text) => setEditedData({ ...editedData, email: text })}
          />
          
          <ProfileField
            label="Phone"
            value={editedData.phone}
            onChangeText={(text) => setEditedData({ ...editedData, phone: text })}
          />
          
          <ProfileField
            label="Location"
            value={editedData.location}
            onChangeText={(text) => setEditedData({ ...editedData, location: text })}
          />
          
          <ProfileField
            label="Bio"
            value={editedData.bio}
            onChangeText={(text) => setEditedData({ ...editedData, bio: text })}
            multiline
          />
        </Card>

        {/* Preferences */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          
          <TouchableOpacity style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <Ionicons name="notifications-outline" size={24} color={theme.primary} />
              <Text style={styles.preferenceText}>Push Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <Ionicons name="location-outline" size={24} color={theme.primary} />
              <Text style={styles.preferenceText}>Location Services</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <Ionicons name="shield-outline" size={24} color={theme.primary} />
              <Text style={styles.preferenceText}>Privacy Settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </Card>

        {/* Actions */}
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <Ionicons name="key-outline" size={24} color={theme.primary} />
              <Text style={styles.preferenceText}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <Ionicons name="download-outline" size={24} color={theme.primary} />
              <Text style={styles.preferenceText}>Export Data</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <Ionicons name="help-circle-outline" size={24} color={theme.primary} />
              <Text style={styles.preferenceText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </Card>

        {/* Save/Logout Buttons */}
        <View style={styles.buttonContainer}>
          {isEditing ? (
            <Button
              title="Save Changes"
              onPress={handleSave}
              style={styles.saveButton}
            />
          ) : (
            <Button
              title="Sign Out"
              variant="danger"
              onPress={() => {
                Alert.alert(
                  "Sign Out",
                  "Are you sure you want to sign out?",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Sign Out", style: "destructive", onPress: onLogout },
                  ]
                )
              }}
              style={styles.logoutButton}
            />
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#ffffff",
  },
  editButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "#ffffff",
  },
  avatarEditButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: theme.primary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: -20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.primary,
    marginTop: 8,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },
  infoCard: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: "#1e293b",
    lineHeight: 24,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#1e293b",
    backgroundColor: "#f8fafc",
  },
  fieldInputMultiline: {
    height: 80,
    textAlignVertical: "top",
  },
  preferenceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  preferenceLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  preferenceText: {
    fontSize: 16,
    color: "#1e293b",
    marginLeft: 12,
  },
  buttonContainer: {
    marginTop: 20,
  },
  saveButton: {
    marginBottom: 20,
  },
  logoutButton: {
    marginBottom: 20,
  },
  bottomPadding: {
    height: 40,
  },
})
