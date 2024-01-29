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

    static getBuildInProgress() {
        return createSelector([DeployState], (state: DeployStateModel) => {
            return state.buildsInProgress;
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

    @Action(DeployStateActions.Initialize)
    async initialize(ctx: StateContext<DeployStateModel>, _: DeployStateActions.Initialize) {
        await this.vssService.initialize();

        const buildsInProgress = await this.vssService.getBuildsInProgress();
        ctx.patchState({
            buildsInProgress: buildsInProgress.sort((a, b) => a.definition.id - b.definition.id)
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