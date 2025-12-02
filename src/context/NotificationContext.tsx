import React, { createContext, useContext, useEffect, useState } from 'react';
import EventSource from 'react-native-sse';
import { getUnreadCount } from '../api/notificationApi';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
  lastUpdated: number; 
  refreshCount: () => void;
  decrementUnreadCount: () => void; // 🔥 Added this function
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { state } = useAuth();
  const user = state.user;
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(Date.now()); 

  const refreshCount = async () => {
    if (user?.username) {
      const count = await getUnreadCount(user.username);
      setUnreadCount(count);
    }
  };

  // 🔥 Helper to decrease count immediately locally
  const decrementUnreadCount = () => {
    setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
  };

  useEffect(() => {
    refreshCount();
  }, [user]);

  useEffect(() => {
    if (!user?.username) return;

    const url = `http://192.168.0.112:8080/api/student/notifications/subscribe/${user.username}`;
    const es = new EventSource(url);

    es.addEventListener("open", () => {
      console.log("🟢 SSE Connected for Notifications");
    });

    (es as any).addEventListener("notification", (event: any) => {
      console.log("🔔 New Notification Received!");
      setUnreadCount(prev => prev + 1);
      setLastUpdated(Date.now()); 
    });

    es.addEventListener("error", (event: any) => {
      if (event?.type === 'error') {
          // console.log("🔴 SSE Connection Issue"); 
      }
    });

    return () => {
      es.removeAllEventListeners();
      es.close();
    };
  }, [user]);

  return (
    <NotificationContext.Provider value={{ unreadCount, lastUpdated, refreshCount, decrementUnreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};