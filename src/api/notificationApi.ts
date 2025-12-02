import { notificationApi } from './axiosInstance';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: string;       
  readFlag: boolean;
  createdAt: string;
}

// Get Unread Count
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const response = await notificationApi.get<number>(`/unread-count/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return 0;
  }
};

// 🔥 Updated to support Pagination (page, size)
export const getAllNotifications = async (userId: string, page: number = 0, size: number = 10): Promise<NotificationItem[]> => {
  try {
    // Backend expects params like ?page=0&size=10
    const response = await notificationApi.get<NotificationItem[]>(`/all/${userId}`, {
      params: { page, size }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};

// Mark as Read
export const markNotificationRead = async (id: number) => {
  try {
    await notificationApi.post(`/read/${id}`);
  } catch (error) {
    console.error("Error marking read:", error);
  }
};

// Delete Notification
export const deleteNotification = async (id: number) => {
  try {
    await notificationApi.delete(`/delete/${id}`);
  } catch (error) {
    console.error("Error deleting notification:", error);
  }
};