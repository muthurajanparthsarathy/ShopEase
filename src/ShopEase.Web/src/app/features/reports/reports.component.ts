import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReportService } from '../../core/services/report.service';
import { OrderService } from '../../core/services/order.service';
import { PaymentService } from '../../core/services/payment.service';
import { AuthStore } from '../../core/stores/auth.store';
import { ToastService } from '../../core/services/toast.service';
import { ReportData, exportToCSV, exportToText } from '../../core/utils/export.utils';
import { summaryEntries, isBadgeStatus, SummaryEntry } from '../../shared/utils/report-summary.utils';
import { statusBadgeClass } from '../../core/utils/format.utils';

type ReportType = 'orders' | 'payments' | 'cart';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './reports.component.html',
})
export class ReportsComponent implements OnInit {
  private reportSvc = inject(ReportService);
  private orderSvc = inject(OrderService);
  private paymentSvc = inject(PaymentService);
  private auth = inject(AuthStore);
  private toast = inject(ToastService);

  orderStatuses = signal<{ id: number; name: string }[]>([]);
  paymentMethods = signal<{ id: number; name: string }[]>([]);
  paymentStatuses = signal<{ id: number; name: string }[]>([]);

  selectedReport = signal<ReportType | null>(null);
  filterFrom = signal('');
  filterTo = signal('');
  filterStatus = signal('');
  filterMethod = signal('');
  filterMin = signal('');
  filterMax = signal('');

  currentReport = signal<ReportData | null>(null);

  statusBadgeClass = statusBadgeClass;
  isBadgeStatus = isBadgeStatus;

  private get userId() { return this.auth.currentUser()!.id; }

  ngOnInit(): void {
    this.orderSvc.getOrderStatuses().subscribe((s) => this.orderStatuses.set(s));
    this.paymentSvc.getPaymentMethods().subscribe((m) => this.paymentMethods.set(m));
    this.paymentSvc.getPaymentStatuses().subscribe((s) => this.paymentStatuses.set(s));
  }

  selectReport(type: ReportType): void {
    this.selectedReport.set(type);
    this.clearFilterFields();
    if (type === 'cart') this.generate();
  }

  private clearFilterFields(): void {
    this.filterFrom.set('');
    this.filterTo.set('');
    this.filterStatus.set('');
    this.filterMethod.set('');
    this.filterMin.set('');
    this.filterMax.set('');
  }

  clearFilters(): void {
    this.clearFilterFields();
    this.toast.show('Filters cleared.', 'info');
  }

  generate(): void {
    const type = this.selectedReport();
    if (!type) return;

    const filters = {
      dateFrom: this.filterFrom() || undefined,
      dateTo: this.filterTo() || undefined,
      status: this.filterStatus() || undefined,
      method: this.filterMethod() || undefined,
      minAmount: this.filterMin() || undefined,
      maxAmount: this.filterMax() || undefined,
    };

    const obs = type === 'orders' ? this.reportSvc.generateMyOrdersReport(this.userId, filters)
      : type === 'payments' ? this.reportSvc.generateMyPaymentsReport(this.userId, filters)
      : this.reportSvc.generateMyCartReport(this.userId);

    obs.subscribe((report) => this.currentReport.set(report));
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
