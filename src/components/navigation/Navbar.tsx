import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onMenuPress: () => void;
}

export const Navbar = ({ onMenuPress }: NavbarProps) => {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const { state } = useAuth();
  const user = state.user;

  return (
    <View style={styles.navbar}>
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

      <View style={styles.right}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={24} color="#374151" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.profileButton}>
          <View style={styles.profilePic}>
            <Ionicons name="person-outline" size={18} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 60,
  },
  left: {
    flex: 1.5, 
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  right: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  menuButton: {
    marginRight: 12,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
 
  userInfo: {
    marginLeft: 10,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    flexShrink: 1, 
  },
  usernameText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  roleText: {
    fontSize: 12,
    color: '#6B7280',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchBar: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#111827',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        borderWidth: 0,
      } as any,
    }),
  },
  iconButton: {
    padding: 8,
  },
  profileButton: {
    marginLeft: 12,
  },
  profilePic: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4B5563',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
});