import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category } from '../models';

@Injectable()
export abstract class CategoryRepository {
  abstract getAll(): Observable<Category[]>;
  abstract getById(id: number): Observable<Category | null>;
  abstract add(category: Omit<Category, 'id'>): Observable<Category>;
  abstract update(id: number, patch: Partial<Category>): Observable<Category | null>;
}

const BASE = `${environment.apiUrl}/categories`;

@Injectable()
export class HttpCategoryRepository extends CategoryRepository {
  private http = inject(HttpClient);

  override getAll(): Observable<Category[]> {
    return this.http.get<Category[]>(BASE);
  }

  override getById(id: number): Observable<Category | null> {
    return this.http.get<Category>(`${BASE}/${id}`);
  }

  override add(category: Omit<Category, 'id'>): Observable<Category> {
    return this.http.post<Category>(BASE, category);
  }

  override update(id: number, patch: Partial<Category>): Observable<Category | null> {
    return this.http.put<Category>(`${BASE}/${id}`, patch);
  }
}
