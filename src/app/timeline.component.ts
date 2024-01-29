import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { DeployState } from './deploy.state';
import { DeployStateActions } from './deploy.state-actions';
import { Timeline, TimelineRecord, TimelineRecordState } from 'azure-devops-extension-api/Build';
import { Observable } from 'rxjs';

@Component({
    selector: 'build-timeline',
    templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.scss']
})
export class TimelineComponent {
    @Input() buildId: number = 0;
    @Input() timelineRecords: TimelineRecord[] | null = [];


    constructor(private store: Store) {

    }
}