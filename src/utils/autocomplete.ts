import * as T from "hella-types";
import Command from "../structures/Command";
import HellaBot from '../structures/HellaBot';
import * as api from "./api";
const { gameConsts } = require('../constants');

type AutocompleteParams = {
    query: string;
    include?: string[];
};
type rogueTheme = 0 | 1 | 2 | 3;
type sandTheme = 0;
const limit = 6;
const splitMatch = (str: string, query: string) => str.toLowerCase().includes(query.toLowerCase()) || str.toLowerCase().split('\'').join('').includes(query.toLowerCase());

export function autocompleteCC(query: string, callback: (e: T.CCStageLegacy['const']) => boolean = () => true) {
    const matchQuery = (stage: T.CCStageLegacy['const']) => splitMatch(stage.name, query) || splitMatch(stage.location, query) || splitMatch(stage.levelId.split('/')[2], query);

    return gameConsts.ccStages
        .filter(stage => callback(stage) && matchQuery(stage))
        .slice(0, limit)
        .map(stage => ({ name: `${stage.location} - ${stage.name}`, value: stage.levelId.split('/')[stage.levelId.split('/').length - 1] }));
}
export function autocompleteCCBLegacy(query: string, callback: (e: T.CCStageLegacy['const']) => boolean = () => true) {
    const matchQuery = (stage: T.CCStageLegacy['const']) => splitMatch(stage.name, query) || splitMatch(stage.location, query) || splitMatch(stage.levelId.split('/')[2], query);

    return gameConsts.ccbStages
        .filter(stage => callback(stage) && matchQuery(stage))
        .slice(0, limit)
        .map(stage => ({ name: `${stage.location} - ${stage.name}`, value: stage.levelId.split('/')[stage.levelId.split('/').length - 1] }));
}
export async function autocompleteCCB({ query, include = [] }: AutocompleteParams, callback: (e: T.CCStage) => boolean = () => true) {
    const requiredInclude = ['excel.code', 'excel.name', 'excel.stageId'];

    return (await api.match('ccb/stage', { query, include: requiredInclude.concat(include) }))
        .filter(callback)
        .slice(0, limit)
        .map(stage => ({ name: `${stage.excel.code} - ${stage.excel.name}`, value: stage.excel.stageId }));
}
export async function autocompleteDefine({ query, include = [] }: AutocompleteParams, callback: (e: T.Definition) => boolean = () => true) {
    const requiredInclude = ['termId', 'termName'];

    return (await api.match('define', { query, include: requiredInclude.concat(include) }))
        .filter(callback)
        .slice(0, limit)
        .map(define => ({ name: define.termName, value: define.termId }));
}
export async function autocompleteDeployable({ query, include = [] }: AutocompleteParams, callback: (e: T.Deployable) => boolean = () => true) {
    const requiredInclude = ['id', 'data.name'];

    return (await api.match('deployable', { query, include: requiredInclude.concat(include) }))
        .filter(callback)
        .slice(0, limit)
        .map(deploy => ({ name: deploy.data.name, value: deploy.id }));
}
export async function autocompleteEnemy({ query, include = [] }: AutocompleteParams, callback: (e: T.Enemy) => boolean = () => true) {
    const requiredInclude = ['excel.enemyId', 'excel.name', 'excel.enemyIndex'];

    return (await api.match('enemy', { query, include: requiredInclude.concat(include) }))
        .filter(callback)
        .slice(0, limit)
        .map(enemy => ({ name: `${enemy.excel.enemyIndex} - ${enemy.excel.name}`, value: enemy.excel.enemyId }));
}
export async function autocompleteHelp(query: string, callback: (e: Command) => boolean = () => true) {
    const matchQuery = (command: Command) => splitMatch(command.name, query);

    return Array.from(HellaBot.commands
        .filter(command => callback(command) && matchQuery(command))
        .values())
        .slice(0, limit)
        .map(command => ({ name: command.name, value: command.name.toLowerCase() }))
}
export async function autocompleteRogueRelic(theme: rogueTheme, { query, include = [] }: AutocompleteParams, callback: (e: T.RogueRelic) => boolean = () => true) {
    const requiredInclude = ['id', 'name'];

    return (await api.match(`rogue/relic/${theme}`, { query, include: requiredInclude.concat(include) }))
        .filter(callback)
        .slice(0, limit)
        .map(relic => ({ name: relic.name, value: relic.id }));
}
export async function autocompleteRogueStage(theme: rogueTheme, { query, include = [] }: AutocompleteParams, callback: (e: T.RogueStage) => boolean = () => true) {
    const requiredInclude = ['excel.id', 'excel.code', 'excel.name'];

    return (await api.match(`rogue/stage/${theme}`, { query, include: requiredInclude.concat(include) }))
        .filter(callback)
        .slice(0, limit)
        .map(stage => ({ name: `${stage.excel.code} - ${stage.excel.name}`, value: stage.excel.id }));
}
export async function autocompleteRogueToughStage(theme: rogueTheme, { query, include = [] }: AutocompleteParams, callback: (e: T.RogueStage) => boolean = () => true) {
    const requiredInclude = ['excel.id', 'excel.code', 'excel.name'];

    return (await api.match(`rogue/toughstage/${theme}`, { query, include: requiredInclude.concat(include) }))
        .filter(callback)
        .slice(0, limit)
        .map(stage => ({ name: `${stage.excel.code} - ${stage.excel.name}`, value: stage.excel.id }));
}
export async function autocompleteRogueVariation(theme: rogueTheme, { query, include = [] }: AutocompleteParams, callback: (e: T.RogueVariation) => boolean = () => true) {
    const requiredInclude = ['id', 'outerName'];

    return (await api.match(`rogue/variation/${theme}`, { query: query, include: requiredInclude.concat(include) }))
        .filter(callback)
        .slice(0, limit)
        .map(variation => ({ name: variation.outerName, value: variation.id }));
}
export async function autocompleteSandboxItem(act: sandTheme, { query, include = [] }: AutocompleteParams, callback: (e: T.SandboxItem) => boolean = () => true) {
    const requiredInclude = ['data.itemId', 'data.itemName'];

    return (await api.match(`sandbox/item/${act}`, { query, include: requiredInclude.concat(include) }))
        .filter(callback)
        .slice(0, limit)
        .map(item => ({ name: item.data.itemName, value: item.data.itemId }));
}
export async function autocompleteSandboxStage(act: sandTheme, { query, include = [] }: AutocompleteParams, callback: (e: T.SandboxStage) => boolean = () => true) {
    const requiredInclude = ['excel.stageId', 'excel.name', 'excel.code'];

    return (await api.match(`sandbox/stage/${act}`, { query, include: requiredInclude.concat(include) }))
        .filter(callback)
        .slice(0, limit)
        .map(stage => ({ name: `${stage.excel.code} - ${stage.excel.name}`, value: stage.excel.stageId }));
}
export async function autocompleteSandboxWeather(act: sandTheme, { query, include = [] }: AutocompleteParams, callback: (e: T.SandboxWeather) => boolean = () => true) {
    const requiredInclude = ['weatherId', 'name'];

    return (await api.match(`sandbox/weather/${act}`, { query, include: requiredInclude.concat(include) }))
        .filter(callback)
        .slice(0, limit)
        .map(weather => ({ name: weather.name, value: weather.weatherId }));
}
export async function autocompleteItem({ query, include = [] }: AutocompleteParams, callback: (e: T.Item) => boolean = () => true) {
    const requiredInclude = ['data.itemId', 'data.name'];

    return (await api.match('item', { query, include: requiredInclude.concat(include) }))
        .filter(callback)
        .slice(0, limit)
        .map(item => ({ name: item.data.name, value: item.data.itemId }));
}
export async function autocompleteOperator({ query, include = [] }: AutocompleteParams, callback: (e: T.Operator) => Boolean = () => true) {
    const requiredInclude = ['id', 'data.name'];

    return (await api.match('operator', { query, include: requiredInclude.concat(include) }))
        .filter(callback)
        .slice(0, limit)
        .map(op => ({ name: op.data.name, value: op.id }));
}
export async function autocompleteStage({ query, include = [] }: AutocompleteParams, callback: (e: T.Stage) => boolean = () => true) {
    const requiredInclude = ['excel.name', 'excel.code', 'excel.stageId'];

    return (await api.match('stage', { query, include: requiredInclude.concat(include) }))
        .filter(a => a.length === 1)
        .flat()
        .filter((item, index, self) => self.findIndex(t => t.excel.stageId === item.excel.stageId) === index)
        .filter(callback)
        .slice(0, limit)
        .map(stage => ({ name: `${stage.excel.code} - ${stage.excel.name}`, value: stage.excel.stageId }));
}
export async function autocompleteToughStage({ query, include = [] }: AutocompleteParams, callback: (e: T.Stage) => boolean = () => true) {
    const requiredInclude = ['excel.name', 'excel.code', 'excel.stageId'];

    return (await api.match('toughstage', { query, include: requiredInclude.concat(include) }))
        .filter(a => a.length === 1)
        .flat()
        .filter((item, index, self) => self.findIndex(t => t.excel.stageId === item.excel.stageId) === index)
        .filter(callback)
        .slice(0, limit)
        .map(stage => ({ name: `${stage.excel.code} - ${stage.excel.name}`, value: stage.excel.stageId }));
}