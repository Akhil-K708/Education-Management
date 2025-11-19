import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { getStudentFeeDetails } from '../../src/api/feesApi';
import { useAuth } from '../../src/context/AuthContext';
import { FeeItem, PaymentHistoryItem, StudentFeeDetails } from '../../src/types/fees';

export default function FeesScreen() {
  const { state } = useAuth();
  const user = state.user;
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feeData, setFeeData] = useState<StudentFeeDetails | null>(null);
  const [activeTab, setActiveTab] = useState<'DUES' | 'HISTORY'>('DUES');

  const fetchData = async () => {
    if (!user?.username) return;
    try {
      setLoading(true);
      const data = await getStudentFeeDetails(user.username);
      setFeeData(data);
    } catch (error) {
      console.error("Failed to load fee details:", error);
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

  if (state.status === 'loading' || !user || (loading && !feeData)) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  if (!feeData) return null;

  // --- COMPONENT: Summary Card ---
  const SummaryCard = ({ title, amount, color, icon }: any) => (
    <View style={[styles.summaryCard, { borderLeftColor: color }]}>
      <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View>
        <Text style={styles.summaryLabel}>{title}</Text>
        <Text style={[styles.summaryValue, { color: color }]}>₹{amount.toLocaleString()}</Text>
      </View>
    </View>
  );

  // --- COMPONENT: Fee Item (Pending) ---
  const renderFeeItem = (item: FeeItem) => (
    <View key={item.id} style={styles.cardContainer}>
      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.feeTitle}>{item.title}</Text>
          <Text style={styles.feeDate}>Due: {item.dueDate}</Text>
        </View>
        <View style={styles.amountContainer}>
           <Text style={styles.amountText}>₹{item.amount.toLocaleString()}</Text>
           <View style={[
             styles.statusBadge, 
             item.status === 'OVERDUE' ? styles.statusOverdue : styles.statusPending
           ]}>
             <Text style={[
               styles.statusText, 
               item.status === 'OVERDUE' ? styles.textOverdue : styles.textPending
             ]}>{item.status}</Text>
           </View>
        </View>
      </View>
      
      <TouchableOpacity style={styles.payButton}>
        <Text style={styles.payButtonText}>Pay Now</Text>
        <Ionicons name="arrow-forward" size={16} color="#FFF" />
      </TouchableOpacity>
    </View>
  );

  // --- COMPONENT: History Item ---
  const renderHistoryItem = (item: PaymentHistoryItem) => (
    <View key={item.id} style={styles.cardContainer}>
      <View style={styles.rowBetween}>
        <View>
          <Text style={styles.feeTitle}>{item.type}</Text>
          <Text style={styles.feeDate}>{item.date} • {item.method}</Text>
          <Text style={styles.receiptText}>Receipt: {item.receipt}</Text>
        </View>
        <View style={styles.amountContainer}>
           <Text style={[styles.amountText, {color: '#10B981'}]}>+ ₹{item.amount.toLocaleString()}</Text>
           <View style={styles.statusPaid}>
             <Ionicons name="checkmark-circle" size={14} color="#10B981" />
             <Text style={styles.textPaid}>PAID</Text>
           </View>
        </View>
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.pageTitle}>Fee Details</Text>

      {/* --- 1. SUMMARY SECTION --- */}
      <View style={[styles.summaryContainer, isWeb && styles.summaryWeb]}>
        <SummaryCard 
          title="Total Fee" 
          amount={feeData.summary.totalFee} 
          color="#2563EB" 
          icon="wallet-outline" 
        />
        <SummaryCard 
          title="Paid Amount" 
          amount={feeData.summary.paidAmount} 
          color="#10B981" 
          icon="checkmark-done-circle-outline" 
        />
        <SummaryCard 
          title="Pending Due" 
          amount={feeData.summary.pendingAmount} 
          color="#EF4444" 
          icon="alert-circle-outline" 
        />
      </View>

      {/* --- 2. TABS --- */}
      <View style={styles.tabContainer}>
         <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'DUES' && styles.tabActive]}
            onPress={() => setActiveTab('DUES')}
         >
            <Text style={[styles.tabText, activeTab === 'DUES' && styles.tabTextActive]}>Pending Dues</Text>
         </TouchableOpacity>
         <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'HISTORY' && styles.tabActive]}
            onPress={() => setActiveTab('HISTORY')}
         >
            <Text style={[styles.tabText, activeTab === 'HISTORY' && styles.tabTextActive]}>Payment History</Text>
         </TouchableOpacity>
      </View>

      {/* --- 3. LIST SECTION --- */}
      {activeTab === 'DUES' ? (
        <View>
          {feeData.pendingFees.length > 0 ? (
            feeData.pendingFees.map(renderFeeItem)
          ) : (
            <Text style={styles.emptyText}>No pending dues!</Text>
          )}
        </View>
      ) : (
        <View>
          {feeData.paymentHistory.length > 0 ? (
            feeData.paymentHistory.map(renderHistoryItem)
          ) : (
            <Text style={styles.emptyText}>No payment history found.</Text>
          )}
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F3F4F6',
  },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: {
    fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 20,
  },

  // Summary Cards
  summaryContainer: {
    flexDirection: 'column', gap: 12, marginBottom: 24,
  },
  summaryWeb: {
    flexDirection: 'row', justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 16,
  },
  summaryLabel: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: 'bold' },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2,
  },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#F97316' },

  // List Cards
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
  },
  rowBetween: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  feeTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  feeDate: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  receiptText: { fontSize: 12, color: '#9CA3AF' },

  amountContainer: { alignItems: 'flex-end' },
  amountText: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  
  // Status Badges
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusOverdue: { backgroundColor: '#FEE2E2' },
  statusPending: { backgroundColor: '#FEF3C7' },
  statusPaid: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  
  statusText: { fontSize: 11, fontWeight: 'bold' },
  textOverdue: { color: '#DC2626' },
  textPending: { color: '#D97706' },
  textPaid: { color: '#059669', fontSize: 11, fontWeight: 'bold', marginLeft: 4 },

  // Pay Button
  payButton: {
    marginTop: 16,
    backgroundColor: '#F97316',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButtonText: { color: '#FFFFFF', fontWeight: 'bold', marginRight: 8 },

  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 20, fontStyle: 'italic' },
});