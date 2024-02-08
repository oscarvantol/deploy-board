import { EnvironmentInstance } from "azure-devops-extension-api/TaskAgent";

export namespace DeployStateActions {
    export class LoadPipelines {
        static readonly type = `[DeployStateActions] LoadPipelines`;
    }

    export class LoadTimeline {
        static readonly type = `[DeployStateActions] LoadTimeline`;
        constructor(public buildId: number) {
        }
    }

    export class SwapEnvironmentOrder {
        static readonly type = `[DeployStateActions] SwapEnvironmentOrder`;
        constructor(public environment1: EnvironmentInstance, public environment2: EnvironmentInstance) {
        }
    }
}