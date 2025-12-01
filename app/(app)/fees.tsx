import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from 'react-native';
// --- PRINTING IMPORTS ---
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

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

  // --- PRINTING STATE ---
  const [isPrinting, setIsPrinting] = useState(false);

  const fetchData = async () => {
    if (!user?.username) return;
    try {
      setLoading(true);
      const data = await getStudentFeeDetails(user.username);
      
      // 🔥 FIX 1: Sort Pending Dues (Recent Due Date First)
      if (data && data.allFees) {
          data.allFees.sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
      }

      // 🔥 FIX 2: Sort Payment History (Recent Payment Date & Time First)
      if (data && data.paymentHistory) {
          data.paymentHistory.sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());
      }

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

  // --- DOWNLOAD RECEIPT HANDLER ---
  const handleDownloadReceipt = async (item: PaymentHistoryItem) => {
    setIsPrinting(true);
    try {
      const htmlContent = `
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Receipt - ${item.paymentId}</title>
            <style>
              @page { size: A4; margin: 0; }
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; background-color: #fff; }
              .receipt-box { border: 2px solid #2563EB; padding: 30px; max-width: 800px; margin: 0 auto; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px; margin-bottom: 20px; }
              .logo-section { display: flex; align-items: center; gap: 15px; }
              .logo { width: 70px; height: 70px; object-fit: contain; }
              .school-name { font-size: 24px; font-weight: 800; color: #2563EB; margin: 0; text-transform: uppercase; }
              .receipt-title { text-align: center; margin-bottom: 30px; }
              .receipt-badge { background-color: #2563EB; color: white; padding: 8px 20px; font-weight: bold; border-radius: 20px; text-transform: uppercase; }
              .info-grid { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .info-column { width: 48%; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; border-bottom: 1px dashed #eee; padding-bottom: 4px; }
              .info-label { font-weight: 600; color: #555; font-size: 14px; }
              .info-val { font-weight: bold; color: #000; font-size: 14px; }
              .amount-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              .amount-table th { background-color: #f3f4f6; color: #374151; padding: 12px; text-align: left; border: 1px solid #e5e7eb; }
              .amount-table td { padding: 12px; border: 1px solid #e5e7eb; }
              .total-row td { font-weight: bold; color: #1e40af; font-size: 16px; background-color: #eff6ff; }
              .footer { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; color: #9ca3af; }
              .signature { text-align: center; width: 150px; border-top: 1px solid #333; padding-top: 5px; }
            </style>
          </head>
          <body>
            <div class="receipt-box">
              <div class="header">
                <div class="logo-section">
                  <img src="https://www.anasolconsultancyservices.com/assets/Logo1-BPHJw_VO.png" class="logo" alt="Logo" />
                  <div>
                    <h1 class="school-name">ANASOL TECHNO SCHOOL</h1>
                    <p style="font-size: 12px; color: #666; margin: 4px 0 0;">Excellence in Education</p>
                  </div>
                </div>
                <div style="text-align: right; font-size: 12px; color: #666;">
                  <p>Hyderabad, Telangana</p>
                  <p>Ph: +91 98765 43210</p>
                </div>
              </div>

              <div class="receipt-title"><span class="receipt-badge">Payment Receipt</span></div>

              <div class="info-grid">
                <div class="info-column">
                  <div class="info-row"><span class="info-label">Receipt No:</span> <span class="info-val">#${item.paymentId.substring(0,8).toUpperCase()}</span></div>
                  <div class="info-row"><span class="info-label">Transaction ID:</span> <span class="info-val">${item.transactionRef}</span></div>
                  <div class="info-row"><span class="info-label">Date:</span> <span class="info-val">${new Date(item.paymentDate).toLocaleDateString()}</span></div>
                  <div class="info-row"><span class="info-label">Mode:</span> <span class="info-val">${item.method}</span></div>
                </div>
                <div class="info-column">
                  <div class="info-row"><span class="info-label">Student ID:</span> <span class="info-val">${user?.username}</span></div>
                  <div class="info-row"><span class="info-label">Session:</span> <span class="info-val">2025-2026</span></div>
                  <div class="info-row"><span class="info-label">Status:</span> <span style="color: #10B981; font-weight: bold;">PAID</span></div>
                </div>
              </div>

              <table class="amount-table">
                <thead><tr><th>Description</th><th style="text-align: right;">Amount (INR)</th></tr></thead>
                <tbody>
                  <tr><td>School Fee Payment</td><td style="text-align: right;">₹ ${item.amount.toLocaleString()}.00</td></tr>
                  <tr class="total-row"><td>TOTAL RECEIVED</td><td style="text-align: right;">₹ ${item.amount.toLocaleString()}.00</td></tr>
                </tbody>
              </table>

              <div class="footer">
                <div><p>Generated on: ${new Date().toLocaleString()}</p><p>Computer generated receipt.</p></div>
                <div class="signature">Authorized Signatory</div>
              </div>
            </div>
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
          const iframe = document.createElement('iframe');
          iframe.style.position = 'fixed';
          iframe.style.width = '0px';
          iframe.style.height = '0px';
          iframe.style.border = 'none';
          document.body.appendChild(iframe);
          const doc = iframe.contentWindow?.document;
          if (doc) {
              doc.open(); doc.write(htmlContent); doc.close();
              setTimeout(() => {
                  iframe.contentWindow?.focus();
                  iframe.contentWindow?.print();
                  setTimeout(() => { if (document.body.contains(iframe)) document.body.removeChild(iframe); }, 1000);
              }, 500);
          }
      } else {
          const { uri } = await Print.printToFileAsync({ html: htmlContent });
          await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      }
    } catch(e) {
        Alert.alert("Error", "Failed to print");
    } finally {
        setIsPrinting(false);
    }
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

      setTimeout(async () => {
          try {
              await studentApi.post('/fee/student/pay', {
                  feeId: selectedFee.feeId,
                  amount: selectedFee.amount,
                  method: selectedMethod === 'ONLINE' ? 'UPI' : 'CASH'
              });
              
              setPaymentStep('SUCCESS');
              fetchData();
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
      
      {/* Print Button */}
      <TouchableOpacity 
        style={styles.printButton} 
        onPress={() => handleDownloadReceipt(item)}
      >
         <Ionicons name="print-outline" size={16} color="#2563EB" />
         <Text style={styles.printButtonText}>Download Receipt</Text>
      </TouchableOpacity>
    </View>
  );

  // --- RENDER MODAL ---
  const renderPaymentModal = () => (
      <Modal visible={payModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, isWeb && {width: 450}]}>
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

                  {paymentStep === 'PROCESSING' && (
                      <View style={styles.processingContainer}>
                          <ActivityIndicator size="large" color="#2563EB" />
                          <Text style={styles.processingText}>Processing Payment...</Text>
                          <Text style={styles.processingSub}>Please do not close the app</Text>
                      </View>
                  )}

                  {paymentStep === 'SUCCESS' && (
                      <View style={styles.successContainer}>
                          <View style={styles.successIconCircle}>
                              <Ionicons name="checkmark" size={40} color="#FFF" />
                          </View>
                          <Text style={styles.successTitle}>Payment Successful!</Text>
                          <Text style={styles.successSub}>Your transaction has been completed.</Text>
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

      {activeTab === 'DUES' ? (
        <View>
          {(feeData?.allFees && feeData.allFees.length > 0) ? (
            feeData.allFees
                .filter(item => item.status !== 'PAID')
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

      {renderPaymentModal()}

      {isPrinting && (
        <View style={styles.printingOverlay}>
            <View style={styles.printingBox}>
                <ActivityIndicator size="large" color="#F97316" />
                <Text style={styles.printingText}>Generating Receipt...</Text>
            </View>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F3F4F6' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 20 },

  summaryContainer: { flexDirection: 'column', gap: 12, marginBottom: 24 },
  summaryWeb: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  iconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  summaryLabel: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: 'bold' },

  tabContainer: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 12, padding: 4, marginBottom: 20 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: {width:0, height:1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#F97316' },

  cardContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  feeTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  feeDate: { fontSize: 13, color: '#6B7280', marginBottom: 4 },
  receiptText: { fontSize: 12, color: '#9CA3AF' },

  amountContainer: { alignItems: 'flex-end' },
  amountText: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
  
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

  payButton: { backgroundColor: '#F97316', borderRadius: 8, paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  payButtonText: { color: '#FFFFFF', fontWeight: 'bold', marginRight: 8 },

  printButton: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6', justifyContent: 'flex-end' },
  printButtonText: { color: '#2563EB', fontWeight: '600', fontSize: 13, marginLeft: 6 },

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

  printingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  printingBox: { backgroundColor: 'white', padding: 20, borderRadius: 12, alignItems: 'center', elevation: 5 },
  printingText: { marginTop: 10, fontWeight: 'bold', color: '#374151' },
});