---
metadata:
  agent-artifact:
    id: docs-global-route-constants
    type: documentation
    depends_on:
      - .agents/knowledge/global/route-constants.md
      - .agents/rules/strict-routes-and-paths.md
---

# Hướng Dẫn Quy Chuẩn Quản Lý Route & API Constants

Tài liệu này hướng dẫn chi tiết quy chuẩn cấm tuyệt đối hardcode các đường dẫn URL / API endpoints và cách áp dụng hằng số tập trung, ánh xạ trực tiếp với tri thức canonical [`route-constants.md`](../../knowledge/global/route-constants.md).

---

## 1. Tại Sao Bắt Buộc Sử Dụng Route Constants?

1. **Chống gãy đường dẫn (Dead Links)**: Khi đổi cấu trúc URL trang hoặc endpoint của API, lập trình viên chỉ cần sửa tại một file hằng số duy nhất thay vì tìm kiếm và thay thế thủ công hàng chục file trong dự án.
2. **Type Safety & Tự động gợi ý**: Khi gọi `APP_ROUTES.` hoặc `API_ROUTES.`, IDE sẽ tự động gợi ý các đường dẫn hợp lệ, giảm thiểu tối đa lỗi gõ sai chính tả (typo).
3. **Đồng bộ toàn diện Fullstack**: Trong mô hình Monorepo hoặc Clean Architecture, hằng số route từ `@shared/contracts` giúp Backend Controller và Frontend Repositories luôn đồng nhất 100%.

---

## 2. Vị Trí Lưu Trữ & Cách Tổ Chức

### 2.1. Trong Monorepo (Chia sẻ giữa Backend & Frontend)
- **Vị trí**: `packages/shared/src/constants/` hoặc `@shared/contracts`:
  - `routes.ts`: Chứa `APP_ROUTES` dành cho điều hướng Frontend.
  - `api-endpoints.ts`: Chứa `API_ROUTES` / `API_ENDPOINTS` dành cho Backend Controllers & Frontend Repositories.

### 2.2. Trong Dự Án Frontend Đơn Lập
- **Vị trí**: `src/shared/constants/`:
  - `routes.ts`: Định nghĩa `APP_ROUTES` cho toàn bộ trang giao diện.
  - `api-routes.ts`: Định nghĩa `API_ROUTES` và `PROXY_ROUTES` cho các cuộc gọi mạng.

---

## 3. Mẫu Khai Báo Route Constants Chuẩn

### 3.1. Hằng số Điều hướng Giao diện (`APP_ROUTES`)

```typescript
// src/shared/constants/routes.ts
export const APP_ROUTES = {
  HOME: '/',
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
  },
  DASHBOARD: {
    HOME: '/dashboard',
    ANALYTICS: '/dashboard/analytics',
    USERS: '/dashboard/users',
    SETTINGS: '/dashboard/settings',
  },
  USERS: {
    LIST: '/users',
    CREATE: '/users/new',
    DETAIL: (id: string | number) => `/users/${id}`,
    EDIT: (id: string | number) => `/users/${id}/edit`,
  },
} as const;

export type AppRoutes = typeof APP_ROUTES;
```

### 3.2. Hằng số API Endpoints (`API_ROUTES`)

```typescript
// src/shared/constants/api-routes.ts
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    REFRESH: '/api/v1/auth/refresh',
    ME: '/api/v1/auth/me',
  },
  USERS: {
    LIST: '/api/v1/users',
    CREATE: '/api/v1/users',
    DETAIL: (id: string | number) => `/api/v1/users/${id}`,
    UPDATE: (id: string | number) => `/api/v1/users/${id}`,
    DELETE: (id: string | number) => `/api/v1/users/${id}`,
  },
} as const;

export const PROXY_ROUTES = {
  BASE: '/api/proxy',
} as const;
```

---

## 4. Hướng Dẫn Sử Dụng trong Các Tình Huống Thực Tế

### 4.1. Thẻ Liên Kết UI (`Next.js <Link>`)
- ❌ **Cấm**: `<Link href="/dashboard/users">Quản lý người dùng</Link>`
- ✅ **Chuẩn**:
  ```tsx
  import Link from 'next/link';
  import { APP_ROUTES } from '@/shared/constants/routes';

  <Link href={APP_ROUTES.DASHBOARD.USERS}>Quản lý người dùng</Link>
  ```

### 4.2. Điều Hướng Client (`useRouter`)
- ❌ **Cấm**: `router.push('/login')`
- ✅ **Chuẩn**:
  ```tsx
  import { useRouter } from 'next/navigation';
  import { APP_ROUTES } from '@/shared/constants/routes';

  const router = useRouter();
  router.push(APP_ROUTES.AUTH.LOGIN);
  ```

### 4.3. Chuyển Hướng Server (`Server Actions` / `RSC`)
- ❌ **Cấm**: `redirect('/login?redirect=/dashboard')`
- ✅ **Chuẩn**:
  ```tsx
  import { redirect } from 'next/navigation';
  import { APP_ROUTES } from '@/shared/constants/routes';

  redirect(`${APP_ROUTES.AUTH.LOGIN}?redirect=${encodeURIComponent(APP_ROUTES.DASHBOARD.HOME)}`);
  ```

### 4.4. Xóa Cache Trang (`revalidatePath`)
- ❌ **Cấm**: `revalidatePath('/dashboard/users')`
- ✅ **Chuẩn**:
  ```tsx
  import { revalidatePath } from 'next/cache';
  import { APP_ROUTES } from '@/shared/constants/routes';

  revalidatePath(APP_ROUTES.DASHBOARD.USERS);
  ```

### 4.5. Gọi API trong Repository (`proxyHttpClient` / `directHttpClient`)
- ❌ **Cấm**: `httpClient.get('/api/proxy/v1/users')`
- ✅ **Chuẩn**:
  ```tsx
  import { proxyHttpClient } from '@/shared/utils/http/client';
  import { API_ROUTES } from '@/shared/constants/api-routes';

  export const userRepository = {
    async getUsers(signal?: AbortSignal) {
      return proxyHttpClient.get(API_ROUTES.USERS.LIST, { signal });
    },
    async deleteUser(id: string) {
      return proxyHttpClient.delete(API_ROUTES.USERS.DELETE(id));
    },
  };
  ```

### 4.6. Edge Middleware & Route Protection
- ❌ **Cấm**: `const PROTECTED = ['/dashboard', '/admin']`
- ✅ **Chuẩn**:
  ```tsx
  import { APP_ROUTES } from '@/shared/constants/routes';

  const PROTECTED_PREFIXES = [
    APP_ROUTES.DASHBOARD.HOME,
  ];
  ```
