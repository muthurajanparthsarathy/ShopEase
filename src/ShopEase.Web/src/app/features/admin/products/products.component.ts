import { AfterViewInit, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category, Product } from '../../../core/models';
import { paginate, PageResult } from '../../../core/utils/pagination.utils';
import { formatCurrency, formatDateTime } from '../../../core/utils/format.utils';
import { fieldPattern, firstErrorMessage } from '../../../core/validators/field.validators';
import { CustomFieldsFormComponent } from '../../../shared/components/custom-fields-form/custom-fields-form.component';
import { CustomFieldsDisplayComponent } from '../../../shared/components/custom-fields-display/custom-fields-display.component';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

declare const bootstrap: any;

interface BulkRow {
  valid: boolean;
  errors: string[];
  name: string; sku: string; brand: string; category: string; description: string;
  price?: number; stock?: number; categoryId?: number;
}

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CustomFieldsFormComponent, CustomFieldsDisplayComponent, PaginationComponent],
  templateUrl: './products.component.html',
})
export class AdminProductsComponent implements AfterViewInit {
  private fb = inject(FormBuilder);
  private productSvc = inject(ProductService);
  private toast = inject(ToastService);

  @ViewChild('productModalEl') productModalEl!: ElementRef<HTMLDivElement>;
  @ViewChild('viewModalEl') viewModalEl!: ElementRef<HTMLDivElement>;
  @ViewChild(CustomFieldsFormComponent) cfForm!: CustomFieldsFormComponent;
  private productModal: any;
  private viewModal: any;

  categories = signal<Category[]>([]);
  allProducts = signal<Product[]>([]);
  paged = signal<PageResult<Product>>({ items: [], currentPage: 1, totalPages: 1, totalItems: 0, perPage: 10, hasNext: false, hasPrev: false });

  page = signal(1);
  perPage = signal(10);
  search = signal('');
  filterCategory = signal('');
  filterStock = signal('');
  filterSort = signal('');

