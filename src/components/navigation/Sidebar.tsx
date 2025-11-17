import { Ionicons } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
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

  useEffect(() => {
    if (!user) return;
    if (user.role === 'ADMIN') setMenu(adminMenu);
    else if (user.role === 'TEACHER') setMenu(teacherMenu);
    else if (user.role === 'STUDENT') setMenu(studentMenu);
    else setMenu([]);
  }, [user]);

  return (
    <View style={styles.sidebar}>
      <ScrollView style={styles.menuContainer}>
        {menu.map((item) => {
          const isActive = pathname === item.path;
          return (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                isActive && styles.menuItemActive,
                !isOpen && styles.menuItemCollapsed,
              ]}
              onPress={() => onNavigate(item.path)}
            >
              <Ionicons
                name={item.iconName as any}
                size={22}
                color={isActive ? '#FFFFFF' : '#aeb9e1'}
              />
              {isOpen && (
                <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
                  {item.label}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.logoutContainer}>
        <TouchableOpacity
          style={[styles.menuItem, !isOpen && styles.menuItemCollapsed]}
          onPress={logout}
        >
          <Ionicons name="log-out-outline" size={22} color="#aeb9e1" />
          {isOpen && <Text style={styles.menuText}>Logout</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebar: {
    flex: 1,
    backgroundColor: '#1E293B',
    padding: 10,
    overflow: 'hidden',
  },
  menuContainer: {
    flex: 1,
    paddingTop: 10,
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
    backgroundColor: '#2563EB',
  },
  menuText: {
    color: '#aeb9e1',
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
    borderTopColor: '#374151',
    paddingTop: 10,
  },
});