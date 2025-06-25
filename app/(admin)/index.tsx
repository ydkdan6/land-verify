import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { FileText, Users, MapPin, AlertCircle, TrendingUp, PieChart as PieChartIcon } from 'lucide-react-native';

const screenWidth = Dimensions.get('window').width;

interface DashboardStats {
  totalLands: number;
  pendingDocuments: number;
  totalUsers: number;
  pendingTransactions: number;
}

interface LandRecordsData {
  residential: number;
  commercial: number;
  agricultural: number;
  industrial: number;
}

interface UserAnalytics {
  activeUsers: number;
  inactiveUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalLands: 0,
    pendingDocuments: 0,
    totalUsers: 0,
    pendingTransactions: 0,
  });
  const [landRecordsData, setLandRecordsData] = useState<LandRecordsData>({
    residential: 0,
    commercial: 0,
    agricultural: 0,
    industrial: 0,
  });
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics>({
    activeUsers: 0,
    inactiveUsers: 0,
    verifiedUsers: 0,
    unverifiedUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch basic stats
      const [landsResult, documentsResult, usersResult, transactionsResult] = await Promise.all([
        supabase.from('land_records').select('id', { count: 'exact' }),
        supabase.from('ownership_documents').select('id', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('user_profiles').select('id', { count: 'exact' }),
        supabase.from('transactions').select('id', { count: 'exact' }).eq('status', 'pending'),
      ]);

      // Fetch land records by type
      const landTypesResult = await supabase
        .from('land_records')
        .select('land_type');

      // Fetch user analytics
      const [activeUsersResult, verifiedUsersResult] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id', { count: 'exact' })
          .gte('last_login', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('user_profiles')
          .select('id', { count: 'exact' })
          .eq('is_verified', true),
      ]);

      // Process land records data
      const landTypesCounts = landTypesResult.data?.reduce((acc, record) => {
        const type = record.land_type?.toLowerCase() || 'other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Process user analytics
      const totalUsers = usersResult.count || 0;
      const activeUsers = activeUsersResult.count || 0;
      const verifiedUsers = verifiedUsersResult.count || 0;

      setStats({
        totalLands: landsResult.count || 0,
        pendingDocuments: documentsResult.count || 0,
        totalUsers: totalUsers,
        pendingTransactions: transactionsResult.count || 0,
      });

      setLandRecordsData({
        residential: landTypesCounts.residential || 0,
        commercial: landTypesCounts.commercial || 0,
        agricultural: landTypesCounts.agricultural || 0,
        industrial: landTypesCounts.industrial || 0,
      });

      setUserAnalytics({
        activeUsers: activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        verifiedUsers: verifiedUsers,
        unverifiedUsers: totalUsers - verifiedUsers,
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color }: {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        <Text style={styles.statValue}>{value}</Text>
      </View>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  // Custom Pie Chart Component
  const CustomPieChart = ({ data, size = 160 }: { data: Array<{name: string, value: number, color: string}>, size?: number }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    if (total === 0) return null;

    let currentAngle = 0;
    const radius = size / 2 - 10;
    const centerX = size / 2;
    const centerY = size / 2;

    const segments = data.map(item => {
      const percentage = (item.value / total) * 100;
      const angle = (item.value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      currentAngle += angle;

      // Calculate path for SVG arc
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');

      return {
        ...item,
        pathData,
        percentage: percentage.toFixed(1)
      };
    });

    return (
      <View style={styles.pieChartContainer}>
        <Svg width={size} height={size}>
          {segments.map((segment, index) => (
            <React.Fragment key={index}>
              <Circle
                cx={centerX}
                cy={centerY}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={radius}
                strokeDasharray={`${(segment.value / total) * 2 * Math.PI * radius} ${2 * Math.PI * radius}`}
                strokeDashoffset={-segments.slice(0, index).reduce((sum, s) => sum + (s.value / total) * 2 * Math.PI * radius, 0)}
                transform={`rotate(-90 ${centerX} ${centerY})`}
              />
            </React.Fragment>
          ))}
        </Svg>
        <View style={styles.pieChartLegend}>
          {segments.map((segment, index) => (
            <View key={index} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: segment.color }]} />
              <Text style={styles.legendText}>
                {segment.name}: {segment.value} ({segment.percentage}%)
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const landRecordsChartData = [
    { name: 'Residential', value: landRecordsData.residential, color: '#2563EB' },
    { name: 'Commercial', value: landRecordsData.commercial, color: '#059669' },
    { name: 'Agricultural', value: landRecordsData.agricultural, color: '#EA580C' },
    { name: 'Industrial', value: landRecordsData.industrial, color: '#DC2626' },
  ].filter(item => item.value > 0);

  const userActivityChartData = [
    { name: 'Active Users', value: userAnalytics.activeUsers, color: '#059669' },
    { name: 'Inactive Users', value: userAnalytics.inactiveUsers, color: '#64748B' },
  ].filter(item => item.value > 0);

  const userVerificationChartData = [
    { name: 'Verified', value: userAnalytics.verifiedUsers, color: '#2563EB' },
    { name: 'Unverified', value: userAnalytics.unverifiedUsers, color: '#EA580C' },
  ].filter(item => item.value > 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back, {profile?.full_name}</Text>

        <View style={styles.statsGrid}>
          <StatCard
            title="Total Land Records"
            value={stats.totalLands}
            icon={<MapPin size={24} color="#2563EB" />}
            color="#2563EB"
          />
          <StatCard
            title="Pending Documents"
            value={stats.pendingDocuments}
            icon={<FileText size={24} color="#EA580C" />}
            color="#EA580C"
          />
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<Users size={24} color="#059669" />}
            color="#059669"
          />
          <StatCard
            title="Pending Transactions"
            value={stats.pendingTransactions}
            icon={<TrendingUp size={24} color="#DC2626" />}
            color="#DC2626"
          />
        </View>

        {/* Analytics Charts Section */}
        <View style={styles.analyticsSection}>
          <View style={styles.sectionHeader}>
            <PieChartIcon size={24} color="#2563EB" />
            <Text style={styles.sectionTitle}>Analytics Overview</Text>
          </View>

          {/* Land Records Distribution */}
          {landRecordsChartData.length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Land Records by Type</Text>
              <CustomPieChart data={landRecordsChartData} size={200} />
            </View>
          )}

          {/* User Activity Distribution */}
          {userActivityChartData.length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>User Activity (Last 30 Days)</Text>
              <CustomPieChart data={userActivityChartData} size={200} />
            </View>
          )}

          {/* User Verification Status */}
          {userVerificationChartData.length > 0 && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>User Verification Status</Text>
              <CustomPieChart data={userVerificationChartData} size={200} />
            </View>
          )}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.actionButton}>
            <FileText size={20} color="#2563EB" />
            <Text style={styles.actionButtonText}>Review Documents</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <MapPin size={20} color="#2563EB" />
            <Text style={styles.actionButtonText}>Add Land Record</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Users size={20} color="#2563EB" />
            <Text style={styles.actionButtonText}>Manage Users</Text>
          </TouchableOpacity>
        </View>

        {stats.pendingDocuments > 0 && (
          <View style={styles.alertCard}>
            <AlertCircle size={20} color="#EA580C" />
            <Text style={styles.alertText}>
              You have {stats.pendingDocuments} pending document{stats.pendingDocuments > 1 ? 's' : ''} that need review.
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
  scrollContent: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statIcon: {
    padding: 8,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  statTitle: {
    fontSize: 14,
    color: '#64748B',
  },
  analyticsSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
  chartContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  pieChartContainer: {
    alignItems: 'center',
    width: '100%',
  },
  pieChartLegend: {
    marginTop: 16,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#1E293B',
    flex: 1,
  },
  quickActions: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
  },
  actionButtonText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1E293B',
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#EA580C',
  },
  alertText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#92400E',
    flex: 1,
  },
});