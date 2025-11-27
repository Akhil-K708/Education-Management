import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    useWindowDimensions,
    View
} from 'react-native';
import {
    deleteNotification,
    getAllNotifications,
    markNotificationRead,
    NotificationItem
} from '../../api/notificationApi';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

export default function NotificationList({ onClose }: { onClose: () => void }) {
  const { state } = useAuth();
  // 🔥 Consume lastUpdated to trigger re-fetch
  const { refreshCount, lastUpdated } = useNotification();
  const { width } = useWindowDimensions();
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 🔥 Add lastUpdated dependency
  useEffect(() => {
    fetchList();
  }, [state.user, lastUpdated]);

  const fetchList = async () => {
    if (!state.user?.username) return;
    // Don't show loading spinner on background updates
    if (!refreshing && notifications.length === 0) setLoading(true);
    
    try {
      const data = await getAllNotifications(state.user.username);
      setNotifications(data);
      refreshCount(); 
    } catch(e) {
        console.error("Failed to fetch notifications", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
      setRefreshing(true);
      fetchList();
  };

  const handlePress = async (item: NotificationItem) => {
      if (!item.readFlag) {
          setNotifications(prev => prev.map(n => n.id === item.id ? {...n, readFlag: true} : n));
          await markNotificationRead(item.id);
          refreshCount();
      }
  };

  const handleDelete = async (id: number) => {
      setNotifications(prev => prev.filter(n => n.id !== id));
      await deleteNotification(id);
      refreshCount();
  };

  const getIcon = (type: string) => {
      const t = type ? type.toUpperCase() : 'GENERAL';
      switch(t) {
          case 'FEE': return 'wallet';
          case 'EXAM': return 'school';
          case 'NOTICE': return 'megaphone';
          default: return 'notifications';
      }
  };

  const getColor = (type: string) => {
      const t = type ? type.toUpperCase() : 'GENERAL';
      switch(t) {
          case 'FEE': return '#EF4444';
          case 'EXAM': return '#F59E0B';
          case 'NOTICE': return '#10B981';
          default: return '#3B82F6';
      }
  };

  return (
    <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.title}>Notifications</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
            <View style={styles.center}><ActivityIndicator size="large" color="#F97316"/></View>
        ) : (
            <FlatList
                data={notifications}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{paddingBottom: 20}}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Ionicons name="notifications-off-outline" size={48} color="#D1D5DB" />
                        <Text style={styles.emptyText}>No notifications yet</Text>
                        <TouchableOpacity onPress={fetchList} style={{marginTop: 10}}>
                            <Text style={{color:'#2563EB'}}>Tap to Refresh</Text>
                        </TouchableOpacity>
                    </View>
                }
                renderItem={({item}) => (
                    <TouchableOpacity 
                        style={[styles.item, !item.readFlag && styles.unreadItem]} 
                        onPress={() => handlePress(item)}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconBox, {backgroundColor: getColor(item.type) + '20'}]}>
                            <Ionicons name={getIcon(item.type) as any} size={20} color={getColor(item.type)} />
                        </View>
                        
                        <View style={{flex: 1, marginLeft: 12}}>
                            <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                                <Text style={[styles.itemTitle, !item.readFlag && {fontWeight: 'bold', color: '#111'}]}>
                                    {item.title}
                                </Text>
                                {!item.readFlag && <View style={styles.dot} />}
                            </View>
                            
                            <Text style={styles.itemMsg} numberOfLines={3}>{item.message}</Text>
                            <Text style={styles.itemTime}>
                                {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}
                            </Text>
                        </View>

                        <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item.id)}>
                            <Ionicons name="trash-outline" size={18} color="#9CA3AF" />
                        </TouchableOpacity>
                    </TouchableOpacity>
                )}
            />
        )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
      flex: 1, 
      backgroundColor: '#FFF', 
      borderRadius: 12, 
      overflow: 'hidden',
      width: '100%',
      height: '100%' 
  },
  header: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: 16, 
      borderBottomWidth: 1, 
      borderBottomColor: '#F3F4F6',
      backgroundColor: '#FFF'
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  closeBtn: { padding: 4 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 200 },
  emptyText: { color: '#9CA3AF', marginTop: 10, fontSize: 16 },
  
  item: { 
      flexDirection: 'row', 
      padding: 16, 
      borderBottomWidth: 1, 
      borderBottomColor: '#F9FAFB', 
      alignItems: 'flex-start',
      backgroundColor: '#FFF'
  },
  unreadItem: { backgroundColor: '#F0F9FF' }, 
  
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { fontSize: 15, color: '#374151', marginBottom: 4, flex: 1 },
  itemMsg: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  itemTime: { fontSize: 11, color: '#9CA3AF', marginTop: 6 },
  
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB', marginLeft: 5, marginTop: 6 },
  delBtn: { padding: 8, marginLeft: 4 }
});