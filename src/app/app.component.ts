import { Component } from '@angular/core';
import { TaskOrchestrationOwner } from "azure-devops-extension-api/TaskAgent";
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { DeployState } from './deploy.state';
import { DeployStateActions } from './deploy.state-actions';
import { result } from 'lodash';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'deploy-board';
  taskOrchestrationOwners$: Observable<TaskOrchestrationOwner[]>;

  constructor(private store: Store) {
    this.taskOrchestrationOwners$ = this.store.select(DeployState.taskOrchestrationOwners());
        this.store.dispatch(DeployStateActions.Initialize);
  }

  public getEnvironmentInstances(taskOrchestrationOwnerId: number) {
    return this.store.select(DeployState.environmentInstances(taskOrchestrationOwnerId));
  }

  public getLastSuccessfullDeployment(taskOrchestrationOwnerId: number, environmentInstanceId: number) {
    return this.store.select(DeployState.lastSuccessfulEnvironmentDeploymentExecutionRecord(taskOrchestrationOwnerId, environmentInstanceId));
  }
  public getDeployments(taskOrchestrationOwnerId: number, environmentInstanceId: number) {
    return this.store.select(DeployState.environmentDeploymentExecutionRecords(taskOrchestrationOwnerId, environmentInstanceId));
  }
  
}
