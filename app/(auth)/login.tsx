import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { authApi } from '../../src/api/axiosInstance';
import { useAuth } from '../../src/context/AuthContext';

// Keep the same background for consistency or change if needed
const BACKGROUND_IMAGE_URL = 'https://as1.ftcdn.net/v2/jpg/15/97/15/88/1000_F_1597158825_9laxe2IuJ0tjrftGpEzDlz12icdYvECg.jpg';
const SCHOOL_LOGO_URL = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFUwsr9FXcBrBcvmM2HoEh7A7oI_GUa80drA&s';

export default function LoginScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
  
  const handleForgotPassword = () => {
    Alert.alert('Forgot Password', 'Please contact the school administration to reset your password.');
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
            <Text style={styles.schoolName}>EKASHILA HIGH SCHOOL</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>

            {/* Inputs */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Username / Student ID"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    placeholderTextColor="#6B7280"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor="#6B7280"
                />
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
                onPress={handleForgotPassword}
            >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
            
            </View>
        </KeyboardAvoidingView>
      </View>
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
    backgroundColor: 'rgba(17, 24, 39, 0.7)', // Darker overlay for better contrast
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
        boxShadow: '0px 10px 40px rgba(0,0,0,0.2)', // Modern Web Shadow
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
  input: {
    backgroundColor: '#F9FAFB',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#1F2937',
  },

  button: {
    backgroundColor: '#2563EB', // Brand Color
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
});