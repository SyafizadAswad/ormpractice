import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IssueRow,
  IssuesApiService,
  ItemMeta,
} from '../../core/issues-api.service';

@Component({
  selector: 'app-issues-benchmark',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './issues-benchmark.component.html',
  styleUrl: './issues-benchmark.component.scss',
})
export class IssuesBenchmarkComponent implements OnInit {
  private readonly api = inject(IssuesApiService);

  readonly items = signal<ItemMeta[]>([]);
  readonly rows = signal<IssueRow[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  itemIdCount = 25;
  lastClientMs = signal<number | null>(null);
  lastServerMs = signal<number | null>(null);
  lastPayloadBytes = signal<number | null>(null);
  lastIssueCount = signal<number | null>(null);

  ngOnInit(): void {
    this.api.listItemMeta().subscribe({
      next: (res) => this.items.set(res.items),
      error: () =>
        this.error.set(
          'Could not load item metadata. Is the API running on port 3000?',
        ),
    });
  }

  runFetch(): void {
    this.error.set(null);
    this.loading.set(true);

    const pool = this.items();
    if (pool.length === 0) {
      this.error.set('No items available for sampling.');
      this.loading.set(false);
      return;
    }

    const count = Math.max(1, Math.min(this.itemIdCount, pool.length));
    const itemIds = pool.slice(0, count).map((i) => i.id);

    const started = performance.now();
    this.api.fetchIssues(itemIds).subscribe({
      next: (res) => {
        const clientMs = Math.round(performance.now() - started);
        const payloadBytes = new TextEncoder().encode(
          JSON.stringify(res),
        ).length;

        this.rows.set(res.data);
        this.lastClientMs.set(clientMs);
        this.lastServerMs.set(res.meta.serverMs);
        this.lastPayloadBytes.set(payloadBytes);
        this.lastIssueCount.set(res.meta.issueCount);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.message ?? 'Request failed.');
      },
    });
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
}