  editingId = signal<number | null>(null);
  cfInitialValues = signal<Record<string, unknown>>({});
  submitted = signal(false);
  viewingProduct = signal<Product | null>(null);
  bulkUploadOpen = signal(false);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, fieldPattern('productName')]],
    sku: ['', [Validators.required, fieldPattern('sku')]],
    brand: ['', [Validators.required, fieldPattern('brand')]],
    categoryId: ['', [Validators.required]],
    price: ['', [Validators.required]],
    stock: ['', [Validators.required]],
    description: [''],
  });

  errorFor = (name: keyof typeof this.form.controls) => firstErrorMessage(this.form.get(name));
  formatCurrency = formatCurrency;
  formatDateTime = formatDateTime;

  bulkRows = signal<BulkRow[]>([]);
  bulkResultMessage = signal<{ text: string; ok: boolean } | null>(null);

  constructor() {
    this.productSvc.getAllCategories().subscribe((cats) => this.categories.set(cats));
    this.reload();
  }

  ngAfterViewInit(): void {
    this.productModal = new bootstrap.Modal(this.productModalEl.nativeElement);
    this.viewModal = new bootstrap.Modal(this.viewModalEl.nativeElement);
  }

  private reload(): void {
    this.productSvc.getAllProducts().subscribe((all) => { this.allProducts.set(all); this.applyFilters(); });
  }

  applyFilters(): void {
    this.productSvc.searchProducts(this.search(), {
      categoryId: this.filterCategory(), sortBy: (this.filterSort() as any) || undefined,
      inStock: this.filterStock() === 'in' ? true : undefined,
    }).subscribe((products) => {
      if (this.filterStock() === 'out') products = products.filter((p) => p.stock === 0);
      this.paged.set(paginate(products, this.page(), this.perPage()));
    });
  }

  onFilterChange(): void {
    this.page.set(1);
    this.applyFilters();
  }

  clearFilters(): void {
    this.search.set('');
    this.filterCategory.set('');
    this.filterStock.set('');
    this.filterSort.set('');
    this.page.set(1);
    this.applyFilters();
    this.toast.show('Filters cleared.', 'info');
  }

  goToPage(p: number): void {
    this.page.set(p);
    this.applyFilters();
  }


  categoryName(id: number): string {
    return this.categories().find((c) => c.id === id)?.name ?? '—';
  }

  openAdd(): void {
    this.editingId.set(null);
    this.submitted.set(false);
    this.form.reset({ name: '', sku: '', brand: '', categoryId: '', price: '', stock: '', description: '' });
    this.cfInitialValues.set({});
  }

  openView(p: Product): void {
    this.viewingProduct.set(p);
    this.viewModal.show();
  }

  openEdit(p: Product): void {
    this.editingId.set(p.id);
    this.submitted.set(false);
    this.form.reset({ name: p.name, sku: p.sku, brand: p.brand, categoryId: String(p.categoryId), price: String(p.price), stock: String(p.stock), description: p.description ?? '' });
    this.cfInitialValues.set(p.custom ?? {});
    this.productModal.show();
  }

  viewToEdit(): void {
    const p = this.viewingProduct();
    this.viewModal.hide();
    if (p) this.openEdit(p);
  }

  async save(): Promise<void> {
    this.submitted.set(true);
    if (this.form.invalid) return;

    const cf = this.cfForm.getResult();
    if (cf.errors.length) {
      this.toast.show('Please fill required: ' + cf.errors.join(', '), 'error');
      return;
    }

    const v = this.form.getRawValue();
    const data = { name: v.name.trim(), sku: v.sku.trim().toUpperCase(), brand: v.brand.trim(), categoryId: v.categoryId, price: v.price, stock: v.stock, description: v.description.trim(), custom: cf.values };
    const editId = this.editingId();

    const onDone = (result: { success: boolean; message: string }) => {
      this.toast.show(result.message, result.success ? 'success' : 'error');
      if (result.success) { this.productModal.hide(); this.reload(); }
    };
    const doSave = () => {
      if (editId) this.productSvc.updateProduct(editId, data as any).subscribe(onDone);
      else this.productSvc.addProduct(data as any).subscribe(onDone);
    };

    if (editId) {
      const ok = await this.toast.confirm('Save changes to this product?');
      if (ok) doSave();
    } else {
      doSave();
    }
  }

  async deleteProduct(p: Product): Promise<void> {
    const ok = await this.toast.confirm(`Are you sure you want to delete "${p.name}"?`, 'danger');
    if (!ok) return;
    this.productSvc.deleteProduct(p.id).subscribe((result) => {
      this.toast.show(result.message, result.success ? 'success' : 'error');
      this.reload();
    });
  }

  // ── Bulk upload ──
  downloadTemplate(): void {
    const catNames = this.categories().map((c) => c.name).join(' / ');
    const header = 'Name,SKU,Brand,Category,Price,Stock,Description';
    const example1 = '"Wireless Mouse","AC-010","Logitech","Accessories","1299","50","Ergonomic wireless mouse"';
    const example2 = '"USB-C Hub","AC-011","Anker","Accessories","2499","30","7-in-1 USB-C hub"';
    const instructions = [
      '# ShopEase Bulk Product Upload Template', '# Instructions:',
      '#   1. Fill product data starting from row 2 (do NOT modify the header row)',
      '#   2. SKU format: XX-000 (e.g. EL-001). Must be unique.',
      `#   3. Category must match one of: ${catNames}`,
      '#   4. Price must be > 0. Stock must be >= 0.', '#   5. Description is optional.',
      '#   6. Save as CSV (UTF-8) and upload.', '#   7. Max 100 products per upload.', '#',
    ];
    const csv = instructions.join('\n') + '\n' + header + '\n' + example1 + '\n' + example2 + '\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ShopEase_Product_Upload_Template.csv';
    a.click();
    URL.revokeObjectURL(url);
    this.toast.show('Template downloaded!', 'success');
  }

  private parseCSV(text: string): Record<string, string>[] {
    const lines = text.split('\n').filter((l) => l.trim() && !l.trim().startsWith('#'));
    if (lines.length < 2) return [];
    const parseRow = (line: string): string[] => {
      const result: string[] = [];
      let current = '', inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { if (inQuotes && line[i + 1] === '"') { current += '"'; i++; } else inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
        else current += ch;
      }
      result.push(current.trim());
      return result;
    };
    const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ''));
    const rows: Record<string, string>[] = [];
    for (let i = 1; i < lines.length; i++) {
      const vals = parseRow(lines[i]);
      if (vals.length < 4) continue;
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => (obj[h] = vals[idx] || ''));
      rows.push(obj);
    }
    return rows;
  }

  private validateBulkRow(row: Record<string, string>): BulkRow {
    const errors: string[] = [];
    const name = row['name'] ?? '', sku = row['sku'] ?? '', brand = row['brand'] ?? '', category = row['category'] ?? '';
    if (!name || name.length < 3 || name.length > 100) errors.push('Invalid name (3-100 chars)');
    if (!sku || !/^[A-Z]{2}-\d{3}$/i.test(sku)) errors.push('Invalid SKU (XX-000)');
    if (!brand || brand.length < 2) errors.push('Invalid brand');

    const cat = this.categories().find((c) => c.name.toLowerCase() === category.toLowerCase());
    let categoryId: number | undefined;
    if (!cat) errors.push(`Unknown category "${category}"`);
    else categoryId = cat.id;

    const price = parseFloat(row['price'] ?? '');
    let priceOk: number | undefined;
    if (isNaN(price) || price <= 0) errors.push('Invalid price'); else priceOk = price;

    const stock = parseInt(row['stock'] ?? '', 10);
    let stockOk: number | undefined;
    if (isNaN(stock) || stock < 0) errors.push('Invalid stock'); else stockOk = stock;

    return { valid: errors.length === 0, errors, name, sku, brand, category, description: row['description'] ?? '', price: priceOk, stock: stockOk, categoryId };
  }

  onBulkFile(event: Event): void {
    this.bulkResultMessage.set(null);
    this.bulkRows.set([]);
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = this.parseCSV(String(ev.target?.result ?? ''));
      if (!parsed.length) { this.toast.show('No valid data found in the CSV file.', 'error'); return; }
      if (parsed.length > 100) { this.toast.show(`Maximum 100 products per upload. File has ${parsed.length} rows.`, 'error'); return; }
      this.bulkRows.set(parsed.map((r) => this.validateBulkRow(r)));
    };
    reader.readAsText(file);
  }

  get bulkValidCount(): number {
    return this.bulkRows().filter((r) => r.valid).length;
  }

  uploadBulk(): void {
    const validRows = this.bulkRows().filter((r) => r.valid);
    if (!validRows.length) return;

    let added = 0, skipped = 0;
    const errors: string[] = [];
    let remaining = validRows.length;

    validRows.forEach((r) => {
      const data = { name: r.name.trim(), sku: r.sku.trim().toUpperCase(), brand: r.brand.trim(), categoryId: r.categoryId!, price: r.price!, stock: r.stock!, description: r.description.trim() };
      this.productSvc.addProduct(data as any).subscribe((result) => {
        if (result.success) added++; else { skipped++; errors.push(`${data.sku}: ${result.message}`); }
        remaining--;
        if (remaining === 0) {
          this.bulkResultMessage.set({ text: `${added} product(s) added successfully${skipped > 0 ? `, ${skipped} skipped` : ''}.${errors.length ? ' ' + errors.join('; ') : ''}`, ok: skipped === 0 });
          this.toast.show(`${added} product(s) imported!`, added > 0 ? 'success' : 'error');
          this.reload();
        }
      });
    });
  }

  clearBulk(): void {
    this.bulkRows.set([]);
    this.bulkResultMessage.set(null);
  }
}
