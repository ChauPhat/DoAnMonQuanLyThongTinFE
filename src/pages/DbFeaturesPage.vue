<script setup lang="ts">
import SqlPreview from '../components/SqlPreview.vue'

const sqlOverview = [
  '-- SQL minh hoạ (hiển thị trực tiếp trên website)',
  '-- Stored Procedure (5 – nghiệp vụ chính):',
  "EXEC dbo.sp_datPhongNhanh @MaKH = ?, @MaNV = ?, @NgayNhan = ?, @NgayTra = ?, @DanhSachMaPhong = N'1,2,3', @MaDatPhong = @out OUTPUT;",
  'EXEC dbo.sp_nhanPhong @MaDatPhong = ?;',
  'EXEC dbo.sp_traPhong @MaDatPhong = ?;',
  'EXEC dbo.sp_phongTrong;',
  'EXEC dbo.sp_phongDaDatTheoKhoangThoiGian @TuNgay = ?, @DenNgay = ?;',
  '',
  '-- Function (3):',
  'SELECT dbo.fn_tinhSoNgayThue(@NgayNhan, @NgayTra);',
  'SELECT dbo.fn_tinhTongTienDatPhong(@MaDatPhong);',
  'SELECT dbo.fn_isPhongTrongTheoKhoang(@MaPhong, @NgayNhan, @NgayTra);',
  '',
  '-- Cursor (2):',
  'EXEC dbo.sp_baoCaoDoanhThu_cursor;',
  'EXEC dbo.sp_baoCaoDoanhThu_cursor_report;',
].join('\n')
</script>

<template>
  <div class="page-card">
    <h2 style="margin: 0 0 12px">Database Features (báo cáo)</h2>

    <SqlPreview
      title="SQL (hiển thị trực tiếp trên web)"
      :sql="sqlOverview"
      note="Chi tiết + tham số động nằm trong màn Demo Stored Procedure"
    />

    <div style="margin: 8px 0 14px">
      <el-button @click="$router.push('/sql-script')">Mở toàn bộ file SQL</el-button>
    </div>

    <el-timeline>
      <el-timeline-item timestamp="1) Stored Procedure" placement="top">
        <div>
          Các thao tác nghiệp vụ được đóng gói dưới dạng procedure:
          <ul style="margin: 8px 0 0; padding-left: 18px">
            <li><b>sp_datPhongNhanh</b>: tạo đơn đặt phòng + tự thêm chi tiết theo danh sách phòng</li>
            <li><b>sp_nhanPhong</b>: nhận phòng (check-in)</li>
            <li><b>sp_traPhong</b>: trả phòng</li>
            <li><b>sp_phongTrong</b>: lấy danh sách phòng trống</li>
            <li><b>sp_phongDaDatTheoKhoangThoiGian</b>: lấy danh sách phòng đã được đặt trong khoảng thời gian</li>
          </ul>
          <div class="muted" style="margin-top: 6px">
            Các procedure phục vụ báo cáo (doanh thu, danh sách đặt phòng, cursor) nằm trong menu <b>Report (5)</b>.
          </div>
          <div style="margin-top: 8px">
            <el-button type="primary" @click="$router.push('/procedure-demo')">Mở demo procedure</el-button>
            <el-button style="margin-left: 8px" @click="$router.push('/reports')">Mở report</el-button>
          </div>
        </div>
      </el-timeline-item>

      <el-timeline-item timestamp="2) Trigger" placement="top">
        <div>
          Trigger tự động xử lý dữ liệu khi insert/update:
          <ul style="margin: 8px 0 0; padding-left: 18px">
            <li><b>trg_tinhThanhTien</b> (chi_tiet_dat_phong): tự tính <code>ThanhTien = DonGia * SoNgay</code></li>
            <li><b>trg_capNhatTrangThaiPhong</b> (dat_phong): khi cập nhật <code>TrangThai = N'đã nhận phòng'</code> → cập nhật phòng thành <code>N'đang thuê'</code></li>
            <li><b>trg_capNhatSoNgayChiTiet</b> (dat_phong): khi đổi <code>NgayNhan/NgayTra</code> → cập nhật <code>SoNgay</code>, <code>ThanhTien</code> cho chi tiết</li>
            <li><b>trg_chanDatTrungPhong</b> (chi_tiet_dat_phong): chặn đặt trùng phòng theo khoảng thời gian (rollback)</li>
            <li><b>trg_setNgayThanhToan</b> (thanh_toan): tự set <code>NgayThanhToan</code> khi <code>TrangThai = N'Đã thanh toán'</code></li>
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
            <li><b>fn_tinhTongTienDatPhong</b>: tính tổng tiền theo <code>MaDatPhong</code> từ <code>chi_tiet_dat_phong</code></li>
            <li><b>fn_isPhongTrongTheoKhoang</b>: kiểm tra phòng trống theo khoảng (không bảo trì + không overlap đặt phòng)</li>
          </ul>
          FE thể hiện gián tiếp qua thao tác <b>sp_datPhongNhanh</b> (procedure này gọi function để tính <code>SoNgay</code>) và các màn demo/report liên quan.
        </div>
      </el-timeline-item>

      <el-timeline-item timestamp="4) Cursor" placement="top">
        <div>
          Cursor dùng để duyệt từng dòng và xử lý:
          <ul style="margin: 8px 0 0; padding-left: 18px">
            <li><b>sp_baoCaoDoanhThu_cursor</b>: dùng cursor duyệt từng đơn đặt phòng và <code>PRINT</code> tổng tiền</li>
            <li><b>sp_baoCaoDoanhThu_cursor_report</b>: dùng cursor và <b>trả result set</b> để website hiển thị (Report tab 5)</li>
          </ul>
          <div class="muted" style="margin-top: 6px">
            Backend đã expose report qua API <b>/api/proc/bao-cao-doanh-thu-cursor</b>, FE hiển thị trong màn Demo procedure.
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>
