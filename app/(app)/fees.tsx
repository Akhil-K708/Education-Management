import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
import { studentApi } from '../../src/api/axiosInstance';
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

  // --- PAYMENT MODAL STATE ---
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [selectedFee, setSelectedFee] = useState<FeeItem | null>(null);
  const [paymentStep, setPaymentStep] = useState<'METHOD' | 'PROCESSING' | 'SUCCESS'>('METHOD');
  const [selectedMethod, setSelectedMethod] = useState<'ONLINE' | 'OFFLINE' | null>(null);

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

  // --- PAYMENT HANDLERS ---

  const handlePayClick = (fee: FeeItem) => {
      if (fee.amount <= 0) {
          Alert.alert("Info", "Fee amount not updated yet. Please contact admin.");
          return;
      }
      setSelectedFee(fee);
      setPaymentStep('METHOD');
      setSelectedMethod(null);
      setPayModalVisible(true);
  };

  const processPayment = async () => {
      if (!selectedMethod || !selectedFee) return;

      setPaymentStep('PROCESSING');

      // Simulate Network Delay & Backend Call
      setTimeout(async () => {
          try {
              // Simulate Backend API Call to create Payment
              await studentApi.post('/fee/student/pay', {
                  feeId: selectedFee.feeId,
                  amount: selectedFee.amount, // Paying full amount
                  method: selectedMethod === 'ONLINE' ? 'UPI' : 'CASH'
              });
              
              setPaymentStep('SUCCESS');
              fetchData(); // Refresh data in background
          } catch (e) {
              Alert.alert("Payment Failed", "Something went wrong. Try again.");
              setPayModalVisible(false);
          }
      }, 2000);
  };

  const closePaymentModal = () => {
      setPayModalVisible(false);
      setSelectedFee(null);
  };

  // --- RENDERERS ---

  const SummaryCard = ({ title, amount, color, icon }: any) => (
    <View style={[styles.summaryCard, { borderLeftColor: color }]}>
      <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View>
        <Text style={styles.summaryLabel}>{title}</Text>
        <Text style={[styles.summaryValue, { color: color }]}>
            {amount !== undefined ? `₹${amount.toLocaleString()}` : '-'}
        </Text>
      </View>
    </View>
  );

  const renderFeeItem = (item: FeeItem) => (
    <View key={item.feeId} style={styles.cardContainer}>
      <View style={styles.rowBetween}>
        <View style={{flex: 1}}>
          <Text style={styles.feeTitle}>{item.feeName}</Text>
          <Text style={styles.feeDate}>Due: {item.dueDate}</Text>
        </View>
        <View style={styles.amountContainer}>
           {item.amount > 0 ? (
               <Text style={styles.amountText}>₹{item.amount.toLocaleString()}</Text>
           ) : (
               <Text style={[styles.amountText, {fontSize: 14, color: '#F59E0B'}]}>To be updated</Text>
           )}
           
           {/* Status Badge Logic */}
           <View style={[
             styles.statusBadge, 
             item.status === 'OVERDUE' ? styles.statusOverdue : 
             item.status === 'PAID' ? styles.statusPaidBadge : styles.statusPending
           ]}>
             <Text style={[
               styles.statusText, 
               item.status === 'OVERDUE' ? styles.textOverdue : 
               item.status === 'PAID' ? styles.textPaid : styles.textPending
             ]}>{item.status}</Text>
           </View>
        </View>
      </View>
      
      {/* Divider & Action */}
      {item.status !== 'PAID' && item.amount > 0 && (
          <>
            <View style={styles.cardDivider} />
            <TouchableOpacity style={styles.payButton} onPress={() => handlePayClick(item)}>
                <Text style={styles.payButtonText}>Pay Now</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFF" />
            </TouchableOpacity>
          </>
      )}
    </View>
  );

  const renderHistoryItem = (item: PaymentHistoryItem) => (
    <View key={item.paymentId} style={styles.cardContainer}>
      <View style={styles.rowBetween}>
        {/* 🔥 FIX: Added flex: 1 to allow text wrapping and prevent overflow */}
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={styles.feeTitle}>Payment Received</Text>
          <Text style={styles.feeDate}>{new Date(item.paymentDate).toLocaleDateString()} • {item.method}</Text>
          <Text style={styles.receiptText}>Ref: {item.transactionRef}</Text>
        </View>
        <View style={styles.amountContainer}>
           <Text style={[styles.amountText, {color: '#10B981'}]}>+ ₹{item.amount.toLocaleString()}</Text>
           <View style={styles.statusPaid}>
             <Ionicons name="checkmark-circle" size={14} color="#10B981" />
             <Text style={styles.textPaid}>SUCCESS</Text>
           </View>
        </View>
      </View>
    </View>
  );

  // --- PAYMENT MODAL CONTENT ---
  const renderPaymentModal = () => (
      <Modal visible={payModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, isWeb && {width: 450}]}>
                  
                  {/* HEADER */}
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>
                          {paymentStep === 'SUCCESS' ? 'Payment Receipt' : 'Make Payment'}
                      </Text>
                      {paymentStep !== 'PROCESSING' && paymentStep !== 'SUCCESS' && (
                          <TouchableOpacity onPress={closePaymentModal}>
                              <Ionicons name="close" size={24} color="#374151" />
                          </TouchableOpacity>
                      )}
                  </View>

                  {/* STEP 1: SELECT METHOD */}
                  {paymentStep === 'METHOD' && selectedFee && (
                      <View>
                          <View style={styles.feeSummaryBox}>
                              <Text style={styles.feeNameModal}>{selectedFee.feeName}</Text>
                              <Text style={styles.feeAmountModal}>₹{selectedFee.amount.toLocaleString()}</Text>
                              <Text style={styles.feeDueModal}>Due by {selectedFee.dueDate}</Text>
                          </View>

                          <Text style={styles.methodLabel}>Choose Payment Method</Text>
                          
                          <TouchableOpacity 
                              style={[styles.methodCard, selectedMethod === 'ONLINE' && styles.methodActive]}
                              onPress={() => setSelectedMethod('ONLINE')}
                          >
                              <View style={[styles.methodIcon, {backgroundColor: '#E0F2FE'}]}>
                                  <Ionicons name="card" size={24} color="#0284C7" />
                              </View>
                              <View style={{flex: 1}}>
                                  <Text style={styles.methodTitle}>Pay Online</Text>
                                  <Text style={styles.methodSub}>UPI, Credit/Debit Card, NetBanking</Text>
                              </View>
                              {selectedMethod === 'ONLINE' && <Ionicons name="checkmark-circle" size={24} color="#0284C7" />}
                          </TouchableOpacity>

                          <TouchableOpacity 
                              style={[styles.methodCard, selectedMethod === 'OFFLINE' && styles.methodActive]}
                              onPress={() => setSelectedMethod('OFFLINE')}
                          >
                              <View style={[styles.methodIcon, {backgroundColor: '#FEF3C7'}]}>
                                  <Ionicons name="cash" size={24} color="#D97706" />
                              </View>
                              <View style={{flex: 1}}>
                                  <Text style={styles.methodTitle}>Cash / Cheque</Text>
                                  <Text style={styles.methodSub}>Pay at School Office</Text>
                              </View>
                              {selectedMethod === 'OFFLINE' && <Ionicons name="checkmark-circle" size={24} color="#D97706" />}
                          </TouchableOpacity>

                          <TouchableOpacity 
                              style={[styles.payNowBtn, !selectedMethod && {opacity: 0.5}]}
                              disabled={!selectedMethod}
                              onPress={processPayment}
                          >
                              <Text style={styles.payNowText}>Proceed to Pay ₹{selectedFee.amount.toLocaleString()}</Text>
                          </TouchableOpacity>
                      </View>
                  )}

                  {/* STEP 2: PROCESSING */}
                  {paymentStep === 'PROCESSING' && (
                      <View style={styles.processingContainer}>
                          <ActivityIndicator size="large" color="#2563EB" />
                          <Text style={styles.processingText}>Processing Payment...</Text>
                          <Text style={styles.processingSub}>Please do not close the app</Text>
                      </View>
                  )}

                  {/* STEP 3: SUCCESS */}
                  {paymentStep === 'SUCCESS' && (
                      <View style={styles.successContainer}>
                          <View style={styles.successIconCircle}>
                              <Ionicons name="checkmark" size={40} color="#FFF" />
                          </View>
                          <Text style={styles.successTitle}>Payment Successful!</Text>
                          <Text style={styles.successSub}>Your transaction has been completed.</Text>
                          
                          <View style={styles.receiptBox}>
                              <View style={styles.receiptRow}>
                                  <Text style={styles.receiptLabel}>Amount Paid</Text>
                                  <Text style={styles.receiptValue}>₹{selectedFee?.amount.toLocaleString()}</Text>
                              </View>
                              <View style={styles.receiptRow}>
                                  <Text style={styles.receiptLabel}>Transaction ID</Text>
                                  <Text style={styles.receiptValue}>TXN{Math.floor(Math.random()*1000000)}</Text>
                              </View>
                              <View style={styles.receiptRow}>
                                  <Text style={styles.receiptLabel}>Date</Text>
                                  <Text style={styles.receiptValue}>{new Date().toLocaleDateString()}</Text>
                              </View>
                          </View>

                          <TouchableOpacity style={styles.doneBtn} onPress={closePaymentModal}>
                              <Text style={styles.doneText}>Done</Text>
                          </TouchableOpacity>
                      </View>
                  )}

              </View>
          </View>
      </Modal>
  );

  if (state.status === 'loading' || !user) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  if (loading && !feeData) {
      return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.pageTitle}>Fee & Payments</Text>

      {/* --- 1. SUMMARY SECTION --- */}
      {feeData?.summary && (
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
      )}

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
          {/* If allFees exists but is empty OR has items */}
          {(feeData?.allFees && feeData.allFees.length > 0) ? (
            feeData.allFees
                .filter(item => item.status !== 'PAID') // Only show pending here
                .map(renderFeeItem)
          ) : (
            <View style={styles.emptyState}>
                <Ionicons name="happy-outline" size={48} color="#10B981" />
                <Text style={styles.emptyText}>No pending dues. Great job!</Text>
            </View>
          )}
        </View>
      ) : (
        <View>
          {(feeData?.paymentHistory && feeData.paymentHistory.length > 0) ? (
            feeData.paymentHistory.map(renderHistoryItem)
          ) : (
            <Text style={styles.emptyText}>No payment history found.</Text>
          )}
        </View>
      )}

      {/* PAYMENT MODAL */}
      {renderPaymentModal()}

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
  statusPaidBadge: { backgroundColor: '#D1FAE5' },
  
  statusPaid: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#D1FAE5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  
  statusText: { fontSize: 11, fontWeight: 'bold' },
  textOverdue: { color: '#DC2626' },
  textPending: { color: '#D97706' },
  textPaid: { color: '#059669', fontSize: 11, fontWeight: 'bold', marginLeft: 4 },

  cardDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 12 },

  // Pay Button
  payButton: {
    backgroundColor: '#F97316',
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payButtonText: { color: '#FFFFFF', fontWeight: 'bold', marginRight: 8 },

  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 10, fontStyle: 'italic' },

  // --- MODAL STYLES ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', width: '100%', maxWidth: 450, borderRadius: 16, padding: 24, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  
  feeSummaryBox: { backgroundColor: '#F3F4F6', padding: 16, borderRadius: 12, marginBottom: 20, alignItems: 'center' },
  feeNameModal: { fontSize: 16, color: '#4B5563', marginBottom: 4 },
  feeAmountModal: { fontSize: 32, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  feeDueModal: { fontSize: 14, color: '#EF4444', fontWeight: '500' },

  methodLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
  methodCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, marginBottom: 10, backgroundColor: '#FFF' },
  methodActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  methodIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  methodTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  methodSub: { fontSize: 12, color: '#6B7280' },

  payNowBtn: { backgroundColor: '#2563EB', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  payNowText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },

  // Processing
  processingContainer: { alignItems: 'center', paddingVertical: 40 },
  processingText: { marginTop: 16, fontSize: 18, fontWeight: 'bold', color: '#111827' },
  processingSub: { marginTop: 8, color: '#6B7280' },

  // Success
  successContainer: { alignItems: 'center' },
  successIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  successSub: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
  
  receiptBox: { width: '100%', backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12, marginBottom: 24, borderWidth: 1, borderColor: '#E5E7EB' },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  receiptLabel: { color: '#6B7280' },
  receiptValue: { fontWeight: 'bold', color: '#111827' },

  doneBtn: { backgroundColor: '#10B981', paddingVertical: 14, width: '100%', borderRadius: 12, alignItems: 'center' },
  doneText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
});