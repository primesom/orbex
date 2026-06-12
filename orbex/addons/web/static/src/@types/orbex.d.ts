interface OrbexModuleErrors {
    cycle?: string | null;
    failed?: Set<string>;
    missing?: Set<string>;
    unloaded?: Set<string>;
}

interface OrbexModuleFactory {
    deps: string[];
    fn: OrbexModuleFactoryFn;
    ignoreMissingDeps: boolean;
}

class OrbexModuleLoader {
    bus: EventTarget;
    checkErrorProm: Promise<void> | null;
    debug: boolean;
    /**
     * Mapping [name => factory]
     */
    factories: Map<string, OrbexModuleFactory>;
    /**
     * Names of failed modules
     */
    failed: Set<string>;
    /**
     * Names of modules waiting to be started
     */
    jobs: Set<string>;
    /**
     * Mapping [name => module]
     */
    modules: Map<string, OrbexModule>;

    constructor(root?: HTMLElement);

    addJob: (name: string) => void;

    define: (
        name: string,
        deps: string[],
        factory: OrbexModuleFactoryFn,
        lazy?: boolean
    ) => OrbexModule;

    findErrors: (jobs?: Iterable<string>) => OrbexModuleErrors;

    findJob: () => string | null;

    reportErrors: (errors: OrbexModuleErrors) => Promise<void>;

    sortFactories: () => void;

    startModule: (name: string) => OrbexModule;

    startModules: () => void;
}

type OrbexModule = Record<string, any>;

type OrbexModuleFactoryFn = (require: (dependency: string) => OrbexModule) => OrbexModule;

declare const orbex: {
    csrf_token: string;
    debug: string;
    define: OrbexModuleLoader["define"];
    loader: OrbexModuleLoader;
};
