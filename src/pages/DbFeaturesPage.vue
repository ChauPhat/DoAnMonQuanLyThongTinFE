<script setup lang="ts">
</script>

<template>
  <div class="page-card">
    <h2 style="margin: 0 0 12px">Database Features (báo cáo)</h2>

    <el-timeline>
      <el-timeline-item timestamp="1) Stored Procedure" placement="top">
        <div>
          Các thao tác nghiệp vụ được đóng gói dưới dạng procedure:
          <ul style="margin: 8px 0 0; padding-left: 18px">
            <li><b>sp_datPhong</b>: tạo đơn đặt phòng</li>
            <li><b>sp_themChiTietDatPhong</b>: thêm chi tiết + tính số ngày thuê</li>
            <li><b>sp_traPhong</b>: trả phòng</li>
            <li><b>sp_phongTrong</b>: lấy danh sách phòng trống</li>
            <li><b>sp_phongDaDat</b>: lấy danh sách phòng đã được đặt trong khoảng thời gian</li>
            <li><b>sp_tinhDoanhThuTheoThang</b>: tổng doanh thu theo tháng/năm</li>
          </ul>
          <div style="margin-top: 8px">
            <el-button type="primary" @click="$router.push('/procedure-demo')">Mở demo procedure</el-button>
          </div>
        </div>
      </el-timeline-item>

      <el-timeline-item timestamp="2) Trigger" placement="top">
        <div>
          Trigger tự động xử lý dữ liệu khi insert/update:
          <ul style="margin: 8px 0 0; padding-left: 18px">
            <li><b>trg_tinhThanhTien</b> (chi_tiet_dat_phong): tự tính <code>ThanhTien = DonGia * SoNgay</code></li>
            <li><b>trg_capNhatTrangThaiPhong</b> (dat_phong): khi cập nhật <code>TrangThai = N'đã nhận phòng'</code> → cập nhật phòng thành <code>N'đang thuê'</code></li>
          </ul>
          <div class="muted" style="margin-top: 6px">
            FE sẽ thể hiện bằng cách: thao tác qua màn Demo Stored Procedure → reload danh sách Phòng để quan sát trạng thái thay đổi.
          </div>
        </div>
      </el-timeline-item>

      <el-timeline-item timestamp="3) Function" placement="top">
        <div>
          Function trả về giá trị:
          <ul style="margin: 8px 0 0; padding-left: 18px">
            <li><b>fn_tinhSoNgayThue</b>: <code>datediff(day, NgayNhan, NgayTra)</code></li>
          </ul>
          FE thể hiện gián tiếp qua thao tác <b>sp_themChiTietDatPhong</b> (procedure này gọi function để tính <code>SoNgay</code>).
        </div>
      </el-timeline-item>

      <el-timeline-item timestamp="4) Cursor" placement="top">
        <div>
          Cursor dùng để duyệt từng dòng và xử lý:
          <ul style="margin: 8px 0 0; padding-left: 18px">
            <li><b>sp_baoCaoDoanhThu_cursor</b>: dùng cursor duyệt từng đơn đặt phòng và <code>PRINT</code> tổng tiền</li>
          </ul>
          <div class="muted" style="margin-top: 6px">
            Hiện cursor đang <code>PRINT</code> nên FE không đọc được. Nếu bạn thêm API trả về danh sách report (thay vì PRINT), mình sẽ làm thêm 1 tab “Cursor report” cho chuẩn bài báo cáo.
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>
