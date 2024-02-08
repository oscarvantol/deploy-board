import { Injectable } from '@angular/core';
import { Action, createSelector, Selector, State, StateContext } from '@ngxs/store';
import { Build, BuildDefinitionReference, Timeline } from 'azure-devops-extension-api/Build';
import { EnvironmentDeploymentExecutionRecord, TaskOrchestrationOwner, EnvironmentInstance } from "azure-devops-extension-api/TaskAgent";
import { DeployStateActions } from './deploy.state-actions';
import { EnvironmentSetting } from './environment-setting';
import { VssService } from './vss.service';

export interface DeployStateModel {
    buildsInProgress: Build[],
    timelines: Map<number, Timeline>
}

@State<DeployStateModel>({
    name: "deployStateModel",
    defaults: {
        buildsInProgress: [],
        timelines: new Map<number, Timeline>()
    }
}
)
@Injectable()
export class DeployState {
    constructor(private readonly vssService: VssService) {

    }

    static getPipelines() {
        return createSelector([DeployState], (state: DeployStateModel) => {
            return state.buildsInProgress.map(e => e.definition).filter((e, i, a) => a.findIndex(f => f.id == e.id) == i).sort((a, b) => a.name < b.name ? -1 : 1);
        });
    }

    static getBuildInProgress(pipelineId: number) {
        return createSelector([DeployState], (state: DeployStateModel) => {
            return state.buildsInProgress.filter(e => e.definition.id == pipelineId).sort((a, b) => b.id - a.id);
        });
    }

    static getBuildTimeline(buildId: number) {
        return createSelector([DeployState], (state: DeployStateModel) => {
            return state.timelines.get(buildId);
        });
    }

    static getBuildStageTimeline(buildId: number) {
        return createSelector([DeployState], (state: DeployStateModel) => {
            return state.timelines.get(buildId)?.records.filter(e => e.type == "Stage").sort((a, b) => a.order - b.order) ?? [];
        });
    }

    @Action(DeployStateActions.LoadPipelines)
    async initialize(ctx: StateContext<DeployStateModel>, _: DeployStateActions.LoadPipelines) {
        await this.vssService.initialize();

        const buildsInProgress = await this.vssService.getBuildsInProgress();
        ctx.patchState({
            buildsInProgress: buildsInProgress

        });

        await Promise.all(buildsInProgress.map(e => {
            this.loadTimeline(ctx, new DeployStateActions.LoadTimeline(e.id));
        }));

    }

    @Action(DeployStateActions.LoadTimeline)
    async loadTimeline(ctx: StateContext<DeployStateModel>, params: DeployStateActions.LoadTimeline) {
        var timeLine = await this.vssService.getBuildTimeline(params.buildId);
        if (!timeLine)
            return;

        ctx.patchState({
            timelines: ctx.getState().timelines.set(params.buildId, timeLine)
        });
    }

}