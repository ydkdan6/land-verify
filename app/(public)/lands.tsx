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
} from 'react-native';
import { supabase, Database } from '@/lib/supabase';
import { MapPin, Eye, DollarSign, Hash, Ruler, Calendar } from 'lucide-react-native';

type LandRecord = Database['public']['Tables']['land_records']['Row'] & {
  profiles?: Database['public']['Tables']['profiles']['Row'];
};

export default function PublicLandsScreen() {
  const [lands, setLands] = useState<LandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLand, setSelectedLand] = useState<LandRecord | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'price_low' | 'price_high' | 'size_small' | 'size_large'>('newest');

  useEffect(() => {
    fetchLands();
  }, []);

  useEffect(() => {
    sortLands();
  }, [sortBy]);

  const fetchLands = async () => {
    try {
      const { data, error } = await supabase
        .from('land_records')
        .select(`
          *,
          user_profiles:owner_id (
            id,
            full_name
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

  const sortLands = () => {
    const sorted = [...lands].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'price_low':
          if (!a.price && !b.price) return 0;
          if (!a.price) return 1;
          if (!b.price) return -1;
          return a.price - b.price;
        case 'price_high':
          if (!a.price && !b.price) return 0;
          if (!a.price) return 1;
          if (!b.price) return -1;
          return b.price - a.price;
        case 'size_small':
          return a.size - b.size;
        case 'size_large':
          return b.size - a.size;
        default:
          return 0;
      }
    });
    setLands(sorted);
  };

  const getSortLabel = (sort: typeof sortBy) => {
    switch (sort) {
      case 'newest': return 'Newest First';
      case 'price_low': return 'Price: Low to High';
      case 'price_high': return 'Price: High to Low';
      case 'size_small': return 'Size: Small to Large';
      case 'size_large': return 'Size: Large to Small';
      default: return 'Newest First';
    }
  };

  const LandCard = ({ land }: { land: LandRecord }) => (
    <TouchableOpacity
      style={styles.landCard}
      onPress={() => setSelectedLand(land)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.landInfo}>
          <Text style={styles.landTitle}>{land.title}</Text>
          <View style={styles.locationRow}>
            <MapPin size={14} color="#64748B" />
            <Text style={styles.landLocation}>{land.location}</Text>
          </View>
        </View>
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✅</Text>
        </View>
      </View>

      <View style={styles.landSpecs}>
        <View style={styles.spec}>
          <Ruler size={16} color="#64748B" />
          <Text style={styles.specText}>{land.size} {land.size_unit}</Text>
        </View>
        <View style={styles.spec}>
          <Text style={styles.zoneText}>Zone: {land.zoning}</Text>
        </View>
      </View>

      {land.price && (
        <View style={styles.priceRow}>
          <Hash size={18} color="#059669" />
          <Text style={styles.price}>₦{land.price.toLocaleString()}</Text>
        </View>
      )}

      <View style={styles.cardFooter}>
        <View style={styles.dateRow}>
          <Calendar size={14} color="#94A3B8" />
          <Text style={styles.dateText}>
            Listed {new Date(land.created_at).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity style={styles.viewButton}>
          <Eye size={16} color="#64748B" />
          <Text style={styles.viewButtonText}>View</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const SortButton = ({ sort, label }: { sort: typeof sortBy; label: string }) => (
    <TouchableOpacity
      style={[
        styles.sortButton,
        sortBy === sort && styles.sortButtonActive,
      ]}
      onPress={() => setSortBy(sort)}
    >
      <Text
        style={[
          styles.sortButtonText,
          sortBy === sort && styles.sortButtonTextActive,
        ]}
      >
        {label}
      </Text>
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
        <Text style={styles.title}>Browse Land Records</Text>
        <Text style={styles.subtitle}>{lands.length} verified properties</Text>
      </View>

      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
          <SortButton sort="newest" label="Newest" />
          <SortButton sort="price_low" label="Price ↑" />
          <SortButton sort="price_high" label="Price ↓" />
          <SortButton sort="size_small" label="Size ↑" />
          <SortButton sort="size_large" label="Size ↓" />
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView}>
        {lands.map((land) => (
          <LandCard key={land.id} land={land} />
        ))}
        {lands.length === 0 && (
          <View style={styles.emptyState}>
            <MapPin size={48} color="#64748B" />
            <Text style={styles.emptyStateText}>No verified land records</Text>
            <Text style={styles.emptyStateSubtext}>
              Check back later for new listings
            </Text>
          </View>
        )}
      </ScrollView>

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
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.statusCard}>
                <Text style={styles.statusText}>✅ Verified Property</Text>
                <Text style={styles.statusSubtext}>
                  This land record has been verified by administrators
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Location</Text>
                <Text style={styles.sectionContent}>{selectedLand.location}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Property Details</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Size:</Text>
                  <Text style={styles.detailValue}>{selectedLand.size} {selectedLand.size_unit}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Zoning:</Text>
                  <Text style={styles.detailValue}>{selectedLand.zoning}</Text>
                </View>
                {selectedLand.price && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Price:</Text>
                    <Text style={[styles.detailValue, styles.priceValue]}>
                      ₦{selectedLand.price.toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>

              {selectedLand.coordinates && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Coordinates</Text>
                  <Text style={styles.sectionContent}>{selectedLand.coordinates}</Text>
                </View>
              )}

              {selectedLand.description && (
                <View style={styles.detailSection}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.sectionContent}>{selectedLand.description}</Text>
                </View>
              )}

              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Listing Information</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Listed:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedLand.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Last Updated:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedLand.updated_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.contactSection}>
                <Text style={styles.contactTitle}>Interested in this property?</Text>
                <Text style={styles.contactSubtext}>
                  Contact the relevant authorities or use the search function to request ownership verification.
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
  sortContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sortLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  sortScroll: {
    flexDirection: 'row',
  },
  sortButton: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sortButtonActive: {
    backgroundColor: '#64748B',
    borderColor: '#64748B',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: 'white',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  landInfo: {
    flex: 1,
  },
  landTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  landLocation: {
    fontSize: 14,
    color: '#64748B',
  },
  verifiedBadge: {
    backgroundColor: '#F0FDF4',
    padding: 6,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 16,
  },
  landSpecs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  zoneText: {
    fontSize: 14,
    color: '#64748B',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  price: {
    fontSize: 20,
    fontWeight: '600',
    color: '#059669',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
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
    flex: 1,
  },
  closeButton: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
    marginBottom: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 14,
    color: '#065F46',
  },
  detailSection: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  priceValue: {
    color: '#059669',
    fontWeight: '600',
  },
  contactSection: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
    marginTop: 8,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  contactSubtext: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
});