import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product } from '../models';

@Injectable()
export abstract class ProductRepository {
  abstract getAll(): Observable<Product[]>;
  abstract getById(id: number): Observable<Product | null>;
  abstract add(product: Omit<Product, 'id'>): Observable<Product>;
  abstract update(id: number, patch: Partial<Product>): Observable<Product | null>;
  abstract remove(id: number): Observable<boolean>;
}

const BASE = `${environment.apiUrl}/products`;

@Injectable()
export class HttpProductRepository extends ProductRepository {
  private http = inject(HttpClient);

  override getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(BASE);
  }

  override getById(id: number): Observable<Product | null> {
    return this.http.get<Product>(`${BASE}/${id}`);
  }

  override add(product: Omit<Product, 'id'>): Observable<Product> {
    return this.http.post<Product>(BASE, product);
  }

  override update(id: number, patch: Partial<Product>): Observable<Product | null> {
    return this.http.put<Product>(`${BASE}/${id}`, patch);
  }

  override remove(id: number): Observable<boolean> {
    // A 404 (already gone) resolves to false, matching the original "did it exist" contract, rather than erroring.
    return this.http.delete(`${BASE}/${id}`).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }
}
