import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Chart, ChartType, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';
import { OrderService } from '../../../core/services/order.service';
import { ProductService } from '../../../core/services/product.service';
import { PaymentService } from '../../../core/services/payment.service';
import { AuthService } from '../../../core/services/auth.service';
import { LogRepository } from '../../../core/repositories/log.repository';
import { ToastService } from '../../../core/services/toast.service';
import { Order, Product, User, LogEntry } from '../../../core/models';
import { formatCurrency, formatDate, formatDateTime, statusBadgeClass } from '../../../core/utils/format.utils';

Chart.register(...registerables);

const PALETTE = ['#2563eb', '#f59e0b', '#16a34a', '#dc2626', '#64748b', '#0891b2', '#7c3aed', '#ec4899'];

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
})
export class AdminDashboardComponent implements AfterViewInit, OnDestroy {
  private orderSvc = inject(OrderService);
  private productSvc = inject(ProductService);
  private paymentSvc = inject(PaymentService);
  private authSvc = inject(AuthService);
  private logs = inject(LogRepository);
  private toast = inject(ToastService);

  @ViewChild('revenueCanvas') revenueCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('distCanvas') distCanvas!: ElementRef<HTMLCanvasElement>;
  private revenueChart: Chart | null = null;
  private distChart: Chart | null = null;
  private chartsRendered = false;

  private allOrders: Order[] = [];
  private allProducts: Product[] = [];
  private allCustomers: User[] = [];

  dateFrom = signal('');
  dateTo = signal('');
  subtitle = signal('Showing all-time data');

  revenue = signal(0);
  completedCount = signal(0);
  totalOrders = signal(0);
  pendingOrders = signal(0);
  avgOrderValue = signal(0);
  customerCount = signal(0);
  activeCustomerCount = signal(0);
  productCount = signal(0);
  inStockCount = signal(0);
  outOfStockCount = signal(0);

  topProducts = signal<{ name: string; qty: number; revenue: number }[]>([]);
  topProductsSort = signal<'revenue' | 'quantity'>('revenue');
  stockAlerts = signal<Product[]>([]);
  recentOrders = signal<(Order & { customerName: string })[]>([]);
  recentOrdersFilter = signal('');
  activityLog = signal<LogEntry[]>([]);

  revenueChartType = signal<ChartType>('bar');
  distChartType = signal<ChartType>('doughnut');
  groupBy = signal<'status' | 'category' | 'method'>('status');
  distTitle = signal('Order Status Distribution');

  formatCurrency = formatCurrency;
  formatDate = formatDate;
  formatDateTime = formatDateTime;
  statusBadgeClass = statusBadgeClass;

  ngAfterViewInit(): void {
    forkJoin([this.orderSvc.getAllOrders(), this.productSvc.getAllProducts(), this.authSvc.getAllCustomers(), this.productSvc.getAllCategories()])
      .subscribe(([orders, products, customers, categories]) => {
        this.allOrders = orders;
        this.allProducts = products;
        this.allCustomers = customers;
        categories.forEach((c) => this.categoryCache.set(c.id, c.name));
        this.renderDashboard();
      });
  }

  ngOnDestroy(): void {
    this.revenueChart?.destroy();
    this.distChart?.destroy();
  }

  private filteredOrders(): Order[] {
    let orders = this.allOrders;
    if (this.dateFrom()) orders = orders.filter((o) => new Date(o.createdAt) >= new Date(this.dateFrom()));
    if (this.dateTo()) {
      const to = new Date(this.dateTo());
      to.setHours(23, 59, 59);
      orders = orders.filter((o) => new Date(o.createdAt) <= to);
    }
    return orders;
  }

  applyRange(): void {
    this.renderDashboard();
    this.toast.show('Dashboard updated with selected date range.', 'info');
  }

  resetRange(): void {
    this.dateFrom.set('');
    this.dateTo.set('');
    this.renderDashboard();
    this.toast.show('Filters reset to all-time data.', 'info');
  }

  private renderDashboard(): void {
    this.renderKPIs();
    this.renderTopProducts();
    this.renderStockAlerts();
    this.renderRecentOrders();
    this.renderActivityLog();
    if (this.chartsRendered) this.renderCharts();

    this.subtitle.set(this.dateFrom() || this.dateTo() ? `Filtered: ${this.dateFrom() || 'Start'} to ${this.dateTo() || 'Now'}` : 'Showing all-time data');
  }

  private renderKPIs(): void {
    const orders = this.filteredOrders();
    const completed = orders.filter((o) => o.status !== 'Cancelled');
    const revenue = completed.reduce((s, o) => s + o.total, 0);
    this.revenue.set(revenue);
    this.completedCount.set(completed.length);
    this.totalOrders.set(orders.length);
    this.pendingOrders.set(orders.filter((o) => o.status === 'Pending').length);
    this.avgOrderValue.set(completed.length ? revenue / completed.length : 0);

    this.customerCount.set(this.allCustomers.length);
    this.activeCustomerCount.set(this.allCustomers.filter((c) => c.isActive).length);

    const activeProducts = this.allProducts.filter((p) => p.isActive);
    this.productCount.set(activeProducts.length);
    this.inStockCount.set(activeProducts.filter((p) => p.stock > 0).length);
    this.outOfStockCount.set(activeProducts.filter((p) => p.stock === 0).length);
  }

