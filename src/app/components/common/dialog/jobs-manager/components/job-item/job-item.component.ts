import {
  Component, ChangeDetectionStrategy, Input, Output, EventEmitter,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { Job } from 'app/interfaces/job.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { DialogService } from 'app/services';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-job-item',
  templateUrl: './job-item.component.html',
  styleUrls: ['./job-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JobItemComponent {
  @Input() job: Job;
  @Output() aborted = new EventEmitter();
  @Output() opened = new EventEmitter();
  readonly JobState = JobState;

  constructor(
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private translate: TranslateService,
  ) {}

  abort(job: Job): void {
    this.dialogService
      .confirm({
        title: this.translate.instant(T('Abort the task')),
        message: `<pre>${job.method}</pre>`,
        hideCheckBox: true,
        buttonMsg: this.translate.instant(T('Abort')),
        cancelMsg: this.translate.instant(T('Close')),
        disableClose: true,
      })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.aborted.emit();
      });
  }

  openJobDialog(job: Job): void {
    let title = job.description ? job.description : job.method;
    if (job.state === JobState.Running) {
      title = this.translate.instant(T('Updating'));
    }
    const jobDialogRef = this.matDialog.open(EntityJobComponent, {
      data: { title },
      disableClose: false,
      hasBackdrop: true,
      width: '400px',
    });

    jobDialogRef.componentInstance.jobId = job.id;
    jobDialogRef.componentInstance.autoCloseOnSuccess = true;
    jobDialogRef.componentInstance.wsshow();

    this.opened.emit();
  }
}
