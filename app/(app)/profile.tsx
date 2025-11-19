import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Image,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from 'react-native';
import { getStudentProfile } from '../../src/api/studentService';
import { useAuth } from '../../src/context/AuthContext';
import { StudentDTO } from '../../src/types/student';

export default function ProfileScreen() {
  const { state } = useAuth();
  const router = useRouter();
  const user = state.user;
  const { width } = useWindowDimensions();
  const isWeb = width > 768; // Web detection
  
  const [profile, setProfile] = useState<StudentDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = async () => {
    if (!user?.username) return;
    try {
      const data = await getStudentProfile(user.username);
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfile();
  };

  if (state.status === 'loading' || loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F97316" /></View>;
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  const InfoField = ({ label, value, icon }: { label: string, value: string | undefined, icon: string }) => (
    <View style={styles.fieldRow}>
      <View style={styles.iconBox}>
        <Ionicons name={icon as any} size={20} color="#6B7280" />
      </View>
      <View style={styles.fieldContent}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <Text style={styles.fieldValue}>{value || 'N/A'}</Text>
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* --- HEADER CARD --- */}
      <View style={[styles.headerCard, isWeb && styles.headerCardWeb]}>
        
        {/* ================= WEB VIEW LAYOUT ================= */}
        {isWeb ? (
          <View style={styles.webContainer}>
            
            {/* Left Part: Photo + Info */}
            <View style={styles.webLeftSection}>
              <View style={styles.profileImageContainerWeb}>
                {profile.profileImageUrl ? (
                  // Webలో సైజు పెరగడానికి style మార్చాం
                  <Image 
                    source={{ uri: profile.profileImageUrl }} 
                    style={[styles.profileImage, styles.profileImageWeb]} 
                  />
                ) : (
                  <View style={[styles.placeholderImage, styles.placeholderImageWeb]}>
                     <Ionicons name="person" size={70} color="#9CA3AF" />
                  </View>
                )}
              </View>
              
              {/* Spacing పెంచాం */}
              <View style={styles.webIdentityInfo}>
                <Text style={styles.webLabel}>name:</Text>
                <Text style={styles.nameTextWeb}>{profile.fullName}</Text>
                
                <Text style={styles.webLabel}>class:</Text>
                <Text style={styles.classTextWeb}>{profile.grade} - {profile.section}</Text>
                
                <Text style={styles.webLabel}>s/o or d/o:</Text>
                <Text style={styles.fatherNameText}>{profile.fatherName || 'N/A'}</Text>
              </View>
            </View>

            {/* Right Part: ID/Roll/Mobile */}
            <View style={styles.webRightSection}>
              <View style={styles.webInfoRow}>
                <Text style={styles.webInfoLabel}>student id:</Text>
                <Text style={styles.webInfoValue}>{profile.studentId}</Text>
              </View>

              <View style={styles.webInfoRow}>
                <Text style={styles.webInfoLabel}>roll no:</Text>
                <Text style={styles.webInfoValue}>{profile.rollNumber}</Text>
              </View>

              <View style={styles.webInfoRow}>
                <Text style={styles.webInfoLabel}>mobile no:</Text>
                <Text style={styles.webInfoValue}>{profile.contactNumber || 'N/A'}</Text>
              </View>
            </View>

          </View>
        ) : (
          
          /* ================= MOBILE VIEW LAYOUT (UNCHANGED) ================= */
          <>
            <View style={styles.profileImageContainer}>
              {profile.profileImageUrl ? (
                <Image source={{ uri: profile.profileImageUrl }} style={styles.profileImage} />
              ) : (
                <View style={styles.placeholderImage}>
                   <Ionicons name="person" size={50} color="#9CA3AF" />
                </View>
              )}
            </View>
            
            <View style={styles.headerInfo}>
              <Text style={styles.nameText}>{profile.fullName}</Text>
              <Text style={styles.classText}>Class {profile.grade} - {profile.section}</Text>
              
              <View style={styles.badgesRow}>
                 <View style={styles.badge}>
                   <Text style={styles.badgeText}>ID: {profile.studentId}</Text>
                 </View>
                 <View style={styles.badge}>
                   <Text style={styles.badgeText}>Roll: {profile.rollNumber}</Text>
                 </View>
              </View>
            </View>
          </>
        )}
      </View>

      {/* --- DETAILS GRID (Unchanged) --- */}
      <View style={[styles.detailsContainer, isWeb && styles.detailsContainerWeb]}>
        <View style={[styles.sectionCard, isWeb && styles.sectionCardWeb]}>
          <Text style={styles.sectionTitle}>Academic Details</Text>
          <InfoField label="Admission No" value={profile.admissionNumber} icon="id-card-outline" />
          <InfoField label="Academic Year" value={profile.academicYear} icon="calendar-outline" />
          <InfoField label="Joining Date" value={profile.joiningDate} icon="time-outline" />
        </View>

        <View style={[styles.sectionCard, isWeb && styles.sectionCardWeb]}>
          <Text style={styles.sectionTitle}>Personal Details</Text>
          <InfoField label="Date of Birth" value={profile.dateOfBirth} icon="gift-outline" />
          <InfoField label="Gender" value={profile.gender} icon="person-outline" />
          <InfoField label="Blood Group" value={profile.bloodGroup} icon="water-outline" />
          <InfoField label="Nationality" value={profile.nationality} icon="flag-outline" />
          <InfoField label="Aadhaar No" value={profile.aadhaarNumber} icon="finger-print-outline" />
        </View>

        <View style={[styles.sectionCard, isWeb && styles.sectionCardWeb]}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <InfoField label="Phone" value={profile.contactNumber} icon="call-outline" />
          <InfoField label="Email" value={profile.email} icon="mail-outline" />
          <InfoField label="Address" value={`${profile.address}, ${profile.city}, ${profile.state} - ${profile.pincode}`} icon="location-outline" />
        </View>

        <View style={[styles.sectionCard, isWeb && styles.sectionCardWeb]}>
          <Text style={styles.sectionTitle}>Parent's Details</Text>
          <InfoField label="Father's Name" value={profile.fatherName} icon="male-outline" />
          <InfoField label="Father's Contact" value={profile.fatherContact} icon="call-outline" />
          <InfoField label="Mother's Name" value={profile.motherName} icon="female-outline" />
          <InfoField label="Mother's Contact" value={profile.motherContact} icon="call-outline" />
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#EF4444', fontSize: 16 },
  
  // Header Styles
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5,
  },
  headerCardWeb: {
    paddingHorizontal: 40,
    paddingVertical: 30,
    alignItems: 'flex-start',
  },
  
  // --- WEB LAYOUT STYLES ---
  webContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  
  // Left Section
  webLeftSection: {
    flex: 0.65,
    flexDirection: 'row',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F3F4F6',
    paddingRight: 20,
  },
  
  // --- Image Styles ---
  profileImageContainer: {
    marginBottom: 16,
    shadowColor: '#F97316', shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
  },
  profileImageContainerWeb: {
    shadowColor: '#F97316', shadowOpacity: 0.2, shadowRadius: 8, elevation: 5,
    // No bottom margin needed for web since it's a row
  },
  profileImage: {
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    borderWidth: 3, 
    borderColor: '#F97316',
  },
  // New Web Specific Image Size (Bigger)
  profileImageWeb: {
    width: 140,  // Increased size
    height: 140, // Increased size
    borderRadius: 70,
    borderWidth: 4,
  },
  placeholderImage: {
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#F3F4F6',
    justifyContent: 'center', 
    alignItems: 'center', 
    borderWidth: 3, 
    borderColor: '#E5E7EB',
  },
  // New Web Specific Placeholder Size
  placeholderImageWeb: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },

  // --- Info Text Styles ---
  webIdentityInfo: {
    justifyContent: 'center',
    marginLeft: 40, // Increased spacing (Gap) from the image
  },
  webLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 2,
    textTransform: 'lowercase',
  },
  nameTextWeb: { fontSize: 24, fontWeight: 'bold', color: '#111827' }, // Slightly bigger font
  classTextWeb: { fontSize: 18, fontWeight: '500', color: '#111827' },
  fatherNameText: { fontSize: 18, fontWeight: '500', color: '#111827' },

  // Right Section
  webRightSection: {
    flex: 0.35,
    justifyContent: 'center',
    paddingLeft: 50,
    alignItems: 'flex-start',
  },
  webInfoRow: {
    marginBottom: 12,
  },
  webInfoLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
    textTransform: 'lowercase',
  },
  webInfoValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },

  // --- MOBILE STYLES (Unchanged) ---
  headerInfo: {
    alignItems: 'center',
  },
  nameText: { fontSize: 22, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  classText: { fontSize: 16, color: '#6B7280', marginTop: 4 },
  
  badgesRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 10,
  },
  badge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  badgeText: {
    fontSize: 12,
    color: '#C2410C',
    fontWeight: '600',
  },

  // --- GRID STYLES ---
  detailsContainer: { flexDirection: 'column' },
  detailsContainerWeb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    width: '100%',
  },
  sectionCardWeb: {
    width: '49%',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 8,
  },
  fieldRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  iconBox: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#FFF7ED',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  fieldContent: { flex: 1 },
  fieldLabel: { fontSize: 12, color: '#6B7280', marginBottom: 2 },
  fieldValue: { fontSize: 15, color: '#374151', fontWeight: '500' },
});