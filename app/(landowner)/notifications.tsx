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
import { useAuth } from '@/contexts/AuthContext';
import { supabase, Database } from '@/lib/supabase';
import { Bell, CheckCircle, AlertCircle, Info, AlertTriangle, Trash2 } from 'lucide-react-native';

type Notification = Database['public']['Tables']['notifications']['Row'];

export default function LandownerNotificationsScreen() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchNotifications();
    }
  }, [profile]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
      
      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
      Alert.alert('Error', 'Failed to mark all notifications as read');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={20} color="#059669" />;
      case 'warning': return <AlertTriangle size={20} color="#EA580C" />;
      case 'error': return <AlertCircle size={20} color="#DC2626" />;
      default: return <Info size={20} color="#2563EB" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return '#F0FDF4';
      case 'warning': return '#FFFBEB';
      case 'error': return '#FEF2F2';
      default: return '#EFF6FF';
    }
  };

  const NotificationCard = ({ notification }: { notification: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        !notification.read && styles.unreadCard,
        { backgroundColor: getNotificationColor(notification.type) }
      ]}
      onPress={() => !notification.read && markAsRead(notification.id)}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIcon}>
          {getNotificationIcon(notification.type)}
        </View>
        <View style={styles.notificationContent}>
          <Text style={[styles.notificationTitle, !notification.read && styles.unreadTitle]}>
            {notification.title}
          </Text>
          <Text style={styles.notificationMessage}>
            {notification.message}
          </Text>
          <Text style={styles.notificationTime}>
            {new Date(notification.created_at).toLocaleString()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteNotification(notification.id)}
        >
          <Trash2 size={16} color="#64748B" />
        </TouchableOpacity>
      </View>
      {!notification.read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.unreadCount}>
              {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.markAllButtonText}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        {notifications.map((notification) => (
          <NotificationCard key={notification.id} notification={notification} />
        ))}
        {notifications.length === 0 && (
          <View style={styles.emptyState}>
            <Bell size={48} color="#64748B" />
            <Text style={styles.emptyStateText}>No notifications</Text>
            <Text style={styles.emptyStateSubtext}>
              You'll receive notifications about your land records and documents here
            </Text>
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
  unreadCount: {
    fontSize: 14,
    color: '#EA580C',
    marginTop: 2,
  },
  markAllButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  markAllButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  notificationCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#059669',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '600',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
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
    lineHeight: 20,
  },
});