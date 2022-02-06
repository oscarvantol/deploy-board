
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as SDK from "azure-devops-extension-sdk";
import { getClient, CommonServiceIds, IProjectPageService, IProjectInfo, IExtensionDataService, IExtensionDataManager } from "azure-devops-extension-api";
import { EnvironmentDeploymentExecutionRecord, EnvironmentInstance, TaskAgentRestClient, } from "azure-devops-extension-api/TaskAgent";
import { BuildDefinition, BuildDefinitionReference, BuildRestClient, BuildStatus } from "azure-devops-extension-api/Build";
import { EnvironmentSetting, EnvironmentSettings } from './environment-setting';


@Injectable({
    providedIn: 'root'
})
export class VssService {
    project: IProjectInfo = { name: "" } as IProjectInfo;
    private _extensionDataManager?: IExtensionDataManager;

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
        const project = await projectService.getProject();
        if (project)
            this.project = project;

        await this.initDataManager();
    }

    private async initDataManager() {
        let dataService = await SDK.getService<IExtensionDataService>(CommonServiceIds.ExtensionDataService);
        let extensionContext = SDK.getExtensionContext();
        this._extensionDataManager = await dataService.getExtensionDataManager(`${extensionContext.publisherId}.${extensionContext.extensionId}`, await SDK.getAccessToken());
    }

    public async getEnvironments() {
        if (!this.online)
            return this.loadTestEnvironments();

        await SDK.ready();
        const client = getClient(TaskAgentRestClient);
        return await client.getEnvironments(this.project.name, undefined, undefined, 500);
    }

    public async getEnvironmentDeploymentExecutionRecords(environmentId: number) {
        if (!this.online)
            return this.loadTestEnvironmentDeploymentRecords(environmentId);

        await SDK.ready();
        const client = getClient(TaskAgentRestClient);
        return await client.getEnvironmentDeploymentExecutionRecords(this.project.name, environmentId);
    }

    public async getBuildsInProgress() {
        const client = getClient(BuildRestClient);
        return await client.getBuilds(this.project.name, undefined, undefined, undefined, undefined, undefined, undefined, undefined,
            BuildStatus.InProgress);
    }

    public async getBuildDefinitions() {
        if (!this.online)
            return this.loadTestBuildDefinitions()

        const client = getClient(BuildRestClient);
        return await client.getDefinitions(this.project.name);
    }

    public async getOrCreateEnvironmentSettings(environments: EnvironmentInstance[]) {
        if (!this.online)
            return this.loadTestEnvironmentSettings(environments);

        const settings = (await this.getEnvironmentSettings())?.environmentSettings;

        if (settings == undefined)
            return await (await this.setEnvironmentSettings(environments.map(x => { return { id: x.id, order: x.id } as EnvironmentSetting; }))).environmentSettings;

        return settings;
    }

    private async getEnvironmentSettings() {
        return (await this._extensionDataManager?.getDocument('deploy-board', 'environment-settings')
            .catch(err => undefined) as EnvironmentSettings | undefined);
    }

    public async setEnvironmentSettings(value: EnvironmentSetting[]) {
        const document = await this.getEnvironmentSettings() ?? { id: 'environment-settings', environmentSettings: value };
        document.environmentSettings = value;
        return await this._extensionDataManager?.setDocument('deploy-board', document) as EnvironmentSettings;
    }

    private loadTestEnvironmentSettings(environments: EnvironmentInstance[]) {
        return environments.map(x => { return { id: x.id, order: x.id } as EnvironmentSetting; });
    }

    private loadTestEnvironments() {
        return this.httpClient.get("./test-data/environments.json").toPromise() as Promise<EnvironmentInstance[]>
    }

    private loadTestBuildDefinitions() {
        return this.httpClient.get("./test-data/definitions.json").toPromise() as Promise<BuildDefinitionReference[]>
    }

    private loadTestEnvironmentDeploymentRecords(environmentId: number) {
        return this.httpClient.get(`./test-data/environmentdeploymentrecords${environmentId}.json`).toPromise() as Promise<EnvironmentDeploymentExecutionRecord[]>
    }
}
