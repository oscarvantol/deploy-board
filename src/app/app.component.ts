import { Component } from '@angular/core';
import { Store } from '@ngxs/store';
import { DeployState } from './deploy.state';
import { DeployStateActions } from './deploy.state-actions';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'deploy-board';
  editMode = false;

  constructor(private store: Store) {

    this.store.dispatch(DeployStateActions.Initialize);
  }


  public getBuildInProgress() {
    return this.store.select(DeployState.getBuildInProgress());
  }

  public getStageRecords(buildId: number) {
    return this.store.select(DeployState.getBuildStageTimeline(buildId));
  }

  
}
