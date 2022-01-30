
import { Injectable } from '@angular/core';
import * as SDK from "azure-devops-extension-sdk";
import { getClient, CommonServiceIds, IProjectPageService, IProjectInfo } from "azure-devops-extension-api";
import { TaskAgentRestClient } from "azure-devops-extension-api/TaskAgent";
import { } from "azure-devops-extension-api/DistributedTaskCommon";



@Injectable({
    providedIn: 'root'
})
export class VssService {
    project?: IProjectInfo;

    public get online() {
        return document.domain !== "localhost";
    }

    constructor() {
        if (this.online)
            SDK.init();
    }

    public async initialize() {
        await SDK.ready();
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        this.project = await projectService.getProject();
    }

    public async getEnvironments() {
        await SDK.ready();
        const client = getClient(TaskAgentRestClient);
        return await client.getEnvironments(this.project?.name ?? "-", undefined, undefined, 500);
    }

    public async getEnvironmentDeploymentExecutionRecords(environmentId: number) {
        await SDK.ready();
        const client = getClient(TaskAgentRestClient);
        return await client.getEnvironmentDeploymentExecutionRecords(this.project?.name ?? "-", environmentId);
    }
}
