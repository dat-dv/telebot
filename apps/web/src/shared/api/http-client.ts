import axios, { type InternalAxiosRequestConfig } from 'axios';
import {
  API_ROUTES,
  type IApiResponse,
  type IDashboardAccessTokenResponse,
} from '@telebot/contracts';
import {
  clearAccessToken,
  getAccessToken,
  setAccessToken,
} from '@/modules/auth/client/auth-storage';

const apiUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : window.location.origin)
).replace(/\/$/, '');
export const httpClient = axios.create({ baseURL: apiUrl, withCredentials: true });
let refreshRequest: Promise<string> | undefined;

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

httpClient.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || error.response?.status !== 401) return Promise.reject(error);
  const request = error.config as
    (InternalAxiosRequestConfig & { _dashboardRetried?: boolean }) | undefined;
  if (!request || request._dashboardRetried || request.url === API_ROUTES.dashboardRefresh)
    return Promise.reject(error);
  request._dashboardRetried = true;
  try {
    refreshRequest ??= axios
      .post<IApiResponse<IDashboardAccessTokenResponse>>(
        `${apiUrl}${API_ROUTES.dashboardRefresh}`,
        undefined,
        { withCredentials: true },
      )
      .then((response) => response.data.data.accessToken)
      .finally(() => {
        refreshRequest = undefined;
      });
    const nextToken = await refreshRequest;
    setAccessToken(nextToken);
    request.headers.Authorization = `Bearer ${nextToken}`;
    return httpClient(request);
  } catch (refreshError) {
    clearAccessToken();
    return Promise.reject(refreshError);
  }
});
