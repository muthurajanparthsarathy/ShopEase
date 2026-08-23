import { AfterViewInit, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { User } from '../../../core/models';
import { paginate, PageResult } from '../../../core/utils/pagination.utils';
import { formatDate, formatDateTime } from '../../../core/utils/format.utils';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

declare const bootstrap: any;

@Component({
  selector: 'app-admin-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent],
  templateUrl: './customers.component.html',
})
export class AdminCustomersComponent implements AfterViewInit {
  private authSvc = inject(AuthService);
  private toast = inject(ToastService);

  @ViewChild('viewModalEl') viewModalEl!: ElementRef<HTMLDivElement>;
  private viewModal: any;

  allCustomers = signal<User[]>([]);
  paged = signal<PageResult<User>>({ items: [], currentPage: 1, totalPages: 1, totalItems: 0, perPage: 10, hasNext: false, hasPrev: false });

  page = signal(1);
  perPage = signal(10);
  search = signal('');
  filterStatus = signal('');

  viewingUser = signal<User | null>(null);

  formatDate = formatDate;
  formatDateTime = formatDateTime;

  constructor() {
    this.reload();
  }

  ngAfterViewInit(): void {
    this.viewModal = new bootstrap.Modal(this.viewModalEl.nativeElement);
  }

  private reload(): void {
    this.authSvc.getAllCustomers().subscribe((all) => { this.allCustomers.set(all); this.applyFilters(); });
  }

  applyFilters(): void {
    const q = this.search().toLowerCase().trim();
    let customers = this.allCustomers();
    if (q) customers = customers.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q));
    if (this.filterStatus() === 'active') customers = customers.filter((c) => c.isActive);
    if (this.filterStatus() === 'inactive') customers = customers.filter((c) => !c.isActive);
    this.paged.set(paginate(customers, this.page(), this.perPage()));
  }

  onFilterChange(): void {
    this.page.set(1);
    this.applyFilters();
  }

  clearFilters(): void {
    this.search.set('');
    this.filterStatus.set('');
    this.page.set(1);
    this.applyFilters();
    this.toast.show('Filters cleared.', 'info');
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.applyFilters();
  }


  viewUser(u: User): void {
    this.viewingUser.set(u);
    this.viewModal.show();
  }

  async toggleStatus(u: User): Promise<void> {
    const action = u.isActive ? 'deactivate' : 'activate';
    const ok = await this.toast.confirm(`Are you sure you want to ${action} ${u.name}?`, u.isActive ? 'warning' : 'info');
    if (!ok) return;
    this.authSvc.toggleUserStatus(u.id).subscribe((result) => {
      this.toast.show(result.message, result.success ? 'success' : 'error');
      this.reload();
    });
  }
}
