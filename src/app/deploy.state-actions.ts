import { EnvironmentInstance } from "azure-devops-extension-api/TaskAgent";

export namespace DeployStateActions {
    export class Initialize {
        static readonly type = `[DeployStateActions] Initialize`;
    }

    export class SwapEnvironmentOrder {
        static readonly type = `[DeployStateActions] SwapEnvironmentOrder`;
        constructor(public environment1: EnvironmentInstance, public environment2: EnvironmentInstance) {
        }
    }
}