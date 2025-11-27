import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
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
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import NotificationList from '../notifications/NotificationList';

interface NavbarProps {
  onMenuPress: () => void;
}

export const Navbar = ({ onMenuPress }: NavbarProps) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { state } = useAuth();
  const user = state.user;
  
  const { unreadCount } = useNotification();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <View style={[styles.navbar, isMobile && styles.navbarMobile]}>
      {/* --- LEFT SECTION --- */}
      <View style={styles.left}>
        <TouchableOpacity onPress={onMenuPress} style={styles.menuButton}>
          <Ionicons name="menu" size={28} color="#1F2937" />
        </TouchableOpacity>

        <Text style={styles.logoText}>Educatio</Text>

        {!isMobile && (
          <View style={styles.userInfo}>
            <Text style={styles.usernameText} numberOfLines={1}>
              {user?.username}
            </Text>
            <Text style={styles.roleText} numberOfLines={1}>
              ({user?.role})
            </Text>
          </View>
        )}
      </View>

      {/* --- CENTER SECTION (Search) --- */}
      {!isMobile && (
        <View style={styles.center}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#6B7280"
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search..."
            style={styles.searchBar}
            placeholderTextColor="#6B7280"
          />
        </View>
      )}

      {/* --- RIGHT SECTION --- */}
      <View style={styles.right}>
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

        <TouchableOpacity style={styles.profileButton}>
          <View style={styles.profilePic}>
            <Ionicons name="person-outline" size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>

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
  
  left: { flex: 1.5, flexDirection: 'row', alignItems: 'center' },
  
  center: {
    flex: 3, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6',
    borderRadius: 8, paddingHorizontal: 10, marginHorizontal: 20, borderWidth: 1, borderColor: '#E5E7EB'
  },
  
  right: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  
  menuButton: { marginRight: 12 },
  logoText: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  
  userInfo: { marginLeft: 10, paddingLeft: 10, borderLeftWidth: 1, borderLeftColor: '#E5E7EB' },
  usernameText: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  roleText: { fontSize: 12, color: '#6B7280' },
  
  searchIcon: { marginRight: 8 },
  searchBar: {
    flex: 1, height: 40, fontSize: 16, color: '#111827',
    ...Platform.select({ web: { outlineStyle: 'none', borderWidth: 0 } as any }),
  },
  
  iconButton: { padding: 8, position: 'relative' },
  profileButton: { marginLeft: 12 },
  profilePic: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#4B5563', justifyContent: 'center', alignItems: 'center' },
  
  badge: {
      position: 'absolute', top: 4, right: 4, backgroundColor: '#EF4444',
      borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center',
      borderWidth: 1.5, borderColor: '#FFF'
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold', paddingHorizontal: 2 },

  modalOverlay: { 
      flex: 1, 
      backgroundColor: 'rgba(0,0,0,0.3)', 
      justifyContent: 'flex-start',
      alignItems: 'center', 
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
      position: 'absolute',
      top: 60,
      right: 20,
      width: 380, 
      maxHeight: 500,
  },

  dropdownMobile: { 
      marginTop: 60, 
      width: '92%', 
      height: 400, 
      maxHeight: '70%', 
  }
});