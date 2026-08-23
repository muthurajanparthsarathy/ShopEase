import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

const BASE = `${environment.apiUrl}/backup`;

export interface BackupJob {
  id: number;
  name: string;
  source: string[];
  type: 'Full' | 'Incremental' | 'Differential';
  schedule: 'Manual' | 'Hourly' | 'Daily' | 'Weekly' | 'Monthly';
  retention: number;
  active: boolean;
  createdAt: string;
  lastRunAt: string | null;
}

export interface BackupJobRequest {
  name: string;
  source: string[];
  type: string;
  schedule: string;
  retention: number;
  active: boolean;
}

export interface RunJobResult {
  success: boolean;
  records: number;
  error?: string;
}

export interface RestoreValidation {
  valid: boolean;
  message?: string;
  entityCounts: Record<string, number>;
  exportedAt?: string;
  exportedBy?: string;
}

export interface EntityInfo {
  available: string[];
  restorable: string[];
  counts: Record<string, number>;
}

export interface RestoreOutcome {
  success: boolean;
  message: string;
}

/** Every entity name here matches the backend's own naming (ShopEase.Api's BackupController) 1:1 — no client-side translation layer. */
export const ENTITY_MAP: Record<string, string> = {
  Users: 'Users', Products: 'Products', Categories: 'Categories', Orders: 'Orders',
  Payments: 'Payments', Notifications: 'Notifications', Logs: 'Activity Logs',
  Reviews: 'Reviews', Coupons: 'Coupons', CustomFields: 'Custom Fields',
};
export const MAIN_ENTITIES = ['Users', 'Products', 'Categories', 'Orders', 'Payments', 'Notifications', 'Logs'];

// Only consumed by the admin Backup & Recovery page.
@Injectable({ providedIn: 'root' })
export class BackupService {
  private http = inject(HttpClient);

  getJobs(): Observable<BackupJob[]> {
    return this.http.get<BackupJob[]>(`${BASE}/jobs`);
  }

  createJob(request: BackupJobRequest): Observable<BackupJob> {
    return this.http.post<BackupJob>(`${BASE}/jobs`, request);
  }

  updateJob(id: number, request: BackupJobRequest): Observable<BackupJob> {
    return this.http.put<BackupJob>(`${BASE}/jobs/${id}`, request);
  }

  deleteJob(id: number): Observable<void> {
    return this.http.delete<void>(`${BASE}/jobs/${id}`);
  }

  runJob(id: number): Observable<RunJobResult> {
    return this.http.post<RunJobResult>(`${BASE}/jobs/${id}/run`, {});
  }

  /** The last 40 system log lines (shared with the admin dashboard's activity feed), pre-formatted server-side. */
  getActivity(): Observable<string[]> {
    return this.http.get<string[]>(`${BASE}/activity`);
  }

  getEntityInfo(): Observable<EntityInfo> {
    return this.http.get<EntityInfo>(`${BASE}/entities`);
  }

  exportData(entities: string[]): Observable<Record<string, unknown>> {
    let params = new HttpParams();
    entities.forEach((e) => (params = params.append('entities', e)));
    return this.http.get<Record<string, unknown>>(`${BASE}/export`, { params });
  }

  validateRestore(data: unknown): Observable<RestoreValidation> {
    return this.http.post<RestoreValidation>(`${BASE}/restore/validate`, data);
  }

  /** Stages the scoped data server-side only — live tables are untouched until executeRestore() is called. */
  stageRestore(data: unknown, scope: string[]): Observable<void> {
    return this.http.post<void>(`${BASE}/restore/stage`, { data, scope });
  }

  /** Applies the previously staged data to live tables — restorable entities only (see EntityInfo.restorable). */
  executeRestore(scope: string[]): Observable<RestoreOutcome[]> {
    return this.http.post<RestoreOutcome[]>(`${BASE}/restore/execute`, { scope });
  }

  resetAllData(): Observable<void> {
    return this.http.post<void>(`${BASE}/reset`, {});
  }

  downloadJSON(obj: unknown, filename: string): void {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
