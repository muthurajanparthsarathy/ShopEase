import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../core/services/report.service';
import { ProductService } from '../../../core/services/product.service';
import { OrderService } from '../../../core/services/order.service';
import { PaymentService } from '../../../core/services/payment.service';
import { ToastService } from '../../../core/services/toast.service';
import { ReportData, exportToCSV, exportToText } from '../../../core/utils/export.utils';
import { summaryEntries, isBadgeStatus, SummaryEntry } from '../../../shared/utils/report-summary.utils';
import { statusBadgeClass } from '../../../core/utils/format.utils';
import { paginate, PageResult } from '../../../core/utils/pagination.utils';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

type ReportKey = 'sales' | 'orders' | 'inventory' | 'payments' | 'customers';

interface ReportMeta {
  key: ReportKey;
  name: string;
  desc: string;
  icon: string;
  color: string;
  category: string;
}

const CATALOG: { name: string; icon: string; color: string; reports: ReportMeta[] }[] = [
  { name: 'Sales', icon: 'graph-up-arrow', color: 'success', reports: [
    { key: 'sales', name: 'Sales Summary', desc: 'Revenue, orders & top products by date range', icon: 'graph-up-arrow', color: 'success', category: 'Sales' },
    { key: 'orders', name: 'Order Details', desc: 'Complete order listing with status & amounts', icon: 'graph-up-arrow', color: 'success', category: 'Sales' },
  ] },
  { name: 'Inventory', icon: 'box-seam', color: 'warning', reports: [
    { key: 'inventory', name: 'Product Inventory', desc: 'Stock levels, pricing & category breakdown', icon: 'box-seam', color: 'warning', category: 'Inventory' },
  ] },
  { name: 'Payments', icon: 'credit-card-2-front', color: 'danger', reports: [
    { key: 'payments', name: 'Payment Transactions', desc: 'All payments with method, status & amounts', icon: 'credit-card-2-front', color: 'danger', category: 'Payments' },
  ] },
  { name: 'Customers', icon: 'people', color: 'info', reports: [
    { key: 'customers', name: 'Customer List', desc: 'Registered users, status & activity', icon: 'people', color: 'info', category: 'Customers' },
  ] },
];

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './reports.component.html',
})
export class AdminReportsComponent {
  private reportSvc = inject(ReportService);
  private productSvc = inject(ProductService);
  private orderSvc = inject(OrderService);
  private paymentSvc = inject(PaymentService);
  private toast = inject(ToastService);

  catalog = CATALOG;
  searchQuery = signal('');

  currentKey = signal<ReportKey | null>(null);
  currentMeta = signal<ReportMeta | null>(null);
  currentReport = signal<ReportData | null>(null);

  categories = signal<{ id: number; name: string }[]>([]);
  orderStatuses = signal<{ id: number; name: string }[]>([]);
  paymentStatuses = signal<{ id: number; name: string }[]>([]);
  paymentMethods = signal<{ id: number; name: string }[]>([]);

  filterFrom = signal('');
  filterTo = signal('');
  filterStatus = signal('');
  filterMethod = signal('');
  filterMin = signal('');
  filterMax = signal('');
  filterCategoryId = signal('');
  filterStockStatus = signal('');
  filterUserStatus = signal('');

  page = signal(1);
  perPage = signal(10);
  pagedRows = signal<PageResult<(string | number)[]>>({ items: [], currentPage: 1, totalPages: 1, totalItems: 0, perPage: 10, hasNext: false, hasPrev: false });

  statusBadgeClass = statusBadgeClass;
  isBadgeStatus = isBadgeStatus;

  constructor() {
    this.productSvc.getAllCategories().subscribe((c) => this.categories.set(c));
    this.orderSvc.getOrderStatuses().subscribe((s) => this.orderStatuses.set(s));
    this.paymentSvc.getPaymentStatuses().subscribe((s) => this.paymentStatuses.set(s));
    this.paymentSvc.getPaymentMethods().subscribe((m) => this.paymentMethods.set(m));
  }

  matchingReports(cat: { reports: ReportMeta[] }): ReportMeta[] {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return cat.reports;
    return cat.reports.filter((r) => r.name.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q));
  }

  anyMatch(): boolean {
    return this.catalog.some((c) => this.matchingReports(c).length > 0);
  }

  openReport(meta: ReportMeta): void {
    this.currentKey.set(meta.key);
    this.currentMeta.set(meta);
    this.currentReport.set(null);
    this.clearFilterFields();
  }

  backToCentre(): void {
    this.currentKey.set(null);
    this.currentMeta.set(null);
    this.currentReport.set(null);
  }

  private clearFilterFields(): void {
    this.filterFrom.set(''); this.filterTo.set(''); this.filterStatus.set(''); this.filterMethod.set('');
    this.filterMin.set(''); this.filterMax.set(''); this.filterCategoryId.set(''); this.filterStockStatus.set(''); this.filterUserStatus.set('');
  }

  clearFilters(): void {
    this.clearFilterFields();
    this.toast.show('Filters cleared.', 'info');
  }

  runReport(): void {
    const key = this.currentKey();
    if (!key) return;

    const orderFilters = { dateFrom: this.filterFrom() || undefined, dateTo: this.filterTo() || undefined, status: this.filterStatus() || undefined, minAmount: this.filterMin() || undefined, maxAmount: this.filterMax() || undefined };
    const paymentFilters = { dateFrom: this.filterFrom() || undefined, dateTo: this.filterTo() || undefined, status: this.filterStatus() || undefined, method: this.filterMethod() || undefined, minAmount: this.filterMin() || undefined, maxAmount: this.filterMax() || undefined };

    const obs = key === 'sales' ? this.reportSvc.generateSalesSummaryReport(orderFilters)
      : key === 'orders' ? this.reportSvc.generateAllOrdersReport(orderFilters)
      : key === 'payments' ? this.reportSvc.generatePaymentTransactionsReport(paymentFilters)
      : key === 'inventory' ? this.reportSvc.generateProductInventoryReport({ categoryId: this.filterCategoryId(), stockStatus: (this.filterStockStatus() as any) || '', minPrice: this.filterMin(), maxPrice: this.filterMax() })
      : this.reportSvc.generateCustomerListReport({ userStatus: (this.filterUserStatus() as any) || '' });

    obs.subscribe((report) => {
      this.currentReport.set(report);
      this.page.set(1);
      this.applyPaging();
    });
  }

  private applyPaging(): void {
    const report = this.currentReport();
    if (!report) return;
    this.pagedRows.set(paginate(report.rows, this.page(), this.perPage()));
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.applyPaging();
  }


  summaryEntries(): SummaryEntry[] {
    return this.currentReport()?.summary ? summaryEntries(this.currentReport()!.summary as Record<string, number>) : [];
  }

  exportCsv(): void {
    const report = this.currentReport();
    if (!report) return;
    exportToCSV(report.headers, report.rows, `ShopEase_${report.title.replace(/\s/g, '_')}_${Date.now()}.csv`);
    this.toast.show('CSV exported!', 'success');
  }

  exportTxt(): void {
    const report = this.currentReport();
    if (!report) return;
    exportToText(report.title, report.headers, report.rows, `ShopEase_${report.title.replace(/\s/g, '_')}_${Date.now()}.txt`);
    this.toast.show('Text file exported!', 'success');
  }

  print(): void {
    window.print();
  }
}
