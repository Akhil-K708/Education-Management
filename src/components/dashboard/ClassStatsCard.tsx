import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ClassStats } from '../../types/dashboard';

interface ClassStatsProps {
  stats: ClassStats;
}

export const ClassStatsCard = ({ stats }: ClassStatsProps) => {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Total Class Members</Text>
      
      <Text style={styles.total}>{stats.total}</Text>
      
      <View style={styles.genderRow}>
        <View style={styles.genderInfo}>
          <Ionicons name="female" size={16} color="#EC4899" />
          <Text style={styles.genderText}>Girls: {stats.girls}</Text>
        </View>
        <View style={styles.genderInfo}>
          <Ionicons name="male" size={16} color="#3B82F6" />
          <Text style={styles.genderText}>Boys: {stats.boys}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    alignItems: 'center', 
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  total: {
    fontSize: 28, 
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  genderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%', 
  },
  genderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  genderText: {
    fontSize: 13,
    color: '#4B5563',
    marginLeft: 4,
    fontWeight: '500',
  },
});