import * as T from "hella-types";
const { paths } = require('../constants.json');
const { apiUrl } = require('../../config.json');

type RouteParams = {
    route: string,
    query?: string,
    filter?: SearchV2Filter,
    limit?: number,
    include?: string[],
    exclude?: string[]
    sort?: SortParams;
}
type SortParams = {
    [field: string]: "asc" | "desc";
};
type SingleParams = {
    query: string;
    include?: string[];
    exclude?: string[];
};
type AllParams = {
    limit?: number;
    include?: string[];
    exclude?: string[];
    sort?: SortParams;
};
type MatchParams = {
    query: string;
    limit?: number;
    include?: string[];
    exclude?: string[];
    sort?: SortParams;
};
type SearchV2Filter = {
    [key: string]: any | SearchV2Filter | any[];
};
type SearchV2Params = {
    filter: SearchV2Filter;
    limit?: number;
    include?: string[];
    exclude?: string[];
    sort?: SortParams;
};
type ObjectMap = {
    'archetype': string;
    'base': T.Base;
    'cc': T.CCStageLegacy;
    'ccb': T.CCSeason;
    'ccb/legacy': T.CCStageLegacy;
    'ccb/stage': T.CCStage;
    'define': T.Definition;
    'deployable': T.Deployable;
    'enemy': T.Enemy;
    'event': T.GameEvent;
    'gacha': T.GachaPool;
    'item': T.Item;
    'module': T.Module;
    'operator': T.Operator;
    'paradox': T.Paradox;
    'range': T.GridRange;
    'rogue': T.RogueTheme;
    'rogue/stage/0': T.RogueStage;
    'rogue/stage/1': T.RogueStage;
    'rogue/stage/2': T.RogueStage;
    'rogue/stage/3': T.RogueStage;
    'rogue/toughstage/0': T.RogueStage;
    'rogue/toughstage/1': T.RogueStage;
    'rogue/toughstage/2': T.RogueStage;
    'rogue/toughstage/3': T.RogueStage;
    'rogue/relic/0': T.RogueRelic;
    'rogue/relic/1': T.RogueRelic;
    'rogue/relic/2': T.RogueRelic;
    'rogue/relic/3': T.RogueRelic;
    'rogue/variation/0': T.RogueVariation;
    'rogue/variation/1': T.RogueVariation;
    'rogue/variation/2': T.RogueVariation;
    'rogue/variation/3': null;
    'sandbox': T.SandboxAct;
    'sandbox/stage/0': T.SandboxStage;
    'sandbox/item/0': T.SandboxItem;
    'sandbox/weather/0': T.SandboxWeather;
    'skill': T.Skill;
    'skin': T.Skin;
    'stage': T.Stage[];
    'toughstage': T.Stage[];
};

class PathBuilder {
    private path: string;
    private paramed = false;
    constructor() {
        this.path = apiUrl ?? paths.apiUrl;
    }
    public route(route: string) {
        this.path += `/${route}`;
        return this;
    }
    public param(field: string, query: string) {
        if (!this.paramed) {
            this.path += `?${field}=${query}`;
            this.paramed = true;
        }
        else {
            this.path += `&${field}=${query}`;
        }
    }
    public include(include: string[]) {
        include?.forEach(inc => this.param('include', inc));
        return this;
    }
    public exclude(exclude: string[]) {
        exclude?.forEach(exc => this.param('exclude', exc));
        return this;
    }
    public sort(sort: SortParams) {
        if (sort) this.param('sort', JSON.stringify(sort));
        return this;
    }
    public limit(limit: number) {
        if (limit) this.param('limit', limit.toString());
        return this;
    }
    public filter(filter: SearchV2Filter) {
        if (filter) this.param('filter', JSON.stringify(filter));
        return this;
    }
    public toString() {
        return this.path;
    }
}

export async function about() {
    const path = new PathBuilder().route('about').toString();
    const res = await fetch(path);
    if (!res.ok) return null;
    return (await res.json())[0];
}

export async function newEn({ include, exclude }: { include?: string[], exclude?: string[] } = {}) {
    const path = new PathBuilder()
        .route('new')
        .include(include)
        .exclude(exclude)
        .toString();
    const res = await fetch(path);
    if (!res.ok) return null;
    return (await res.json());
}

export async function recruitPool() {
    const path = new PathBuilder().route('recruitpool').toString();
    const res = await fetch(path);
    if (!res.ok) return null;
    return (await res.json())[0];
}

export async function single<T extends keyof ObjectMap>(route: T, { query, include, exclude }: SingleParams): Promise<ObjectMap[T]> {
    const _single = async ({ route, query, include, exclude }: RouteParams): Promise<ObjectMap[T]> => {
        const pathB = new PathBuilder()
            .route(`${route}/${encodeURIComponent(query)}`)
            .include(include)
            .exclude(exclude);
        const res = await fetch(pathB.toString());
        if (!res.ok) return null;
        return (await res.json()).value;
    }

    const res = await _single({ route, query, include, exclude });
    if (res) return res;
    return await _single({ route: `cn/${route}`, query, include, exclude });
}

export async function all<T extends keyof ObjectMap>(route: T, { limit, include, exclude, sort }: AllParams = {}): Promise<ObjectMap[T][]> {
    const _all = async ({ route, limit, include, exclude, sort }: RouteParams): Promise<ObjectMap[T][]> => {
        const pathB = new PathBuilder()
            .route(route)
            .limit(limit)
            .include(include)
            .exclude(exclude)
            .sort(sort);
        const res = await fetch(pathB.toString());
        if (!res.ok) return null;
        return (await res.json()).map(datum => datum.value);
    }

    const res = await _all({ route, limit, include, exclude, sort });
    if (res) return res;
    return await _all({ route: `cn/${route}`, limit, include, exclude, sort });
}

export async function match<T extends keyof ObjectMap>(route: T, { query, limit, include, exclude, sort }: MatchParams): Promise<ObjectMap[T][]> {
    const _match = async ({ route, query, limit, include, exclude, sort }: RouteParams): Promise<ObjectMap[T][]> => {
        if (query === '') return [];
        const pathB = new PathBuilder()
            .route(`${route}/match/${encodeURIComponent(query)}`)
            .limit(limit)
            .include(include)
            .exclude(exclude)
            .sort(sort);
        const res = await fetch(pathB.toString());
        if (!res.ok) return null;
        return (await res.json()).map(datum => datum.value);
    }

    const res = await _match({ route, query, limit, include, exclude, sort });
    if (res) return res;
    return await _match({ route: `cn/${route}`, query, limit, include, exclude, sort });
}

export async function searchV2<T extends keyof ObjectMap>(route: T, { filter, limit, include, exclude, sort }: SearchV2Params): Promise<ObjectMap[T][]> {
    const _searchV2 = async ({ route, filter, limit, include, exclude, sort }: RouteParams): Promise<ObjectMap[T][]> => {
        if (!filter) return [];
        const pathB = new PathBuilder()
            .route(`${route}/searchV2`)
            .filter(filter)
            .limit(limit)
            .include(include)
            .exclude(exclude)
            .sort(sort);
        const res = await fetch(pathB.toString());
        if (!res.ok) return null;
        return (await res.json()).map(datum => datum.value);
    }

    const res = await _searchV2({ route, filter, limit, include, exclude, sort });
    if (res) return res;
    return await _searchV2({ route: `cn/${route}`, filter, limit, include, exclude, sort });
}
