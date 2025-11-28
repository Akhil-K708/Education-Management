import axios, { AxiosInstance } from 'axios';
import { deleteFromStorage, getFromStorage, saveToStorage } from '../utils/storage';

const API_HOST = 'http://192.168.0.113:8080';
const AUTH_REFRESH_URL = `${API_HOST}/api/auth/refresh-token`;

function cloneFormData(formData: FormData): FormData {
  const newFormData = new FormData();
  for (let [key, value] of formData.entries()) {
    newFormData.append(key, value);
  }
  return newFormData;
}

let isRefreshing = false;
let failedQueue: { resolve: (value?: any) => void; reject: (err: any) => void }[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const createAxiosInstance = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL: baseURL,
  });

  instance.interceptors.request.use(
    async (config) => {
      const token = await getFromStorage('accessToken');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(token => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              return instance(originalRequest);
            })
            .catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = await getFromStorage('refreshToken');
        if (!refreshToken) {
          console.log("No refresh token found. Logging out.");
          isRefreshing = false;
          processQueue(error);
          return Promise.reject(error);
        }

        console.log(`🔴 Token expired for ${baseURL}. Refreshing...`);

        try {
          const refreshResponse = await axios.post(AUTH_REFRESH_URL, {
            refreshToken: refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;

          await saveToStorage('accessToken', accessToken);
          await saveToStorage('refreshToken', newRefreshToken);

          console.log(`🟢 New Token for ${baseURL} obtained.`);

          if (originalRequest.data instanceof FormData) {
            originalRequest.data = cloneFormData(originalRequest.data);
          }
          
          processQueue(null, accessToken);

          originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
          return instance(originalRequest);

        } catch (refreshError: any) {
          console.error("Refresh token failed. Logging out.", refreshError.response?.data);
          
          await deleteFromStorage('accessToken');
          await deleteFromStorage('refreshToken');
          
          processQueue(refreshError);
          
          return Promise.reject(refreshError);

        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

export const authApi = createAxiosInstance(`${API_HOST}/api/student/auth`);
export const studentApi = createAxiosInstance(`${API_HOST}/api/student`);
export const notificationApi = createAxiosInstance(`${API_HOST}/api/student/notifications`);