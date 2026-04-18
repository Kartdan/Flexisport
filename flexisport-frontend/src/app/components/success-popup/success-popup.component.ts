import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';

@Component({
  selector: 'app-success-popup',
  standalone: false,
  templateUrl: './success-popup.component.html',
  styleUrl: './success-popup.component.scss'
})
export class SuccessPopupComponent implements OnChanges, OnDestroy {
  @Input() visible = false;
  @Input() title = 'Success';
  @Input() message = '';
  @Input() autoCloseMs = 2500;

  @Output() closed = new EventEmitter<void>();

  private closeTimer: ReturnType<typeof setTimeout> | null = null;

  ngOnChanges(): void {
    if (!this.visible) {
      this.clearTimer();
      return;
    }

    this.clearTimer();
    this.closeTimer = setTimeout(() => {
      this.dismiss();
    }, this.autoCloseMs);
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
