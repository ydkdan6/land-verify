import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { User, Mail, Phone, LogOut, Edit, Save, X, Users } from 'lucide-react-native';

export default function PublicProfileScreen() {
  const { profile, signOut, updateProfile } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  });

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth');
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        full_name: formData.full_name,
        phone: formData.phone || null,
      });
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData({
      full_name: profile?.full_name || '',
      phone: profile?.phone || '',
    });
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Users size={48} color="#64748B" />
          </View>
          <Text style={styles.name}>{profile?.full_name}</Text>
          <Text style={styles.role}>General Public</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Profile Information</Text>
            {!isEditing ? (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <Edit size={20} color="#64748B" />
              </TouchableOpacity>
            ) : (
              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={handleSave}
                >
                  <Save size={16} color="white" />
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleCancel}
                >
                  <X size={16} color="#64748B" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.profileFields}>
            <View style={styles.fieldContainer}>
              <Mail size={20} color="#64748B" />
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Email</Text>
                <Text style={styles.fieldValue}>{profile?.email}</Text>
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <User size={20} color="#64748B" />
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={formData.full_name}
                    onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                    placeholder="Enter full name"
                  />
                ) : (
                  <Text style={styles.fieldValue}>{profile?.full_name}</Text>
                )}
              </View>
            </View>

            <View style={styles.fieldContainer}>
              <Phone size={20} color="#64748B" />
              <View style={styles.fieldContent}>
                <Text style={styles.fieldLabel}>Phone</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={formData.phone}
                    onChangeText={(text) => setFormData({ ...formData, phone: text })}
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.fieldValue}>
                    {profile?.phone || 'Not provided'}
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Account Type</Text>
            <Text style={styles.infoValue}>General Public</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Public Access</Text>
          <View style={styles.accessInfo}>
            <Text style={styles.accessText}>
              As a public user, you have access to:
            </Text>
            <Text style={styles.accessItem}>• Search and view verified land records</Text>
            <Text style={styles.accessItem}>• Browse available properties</Text>
            <Text style={styles.accessItem}>• Access zoning laws and regulations</Text>
            <Text style={styles.accessItem}>• Request ownership verification</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={20} color="#DC2626" />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    backgroundColor: '#F1F5F9',
    padding: 24,
    borderRadius: 50,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  editButton: {
    padding: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#64748B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    padding: 6,
  },
  profileFields: {
    gap: 16,
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1E293B',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  infoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  accessInfo: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 8,
  },
  accessText: {
    fontSize: 14,
    color: '#1E293B',
    marginBottom: 12,
    fontWeight: '500',
  },
  accessItem: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 6,
    lineHeight: 20,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  signOutButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '500',
  },
});