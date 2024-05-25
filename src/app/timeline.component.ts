import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { DeployState } from './deploy.state';
import { DeployStateActions } from './deploy.state-actions';
import { TaskResult, Timeline, TimelineRecord, TimelineRecordState } from 'azure-devops-extension-api/Build';
import { Observable } from 'rxjs';

@Component({
    selector: 'build-timeline',
    templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent {
    @Input() buildId: number = 0;
    @Input() timelineRecords: TimelineRecord[] | null = [];
    @Input() href: string = "";
    TimelineRecordState = TimelineRecordState;


    constructor(private store: Store) {

    }

    anyInProgress() {
        if (this.timelineRecords == null)
            return false;
        return this.timelineRecords.some(e => e.state == TimelineRecordState.InProgress);
    }

    getClass(record: TimelineRecord) {

        switch (record.state) {
            case TimelineRecordState.Pending:
                return "stage-pending";
            case TimelineRecordState.InProgress:
                return "stage-in-progress";
            case TimelineRecordState.Completed:
                break;
        }

        switch (record.result) {
            case TaskResult.Succeeded:
                return "stage-succeeded";
            case TaskResult.SucceededWithIssues:
                return "stage-succeeded-with-issues";
            case TaskResult.Failed:
                return "stage-failed";
            case TaskResult.Canceled:
                return "stage-canceled";
            case TaskResult.Skipped:
                return "stage-skipped";
            case TaskResult.Abandoned:
                return "stage-abandoned";
        }

        return "stage-unknown";
    }

    isPending(record: TimelineRecord) {
        if (this.anyInProgress())
            return false;
        return record.state === TimelineRecordState.Pending;
    }

    isUndetermined(record: TimelineRecord) {
        return this.anyInProgress() && record.state === TimelineRecordState.Pending;
    }

    isInProgress(record: TimelineRecord) {
        return record.state === TimelineRecordState.InProgress;
    }

    hasSucceeded(record: TimelineRecord) {
        return (record.state == TimelineRecordState.Completed && record.result === TaskResult.Succeeded);
    }

    hasFailed(record: TimelineRecord) {
        return (record.state == TimelineRecordState.Completed && record.result === TaskResult.Failed);
    }

    hasSkipped(record: TimelineRecord) {
        return (record.state == TimelineRecordState.Completed && record.result === TaskResult.Skipped);
    }

}