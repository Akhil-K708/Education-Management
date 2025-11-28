import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    useWindowDimensions,
    View,
} from 'react-native';
import { authApi } from '../../api/axiosInstance'; // 🔥 Imported Auth API
import { getStudentProfile } from '../../api/studentService';
import { adminMenu, studentMenu, teacherMenu } from '../../constants/menu';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import NotificationList from '../notifications/NotificationList';

const API_BASE_URL = 'http://192.168.0.113:8080';

const getFullImageUrl = (url: string | undefined | null) => {
  if (!url) return null;
  if (url.startsWith('http') || url.startsWith('https')) return url;
  const cleanPath = url.startsWith('/') ? url.substring(1) : url;
  return `${API_BASE_URL}/${cleanPath}`;
};

interface NavbarProps {
  onMenuPress: () => void;
}

export const Navbar = ({ onMenuPress }: NavbarProps) => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  
  // 🔥 FIX: Defined isWeb to resolve the crash
  const isMobile = width < 768;
  const isWeb = width >= 768;

  const { state } = useAuth();
  const user = state.user;
  
  const { unreadCount } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Profile & Search States
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- CHANGE PASSWORD STATE ---
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passForm, setPassForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [isChangingPass, setIsChangingPass] = useState(false);

  // Fetch Student Profile Image
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.role === 'STUDENT' && user.username) {
        try {
          const data = await getStudentProfile(user.username);
          setProfileImg(getFullImageUrl(data.profileImageUrl));
        } catch (e) {
          console.log("Failed to load navbar profile image");
        }
      }
    };
    loadProfile();
  }, [user]);

  // --- SEARCH LOGIC ---
  const handleSearchSubmit = () => {
    const query = searchQuery.trim().toLowerCase();
    
    if (!query) return;

    //  Determine which menu to search based on Role
    let accessibleMenu: any[] = [];
    if (user?.role === 'ADMIN') {
        accessibleMenu = adminMenu;
    } else if (user?.role === 'TEACHER') {
        accessibleMenu = teacherMenu;
    } else if (user?.role === 'STUDENT') {
        accessibleMenu = studentMenu;
    }

    const match = accessibleMenu.find(item => 
        item.label.toLowerCase().includes(query)
    );

    if (match) {
        // Navigate to the matched path
        router.push(match.path as any);
    } 
    // Fallback for common aliases if exact menu label isn't typed
    else {
        // Common aliases mapping
        if (query.includes('home') || query.includes('dash')) {
            router.push('/(app)');
        } else if (query.includes('work') || query.includes('homework')) {
            router.push('/(app)/assignments');
        } else if (query.includes('bus') || query.includes('driver')) {
            router.push('/(app)/transport');
        } else if (query.includes('mark') || query.includes('score')) {
            router.push('/(app)/results');
        } else if (query.includes('fee') || query.includes('payment')) {
            const hasFeeAccess = accessibleMenu.some(m => m.path.includes('fee') || m.path.includes('account'));
            if (hasFeeAccess) {
                if (user?.role === 'ADMIN') router.push('/(app)/account');
                else router.push('/(app)/fees');
            } else {
                Alert.alert("Search", `No module found for: "${searchQuery}"`);
            }
        } else {
            Alert.alert("Search", `No module found for: "${searchQuery}"`);
        }
    }
    
    setSearchQuery('');
  };

  // --- PASSWORD LOGIC ---
  const handleChangePasswordClick = () => {
    setShowProfileModal(false); // Close profile dropdown
    setPassForm({ oldPassword: '', newPassword: '', confirmPassword: '' }); // Reset form
    setShowPasswordModal(true); // Open Password Modal
  };

  const handleSubmitPassword = async () => {
      const { oldPassword, newPassword, confirmPassword } = passForm;

      if (!oldPassword || !newPassword || !confirmPassword) {
          Alert.alert("Error", "Please fill all fields");
          return;
      }
      if (newPassword !== confirmPassword) {
          Alert.alert("Error", "New password and confirm password do not match");
          return;
      }

      setIsChangingPass(true);
      try {
          // Backend API call
          await authApi.post('/change-password', {
              oldPassword,
              newPassword,
              confirmNewPassword: confirmPassword
          });

          Alert.alert("Success", "Password updated successfully!");
          setShowPasswordModal(false);
      } catch (e: any) {
          const msg = e.response?.data || "Failed to update password. Check old password.";
          Alert.alert("Error", typeof msg === 'string' ? msg : "Update failed");
      } finally {
          setIsChangingPass(false);
      }
  };

  return (
    <View style={[styles.navbar, isMobile && styles.navbarMobile]}>
      
      {/* --- LEFT SECTION: Logo & Menu --- */}
      <View style={styles.left}>
        <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="#1F2937" />
        </TouchableOpacity>

        {/* School Logo & Name */}
        <View style={styles.brandContainer}>
            <Image 
                source={{ uri: 'https://www.anasolconsultancyservices.com/assets/Logo1-BPHJw_VO.png' }} 
                style={styles.schoolLogo}
                resizeMode="contain"
            />
            <Text style={styles.logoText} numberOfLines={1} ellipsizeMode="tail">
                ANASOL TECHNO SCHOOL
            </Text>
        </View>

        {/* User Info (Web Only) */}
        {!isMobile && user && (
          <View style={styles.userInfo}>
            <Text style={styles.usernameText} numberOfLines={1}>
              {user.username}
            </Text>
            <Text style={styles.roleText} numberOfLines={1}>
              {user.role}
            </Text>
          </View>
        )}
      </View>

      {/* --- CENTER SECTION (Search - Web Only) --- */}
      {!isMobile && (
        <View style={styles.center}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#6B7280"
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search modules (e.g. Accounts, Exams)..."
            style={styles.searchBar}
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
          />
        </View>
      )}

      {/* --- RIGHT SECTION: Notify & Profile --- */}
      <View style={styles.right}>
        {/* Notification Bell */}
        <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => setShowNotifications(true)}
        >
          <Ionicons name="notifications-outline" size={24} color="#374151" />
          {unreadCount > 0 && (
              <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
              </View>
          )}
        </TouchableOpacity>

        {/* Profile Avatar */}
        <TouchableOpacity style={styles.profileButton} onPress={() => setShowProfileModal(true)}>
          {user?.role === 'STUDENT' && profileImg ? (
             <Image source={{ uri: profileImg }} style={styles.profileImage} />
          ) : (
             <View style={styles.profilePicPlaceholder}>
                <Ionicons name="person" size={18} color="#FFFFFF" />
             </View>
          )}
        </TouchableOpacity>
      </View>

      {/* --- NOTIFICATIONS MODAL --- */}
      <Modal 
        visible={showNotifications} 
        transparent={true} 
        animationType="fade" 
        onRequestClose={() => setShowNotifications(false)}
      >
         <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setShowNotifications(false)}
         >
             <TouchableWithoutFeedback>
                 <View style={[
                     styles.notificationDropdown, 
                     isMobile ? styles.dropdownMobile : styles.dropdownWeb
                 ]}>
                     <View style={{flex: 1}}>
                        <NotificationList onClose={() => setShowNotifications(false)} />
                     </View>
                 </View>
             </TouchableWithoutFeedback>
         </TouchableOpacity>
      </Modal>

      {/* --- PROFILE DETAILS MODAL (DROPDOWN STYLE) --- */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <TouchableOpacity 
            style={styles.profileOverlay} 
            activeOpacity={1} 
            onPress={() => setShowProfileModal(false)}
        >
            <TouchableWithoutFeedback>
                <View style={styles.profileDropdown}>
                    
                    {/* Header with Close */}
                    <View style={styles.profileDropdownHeader}>
                        <Text style={styles.profileModalTitle}>Profile</Text>
                        <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                            <Ionicons name="close" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    </View>
                    
                    {/* User Info */}
                    <View style={styles.profileInfoContainer}>
                        <View style={styles.profileAvatarLarge}>
                             {user?.role === 'STUDENT' && profileImg ? (
                                <Image source={{ uri: profileImg }} style={styles.profileImageLarge} />
                             ) : (
                                <Ionicons name="person" size={32} color="#FFF" />
                             )}
                        </View>
                        <View style={{marginLeft: 12, flex: 1}}>
                            <Text style={styles.modalUsername} numberOfLines={1}>{user?.username || 'Guest'}</Text>
                            <View style={styles.roleBadge}>
                                <Text style={styles.roleBadgeText}>{user?.role || 'USER'}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.divider} />

                    {/* Options */}
                    <TouchableOpacity style={styles.menuOption} onPress={handleChangePasswordClick}>
                        <View style={[styles.menuIconBox, {backgroundColor: '#EFF6FF'}]}>
                            <Ionicons name="key-outline" size={18} color="#2563EB" />
                        </View>
                        <Text style={styles.menuOptionText}>Change Password</Text>
                        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                    </TouchableOpacity>

                </View>
            </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      {/* --- CHANGE PASSWORD MODAL (New) --- */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
          <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, isWeb && {maxWidth: 400}]}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Change Password</Text>
                      <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                          <Ionicons name="close" size={24} color="#374151" />
                      </TouchableOpacity>
                  </View>

                  <View style={styles.inputGroup}>
                      <Text style={styles.label}>Old Password</Text>
                      <TextInput 
                          style={styles.input} 
                          secureTextEntry 
                          placeholder="Enter old password"
                          value={passForm.oldPassword}
                          onChangeText={(t) => setPassForm({...passForm, oldPassword: t})}
                      />
                  </View>

                  <View style={styles.inputGroup}>
                      <Text style={styles.label}>New Password</Text>
                      <TextInput 
                          style={styles.input} 
                          secureTextEntry 
                          placeholder="Enter new password"
                          value={passForm.newPassword}
                          onChangeText={(t) => setPassForm({...passForm, newPassword: t})}
                      />
                  </View>

                  <View style={styles.inputGroup}>
                      <Text style={styles.label}>Confirm New Password</Text>
                      <TextInput 
                          style={styles.input} 
                          secureTextEntry 
                          placeholder="Confirm new password"
                          value={passForm.confirmPassword}
                          onChangeText={(t) => setPassForm({...passForm, confirmPassword: t})}
                      />
                  </View>

                  <View style={styles.modalActions}>
                      <TouchableOpacity 
                          style={styles.cancelBtn} 
                          onPress={() => setShowPasswordModal(false)}
                      >
                          <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                          style={styles.saveBtn} 
                          onPress={handleSubmitPassword}
                          disabled={isChangingPass}
                      >
                          {isChangingPass ? (
                              <ActivityIndicator color="#FFF" size="small" />
                          ) : (
                              <Text style={styles.saveText}>Update Password</Text>
                          )}
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, 
    borderBottomColor: '#E5E7EB', 
    zIndex: 20,
  },
  
  navbarMobile: {
    paddingTop: 12, 
    paddingBottom: 12,
    elevation: 0, 
    borderBottomWidth: 0, 
    backgroundColor: 'transparent' 
  },
  
  left: { 
      flex: 2,
      flexDirection: 'row', 
      alignItems: 'center',
      minWidth: 0 
  },
  
  menuButton: { marginRight: 12 },
  
  brandContainer: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 8,
      flexShrink: 1 
  },
  
  schoolLogo: {
      width: 32, 
      height: 32, 
      borderRadius: 6 
  },

  logoText: { 
      fontSize: 18, 
      fontWeight: '800', 
      color: '#111827', 
      letterSpacing: -0.5,
      flexShrink: 1
  },
  
  userInfo: { 
      marginLeft: 16,
      paddingLeft: 16, 
      borderLeftWidth: 1, 
      borderLeftColor: '#E5E7EB', 
      justifyContent: 'center',
      minWidth: 100 
  },
  usernameText: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  roleText: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginTop: 2 },
  
  center: {
    flex: 2, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F9FAFB',
    borderRadius: 8, 
    paddingHorizontal: 12, 
    marginHorizontal: 16, 
    borderWidth: 1, 
    borderColor: '#E5E7EB'
  },
  searchIcon: { marginRight: 8 },
  searchBar: {
    flex: 1, height: 42, fontSize: 15, color: '#111827',
    ...Platform.select({ web: { outlineStyle: 'none', borderWidth: 0 } as any }),
  },
  
  right: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  
  iconButton: { padding: 8, position: 'relative', marginRight: 8 },
  
  profileButton: { marginLeft: 4, padding: 2, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20 },
  profilePicPlaceholder: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#9CA3AF', justifyContent: 'center', alignItems: 'center' },
  profileImage: { width: 34, height: 34, borderRadius: 17 },

  badge: {
      position: 'absolute', top: 4, right: 4, backgroundColor: '#EF4444',
      borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center',
      borderWidth: 1.5, borderColor: '#FFF'
  },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: 'bold', paddingHorizontal: 2 },

  // --- MODAL STYLES ---
  modalOverlay: { 
      flex: 1, 
      backgroundColor: 'rgba(0,0,0,0.4)', 
      justifyContent: 'center',
      alignItems: 'center', 
      padding: 20
  },
  
  profileOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.1)', 
  },

  notificationDropdown: {
      backgroundColor: '#FFF',
      borderRadius: 12, 
      elevation: 10, 
      shadowColor: '#000', 
      shadowOpacity: 0.2, 
      shadowRadius: 10,
      overflow: 'hidden',
      zIndex: 1000,
  },
  dropdownWeb: { 
      position: 'absolute', top: 60, right: 20, width: 380, maxHeight: 500,
  },
  dropdownMobile: { 
      marginTop: 60, width: '92%', height: 400, maxHeight: '70%', 
  },

  profileDropdown: {
      position: 'absolute',
      top: 60, 
      right: 16, 
      width: 260, 
      backgroundColor: '#FFF', 
      borderRadius: 12, 
      padding: 16, 
      elevation: 5,
      shadowColor: '#000', shadowOffset: {width:0, height:4}, shadowOpacity: 0.15, shadowRadius: 12,
      borderWidth: 1, borderColor: '#F3F4F6'
  },
  profileDropdownHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  profileModalTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  
  profileInfoContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  profileAvatarLarge: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#D1D5DB', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  profileImageLarge: { width: '100%', height: '100%' },
  modalUsername: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  
  roleBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, alignSelf: 'flex-start' },
  roleBadgeText: { fontSize: 10, fontWeight: '700', color: '#2563EB', letterSpacing: 0.5 },

  divider: { height: 1, backgroundColor: '#E5E7EB', marginBottom: 12 },

  menuOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  menuIconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuOptionText: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500' },

  // --- PASSWORD MODAL ---
  modalContent: { backgroundColor: '#FFF', borderRadius: 16, padding: 24, width: '100%', maxWidth: 350 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, backgroundColor: '#F9FAFB' },
  
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, gap: 12 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  cancelText: { color: '#6B7280', fontWeight: '600' },
  saveBtn: { backgroundColor: '#2563EB', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, alignItems: 'center' },
  saveText: { color: '#FFF', fontWeight: 'bold' },

});