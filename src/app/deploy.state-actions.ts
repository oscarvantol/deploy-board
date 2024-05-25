import { BuildStatus } from "azure-devops-extension-api/Build";

export namespace DeployStateActions {
    export class LoadPipelines {
        static readonly type = `[DeployStateActions] LoadPipelines`;
        constructor(public buildStatus: BuildStatus) {
        }
    }

    export class LoadTimeline {
        static readonly type = `[DeployStateActions] LoadTimeline`;
        constructor(public buildId: number) {
        }
    }

}