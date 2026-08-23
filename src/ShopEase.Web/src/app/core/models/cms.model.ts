export type CmsSectionType = 'categories' | 'products' | 'banner' | 'recentOrders';
export type CmsProductSource = 'featured' | 'newest' | 'category' | 'manual';

export interface CmsHero {
  enabled: boolean;
  greeting: boolean;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

export interface CmsSection {
  id: string;
  type: CmsSectionType;
  title: string;
  enabled: boolean;
  source?: CmsProductSource;
  categoryId?: number | '';
  productIds?: number[];
  limit?: number;
  text?: string;
  link?: string;
  color?: string;
}

export interface CmsConfig {
  hero: CmsHero;
  sections: CmsSection[];
}
