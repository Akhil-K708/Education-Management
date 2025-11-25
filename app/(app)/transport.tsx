import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import AdminTransportView from '../../src/components/transport/AdminTransportView';
import StudentTransportView from '../../src/components/transport/StudentTransportView';
import { useAuth } from '../../src/context/AuthContext';

export default function TransportScreen() {
  const { state } = useAuth();
  const user = state.user;

  if (state.status === 'loading' || !user) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#F97316" />
        </View>
    );
  }

  if (user.role === 'ADMIN') {
      return <AdminTransportView />;
  }

  return <StudentTransportView />;
}