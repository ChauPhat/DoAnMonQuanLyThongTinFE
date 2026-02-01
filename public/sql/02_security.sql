use ql_dat_phong;
go

if not exists (select 1 from sys.database_principals where name = 'role_admin')
    create role role_admin;
go

if not exists (select 1 from sys.database_principals where name = 'role_staff')
    create role role_staff;
go

if not exists (select 1 from sys.database_principals where name = 'role_report')
    create role role_report;
go

if not exists (select 1 from sys.server_principals where name = 'ql_admin')
    create login ql_admin with password = 'Admin@12345', check_policy = off;
go

if not exists (select 1 from sys.server_principals where name = 'ql_staff')
    create login ql_staff with password = 'Staff@12345', check_policy = off;
go

if not exists (select 1 from sys.server_principals where name = 'ql_report')
    create login ql_report with password = 'Report@12345', check_policy = off;
go

if not exists (select 1 from sys.database_principals where name = 'ql_admin')
    create user ql_admin for login ql_admin;
go

if not exists (select 1 from sys.database_principals where name = 'ql_staff')
    create user ql_staff for login ql_staff;
go

if not exists (select 1 from sys.database_principals where name = 'ql_report')
    create user ql_report for login ql_report;
go

exec sp_addrolemember 'role_admin', 'ql_admin';
exec sp_addrolemember 'role_staff', 'ql_staff';
exec sp_addrolemember 'role_report', 'ql_report';
go

grant select, insert, update, delete on dbo.khach_hang to role_admin;
grant select, insert, update, delete on dbo.loai_phong to role_admin;
grant select, insert, update, delete on dbo.phong to role_admin;
grant select, insert, update, delete on dbo.nhan_vien to role_admin;
grant select, insert, update, delete on dbo.dat_phong to role_admin;
grant select, insert, update, delete on dbo.chi_tiet_dat_phong to role_admin;
grant select, insert, update, delete on dbo.thanh_toan to role_admin;

grant execute on schema::dbo to role_admin;
go

grant select, insert, update, delete on dbo.khach_hang to role_staff;
grant select on dbo.loai_phong to role_staff;
grant select on dbo.phong to role_staff;
grant select, insert, update on dbo.dat_phong to role_staff;
grant select, insert, update on dbo.chi_tiet_dat_phong to role_staff;
grant select, insert, update on dbo.thanh_toan to role_staff;

deny insert, update, delete on dbo.nhan_vien to role_staff;
grant select on dbo.nhan_vien to role_staff;

grant execute on dbo.sp_datPhongNhanh to role_staff;
grant execute on dbo.sp_nhanPhong to role_staff;
grant execute on dbo.sp_traPhong to role_staff;
grant execute on dbo.sp_phongTrong to role_staff;
grant execute on dbo.sp_phongDaDatTheoKhoangThoiGian to role_staff;
grant execute on dbo.sp_tinhDoanhThuTheoThang to role_staff;
grant execute on dbo.sp_baoCaoDoanhThu_cursor_report to role_staff;
grant execute on dbo.sp_danhSachDatPhong to role_staff;
grant execute on dbo.sp_thongTinDatPhong to role_staff;
go

grant select on dbo.khach_hang to role_report;
grant select on dbo.loai_phong to role_report;
grant select on dbo.phong to role_report;
grant select on dbo.dat_phong to role_report;
grant select on dbo.chi_tiet_dat_phong to role_report;
grant select on dbo.thanh_toan to role_report;

deny insert, update, delete on dbo.khach_hang to role_report;
deny insert, update, delete on dbo.loai_phong to role_report;
deny insert, update, delete on dbo.phong to role_report;
deny insert, update, delete on dbo.nhan_vien to role_report;
deny insert, update, delete on dbo.dat_phong to role_report;
deny insert, update, delete on dbo.chi_tiet_dat_phong to role_report;
deny insert, update, delete on dbo.thanh_toan to role_report;
go
