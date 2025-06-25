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
import { BookOpen, Eye, Info } from 'lucide-react-native';

type ZoningLaw = Database['public']['Tables']['zoning_laws']['Row'];

export default function PublicZoningScreen() {
  const [zoningLaws, setZoningLaws] = useState<ZoningLaw[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZoning, setSelectedZoning] = useState<ZoningLaw | null>(null);

  useEffect(() => {
    fetchZoningLaws();
  }, []);

  const fetchZoningLaws = async () => {
    try {
      const { data, error } = await supabase
        .from('zoning_laws')
        .select('*')
        .order('zone_type');

      if (error) throw error;
      setZoningLaws(data || []);
    } catch (error) {
      console.error('Error fetching zoning laws:', error);
      Alert.alert('Error', 'Failed to load zoning laws');
    } finally {
      setLoading(false);
    }
  };

  const getZoneColor = (zoneType: string) => {
    switch (zoneType.toLowerCase()) {
      case 'residential': return '#2563EB';
      case 'commercial': return '#059669';
      case 'industrial': return '#EA580C';
      case 'agricultural': return '#65A30D';
      case 'mixed-use': return '#7C3AED';
      default: return '#64748B';
    }
  };

  const getZoneIcon = (zoneType: string) => {
    switch (zoneType.toLowerCase()) {
      case 'residential': return '🏠';
      case 'commercial': return '🏢';
      case 'industrial': return '🏭';
      case 'agricultural': return '🌾';
      case 'mixed-use': return '🏘️';
      default: return '📍';
    }
  };

  const ZoningCard = ({ zoning }: { zoning: ZoningLaw }) => (
    <TouchableOpacity
      style={[styles.zoningCard, { borderLeftColor: getZoneColor(zoning.zone_type) }]}
      onPress={() => setSelectedZoning(zoning)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.zoneInfo}>
          <Text style={styles.zoneIcon}>{getZoneIcon(zoning.zone_type)}</Text>
          <View style={styles.zoneDetails}>
            <Text style={styles.zoneTitle}>{zoning.zone_type}</Text>
            <Text style={styles.zoneDescription} numberOfLines={2}>
              {zoning.description}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.viewButton}>
          <Eye size={16} color={getZoneColor(zoning.zone_type)} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading zoning laws...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Zoning Laws & Regulations</Text>
        <Text style={styles.subtitle}>
          Understanding land use classifications and requirements
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Info size={20} color="#2563EB" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>About Zoning</Text>
          <Text style={styles.infoText}>
            Zoning laws regulate how land can be used in different areas. 
            Understanding these regulations is essential before purchasing or developing land.
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {zoningLaws.map((zoning) => (
          <ZoningCard key={zoning.id} zoning={zoning} />
        ))}
        {zoningLaws.length === 0 && (
          <View style={styles.emptyState}>
            <BookOpen size={48} color="#64748B" />
            <Text style={styles.emptyStateText}>No zoning laws available</Text>
            <Text style={styles.emptyStateSubtext}>
              Zoning information will be displayed here when available
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Zoning Details Modal */}
      <Modal
        visible={!!selectedZoning}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedZoning && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalIcon}>{getZoneIcon(selectedZoning.zone_type)}</Text>
                <Text style={styles.modalTitle}>{selectedZoning.zone_type} Zone</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedZoning(null)}>
                <Text style={styles.closeButton}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={[styles.zoneTypeCard, { backgroundColor: getZoneColor(selectedZoning.zone_type) + '20' }]}>
                <Text style={[styles.zoneTypeTitle, { color: getZoneColor(selectedZoning.zone_type) }]}>
                  {selectedZoning.zone_type}
                </Text>
                <Text style={styles.zoneTypeDescription}>
                  {selectedZoning.description}
                </Text>
              </View>

              <View style={styles.regulationsSection}>
                <Text style={styles.sectionTitle}>Regulations & Requirements</Text>
                <View style={styles.regulationsCard}>
                  <Text style={styles.regulationsText}>
                    {selectedZoning.regulations}
                  </Text>
                </View>
              </View>

              <View style={styles.additionalInfo}>
                <Text style={styles.sectionTitle}>Important Notes</Text>
                <View style={styles.noteCard}>
                  <Text style={styles.noteText}>
                    • Always consult with local planning authorities before making land use decisions
                  </Text>
                  <Text style={styles.noteText}>
                    • Zoning regulations may change over time - verify current requirements
                  </Text>
                  <Text style={styles.noteText}>
                    • Special permits may be required for certain activities within this zone
                  </Text>
                  <Text style={styles.noteText}>
                    • Environmental assessments may be mandatory for development projects
                  </Text>
                </View>
              </View>

              <View style={styles.contactInfo}>
                <Text style={styles.contactTitle}>Need More Information?</Text>
                <Text style={styles.contactText}>
                  Contact your local planning department or municipal office for detailed 
                  guidance on zoning requirements and permit applications.
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
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  zoningCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  zoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  zoneIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  zoneDetails: {
    flex: 1,
  },
  zoneTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  zoneDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  viewButton: {
    padding: 8,
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
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
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
  zoneTypeCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  zoneTypeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  zoneTypeDescription: {
    fontSize: 16,
    color: '#1E293B',
    lineHeight: 24,
  },
  regulationsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  regulationsCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  regulationsText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 22,
  },
  additionalInfo: {
    marginBottom: 20,
  },
  noteCard: {
    backgroundColor: '#FFFBEB',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  noteText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    marginBottom: 8,
  },
  contactInfo: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#065F46',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#065F46',
    lineHeight: 20,
  },
});