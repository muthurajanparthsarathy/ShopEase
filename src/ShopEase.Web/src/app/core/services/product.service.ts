import { Injectable, inject } from '@angular/core';
import { Observable, map, of, switchMap } from 'rxjs';
import { ProductRepository } from '../repositories/product.repository';
import { CategoryRepository } from '../repositories/category.repository';
import { LogRepository } from '../repositories/log.repository';
import { Category, Product, ProductFilters, ProductInput, Result } from '../models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private products = inject(ProductRepository);
  private categories = inject(CategoryRepository);
  private logs = inject(LogRepository);

  getAllProducts(): Observable<Product[]> {
    return this.products.getAll();
  }

  getActiveProducts(): Observable<Product[]> {
    return this.products.getAll().pipe(map((all) => all.filter((p) => p.isActive)));
  }

  getProductById(id: number): Observable<Product | null> {
    return this.products.getById(id);
  }

  searchProducts(query: string, filters: ProductFilters = {}): Observable<Product[]> {
    return this.getActiveProducts().pipe(
      map((all) => {
        let result = all;
        const q = (query || '').toLowerCase().trim();
        if (q) {
          result = result.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
        }
        if (filters.categoryId) result = result.filter((p) => p.categoryId === +filters.categoryId!);
        if (filters.minPrice !== undefined && filters.minPrice !== '') result = result.filter((p) => p.price >= parseFloat(String(filters.minPrice)));
        if (filters.maxPrice !== undefined && filters.maxPrice !== '') result = result.filter((p) => p.price <= parseFloat(String(filters.maxPrice)));
        if (filters.inStock === true) result = result.filter((p) => p.stock > 0);
        if (filters.brand) result = result.filter((p) => p.brand.toLowerCase() === filters.brand!.toLowerCase());

        const sorters: Record<string, (a: Product, b: Product) => number> = {
          'price-asc': (a, b) => a.price - b.price,
          'price-desc': (a, b) => b.price - a.price,
          'name-asc': (a, b) => a.name.localeCompare(b.name),
          newest: (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
        };
        if (filters.sortBy && sorters[filters.sortBy]) result = [...result].sort(sorters[filters.sortBy]);
        return result;
      }),
    );
  }

  addProduct(input: ProductInput): Observable<Result<Product>> {
    return this.products.getAll().pipe(
      switchMap((all) => {
        if (all.some((p) => p.sku.toUpperCase() === input.sku.toUpperCase())) {
          return of({ success: false, message: 'A product with this SKU already exists.' });
        }
        return this.products.add({
          ...input, price: parseFloat(String(input.price)), stock: parseInt(String(input.stock), 10),
          categoryId: +input.categoryId, isActive: true, createdAt: new Date().toISOString(),
        }).pipe(
          switchMap((product) => this.logs.add(`Product added: ${product.name} (${product.sku})`).pipe(
            map(() => ({ success: true, message: 'Product added successfully.', data: product })),
          )),
        );
      }),
    );
  }

  updateProduct(id: number, updates: Partial<ProductInput>): Observable<Result> {
    return this.products.getAll().pipe(
      switchMap((all) => {
        const current = all.find((p) => p.id === id);
        if (!current) return of({ success: false, message: 'Product not found.' });
        if (updates.sku && updates.sku.toUpperCase() !== current.sku.toUpperCase()) {
          if (all.some((p) => p.id !== id && p.sku.toUpperCase() === updates.sku!.toUpperCase())) {
            return of({ success: false, message: 'Another product with this SKU already exists.' });
          }
        }
        const patch: Partial<Product> = {
          ...updates,
          price: updates.price !== undefined ? parseFloat(String(updates.price)) : undefined,
          stock: updates.stock !== undefined ? parseInt(String(updates.stock), 10) : undefined,
          categoryId: updates.categoryId !== undefined ? +updates.categoryId : undefined,
        };
        return this.products.update(id, patch).pipe(
          switchMap((product) => this.logs.add(`Product updated: ${product!.name}`).pipe(
            map(() => ({ success: true, message: 'Product updated successfully.' })),
          )),
        );
      }),
    );
  }

  deleteProduct(id: number): Observable<Result> {
    return this.products.getById(id).pipe(
      switchMap((product) => {
        if (!product) return of({ success: false, message: 'Product not found.' });
        return this.products.remove(id).pipe(
          switchMap(() => this.logs.add(`Product deleted: ${product.name}`).pipe(
            map(() => ({ success: true, message: 'Product deleted successfully.' })),
          )),
        );
      }),
    );
  }

  getAllCategories(): Observable<Category[]> {
    return this.categories.getAll().pipe(map((all) => all.filter((c) => c.isActive)));
  }

  getCategoryById(id: number): Observable<Category | null> {
    return this.getAllCategories().pipe(map((all) => all.find((c) => c.id === id) || null));
  }

  addCategory(name: string, description = ''): Observable<Result<Category>> {
    return this.categories.getAll().pipe(
      switchMap((all) => {
        if (all.some((c) => c.isActive && c.name.toLowerCase() === name.toLowerCase())) {
          return of({ success: false, message: 'A category with this name already exists.' });
        }
        return this.categories.add({ name, description, isActive: true, createdAt: new Date().toISOString() }).pipe(
          switchMap((cat) => this.logs.add(`Category added: ${name}`).pipe(
            map(() => ({ success: true, message: 'Category added successfully.', data: cat })),
          )),
        );
      }),
    );
  }

  updateCategory(id: number, name: string, description: string): Observable<Result> {
    return this.categories.getAll().pipe(
      switchMap((all) => {
        if (!all.some((c) => c.id === id)) return of({ success: false, message: 'Category not found.' });
        if (all.some((c) => c.id !== id && c.isActive && c.name.toLowerCase() === name.toLowerCase())) {
          return of({ success: false, message: 'Another category with this name already exists.' });
        }
        return this.categories.update(id, { name, description }).pipe(
          switchMap(() => this.logs.add(`Category updated: ${name}`).pipe(
            map(() => ({ success: true, message: 'Category updated successfully.' })),
          )),
        );
      }),
    );
  }

  deleteCategory(id: number): Observable<Result> {
    return this.categories.getAll().pipe(
      switchMap((cats) => {
        const cat = cats.find((c) => c.id === id);
        if (!cat) return of({ success: false, message: 'Category not found.' });
        return this.products.getAll().pipe(
          switchMap((products) => {
            const count = products.filter((p) => p.categoryId === id).length;
            if (count > 0) return of({ success: false, message: `Cannot delete: ${count} product(s) belong to this category.` });
            return this.categories.update(id, { isActive: false }).pipe(
              switchMap(() => this.logs.add(`Category deleted: ${cat.name}`).pipe(
                map(() => ({ success: true, message: 'Category deleted successfully.' })),
              )),
            );
          }),
        );
      }),
    );
  }

  getUniqueBrands(): Observable<string[]> {
    return this.getActiveProducts().pipe(map((all) => [...new Set(all.map((p) => p.brand))].sort()));
  }

  getProductCountByCategory(categoryId: number): Observable<number> {
    return this.products.getAll().pipe(map((all) => all.filter((p) => p.categoryId === categoryId).length));
  }
}
