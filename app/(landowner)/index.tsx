import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Database } from '@/lib/supabase';
import { MapPin, Plus, Eye, FileText, TrendingUp, AlertCircle } from 'lucide-react-native';

type LandRecord = Database['public']['Tables']['land_records']['Row'];

export default function LandownerDashboard() {
  const { profile } = useAuth();
  const [lands, setLands] = useState<LandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLand, setSelectedLand] = useState<LandRecord | null>(null);
  
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
    if (profile) {
      fetchMyLands();
    }
  }, [profile]);

  const fetchMyLands = async () => {
    try {
      const { data, error } = await supabase
        .from('land_records')
        .select('*')
        .eq('owner_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLands(data || []);
    } catch (error) {
      console.error('Error fetching lands:', error);
      Alert.alert('Error', 'Failed to load your land records');
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
          owner_id: profile?.id,
          ownership_status: 'pending',
        });

      if (error) throw error;

      Alert.alert('Success', 'Land record submitted for verification');
      setShowAddModal(false);
      resetForm();
      fetchMyLands();
    } catch (error: any) {
      console.error('Error adding land:', error);
      Alert.alert('Error', error.message || 'Failed to add land record');
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#059669';
      case 'pending': return '#EA580C';
      case 'disputed': return '#DC2626';
      default: return '#64748B';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return '✅';
      case 'pending': return '⏳';
      case 'disputed': return '⚠️';
      default: return '❓';
    }
  };

  const LandCard = ({ land }: { land: LandRecord }) => (
    <TouchableOpacity
      style={styles.landCard}
      onPress={() => setSelectedLand(land)}
    >
      <View style={styles.landHeader}>
        <Text style={styles.landTitle}>{land.title}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(land.ownership_status) + '20' }]}>
          <Text style={styles.statusEmoji}>{getStatusIcon(land.ownership_status)}</Text>
          <Text style={[styles.statusText, { color: getStatusColor(land.ownership_status) }]}>
            {land.ownership_status}
          </Text>
        </View>
      </View>
      
      <View style={styles.landDetails}>
        <Text style={styles.landLocation}>📍 {land.location}</Text>
        <Text style={styles.landSize}>{land.size} {land.size_unit}</Text>
        <Text style={styles.landZoning}>Zone: {land.zoning}</Text>
        {land.price && <Text style={styles.landPrice}>${land.price.toLocaleString()}</Text>}
      </View>

      <View style={styles.landFooter}>
        <TouchableOpacity style={styles.viewButton}>
          <Eye size={16} color="#059669" />
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
        {land.ownership_status === 'pending' && (
          <View style={styles.pendingNotice}>
            <AlertCircle size={14} color="#EA580C" />
            <Text style={styles.pendingText}>Awaiting verification</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const stats = {
    total: lands.length,
    verified: lands.filter(l => l.ownership_status === 'verified').length,
    pending: lands.filter(l => l.ownership_status === 'pending').length,
    disputed: lands.filter(l => l.ownership_status === 'disputed').length,
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading your lands...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Land Records</Text>
          <Text style={styles.subtitle}>Welcome back, {profile?.full_name}</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={20} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Lands</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#059669' }]}>{stats.verified}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#EA580C' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {lands.map((land) => (
          <LandCard key={land.id} land={land} />
        ))}
        {lands.length === 0 && (
          <View style={styles.emptyState}>
            <MapPin size={48} color="#64748B" />
            <Text style={styles.emptyStateText}>No land records found</Text>
            <Text style={styles.emptyStateSubtext}>Add your first land record to get started</Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setShowAddModal(true)}
            >
              <Plus size={20} color="white" />
              <Text style={styles.emptyStateButtonText}>Add Land Record</Text>
            </TouchableOpacity>
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
              placeholder="Estimated Price"
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
              <Text style={styles.submitButtonText}>Submit for Verification</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Land Details Modal */}
      <Modal
        visible={!!selectedLand}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedLand && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedLand.title}</Text>
              <TouchableOpacity onPress={() => setSelectedLand(null)}>
                <Text style={styles.cancelButton}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Status</Text>
                <View style={styles.statusRow}>
                  <Text style={styles.statusEmoji}>{getStatusIcon(selectedLand.ownership_status)}</Text>
                  <Text style={[styles.detailValue, { color: getStatusColor(selectedLand.ownership_status) }]}>
                    {selectedLand.ownership_status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Location</Text>
                <Text style={styles.detailValue}>{selectedLand.location}</Text>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Size</Text>
                <Text style={styles.detailValue}>{selectedLand.size} {selectedLand.size_unit}</Text>
              </View>

              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Zoning</Text>
                <Text style={styles.detailValue}>{selectedLand.zoning}</Text>
              </View>

              {selectedLand.price && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Price</Text>
                  <Text style={styles.detailValue}>${selectedLand.price.toLocaleString()}</Text>
                </View>
              )}

              {selectedLand.coordinates && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Coordinates</Text>
                  <Text style={styles.detailValue}>{selectedLand.coordinates}</Text>
                </View>
              )}

              {selectedLand.description && (
                <View style={styles.detailCard}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>{selectedLand.description}</Text>
                </View>
              )}

              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedLand.created_at).toLocaleDateString()}
                </Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
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
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#059669',
    padding: 12,
    borderRadius: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusEmoji: {
    fontSize: 12,
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
  },
  landFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewButtonText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '500',
  },
  pendingNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pendingText: {
    color: '#EA580C',
    fontSize: 12,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#64748B',
    marginTop: 12,
    fontWeight: '500',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  emptyStateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
    color: '#059669',
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
    backgroundColor: '#059669',
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
  detailCard: {
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
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#1E293B',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});