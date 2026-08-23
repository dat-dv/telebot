---
RequestFeedback: true
Status: pending-approval
Route: implement
Authority: inspect-and-plan
Risk: low
---

# Kế hoạch chạy API và Web bằng một lệnh

## Phạm vi

1. Thêm dependency phát triển `concurrently` ở root workspace.
2. Đổi/thêm script `dev` để chạy song song `dev:api` và `dev:web`; giữ nguyên hai script riêng cho trường hợp debug từng ứng dụng.
3. Tạo `apps/web/.env.local.example` với `VITE_API_URL=http://localhost:3000`, vì Vite đọc env theo thư mục web app.
4. Bổ sung các dashboard secret cần thiết vào `.env.example` ở root, với giá trị placeholder an toàn; không tạo hoặc ghi đè `.env.local` thật có thể chứa secret của anh.
5. Cập nhật README để hướng dẫn duy nhất `npm run dev` và vị trí env đúng.

## Kiểm tra

- `npm install` cập nhật lockfile sau khi thêm dependency.
- `npm run lint`, `npm run typecheck`, và `npm run build`.

## Cần phê duyệt

Anh duyệt kế hoạch này, em sẽ thêm lệnh `npm run dev` chạy cả hai ứng dụng và các env template.
