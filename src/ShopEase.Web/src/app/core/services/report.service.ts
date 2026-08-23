import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { OrderService } from './order.service';
import { PaymentService } from './payment.service';
import { ProductService } from './product.service';
import { CartService } from './cart.service';
import { AuthService } from './auth.service';
import { OrderFilters, PaymentFilters } from '../models';
import { ReportData } from '../utils/export.utils';
import { formatCurrency, formatDate } from '../utils/format.utils';

export interface ProductInventoryFilters {
  categoryId?: number | string;
  stockStatus?: 'instock' | 'outofstock' | '';
  minPrice?: number | string;
  maxPrice?: number | string;
}
export interface CustomerListFilters {
  userStatus?: 'active' | 'inactive' | '';
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private orderSvc = inject(OrderService);
  private paymentSvc = inject(PaymentService);
  private productSvc = inject(ProductService);
  private cartSvc = inject(CartService);
  private authSvc = inject(AuthService);

  generateMyOrdersReport(userId: number, filters: OrderFilters = {}): Observable<ReportData> {
    return this.orderSvc.getOrdersByUserId(userId).pipe(
      map((all) => {
        const orders = this.orderSvc.filterOrders(all, filters);
        return {
          title: 'My Orders Report',
          headers: ['Order #', 'Date', 'Items', 'Total', 'Status'],
          rows: orders.map((o) => [o.orderNumber, formatDate(o.createdAt), o.items.length, formatCurrency(o.total), o.status]),
          summary: { totalOrders: orders.length, totalSpent: orders.reduce((s, o) => s + o.total, 0) },
        };
      }),
    );
  }

  generateMyPaymentsReport(userId: number, filters: PaymentFilters = {}): Observable<ReportData> {
    return this.paymentSvc.getPaymentsByUserId(userId).pipe(
      map((all) => {
        const payments = this.paymentSvc.filterPayments(all, filters);
        return {
          title: 'My Payment History',
          headers: ['Transaction ID', 'Date', 'Method', 'Amount', 'Status'],
          rows: payments.map((p) => [p.transactionId || '—', formatDate(p.createdAt), p.method, formatCurrency(p.amount), p.status]),
          summary: { totalPayments: payments.length, totalPaid: payments.filter((p) => p.status === 'Completed').reduce((s, p) => s + p.amount, 0) },
        };
      }),
    );
  }

  generateMyCartReport(userId: number): Observable<ReportData> {
    return this.cartSvc.getCartSummary(userId).pipe(
      map((summary) => ({
        title: 'My Cart Summary',
        headers: ['Product', 'Brand', 'Price', 'Qty', 'Subtotal'],
        rows: summary.items.map((item) => [item.name, item.brand, formatCurrency(item.price), item.quantity, formatCurrency(item.price * item.quantity)]),
        summary: { itemCount: summary.itemCount, subtotal: summary.subtotal, tax: summary.tax, shipping: summary.shipping, total: summary.total },
      })),
    );
  }

