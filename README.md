# DoAnMonQuanLyThongTinFE

Frontend Vue 3 (Vite + TypeScript) cho đồ án/báo cáo CSDL (QL Đặt Phòng).

## Chạy dự án

1) Cấu hình API base URL

- Copy `.env.example` → `.env`
- Sửa `VITE_API_BASE_URL` (mặc định: `http://localhost:8080`)

2) Cài package + chạy

- `npm install`
- `npm run dev`

## Màn hình đã có

- CRUD: Khách Hàng, Loại Phòng, Phòng
- Demo Stored Procedure: đặt phòng / thêm chi tiết / trả phòng / phòng trống / doanh thu
- Database Features: trang trình bày Procedure/Trigger/Function/Cursor theo kiểu báo cáo

## Mapping API

### CRUD

- Khách Hàng: `/api/khach-hang`
- Loại Phòng: `/api/loai-phong`
- Phòng: `/api/phong`

### Stored Procedure demo

- Đặt phòng: `POST /api/proc/dat-phong`
- Thêm chi tiết đặt phòng: `POST /api/proc/them-chi-tiet`
- Trả phòng: `POST /api/proc/tra-phong`
- Phòng trống: `GET /api/proc/phong-trong`
- Doanh thu: `POST /api/proc/doanh-thu`
