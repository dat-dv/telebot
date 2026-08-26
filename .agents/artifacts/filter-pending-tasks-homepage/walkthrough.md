# Walkthrough - Filter Completed Tasks on Homepage

Đã hoàn thành việc lọc bỏ các công việc đã hoàn thành (`status === 'completed'`) khỏi danh sách "Việc cần làm" trên trang chủ Dashboard, chỉ hiển thị những việc chưa làm xong.

## Changes Made

### Dashboard Module

#### dashboard-home-screen.tsx

- Đã thay đổi `filteredTasks` trong `dashboard-home-screen.tsx` để lọc từ `pendingTasks` thay vì `data.tasks`.
- Khi người dùng tìm kiếm theo từ khóa trong ô search của widget "Việc cần làm", hệ thống sẽ tìm kiếm trên danh sách các công việc chưa hoàn thành.

```tsx
// Code sau khi cập nhật:
const filteredTasks = useMemo(() => {
  if (!taskSearch.trim()) return pendingTasks;
  const q = taskSearch.toLowerCase();
  return pendingTasks.filter((item) => item.title.toLowerCase().includes(q));
}, [pendingTasks, taskSearch]);
```

## Verification Results

### Automated Tests & Checks

1. **TypeScript Typecheck**:
   - Chạy `npm run typecheck` thành công, không có lỗi type.
1. **ESLint**:
   - Chạy `npm run lint` thành công, không có lỗi code style/linter.
1. **Agent System Validation**:
   - Chạy `npm run agent-system:validate` thành công, đảm bảo hệ thống artifact và tài liệu đồng bộ.
