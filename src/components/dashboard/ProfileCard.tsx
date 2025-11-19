import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { StudentProfileInfo } from '../../types/dashboard';

interface ProfileCardProps {
  profile: StudentProfileInfo;
}

export const ProfileCard = ({ profile }: ProfileCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.profileHeader}>
        {profile.profilePhotoUrl ? (
          <Image
            source={{ uri: profile.profilePhotoUrl }}
            style={styles.profilePhoto}
          />
        ) : (
          <View style={styles.profilePhotoPlaceholder}>
            <Ionicons name="person" size={50} color="#6B7280" />
          </View>
        )}
      </View>
      
      <View style={styles.profileDetails}>
        <Text style={styles.profileName}>{profile.name}</Text>
        <Text style={styles.profileInfo}>
          Class: {profile.class} {profile.section}
        </Text>
        <Text style={styles.profileInfo}>ID: {profile.studentId}</Text>
        <Text style={styles.profileInfo}>Father: {profile.fatherName}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    flex: 1,
    minWidth: 280,
    minHeight: 270,
    alignItems: 'center', 
  },
  profileHeader: {
    marginBottom: 16,
  },
  profilePhoto: {
    width: 100, 
    height: 100,
    borderRadius: 50, 
    borderWidth: 3,
    borderColor: '#F97316', 
  },
  profilePhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E5E7EB',
  },
  profileDetails: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  profileInfo: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 4,
  },
});