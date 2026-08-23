import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';
import { AUTH_ROUTES } from './features/auth/auth.routes';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  ...AUTH_ROUTES,
  { path: 'home', canActivate: [authGuard], loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent) },
  { path: 'profile', canActivate: [authGuard], loadComponent: () => import('./features/profile/profile.component').then((m) => m.ProfileComponent) },
  { path: 'catalog', canActivate: [authGuard], loadChildren: () => import('./features/catalog/catalog.routes').then((m) => m.CATALOG_ROUTES) },
  { path: 'wishlist', canActivate: [authGuard], loadComponent: () => import('./features/wishlist/wishlist.component').then((m) => m.WishlistComponent) },
  { path: 'cart', canActivate: [authGuard], loadComponent: () => import('./features/cart/cart.component').then((m) => m.CartComponent) },
  { path: 'checkout', canActivate: [authGuard], loadComponent: () => import('./features/checkout/checkout.component').then((m) => m.CheckoutComponent) },
  { path: 'orders', canActivate: [authGuard], loadComponent: () => import('./features/orders/orders.component').then((m) => m.OrdersComponent) },
  { path: 'notifications', canActivate: [authGuard], loadComponent: () => import('./features/notifications/notifications.component').then((m) => m.NotificationsComponent) },
  { path: 'reports', canActivate: [authGuard], loadComponent: () => import('./features/reports/reports.component').then((m) => m.ReportsComponent) },
  { path: 'help', canActivate: [authGuard], loadComponent: () => import('./features/help/help.component').then((m) => m.HelpComponent) },
  {
    path: 'admin',
    canActivate: [adminGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/dashboard.component').then((m) => m.AdminDashboardComponent) },
      { path: 'products', loadComponent: () => import('./features/admin/products/products.component').then((m) => m.AdminProductsComponent) },
      { path: 'categories', loadComponent: () => import('./features/admin/categories/categories.component').then((m) => m.AdminCategoriesComponent) },
      { path: 'orders', loadComponent: () => import('./features/admin/orders/orders.component').then((m) => m.AdminOrdersComponent) },
      { path: 'customers', loadComponent: () => import('./features/admin/customers/customers.component').then((m) => m.AdminCustomersComponent) },
      { path: 'reports', loadComponent: () => import('./features/admin/reports/reports.component').then((m) => m.AdminReportsComponent) },
      { path: 'cms', loadComponent: () => import('./features/admin/cms/cms.component').then((m) => m.AdminCmsComponent) },
      { path: 'dynamic', loadComponent: () => import('./features/admin/dynamic/dynamic.component').then((m) => m.AdminDynamicComponent) },
      { path: 'backup', loadComponent: () => import('./features/admin/backup/backup.component').then((m) => m.AdminBackupComponent) },
      { path: 'help', loadComponent: () => import('./features/admin/help/help.component').then((m) => m.AdminHelpComponent) },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
