import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { supabase, Database } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { FileText, CheckCircle, XCircle, Clock, User } from 'lucide-react-native';

type Document = Database['public']['Tables']['ownership_documents']['Row'] & {
  land_records?: Database['public']['Tables']['land_records']['Row'];
  profiles?: Database['public']['Tables']['profiles']['Row'];
};

export default function AdminDocumentsScreen() {
  const { profile } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    fetchDocuments();
  }, [filter]);

  const fetchDocuments = async () => {
    try {
      let query = supabase
        .from('ownership_documents')
        .select(`
          *,
          land_records (
            id,
            title,
            location
          ),
          profiles:submitted_by (
            id,
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentAction = async (documentId: string, action: 'approved' | 'rejected', notes?: string) => {
    try {
      const { error } = await supabase
        .from('ownership_documents')
        .update({
          status: action,
          reviewed_by: profile?.id,
          notes: notes || null,
        })
        .eq('id', documentId);

      if (error) throw error;

      Alert.alert('Success', `Document ${action} successfully`);
      fetchDocuments();

      // Create notification for the user
      const document = documents.find(doc => doc.id === documentId);
      if (document) {
        await supabase
          .from('notifications')
          .insert({
            user_id: document.submitted_by,
            title: `Document ${action}`,
            message: `Your ${document.document_type} document for ${document.land_records?.title} has been ${action}.`,
            type: action === 'approved' ? 'success' : 'warning',
          });
      }
    } catch (error: any) {
      console.error('Error updating document:', error);
      Alert.alert('Error', error.message || 'Failed to update document');
    }
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

      <View style={styles.submitterInfo}>
        <User size={16} color="#64748B" />
        <Text style={styles.submitterText}>
          Submitted by: {document.profiles?.full_name} ({document.profiles?.email})
        </Text>
      </View>

      <Text style={styles.submissionDate}>
        Submitted: {new Date(document.created_at).toLocaleDateString()}
      </Text>

      {document.notes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Notes:</Text>
          <Text style={styles.notesText}>{document.notes}</Text>
        </View>
      )}

      {document.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={() => handleDocumentAction(document.id, 'approved')}
          >
            <CheckCircle size={16} color="white" />
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleDocumentAction(document.id, 'rejected')}
          >
            <XCircle size={16} color="white" />
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const FilterButton = ({ status, label }: { status: typeof filter; label: string }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === status && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(status)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === status && styles.filterButtonTextActive,
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
          <Text>Loading documents...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Document Review</Text>

      <View style={styles.filterContainer}>
        <FilterButton status="pending" label="Pending" />
        <FilterButton status="approved" label="Approved" />
        <FilterButton status="rejected" label="Rejected" />
        <FilterButton status="all" label="All" />
      </View>

      <ScrollView style={styles.scrollView}>
        {documents.map((document) => (
          <DocumentCard key={document.id} document={document} />
        ))}
        {documents.length === 0 && (
          <View style={styles.emptyState}>
            <FileText size={48} color="#64748B" />
            <Text style={styles.emptyStateText}>No documents found</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#64748B',
  },
  filterButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
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
  submitterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  submitterText: {
    fontSize: 14,
    color: '#64748B',
  },
  submissionDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 12,
  },
  notesContainer: {
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#64748B',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  approveButton: {
    backgroundColor: '#059669',
  },
  rejectButton: {
    backgroundColor: '#DC2626',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
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
});