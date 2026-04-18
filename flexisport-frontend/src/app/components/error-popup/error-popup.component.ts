import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';

@Component({
  selector: 'app-error-popup',
  standalone: false,
  templateUrl: './error-popup.component.html',
  styleUrl: './error-popup.component.scss'
})
export class ErrorPopupComponent implements OnChanges, OnDestroy {
  @Input() visible = false;
  @Input() title = 'Something went wrong';
  @Input() message = '';
  @Input() autoCloseMs = 0;

  @Output() closed = new EventEmitter<void>();

  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnChanges(): void {
    if (!this.visible) {
      this.clearTimer();
      return;
    }

    if (this.autoCloseMs > 0) {
      this.clearTimer();
      this.closeTimer = setTimeout(() => {
        this.dismiss();
      }, this.autoCloseMs);
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  dismiss(): void {
    this.clearTimer();
    this.closed.emit();
  }

  private clearTimer(): void {
    if (this.closeTimer) {
      clearTimeout(this.closeTimer);
      this.closeTimer = null;
    }
  }
}
