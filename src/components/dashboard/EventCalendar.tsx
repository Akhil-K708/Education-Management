import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    Platform, // Added Platform
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { createSchoolFeedPost, deleteSchoolFeedPost, getSchoolFeed, updateSchoolFeedPost } from '../../api/dashboardApi';
import { getAllNotices } from '../../api/noticeApi';
import { useAuth } from '../../context/AuthContext';
import { SchoolFeedItem } from '../../types/dashboard';

export const EventCalendar = () => {
  const { state } = useAuth();
  const user = state.user;
  const { width } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState<'Calendar' | 'Buzz'>('Buzz');
  
  const [markedDates, setMarkedDates] = useState<any>({});
  const [selectedDateInfo, setSelectedDateInfo] = useState<{date: string, title: string, type: string} | null>(null);
  const [feedItems, setFeedItems] = useState<SchoolFeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Post Modal States
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [postTitle, setPostTitle] = useState('');
  const [postDesc, setPostDesc] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load Notices for Calendar
      const notices = await getAllNotices();
      const marks: any = {};
      notices.forEach(n => {
         let bgColor = '#3B82F6'; // Blue
         let typeLabel = 'Notice';
         
         const type = n.noticeType ? n.noticeType.toUpperCase() : 'GENERAL';
         if (type === 'HOLIDAY') { bgColor = '#8B5CF6'; typeLabel = 'Holiday'; }
         else if (type === 'EVENT') { bgColor = '#F59E0B'; typeLabel = 'Event'; }

         marks[n.noticeDate] = { 
             customStyles: {
                 container: { backgroundColor: bgColor, borderRadius: 20, elevation: 2 },
                 text: { color: 'white', fontWeight: 'bold' }
             },
             customTitle: n.noticeName,
             customType: typeLabel
         };
      });
      setMarkedDates(marks);

      // 2. Load Feed
      const feed = await getSchoolFeed();
      setFeedItems(feed);

    } catch (e) {
      console.error("Failed to load data", e);
    } finally {
      setLoading(false);
    }
  };

  const onDayPress = (day: any) => {
      const data = markedDates[day.dateString];
      if (data) {
          setSelectedDateInfo({ date: day.dateString, title: data.customTitle, type: data.customType });
      } else {
          setSelectedDateInfo({ date: day.dateString, title: 'No events scheduled', type: 'Normal Day' });
      }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    if (!result.canceled) setSelectedImage(result.assets[0].uri);
  };

  // --- ACTIONS: SUBMIT, DELETE, EDIT ---

  const handlePostSubmit = async () => {
      if (!postTitle) { Alert.alert("Error", "Heading is required"); return; }
      
      setIsPosting(true);
      try {
          const postData = {
              title: postTitle,
              description: postDesc,
              type: 'EVENT', // Default type
              postDate: new Date().toISOString().split('T')[0],
              postedBy: user?.username || 'ADMIN'
          };

          if (isEditMode && editingId) {
             await updateSchoolFeedPost(editingId, postData, selectedImage || undefined);
             Alert.alert("Success", "Post Updated!");
          } else {
             await createSchoolFeedPost(postData, selectedImage || undefined);
             Alert.alert("Success", "Posted Successfully!");
          }
          
          setPostModalVisible(false);
          resetForm();
          loadData();
      } catch(e: any) {
          Alert.alert("Error", "Failed to post. " + e.message);
      } finally {
          setIsPosting(false);
      }
  };

  // 🔥 FIX: Handle Delete on Web & Mobile
  const handleDelete = (id: string) => {
      if (Platform.OS === 'web') {
          // Web uses standard confirm dialog
          if (confirm("Are you sure you want to delete this post?")) {
              processDelete(id);
          }
      } else {
          // Mobile uses Native Alert
          Alert.alert("Confirm Delete", "Are you sure?", [
              { text: "Cancel" },
              { text: "Delete", style: 'destructive', onPress: () => processDelete(id) }
          ]);
      }
  };

  const processDelete = async (id: string) => {
      try {
          await deleteSchoolFeedPost(id);
          loadData(); // Refresh list
      } catch(e) { 
          Alert.alert("Error", "Failed to delete"); 
      }
  };

  const openEditModal = (item: SchoolFeedItem) => {
      setIsEditMode(true);
      setEditingId(item.id);
      setPostTitle(item.title);
      setPostDesc(item.description || '');
      setSelectedImage(item.imageUrl || null);
      setPostModalVisible(true);
  };

  const resetForm = () => {
      setPostTitle(''); setPostDesc(''); setSelectedImage(null);
      setIsEditMode(false); setEditingId(null);
  };

  const renderFeedItem = ({ item }: { item: SchoolFeedItem }) => (
    <View style={styles.feedCard}>
        <View style={styles.feedHeader}>
            <View style={{flexDirection:'row', alignItems:'center'}}>
                <View style={styles.avatar}><Ionicons name="school" size={14} color="#FFF"/></View>
                <View>
                    <Text style={styles.feedAuthor}>Latest Update</Text>
                    <Text style={styles.feedDate}>{item.postDate}</Text>
                </View>
            </View>
            
            {/* Admin Actions */}
            {user?.role === 'ADMIN' && (
                <View style={{flexDirection:'row', gap: 12}}>
                    <TouchableOpacity onPress={() => openEditModal(item)}>
                        <Ionicons name="create-outline" size={18} color="#2563EB"/>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444"/>
                    </TouchableOpacity>
                </View>
            )}
        </View>
        
        {item.imageUrl && (
            // FIX: Changed resizeMode to 'contain' to show full image
            <Image 
                source={{ uri: item.imageUrl }} 
                style={styles.feedImage} 
                resizeMode="contain" 
            />
        )}
        
        <View style={styles.feedContent}>
            <Text style={styles.feedTitle}>{item.title}</Text>
            {item.description && <Text style={styles.feedDesc}>{item.description}</Text>}
        </View>
    </View>
  );

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
         <Text style={styles.title}>Campus Buzz</Text>
         
         {/* Admin Add Button */}
         {user?.role === 'ADMIN' && activeTab === 'Buzz' && (
             <TouchableOpacity style={styles.addBtn} onPress={() => {resetForm(); setPostModalVisible(true);}}>
                 <Ionicons name="add" size={20} color="#FFF" />
             </TouchableOpacity>
         )}

         <View style={styles.miniTabs}>
            <TouchableOpacity style={[styles.miniTab, activeTab==='Buzz' && styles.miniTabActive]} onPress={() => setActiveTab('Buzz')}>
               <Ionicons name="newspaper" size={16} color={activeTab==='Buzz' ? '#2563EB' : '#6B7280'} />
               <Text style={[styles.tabText, activeTab==='Buzz' && styles.tabTextActive]}>Highlights</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.miniTab, activeTab==='Calendar' && styles.miniTabActive]} onPress={() => setActiveTab('Calendar')}>
               <Ionicons name="calendar" size={16} color={activeTab==='Calendar' ? '#2563EB' : '#6B7280'} />
               <Text style={[styles.tabText, activeTab==='Calendar' && styles.tabTextActive]}>Events</Text>
            </TouchableOpacity>
         </View>
      </View>

      {activeTab === 'Calendar' ? (
        <View>
            <Calendar
                onDayPress={onDayPress}
                markingType={'custom'}
                markedDates={markedDates}
                theme={{
                    backgroundColor: '#ffffff',
                    calendarBackground: '#ffffff',
                    textSectionTitleColor: '#9CA3AF',
                    selectedDayBackgroundColor: '#2563EB',
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: '#F97316',
                    dayTextColor: '#1F2937',
                    textDisabledColor: '#E5E7EB',
                    arrowColor: '#1F2937',
                    monthTextColor: '#111827',
                    textDayFontWeight: '600',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: '600',
                    textDayFontSize: 14,
                }}
                style={styles.calendar}
            />
            
            {selectedDateInfo && (
                <View style={[styles.infoBox, 
                    selectedDateInfo.type === 'Holiday' ? {borderLeftColor: '#8B5CF6', backgroundColor: '#F5F3FF'} : 
                    selectedDateInfo.type === 'Event' ? {borderLeftColor: '#F59E0B', backgroundColor: '#FFF7ED'} :
                    {borderLeftColor: '#E5E7EB', backgroundColor: '#F9FAFB'}
                ]}>
                    <Text style={styles.infoDate}>{selectedDateInfo.date}</Text>
                    <View>
                        <Text style={styles.infoTitle}>{selectedDateInfo.title}</Text>
                        <Text style={styles.infoType}>{selectedDateInfo.type}</Text>
                    </View>
                </View>
            )}
            
            <View style={styles.legendRow}>
                <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#8B5CF6'}]}/><Text style={styles.legendText}>Holiday</Text></View>
                <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#F59E0B'}]}/><Text style={styles.legendText}>Event</Text></View>
                <View style={styles.legendItem}><View style={[styles.dot, {backgroundColor: '#3B82F6'}]}/><Text style={styles.legendText}>Notice</Text></View>
            </View>
        </View>
      ) : (
        <View style={styles.feedContainer}>
           {loading ? <ActivityIndicator color="#2563EB"/> : (
               <FlatList
                  data={feedItems}
                  keyExtractor={(item) => item.id}
                  renderItem={renderFeedItem}
                  contentContainerStyle={{ paddingBottom: 10 }}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="newspaper-outline" size={48} color="#E5E7EB" />
                        <Text style={styles.emptyText}>No highlights yet.</Text>
                    </View>
                  }
               />
           )}
        </View>
      )}

      {/* POST MODAL */}
      <Modal visible={postModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>{isEditMode ? "Edit Post" : "Create New Post"}</Text>
                  
                  <TextInput style={styles.input} placeholder="Heading / Title" value={postTitle} onChangeText={setPostTitle} />
                  <TextInput style={[styles.input, {height: 80}]} placeholder="Description (Optional)" multiline value={postDesc} onChangeText={setPostDesc} />
                  
                  {/* Image Upload */}
                  <View style={styles.imageUploadBox}>
                      {selectedImage ? (
                          // FIX: Changed resizeMode to 'contain' for preview as well
                          <Image 
                            source={{ uri: selectedImage }} 
                            style={styles.previewImage} 
                            resizeMode="contain"
                          />
                      ) : (
                          <TouchableOpacity style={styles.uploadBtn} onPress={pickImage}>
                              <Ionicons name="camera" size={24} color="#6B7280" />
                              <Text style={styles.uploadText}>Upload Image (Optional)</Text>
                          </TouchableOpacity>
                      )}
                      {selectedImage && (
                          <TouchableOpacity style={styles.removeImgBtn} onPress={() => setSelectedImage(null)}>
                              <Ionicons name="trash" size={18} color="#FFF" />
                          </TouchableOpacity>
                      )}
                  </View>

                  <View style={styles.modalActions}>
                      <TouchableOpacity onPress={()=>setPostModalVisible(false)} style={styles.cancelBtn}>
                          <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handlePostSubmit} style={styles.submitBtn}>
                          {isPosting ? <ActivityIndicator color="#FFF"/> : <Text style={styles.submitText}>{isEditMode ? "Update" : "Post"}</Text>}
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 3, minHeight: 420 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  addBtn: { backgroundColor: '#F97316', borderRadius: 8, padding: 6, marginRight: 10 },
  miniTabs: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 3 },
  miniTab: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, flexDirection: 'row', alignItems: 'center' },
  miniTabActive: { backgroundColor: '#FFF', elevation: 1 },
  tabText: { fontSize: 12, marginLeft: 4, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#2563EB' },
  calendar: { borderRadius: 8 },
  
  infoBox: { marginTop: 12, padding: 12, borderRadius: 8, borderLeftWidth: 4, flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoDate: { fontWeight: 'bold', fontSize: 14, color: '#374151' },
  infoTitle: { fontWeight: 'bold', fontSize: 15, color: '#111827' },
  infoType: { fontSize: 12, color: '#6B7280', textTransform: 'uppercase' },
  
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 6 },
  legendText: { fontSize: 12, color: '#4B5563' },
  
  feedContainer: { flex: 1, minHeight: 300, marginTop: 10 },
  feedCard: { backgroundColor: '#FFF', borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, backgroundColor: '#F9FAFB' },
  avatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  feedAuthor: { fontSize: 12, fontWeight: 'bold', color: '#374151' },
  feedDate: { fontSize: 10, color: '#9CA3AF' },
  
  // FIX: Added backgroundColor to fill empty space when using resizeMode='contain'
  feedImage: { width: '100%', height: 220, backgroundColor: '#F9FAFB' },
  
  feedContent: { padding: 12 },
  feedTitle: { fontSize: 15, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  feedDesc: { fontSize: 13, color: '#4B5563', lineHeight: 20 },
  emptyText: { marginTop: 10, color: '#9CA3AF', fontStyle: 'italic' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },

  // 🔥 FIX: MODAL STYLES FOR WEB (Fixed Position & Centered)
  modalOverlay: { 
      flex: 1, 
      backgroundColor: 'rgba(0,0,0,0.5)', 
      justifyContent: 'center', 
      alignItems: 'center', 
      padding: 20,
      // Web specific fixed positioning to cover the whole screen properly
      ...Platform.select({
          web: {
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
              height: '100vh', // Force full height
              width: '100vw'   // Force full width
          } as any
      })
  },
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, marginBottom: 12, backgroundColor: '#F9FAFB' },
  
  imageUploadBox: { height: 150, borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'dashed', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 16, backgroundColor: '#F3F4F6', position: 'relative' },
  uploadBtn: { alignItems: 'center' },
  uploadText: { color: '#6B7280', marginTop: 4, fontSize: 12 },
  
  // FIX: Added background color for preview
  previewImage: { width: '100%', height: '100%', borderRadius: 12, backgroundColor: '#F3F4F6' },
  
  removeImgBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 12 },
  
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 10 },
  cancelBtn: { padding: 10 },
  cancelText: { color: '#6B7280', fontWeight: 'bold' },
  submitBtn: { backgroundColor: '#F97316', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  submitText: { color: '#FFF', fontWeight: 'bold' }
});