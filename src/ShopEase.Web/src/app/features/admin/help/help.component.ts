import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AdminGuide, FAQS, GUIDES } from './admin-help-data';

declare const bootstrap: any;

@Component({
  selector: 'app-admin-help',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './help.component.html',
})
export class AdminHelpComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);

  @ViewChild('guideModalEl') guideModalEl!: ElementRef<HTMLDivElement>;
  private guideModal: any;

  guides = GUIDES;
  faqs = FAQS;

  searchQuery = signal('');
  selectedGuide = signal<AdminGuide | null>(null);
  guideHits = signal<AdminGuide[]>([]);
  faqHits = signal<typeof FAQS>([]);

  private byId = Object.fromEntries(GUIDES.map((g) => [g.id, g]));

  ngOnInit(): void {
    const topic = this.route.snapshot.queryParamMap.get('topic');
    if (topic && this.byId[topic]) setTimeout(() => this.openGuide(this.byId[topic]));
  }

  ngAfterViewInit(): void {
    this.guideModal = new bootstrap.Modal(this.guideModalEl.nativeElement);
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
    const q = value.trim().toLowerCase();
    if (!q) { this.guideHits.set([]); this.faqHits.set([]); return; }
    this.guideHits.set(this.guides.filter((g) => (g.module + ' ' + g.summary + ' ' + g.keywords + ' ' + g.steps.join(' ')).toLowerCase().includes(q)));
    this.faqHits.set(this.faqs.filter((f) => (f.q + ' ' + f.a).toLowerCase().includes(q)));
  }

  openGuide(g: AdminGuide): void {
    this.selectedGuide.set(g);
    this.guideModal.show();
  }
}
