import { Component, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { DeployState } from './deploy.state';
import { DeployStateActions } from './deploy.state-actions';
import { Observable, timer } from 'rxjs';
import { BuildStatus } from "azure-devops-extension-api/Build";


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'deploy-board';
  editMode = false;
  refreshTimer: Observable<number> = timer(0, 30000);
  statusFilter: 'all' | 'inProgress' | 'failed' = "inProgress";

  constructor(private store: Store) {

  }

  ngOnInit(): void {
    this.refreshTimer.subscribe(() => {
      this.refresh()
    });
  }

  refresh() {
    this.store.dispatch(new DeployStateActions.LoadPipelines(this.buidStatus));
  }

  public getBuildInProgress(pipelineId: number) {
    return this.store.select(DeployState.getBuildInProgress(pipelineId));
  }

  public getPipelines() {
    return this.store.select(DeployState.getPipelines());
  }

  public getStageRecords(buildId: number) {
    return this.store.select(DeployState.getBuildStageTimeline(buildId));
  }

  private get buidStatus(): BuildStatus {
    switch (this.statusFilter) {
      case "inProgress":
        return BuildStatus.InProgress;
      default:
        return BuildStatus.All;
    }
  }
}
