import { PostDialogData } from '../../interfaces';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';


@Component({
  selector: 'app-post-dialog',
  standalone: false,
  templateUrl: './post-dialog.component.html',
  styleUrl: './post-dialog.component.scss'
})
export class PostDialogComponent implements OnChanges {
  @Input() visible = false;
  @Input() defaultTitle = '';
  @Input() defaultContent = '';

  @Output() confirmed = new EventEmitter<PostDialogData>();
  @Output() cancelled = new EventEmitter<void>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required]
    });
  }

  ngOnChanges(): void {
    if (this.visible) {
      this.form.patchValue({
        title: this.defaultTitle,
        content: this.defaultContent
      });
    }
  }

  confirm(): void {
    if (this.form.invalid) return;
    this.confirmed.emit(this.form.value);
  }

  dismiss(): void {
    this.cancelled.emit();
  }
}
