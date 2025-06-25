import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Database } from '@/lib/supabase';
import { Search, MapPin, Filter, Eye, DollarSign, Ruler } from 'lucide-react-native';

type LandRecord = Database['public']['Tables']['land_records']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row'];
};

export default function PublicSearchScreen() {
  const { profile } = useAuth();
  const [lands, setLands] = useState<LandRecord[]>([]);
  const [filteredLands, setFilteredLands] = useState<LandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLand, setSelectedLand] = useState<LandRecord | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minSize: '',
    maxSize: '',
    zoning: '',
    status: 'verified',
  });

  useEffect(() => {
    fetchLands();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [lands, searchQuery, filters]);

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
        .eq('ownership_status', 'verified')
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

  const applyFilters = () => {
    let filtered = lands;

    // Search query filter
    if (searchQuery) {
      filtered = filtered.filter(land =>
        land.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        land.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        land.zoning.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Price filters
    if (filters.minPrice) {
      filtered = filtered.filter(land => 
        land.price && land.price >= parseFloat(filters.minPrice)
      );
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(land => 
        land.price && land.price <= parseFloat(filters.maxPrice)
      );
    }

    // Size filters
    if (filters.minSize) {
      filtered = filtered.filter(land => 
        land.size >= parseFloat(filters.minSize)
      );
    }
    if (filters.maxSize) {
      filtered = filtered.filter(land => 
        land.size <= parseFloat(filters.maxSize)
      );
    }

    // Zoning filter
    if (filters.zoning) {
      filtered = filtered.filter(land =>
        land.zoning.toLowerCase().includes(filters.zoning.toLowerCase())
      );
    }

    setFilteredLands(filtered);
  };

  const requestOwnershipVerification = async (landId: string) => {
    Alert.alert(
      'Request Ownership Verification',
      'This will send a request to verify the ownership of this land. The owner will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Request',
          onPress: async () => {
            try {
              // Create notification for the land owner
              const land = lands.find(l => l.id === landId);
              if (land?.owner_id) {
                await supabase
                  .from('notifications')
                  .insert({
                    user_id: land.owner_id,
                    title: 'Ownership Verification Request',
                    message: `${profile?.full_name} has requested ownership verification for your land: ${land.title}`,
                    type: 'info',
                  });

                Alert.alert('Success', 'Verification request sent to the land owner');
              }
            } catch (error: any) {
              console.error('Error sending verification request:', error);
              Alert.alert('Error', 'Failed to send verification request');
            }
          },
        },
      ]
    );
  };

  const clearFilters = () => {
    setFilters({
      minPrice: '',
      maxPrice: '',
      minSize: '',
      maxSize: '',
      zoning: '',
      status: 'verified',
    });
  };

  const LandCard = ({ land }: { land: LandRecord }) => (
    <TouchableOpacity
      style={styles.landCard}
      onPress={() => setSelectedLand(land)}
    >
      <View style={styles.landHeader}>
        <Text style={styles.landTitle}>{land.title}</Text>
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✅ Verified</Text>
        </View>
      </View>
      
      <View style={styles.landDetails}>
        <Text style={styles.landLocation}>📍 {land.location}</Text>
        <View style={styles.landSpecs}>
          <View style={styles.spec}>
            <Ruler size={16} color="#64748B" />
            <Text style={styles.specText}>{land.size} {land.size_unit}</Text>
          </View>
          <Text style={styles.landZoning}>Zone: {land.zoning}</Text>
        </View>
        {land.price && (
          <View style={styles.priceContainer}>
            <DollarSign size={16} color="#059669" />
            <Text style={styles.landPrice}>${land.price.toLocaleString()}</Text>
          </View>
        )}
      </View>

      <View style={styles.landFooter}>
        <TouchableOpacity style={styles.viewButton}>
          <Eye size={16} color="#64748B" />
          <Text style={styles.viewButtonText}>View Details</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.verifyButton}
          onPress={(e) => {
            e.stopPropagation();
            requestOwnershipVerification(land.id);
          }}
        >
          <Text style={styles.verifyButtonText}>Request Verification</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
        <Text style={styles.title}>Search Land Records</Text>
        <Text style={styles.subtitle}>Find verified land information</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, location, or zoning..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Filter size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredLands.length} land record{filteredLands.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {filteredLands.map((land) => (
          <LandCard key={land.id} land={land} />
        ))}
        {filteredLands.length === 0 && (
          <View style={styles.emptyState}>
            <MapPin size={48} color="#64748B" />
            <Text style={styles.emptyStateText}>No land records found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your search criteria or filters
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Results</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={clearFilters}>
                <Text style={styles.clearButton}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Text style={styles.doneButton}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.filterSection}>Price Range</Text>
            <View style={styles.rangeContainer}>
              <TextInput
                style={styles.rangeInput}
                placeholder="Min Price"
                value={filters.minPrice}
                onChangeText={(text) => setFilters({ ...filters, minPrice: text })}
                keyboardType="numeric"
              />
              <Text style={styles.rangeSeparator}>to</Text>
              <TextInput
                style={styles.rangeInput}
                placeholder="Max Price"
                value={filters.maxPrice}
                onChangeText={(text) => setFilters({ ...filters, maxPrice: text })}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.filterSection}>Size Range (acres)</Text>
            <View style={styles.rangeContainer}>
              <TextInput
                style={styles.rangeInput}
                placeholder="Min Size"
                value={filters.minSize}
                onChangeText={(text) => setFilters({ ...filters, minSize: text })}
                keyboardType="numeric"
              />
              <Text style={styles.rangeSeparator}>to</Text>
              <TextInput
                style={styles.rangeInput}
                placeholder="Max Size"
                value={filters.maxSize}
                onChangeText={(text) => setFilters({ ...filters, maxSize: text })}
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.filterSection}>Zoning</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter zoning type..."
              value={filters.zoning}
              onChangeText={(text) => setFilters({ ...filters, zoning: text })}
            />
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
                <Text style={styles.doneButton}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.detailCard}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={[styles.detailValue, { color: '#059669' }]}>
                  ✅ VERIFIED
                </Text>
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

              <TouchableOpacity
                style={styles.verificationButton}
                onPress={() => {
                  setSelectedLand(null);
                  requestOwnershipVerification(selectedLand.id);
                }}
              >
                <Text style={styles.verificationButtonText}>
                  Request Ownership Verification
                </Text>
              </TouchableOpacity>
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
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
  filterButton: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultsHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  resultsCount: {
    fontSize: 14,
    color: '#64748B',
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
  verifiedBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  landDetails: {
    marginBottom: 12,
  },
  landLocation: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  landSpecs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  spec: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontSize: 14,
    color: '#64748B',
  },
  landZoning: {
    fontSize: 14,
    color: '#64748B',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  landPrice: {
    fontSize: 18,
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
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  verifyButton: {
    backgroundColor: '#64748B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  verifyButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
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
  modalActions: {
    flexDirection: 'row',
    gap: 16,
  },
  clearButton: {
    color: '#64748B',
    fontSize: 16,
  },
  doneButton: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    marginTop: 16,
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  rangeInput: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  rangeSeparator: {
    color: '#64748B',
    fontSize: 14,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
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
  verificationButton: {
    backgroundColor: '#64748B',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  verificationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});