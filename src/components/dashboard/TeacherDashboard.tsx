import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const TeacherDashboard = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, Teacher!</Text>
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