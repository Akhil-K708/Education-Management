import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
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
import { getStudentProfile } from '../../api/studentService';
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
  const isMobile = width < 768;
  const { state } = useAuth();
  const user = state.user;
  
  const { unreadCount } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Profile & Search States
  const [profileImg, setProfileImg] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // --- SEARCH LOGIC (Updated) ---
  const handleSearchSubmit = () => {
    const query = searchQuery.trim().toLowerCase();
    
    if (!query) return;

    // 1. Assignments
    if (query.includes('assignment') || query.includes('homework') || query.includes('work')) {
        router.push('/(app)/assignments');
    } 
    // 2. Teachers
    else if (query.includes('teacher')) {
        if (user?.role === 'ADMIN') {
            router.push('/(app)/teachers'); // Admin sees list
        } else if (user?.role === 'TEACHER') {
            router.push('/(app)/profile'); // Teacher sees own profile
        } else {
            Alert.alert("Access Denied", "Teacher directory is restricted for students.");
        }
    } 
    // 3. Admin Dashboard
    else if (query.includes('admin') || query.includes('dashboard')) {
        if (user?.role === 'ADMIN') {
            router.push('/(app)'); 
        } else {
            Alert.alert("Restricted", "Admin access only.");
        }
    }
    // 4. Students
    else if (query.includes('student')) {
        if (user?.role === 'ADMIN') {
            router.push('/(app)/students');
        } else {
            router.push('/(app)/profile'); // Go to My Profile
        }
    }
    // 5. Exams
    else if (query.includes('exam') || query.includes('result')) {
        if (query.includes('result')) router.push('/(app)/results');
        else router.push('/(app)/examschedule');
    }
    // 6. Transport
    else if (query.includes('bus') || query.includes('transport') || query.includes('driver')) {
        router.push('/(app)/transport');
    }
    else {
      Alert.alert("Search", `No specific module found for: "${searchQuery}"`);
    }
    
    setSearchQuery(''); // Clear after search
  };

  const handleChangePassword = () => {
    Alert.alert("Change Password", "Navigate to Change Password Screen");
    setShowProfileModal(false);
  };

  return (
    <View style={[styles.navbar, isMobile && styles.navbarMobile]}>
      
      {/* --- LEFT SECTION: Logo & Menu --- */}
      {/* Web: Increased Flex to 2 to accommodate long names */}
      <View style={styles.left}>
        <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="#1F2937" />
        </TouchableOpacity>

        {/* School Logo & Name */}
        <View style={styles.brandContainer}>
            <Image 
                source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFUwsr9FXcBrBcvmM2HoEh7A7oI_GUa80drA&s' }} 
                style={styles.schoolLogo}
                resizeMode="contain"
            />
            <Text style={styles.logoText} numberOfLines={1} ellipsizeMode="tail">
                EKASHILA HIGH SCHOOL
            </Text>
        </View>

        {/* User Info (Web Only) - Adjusted Margins for better fit */}
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
      {/* Web: Flex 2 (Balanced with Left) */}
      {!isMobile && (
        <View style={styles.center}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#6B7280"
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search modules (e.g. assignments, teachers)..."
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

                    {/* Options - Removed Account Settings */}
                    <TouchableOpacity style={styles.menuOption} onPress={handleChangePassword}>
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
  
  // 🔥 FIX: Increased Left Flex to make space for long school names
  left: { 
      flex: 2,  // Was 1.5
      flexDirection: 'row', 
      alignItems: 'center',
      minWidth: 0 
  },
  
  menuButton: { marginRight: 12 },
  
  brandContainer: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      gap: 8,
      flexShrink: 1 // 🔥 Allow container to shrink on mobile/small screens
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
      flexShrink: 1 // 🔥 Allow text to shrink and truncate
  },
  
  // 🔥 FIX: Reduced marginLeft to avoid overlap with large titles
  userInfo: { 
      marginLeft: 16,  // Was 40
      paddingLeft: 16, 
      borderLeftWidth: 1, 
      borderLeftColor: '#E5E7EB', 
      justifyContent: 'center',
      minWidth: 100 
  },
  usernameText: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  roleText: { fontSize: 11, color: '#6B7280', fontWeight: '600', marginTop: 2 },
  
  // 🔥 FIX: Adjusted Center Flex to balance layout
  center: {
    flex: 2, // Was 3
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#F9FAFB',
    borderRadius: 8, 
    paddingHorizontal: 12, 
    marginHorizontal: 16, // Was 20
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
  },
  
  // Profile Overlay (Transparent or light to show it's a dropdown)
  profileOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.1)', 
  },

  // Notification Dropdown
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

  // Profile Dropdown (Positioned Near Button)
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

});