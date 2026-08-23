import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StorageService } from '../utils/storage.service';
import { CmsConfig } from '../models';

const PREVIEW_KEY = 'se_cms_preview';

@Injectable()
export abstract class CmsRepository {
  abstract getConfig(): Observable<CmsConfig | null>;
  abstract saveConfig(config: CmsConfig): Observable<void>;
  abstract getPreview(): Observable<CmsConfig | null>;
  abstract savePreview(config: CmsConfig): Observable<void>;
  abstract reset(): Observable<void>;
}

const BASE = `${environment.apiUrl}/cms`;

@Injectable()
export class HttpCmsRepository extends CmsRepository {
  private http = inject(HttpClient);
  private storage = inject(StorageService);

  override getConfig(): Observable<CmsConfig | null> {
    return this.http.get<CmsConfig>(`${BASE}/published`);
  }

  override saveConfig(config: CmsConfig): Observable<void> {
    return this.http.put<void>(`${BASE}/published`, config);
  }

  override getPreview(): Observable<CmsConfig | null> {
    return this.http.get<CmsConfig>(`${BASE}/preview`);
  }

  // Also mirrors to localStorage so the Home page's live-preview iframe — which listens for the
  // browser's native `storage` event, fired only in *other* tabs/frames when this key changes — keeps
  // working unchanged. The backend call is the durable copy; this is purely for same-origin live sync.
  override savePreview(config: CmsConfig): Observable<void> {
    return this.http.put<void>(`${BASE}/preview`, config).pipe(tap(() => this.storage.set(PREVIEW_KEY, config)));
  }

  override reset(): Observable<void> {
    return this.http.post<void>(`${BASE}/reset`, {});
  }
}
