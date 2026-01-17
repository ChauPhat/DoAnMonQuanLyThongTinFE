import { createRouter, createWebHistory } from 'vue-router'

import DashboardPage from '../pages/DashboardPage.vue'
import DbFeaturesPage from '../pages/DbFeaturesPage.vue'
import KhachHangPage from '../pages/KhachHangPage.vue'
import LoaiPhongPage from '../pages/LoaiPhongPage.vue'
import NhanVienPage from '../pages/NhanVienPage.vue'
import PhongPage from '../pages/PhongPage.vue'
import ProcedureDemoPage from '../pages/ProcedureDemoPage.vue'
import NotFoundPage from '../pages/NotFoundPage.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'dashboard', component: DashboardPage },
    { path: '/db-features', name: 'db-features', component: DbFeaturesPage },
    { path: '/khach-hang', name: 'khach-hang', component: KhachHangPage },
    { path: '/loai-phong', name: 'loai-phong', component: LoaiPhongPage },
    { path: '/nhan-vien', name: 'nhan-vien', component: NhanVienPage },
    { path: '/phong', name: 'phong', component: PhongPage },
    { path: '/procedure-demo', name: 'procedure-demo', component: ProcedureDemoPage },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundPage },
  ],
})