  generateSalesSummaryReport(filters: OrderFilters = {}): Observable<ReportData> {
    return this.orderSvc.getAllOrders().pipe(
      map((all) => {
        const orders = this.orderSvc.filterOrders(all, filters);
        const completed = orders.filter((o) => o.status !== 'Cancelled');
        const productSales: Record<string, { qty: number; revenue: number }> = {};
        completed.forEach((o) => o.items.forEach((item) => {
          if (!productSales[item.name]) productSales[item.name] = { qty: 0, revenue: 0 };
          productSales[item.name].qty += item.quantity;
          productSales[item.name].revenue += item.subtotal;
        }));
        const topProducts = Object.entries(productSales).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 5);
        return {
          title: 'Sales Summary Report',
          headers: ['Product', 'Units Sold', 'Revenue'],
          rows: topProducts.map(([name, data]) => [name, data.qty, formatCurrency(data.revenue)]),
          summary: {
            totalOrders: completed.length,
            totalRevenue: completed.reduce((s, o) => s + o.total, 0),
            avgOrderValue: completed.length > 0 ? completed.reduce((s, o) => s + o.total, 0) / completed.length : 0,
            cancelledOrders: orders.filter((o) => o.status === 'Cancelled').length,
          },
        };
      }),
    );
  }

  generateAllOrdersReport(filters: OrderFilters = {}): Observable<ReportData> {
    return forkJoin([this.orderSvc.getAllOrders(), this.authSvc.getAllCustomers()]).pipe(
      map(([all, customers]) => {
        const orders = this.orderSvc.filterOrders(all, filters);
        return {
          title: 'All Orders Report',
          headers: ['Order #', 'Customer', 'Date', 'Items', 'Total', 'Status'],
          rows: orders.map((o) => {
            const user = customers.find((c) => c.id === o.userId);
            return [o.orderNumber, user?.name || `User #${o.userId}`, formatDate(o.createdAt), o.items.length, formatCurrency(o.total), o.status];
          }),
          summary: { totalOrders: orders.length, totalRevenue: orders.filter((o) => o.status !== 'Cancelled').reduce((s, o) => s + o.total, 0) },
        };
      }),
    );
  }

  generateProductInventoryReport(filters: ProductInventoryFilters = {}): Observable<ReportData> {
    return forkJoin([this.productSvc.getAllProducts(), this.productSvc.getAllCategories()]).pipe(
      map(([all, categories]) => {
        let products = all;
        if (filters.categoryId) products = products.filter((p) => p.categoryId === +filters.categoryId!);
        if (filters.stockStatus === 'instock') products = products.filter((p) => p.stock > 0);
        else if (filters.stockStatus === 'outofstock') products = products.filter((p) => p.stock === 0);
        if (filters.minPrice !== undefined && filters.minPrice !== '') products = products.filter((p) => p.price >= parseFloat(String(filters.minPrice)));
        if (filters.maxPrice !== undefined && filters.maxPrice !== '') products = products.filter((p) => p.price <= parseFloat(String(filters.maxPrice)));
        return {
          title: 'Product Inventory Report',
          headers: ['SKU', 'Product', 'Brand', 'Category', 'Price', 'Stock'],
          rows: products.map((p) => [p.sku, p.name, p.brand, categories.find((c) => c.id === p.categoryId)?.name || '—', formatCurrency(p.price), p.stock]),
          summary: { totalProducts: products.length, outOfStock: products.filter((p) => p.stock === 0).length, totalValue: products.reduce((s, p) => s + p.price * p.stock, 0) },
        };
      }),
    );
  }

  generateCustomerListReport(filters: CustomerListFilters = {}): Observable<ReportData> {
    return this.authSvc.getAllCustomers().pipe(
      map((all) => {
        let customers = all;
        if (filters.userStatus === 'active') customers = customers.filter((u) => u.isActive);
        else if (filters.userStatus === 'inactive') customers = customers.filter((u) => !u.isActive);
        return {
          title: 'Customer List Report',
          headers: ['Name', 'Email', 'Phone', 'Addresses', 'Status', 'Joined'],
          rows: customers.map((u) => [u.name, u.email, u.phone, u.addresses.length, u.isActive ? 'Active' : 'Inactive', formatDate(u.createdAt)]),
          summary: { totalCustomers: customers.length, activeCount: customers.filter((u) => u.isActive).length, inactiveCount: customers.filter((u) => !u.isActive).length },
        };
      }),
    );
  }

  generatePaymentTransactionsReport(filters: PaymentFilters = {}): Observable<ReportData> {
    return forkJoin([this.paymentSvc.getAllPayments(), this.authSvc.getAllCustomers()]).pipe(
      map(([all, customers]) => {
        const payments = this.paymentSvc.filterPayments(all, filters);
        return {
          title: 'Payment Transactions Report',
          headers: ['Txn ID', 'Date', 'Customer', 'Method', 'Amount', 'Status'],
          rows: payments.map((p) => {
            const user = customers.find((c) => c.id === p.userId);
            return [p.transactionId || '—', formatDate(p.createdAt), user?.name || `User #${p.userId}`, p.method, formatCurrency(p.amount), p.status];
          }),
          summary: { totalTransactions: payments.length, completed: payments.filter((p) => p.status === 'Completed').reduce((s, p) => s + p.amount, 0), failed: payments.filter((p) => p.status === 'Failed').length },
        };
      }),
    );
  }
}
