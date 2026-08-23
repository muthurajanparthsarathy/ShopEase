import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { CmsRepository } from '../repositories/cms.repository';
import { CmsConfig, CmsProductSource, CmsSectionType } from '../models';

const DEFAULT_CONFIG: CmsConfig = {
  hero: {
    enabled: true, greeting: true, title: 'Welcome back',
    subtitle: 'Discover great products at great prices. Fresh arrivals every week.',
    ctaText: 'Start Shopping', ctaLink: '/catalog',
  },
  sections: [
    { id: 'sec-categories', type: 'categories', title: 'Shop by Category', enabled: true },
    { id: 'sec-featured', type: 'products', title: 'Featured Products', enabled: true, source: 'featured', categoryId: '', productIds: [], limit: 8 },
    { id: 'sec-new', type: 'products', title: 'New Arrivals', enabled: true, source: 'newest', categoryId: '', productIds: [], limit: 8 },
    { id: 'sec-recent', type: 'recentOrders', title: 'Your Recent Orders', enabled: true },
  ],
};

/** Consumed by both the customer Home page (read) and the admin CMS editor (read/write). */
@Injectable({ providedIn: 'root' })
export class CmsService {
  private repo = inject(CmsRepository);

  readonly key = 'se_cms';
  readonly previewKey = 'se_cms_preview';

  readonly SECTION_TYPES: { value: CmsSectionType; label: string }[] = [
    { value: 'categories', label: 'Shop by Category' },
    { value: 'products', label: 'Product Showcase' },
    { value: 'banner', label: 'Promo Banner' },
    { value: 'recentOrders', label: 'Recent Orders' },
  ];

  readonly PRODUCT_SOURCES: { value: CmsProductSource; label: string }[] = [
    { value: 'featured', label: 'Featured (most in stock)' },
    { value: 'newest', label: 'Newest arrivals' },
    { value: 'category', label: 'From a category' },
    { value: 'manual', label: 'Hand-picked products' },
  ];

  private normalize(stored: CmsConfig | null): CmsConfig {
    if (!stored) return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    return { hero: { ...DEFAULT_CONFIG.hero, ...(stored.hero || {}) }, sections: Array.isArray(stored.sections) ? stored.sections : DEFAULT_CONFIG.sections };
  }

  getConfig(): Observable<CmsConfig> {
    return this.repo.getConfig().pipe(map((c) => this.normalize(c)));
  }

  save(config: CmsConfig): Observable<void> {
    return this.repo.saveConfig(config);
  }

  getPreviewConfig(): Observable<CmsConfig> {
    return this.repo.getPreview().pipe(map((c) => (c ? this.normalize(c) : this.normalize(null))));
  }

  savePreview(config: CmsConfig): Observable<void> {
    return this.repo.savePreview(config);
  }

  reset(): Observable<CmsConfig> {
    return this.repo.reset().pipe(map(() => this.defaults()));
  }

  defaults(): CmsConfig {
    return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
  }
}
