import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { NoticeItem } from '../../types/dashboard';

interface NoticeBoardProps {
  notices: NoticeItem[];
}

export const NoticeBoard = ({ notices }: NoticeBoardProps) => {
  const renderItem = ({ item }: { item: NoticeItem }) => (
    <View style={styles.item}>
      <View style={styles.iconContainer}>
        <Ionicons name="megaphone-outline" size={24} color="#2563EB" />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
      </View>
      <Text style={styles.itemDate}>{item.date}</Text>
    </View>
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Notice Board</Text>
      <FlatList
        data={notices}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingVertical: 12,
  },
  iconContainer: {
    backgroundColor: '#DBEAFE',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemDescription: {
    fontSize: 13,
    color: '#6B7280',
  },
  itemDate: {
    fontSize: 12,
    color: '#6B7280',
  },
});