
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as SDK from "azure-devops-extension-sdk";
import { getClient, CommonServiceIds, IProjectPageService, IProjectInfo } from "azure-devops-extension-api";
import { EnvironmentDeploymentExecutionRecord, EnvironmentInstance, TaskAgentRestClient } from "azure-devops-extension-api/TaskAgent";
import { } from "azure-devops-extension-api/DistributedTaskCommon";
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class VssService {
    project?: IProjectInfo;

    public get online() {
        return document.domain !== "localhost";
    }

    constructor(private httpClient: HttpClient) {
        if (this.online)
            SDK.init();
    }

    public async initialize() {
        if (!this.online)
            return;

        await SDK.ready();
        const projectService = await SDK.getService<IProjectPageService>(CommonServiceIds.ProjectPageService);
        this.project = await projectService.getProject();
    }

    public async getEnvironments() {
        if (!this.online)
            return this.loadTestEnvironments();

        await SDK.ready();
        const client = getClient(TaskAgentRestClient);
        return await client.getEnvironments(this.project?.name ?? "-", undefined, undefined, 500);
    }

    public async getEnvironmentDeploymentExecutionRecords(environmentId: number) {
        if (!this.online)
            return this.loadTestEnvironmentDeploymentRecords(environmentId);

        await SDK.ready();
        const client = getClient(TaskAgentRestClient);
        return await client.getEnvironmentDeploymentExecutionRecords(this.project?.name ?? "-", environmentId);
    }

    private loadTestEnvironments() {
        return this.httpClient.get("./test-data/environments.json").toPromise() as Promise<EnvironmentInstance[]>
    }

    private loadTestEnvironmentDeploymentRecords(environmentId: number) {
        return this.httpClient.get(`./test-data/environmentdeploymentrecords${environmentId}.json`).toPromise() as Promise<EnvironmentDeploymentExecutionRecord[]>
    }
}
