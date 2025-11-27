import React, { createContext, useContext, useEffect, useState } from 'react';
import EventSource from 'react-native-sse';
import { getUnreadCount } from '../api/notificationApi';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  unreadCount: number;
  lastUpdated: number; // 🔥 NEW: Trigger for refreshing list
  refreshCount: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { state } = useAuth();
  const user = state.user;
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(Date.now()); // 🔥 Store timestamp

  const refreshCount = async () => {
    if (user?.username) {
      const count = await getUnreadCount(user.username);
      setUnreadCount(count);
    }
  };

  useEffect(() => {
    refreshCount();
  }, [user]);

  useEffect(() => {
    if (!user?.username) return;

    const url = `http://192.168.0.113:8080/api/notifications/subscribe/${user.username}`;
    const es = new EventSource(url);

    es.addEventListener("open", () => {
      console.log("🟢 SSE Connected for Notifications");
    });

    (es as any).addEventListener("notification", (event: any) => {
      console.log("🔔 New Notification Received!");
      setUnreadCount(prev => prev + 1);
      setLastUpdated(Date.now()); // 🔥 Trigger list refresh
    });

    es.addEventListener("error", (event: any) => {
      if (event?.type === 'error') {
          // console.log("🔴 SSE Connection Issue"); // Optional log
      }
    });

    return () => {
      es.removeAllEventListeners();
      es.close();
    };
  }, [user]);

  return (
    <NotificationContext.Provider value={{ unreadCount, lastUpdated, refreshCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within NotificationProvider');
  return context;
};