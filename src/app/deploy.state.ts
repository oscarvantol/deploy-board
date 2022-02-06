import { Injectable } from '@angular/core';
import { Action, createSelector, Selector, State, StateContext } from '@ngxs/store';
import { Build, BuildDefinitionReference } from 'azure-devops-extension-api/Build';
import { EnvironmentDeploymentExecutionRecord, TaskOrchestrationOwner, EnvironmentInstance } from "azure-devops-extension-api/TaskAgent";
import { DeployStateActions } from './deploy.state-actions';
import { EnvironmentSetting } from './environment-setting';
import { VssService } from './vss.service';

export interface DeployStateModel {
    environments: EnvironmentInstance[],
    environmentSettings: EnvironmentSetting[],
    envExRec: EnvironmentDeploymentExecutionRecord[],
    buildsInProgress: Build[],
    buildDefinitions: BuildDefinitionReference[]
}

@State<DeployStateModel>({
    name: "deployStateModel",
    defaults: {
        environments: [],
        environmentSettings: [],
        envExRec: [],
        buildsInProgress: [],
        buildDefinitions: []
    }
}
)
@Injectable()
export class DeployState {
    constructor(private readonly vssService: VssService) {

    }

    static environmentInstances(definitionId: number) {
        return createSelector([DeployState], (state: DeployStateModel) => {
            const environmentIds = state.envExRec.filter(x => x.definition.id == definitionId).map(x => x.environmentId);
            return state.environments.filter(x => environmentIds.indexOf(x.id) >= 0)
                .sort((a, b) => this.settingsSort(state, a, b));
        });
    }

    static settingsSort(state: DeployStateModel, a: EnvironmentInstance, b: EnvironmentInstance) {
        var element1 = state.environmentSettings.find(x => x.id == a.id)?.order ?? a.id;
        var element2 = state.environmentSettings.find(x => x.id == b.id)?.order ?? b.id;
        return element1 - element2;
    }

    static lastSuccessfulEnvironmentDeploymentExecutionRecord(definitionId: number, environmentInstanceId: number) {
        return createSelector([DeployState], (state: DeployStateModel) => {
            const records = state.envExRec.filter(x => x.definition.id == definitionId && x.environmentId == environmentInstanceId);
            return records.sort((x, y) => x.id > y.id ? -1 : 1)[0];
        });
    }

    static environmentDeploymentExecutionRecords(definitionId: number, environmentInstanceId: number) {
        return createSelector([DeployState], (state: DeployStateModel) => {
            const records = state.envExRec.filter(x => x.definition.id == definitionId && x.environmentId == environmentInstanceId)
            return records.sort((x, y) => x.startTime < y.startTime ? -1 : 1);
        });
    }

    static getBuildInProgress(buildId: number) {
        return createSelector([DeployState], (state: DeployStateModel) => {
            return state.buildsInProgress.find(b => b.id == buildId);
        });
    }

    static getBuildDefinitions(path: string) {
        return createSelector([DeployState], (state: DeployStateModel) => {
            return state.buildDefinitions.filter(d => d.path == path && state.envExRec.find(x => x.definition.id == d.id));
        });
    }

    static getBuildDefinitionPaths() {
        return createSelector([DeployState], (state: DeployStateModel) => {
            return [...new Set(state.buildDefinitions.map(x => x.path))].sort();
        });
    }

    @Action(DeployStateActions.Initialize)
    async initialize(ctx: StateContext<DeployStateModel>, _: DeployStateActions.Initialize) {
        await this.vssService.initialize();
        const definitions = await this.vssService.getBuildDefinitions();
        const environments = await this.vssService.getEnvironments();
        const settings = await this.vssService.getOrCreateEnvironmentSettings(environments);
        const environmentDeploymentExecutionRecordsResults = await Promise.all(environments.map(e => {
            return this.vssService.getEnvironmentDeploymentExecutionRecords(e.id)
                .catch(err => [] as EnvironmentDeploymentExecutionRecord[]);
        }));

        ctx.patchState({
            buildDefinitions: definitions.filter(d => environmentDeploymentExecutionRecordsResults.flat().find(r => r.definition.id == d.id)),
            environments: environments,
            environmentSettings: settings,
            envExRec: environmentDeploymentExecutionRecordsResults.flat()
        });

        const buildsInProgress = await this.vssService.getBuildsInProgress();
        ctx.patchState({
            buildsInProgress: buildsInProgress
        });
    }

    @Action(DeployStateActions.SwapEnvironmentOrder)
    async swapEnviromentOrder(ctx: StateContext<DeployStateModel>, patch: DeployStateActions.SwapEnvironmentOrder) {
        const state = ctx.getState();
        let environmentSettings = state.environmentSettings.map(x => { return { id: x.id, order: x.order } as EnvironmentSetting; });

        let settings1 = environmentSettings.find(x => x.id == patch.environment1.id);
        let settings2 = environmentSettings.find(x => x.id == patch.environment2.id);

        if (settings1 == undefined) {
            settings1 = { id: patch.environment1.id, order: patch.environment1.id } as EnvironmentSetting;
            environmentSettings.push(settings1);
        }

        if (settings2 == undefined) {
            settings2 = { id: patch.environment2.id, order: patch.environment2.id } as EnvironmentSetting;
            environmentSettings.push(settings2);
        }

        const settingsOrder1 = settings1.order;
        settings1.order = settings2.order;
        settings2.order = settingsOrder1;

        ctx.patchState({
            environmentSettings: environmentSettings
        });

        await this.vssService.setEnvironmentSettings(environmentSettings);
    }
}