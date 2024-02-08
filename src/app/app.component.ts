import { Component, OnInit } from '@angular/core';
import { Store } from '@ngxs/store';
import { DeployState } from './deploy.state';
import { DeployStateActions } from './deploy.state-actions';
import { Observable, timer } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'deploy-board';
  editMode = false;
  refreshTimer: Observable<number> = timer(0, 30000);

  constructor(private store: Store) {

    
  }
  ngOnInit(): void {
    this.refreshTimer.subscribe(() => {
      this.store.dispatch(DeployStateActions.LoadPipelines);
    });
  }


  public getBuildInProgress(pipelineId:number) {
    return this.store.select(DeployState.getBuildInProgress(pipelineId));
  }

  public getPipelines() {
    return this.store.select(DeployState.getPipelines());
  }
  

  public getStageRecords(buildId: number) {
    return this.store.select(DeployState.getBuildStageTimeline(buildId));
  }
  
}
