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
import { FileText, Plus, Upload, Clock, CheckCircle, XCircle } from 'lucide-react-native';

type Document = Database['public']['Tables']['ownership_documents']['Row'] & {
  land_records?: Database['public']['Tables']['land_records']['Row'];
};

export default function LandownerDocumentsScreen() {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [myLands, setMyLands] = useState<Database['public']['Tables']['land_records']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [formData, setFormData] = useState({
    land_record_id: '',
    document_type: 'deed' as 'deed' | 'survey' | 'certificate' | 'other',
    document_url: '',
    notes: '',
  });

  useEffect(() => {
    if (profile) {
      fetchDocuments();
      fetchMyLands();
    }
  }, [profile]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('ownership_documents')
        .select(`
          *,
          land_records (
            id,
            title,
            location
          )
        `)
        .eq('submitted_by', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyLands = async () => {
    try {
      const { data, error } = await supabase
        .from('land_records')
        .select('*')
        .eq('owner_id', profile?.id)
        .order('title');

      if (error) throw error;
      setMyLands(data || []);
    } catch (error) {
      console.error('Error fetching lands:', error);
    }
  };

  const handleSubmitDocument = async () => {
    if (!formData.land_record_id || !formData.document_url) {
      Alert.alert('Error', 'Please select a land record and provide document URL');
      return;
    }

    try {
      const { error } = await supabase
        .from('ownership_documents')
        .insert({
          land_record_id: formData.land_record_id,
          document_type: formData.document_type,
          document_url: formData.document_url,
          submitted_by: profile?.id!,
          notes: formData.notes || null,
        });

      if (error) throw error;

      Alert.alert('Success', 'Document submitted for review');
      setShowAddModal(false);
      resetForm();
      fetchDocuments();
    } catch (error: any) {
      console.error('Error submitting document:', error);
      Alert.alert('Error', error.message || 'Failed to submit document');
    }
  };

  const resetForm = () => {
    setFormData({
      land_record_id: '',
      document_type: 'deed',
      document_url: '',
      notes: '',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#059669';
      case 'pending': return '#EA580C';
      case 'rejected': return '#DC2626';
      default: return '#64748B';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle size={16} color="#059669" />;
      case 'pending': return <Clock size={16} color="#EA580C" />;
      case 'rejected': return <XCircle size={16} color="#DC2626" />;
      default: return <FileText size={16} color="#64748B" />;
    }
  };

  const DocumentCard = ({ document }: { document: Document }) => (
    <View style={styles.documentCard}>
      <View style={styles.documentHeader}>
        <View style={styles.documentInfo}>
          <Text style={styles.documentTitle}>
            {document.document_type.charAt(0).toUpperCase() + document.document_type.slice(1)} Document
          </Text>
          <Text style={styles.landTitle}>{document.land_records?.title}</Text>
          <Text style={styles.landLocation}>{document.land_records?.location}</Text>
        </View>
        <View style={styles.statusContainer}>
          {getStatusIcon(document.status)}
          <Text style={[styles.statusText, { color: getStatusColor(document.status) }]}>
            {document.status}
          </Text>
        </View>
      </View>

      <Text style={styles.submission}>
        Submitted: {new Date(document.created_at).toLocaleDateString()}
      </Text>

      {document.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Review Notes:</Text>
          <Text style={styles.notesText}>{document.notes}</Text>
        </View>
      )}

      {document.status === 'rejected' && (
        <View style={styles.rejectedNotice}>
          <XCircle size={16} color="#DC2626" />
          <Text style={styles.rejectedText}>
            Document was rejected. Please review the notes and resubmit with corrections.
          </Text>
        </View>
      )}
    </View>
  );

  const stats = {
    total: documents.length,
    approved: documents.filter(d => d.status === 'approved').length,
    pending: documents.filter(d => d.status === 'pending').length,
    rejected: documents.filter(d => d.status === 'rejected').length,
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading documents...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Documents</Text>
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
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#059669' }]}>{stats.approved}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#EA580C' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#DC2626' }]}>{stats.rejected}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {documents.map((document) => (
          <DocumentCard key={document.id} document={document} />
        ))}
        {documents.length === 0 && (
          <View style={styles.emptyState}>
            <FileText size={48} color="#64748B" />
            <Text style={styles.emptyStateText}>No documents submitted</Text>
            <Text style={styles.emptyStateSubtext}>
              Submit ownership documents for verification
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setShowAddModal(true)}
            >
              <Upload size={20} color="white" />
              <Text style={styles.emptyStateButtonText}>Submit Document</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Add Document Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Submit Document</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.fieldLabel}>Select Land Record *</Text>
            <View style={styles.pickerContainer}>
              {myLands.map((land) => (
                <TouchableOpacity
                  key={land.id}
                  style={[
                    styles.landOption,
                    formData.land_record_id === land.id && styles.landOptionSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, land_record_id: land.id })}
                >
                  <Text style={[
                    styles.landOptionText,
                    formData.land_record_id === land.id && styles.landOptionTextSelected,
                  ]}>
                    {land.title} - {land.location}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Document Type *</Text>
            <View style={styles.typeContainer}>
              {(['deed', 'survey', 'certificate', 'other'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    formData.document_type === type && styles.typeButtonSelected,
                  ]}
                  onPress={() => setFormData({ ...formData, document_type: type })}
                >
                  <Text style={[
                    styles.typeButtonText,
                    formData.document_type === type && styles.typeButtonTextSelected,
                  ]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Document URL *</Text>
            <TextInput
              style={styles.input}
              placeholder="https://example.com/document.pdf"
              placeholderTextColor='grey'
              value={formData.document_url}
              onChangeText={(text) => setFormData({ ...formData, document_url: text })}
              keyboardType="url"
            />

            <Text style={styles.fieldLabel}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any additional information about this document..."
              placeholderTextColor='grey'
              value={formData.notes}
              onChangeText={(text) => setFormData({ ...formData, notes: text })}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitDocument}>
              <Upload size={20} color="white" />
              <Text style={styles.submitButtonText}>Submit Document</Text>
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
    backgroundColor: '#059669',
    padding: 12,
    borderRadius: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  documentCard: {
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
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  landTitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  landLocation: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  submission: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  notesContainer: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#1E293B',
    fontStyle: 'italic',
  },
  rejectedNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    gap: 8,
  },
  rejectedText: {
    flex: 1,
    fontSize: 12,
    color: '#DC2626',
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
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 8,
  },
  pickerContainer: {
    marginBottom: 20,
  },
  landOption: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  landOptionSelected: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  landOptionText: {
    fontSize: 14,
    color: '#64748B',
  },
  landOptionTextSelected: {
    color: '#059669',
    fontWeight: '500',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: 'white',
  },
  typeButtonSelected: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#64748B',
  },
  typeButtonTextSelected: {
    color: '#059669',
    fontWeight: '500',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});