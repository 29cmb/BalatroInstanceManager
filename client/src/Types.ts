export type Profile = { 
    name: string, 
    DateCreated: number, 
    TimePlayed: number, 
    LastPlayed: number, 
    Icon: string, 
    Mods: ({ name: string, author: string, icon: string, tag: string, path: string } | { name: string, path: string })[] 
}

declare global {
    interface Window {
        electron: {
            launchInstance: (arg: string) => Promise<void>;
            killInstance: (arg: string) => Promise<void>;
            getProfile: (arg: string) => Promise<Profile>;
            getAllProfiles: () => Promise<Profile[]>;
            getProfileInfo: (arg: string) => Promise<Profile>;
            isInstanceActive: (arg: string) => Promise<boolean>;
            deleteMod: (arg: string, arg2: string) => Promise<void>,
            onLogEvent: (callback: (data: { type: string, message: string }) => void) => Promise<void>,
            getConfigurationTextPlaceholder: (field: string) => Promise<string>,
            validatePathType: (path: string, type: string) => Promise<true | string>,
            checkPathValidations: () => Promise<boolean>,
            updateConfigField: (key: string, value: string) => Promise<void>
        };
    }
}