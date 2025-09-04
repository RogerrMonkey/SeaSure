import React, { useState, useRef, useEffect } from "react"
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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { Ionicons } from "@expo/vector-icons"
import * as ImagePicker from 'expo-image-picker'
import { theme } from "../theme/colors"
import { Card, Button } from "../components/ui"
import { authService, UserProfile } from "../services/auth"
import { databaseService } from "../services/database"
import { imageUploadService } from "../services/imageUpload"

const { width } = Dimensions.get("window")

interface UserProfileScreenProps {
  onLogout: () => void
  onBack: () => void
}

export default function UserProfileScreen({ onLogout, onBack }: UserProfileScreenProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [userData, setUserData] = useState<UserProfile | null>(null)
  const [editedData, setEditedData] = useState<Partial<UserProfile>>({})

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current

  useEffect(() => {
    loadUserProfile()
    
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

  const loadUserProfile = async () => {
    try {
      const user = authService.getCurrentUser()
      if (user) {
        const profile = await authService.getUserProfile(user.uid)
        if (profile) {
          setUserData(profile)
          setEditedData(profile)
        }
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      Alert.alert('Error', 'Failed to load user profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!userData) return
    
    setIsSaving(true)
    try {
      await authService.updateUserProfile(userData.uid, editedData)
      setUserData({ ...userData, ...editedData })
      setIsEditing(false)
      Alert.alert("Success", "Profile updated successfully!")
    } catch (error) {
      console.error('Error updating profile:', error)
      Alert.alert('Error', 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditedData(userData || {})
    setIsEditing(false)
  }

  const handleImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
      
      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "Permission to access camera roll is required!")
        return
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setIsUploadingImage(true)
        try {
          const imageUrl = await imageUploadService.uploadProfilePicture(
            result.assets[0].uri,
            userData?.uid || ''
          )
          
          if (userData) {
            await authService.updateProfilePicture(userData.uid, imageUrl)
            setUserData({ ...userData, photoURL: imageUrl })
            setEditedData({ ...editedData, photoURL: imageUrl })
            Alert.alert("Success", "Profile picture updated successfully!")
          }
        } catch (error) {
          console.error('Error uploading image:', error)
          Alert.alert('Error', 'Failed to upload image')
        } finally {
          setIsUploadingImage(false)
        }
      }
    } catch (error) {
      console.error('Image picker error:', error)
      Alert.alert('Error', 'Failed to open image picker')
    }
  }

  const handleLogout = async () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await authService.signOut()
              onLogout()
            } catch (error) {
              console.error('Logout error:', error)
              Alert.alert('Error', 'Failed to logout')
            }
          }
        }
      ]
    )
  }

  const StatCard = ({ title, value, icon }: { title: string; value: string | number; icon: string }) => (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={24} color={theme.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  )

  const ProfileField = React.useCallback(({
    label,
    value,
    onChangeText,
    multiline = false,
    editable = true,
    keyboardType = 'default',
  }: {
    label: string
    value: string
    onChangeText?: (text: string) => void
    multiline?: boolean
    editable?: boolean
    keyboardType?: 'default' | 'email-address' | 'phone-pad'
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
          keyboardType={keyboardType}
          autoCorrect={false}
          blurOnSubmit={false}
          returnKeyType={multiline ? "default" : "next"}
        />
      ) : (
        <Text style={styles.fieldValue}>{value || 'Not specified'}</Text>
      )}
    </View>
  ), [isEditing])

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    )
  }

  if (!userData) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Failed to load profile</Text>
        <Button
          title="Retry"
          onPress={loadUserProfile}
          variant="primary"
        />
      </View>
    )
  }

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

        {/* Profile Picture */}
        <Animated.View
          style={[
            styles.profileSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <TouchableOpacity onPress={handleImagePicker} style={styles.avatarContainer}>
            {isUploadingImage ? (
              <View style={styles.avatarLoading}>
                <ActivityIndicator size="large" color="#ffffff" />
              </View>
            ) : (
              <Image
                source={{
                  uri: userData.photoURL || "https://via.placeholder.com/120x120/0891b2/ffffff?text=User"
                }}
                style={styles.avatar}
              />
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={20} color="#ffffff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.userName}>{userData.displayName}</Text>
          <Text style={styles.userEmail}>{userData.email}</Text>
        </Animated.View>
      </LinearGradient>

      {/* Content */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <StatCard title="Experience" value={`${userData.experience?.yearsOfFishing || 0} years`} icon="time-outline" />
          <StatCard title="Specializations" value={userData.experience?.specialization?.length || 0} icon="fish-outline" />
          <StatCard title="Favorite Zones" value={userData.experience?.preferredZones?.length || 0} icon="location-outline" />
        </View>

        {/* Profile Information */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <ProfileField
            label="Full Name"
            value={editedData.displayName || userData.displayName}
            onChangeText={(text) => setEditedData({ ...editedData, displayName: text })}
          />
          
          <ProfileField
            label="Email"
            value={userData.email}
            editable={false}
          />
          
          <ProfileField
            label="Phone Number"
            value={editedData.phoneNumber || userData.phoneNumber || ''}
            onChangeText={(text) => setEditedData({ ...editedData, phoneNumber: text })}
            keyboardType="phone-pad"
          />
        </Card>

        {/* Location Information */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          
          <ProfileField
            label="State"
            value={editedData.location?.state || userData.location?.state || ''}
            onChangeText={(text) => setEditedData({ 
              ...editedData, 
              location: { 
                state: text, 
                port: editedData.location?.port || userData.location?.port || '' 
              } 
            })}
          />
          
          <ProfileField
            label="Port"
            value={editedData.location?.port || userData.location?.port || ''}
            onChangeText={(text) => setEditedData({ 
              ...editedData, 
              location: { 
                state: editedData.location?.state || userData.location?.state || '',
                port: text 
              } 
            })}
          />
        </Card>

        {/* Boat Information */}
        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>Boat Details</Text>
          
          <ProfileField
            label="Boat Name"
            value={editedData.boatDetails?.name || userData.boatDetails?.name || ''}
            onChangeText={(text) => setEditedData({ 
              ...editedData, 
              boatDetails: { 
                name: text,
                registrationNumber: editedData.boatDetails?.registrationNumber || userData.boatDetails?.registrationNumber || '',
                type: editedData.boatDetails?.type || userData.boatDetails?.type || '',
                length: editedData.boatDetails?.length || userData.boatDetails?.length || 0
              } 
            })}
          />
          
          <ProfileField
            label="Registration Number"
            value={editedData.boatDetails?.registrationNumber || userData.boatDetails?.registrationNumber || ''}
            onChangeText={(text) => setEditedData({ 
              ...editedData, 
              boatDetails: { 
                name: editedData.boatDetails?.name || userData.boatDetails?.name || '',
                registrationNumber: text,
                type: editedData.boatDetails?.type || userData.boatDetails?.type || '',
                length: editedData.boatDetails?.length || userData.boatDetails?.length || 0
              } 
            })}
          />
          
          <ProfileField
            label="Boat Type"
            value={editedData.boatDetails?.type || userData.boatDetails?.type || ''}
            onChangeText={(text) => setEditedData({ 
              ...editedData, 
              boatDetails: { 
                name: editedData.boatDetails?.name || userData.boatDetails?.name || '',
                registrationNumber: editedData.boatDetails?.registrationNumber || userData.boatDetails?.registrationNumber || '',
                type: text,
                length: editedData.boatDetails?.length || userData.boatDetails?.length || 0
              } 
            })}
          />
        </Card>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {isEditing ? (
            <>
              <Button
                title={isSaving ? "Saving..." : "Save Changes"}
                onPress={handleSave}
                variant="primary"
                disabled={isSaving}
                style={styles.saveButton}
              />
              <Button
                title="Cancel"
                onPress={handleCancel}
                variant="ghost"
                disabled={isSaving}
              />
            </>
          ) : (
            <Button
              title="Logout"
              onPress={handleLogout}
              variant="danger"
              style={styles.logoutButton}
            />
          )}
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.muted,
  },
  errorText: {
    fontSize: 16,
    color: theme.danger,
    marginBottom: 16,
  },
  header: {
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },
  editButton: {
    padding: 8,
  },
  profileSection: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#ffffff",
  },
  avatarLoading: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: theme.primary,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
  },
  statCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.fg,
    marginTop: 8,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    color: theme.muted,
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: theme.fg,
    marginBottom: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.muted,
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: theme.fg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.card,
    borderRadius: 8,
    minHeight: 44,
  },
  fieldInput: {
    fontSize: 16,
    color: theme.fg,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.muted,
    minHeight: 44,
  },
  fieldInputMultiline: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  buttonContainer: {
    paddingVertical: 20,
    paddingBottom: 40,
  },
  saveButton: {
    marginBottom: 12,
  },
  logoutButton: {
    marginTop: 20,
  },
})
