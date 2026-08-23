import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CustomField, CustomFieldEntity, CustomFieldInput } from '../models';

@Injectable()
export abstract class CustomFieldRepository {
  abstract getForEntity(entity: CustomFieldEntity, includeInactive: boolean): Observable<CustomField[]>;
  abstract add(data: CustomFieldInput): Observable<CustomField>;
  abstract update(id: number, patch: Partial<CustomFieldInput>): Observable<CustomField>;
  abstract remove(id: number): Observable<void>;
  abstract toggleActive(id: number): Observable<CustomField>;
}

const BASE = `${environment.apiUrl}/custom-fields`;

@Injectable()
export class HttpCustomFieldRepository extends CustomFieldRepository {
  private http = inject(HttpClient);

  override getForEntity(entity: CustomFieldEntity, includeInactive: boolean): Observable<CustomField[]> {
    return this.http.get<CustomField[]>(BASE, { params: { entity, includeInactive } });
  }

  // Key is server-generated (a unique slug from the label) — the client never builds it, unlike the
  // old localStorage-era repository which took a synchronous `build` callback (not possible over HTTP).
  override add(data: CustomFieldInput): Observable<CustomField> {
    return this.http.post<CustomField>(BASE, data);
  }

  override update(id: number, patch: Partial<CustomFieldInput>): Observable<CustomField> {
    return this.http.put<CustomField>(`${BASE}/${id}`, patch);
  }

  override remove(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }

  override toggleActive(id: number): Observable<CustomField> {
    return this.http.patch<CustomField>(`${BASE}/${id}/toggle-active`, {});
  }
}
