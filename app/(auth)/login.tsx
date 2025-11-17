import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { authApi } from '../../src/api/axiosInstance';
import { useAuth } from '../../src/context/AuthContext';

const BACKGROUND_IMAGE_URL = 'https://as1.ftcdn.net/v2/jpg/15/97/15/88/1000_F_1597158825_9laxe2IuJ0tjrftGpEzDlz12icdYvECg.jpg';

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
    Alert.alert('Forgot Password', 'This feature is not yet implemented.');
  };

  return (
    <ImageBackground
      source={{ uri: BACKGROUND_IMAGE_URL }}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.formWrapper}>
          <Text style={styles.title}>Welcome</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <TextInput
            style={styles.input}
            placeholder="Username"
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

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.forgotPasswordContainer}
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
          
        </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
    ...Platform.select({
      web: {
        width: '100%',
        alignItems: 'center',
      },
    }),
  },
  formWrapper: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 24,
    ...Platform.select({
      web: {
        maxWidth: 400,
        backdropFilter: 'blur(10px)',
      } as any,
      native: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
      },
    }),
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 40,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(209, 213, 219, 0.7)',
    fontSize: 16,
    marginBottom: 16,
    color: '#111827',
  },
  button: {
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  forgotPasswordContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#2563EB',
    fontSize: 14,
    fontWeight: '600',
  },
});