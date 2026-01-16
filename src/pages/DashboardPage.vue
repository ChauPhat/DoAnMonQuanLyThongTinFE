<script setup lang="ts">
</script>

<template>
  <div class="page-card">
    <h2 style="margin: 0 0 8px">Giao diện báo cáo CSDL (Vue 3)</h2>
    <div class="muted" style="margin-bottom: 12px">
      CRUD + demo Stored Procedure/Function/Trigger/Cursor theo hướng dự án thực tế.
    </div>

    <el-alert
      title="Gợi ý test nhanh"
      type="info"
      show-icon
      :closable="false"
      description="Vào 'Demo Stored Procedure' để gọi các procedure: đặt phòng / thêm chi tiết / trả phòng / phòng trống / doanh thu. Sau đó quay lại màn Phòng để thấy trạng thái thay đổi (nếu DB có trigger cập nhật trạng thái)."
    />
  </div>
</template>
