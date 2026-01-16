export type KhachHangDto = {
  maKh: number
  hoTen: string
  cccd?: string | null
  dienThoai?: string | null
  email?: string | null
  diaChi?: string | null
}

export type LoaiPhongDto = {
  maLoaiPhong: number
  tenLoaiPhong: string
  sucChua: number
  giaCoBan: number
  moTa?: string | null
}

export type PhongDto = {
  maPhong: number
  maLoaiPhong?: number | null
  tenPhong?: string | null
  tang?: number | null
  trangThai?: string | null
}

export type DatPhongRequest = {
  maKh: number
  maNv: number
  ngayNhan: string // LocalDateTime string: yyyy-MM-ddTHH:mm:ss
  ngayTra: string
}

export type ThemChiTietDatPhongRequest = {
  maDatPhong: number
  maPhong: number
  donGia: number
}

export type TraPhongRequest = {
  maDatPhong: number
}

export type DoanhThuTheoThangRequest = {
  thang: number
  nam: number
}
