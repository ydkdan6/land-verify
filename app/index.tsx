import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function IndexScreen() {
  const { session, profile, loading, user } = useAuth();
  const router = useRouter();

  // Add comprehensive logging
  useEffect(() => {
    console.log('🏠 IndexScreen: Auth state changed', {
      loading,
      hasSession: !!session,
      hasUser: !!user,
      hasProfile: !!profile,
      sessionUser: session?.user?.id,
      userFromContext: user?.id,
      profileRole: profile?.role,
      profileId: profile?.id,
      timestamp: new Date().toISOString()
    });

    if (!loading) {
      console.log('🏠 IndexScreen: Loading complete, making routing decision...');
      
      if (!session || !profile) {
        console.log('🏠 IndexScreen: Missing auth data, redirecting to /auth', {
          missingSession: !session,
          missingProfile: !profile
        });
        router.replace('/auth');
      } else {
        console.log('🏠 IndexScreen: User authenticated, routing based on role:', profile.role);
        
        // Redirect based on user role
        switch (profile.role) {
          case 'admin':
            console.log('🏠 IndexScreen: Redirecting admin to /(admin)');
            router.replace('/(admin)');
            break;
          case 'landowner':
            console.log('🏠 IndexScreen: Redirecting landowner to /(landowner)');
            router.replace('/(landowner)');
            break;
          case 'public':
            console.log('🏠 IndexScreen: Redirecting public user to /(public)');
            router.replace('/(public)');
            break;
          default:
            console.log('🏠 IndexScreen: Unknown role, redirecting to /auth. Role was:', profile.role);
            router.replace('/auth');
        }
      }
    } else {
      console.log('🏠 IndexScreen: Still loading, waiting...');
    }
  }, [loading, session, profile, router, user]);

  // Add logging for render
  console.log('🏠 IndexScreen: Rendering with loading =', loading);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563EB" />
      <Text style={styles.loadingText}>Redirecting...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
  },
});