import { Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-paginator',
  templateUrl: './paginator.html',
})
export class Paginator {
  currentPage = input.required<number>();
  totalPages = input.required<number>();
  totalElements = input<number>(0);
  pageSize = input<number>(15);

  pageChange = output<number>();

  protected readonly rangeStart = computed(() =>
    this.totalElements() === 0 ? 0 : this.currentPage() * this.pageSize() + 1,
  );

  protected readonly rangeEnd = computed(() =>
    Math.min(this.totalElements(), (this.currentPage() + 1) * this.pageSize()),
  );

  protected readonly pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const windowSize = 5;
    let start = Math.max(0, current - Math.floor(windowSize / 2));
    const end = Math.min(total, start + windowSize);
    start = Math.max(0, end - windowSize);
    return Array.from({ length: end - start }, (_, i) => start + i);
  });

  goTo(page: number): void {
    if (page < 0 || page >= this.totalPages() || page === this.currentPage()) {
      return;
    }
    this.pageChange.emit(page);
  }
}
