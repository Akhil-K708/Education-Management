import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Linking,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import { getStudentTransportDetails } from '../../api/transportApi';
import { useAuth } from '../../context/AuthContext';
import { StudentTransportDetails } from '../../types/transport';

export default function StudentTransportView() {
  const { state } = useAuth();
  const user = state.user;
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transportData, setTransportData] = useState<StudentTransportDetails | null>(null);

  const fetchData = async () => {
    if (!user?.username) return;
    try {
      setLoading(true);
      const data = await getStudentTransportDetails(user.username);
      setTransportData(data);
    } catch (error) {
      console.error("Failed to load transport details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleCallDriver = () => {
    if (transportData?.driverPhone) {
      Linking.openURL(`tel:${transportData.driverPhone}`);
    }
  };

  if (loading && !transportData) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  if (!transportData) {
    return (
        <View style={styles.centered}>
            <Text style={{color: '#6B7280'}}>No transport assigned yet.</Text>
        </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.pageTitle}>My Transport</Text>

      <View style={[styles.mainGrid, isWeb && styles.mainGridWeb]}>
        
        {/* LEFT COLUMN */}
        <View style={[styles.column, isWeb && { flex: 1.5 }]}>
            
            {/* --- 1. ROUTE INFO --- */}
            <View style={styles.card}>
                <View style={styles.headerRow}>
                    <View style={styles.iconBox}>
                        <Ionicons name="map" size={24} color="#F97316" />
                    </View>
                    <View>
                        <Text style={styles.label}>Assigned Route</Text>
                        <Text style={styles.value}>{transportData.routeName}</Text>
                    </View>
                </View>
            </View>

            {/* --- 2. MY STOP & TIMINGS --- */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>My Stop Schedule</Text>
                <View style={styles.stopContainer}>
                    <Ionicons name="location" size={28} color="#EF4444" style={{marginRight: 12}} />
                    <View>
                        <Text style={styles.stopLabel}>Pickup: {transportData.pickupStop}</Text>
                        <Text style={styles.stopLabel}>Drop: {transportData.dropStop}</Text>
                    </View>
                </View>

                <View style={styles.timeRow}>
                    <View style={styles.timeBox}>
                        <Text style={styles.timeLabel}>Pickup Time</Text>
                        <View style={styles.timeValueBox}>
                           <Ionicons name="sunny-outline" size={18} color="#F59E0B" />
                           <Text style={styles.timeValue}>{transportData.pickupTime}</Text>
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.timeBox}>
                        <Text style={styles.timeLabel}>Drop Time</Text>
                        <View style={styles.timeValueBox}>
                           <Ionicons name="moon-outline" size={18} color="#374151" />
                           <Text style={styles.timeValue}>{transportData.dropTime}</Text>
                        </View>
                    </View>
                </View>
            </View>

        </View>

        {/* RIGHT COLUMN */}
        <View style={[styles.column, isWeb && { flex: 1 }]}>

            {/* --- 3. VEHICLE & DRIVER --- */}
            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Vehicle Info</Text>
                <View style={styles.vehicleRow}>
                    <Ionicons name="bus" size={40} color="#2563EB" />
                    <View style={{marginLeft: 16}}>
                        <Text style={styles.busNumber}>{transportData.vehicleName}</Text>
                        <Text style={styles.plateNumber}>{transportData.vehicleNumber}</Text>
                    </View>
                </View>

                <View style={styles.separator} />

                <Text style={[styles.sectionTitle, {marginTop: 16}]}>Driver Info</Text>
                <View style={styles.driverRow}>
                    <View style={styles.driverAvatar}>
                        <Ionicons name="person" size={24} color="#FFF" />
                    </View>
                    <View style={{flex: 1, marginLeft: 12}}>
                        <Text style={styles.driverName}>{transportData.driverName}</Text>
                        <Text style={styles.driverId}>{transportData.driverPhone}</Text>
                    </View>
                    <TouchableOpacity style={styles.callButton} onPress={handleCallDriver}>
                        <Ionicons name="call" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* --- 4. FEE STATUS --- */}
            <View style={[
                styles.card, 
                transportData.feeStatus === 'PAID' ? { borderLeftColor: '#10B981', borderLeftWidth: 4 } : { borderLeftColor: '#EF4444', borderLeftWidth: 4 }
            ]}>
                <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Transport Fee Status</Text>
                    <View style={[
                        styles.statusBadge,
                        transportData.feeStatus === 'PAID' ? { backgroundColor: '#D1FAE5' } : { backgroundColor: '#FEE2E2' }
                    ]}>
                        <Text style={[
                            styles.statusText,
                            transportData.feeStatus === 'PAID' ? { color: '#059669' } : { color: '#DC2626' }
                        ]}>
                            {transportData.feeStatus}
                        </Text>
                    </View>
                </View>
            </View>

        </View>

      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  mainGrid: { flexDirection: 'column', gap: 20 },
  mainGridWeb: { flexDirection: 'row', gap: 24 },
  column: { flexDirection: 'column', gap: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  label: { fontSize: 12, color: '#6B7280', textTransform: 'uppercase', fontWeight: '600' },
  value: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#374151', marginBottom: 12 },
  stopContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, marginBottom: 20 },
  stopLabel: { fontSize: 14, fontWeight: '600', color: '#111827' },

  timeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeBox: { flex: 1, alignItems: 'center' },
  timeLabel: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  timeValueBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  timeValue: { fontSize: 14, fontWeight: 'bold', color: '#111827', marginLeft: 6 },
  divider: { width: 1, height: 40, backgroundColor: '#E5E7EB' },

  vehicleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  busNumber: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  plateNumber: { fontSize: 14, color: '#6B7280' },
  separator: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 16 },
  driverRow: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4B5563', alignItems: 'center', justifyContent: 'center' },
  driverName: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  driverId: { fontSize: 12, color: '#9CA3AF' },
  callButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' },
  
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  feeLabel: { fontSize: 16, fontWeight: '600', color: '#374151' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
});