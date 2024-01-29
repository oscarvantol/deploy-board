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

  // public getEnvironmentInstances(taskOrchestrationOwnerId: number) {
  //   return this.store.select(DeployState.environmentInstances(taskOrchestrationOwnerId));
  // }

  // public getLastSuccessfullDeployment(taskOrchestrationOwnerId: number, environmentInstanceId: number) {
  //   return this.store.select(DeployState.lastSuccessfulEnvironmentDeploymentExecutionRecord(taskOrchestrationOwnerId, environmentInstanceId));
  // }
  // public getDeployments(taskOrchestrationOwnerId: number, environmentInstanceId: number) {
  //   return this.store.select(DeployState.environmentDeploymentExecutionRecords(taskOrchestrationOwnerId, environmentInstanceId));
  // }

  public getBuildInProgress() {
    return this.store.select(DeployState.getBuildInProgress());
  }

  public getStageRecords(buildId: number) {
    return this.store.select(DeployState.getBuildStageTimeline(buildId));
  }

  // public getBuildsDefinitions(path: string) {
  //   return this.store.select(DeployState.getBuildDefinitions(path));
  // }

  // public getBuildDefinitionPaths() {
  //   return this.store.select(DeployState.getBuildDefinitionPaths());
  // }

  // public async swapOrder(taskOrchestrationOwnerId: number, environmentInstanceId: number) {
  //   const envs = await this.store.selectSnapshot(DeployState.environmentInstances(taskOrchestrationOwnerId));
  //   const index = envs?.findIndex(x => x.id == environmentInstanceId) ?? -1;
  //   if (index > -1 && envs && envs.length >= index + 2) {
  //     this.store.dispatch(new DeployStateActions.SwapEnvironmentOrder(envs[index], envs[index + 1]));
  //   }
  // }
}
