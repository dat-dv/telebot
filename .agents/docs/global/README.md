---
metadata:
  agent-artifact:
    id: docs-global
    type: documentation
    depends_on:
      - .agents/knowledge/global/README.md
      - .agents/knowledge/global/type-safety.md
      - .agents/knowledge/global/route-constants.md
      - .agents/knowledge/global/monorepo-architecture.md
      - .agents/knowledge/global/dashboard-session.md
      - .agents/knowledge/global/voice-transcription.md
---

# Global Developer Guides

This directory contains human-facing operational guides for system-wide architecture, setup, and global guidelines mirroring [`.agents/knowledge/global/`](../../knowledge/global/README.md).

## Danh Mục Hướng Dẫn Toàn Cục

- [Kiến Trúc Monorepo](monorepo-architecture.md): Cấu trúc npm workspaces, lệnh chạy và phạm vi biến môi trường.
- [Quy Chuẩn Type Safety & Zero-Any](type-safety.md): Hướng dẫn chi tiết về chính sách cấm `any`, mẫu code thay thế chuẩn và cơ chế hook kiểm tra tự động (Ánh xạ: [`type-safety.md`](../../knowledge/global/type-safety.md)).
- [Quy Chuẩn Quản Lý Route & API Constants](route-constants.md): Hướng dẫn định nghĩa và sử dụng `APP_ROUTES` và `API_ROUTES` tập trung, cấm tuyệt đối hardcode đường dẫn (Ánh xạ: [`route-constants.md`](../../knowledge/global/route-constants.md)).
- [Nhận Diện Voice Cục Bộ](voice-transcription.md): Cấu hình Whisper, luồng xác nhận transcript và xử lý sự cố.
- [Phiên Dashboard và các trang web](dashboard-session.md): One-time exchange token, thời hạn phiên, phân quyền danh bạ và kiểm tra UI.
- [Định hướng UI web](web-ui-direction.md): Quy chuẩn giao diện dashboard dùng chung, bảng dữ liệu và khả năng truy cập.

## Checklist áp dụng Base Agents cho dự án mới

Base Agents là framework dùng chung, không phải mẫu ứng dụng. Dự án sử dụng nó vẫn tự sở hữu nghiệp vụ, kiến trúc ứng dụng, module, dữ liệu và quy trình kiểm thử riêng.

1. Cài đặt Base Agents, sau đó chỉ kích hoạt plugin thật sự phù hợp với stack và nhu cầu dự án.
2. Điền thông tin thực tế vào `project-overview`: mục tiêu, người dùng, thuật ngữ domain, tích hợp và ranh giới kiến trúc.
3. Với mỗi feature module do dự án tạo, tạo cặp tài liệu tương ứng: knowledge tiếng Anh cho agent và hướng dẫn tiếng Việt cho đội phát triển.
4. Giao việc đúng workflow: `research` cho khảo sát, `investigate` cho chẩn đoán, và `implement` cho thay đổi đã được duyệt.
5. Sau khi thay đổi Base Agents, chạy `npm run agent-system:validate`, `npm run agent-system:test` và `npm run agent-system:typecheck`. Với thay đổi ứng dụng, chạy thêm các kiểm tra riêng của dự án.
