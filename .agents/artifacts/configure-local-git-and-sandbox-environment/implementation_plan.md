# Cấu hình Git Local và Môi trường Thực thi trong Sandbox

Cấu hình thông tin Git user trực tiếp trong `.git/config` của repository để loại bỏ phụ thuộc vào `~/.gitconfig` toàn cục và đảm bảo các lệnh Git chạy mượt mà trong Sandbox.

## Đề xuất thực hiện

### 1. Cấu hình thông tin tác giả vào `.git/config`
Thêm mục `[user]` vào file cấu hình `.git/config` của dự án:
- `name = datdoan`
- `email = datdoan.dev@gmail.com`

### 2. Chuẩn hóa quy chuẩn thực thi Git của Agent
- Sử dụng biến môi trường cô lập `GIT_CONFIG_GLOBAL=/dev/null` khi gọi lệnh Git trong sandbox để đảm bảo không bị chặn bởi quyền truy cập file `~/.gitconfig`.

## Kế hoạch kiểm tra
- Chạy thử nghiệm `git status`, `git log -n 1`, `git branch` để xác minh lệnh chạy ổn định 100%.
