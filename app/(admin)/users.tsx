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
} from 'react-native';
import { supabase, Database } from '@/lib/supabase';
import { Users, Search, Mail, Phone, Shield, User, MapPin } from 'lucide-react-native';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'admin' | 'landowner' | 'public'>('all');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield size={16} color="#2563EB" />;
      case 'landowner': return <MapPin size={16} color="#059669" />;
      case 'public': return <User size={16} color="#64748B" />;
      default: return <User size={16} color="#64748B" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return '#2563EB';
      case 'landowner': return '#059669';
      case 'public': return '#64748B';
      default: return '#64748B';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filter === 'all' || user.role === filter;
    
    return matchesSearch && matchesFilter;
  });

  const UserCard = ({ user }: { user: Profile }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.full_name}</Text>
          <View style={styles.roleContainer}>
            {getRoleIcon(user.role)}
            <Text style={[styles.roleText, { color: getRoleColor(user.role) }]}>
              {user.role === 'public' ? 'General Public' : 
               user.role === 'landowner' ? 'Land Owner' : 'Admin/Surveyor'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.userDetails}>
        <View style={styles.detailRow}>
          <Mail size={16} color="#64748B" />
          <Text style={styles.detailText}>{user.email}</Text>
        </View>
        {user.phone && (
          <View style={styles.detailRow}>
            <Phone size={16} color="#64748B" />
            <Text style={styles.detailText}>{user.phone}</Text>
          </View>
        )}
        <Text style={styles.joinDate}>
          Joined: {new Date(user.created_at).toLocaleDateString()}
        </Text>
      </View>
    </View>
  );

  const FilterButton = ({ role, label }: { role: typeof filter; label: string }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        filter === role && styles.filterButtonActive,
      ]}
      onPress={() => setFilter(role)}
    >
      <Text
        style={[
          styles.filterButtonText,
          filter === role && styles.filterButtonTextActive,
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
          <Text>Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>User Management</Text>

      <View style={styles.searchContainer}>
        <Search size={20} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.filterContainer}>
        <FilterButton role="all" label="All" />
        <FilterButton role="admin" label="Admins" />
        <FilterButton role="landowner" label="Landowners" />
        <FilterButton role="public" label="Public" />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{filteredUsers.length}</Text>
          <Text style={styles.statLabel}>
            {filter === 'all' ? 'Total Users' : 
             filter === 'admin' ? 'Admins' :
             filter === 'landowner' ? 'Landowners' : 'Public Users'}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {filteredUsers.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
        {filteredUsers.length === 0 && (
          <View style={styles.emptyState}>
            <Users size={48} color="#64748B" />
            <Text style={styles.emptyStateText}>No users found</Text>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: 16,
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
    fontSize: 12,
    color: '#64748B',
  },
  filterButtonTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2563EB',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  userCard: {
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
  userHeader: {
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  userDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
  },
  joinDate: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
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