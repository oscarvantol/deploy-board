import { Injectable } from '@angular/core';
import { Action, createSelector, Selector, State, StateContext } from '@ngxs/store';
import { EnvironmentDeploymentExecutionRecord, TaskOrchestrationOwner, EnvironmentInstance } from "azure-devops-extension-api/TaskAgent";
import { DeployStateActions } from './deploy.state-actions';
import { VssService } from './vss.service';

export interface DeployStateModel {
    environments: EnvironmentInstance[],
    envExRec: EnvironmentDeploymentExecutionRecord[]
}

@State<DeployStateModel>({
    name: "deployStateModel",
    defaults: {
        environments: [],
        envExRec: []
    }
}
)
@Injectable()
export class DeployState {
    constructor(private readonly vssService: VssService) {

    }

    static taskOrchestrationOwners() {
        return createSelector([DeployState], (state: DeployStateModel) => {
            const uniqueDefinitionIds = [...new Set(state.envExRec.map(x => x.definition.id))];
            return uniqueDefinitionIds.map(id =>
                state.envExRec.find(x => id == x.definition.id))
                .map(y => y?.definition || {} as TaskOrchestrationOwner)
                .sort((x, y) => x.name > y.name ? 1 : -1);
        });
    }

    static environmentInstances(definitionId: number) {
        return createSelector([DeployState], (state: DeployStateModel) => {
            const environmentIds = state.envExRec.filter(x => x.definition.id == definitionId).map(x => x.environmentId);
            return state.environments.filter(x => environmentIds.indexOf(x.id) >= 0).sort((a, b) => a.id > b.id ? 1 : -1);
        });
    }

    static lastSuccessfulEnvironmentDeploymentExecutionRecord(definitionId: number, environmentInstanceId: number) {
        return createSelector([DeployState], (state: DeployStateModel) => {
            const records = state.envExRec.filter(x => x.definition.id == definitionId && x.environmentId == environmentInstanceId)
            return records.sort((x, y) => x.id > y.id ? -1 : 1)[0];
        });
    }

    static environmentDeploymentExecutionRecords(definitionId: number, environmentInstanceId: number) {
        return createSelector([DeployState], (state: DeployStateModel) => {
            const records = state.envExRec.filter(x => x.definition.id == definitionId && x.environmentId == environmentInstanceId)
            return records.sort((x, y) => x.startTime < y.startTime ? -1 : 1);
        });
    }

    @Action(DeployStateActions.Initialize)
    async initialize(ctx: StateContext<DeployStateModel>, _: DeployStateActions.Initialize) {
        await this.vssService.initialize();
        const environments = await this.vssService.getEnvironments();
        const environmentDeploymentExecutionRecordsResults = await Promise.all(environments.map(e => {
            return this.vssService.getEnvironmentDeploymentExecutionRecords(e.id)
                .catch(err => [] as EnvironmentDeploymentExecutionRecord[]);
        }));

        ctx.patchState({
            environments: environments,
            envExRec: environmentDeploymentExecutionRecordsResults.flat()
        });
    }

}