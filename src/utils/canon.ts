import * as T from 'hella-types';
const { gameConsts } = require('../constants');

export class CCSeason {
    static isValid(season: T.CCSeason): boolean {
        return !!season;
    }
}

export class CCStage {
    static isValid(stage: T.CCStage): boolean {
        return !!stage && !!stage.excel && !!stage.levels;
    }
}

export class CCStageLegacy {
    static isValid(stage: T.CCStageLegacy): boolean {
        return !!stage && !!stage.const && !!stage.levels;
    }
}

export class Definition {
    static isValid(define: T.Definition): boolean {
        return !!define;
    }
}

export class Deployable {
    static isValid(deploy: T.Deployable): boolean {
        return !!deploy;
    }
    static clampSkillIndex(deploy: T.Deployable, skill: number): number {
        if (skill < 0) return 0;
        const maxIndex = deploy.skills.findLastIndex(s => Skill.isValid(s));
        if (skill > maxIndex) return maxIndex;
        return skill;
    }
    static clampSkillHasDeployableIndex(deploy: T.Deployable, skill: number): number {
        const minIndex = deploy.skills.findIndex(s => Skill.isValid(s) && Skill.hasDeployable(s));
        if (skill < minIndex) return minIndex;
        const maxIndex = deploy.skills.findLastIndex(s => Skill.isValid(s) && Skill.hasDeployable(s));
        if (skill > maxIndex) return maxIndex;
        return skill;
    }
    static clampSkillLevelIndex(deploy: T.Deployable, skillLevel: number): number {
        if (skillLevel < 0) return 0;
        const maxLevel = deploy.skills.find(s => Skill.isValid(s)).excel.levels.length - 1;
        if (skillLevel > maxLevel) return maxLevel;
        return skillLevel;
    }
    static containsSkin(deploy: T.Deployable, skin: string): boolean {
        return skin === 'default' || deploy.skins.some(s => s.battleSkin.skinOrPrefabId.toLowerCase() === skin || s.displaySkin.skinName?.toLowerCase() === skin);
    }
    static hasPotentials(deploy: T.Deployable): boolean {
        return !!deploy.data.potentialRanks && !!deploy.data.potentialRanks.length;
    }
    static hasRange(deploy: T.Deployable): boolean {
        return !!deploy.range;
    }
    static hasStats(deploy: T.Deployable): boolean {
        return true;
    }
    static hasSkills(deploy: T.Deployable): boolean {
        return !!deploy.skills && !!deploy.skills.length && deploy.skills.some(s => Skill.isValid(s));
    }
    static hasSkins(deploy: T.Deployable): boolean {
        return !!deploy.skins && !!deploy.skins.length;
    }
    static hasTalents(deploy: T.Deployable): boolean {
        return !!deploy.data.talents;
    }
    static hasTrait(deploy: T.Deployable): boolean {
        return !!deploy.data.trait;
    }
}

export class Enemy {
    static isValid(enemy: T.Enemy): boolean {
        return !!enemy;
    }
    static hasLevels(enemy: T.Enemy): boolean {
        return enemy.levels.Value.length > 1;
    }
}

export class GameEvent {
    static isCurrent(event: T.GameEvent): boolean {
        const currTime = Math.floor(Date.now() / 1000);
        return event.startTime < currTime && event.endTime > currTime;
    }
    static isFuture(event: T.GameEvent): boolean {
        const currTime = Math.floor(Date.now() / 1000);
        return event.startTime > currTime;
    }
}

export class GachaPool {
    static isCurrent(pool: T.GachaPool): boolean {
        const currTime = Math.floor(Date.now() / 1000);
        return pool.client.openTime < currTime && pool.client.endTime > currTime;
    }
    static isFuture(pool: T.GachaPool): boolean {
        const currTime = Math.floor(Date.now() / 1000);
        return pool.client.openTime > currTime;
    }
    static isJointOperation(pool: T.GachaPool): boolean {
        return pool.client.gachaPoolName === 'Joint Operation';
    }
    static isNormal(pool: T.GachaPool): boolean {
        return !this.isJointOperation(pool) && ['NORMAL', 'DOUBLE', 'CLASSIC', 'CLASSIC_DOUBLE', 'LINKAGE', 'LIMITED', 'SINGLE'].includes(pool.client.gachaRuleType);
    }
}

