<script setup lang="ts">
import SqlPreview from '../components/SqlPreview.vue'

const sqlAuth = [
  '-- Xác thực (minh hoạ cho SQL Server)',
  '-- 1) Tạo login (SQL Authentication)',
  "-- CREATE LOGIN ql_user WITH PASSWORD = 'StrongPassword#123';",
  '-- 2) Tạo user trong database',
  '-- USE ql_dat_phong;',
  "-- CREATE USER ql_user FOR LOGIN ql_user;",
  '',
  '-- Lưu ý: project backend của bạn đang xác thực ở tầng API (Spring).',
  '-- Nếu cần demo đăng nhập trên web, backend phải cung cấp endpoint /auth (JWT/session).',
].join('\n')

const sqlRole = [
  '-- Phân quyền (Role/Grant) - minh hoạ',
  '-- USE ql_dat_phong;',
  '-- CREATE ROLE role_le_tan;',
  '-- CREATE ROLE role_quan_ly;',
  '',
  '-- Ví dụ: lễ tân được xem/ghi đặt phòng, không được DROP',
  '-- GRANT SELECT, INSERT, UPDATE ON dbo.dat_phong TO role_le_tan;',
  '-- GRANT SELECT, INSERT, UPDATE ON dbo.chi_tiet_dat_phong TO role_le_tan;',
  '-- GRANT SELECT ON dbo.phong TO role_le_tan;',
  '',
  '-- Gán user vào role',
  '-- EXEC sp_addrolemember "role_le_tan", "ql_user";',
].join('\n')

const sqlImportExport = [
  '-- Import/Export (minh hoạ)',
  '-- Export (thường làm qua tooling/SSMS/SQLCMD/BCP):',
  "-- bcp ql_dat_phong.dbo.khach_hang out C:\\backup\\khach_hang.csv -c -t, -T -S localhost",
  '',
  '-- Import (BULK INSERT):',
  "-- BULK INSERT dbo.khach_hang",
  "-- FROM 'C:\\backup\\khach_hang.csv'",
  '-- WITH (FIRSTROW = 2, FIELDTERMINATOR = ",", ROWTERMINATOR = "\n", CODEPAGE = "65001");',
].join('\n')

const sqlBackupRestore = [
  '-- Backup/Restore (minh hoạ)',
  "-- BACKUP DATABASE ql_dat_phong TO DISK = 'C:\\backup\\ql_dat_phong.bak' WITH INIT, STATS = 5;",
  '',
  '-- Restore (cần quyền sysadmin/dbcreator + database không đang sử dụng):',
  "-- RESTORE DATABASE ql_dat_phong FROM DISK = 'C:\\backup\\ql_dat_phong.bak' WITH REPLACE, STATS = 5;",
].join('\n')
</script>

<template>
  <div class="page-card">
    <h2 style="margin: 0 0 8px">An toàn thông tin</h2>
    <div class="muted" style="margin-bottom: 12px">
      Mục này trình bày trực tiếp các câu lệnh minh hoạ về xác thực, phân quyền, import/export, backup/restore.
    </div>

    <el-tabs type="border-card">
      <el-tab-pane label="Xác thực">
        <SqlPreview title="SQL" :sql="sqlAuth" />
      </el-tab-pane>

      <el-tab-pane label="Phân quyền">
        <SqlPreview title="SQL" :sql="sqlRole" />
      </el-tab-pane>

      <el-tab-pane label="Import / Export">
        <SqlPreview title="SQL" :sql="sqlImportExport" />
      </el-tab-pane>

      <el-tab-pane label="Backup / Restore">
        <SqlPreview title="SQL" :sql="sqlBackupRestore" />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
