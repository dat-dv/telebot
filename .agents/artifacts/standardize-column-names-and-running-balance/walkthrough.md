# Walkthrough: Sửa lỗi Tooltip Biểu đồ bị trong suốt & đè chữ

Em đã khắc phục triệt để hiện tượng tooltip biểu đồ bị bán trong suốt (transparent) khiến các đường nét và chữ của biểu đồ bị xuyên thấu, đè lên nhau.

---

## 1. Nguyên nhân & Giải pháp xử lý

* **Nguyên nhân**:
  * Các thẻ Custom Tooltip trước đó sử dụng background bán trong suốt `bg-white/95 backdrop-blur-xs` và thiếu thiết lập `zIndex / wrapperStyle` cố định trên component `<Tooltip />` của Recharts.
  * Khi di chuột qua các cột biểu đồ và đường lưới (grid lines), các nét vẽ bên dưới bị xuyên thấu qua nền tooltip, gây rối mắt và làm chữ bị đè lên nhau.
* **Giải pháp khắc phục**:
  1. **Background đặc 100%**: Đổi sang `bg-white dark:bg-slate-900` với đổ bóng nổi khối `shadow-xl`, viền `border border-slate-200 dark:border-slate-800` và đệm khoảng cách rõ ràng.
  2. **Layer hiển thị cao nhất**: Bổ sung `wrapperStyle={{ outline: 'none', zIndex: 1000 }}` trực tiếp vào `<Tooltip />` của Recharts để đảm bảo tooltip luôn nổi lên trên cùng (không bị SVG elements hoặc thanh cuộn đè).
  3. **Áp dụng đồng bộ**: Áp dụng trên cả `CashflowTrendChart` (Biểu đồ Dòng tiền & Số dư ví) và `CategoryDonutChart` (Biểu đồ Cơ cấu chi tiêu).

---

## 2. Kết quả kiểm tra
* **Typecheck & Linter**: `npm run typecheck` & `npm run lint` $\rightarrow$ **PASS**.
* **Next.js Production Build**: `next build` $\rightarrow$ **Compiled successfully**.
