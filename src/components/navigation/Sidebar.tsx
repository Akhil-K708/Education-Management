import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { adminMenu, MenuItem, studentMenu, teacherMenu } from '../../constants/menu';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  onNavigate: (path: string) => void;
  isOpen?: boolean;
}

export const Sidebar = ({ onNavigate, isOpen = true }: SidebarProps) => {
  const { state, logout } = useAuth();
  const user = state.user;
  const pathname = usePathname();
  const [menu, setMenu] = useState<MenuItem[]>([]);
  
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  useEffect(() => {
    if (!user) return;
    if (user.role === 'ADMIN') setMenu(adminMenu);
    else if (user.role === 'TEACHER') setMenu(teacherMenu);
    else if (user.role === 'STUDENT') setMenu(studentMenu);
    else setMenu([]);
  }, [user]);

  return (
    <View style={styles.sidebar}>
      
      {/* --- LOGO & SCHOOL NAME HEADER (Only for Mobile) --- */}
      {isMobile && ( 
          <View style={[styles.brandContainer, !isOpen && styles.brandContainerCollapsed]}>
            <Image 
                source={{ uri: 'https://www.anasolconsultancyservices.com/assets/Logo1-BPHJw_VO.png' }} 
                style={styles.schoolLogo}
                resizeMode="contain"
            />
            {isOpen && (
                <Text style={styles.brandText} numberOfLines={1} ellipsizeMode="tail">
                    ANASOL TECHNO SCHOOL
                </Text>
            )}
          </View>
      )}

      <ScrollView style={styles.menuContainer}>
        {menu.map((item) => {
          const normalizedPath = item.path.replace('/(app)', '') || '/';
          const isActive =
            normalizedPath === '/'
              ? pathname === normalizedPath
              : pathname.startsWith(normalizedPath);
          

          return (
            <Pressable
              key={item.label}
              style={({ pressed }) => [
                styles.menuItem,
                isActive && styles.menuItemActive, 
                !isOpen && styles.menuItemCollapsed,
                pressed && !isActive && styles.menuItemPressed,
              ]}
              onPress={() => onNavigate(item.path)}
            >
              <Ionicons
                name={item.iconName as any}
                size={22}
                color={isActive ? '#FFFFFF' : '#6B7280'}
              />
              {isOpen && (
                <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
                  {item.label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.logoutContainer}>
        <Pressable
          style={({ pressed }) => [
            styles.menuItem,
            !isOpen && styles.menuItemCollapsed,
            pressed && styles.logoutItemPressed,
          ]}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          {isOpen && (
            <Text style={[styles.menuText, styles.logoutText]}>Logout</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 10,
    overflow: 'hidden',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  
  // --- ADDED BRAND STYLES ---
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  brandContainerCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  schoolLogo: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  brandText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
    marginLeft: 10,
    flex: 1,
  },
  

  menuContainer: {
    flex: 1,
    paddingTop: 5, 
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 8,
  },
  menuItemCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  menuItemActive: {
    backgroundColor: '#F97316', 
  },
  menuItemPressed: {
    backgroundColor: '#FFF7ED', 
  },
  menuText: {
    color: '#374151',
    fontSize: 16,
    marginLeft: 15,
    ...Platform.select({
      web: {
        whiteSpace: 'nowrap',
      } as any,
    }),
  },
  menuTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  logoutContainer: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 10,
  },
  logoutText: {
    color: '#EF4444',
  },
  logoutItemPressed: {
    backgroundColor: '#FEE2E2',
  },
});