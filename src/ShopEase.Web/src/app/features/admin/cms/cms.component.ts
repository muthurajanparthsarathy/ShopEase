import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, debounceTime } from 'rxjs';
import { CmsService } from '../../../core/services/cms.service';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { Category, CmsConfig, CmsSection, CmsSectionType, Product } from '../../../core/models';

const TYPE_ICON: Record<CmsSectionType, string> = { categories: 'tags', products: 'box-seam', banner: 'badge-ad', recentOrders: 'clock-history' };
const BANNER_COLORS = [
  { v: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', l: 'Amber' },
  { v: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', l: 'Blue' },
  { v: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', l: 'Green' },
  { v: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', l: 'Red' },
  { v: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)', l: 'Teal' },
  { v: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', l: 'Purple' },
];

type Selection = 'hero' | number;

@Component({
  selector: 'app-admin-cms',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './cms.component.html',
})
export class AdminCmsComponent implements OnInit {
  private cmsSvc = inject(CmsService);
  private productSvc = inject(ProductService);
  private toast = inject(ToastService);

  typeIcon = TYPE_ICON;
  bannerColors = BANNER_COLORS;
  sectionTypes = this.cmsSvc.SECTION_TYPES;
  productSources = this.cmsSvc.PRODUCT_SOURCES;

  config = signal<CmsConfig>(this.cmsSvc.defaults());
  selected = signal<Selection>('hero');
  dirty = signal(false);
  published = signal(true);
  mobilePreview = signal(false);
  previewBust = signal(0);

  categories = signal<Category[]>([]);
  products = signal<Product[]>([]);

  private edit$ = new Subject<void>();

  constructor() {
    this.edit$.pipe(debounceTime(200)).subscribe(() => {
      this.cmsSvc.savePreview(this.config()).subscribe();
    });
  }

  ngOnInit(): void {
    this.productSvc.getAllCategories().subscribe((c) => this.categories.set(c));
    this.productSvc.getAllProducts().subscribe((p) => this.products.set(p));
    this.cmsSvc.getConfig().subscribe((cfg) => {
      this.config.set(cfg);
      this.cmsSvc.savePreview(cfg).subscribe();
    });
  }

  select(sel: Selection): void {
    this.selected.set(sel);
  }

  currentSection(): CmsSection | null {
    const sel = this.selected();
    return typeof sel === 'number' ? this.config().sections[sel] ?? null : null;
  }

  typeLabel(t: string): string {
    return this.sectionTypes.find((x) => x.value === t)?.label ?? t;
  }

  private markDirty(): void {
    this.dirty.set(true);
    this.published.set(false);
    this.edit$.next();
  }

  updateHero<K extends keyof CmsConfig['hero']>(key: K, value: CmsConfig['hero'][K]): void {
    this.config.update((cfg) => ({ ...cfg, hero: { ...cfg.hero, [key]: value } }));
    this.markDirty();
  }

  updateSection<K extends keyof CmsSection>(index: number, key: K, value: CmsSection[K]): void {
    this.config.update((cfg) => {
      const sections = [...cfg.sections];
      sections[index] = { ...sections[index], [key]: value };
      return { ...cfg, sections };
    });
    this.markDirty();
  }

  toggleManualProduct(index: number, productId: number, checked: boolean): void {
    this.config.update((cfg) => {
      const sections = [...cfg.sections];
      const sec = sections[index];
      const ids = new Set(sec.productIds ?? []);
      if (checked) ids.add(productId); else ids.delete(productId);
      sections[index] = { ...sec, productIds: [...ids] };
      return { ...cfg, sections };
    });
    this.markDirty();
  }

  moveUp(i: number): void {
    if (i === 0) return;
    this.config.update((cfg) => {
      const sections = [...cfg.sections];
      [sections[i - 1], sections[i]] = [sections[i], sections[i - 1]];
      return { ...cfg, sections };
    });
    const sel = this.selected();
    if (sel === i) this.selected.set(i - 1); else if (sel === i - 1) this.selected.set(i);
    this.markDirty();
  }

  moveDown(i: number): void {
    this.config.update((cfg) => {
      if (i >= cfg.sections.length - 1) return cfg;
      const sections = [...cfg.sections];
      [sections[i + 1], sections[i]] = [sections[i], sections[i + 1]];
      return { ...cfg, sections };
    });
    const sel = this.selected();
    if (sel === i) this.selected.set(i + 1); else if (sel === i + 1) this.selected.set(i);
    this.markDirty();
  }

  async removeSection(i: number): Promise<void> {
    const ok = await this.toast.confirm('Remove this section?', 'danger');
    if (!ok) return;
    this.config.update((cfg) => ({ ...cfg, sections: cfg.sections.filter((_, idx) => idx !== i) }));
    const sel = this.selected();
    if (sel === i || sel === 'hero') this.selected.set('hero');
    else if (typeof sel === 'number' && sel > i) this.selected.set(sel - 1);
    this.markDirty();
  }

  addSection(type: CmsSectionType): void {
    const base: CmsSection = { id: 'sec-' + Date.now(), type, enabled: true, title: this.typeLabel(type) };
    if (type === 'products') Object.assign(base, { source: 'featured', categoryId: '', productIds: [], limit: 8 });
    if (type === 'banner') Object.assign(base, { text: 'Limited time offer!', link: '/catalog', color: BANNER_COLORS[0].v });
    this.config.update((cfg) => ({ ...cfg, sections: [...cfg.sections, base] }));
    this.selected.set(this.config().sections.length - 1);
    this.markDirty();
    this.toast.show(`${this.typeLabel(type)} section added.`, 'success');
  }

  publish(): void {
    this.cmsSvc.save(this.config()).subscribe(() => {
      this.cmsSvc.savePreview(this.config()).subscribe();
      this.dirty.set(false);
      this.published.set(true);
      this.toast.show('Published! The Home page is now live for customers.', 'success');
    });
  }

  async resetLayout(): Promise<void> {
    const ok = await this.toast.confirm('Reset to the default layout? (publish afterwards to make it live)', 'danger');
    if (!ok) return;
    const defaults = this.cmsSvc.defaults();
    this.config.set(defaults);
    this.selected.set('hero');
    this.cmsSvc.savePreview(defaults).subscribe();
    this.dirty.set(true);
    this.published.set(false);
    this.toast.show('Reset to default layout.', 'info');
  }
}
