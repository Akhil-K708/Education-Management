import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const StudentDashboard = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, Student!</Text>
      <Text>Your dashboard components will be shown here.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});