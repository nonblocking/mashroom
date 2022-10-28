

export type ActiveApp = {
    readonly dialogIdx: number;
    readonly appId: string;
}

export type SSRPreloadedState = {
    readonly activeApp: ActiveApp;
}
