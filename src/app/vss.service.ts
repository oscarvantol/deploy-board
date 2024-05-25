
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as SDK from "azure-devops-extension-sdk";
import { getClient, CommonServiceIds, IProjectPageService, IProjectInfo, IExtensionDataService, IExtensionDataManager } from "azure-devops-extension-api";
import { EnvironmentDeploymentExecutionRecord, EnvironmentInstance, TaskAgentRestClient, } from "azure-devops-extension-api/TaskAgent";
import { Build, Timeline, BuildDefinition, BuildDefinitionReference, BuildRestClient, BuildStatus, BuildQueryOrder } from "azure-devops-extension-api/Build";
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

    public async getBuilds(buildStatus: BuildStatus | undefined) {
        let definitions = undefined;
        let queues = undefined;
        let buildNumber = undefined;
        let minTime = undefined;
        let maxTime = undefined;
        let requestedFor = undefined;
        let reasonFilter = undefined;
        let statusFilter = buildStatus;
        let resultFilter = undefined;
        let tagFilters = undefined;
        let properties = undefined;
        let top = undefined;
        let continuationToken = undefined;
        let maxBuildsPerDefinition = 5;
        let deletedFilter = undefined;
        let queryOrder = BuildQueryOrder.StartTimeDescending;
        let branchNames = ['refs/heads/master', 'refs/heads/main'];
        let buildIds = undefined;
        let repositoryId = undefined
        let repositoryType = undefined

        if (!this.online)
            return this.loadTestBuilds();

        const client = getClient(BuildRestClient);
        var results: Build[] = [];
        for (let i = 0; i < branchNames.length; i++) {
            let branchName = branchNames[i];
            let result = await client.getBuilds(this.project.name, definitions, queues, buildNumber, minTime, maxTime, requestedFor, reasonFilter, statusFilter, resultFilter, tagFilters, properties, top, continuationToken, maxBuildsPerDefinition, deletedFilter, queryOrder, branchName, buildIds, repositoryId, repositoryType);
            results = [...results, ...result]
        }

        //Filter out builds that are not in progress and older than 30 days
        var minimumTime = new Date().getTime() - 30 * 24 * 60 * 60 * 1000;
        return results.filter(x => x.status == BuildStatus.InProgress || new Date(x.startTime).getTime() > minimumTime);
    }

    public async getBuildTimeline(buildId: number) {
        if (!this.online)
            return this.loadTestTimeline(buildId);

        const client = getClient(BuildRestClient);
        return await client.getBuildTimeline(this.project.name, buildId);
    }

    // public async getBuildDefinitions() {
    //     if (!this.online)
    //         return this.loadTestBuildDefinitions()

    //     const client = getClient(BuildRestClient);
    //     return await client.getDefinitions(this.project.name);
    // }

    // public async getOrCreateEnvironmentSettings(environments: EnvironmentInstance[]) {
    //     if (!this.online)
    //         return this.loadTestEnvironmentSettings(environments);

    //     const settings = (await this.getEnvironmentSettings())?.environmentSettings;

    //     if (settings == undefined)
    //         return await (await this.setEnvironmentSettings(environments.map(x => { return { id: x.id, order: x.id } as EnvironmentSetting; }))).environmentSettings;

    //     return settings;
    // }

    // private async getEnvironmentSettings() {
    //     return (await this._extensionDataManager?.getDocument('deploy-board', 'environment-settings')
    //         .catch(err => undefined) as EnvironmentSettings | undefined);
    // }

    // public async setEnvironmentSettings(value: EnvironmentSetting[]) {
    //     const document = await this.getEnvironmentSettings() ?? { id: 'environment-settings', environmentSettings: value };
    //     document.environmentSettings = value;
    //     return await this._extensionDataManager?.setDocument('deploy-board', document) as EnvironmentSettings;
    // }

    // private loadTestEnvironmentSettings(environments: EnvironmentInstance[]) {
    //     return environments.map(x => { return { id: x.id, order: x.id } as EnvironmentSetting; });
    // }

    // private loadTestEnvironments() {
    //     return this.httpClient.get("./test-data/environments.json").toPromise() as Promise<EnvironmentInstance[]>
    // }

    // private loadTestBuildDefinitions() {
    //     return this.httpClient.get("./test-data/definitions.json").toPromise() as Promise<BuildDefinitionReference[]>
    // }

    // private loadTestEnvironmentDeploymentRecords(environmentId: number) {
    //     return this.httpClient.get(`./test-data/environmentdeploymentrecords${environmentId}.json`).toPromise() as Promise<EnvironmentDeploymentExecutionRecord[]>
    // }

    private loadTestBuilds() {
        return this.httpClient.get(`./test-data/buildsinprogress.json`).toPromise() as Promise<Build[]>
    }
    private loadTestTimeline(buildId: number) {
        return this.httpClient.get(`./test-data/builds/timeline/${buildId}.timeline.json`).toPromise() as Promise<Timeline>
    }

}
