import { AfterViewInit, Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  BackupJob, BackupService, ENTITY_MAP, EntityInfo, MAIN_ENTITIES, RestoreValidation,
} from './backup.service';
import { ToastService } from '../../../core/services/toast.service';
import { extractErrorMessage } from '../../../core/utils/http-result.utils';
import { formatDateTime } from '../../../core/utils/format.utils';

declare const bootstrap: any;

interface RsCheck { label: string; ok: boolean }

@Component({
  selector: 'app-admin-backup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './backup.component.html',
})
export class AdminBackupComponent implements AfterViewInit {
  private backupSvc = inject(BackupService);
  private toast = inject(ToastService);

  @ViewChild('newJobModalEl') newJobModalEl!: ElementRef<HTMLDivElement>;
  @ViewChild('restoreModalEl') restoreModalEl!: ElementRef<HTMLDivElement>;
  private newJobModal: any;
  private restoreModal: any;

  entityMap = ENTITY_MAP;
  mainEntities = MAIN_ENTITIES;
  formatDateTime = formatDateTime;

  jobs = signal<BackupJob[]>([]);
  activity = signal<string[]>([]);
  entityInfo = signal<EntityInfo>({ available: [], restorable: [], counts: {} });

  // Quick export
  exportChecks: Record<string, boolean> = Object.fromEntries(MAIN_ENTITIES.map((k) => [k, true]));

  // New job form
  jobName = signal('');
  jobType = signal<'Full' | 'Incremental' | 'Differential'>('Full');
  jobSchedule = signal<BackupJob['schedule']>('Daily');
  jobRetention = signal(30);
  jobActive = signal(true);
  jobSourceChecks: Record<string, boolean> = Object.fromEntries(MAIN_ENTITIES.map((k) => [k, true]));
  jobSubmitted = signal(false);

  // Restore wizard
  rsStep = signal(1);
  rsData: Record<string, unknown> | null = null;
  rsFileName = signal('');
  rsFileError = signal('');
  rsChecks = signal<RsCheck[]>([]);
  rsValidation = signal<RestoreValidation | null>(null);
  rsVerified = signal(false);
  rsScope: Record<string, boolean> = {};
  rsTarget = signal<'staging' | 'current'>('staging');
  rsResult = signal<{ ok: boolean; message: string } | null>(null);

  constructor() {
    this.reload();
  }

  ngAfterViewInit(): void {
    this.newJobModal = new bootstrap.Modal(this.newJobModalEl.nativeElement);
    this.restoreModal = new bootstrap.Modal(this.restoreModalEl.nativeElement);
  }

  private reload(): void {
    this.backupSvc.getJobs().subscribe((jobs) => this.jobs.set(jobs));
    this.backupSvc.getActivity().subscribe((lines) => this.activity.set(lines));
    this.backupSvc.getEntityInfo().subscribe((info) => this.entityInfo.set(info));
  }

  count(key: string): number {
    return this.entityInfo().counts[key] ?? 0;
  }

  /** The shared system log (also feeds the admin dashboard) filtered to backup/restore/reset-relevant lines. */
  get relevantActivity(): string[] {
    return this.activity().filter((l) => /backup|restore|reset to default/i.test(l));
  }

  private get backupRunLines(): string[] {
    return this.relevantActivity.filter((l) => /Backup (completed|failed):/i.test(l));
  }

  // ── KPIs ──
  get activeJobsCount(): number { return this.jobs().filter((j) => j.active).length; }
  get lastRunAt(): string | null {
    const runs = this.jobs().map((j) => j.lastRunAt).filter((d): d is string => !!d).sort().reverse();
    return runs[0] ?? null;
  }
  get totalBackups(): number { return this.backupRunLines.length; }
  get successRate(): number {
    const runs = this.backupRunLines;
    if (!runs.length) return 0;
    const completed = runs.filter((l) => /Backup completed:/i.test(l)).length;
    return Math.round((completed / runs.length) * 100);
  }

  nextRunText(job: BackupJob): string {
    if (job.schedule === 'Manual') return 'On demand';
    const base = job.lastRunAt ? new Date(job.lastRunAt) : new Date();
    const add = { Hourly: 36e5, Daily: 864e5, Weekly: 7 * 864e5, Monthly: 30 * 864e5 }[job.schedule] || 864e5;
    return formatDateTime(new Date(base.getTime() + add).toISOString());
  }

  typeBadge(type: string): string {
    return { Full: 'bg-primary', Incremental: 'bg-info text-dark', Differential: 'bg-secondary' }[type] ?? 'bg-secondary';
  }

