import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

// --- మీరు వీటిని వేరే ఫైల్స్‌గా కూడా క్రియేట్ చేయవచ్చు ---
const AdminSettings = () => (
  <View>
    <Text style={styles.roleTitle}>Admin Settings</Text>
    <Text style={styles.settingItem}>1. Manage School Details</Text>
    <Text style={styles.settingItem}>2. Set App Theme & Logo</Text>
    <Text style={styles.settingItem}>3. Manage Payment Gateway</Text>
    <Text style={styles.settingItem}>4. My Profile</Text>
    <Text style={styles.settingItem}>5. Change Password</Text>
  </View>
);

const TeacherSettings = () => (
  <View>
    <Text style={styles.roleTitle}>Teacher Settings</Text>
    <Text style={styles.settingItem}>1. My Profile</Text>
    <Text style={styles.settingItem}>2. Manage Notifications</Text>
    <Text style={styles.settingItem}>3. Change Password</Text>
  </View>
);

const StudentSettings = () => (
  <View>
    <Text style={styles.roleTitle}>Student Settings</Text>
    <Text style={styles.settingItem}>1. My Profile</Text>
    <Text style={styles.settingItem}>2. Change Password</Text>
  </View>
);
// --- ---

export default function SettingsScreen() {
  const { state } = useAuth();
  const user = state.user;

  if (state.status === 'loading' || !user) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  // --- రోల్ ఆధారిత రెండరింగ్ ---
  const renderSettingsByRole = () => {
    switch (user.role) {
      case 'ADMIN':
        return <AdminSettings />;
      case 'TEACHER':
        return <TeacherSettings />;
      case 'STUDENT':
        return <StudentSettings />;
      default:
        return <StudentSettings />;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      {renderSettingsByRole()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    color: '#F97316',
  },
  settingItem: {
    fontSize: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
});