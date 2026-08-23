import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ARTICLES, FAQS, HelpArticle, TOOLS } from './help-data';

declare const bootstrap: any;

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './help.component.html',
})
export class HelpComponent implements OnInit, AfterViewInit {
  private route = inject(ActivatedRoute);

  @ViewChild('guideModalEl') guideModalEl!: ElementRef<HTMLDivElement>;
  private guideModal: any;

  tools = TOOLS;
  articles = ARTICLES;
  faqs = FAQS;

  searchQuery = signal('');
  selectedArticle = signal<HelpArticle | null>(null);

  articleHits = signal<HelpArticle[]>([]);
  faqHits = signal<typeof FAQS>([]);

  private byId = Object.fromEntries(ARTICLES.map((a) => [a.id, a]));

  ngOnInit(): void {
    const topic = this.route.snapshot.queryParamMap.get('topic');
    if (topic && this.byId[topic]) {
      // deferred to ngAfterViewInit since the modal instance isn't ready yet
      setTimeout(() => this.openGuide(this.byId[topic]));
    }
  }

  ngAfterViewInit(): void {
    this.guideModal = new bootstrap.Modal(this.guideModalEl.nativeElement);
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
    const q = value.trim().toLowerCase();
    if (!q) { this.articleHits.set([]); this.faqHits.set([]); return; }
    this.articleHits.set(this.articles.filter((a) => (a.title + ' ' + a.summary + ' ' + a.keywords + ' ' + a.steps.join(' ')).toLowerCase().includes(q)));
    this.faqHits.set(this.faqs.filter((f) => (f.q + ' ' + f.a).toLowerCase().includes(q)));
  }

  openGuide(article: HelpArticle): void {
    this.selectedArticle.set(article);
    this.guideModal.show();
  }
}
