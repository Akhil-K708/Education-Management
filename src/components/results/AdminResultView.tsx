import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function AdminResultView() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Admin Class-Wise Results Analysis</Text>
      <Text style={styles.subText}>(Coming Soon)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 20, fontWeight: 'bold', color: '#374151' },
  subText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 }
});