  activityIcon(line: string): { cls: string; icon: string } {
    if (/failed/i.test(line)) return { cls: 'bg-danger bg-opacity-10 text-danger', icon: 'x-circle-fill' };
    if (/completed|reset to default/i.test(line)) return { cls: 'bg-success bg-opacity-10 text-success', icon: 'check-circle-fill' };
    return { cls: 'bg-info bg-opacity-10 text-info', icon: 'arrow-repeat' };
  }

  private handleError(err: unknown): void {
    this.toast.show(extractErrorMessage(err), 'error');
  }

  // ── Jobs table actions ──
  async runJob(job: BackupJob): Promise<void> {
    const ok = await this.toast.confirm(`Run backup job "${job.name}" now?`, 'info');
    if (!ok) return;
    this.backupSvc.runJob(job.id).subscribe({
      next: (result) => {
        this.reload();
        this.toast.show(result.success ? `Backup "${job.name}" completed.` : `Backup failed: ${result.error}`, result.success ? 'success' : 'error');
      },
      error: (err) => this.handleError(err),
    });
  }

  toggleJob(job: BackupJob): void {
    const request = { name: job.name, source: job.source, type: job.type, schedule: job.schedule, retention: job.retention, active: !job.active };
    this.backupSvc.updateJob(job.id, request).subscribe({
      next: () => {
        this.reload();
        this.toast.show(`Job ${request.active ? 'activated' : 'paused'}.`, 'info');
      },
      error: (err) => this.handleError(err),
    });
  }

  async deleteJob(job: BackupJob): Promise<void> {
    const ok = await this.toast.confirm(`Delete job "${job.name}"?`, 'danger');
    if (!ok) return;
    this.backupSvc.deleteJob(job.id).subscribe({
      next: () => {
        this.reload();
        this.toast.show('Job deleted.', 'success');
      },
      error: (err) => this.handleError(err),
    });
  }

  // ── Quick export ──
  selectAllExport(select: boolean): void {
    for (const k of MAIN_ENTITIES) this.exportChecks[k] = select;
  }

  exportBackup(): void {
    const checks = MAIN_ENTITIES.filter((k) => this.exportChecks[k]);
    if (!checks.length) { this.toast.show('Select at least one data type.', 'error'); return; }
    this.backupSvc.exportData(checks).subscribe({
      next: (data) => {
        this.backupSvc.downloadJSON(data, `ShopEase_Backup_${new Date().toISOString().slice(0, 10)}.json`);
        this.reload();
        this.toast.show('Backup downloaded.', 'success');
      },
      error: (err) => this.handleError(err),
    });
  }

  // ── New job modal ──
  openNewJob(): void {
    this.jobName.set('');
    this.jobType.set('Full');
    this.jobSchedule.set('Daily');
    this.jobRetention.set(30);
    this.jobActive.set(true);
    this.jobSourceChecks = Object.fromEntries(MAIN_ENTITIES.map((k) => [k, true]));
    this.jobSubmitted.set(false);
    this.newJobModal.show();
  }

  async createJob(): Promise<void> {
    this.jobSubmitted.set(true);
    const name = this.jobName().trim();
    const source = MAIN_ENTITIES.filter((k) => this.jobSourceChecks[k]);
    if (!name || !source.length) return;

    const ok = await this.toast.confirm(`Create backup job "${name}"?`, 'info');
    if (!ok) return;

    const request = { name, source, type: this.jobType(), schedule: this.jobSchedule(), retention: this.jobRetention() || 30, active: this.jobActive() };
    this.backupSvc.createJob(request).subscribe({
      next: () => {
        this.reload();
        this.newJobModal.hide();
        this.toast.show(`Job "${name}" created.`, 'success');
      },
      error: (err) => this.handleError(err),
    });
  }

  // ── Restore wizard ──
  openRestore(): void {
    this.rsStep.set(1);
    this.rsData = null;
    this.rsFileName.set('');
    this.rsFileError.set('');
    this.rsVerified.set(false);
    this.rsChecks.set([]);
    this.rsValidation.set(null);
    this.rsResult.set(null);
    this.restoreModal.show();
  }

  onRestoreFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.rsFileError.set('');
    this.rsData = null;
    this.rsVerified.set(false);
    if (!file) return;
    if (!file.name.endsWith('.json')) { this.rsFileError.set('Please upload a valid .json backup file.'); return; }

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        this.rsData = JSON.parse(String(ev.target?.result ?? ''));
        this.rsFileName.set(file.name);
      } catch {
        this.rsFileError.set('Failed to parse JSON. The file may be corrupted.');
      }
    };
    reader.readAsText(file);
  }

  get rsEntityCount(): number {
    return this.rsData ? Object.keys(this.rsData).filter((k) => k !== '_meta').length : 0;
  }

  canGoNext(): boolean {
    if (this.rsStep() === 1) return !!this.rsData;
    if (this.rsStep() === 2) return this.rsVerified();
    return true;
  }

  goNext(): void {
    const next = this.rsStep() + 1;
    if (next > 4) return;
    if (next === 2) { this.runIntegrityChecks(); return; }
    this.rsStep.set(next);
    if (next === 3) this.initScope();
  }

  goBack(): void {
    if (this.rsStep() > 1) this.rsStep.update((s) => s - 1);
  }

  private runIntegrityChecks(): void {
    if (!this.rsData) return;
    this.backupSvc.validateRestore(this.rsData).subscribe({
      next: (validation) => {
        this.rsValidation.set(validation);
        this.rsChecks.set([
          { label: 'Valid JSON structure', ok: true },
          { label: 'Recognized ShopEase entities found', ok: validation.valid },
          { label: `Backup exported: ${validation.exportedAt ? formatDateTime(validation.exportedAt) : 'unknown'}`, ok: !!validation.exportedAt },
          { label: `Exported by: ${validation.exportedBy || 'unknown'}`, ok: !!validation.exportedBy },
          { label: `${Object.keys(validation.entityCounts).length} entit${Object.keys(validation.entityCounts).length === 1 ? 'y' : 'ies'} recognized`, ok: Object.keys(validation.entityCounts).length > 0 },
        ]);
        this.rsVerified.set(validation.valid);
        this.rsStep.set(2);
      },
      error: (err) => {
        this.rsChecks.set([{ label: 'Valid JSON structure', ok: false }]);
        this.rsVerified.set(false);
        this.rsStep.set(2);
        this.handleError(err);
      },
    });
  }

  private initScope(): void {
    const keys = Object.keys(this.rsValidation()?.entityCounts ?? {});
    this.rsScope = Object.fromEntries(keys.map((k) => [k, this.entityInfo().restorable.includes(k)]));
  }

  rsScopeKeys(): string[] {
    return Object.keys(this.rsValidation()?.entityCounts ?? {});
  }

  isRestorable(key: string): boolean {
    return this.entityInfo().restorable.includes(key);
  }

  rsBackupCount(key: string): number {
    return this.rsValidation()?.entityCounts[key] ?? 0;
  }

  get rsSelectedScope(): string[] {
    return this.rsScopeKeys().filter((k) => this.rsScope[k] && this.isRestorable(k));
  }

  async executeRestore(): Promise<void> {
    const scope = this.rsSelectedScope;
    const target = this.rsTarget();
    if (!scope.length) { this.toast.show('Select at least one restorable entity.', 'error'); return; }
    if (!this.rsData) return;

    const stageAndMaybeExecute = () => {
      this.backupSvc.stageRestore(this.rsData, scope).subscribe({
        next: () => {
          if (target === 'staging') {
            this.rsResult.set({ ok: true, message: `${scope.length} entit${scope.length === 1 ? 'y' : 'ies'} staged successfully. Live data was not modified.` });
            this.toast.show('Restored to staging.', 'success');
            this.reload();
            return;
          }
          this.backupSvc.executeRestore(scope).subscribe({
            next: (results) => {
              const summary = results.map((r) => r.message).join(' ');
              this.rsResult.set({ ok: results.every((r) => r.success), message: summary || `Restored ${scope.length} entit${scope.length === 1 ? 'y' : 'ies'} to production. Reloading...` });
              this.toast.show('Restore complete.', 'success');
              setTimeout(() => window.location.reload(), 1600);
            },
            error: (err) => this.rsResult.set({ ok: false, message: `Restore failed: ${extractErrorMessage(err)}` }),
          });
        },
        error: (err) => this.rsResult.set({ ok: false, message: `Restore failed: ${extractErrorMessage(err)}` }),
      });
    };

    if (target === 'current') {
      const ok = await this.toast.confirm(`Overwrite live data for ${scope.length} entit${scope.length === 1 ? 'y' : 'ies'}? This cannot be undone.`, 'danger');
      if (ok) stageAndMaybeExecute();
    } else {
      stageAndMaybeExecute();
    }
  }

  async closeRestore(): Promise<void> {
    const ok = await this.toast.confirm('Cancel the restore and close the wizard?', 'warning');
    if (ok) this.restoreModal.hide();
  }

  // ── Danger zone ──
  async resetAllData(): Promise<void> {
    const ok1 = await this.toast.confirm('Reset ALL ShopEase data to defaults? Everything will be lost.', 'danger');
    if (!ok1) return;
    const ok2 = await this.toast.confirm('Final confirmation — permanently reset all data?', 'danger');
    if (!ok2) return;
    this.backupSvc.resetAllData().subscribe({
      next: () => {
        this.toast.show('All data reset to defaults. Reloading...', 'success');
        setTimeout(() => window.location.reload(), 1200);
      },
      error: (err) => this.handleError(err),
    });
  }
}
