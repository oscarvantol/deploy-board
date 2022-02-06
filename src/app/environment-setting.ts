export class EnvironmentSettings {
    id: string = "environment-settings"
    environmentSettings = [] as EnvironmentSetting[];
}

export class EnvironmentSetting {
    public id: number = 0;
    public order: number = 0;
};