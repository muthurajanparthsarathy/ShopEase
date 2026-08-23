import { AfterViewInit, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category } from '../../../core/models';
import { paginate, PageResult } from '../../../core/utils/pagination.utils';
import { fieldPattern, firstErrorMessage } from '../../../core/validators/field.validators';
import { Validators } from '@angular/forms';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

declare const bootstrap: any;

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './categories.component.html',
})
export class AdminCategoriesComponent implements AfterViewInit {
  private fb = inject(FormBuilder);
  private productSvc = inject(ProductService);
  private toast = inject(ToastService);

  @ViewChild('catModalEl') catModalEl!: ElementRef<HTMLDivElement>;
  @ViewChild('viewModalEl') viewModalEl!: ElementRef<HTMLDivElement>;
  private catModal: any;
  private viewModal: any;

  page = signal(1);
  perPage = signal(8);
  paged = signal<PageResult<Category>>({ items: [], currentPage: 1, totalPages: 1, totalItems: 0, perPage: 8, hasNext: false, hasPrev: false });
  productCounts = signal<Record<number, number>>({});

  editingId = signal<number | null>(null);
  submitted = signal(false);
  viewingCategory = signal<Category | null>(null);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, fieldPattern('categoryName')]],
    description: [''],
  });

  errorFor = () => firstErrorMessage(this.form.get('name'));

  constructor() {
    this.reload();
  }

  ngAfterViewInit(): void {
    this.catModal = new bootstrap.Modal(this.catModalEl.nativeElement);
    this.viewModal = new bootstrap.Modal(this.viewModalEl.nativeElement);
  }

  private reload(): void {
    this.productSvc.getAllCategories().subscribe((categories) => {
      this.paged.set(paginate(categories, this.page(), this.perPage()));
      categories.forEach((c) => {
        this.productSvc.getProductCountByCategory(c.id).subscribe((count) => {
          this.productCounts.update((m) => ({ ...m, [c.id]: count }));
        });
      });
    });
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.reload();
  }


  productCountFor(id: number): number {
    return this.productCounts()[id] ?? 0;
  }

  openAdd(): void {
    this.editingId.set(null);
    this.submitted.set(false);
    this.form.reset({ name: '', description: '' });
  }

  openView(c: Category): void {
    this.viewingCategory.set(c);
    this.viewModal.show();
  }

  openEdit(c: Category): void {
    this.editingId.set(c.id);
    this.submitted.set(false);
    this.form.reset({ name: c.name, description: c.description ?? '' });
    this.catModal.show();
  }

  viewToEdit(): void {
    const c = this.viewingCategory();
    this.viewModal.hide();
    if (c) this.openEdit(c);
  }

  async save(): Promise<void> {
    this.submitted.set(true);
    if (this.form.invalid) return;

    const { name, description } = this.form.getRawValue();
    const editId = this.editingId();

    const onDone = (result: { success: boolean; message: string }) => {
      this.toast.show(result.message, result.success ? 'success' : 'error');
      if (result.success) { this.catModal.hide(); this.reload(); }
    };
    const doSave = () => {
      if (editId) this.productSvc.updateCategory(editId, name.trim(), description.trim()).subscribe(onDone);
      else this.productSvc.addCategory(name.trim(), description.trim()).subscribe(onDone);
    };

    if (editId) {
      const ok = await this.toast.confirm('Save changes to this category?');
      if (ok) doSave();
    } else {
      doSave();
    }
  }

  async deleteCategory(c: Category): Promise<void> {
    const ok = await this.toast.confirm(`Delete category "${c.name}"? Categories with products cannot be deleted.`, 'danger');
    if (!ok) return;
    this.productSvc.deleteCategory(c.id).subscribe((result) => {
      this.toast.show(result.message, result.success ? 'success' : 'error');
      if (result.success) this.reload();
    });
  }
}
