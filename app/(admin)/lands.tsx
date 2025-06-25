import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, MapPin, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react-native';

type LandRecord = Database['public']['Tables']['land_records']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row'];
};

export default function AdminLandsScreen() {
  const { profile } = useAuth();
  const [lands, setLands] = useState<LandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLand, setSelectedLand] = useState<LandRecord | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    coordinates: '',
    size: '',
    size_unit: 'acres',
    zoning: '',
    price: '',
    description: '',
  });

  useEffect(() => {
    fetchLands();
  }, []);

  const fetchLands = async () => {
    try {
      const { data, error } = await supabase
        .from('land_records')
        .select(`
          *,
          profiles:owner_id (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLands(data || []);
    } catch (error) {
      console.error('Error fetching lands:', error);
      Alert.alert('Error', 'Failed to load land records');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLand = async () => {
    if (!formData.title || !formData.location || !formData.size || !formData.zoning) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('land_records')
        .insert({
          title: formData.title,
          location: formData.location,
          coordinates: formData.coordinates || null,
          size: parseFloat(formData.size),
          size_unit: formData.size_unit,
          zoning: formData.zoning,
          price: formData.price ? parseFloat(formData.price) : null,
          description: formData.description || null,
          verified_by: profile?.id,
          ownership_status: 'verified',
        });

      if (error) throw error;

      Alert.alert('Success', 'Land record added successfully');
      setShowAddModal(false);
      resetForm();
      fetchLands();
    } catch (error: any) {
      console.error('Error adding land:', error);
      Alert.alert('Error', error.message || 'Failed to add land record');
    }
  };

  const handleVerifyLand = async (landId: string, status: 'verified' | 'disputed') => {
    try {
      const { error } = await supabase
        .from('land_records')
        .update({
          ownership_status: status,
          verified_by: profile?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', landId);

      if (error) throw error;

      Alert.alert('Success', `Land record ${status} successfully`);
      fetchLands();
    } catch (error: any) {
      console.error('Error updating land:', error);
      Alert.alert('Error', error.message || 'Failed to update land record');
    }
  };

  const handleDeleteLand = async (landId: string, landTitle: string) => {
    Alert.alert(
      'Delete Land Record',
      `Are you sure you want to delete "${landTitle}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('land_records')
                .delete()
                .eq('id', landId);

              if (error) throw error;

              Alert.alert('Success', 'Land record deleted successfully');
              fetchLands();
            } catch (error: any) {
              console.error('Error deleting land:', error);
              Alert.alert('Error', error.message || 'Failed to delete land record');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      title: '',
      location: '',
      coordinates: '',
      size: '',
      size_unit: 'acres',
      zoning: '',
      price: '',
      description: '',
    });
  };

  const filteredLands = lands.filter(land =>
    land.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    land.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    land.zoning.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#059669';
      case 'pending': return '#EA580C';
      case 'disputed': return '#DC2626';
      default: return '#64748B';
    }
  };

  const LandCard = ({ land }: { land: LandRecord }) => (
    <View style={styles.landCard}>
      <View style={styles.landHeader}>
        <Text style={styles.landTitle}>{land.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(land.ownership_status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(land.ownership_status) }]}>
            {land.ownership_status}
          </Text>
        </View>
      </View>
      
      <View style={styles.landDetails}>
        <Text style={styles.landLocation}>📍 {land.location}</Text>
        <Text style={styles.landSize}>{land.size} {land.size_unit}</Text>
        <Text style={styles.landZoning}>Zone: {land.zoning}</Text>
        {land.price && <Text style={styles.landPrice}>₦{land.price.toLocaleString()}</Text>}
        {land.profiles && (
          <Text style={styles.landOwner}>Owner: {land.profiles.full_name}</Text>
        )}
      </View>

      <View style={styles.landActions}>
        {land.ownership_status === 'pending' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.verifyButton]}
              onPress={() => handleVerifyLand(land.id, 'verified')}
            >
              <CheckCircle size={16} color="white" />
              <Text style={styles.actionButtonText}>Verify</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.disputeButton]}
              onPress={() => handleVerifyLand(land.id, 'disputed')}
            >
              <XCircle size={16} color="white" />
              <Text style={styles.actionButtonText}>Dispute</Text>
            </TouchableOpacity>
          </>
        )}
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={() => setSelectedLand(land)}
        >
          <Edit size={16} color="white" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteLand(land.id, land.title)}
        >
          <Trash2 size={16} color="white" />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading land records...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Land Records</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search lands..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.scrollView}>
        {filteredLands.map((land) => (
          <LandCard key={land.id} land={land} />
        ))}
        {filteredLands.length === 0 && (
          <View style={styles.emptyState}>
            <MapPin size={48} color="#64748B" />
            <Text style={styles.emptyStateText}>No land records found</Text>
          </View>
        )}
      </ScrollView>

      {/* Add Land Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Land Record</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <TextInput
              style={styles.input}
              placeholder="Land Title *"
              placeholderTextColor="grey"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Location *"
              placeholderTextColor="grey"
              value={formData.location}
              onChangeText={(text) => setFormData({ ...formData, location: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="GPS Coordinates"
              placeholderTextColor="grey"
              value={formData.coordinates}
              onChangeText={(text) => setFormData({ ...formData, coordinates: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Size *"
              placeholderTextColor="grey"
              value={formData.size}
              onChangeText={(text) => setFormData({ ...formData, size: text })}
              keyboardType="numeric"
            />
            <TextInput
              style={styles.input}
              placeholder="Zoning *"
              placeholderTextColor="grey"
              value={formData.zoning}
              onChangeText={(text) => setFormData({ ...formData, zoning: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Price (optional)"
              placeholderTextColor="grey"
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              keyboardType="numeric"
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description"
              placeholderTextColor="grey"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleAddLand}>
              <Text style={styles.submitButtonText}>Add Land Record</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  addButton: {
    backgroundColor: '#2563EB',
    padding: 12,
    borderRadius: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 20,
    marginTop: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  landCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  landHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  landTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  landDetails: {
    marginBottom: 12,
  },
  landLocation: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  landSize: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  landZoning: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 4,
  },
  landPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  landOwner: {
    fontSize: 14,
    color: '#64748B',
  },
  landActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  verifyButton: {
    backgroundColor: '#059669',
  },
  disputeButton: {
    backgroundColor: '#DC2626',
  },
  editButton: {
    backgroundColor: '#2563EB',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 12,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  cancelButton: {
    color: '#2563EB',
    fontSize: 16,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#2563EB',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});