<script setup lang="ts">
const features = [
  {
    title: 'Màn hình tổng quan',
    items: ['Dashboard: giới thiệu/định hướng demo', 'Database Features: trang báo cáo tổng hợp + link sang demo'],
  },
  {
    title: 'Tài liệu SQL',
    items: ['SQL Script: xem toàn bộ file /sql/ql_dat_phong.sql trực tiếp trên web'],
  },
  {
    title: 'Quản lý Khách hàng',
    items: ['Xem danh sách (phân trang)', 'Thêm / sửa / xóa khách hàng', 'Tải lại danh sách'],
  },
  {
    title: 'Quản lý Nhân viên',
    items: ['Xem danh sách (phân trang)', 'Thêm / sửa / xóa nhân viên', 'Tải lại danh sách'],
  },
  {
    title: 'Quản lý Loại phòng',
    items: ['Xem danh sách (phân trang)', 'Thêm / sửa / xóa loại phòng (gồm sức chứa/giá cơ bản/mô tả)', 'Tải lại danh sách'],
  },
  {
    title: 'Quản lý Phòng',
    items: ['Xem danh sách (phân trang)', 'Thêm / sửa / xóa phòng (gồm trạng thái: trống/đang thuê/bảo trì)', 'Tải lại danh sách'],
  },
  {
    title: 'Demo Stored Procedure (nghiệp vụ)',
    items: [
      'Gọi procedure đặt phòng nhanh: dbo.sp_datPhongNhanh (tạo dat_phong + chi_tiet_dat_phong)',
      'Gọi procedure nhận phòng / trả phòng: dbo.sp_nhanPhong, dbo.sp_traPhong',
      'Gọi procedure danh sách phòng trống / phòng đã đặt: dbo.sp_phongTrong, dbo.sp_phongDaDatTheoKhoangThoiGian',
      'Gọi procedure doanh thu / cursor: dbo.sp_tinhDoanhThuTheoThang, dbo.sp_baoCaoDoanhThu_cursor_report',
      'Hiển thị đúng code Procedure/Trigger/Function (trích từ /sql/ql_dat_phong.sql) ngay tại tab demo',
    ],
  },
  {
    title: 'Báo cáo',
    items: [
      'Report (5): phòng trống',
      'Report (5): phòng đã đặt theo khoảng',
      'Report (5): danh sách đặt phòng',
      'Report (5): doanh thu theo tháng',
      'Report (5): doanh thu dùng cursor',
    ],
  },
  {
    title: 'An toàn thông tin',
    items: [
      'Trang trình bày câu lệnh minh hoạ (không có đăng nhập/phân quyền thực thi trên web)',
      'Minh hoạ: tạo login/user, role/grant',
      'Minh hoạ: import/export (BCP/BULK INSERT)',
      'Minh hoạ: backup/restore',
    ],
  },
]
</script>

<template>
  <div class="page-card">
    <h2 style="margin: 0 0 10px">Các chức năng của hệ thống (mô tả)</h2>
    <div class="muted" style="margin-bottom: 16px">
      Trang này dùng để trình bày phần "từ phân tích" theo yêu cầu: chỉ mô tả, không cần demo.
    </div>

    <el-row :gutter="12">
      <el-col v-for="f in features" :key="f.title" :xs="24" :sm="24" :md="12" :lg="8">
        <el-card shadow="never" style="margin-bottom: 12px">
          <template #header>
            <div style="font-weight: 600">{{ f.title }}</div>
          </template>
          <ul style="margin: 0; padding-left: 18px">
            <li v-for="it in f.items" :key="it">{{ it }}</li>
          </ul>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
