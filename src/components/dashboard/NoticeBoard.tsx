import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { getAllNotices } from '../../api/noticeApi';
import { Notice } from '../../types/notice';

export const NoticeBoard = () => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const data = await getAllNotices();
        // Sort by Date (Latest First)
        const sorted = data.sort((a, b) => new Date(b.noticeDate).getTime() - new Date(a.noticeDate).getTime());
        setNotices(sorted);
      } catch (e) {
        console.error("Failed to fetch notices");
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);

  const getIconColor = (type: string) => {
    switch (type) {
      case 'HOLIDAY': return '#EF4444'; // Red
      case 'EVENT': return '#F59E0B';   // Orange
      default: return '#2563EB';        // Blue
    }
  };

  const renderItem = ({ item }: { item: Notice }) => (
    <View style={styles.item}>
      <View style={[styles.iconContainer, { backgroundColor: getIconColor(item.noticeType) + '20' }]}>
        <Ionicons name="notifications" size={20} color={getIconColor(item.noticeType)} />
      </View>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.noticeName}</Text>
        <Text style={styles.itemDescription} numberOfLines={2}>{item.noticeDescription}</Text>
      </View>
      <View style={styles.dateBox}>
         <Text style={styles.itemDate}>{item.noticeDate}</Text>
         <Text style={[styles.typeText, { color: getIconColor(item.noticeType) }]}>{item.noticeType}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.card, { minHeight: 200, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="small" color="#F97316" />
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Notice Board</Text>
        <Ionicons name="megaphone-outline" size={20} color="#6B7280" />
      </View>
      
      <FlatList
        data={notices}
        renderItem={renderItem}
        keyExtractor={(item) => item.id || Math.random().toString()}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No new notices.</Text>
        }
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
    flex: 1, 
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  iconContainer: {
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2
  },
  itemContent: {
    flex: 1,
    marginRight: 8,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2
  },
  itemDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  dateBox: {
    alignItems: 'flex-end'
  },
  itemDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 2
  },
  typeText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 20
  }
});