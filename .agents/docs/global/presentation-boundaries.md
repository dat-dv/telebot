---
metadata:
  agent-artifact:
    id: docs-global-presentation-boundaries
    type: documentation
    depends_on:
      - .agents/knowledge/global/presentation-boundaries.md
---

# Ranh giới presentation của web

Route và consumer cũ tiếp tục dùng adapter trong `modules/<feature>/view` để tránh vỡ import. Phần triển khai giao diện được đặt tại `modules/<feature>/presentation/components`; panel, table, inline editor và dialog có nghiệp vụ phải thuộc feature tương ứng. Chỉ component không mang nghiệp vụ mới được đưa vào `shared/ui`.

Khi di chuyển component, bắt buộc giữ nguyên public export, route URL, query contract, table ID và localStorage key. Điều này đảm bảo người dùng không mất cấu hình cột hoặc độ rộng bảng, đồng thời tránh thay đổi hành vi API ngoài ý muốn.
