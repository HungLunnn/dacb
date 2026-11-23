import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import AuthStorageService from "./authStorage";
import AuthApi from "./auth";

const TEST_URL = "http://localhost:9090" as const;

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const privateInstance = axios.create({
  baseURL: TEST_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

privateInstance.interceptors.request.use(
  (config) => {
    const token = AuthStorageService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

privateInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const prevReqConfig = error.config as RetryableRequestConfig | undefined;
    const status = error.response?.status;

    if (
      prevReqConfig &&
      !prevReqConfig._retry &&
      (status === 401 || status === 403) &&
      !prevReqConfig.url?.includes("/auth/refreshToken") &&
      !prevReqConfig.url?.includes("/auth/login")
    ) {
      prevReqConfig._retry = true;
      try {
        await AuthApi.refreshToken();
        const access_token = AuthStorageService.getAccessToken();
        if (access_token) {
          prevReqConfig.headers.Authorization = `Bearer ${access_token}`;
          return privateInstance(prevReqConfig);
        }
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default privateInstance;
