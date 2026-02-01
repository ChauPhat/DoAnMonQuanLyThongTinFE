use ql_dat_phong;
go

create or alter view dbo.v_export_khach_hang
as
select MaKH, HoTen, CCCD, DienThoai, Email, DiaChi
from dbo.khach_hang;
go

create or alter view dbo.v_export_phong
as
select p.MaPhong, p.MaLoaiPhong, p.TenPhong, p.Tang, p.TrangThai
from dbo.phong p;
go

if object_id('dbo.stg_khach_hang', 'U') is not null drop table dbo.stg_khach_hang;
go
create table dbo.stg_khach_hang (
    HoTen nvarchar(100) not null,
    CCCD varchar(20) null,
    DienThoai varchar(15) null,
    Email varchar(100) null,
    DiaChi nvarchar(255) null
);
go

create or alter procedure dbo.sp_import_khach_hang_from_staging
as
begin
    set nocount on;

    insert into dbo.khach_hang(HoTen, CCCD, DienThoai, Email, DiaChi)
    select s.HoTen, s.CCCD, s.DienThoai, s.Email, s.DiaChi
    from dbo.stg_khach_hang s
    where not exists (
        select 1
        from dbo.khach_hang k
        where (s.CCCD is not null and k.CCCD = s.CCCD)
           or (s.CCCD is null and k.HoTen = s.HoTen and isnull(k.DienThoai,'') = isnull(s.DienThoai,''))
    );
end;
go