  renderTopProducts(): void {
    const orders = this.filteredOrders().filter((o) => o.status !== 'Cancelled');
    const sales = new Map<string, { qty: number; revenue: number }>();
    orders.forEach((o) => o.items.forEach((item) => {
      const cur = sales.get(item.name) ?? { qty: 0, revenue: 0 };
      cur.qty += item.quantity;
      cur.revenue += item.subtotal;
      sales.set(item.name, cur);
    }));
    const sortBy = this.topProductsSort();
    const sorted = [...sales.entries()].sort((a, b) => (sortBy === 'revenue' ? b[1].revenue - a[1].revenue : b[1].qty - a[1].qty)).slice(0, 5);
    this.topProducts.set(sorted.map(([name, d]) => ({ name, ...d })));
  }

  private renderStockAlerts(): void {
    const lowStock = this.allProducts.filter((p) => p.isActive && p.stock <= 10).sort((a, b) => a.stock - b.stock);
    this.stockAlerts.set(lowStock);
  }

  renderRecentOrders(): void {
    let orders = this.filteredOrders();
    if (this.recentOrdersFilter()) orders = orders.filter((o) => o.status === this.recentOrdersFilter());
    const recent = [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 8);
    this.recentOrders.set(recent.map((o) => ({ ...o, customerName: this.allCustomers.find((c) => c.id === o.userId)?.name ?? 'Unknown' })));
  }

  private renderActivityLog(): void {
    this.logs.getRecent(20).subscribe((logs) => this.activityLog.set(logs));
  }

  toggleCharts(expanding: boolean): void {
    if (expanding && !this.chartsRendered) this.renderCharts();
  }

  private renderCharts(): void {
    this.paymentSvc.getAllPayments().subscribe((payments) => {
      this.renderRevenueChart();
      this.renderDistChart(payments.map((p) => p.method));
      this.chartsRendered = true;
    });
  }

  onRevenueChartTypeChange(): void {
    this.renderRevenueChart();
  }

  onDistControlsChange(): void {
    this.paymentSvc.getAllPayments().subscribe((payments) => this.renderDistChart(payments.map((p) => p.method)));
  }

  private renderRevenueChart(): void {
    const orders = this.filteredOrders().filter((o) => o.status !== 'Cancelled');
    const monthly = new Map<string, { revenue: number; count: number }>();
    orders.forEach((o) => {
      const d = new Date(o.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const cur = monthly.get(key) ?? { revenue: 0, count: 0 };
      cur.revenue += o.total;
      cur.count++;
      monthly.set(key, cur);
    });
    const sortedKeys = [...monthly.keys()].sort();
    const labels = sortedKeys.map((k) => {
      const [y, m] = k.split('-');
      return new Date(+y, +m - 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    });

    this.revenueChart?.destroy();
    const type = this.revenueChartType();
    this.revenueChart = new Chart(this.revenueCanvas.nativeElement, {
      type,
      data: {
        labels: labels.length ? labels : ['No Data'],
        datasets: [
          { label: 'Revenue (₹)', data: sortedKeys.map((k) => monthly.get(k)!.revenue), backgroundColor: 'rgba(37, 99, 235, 0.2)', borderColor: '#2563eb', borderWidth: 2, fill: type === 'line', tension: 0.3 },
          { label: 'Orders', data: sortedKeys.map((k) => monthly.get(k)!.count), backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: '#f59e0b', borderWidth: 2, fill: false, tension: 0.3, yAxisID: type !== 'radar' ? 'y1' : undefined },
        ],
      },
      options: {
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: { legend: { position: 'top' } },
        scales: type !== 'radar' ? {
          y: { type: 'linear', position: 'left', title: { display: true, text: 'Revenue (₹)' } },
          y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Orders' } },
        } : {},
      },
    });
  }

  private renderDistChart(paymentMethods: string[]): void {
    const orders = this.filteredOrders();
    const groupBy = this.groupBy();
    let labels: string[] = [];
    let data: number[] = [];

    if (groupBy === 'status') {
      this.distTitle.set('Order Status Distribution');
      const count = new Map<string, number>();
      orders.forEach((o) => count.set(o.status, (count.get(o.status) ?? 0) + 1));
      labels = [...count.keys()];
      data = [...count.values()];
    } else if (groupBy === 'category') {
      this.distTitle.set('Revenue by Category');
      const catRevenue = new Map<string, number>();
      orders.filter((o) => o.status !== 'Cancelled').forEach((o) => o.items.forEach((item) => {
        const product = this.allProducts.find((p) => p.id === item.productId);
        const catName = product ? this.categoryNameFor(product) : 'Unknown';
        catRevenue.set(catName, (catRevenue.get(catName) ?? 0) + item.subtotal);
      }));
      labels = [...catRevenue.keys()];
      data = [...catRevenue.values()];
    } else {
      this.distTitle.set('Payment Method Distribution');
      const count = new Map<string, number>();
      paymentMethods.forEach((m) => count.set(m, (count.get(m) ?? 0) + 1));
      labels = [...count.keys()];
      data = [...count.values()];
    }

    let colors = labels.map((_, i) => PALETTE[i % PALETTE.length]);
    if (!labels.length) { labels = ['No Data']; data = [1]; colors = ['#e2e8f0']; }

    this.distChart?.destroy();
    this.distChart = new Chart(this.distCanvas.nativeElement, {
      type: this.distChartType(),
      data: { labels, datasets: [{ data, backgroundColor: colors.map((c) => c + 'cc'), borderColor: colors, borderWidth: 2 }] },
      options: { responsive: true, plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 10 } } } },
    });
  }

  private categoryCache = new Map<number, string>();
  private categoryNameFor(product: Product): string {
    return this.categoryCache.get(product.categoryId) ?? 'Unknown';
  }
}