export class Item {
    static isValid(item: T.Item): boolean {
        return !!item;
    }
    static hasFormula(item: T.Item): boolean {
        return !!item.formula && !!item.formula.costs.length;
    }
}

export class Module {
    static isDefault(module: T.Module): boolean {
        return module.info.uniEquipId.includes('uniequip_001');
    }
    static isValid(module: T.Module): boolean {
        return !!module;
    }
}

export class Operator extends Deployable {
    static isValid(op: T.Operator): boolean {
        return !!op;
    }
    static clampModuleLevelIndex(op: T.Operator, module: number): number {
        if (module < 0) return 0;
        const maxIndex = op.modules.find(m => Module.isValid(m)).data.phases.length - 1;
        if (module > maxIndex) return maxIndex;
        return module;
    }
    static clampSkinIndex(op: T.Operator, skin: number): number {
        if (skin < 0) return 0;
        const maxIndex = op.skins.findLastIndex(s => Skin.isValid(s));
        if (skin > maxIndex) return maxIndex;
        return skin;
    }
    static hasBases(op: T.Operator): boolean {
        return !!op.bases && !!op.bases.length;
    }
    static hasCosts(op: T.Operator): boolean {
        return gameConsts.rarity[op.data.rarity] > 1;
    }
    static hasDeployables(op: T.Operator): boolean {
        return !!op.data.displayTokenDict && Object.values(op.data.displayTokenDict).every(s => s);
    }
    static hasModules(op: T.Operator): boolean {
        return !!op.modules && !!op.modules.length;
    }
    static hasParadox(op: T.Operator): boolean {
        return !!op.paradox;
    }
}

export class Paradox {
    static clampIndex(index: number): number {
        if (index < 0) return 0;
        if (index > 1) return 0;
        return index;
    }
}

export class RogueRelic {
    static isValid(relic: T.RogueRelic): boolean {
        return !!relic;
    }
}

export class RogueStage {
    static isChallenge(stage: T.RogueStage): boolean {
        return stage.excel.difficulty !== 'NORMAL';
    }
    static isValid(stage: T.RogueStage): boolean {
        return !!stage && !!stage.excel && !!stage.levels;
    }
}

export class RogueVariation {
    static isValid(variation: T.RogueVariation): boolean {
        return !!variation;
    }
}

export class SandboxItem {
    static isValid(item: T.SandboxItem): boolean {
        return !!item;
    }
}

export class SandboxStage {
    static isValid(stage: T.SandboxStage): boolean {
        return !!stage && !!stage.excel && !!stage.levels;
    }
}

export class SandboxWeather {
    static isValid(weather: T.SandboxWeather): boolean {
        return !!weather;
    }
}

export class Skill {
    static isValid(skill: T.Skill): boolean {
        return !!skill && !!skill.excel;
    }
    static hasDeployable(skill: T.Skill): boolean {
        return !!skill.deploy && !!skill.deploy.overrideTokenKey;
    }
}

export class Skin {
    static isValid(skin: T.Skin): boolean {
        return !!skin;
    }
}

export class Stage {
    static isChallenge(stage: T.Stage): boolean {
        return stage.excel.diffGroup === 'TOUGH' || stage.excel.difficulty === 'FOUR_STAR';
    }
    static isValid(stage: T.Stage): boolean {
        return !!stage && !!stage.excel && !!stage.levels;
    }
    static clampIndex(index: number): number {
        if (index < 0) return 0;
        if (index > 1) return 1;
        return index;
    }
}