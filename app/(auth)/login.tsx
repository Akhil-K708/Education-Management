import { Ionicons } from '@expo/vector-icons'; // 🔥 Imported Icons
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    ImageBackground,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { authApi } from '../../src/api/axiosInstance';
import { useAuth } from '../../src/context/AuthContext';

const BACKGROUND_IMAGE_URL = 'https://as1.ftcdn.net/v2/jpg/15/97/15/88/1000_F_1597158825_9laxe2IuJ0tjrftGpEzDlz12icdYvECg.jpg';
const SCHOOL_LOGO_URL = 'https://www.anasolconsultancyservices.com/assets/Logo1-BPHJw_VO.png';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // --- VISIBILITY STATES ---
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- FORGOT PASSWORD STATE ---
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1); 
  const [resetLoading, setResetLoading] = useState(false);
  
  // Forgot Password Form Data
  const [resetUsername, setResetUsername] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const { login } = useAuth();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Please enter both username and password.');
      return;
    }

    setLoading(true);
    console.log('Attempting login for user:', username);

    try {
      const response = await authApi.post('/login', {
        username: username,
        password: password,
      });

      const { accessToken, refreshToken } = response.data;
      
      console.log('Login successful, received tokens.');

      if (accessToken && refreshToken) {
        await login(accessToken, refreshToken);
      } else {
        Alert.alert('Login Failed', 'Invalid response from server.');
      }
    } catch (error: any) {
      console.error('Login Error:', error.response ? error.response.data : error.message);
      const errorMsg = error.response?.data?.message || 'Invalid username or password.';
      Alert.alert('Login Failed', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // --- STEP 1: SEND OTP ---
  const handleSendOtp = async () => {
      if (!resetUsername) {
          Alert.alert("Error", "Please enter your Username / Student ID");
          return;
      }
      setResetLoading(true);
      try {
          await authApi.post('/forgot-password', { username: resetUsername });
          Alert.alert("OTP Sent", "Please check your registered email for the OTP.");
          setForgotStep(2); 
      } catch (e: any) {
          const msg = e.response?.data?.message || "Failed to send OTP. Check username.";
          Alert.alert("Error", msg);
      } finally {
          setResetLoading(false);
      }
  };

  // --- STEP 2: RESET PASSWORD ---
  const handleResetPassword = async () => {
      if (!otp || !newPassword || !confirmNewPassword) {
          Alert.alert("Error", "Please fill all fields");
          return;
      }
      if (newPassword !== confirmNewPassword) {
          Alert.alert("Error", "Passwords do not match");
          return;
      }

      setResetLoading(true);
      try {
          await authApi.post('/reset-password', {
              username: resetUsername,
              otp,
              newPassword,
              confirmNewPassword
          });
          
          Alert.alert("Success", "Password reset successfully! Please login.");
          setShowForgotModal(false);
          resetFields();
          
      } catch (e: any) {
          const msg = e.response?.data?.message || "Failed to reset password. Invalid OTP.";
          Alert.alert("Error", msg);
      } finally {
          setResetLoading(false);
      }
  };

  const openForgotModal = () => {
      resetFields();
      setShowForgotModal(true);
  };

  const resetFields = () => {
      setForgotStep(1);
      setResetUsername('');
      setOtp('');
      setNewPassword('');
      setConfirmNewPassword('');
      setShowNewPassword(false);
      setShowConfirmPassword(false);
  };
  
  return (
    <ImageBackground
      source={{ uri: BACKGROUND_IMAGE_URL }}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
        >
            <View style={styles.formWrapper}>
            
            {/* Logo Section */}
            <View style={styles.logoContainer}>
                <Image 
                    source={{ uri: SCHOOL_LOGO_URL }} 
                    style={styles.schoolLogo}
                    resizeMode="contain"
                />
            </View>

            {/* Title Section */}
            <Text style={styles.welcomeText}>Welcome to</Text>
            <Text style={styles.schoolName}>ANASOL TECHNO SCHOOL</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            {/* Inputs */}
            <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="Username / Student ID"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        placeholderTextColor="#6B7280"
                    />
                </View>
                
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showLoginPassword} // 🔥 Toggle Here
                        placeholderTextColor="#6B7280"
                    />
                    <TouchableOpacity 
                        style={styles.eyeIcon}
                        onPress={() => setShowLoginPassword(!showLoginPassword)}
                    >
                        <Ionicons 
                            name={showLoginPassword ? "eye-off" : "eye"} 
                            size={20} 
                            color="#6B7280" 
                        />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                disabled={loading}
            >
                {loading ? (
                <ActivityIndicator color="#fff" />
                ) : (
                <Text style={styles.buttonText}>LOGIN</Text>
                )}
            </TouchableOpacity>
            
            <TouchableOpacity
                style={styles.forgotPasswordContainer}
                onPress={openForgotModal}
            >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
            
            </View>
        </KeyboardAvoidingView>
      </View>

      {/* --- FORGOT PASSWORD MODAL --- */}
      <Modal visible={showForgotModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
              <View style={[styles.modalContent, Platform.OS === 'web' && { maxWidth: 400 }]}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>
                          {forgotStep === 1 ? "Reset Password" : "Set New Password"}
                      </Text>
                      <TouchableOpacity onPress={() => setShowForgotModal(false)}>
                          <Ionicons name="close" size={24} color="#374151" />
                      </TouchableOpacity>
                  </View>

                  {forgotStep === 1 ? (
                      // STEP 1: ENTER USERNAME
                      <View>
                          <Text style={styles.modalSubText}>Enter your Username or Student ID. We will send an OTP to your registered email.</Text>
                          <View style={styles.modalInputWrapper}>
                              <TextInput 
                                  style={styles.modalInput} 
                                  placeholder="Username / Student ID" 
                                  value={resetUsername}
                                  onChangeText={setResetUsername}
                                  autoCapitalize="none"
                              />
                          </View>
                          <TouchableOpacity 
                              style={styles.modalBtn} 
                              onPress={handleSendOtp}
                              disabled={resetLoading}
                          >
                              {resetLoading ? <ActivityIndicator color="#FFF"/> : <Text style={styles.modalBtnText}>Send OTP</Text>}
                          </TouchableOpacity>
                      </View>
                  ) : (
                      // STEP 2: ENTER OTP & NEW PASSWORD
                      <ScrollView>
                          <Text style={styles.modalSubText}>Enter the OTP sent to your email and set a new password.</Text>
                          
                          <View style={styles.modalInputWrapper}>
                              <TextInput 
                                  style={styles.modalInput} 
                                  placeholder="Enter OTP" 
                                  value={otp}
                                  onChangeText={setOtp}
                                  keyboardType="numeric"
                              />
                          </View>
                          
                          <View style={styles.modalInputWrapper}>
                              <TextInput 
                                  style={[styles.modalInput, {paddingRight: 40}]} 
                                  placeholder="New Password" 
                                  value={newPassword}
                                  onChangeText={setNewPassword}
                                  secureTextEntry={!showNewPassword} // 🔥 Toggle Here
                              />
                              <TouchableOpacity 
                                  style={styles.modalEyeIcon}
                                  onPress={() => setShowNewPassword(!showNewPassword)}
                              >
                                  <Ionicons 
                                      name={showNewPassword ? "eye-off" : "eye"} 
                                      size={20} 
                                      color="#6B7280" 
                                  />
                              </TouchableOpacity>
                          </View>

                          <View style={styles.modalInputWrapper}>
                              <TextInput 
                                  style={[styles.modalInput, {paddingRight: 40}]} 
                                  placeholder="Confirm New Password" 
                                  value={confirmNewPassword}
                                  onChangeText={setConfirmNewPassword}
                                  secureTextEntry={!showConfirmPassword} // 🔥 Toggle Here
                              />
                              <TouchableOpacity 
                                  style={styles.modalEyeIcon}
                                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                  <Ionicons 
                                      name={showConfirmPassword ? "eye-off" : "eye"} 
                                      size={20} 
                                      color="#6B7280" 
                                  />
                              </TouchableOpacity>
                          </View>

                          <View style={styles.btnRow}>
                              <TouchableOpacity 
                                  style={styles.backBtn} 
                                  onPress={() => setForgotStep(1)}
                              >
                                  <Text style={styles.backBtnText}>Back</Text>
                              </TouchableOpacity>

                              <TouchableOpacity 
                                  style={[styles.modalBtn, {flex: 1, marginTop: 0}]} 
                                  onPress={handleResetPassword}
                                  disabled={resetLoading}
                              >
                                  {resetLoading ? <ActivityIndicator color="#FFF"/> : <Text style={styles.modalBtnText}>Reset Password</Text>}
                              </TouchableOpacity>
                          </View>
                      </ScrollView>
                  )}
              </View>
          </View>
      </Modal>

    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    ...Platform.select({
      web: {
        minHeight: '100vh' as any,
        alignItems: 'center',
      },
    }),
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.7)', 
    justifyContent: 'center',
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  keyboardView: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center'
  },
  formWrapper: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
    ...Platform.select({
      web: {
        maxWidth: 420,
        boxShadow: '0px 10px 40px rgba(0,0,0,0.2)', 
      } as any,
      native: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 10,
        maxWidth: 400,
      },
    }),
  },
  
  logoContainer: {
      marginBottom: 16,
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 5,
      backgroundColor: '#FFF',
      borderRadius: 50,
      padding: 4
  },
  schoolLogo: {
      width: 90,
      height: 90,
      borderRadius: 45,
  },

  welcomeText: {
      fontSize: 14,
      color: '#6B7280',
      textTransform: 'uppercase',
      letterSpacing: 1,
      fontWeight: '600',
      marginBottom: 4
  },
  schoolName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
    textTransform: 'uppercase'
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },

  inputContainer: {
      width: '100%',
      gap: 16,
      marginBottom: 24
  },
  inputWrapper: {
      position: 'relative',
      width: '100%'
  },
  input: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#1F2937',
    width: '100%'
  },
  eyeIcon: {
      position: 'absolute',
      right: 16,
      top: 14,
      zIndex: 1
  },

  button: {
    backgroundColor: '#2563EB', 
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  
  forgotPasswordContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },

  // --- MODAL STYLES ---
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
  },
  modalContent: {
      backgroundColor: '#FFF',
      width: '100%',
      borderRadius: 16,
      padding: 24,
      elevation: 10
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16
  },
  modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#111827'
  },
  modalSubText: {
      fontSize: 14,
      color: '#6B7280',
      marginBottom: 20,
      lineHeight: 20
  },
  modalInputWrapper: {
      position: 'relative',
      marginBottom: 16
  },
  modalInput: {
      borderWidth: 1,
      borderColor: '#E5E7EB',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: '#F9FAFB',
      width: '100%'
  },
  modalEyeIcon: {
      position: 'absolute',
      right: 12,
      top: 12,
      zIndex: 1
  },
  modalBtn: {
      backgroundColor: '#2563EB',
      padding: 14,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 10
  },
  modalBtnText: {
      color: '#FFF',
      fontWeight: 'bold',
      fontSize: 16
  },
  btnRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 10
  },
  backBtn: {
      padding: 14,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#D1D5DB',
      alignItems: 'center',
      minWidth: 80
  },
  backBtnText: {
      color: '#374151',
      fontWeight: '600'
  }
});