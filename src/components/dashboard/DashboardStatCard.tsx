import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatCardProps {
  title: string;
  value: string | number;
  iconName: keyof typeof Ionicons.glyphMap;
  color: string;
}

export const DashboardStatCard = ({ title, value, iconName, color }: StatCardProps) => {
  return (
    <View style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Ionicons name={iconName} size={24} color="#fff" />
      </View>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 14,
    color: '#6B7280',
  },
  value: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
});