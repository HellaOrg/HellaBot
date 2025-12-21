import * as Djs from 'discord.js';
import type * as T from "hella-types";
import { join } from 'path';
import HellaBot from '../structures/HellaBot';
import * as api from './api';
import * as C from './canon';
import * as pstats from './penguin-stats';
const { embedColour, paths, gameConsts } = require('../constants');

const blankChar = '\u200B';
const cleanFilename = (text: string) => text.split(/%|[#\+]|&|\[|\]/).join(''); // Remove special characters that discord doesn't like (%, #, etc.)
const createCustomId = (...args: (string | number | boolean)[]): string => args.join('ඞ').toLowerCase();
const removeStyleTags = (text: string) => text ? text.replace(/<.[a-z]{2,5}?\.[^<]+>|<\/[^<]*>|<color=[^>]+>/g, '') : ''; // cant use something like /<[^>]+>/g since stage hazards are also marked by <>, gotta be specific ¯\_(ツ)_/¯
const urlExists = async (url: string) => (await fetch(url)).status === 200;
function getItemEmoji(item: T.Item | string): string {
    if (typeof item === 'string')
        return HellaBot.emojis.get(item) ? `<:${item}:${HellaBot.emojis.get(item).id}>` : '';
    return HellaBot.emojis.get(item.data.iconId) ? `<:${item.data.iconId}:${HellaBot.emojis.get(item.data.iconId).id}>` : '';
}
function getOpPrettyName(op: T.Operator, { rarity = true, emoji = true, name = true } = {}): string {
    let string = '';
    if (rarity)
        string += `${gameConsts.rarity[op.data.rarity] + 1}★ `;
    if (emoji) {
        const opEmoji = HellaBot.getOperatorEmoji(op);
        string += opEmoji ? `<:${op.id}:${opEmoji.id}> ` : '';
    }
    if (name)
        string += op.data.name;
    return string;
}
function insertBlackboard(text: string, blackboard: T.Blackboard[]) {
    if (!text || text.length === 0) return '';

    const formatVariable = (chunk: string, blackboard: T.Blackboard[]) => {
        // {tag} {tag:0} {tag:0%} {tag:0.0} {tag:0.0%}
        const tag = chunk.split(':')[0].toLowerCase();
        const negative = tag.startsWith('-');
        const key = negative ? tag.slice(1) : tag;
        const variable = blackboard.find(variable => variable.key === key);

        if (!variable) return chunk;

        const value = negative ? -variable.value : variable.value;
        return chunk.charAt(chunk.length - 1) === '%' ? `\`${Math.round(value * 100)}%\`` : `\`${value}\``;
    }

    const textArr = removeStyleTags(text.trim()).split(/{|}/);
    for (let i = 0; i < textArr.length; i++) {
        textArr[i] = formatVariable(textArr[i], blackboard);
    }
    return textArr.join('').replaceAll('-`', '`-').replaceAll('+`', '`+');
}

export async function buildCCMessage(stage: T.CCStageLegacy, page: number): Promise<Djs.BaseMessageOptions> {
    const stageInfo = stage.const;
    const stageData = stage.levels;

    const title = `${stageInfo.location} - ${stageInfo.name}`;
    const description = removeStyleTags(stageInfo.description);

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setURL(`${paths.stageViewerUrl}?level=${stage.const.levelId.toLowerCase()}`)
        .setDescription(description);

    embed.addFields(await buildStageEnemyFields(stageData));

    const imageButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('cc', stage.const.name.toLowerCase(), 0))
        .setLabel('Preview')
        .setStyle(Djs.ButtonStyle.Primary);
    const diagramButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('cc', stage.const.name.toLowerCase(), 1))
        .setLabel('Diagram')
        .setStyle(Djs.ButtonStyle.Primary);
    const buttonRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(imageButton, diagramButton);

    switch (page) {
        case 0:
            imageButton.setDisabled(true);
            break;
        case 1:
            diagramButton.setDisabled(true);
            break;
    }

    if (page === 0) {
        const imagePath = paths.myAssetUrl + `/stages/${stageInfo.levelId.split('/')[stageInfo.levelId.split('/').length - 1]}.png`;
        if (await urlExists(imagePath)) {
            embed.setImage(imagePath)

            return { content: '', embeds: [embed], components: [buttonRow] };
        }
        else {
            embed.addFields(buildStageDiagramFields(stageData));

            return { content: '', embeds: [embed], components: [] };
        }
    }
    else {
        embed.addFields(buildStageDiagramFields(stageData));

        return { content: '', embeds: [embed], components: [buttonRow] };
    }
}
export async function buildCCBLegacyMessage(stage: T.CCStageLegacy, page: number): Promise<Djs.BaseMessageOptions> {
    const stageInfo = stage.const;
    const stageData = stage.levels;

    const title = `${stageInfo.location} - ${stageInfo.name}`;
    const description = removeStyleTags(stageInfo.description);

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setURL(`${paths.stageViewerUrl}?level=${stage.const.levelId.toLowerCase()}`)
        .setDescription(description);

    embed.addFields(await buildStageEnemyFields(stageData));

    const imageButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('ccb', stage.const.name.toLowerCase(), 0))
        .setLabel('Preview')
        .setStyle(Djs.ButtonStyle.Primary);
    const diagramButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('ccb', stage.const.name.toLowerCase(), 1))
        .setLabel('Diagram')
        .setStyle(Djs.ButtonStyle.Primary);
    const buttonRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(imageButton, diagramButton);

    switch (page) {
        case 0:
            imageButton.setDisabled(true);
            break;
        case 1:
            diagramButton.setDisabled(true);
            break;
    }

    if (page === 0) {
        const imagePath = paths.myAssetUrl + `/stages/${stageInfo.levelId.replace('level_', '').split('/')[stageInfo.levelId.replace('level_', '').split('/').length - 1]}.png`;
        if (await urlExists(imagePath)) {
            embed.setImage(imagePath)

            return { content: '', embeds: [embed], components: [buttonRow] };
        }
        else {
            embed.addFields(buildStageDiagramFields(stageData));

            return { content: '', embeds: [embed], components: [] };
        }
    }
    else {
        embed.addFields(buildStageDiagramFields(stageData));

        return { content: '', embeds: [embed], components: [buttonRow] };
    }
}
export async function buildCCBMessage(stage: T.CCStage, page: number): Promise<Djs.BaseMessageOptions> {
    const stageInfo = stage.excel;
    const stageData = stage.levels;

    const title = `${stageInfo.code} - ${stageInfo.name}`;
    const description = removeStyleTags(stageInfo.description);

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setURL(`${paths.stageViewerUrl}?level=${stage.excel.levelId.toLowerCase()}`)
        .setDescription(description);

    embed.addFields(await buildStageEnemyFields(stageData));

    const imageButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('ccb', stage.excel.name.toLowerCase(), 0))
        .setLabel('Preview')
        .setStyle(Djs.ButtonStyle.Primary);
    const diagramButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('ccb', stage.excel.name.toLowerCase(), 1))
        .setLabel('Diagram')
        .setStyle(Djs.ButtonStyle.Primary);
    const buttonRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(imageButton, diagramButton);

    switch (page) {
        case 0:
            imageButton.setDisabled(true);
            break;
        case 1:
            diagramButton.setDisabled(true);
            break;
    }

    if (page === 0) {
        const imagePath = paths.myAssetUrl + `/stages/${stageInfo.levelId.replace('level_', '').split('/')[stageInfo.levelId.replace('level_', '').split('/').length - 1]}.png`;
        if (await urlExists(imagePath)) {
            embed.setImage(imagePath)

            return { content: '', embeds: [embed], components: [buttonRow] };
        }
        else {
            embed.addFields(buildStageDiagramFields(stageData));

            return { content: '', embeds: [embed], components: [] };
        }
    }
    else {
        embed.addFields(buildStageDiagramFields(stageData));

        return { content: '', embeds: [embed], components: [buttonRow] };
    }
}
export async function buildCCSelectMessage(season: string): Promise<Djs.BaseMessageOptions> {
    const ccSelector = new Djs.StringSelectMenuBuilder()
        .setCustomId(createCustomId('cc', 'select'))
        .setPlaceholder('Select a stage!');
    const componentRow = new Djs.ActionRowBuilder<Djs.StringSelectMenuBuilder>().addComponents(ccSelector);

    const names: string[] = gameConsts.ccSeasons[season];
    for (const name of names) {
        ccSelector.addOptions(new Djs.StringSelectMenuOptionBuilder()
            .setLabel(name)
            .setValue(name.toLowerCase())
        );
    }

    return { content: `Please select a stage from CC#${season} below:`, components: [componentRow] };
}
export async function buildCCBLegacySelectMessage(season: string): Promise<Djs.BaseMessageOptions> {
    const ccbSelector = new Djs.StringSelectMenuBuilder()
        .setCustomId(createCustomId('ccb', 'select'))
        .setPlaceholder('Select a stage!');
    const componentRow = new Djs.ActionRowBuilder<Djs.StringSelectMenuBuilder>().addComponents(ccbSelector);

    const names: string[] = gameConsts.ccbSeasons[season];
    for (const name of names) {
        ccbSelector.addOptions(new Djs.StringSelectMenuOptionBuilder()
            .setLabel(name)
            .setValue(name.toLowerCase())
        );
    }

    return { content: `Please select a stage from CCB#${season} below:`, components: [componentRow] };
}
export async function buildCCBSelectMessage(season: T.CCSeason): Promise<Djs.BaseMessageOptions> {
    const ccbSelector = new Djs.StringSelectMenuBuilder()
        .setCustomId(createCustomId('ccb', 'select'))
        .setPlaceholder('Select a stage!');
    const componentRow = new Djs.ActionRowBuilder<Djs.StringSelectMenuBuilder>().addComponents(ccbSelector);

    const names: string[] = Object.values(season.stageDict).map(x => x.excel.name);
    for (const name of names) {
        ccbSelector.addOptions(new Djs.StringSelectMenuOptionBuilder()
            .setLabel(name)
            .setValue(name.toLowerCase())
        );
    }

    return { content: `Please select a stage from CCB#${season.seasonId[17]} below:`, components: [componentRow] };
}
export async function buildCurrentMessage(): Promise<Djs.BaseMessageOptions> {
    const skipLoginEvents = ['LOGIN_ONLY', 'CHECKIN_ONLY', 'FLOAT_PARADE', 'PRAY_ONLY', 'GRID_GACHA_V2', 'GRID_GACHA', 'BLESS_ONLY', 'CHECKIN_ACCESS'];
    const dailySupplyArr = [
        ["Aerial Threat", "Cargo Escort", "Fearless Protection", "Solid Defense", "Tactical Drill", "Tough Siege", "Unstoppable Charge"],
        ["Fierce Attack", "Resource Search", "Solid Defense", "Tactical Drill", "Tough Siege"],
        ["Aerial Threat", "Cargo Escort", "Fearless Protection", "Fierce Attack", "Tactical Drill"], ["Aerial Threat", "Fearless Protection", "Resource Search", "Tactical Drill", "Unstoppable Charge"],
        ["Cargo Escort", "Solid Defense", "Tactical Drill", "Tough Siege", "Unstoppable Charge"],
        ["Aerial Threat", "Fierce Attack", "Resource Search", "Solid Defense", "Tactical Drill"],
        ["Cargo Escort", "Fearless Protection", "Fierce Attack", "Resource Search", "Tactical Drill", "Tough Siege", "Unstoppable Charge"]
    ];
    const supplyDrops = {
        "Aerial Threat": "Skill Summaries",
        "Cargo Escort": "LMD",
        "Fearless Protection": "Guard & Specialist Chips",
        "Fierce Attack": "Caster & Sniper Chips",
        "Resource Search": "Furniture & Building Materials",
        "Solid Defense": "Medic & Defender Chips",
        "Tactical Drill": "Battle Records",
        "Tough Siege": "Purchase Certificates",
        "Unstoppable Charge": "Vanguard & Supporter Chips"
    };

    const now = new Date();
    const currTime = Math.floor(now.getTime() / 1000);
    const currBanners = (await api.searchV2('gacha', {
        filter: {
            'client.openTime': { '<=': currTime },
            'client.endTime': { '>=': currTime }
        },
        sort: { 'client.endTime': 'asc' },
        limit: 6
    }));
    const currEvents = (await api.searchV2('event', {
        filter: {
            'startTime': { '<=': currTime },
            'endTime': { '>=': currTime },
            'type': { 'nin': skipLoginEvents }
        },
        sort: { 'endTime': 'asc' },
        limit: 6
    }));
    const opNames = await api.all('operator', { include: ['id', 'data.name'] });

    const utc7Offset = -7 * 60; // UTC-7 offset in minutes
    const localTime = new Date(now.getTime() + (now.getTimezoneOffset() + utc7Offset) * 60000);
    const dailySupply = dailySupplyArr[localTime.getUTCDay()];

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle('Current Events and Banners')
        .setDescription(`**Current Date/Time: <t:${currTime}:F>**`);

    if (currEvents.length > 0) {
        for (const event of currEvents) {
            embed.addFields(buildEventField(event));
        }
    }
    if (currBanners.length > 0) {
        for (const banner of currBanners) {
            embed.addFields(buildBannerField(opNames, banner));
        }
    }

    const supplyString = dailySupply.map(s => `**${s}** - ${supplyDrops[s]}`).join('\n'); // todo: add emojis once those are done
    embed.addFields({ name: 'Today\'s Supply Stages', value: supplyString });

    return { embeds: [embed] };
}
export async function buildDefineMessage(definition: T.Definition): Promise<Djs.BaseMessageOptions> {
    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(definition.termName)
        .setDescription(removeStyleTags(definition.description));

    return { embeds: [embed] };
}
export async function buildDefineListMessage(): Promise<Djs.BaseMessageOptions> {
    let statusDescription = '', effectDescription = '', groupDescription = '';
    const dataArr = await api.all('define');
    for (const term of dataArr) {
        const termName = term.termName;
        const termArr = term.termId.split('.');

        switch (termArr[0]) {
            case 'ba':
                statusDescription += `${termName}\n`;
                break;
            case 'cc':
                switch (termArr[1]) {
                    case ('g'):
                    case ('tag'):
                    case ('gvial'):
                        groupDescription += `${termName}\n`;
                        break;
                    default:
                        effectDescription += `${termName}\n`;
                        break;
                }
                break;
        }
    }

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle('In-Game Terms and Groups')
        .addFields(
            { name: 'Status Effects', value: statusDescription, inline: true },
            { name: 'Base Effects', value: effectDescription, inline: true },
            { name: 'Base Groups', value: groupDescription, inline: true }
        );

    return { embeds: [embed] };
}
export async function buildDeployMessage(deploy: T.Deployable, type: number, level: number) {
    const typesDict = {
        stats: {
            label: 'Stats', index: 0, value: '0',
            enabled: C.Deployable.hasStats(deploy),
            extendedStats: true
        },
        skills: {
            label: 'Skills', index: 1, value: '1',
            enabled: C.Deployable.hasSkills(deploy),
            extendedStats: true
        }
    };
    const typesArr = Object.values(typesDict);

    const container = new Djs.ContainerBuilder().setAccentColor(embedColour);

    const titleSection = await buildTitleSection(deploy, typesArr[type].extendedStats);
    container.addSectionComponents(titleSection);
    container.addSeparatorComponents(new Djs.SeparatorBuilder().setSpacing(Djs.SeparatorSpacingSize.Large));

    // const typeText = new Djs.TextDisplayBuilder()
    //     .setContent(`## ${typesArr[type].label}`)
    // container.addTextDisplayComponents(typeText);

    switch (type) {
        default:
        case typesDict.stats.index: {
            level = 0;

            const components = buildDeployableComponents(deploy);
            container.addTextDisplayComponents(components);
            break;
        }
        case typesDict.skills.index: {
            level = C.Deployable.clampSkillLevelIndex(deploy, level);

            const sections = await buildSkillSections(deploy, level);
            for (const section of sections) {
                container.addSectionComponents(section);
                container.addSeparatorComponents(new Djs.SeparatorBuilder().setSpacing(Djs.SeparatorSpacingSize.Large));
            }

            const levelRow = new Djs.ActionRowBuilder<Djs.StringSelectMenuBuilder>();
            container.addActionRowComponents(levelRow);

            const levelSelect = new Djs.StringSelectMenuBuilder()
                .setCustomId(createCustomId('deploy', deploy.id, type, 'select'));
            levelRow.addComponents(levelSelect);

            for (let i = deploy.skills.find(s => s?.excel).excel.levels.length - 1; i >= 0; i--) {
                const levelOption = new Djs.StringSelectMenuOptionBuilder()
                    .setLabel(gameConsts.skillLevels[i])
                    .setValue(i.toString())
                    .setDefault(i === level);
                levelSelect.addOptions(levelOption);
            }
            break;
        }
    }

    const typeRow = new Djs.ActionRowBuilder<Djs.StringSelectMenuBuilder>();
    container.addActionRowComponents(typeRow);

    const typeSelect = new Djs.StringSelectMenuBuilder()
        .setCustomId(createCustomId('deploy', deploy.id, 'select', 99));
    typeRow.addComponents(typeSelect);

    for (const typeLabel of Object.values(typesDict)) {
        if (!typeLabel.enabled) continue;
        const typeOption = new Djs.StringSelectMenuOptionBuilder()
            .setLabel(typeLabel.label)
            .setValue(typeLabel.value)
            .setDefault(type === typeLabel.index);
        typeSelect.addOptions(typeOption);
    }

    return { components: [container], flags: Djs.MessageFlags.IsComponentsV2 | Djs.MessageFlags.Ephemeral }; // remove ephemeral once patched
}
export async function buildEnemyMessage(enemy: T.Enemy, level: number): Promise<Djs.BaseMessageOptions> {
    const enemyInfo = enemy.excel;
    const enemyData = enemy.levels.Value[level].enemyData;
    const baseData = enemy.levels.Value[0].enemyData;

    const title = `${enemyInfo.enemyIndex} - ${enemyInfo.name}`;
    const description = removeStyleTags(enemyInfo.description)
        .concat(
            enemyInfo.abilityList.map((ability) => {
                const abilityText = removeStyleTags(ability.text);
                switch (ability.textFormat) {
                    case 'NORMAL':
                        return `\n\n${abilityText}`;
                    case 'SILENCE':
                        return `\n\n${abilityText} (Silenceable)`;
                    case 'TITLE':
                        return `\n\n**${abilityText}**`;
                    default:
                        return '';
                }
            }).join('')
        );

    const hp = enemyData.attributes.maxHp.m_defined ? enemyData.attributes.maxHp.m_value.toString() :
        baseData.attributes.maxHp.m_defined ? baseData.attributes.maxHp.m_value.toString() : '0';
    const atk = enemyData.attributes.atk.m_defined ? enemyData.attributes.atk.m_value.toString() :
        baseData.attributes.atk.m_defined ? baseData.attributes.atk.m_value.toString() : '0';
    const def = enemyData.attributes.def.m_defined ? enemyData.attributes.def.m_value.toString() :
        baseData.attributes.def.m_defined ? baseData.attributes.def.m_value.toString() : '0';
    const res = enemyData.attributes.magicResistance.m_defined ? enemyData.attributes.magicResistance.m_value.toString() :
        baseData.attributes.magicResistance.m_defined ? baseData.attributes.magicResistance.m_value.toString() : '0';
    const weight = enemyData.attributes.massLevel.m_defined ? enemyData.attributes.massLevel.m_value.toString() :
        baseData.attributes.massLevel.m_defined ? baseData.attributes.massLevel.m_value.toString() : '0';
    const life = enemyData.lifePointReduce.m_defined ? enemyData.lifePointReduce.m_value.toString() :
        baseData.lifePointReduce.m_defined ? baseData.lifePointReduce.m_value.toString() : '1';
    const elemDamageRes = enemyData.attributes.epDamageResistance.m_defined ? enemyData.attributes.epDamageResistance.m_value.toString() :
        baseData.attributes.epDamageResistance.m_defined ? baseData.attributes.epDamageResistance.m_value.toString() : '0';
    const elemRes = enemyData.attributes.epResistance.m_defined ? enemyData.attributes.epResistance.m_value.toString() :
        baseData.attributes.epResistance.m_defined ? baseData.attributes.epResistance.m_value.toString() : '0';
    const move = enemyData.attributes.moveSpeed.m_defined ? enemyData.attributes.moveSpeed.m_value.toString() :
        baseData.attributes.moveSpeed.m_defined ? baseData.attributes.moveSpeed.m_value.toString() : '0';
    const silence = enemyData.attributes.silenceImmune.m_defined ? enemyData.attributes.silenceImmune.m_value :
        baseData.attributes.silenceImmune.m_defined ? baseData.attributes.silenceImmune.m_value.toString() : false;
    const stun = enemyData.attributes.stunImmune.m_defined ? enemyData.attributes.stunImmune.m_value :
        baseData.attributes.stunImmune.m_defined ? baseData.attributes.stunImmune.m_value.toString() : false;
    const sleep = enemyData.attributes.sleepImmune.m_defined ? enemyData.attributes.sleepImmune.m_value :
        baseData.attributes.sleepImmune.m_defined ? baseData.attributes.sleepImmune.m_value.toString() : false;
    const frozen = enemyData.attributes.frozenImmune.m_defined ? enemyData.attributes.frozenImmune.m_value :
        baseData.attributes.frozenImmune.m_defined ? baseData.attributes.frozenImmune.m_value.toString() : false;
    const levitate = enemyData.attributes.levitateImmune.m_defined ? enemyData.attributes.levitateImmune.m_value :
        baseData.attributes.levitateImmune.m_defined ? baseData.attributes.levitateImmune.m_value.toString() : false;

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setThumbnail(paths.myAssetUrl + `/enemy/${enemyInfo.enemyId}.png`)
        .setDescription(description)
        .addFields(
            { name: '❤️ HP', value: hp, inline: true },
            { name: '⚔️ ATK', value: atk, inline: true },
            { name: '🛡️ DEF', value: def, inline: true },
            { name: '✨ RES', value: res, inline: true },
            { name: '⚖️ Weight', value: weight, inline: true },
            { name: '👟 Move Speed', value: move, inline: true, },
            { name: '💖  Elemental RES', value: elemDamageRes, inline: true },
            { name: '🧿 Elemental Resistance', value: elemRes, inline: true },
            { name: '💔 Life Points', value: life, inline: true },
            { name: 'Silence', value: silence ? '❌' : '✅', inline: true },
            { name: 'Stun', value: stun ? '❌' : '✅', inline: true },
            { name: 'Sleep', value: sleep ? '❌' : '✅', inline: true },
            { name: 'Freeze', value: frozen ? '❌' : '✅', inline: true },
            { name: 'Levitate', value: levitate ? '❌' : '✅', inline: true }
        );

    const enemyLevels = enemy.levels.Value.length;
    if (enemyLevels === 1)
        return { embeds: [embed] };

    const buttonRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>();
    for (let i = 0; i < enemyLevels; i++) {
        buttonRow.addComponents(new Djs.ButtonBuilder()
            .setCustomId(createCustomId('enemy', enemy.excel.enemyId, i))
            .setLabel(`Level ${i + 1}`)
            .setStyle(Djs.ButtonStyle.Primary)
        )
        if (i === level) {
            buttonRow.components[i].setDisabled(true);
        }
    }

    return { embeds: [embed], components: [buttonRow] };
}
export async function buildEventListMessage(index: number): Promise<Djs.BaseMessageOptions> {
    const eventCount = 6;

    const skipLoginEvents = ['LOGIN_ONLY', 'CHECKIN_ONLY', 'FLOAT_PARADE', 'PRAY_ONLY', 'GRID_GACHA_V2', 'GRID_GACHA', 'BLESS_ONLY', 'CHECKIN_ACCESS', 'CHECKIN_VS'];
    const eventArr = (await api.searchV2('event', {
        filter: {
            'type': { 'nin': skipLoginEvents }
        },
        sort: {
            'startTime': 'desc',
            'endTime': 'desc'
        }
    }));

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle('Game Events')
        .setDescription(`**Page ${index + 1} of ${Math.ceil(eventArr.length / eventCount)}**`);

    for (let i = index * eventCount; i < index * eventCount + eventCount && i < eventArr.length; i++) {
        embed.addFields(buildEventField(eventArr[i]));
    }

    const preverButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('events', index - 5))
        .setLabel('<<')
        .setStyle(Djs.ButtonStyle.Primary);
    const prevButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('events', index - 1))
        .setLabel('Newer')
        .setStyle(Djs.ButtonStyle.Primary);
    const nextButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('events', index + 1))
        .setLabel('Older')
        .setStyle(Djs.ButtonStyle.Primary);
    const nexterButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('events', index + 5))
        .setLabel('>>')
        .setStyle(Djs.ButtonStyle.Primary);
    const componentRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(preverButton, prevButton, nextButton, nexterButton);

    if (index < 5) {
        preverButton.setCustomId(createCustomId('events', 0, 'prever'));
    }
    if (index === 0) {
        preverButton.setDisabled(true);
        preverButton.setStyle(Djs.ButtonStyle.Secondary);
        prevButton.setDisabled(true);
        prevButton.setStyle(Djs.ButtonStyle.Secondary);
    }
    if (index + 1 > Math.floor(eventArr.length / eventCount)) {
        nextButton.setDisabled(true);
        nextButton.setStyle(Djs.ButtonStyle.Secondary);
        nexterButton.setDisabled(true);
        nexterButton.setStyle(Djs.ButtonStyle.Secondary);
    }
    if (index + 5 > Math.floor(eventArr.length / eventCount)) {
        nexterButton.setCustomId(createCustomId('events', Math.floor(eventArr.length / eventCount), 'newer'));
    }

    return { embeds: [embed], components: [componentRow] };
}
export async function buildGachaListMessage(index: number): Promise<Djs.BaseMessageOptions> {
    const bannerCount = 6;
    const timeArr = (await api.all('gacha', {
        include: ['client.gachaPoolId', 'client.openTime'],
        sort: {
            'client.openTime': 'desc',
            'client.endTime': 'desc'
        }
    }));
    const bannerArr = await Promise.all(
        timeArr.slice(index * bannerCount, (index + 1) * bannerCount)
            .map(async time => await api.single('gacha', { query: time.client.gachaPoolId.toLowerCase() }))
    );
    const opNames = await api.all('operator', { include: ['id', 'data.name'] });

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle('Gacha Banners')
        .setDescription(`**Page ${index + 1} of ${Math.ceil(timeArr.length / bannerCount)}**`);

    for (const banner of bannerArr) {
        embed.addFields(buildBannerField(opNames, banner));
    }

    const preverButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('gacha', index - 5, 'prever'))
        .setLabel('<<')
        .setStyle(Djs.ButtonStyle.Primary);
    const prevButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('gacha', index - 1, 'prev'))
        .setLabel('Newer')
        .setStyle(Djs.ButtonStyle.Primary);
    const nextButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('gacha', index + 1, 'next'))
        .setLabel('Older')
        .setStyle(Djs.ButtonStyle.Primary);
    const nexterButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('gacha', index + 5, 'nexter'))
        .setLabel('>>')
        .setStyle(Djs.ButtonStyle.Primary);
    const componentRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(preverButton, prevButton, nextButton, nexterButton);

    if (index < 5) {
        preverButton.setCustomId(createCustomId('gacha', 0, 'prever'));
    }
    if (index === 0) {
        preverButton.setDisabled(true);
        preverButton.setStyle(Djs.ButtonStyle.Secondary);
        prevButton.setDisabled(true);
        prevButton.setStyle(Djs.ButtonStyle.Secondary);
    }
    if (index + 1 > Math.floor(timeArr.length / bannerCount)) {
        nextButton.setDisabled(true);
        nextButton.setStyle(Djs.ButtonStyle.Secondary);
        nexterButton.setDisabled(true);
        nexterButton.setStyle(Djs.ButtonStyle.Secondary);
    }
    if (index + 5 > Math.floor(timeArr.length / bannerCount)) {
        nexterButton.setCustomId(createCustomId('gacha', Math.floor(timeArr.length / bannerCount), 'newer'));
    }

    return { embeds: [embed], components: [componentRow] };
}
export async function buildHelpMessage(name: string): Promise<Djs.BaseMessageOptions> {
    const command = HellaBot.commands.get(name);

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(command.name)
        .setDescription(command.description.join('\n\n'))
        .addFields({ name: 'Usage', value: command.usage.join('\n') });

    return { embeds: [embed] };
}
export async function buildHelpListMessage(): Promise<Djs.BaseMessageOptions> {
    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle('Help Menu');
    embed.addFields({ name: 'Command List', value: HellaBot.commands.map(command => `\`${command.data.name}\``).join(', ') });
    embed.addFields({ name: blankChar, value: 'For more information on a specific command, use `/help [command]`' });

    return { embeds: [embed] };
}
export async function buildInfoMessage(op: T.Operator, type: number = 0, level: number = 0, extras: number[] = []) {
    const typesDict = {
        stats: {
            label: 'Stats', index: 0, value: '0',
            enabled: C.Operator.hasStats(op),
            extendedStats: true
        },
        skills: {
            label: 'Skills', index: 1, value: '1',
            enabled: C.Operator.hasSkills(op),
            extendedStats: true
        },
        deploy: {
            label: 'Deployables', index: 7, value: '7',
            enabled: C.Operator.hasDeployables(op),
            extendedStats: true
        },
        modules: {
            label: 'Modules', index: 2, value: '2',
            enabled: C.Operator.hasModules(op),
            extendedStats: true
        },
        base: {
            label: 'Base Skills', index: 3, value: '3',
            enabled: C.Operator.hasBases(op),
            extendedStats: false
        },
        costs: {
            label: 'Upgrade Costs', index: 4, value: '4',
            enabled: C.Operator.hasCosts(op),
            extendedStats: false
        },
        outfits: {
            label: 'Outfits', index: 5, value: '5',
            enabled: C.Operator.hasSkins(op),
            extendedStats: false
        },
        paradox: {
            label: 'Paradox Simulation', index: 6, value: '6',
            enabled: C.Operator.hasParadox(op),
            extendedStats: false
        }
    };
    const typesArr = Object.values(typesDict).sort((a, b) => a.index - b.index);

    const container = new Djs.ContainerBuilder().setAccentColor(embedColour);

    const titleSection = await buildTitleSection(op, typesArr[type].extendedStats);
    container.addSectionComponents(titleSection);
    container.addSeparatorComponents(new Djs.SeparatorBuilder().setSpacing(Djs.SeparatorSpacingSize.Large));

    // const typeText = new Djs.TextDisplayBuilder()
    //     .setContent(`## ${typesArr[type].label}`)
    // container.addTextDisplayComponents(typeText);

    switch (type) {
        default:
        case typesDict.stats.index: {
            if (!C.Operator.hasStats(op)) break;

            level = 0;

            const components = buildDeployableComponents(op);
            container.addTextDisplayComponents(components);
            container.addSeparatorComponents(new Djs.SeparatorBuilder().setSpacing(Djs.SeparatorSpacingSize.Large));
            break;
        }
        case typesDict.skills.index: {
            if (!C.Operator.hasSkills(op)) break;

            level = C.Operator.clampSkillLevelIndex(op, level);

            const sections = await buildSkillSections(op, level);
            for (const section of sections) {
                container.addSectionComponents(section);
                container.addSeparatorComponents(new Djs.SeparatorBuilder().setSpacing(Djs.SeparatorSpacingSize.Large));
            }

            const levelRow = new Djs.ActionRowBuilder<Djs.StringSelectMenuBuilder>();
            container.addActionRowComponents(levelRow);

            const levelSelect = new Djs.StringSelectMenuBuilder()
                .setCustomId(createCustomId('info', op.id, type, 'select'));
            levelRow.addComponents(levelSelect);

            for (let i = op.skills[0].excel.levels.length - 1; i >= 0; i--) {
                const levelOption = new Djs.StringSelectMenuOptionBuilder()
                    .setLabel(gameConsts.skillLevels[i])
                    .setValue(i.toString())
                    .setDefault(i === level);
                levelSelect.addOptions(levelOption);
            }
            break;
        }
        case typesDict.deploy.index: {
            if (!C.Operator.hasDeployables(op)) break;

            extras = [extras?.[0] ?? 0];

            if (op.skills.every(s => !C.Skill.hasDeployable(s))) { // if an operator does not have summons that are tied to a skill, assume they only have one summon (eg. Deepcolor)
                const deploy = await api.single('deployable', { query: Object.keys(op.data.displayTokenDict)[0] });

                const titleSection = await buildTitleSection(deploy, true);
                container.addSectionComponents(titleSection);
                container.addSeparatorComponents(new Djs.SeparatorBuilder().setSpacing(Djs.SeparatorSpacingSize.Large));

                const statSection = buildDeployableComponents(deploy);
                container.addTextDisplayComponents(statSection);
                container.addSeparatorComponents(new Djs.SeparatorBuilder().setSpacing(Djs.SeparatorSpacingSize.Large));
            }
            else {
                const deploySkill = C.Operator.clampSkillHasDeployableIndex(op, extras[0]);
                const deployLevel = C.Operator.clampSkillLevelIndex(op, 99);
                const deploy = await api.single('deployable', { query: op.skills[deploySkill].deploy.overrideTokenKey });

                const opSkillSections = await buildSkillSections(op, deployLevel, deploySkill);
                for (const skillSection of opSkillSections) {
                    container.addSectionComponents(skillSection);
                    container.addSeparatorComponents(new Djs.SeparatorBuilder().setSpacing(Djs.SeparatorSpacingSize.Large));
                }

                const deploySkillRow = new Djs.ActionRowBuilder<Djs.StringSelectMenuBuilder>();
                container.addActionRowComponents(deploySkillRow);
                container.addSeparatorComponents(new Djs.SeparatorBuilder().setSpacing(Djs.SeparatorSpacingSize.Large));

                const deploySkillSelect = new Djs.StringSelectMenuBuilder()
                    .setCustomId(createCustomId('info', op.id, type, level, 'select'));
                deploySkillRow.addComponents(deploySkillSelect);

                for (let i = 0; i < op.skills.length; i++) {
                    if (!C.Skill.hasDeployable(op.skills[i])) continue;

                    const deploySkillOption = new Djs.StringSelectMenuOptionBuilder()
                        .setLabel(`Skill ${i + 1}`)
                        .setValue(i.toString())
                        .setDefault(i === deploySkill);
                    deploySkillSelect.addOptions(deploySkillOption);
                }

                const titleSection = await buildTitleSection(deploy, true);
                container.addSectionComponents(titleSection);
                container.addSeparatorComponents(new Djs.SeparatorBuilder().setSpacing(Djs.SeparatorSpacingSize.Large));

                const statSection = buildDeployableComponents(deploy);
                container.addTextDisplayComponents(statSection);
                container.addSeparatorComponents(new Djs.SeparatorBuilder().setSpacing(Djs.SeparatorSpacingSize.Large));

                const deploySkillSections = await buildSkillSections(deploy, deployLevel);
                for (const skillSection of deploySkillSections) {
                    container.addSectionComponents(skillSection);
                    container.addSeparatorComponents(new Djs.SeparatorBuilder().setSpacing(Djs.SeparatorSpacingSize.Large));
                }
            }
            break;
        }
        case typesDict.modules.index: {
            if (!C.Operator.hasModules(op)) break;

            level = C.Operator.clampModuleLevelIndex(op, level);

            const sections = await buildModuleSections(op, level);
            for (const section of sections) {
                container.addSectionComponents(section);
                container.addSeparatorComponents(new Djs.SeparatorBuilder().setSpacing(Djs.SeparatorSpacingSize.Large));
            }

            const levelRow = new Djs.ActionRowBuilder<Djs.StringSelectMenuBuilder>();
            container.addActionRowComponents(levelRow);

            const levelSelect = new Djs.StringSelectMenuBuilder()
                .setCustomId(createCustomId('info', op.id, type, 'select'));
            levelRow.addComponents(levelSelect);

            for (let i = 0; i < 3; i++) {
                const levelOption = new Djs.StringSelectMenuOptionBuilder()
                    .setLabel(`Level ${i + 1}`)
                    .setValue(i.toString())
                    .setDefault(i === level);
                levelSelect.addOptions(levelOption);
            }
            break;
        }
        case typesDict.base.index: {
            if (!C.Operator.hasBases(op)) break;

            level = 0;

            const sections = buildBaseSections(op);
            for (const section of sections) {
                container.addSectionComponents(section);
                container.addSeparatorComponents(new Djs.SeparatorBuilder().setSpacing(Djs.SeparatorSpacingSize.Large));
            }
            break;
        }
        case typesDict.costs.index: {
            if (!C.Operator.hasCosts(op)) break;

            const levelsArr = [
                {
                    label: 'Promotions',
                    disabled: false
                },
                {
                    label: 'Skills',
                    disabled: !op.skills || !op.skills.length
                },
                {
                    label: 'Masteries',
                    disabled: gameConsts.rarity[op.data.rarity] <= 3
                },
                {
                    label: 'Modules',
                    disabled: !op.modules || !op.modules.length
                }
            ];

            if (level < 0 || level >= levelsArr.length || levelsArr[level].disabled) level = 0;

            const sections = await buildCostSections(op, level);
            for (const section of sections) {
                container.addSectionComponents(section);
                container.addSeparatorComponents(new Djs.SeparatorBuilder().setSpacing(Djs.SeparatorSpacingSize.Large));
            }

            const levelRow = new Djs.ActionRowBuilder<Djs.StringSelectMenuBuilder>();
            container.addActionRowComponents(levelRow);

            const levelSelect = new Djs.StringSelectMenuBuilder()
                .setCustomId(createCustomId('info', op.id, type, 'select'));
            levelRow.addComponents(levelSelect);

            for (let i = 0; i < levelsArr.length; i++) {
                if (levelsArr[i].disabled) continue;

                const levelOption = new Djs.StringSelectMenuOptionBuilder()
                    .setLabel(levelsArr[i].label)
                    .setValue(i.toString())
                    .setDefault(i === level);
                levelSelect.addOptions(levelOption);
            }
            break;
        }
        case typesDict.outfits.index: {
            if (!C.Operator.hasSkins(op)) break;

            if (level === 99) level = 0;
            level = C.Operator.clampSkinIndex(op, level);

            const components = buildOutfitComponents(op, level);
            container.addSectionComponents(components.section);
            container.addMediaGalleryComponents(components.gallery);
            container.addSeparatorComponents(new Djs.SeparatorBuilder().setSpacing(Djs.SeparatorSpacingSize.Large));

            const levelRow = new Djs.ActionRowBuilder<Djs.StringSelectMenuBuilder>();
            container.addActionRowComponents(levelRow);

            const levelSelect = new Djs.StringSelectMenuBuilder()
                .setCustomId(createCustomId('info', op.id, type, 'select'));
            levelRow.addComponents(levelSelect);

            for (let i = 0; i < op.skins.length; i++) {
                const levelOption = new Djs.StringSelectMenuOptionBuilder()
                    .setLabel(op.skins[i].displaySkin.skinGroupName)
                    .setValue(i.toString())
                    .setDefault(i === level);
                levelSelect.addOptions(levelOption);
            }
            break;
        }
        case typesDict.paradox.index: {
            if (!C.Operator.hasParadox(op)) break;

            level = C.Paradox.clampIndex(level);

            const components = await buildStageComponents(op.paradox, level);
            container.addTextDisplayComponents(components.text);
            if (components.gallery) {
                container.addMediaGalleryComponents(components.gallery);
            }

            container.addSeparatorComponents(new Djs.SeparatorBuilder().setSpacing(Djs.SeparatorSpacingSize.Large));

            if (components.galleryExists) {
                const buttonLabels = ['Preview', 'Diagram'];

                const levelRow = new Djs.ActionRowBuilder<Djs.StringSelectMenuBuilder>();
                container.addActionRowComponents(levelRow);

                const levelSelect = new Djs.StringSelectMenuBuilder()
                    .setCustomId(createCustomId('info', op.id, type, 'select'));
                levelRow.addComponents(levelSelect);

                for (let i = 0; i < buttonLabels.length; i++) {
                    const levelOption = new Djs.StringSelectMenuOptionBuilder()
                        .setLabel(buttonLabels[i])
                        .setValue(i.toString())
                        .setDefault(i === level);
                    levelSelect.addOptions(levelOption);
                }
            }
            break;
        }
    }

    const typeRow = new Djs.ActionRowBuilder<Djs.StringSelectMenuBuilder>();
    container.addActionRowComponents(typeRow);

    const typeSelect = new Djs.StringSelectMenuBuilder()
        .setCustomId(createCustomId('info', op.id, 'select', 99));
    typeRow.addComponents(typeSelect);

    for (const typeLabel of Object.values(typesDict)) {
        if (!typeLabel.enabled) continue;
        const typeOption = new Djs.StringSelectMenuOptionBuilder()
            .setLabel(typeLabel.label)
            .setValue(typeLabel.value)
            .setDefault(type === typeLabel.index);
        typeSelect.addOptions(typeOption);
    }

    return { components: [container], flags: Djs.MessageFlags.IsComponentsV2 | Djs.MessageFlags.Ephemeral }; // remove ephemeral once patched
}
export async function buildItemMessage(item: T.Item): Promise<Djs.BaseMessageOptions> {
    const dropStageCount = 6;

    const description = item.data.description !== null ? `${item.data.usage} \n\n${item.data.description}` : item.data.usage;

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(item.data.name)
        .setDescription(description);

    const sanityString = (await pstats.getItemAverageSanity(item))
        .sort((a, b) => a.sanity - b.sanity)
        .slice(0, dropStageCount)
        .map(s => `${s.code} - ** ${s.sanity.toFixed(2)}** `).join('\n');
    if (sanityString !== '') {
        embed.addFields({ name: 'Drop Stages (Sanity/Item)', value: sanityString, inline: true });
    }
    if (C.Item.hasFormula(item)) {
        const formulaString = buildCostString(item.formula.costs, await api.all('item'));
        embed.addFields({ name: 'Crafting Formula', value: formulaString, inline: true });
    }
    const imagePath = paths.myAssetUrl + `/ items / ${item.data.iconId}.png`;
    if (await urlExists(imagePath))
        embed.setThumbnail(imagePath);

    return { embeds: [embed] };
}
export async function buildNewMessage(): Promise<Djs.BaseMessageOptions> {
    const opName = (op: T.Operator) => getOpPrettyName(op);

    const opCache = {};
    async function getOp(id: string) {
        if (!opCache[id]) {
            opCache[id] = await api.single('operator', { query: id, include: ['id', 'data.rarity', 'data.name'] });
        }
        return opCache[id];
    }

    const aboutInfo = await api.about();
    const newInfo = await api.newEn({ include: ['archetype', 'operator', 'skin', 'module', 'paradox'] });

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle('Newly Updated Game Data')
        .setDescription(`Last updated at: <t:${aboutInfo.date}>`);

    const archetypeString = newInfo.archetype
        ?.map(archetype => archetype.value)
        .sort().reverse()
        .join('\n');
    if (archetypeString && archetypeString.length > 0)
        embed.addFields({ name: 'New Archetypes', value: archetypeString });

    const opString = newInfo.operator
        ?.map(op => opName(op.value))
        .sort().reverse()
        .join('\n');
    if (opString && opString.length > 0)
        embed.addFields({ name: 'New Operators', value: opString });

    const skinString = (await Promise.all(newInfo.skin
        ?.filter(skin => skin.value.displaySkin.skinName)
        .map(async skin => {
            const op = await getOp(skin.value.charId);
            return `${opName(op)} - ${skin.value.displaySkin.skinName}`;
        })))
        .sort().reverse()
        .join('\n');
    if (skinString && skinString.length > 0)
        embed.addFields({ name: 'New Skins', value: skinString });

    const moduleString = (await Promise.all(newInfo.module
        ?.filter(module => module.value.data)
        .map(async module => {
            const op = await getOp(module.value.info.charId);
            return `${opName(op)} - ${module.value.info.uniEquipName}`
        })))
        .sort().reverse()
        .join('\n');
    if (moduleString && moduleString.length > 0)
        embed.addFields({ name: 'New Modules', value: moduleString });

    const paradoxString = (await Promise.all(newInfo.paradox
        ?.filter(paradox => paradox.value.levels)
        .map(async paradox => {
            const op = await getOp(paradox.value.excel.charId);
            return `${opName(op)} - ${paradox.value.excel.name}`
        })))
        .sort().reverse()
        .join('\n');
    if (paradoxString && paradoxString.length > 0)
        embed.addFields({ name: 'New Paradox Simulations', value: paradoxString });

    return { embeds: [embed] };
}
export async function buildPingMessage(): Promise<Djs.BaseMessageOptions> {
    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle('Ping')
        .addFields(
            { name: 'Discord', value: `Pinging...`, inline: true },
            { name: 'GitHub', value: `Pinging...`, inline: true },
            { name: 'HellaAPI', value: `Pinging...`, inline: true }
        );

    const button = new Djs.ButtonBuilder()
        .setCustomId(createCustomId('ping', 'refresh'))
        .setLabel('Refresh')
        .setStyle(Djs.ButtonStyle.Primary);

    return { embeds: [embed], components: [new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(button)] };
}
export async function buildRecruitMessage(value: number, tags: string[], select: boolean, snowflakes: string[]): Promise<Djs.BaseMessageOptions[]> {
    tags.forEach(tag => {
        select ? value *= gameConsts.tagValues[tag]
            : value /= gameConsts.tagValues[tag];
    })

    const button = (id: string, label: string) => {
        return new Djs.ButtonBuilder()
            .setCustomId(createCustomId('recruit', value, id, 'select', ...snowflakes))
            .setLabel(label)
            .setStyle(Djs.ButtonStyle.Secondary);
    }
    const starterButton = button('starter', 'Starter');
    const seniorButton = button('senior', 'Senior Operator');
    const topButton = button('top', 'Top Operator');
    const robotButton = button('robot', 'Robot');
    const meleeButton = button('melee', 'Melee');
    const rangedButton = button('ranged', 'Ranged');
    const guardButton = button('guard', 'Guard');
    const medicButton = button('medic', 'Medic');
    const vanguardButton = button('vanguard', 'Vanguard');
    const casterButton = button('caster', 'Caster');
    const sniperButton = button('sniper', 'Sniper');
    const defenderButton = button('defender', 'Defender');
    const supporterButton = button('supporter', 'Supporter');
    const specialistButton = button('specialist', 'Specialist');
    const healingButton = button('healing', 'Healing');
    const supportButton = button('support', 'Support');
    const dpsButton = button('dps', 'DPS');
    const aoeButton = button('aoe', 'AOE');
    const slowButton = button('slow', 'Slow');
    const survivalButton = button('survival', 'Survival');
    const defenseButton = button('defense', 'Defense');
    const debuffButton = button('debuff', 'Debuff');
    const shiftButton = button('shift', 'Shift');
    const crowdControlButton = button('crowd-control', 'Crowd-Control');
    const nukerButton = button('nuker', 'Nuker');
    const summonButton = button('summon', 'Summon');
    const fastRedeployButton = button('fast-redeploy', 'Fast-Redeploy');
    const dpRecoveryButton = button('dp-recovery', 'DP-Recovery');
    const elementalButton = button('elemental', 'Elemental');
    const deleteButton = button('delete', '🗑️ Clear Tags')
        .setDisabled(true)
        .setStyle(Djs.ButtonStyle.Danger);

    const qualComponents = [
        new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(starterButton, seniorButton, topButton, robotButton),
        new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(meleeButton, rangedButton),
        new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(guardButton, medicButton, vanguardButton, casterButton, sniperButton),
        new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(defenderButton, supporterButton, specialistButton)
    ];
    const tagComponents = [
        new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(healingButton, supportButton, dpsButton, aoeButton, slowButton),
        new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(survivalButton, defenseButton, debuffButton, shiftButton, crowdControlButton),
        new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(nukerButton, summonButton, fastRedeployButton, dpRecoveryButton, elementalButton)
    ];
    const utilComponents = [
        new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(deleteButton)
    ];

    const components = []; components.push(...qualComponents, ...tagComponents);
    const selectedButtons = [];
    for (const actionRow of components) {
        for (const button of actionRow.components) {
            const buttonTag = button.data.custom_id.split('ඞ')[2];
            const buttonValue = gameConsts.tagValues[buttonTag];
            if (value % buttonValue !== 0) continue;
            selectedButtons.push(button);
        }
    }
    for (const button of selectedButtons) {
        deleteButton.setDisabled(false);
        button.setCustomId(button.data.custom_id.replace('select', 'deselect'));
        button.setStyle(Djs.ButtonStyle.Primary);
    }
    if (selectedButtons.length >= 5) {
        for (const actionRow of components) {
            for (const button of actionRow.components) {
                if (selectedButtons.includes(button)) continue;
                button.setDisabled(true);
            }
        }
    }

    const qualEmbed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle('Qualification/Position/Class')
    const tagEmbed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle('Tags')
    const recruitEmbed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle('Recruitment Calculator');

    // chatgpt prompt: in javascript, i have an array of 1-5 unique prime numbers. write a function to get all possible distinct combinations of prime numbers, where a combination of numbers is their product
    function getPrimeCombinations(primes: number[], currentCombination = [], index = 0, result = []): number[] {
        if (currentCombination.length > 0) {
            const product = currentCombination.reduce((acc, prime) => acc * prime, 1);
            result.push(product);
        }
        for (let i = index; i < primes.length; i++) {
            if (!currentCombination.includes(primes[i])) {
                getPrimeCombinations(primes, [...currentCombination, primes[i]], i, result);
            }
        }
        return result;
    }
    const primeArray = selectedButtons.map(x => gameConsts.tagValues[x.data.custom_id.split('ඞ')[2]]);
    const opMap: { [key: number]: T.Operator[] } = getPrimeCombinations(primeArray).reduce((acc, combination) => { acc[combination] = []; return acc; }, {});
    const opList = await api.all('operator', { include: ['id', 'recruit', 'data.rarity', 'data.name'] })
    const recruitPool = (await api.recruitPool()).value;
    for (const key of Object.keys(opMap)) {
        for (const op of opList) {
            if (!recruitPool.includes(op.id)) continue;
            if (op.recruit % parseInt(key) !== 0) continue;
            if (op.recruit % gameConsts.tagValues['top'] === 0 && parseInt(key) % gameConsts.tagValues['top'] !== 0) continue;

            opMap[key].push(op);
        }
    }
    for (const value of Object.values(opMap)) {
        value.sort((a, b) => { return gameConsts.rarity[b.data.rarity] - gameConsts.rarity[a.data.rarity] });
    }

    let sortArr = [];
    for (const key of Object.keys(opMap)) {
        const temp = Object.keys(gameConsts.tagValues).filter((x) => x !== '' && x.slice(0, 4) !== 'TIER' && parseInt(key) % gameConsts.tagValues[x] === 0);
        const tags = selectedButtons.filter(x => temp.includes(x.data.custom_id.split('ඞ')[2])).map(x => x.data.label);
        if (opMap[key].length === 0) continue;
        sortArr.push([tags.join(' + '), opMap[key]]);
    }
    sortArr.sort((a, b) => { // sort tag combos by highest rarity
        const rarity = gameConsts.rarity[b[1][b[1].length - 1].data.rarity] - gameConsts.rarity[a[1][a[1].length - 1].data.rarity];
        if (rarity) return rarity;
        return a[1].length - b[1].length;
    });

    let combCount = 0;
    for (const opArr of sortArr) {
        let opCount = 0, opString = '';
        for (const op of opArr[1]) {
            if (opCount < 12) {
                opString += getOpPrettyName(op) + '\n';
            }
            opCount++;
        }
        if (combCount < 6) {
            opString = opCount >= 13 ? `${opString}${opCount - 12} more...` : opString;
            recruitEmbed.addFields({ name: opArr[0], value: opString, inline: true });
        }
        combCount++;
    }

    return [{ content: '', embeds: [qualEmbed], components: qualComponents }, { content: '', embeds: [tagEmbed], components: tagComponents }, { content: '', embeds: [recruitEmbed], components: utilComponents }];
}
export async function buildRogueRelicMessage(relic: T.RogueRelic): Promise<Djs.BaseMessageOptions> {
    const description = `${relic.description !== null ? `${relic.usage}\n\n${relic.description}` : relic.usage}`;

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(relic.name)
        .setDescription(description);

    const imagePath = paths.myAssetUrl + `/rogue/items/${relic.iconId}.png`;
    if (await urlExists(imagePath))
        embed.setThumbnail(imagePath);

    return { embeds: [embed] };
}
export async function buildRogueRelicListMessage(theme: number, index: number): Promise<Djs.BaseMessageOptions> {
    const rogueTheme = await api.single('rogue', { query: theme.toString(), include: ['name', 'relicDict'] });
    const descriptionLengthLimit = 24;
    const columnCount = 2;
    let descIndex = -1;
    const descriptionArr = [], ticketArr = [], toolArr = [], totemArr = [], relicArr = [], defaultArr = [];

    const pushDescription = (string: string) => {
        if (!descriptionArr[descIndex]) {
            descriptionArr[descIndex] = { string: '', length: 0 };
        }

        descriptionArr[descIndex].string += string;
        descriptionArr[descIndex].length++;

        if (descriptionArr[descIndex].length > descriptionLengthLimit) {
            descIndex++;
            descriptionArr[descIndex] = { string: '', length: 0 };
        }
    }

    for (const relic of Object.values(rogueTheme.relicDict)) {
        switch (relic.type) {
            case 'RECRUIT_TICKET':
            case 'UPGRADE_TICKET':
                ticketArr.push(relic.name);
                break;
            case 'ACTIVE_TOOL':
                toolArr.push(relic.name);
                break;
            case 'TOTEM':
                totemArr.push(relic.name);
                break;
            case 'RELIC':
                relicArr.push(relic.name);
                break;
            default:
                defaultArr.push(relic.name);
                break;
        }
    }

    if (ticketArr.length > 0) {
        descIndex++;
        pushDescription('**Operator Vouchers**\n\n');
    }
    ticketArr.forEach(relic => pushDescription(`${relic}\n`));
    if (toolArr.length > 0) {
        descIndex++;
        pushDescription('**Tactical Props**\n\n');
    }
    toolArr.forEach(relic => pushDescription(`${relic}\n`));
    if (totemArr.length > 0) {
        descIndex++;
        pushDescription('**Foldartals**\n\n');
    }
    totemArr.forEach(relic => pushDescription(`${relic}\n`));
    if (relicArr.length > 0) {
        descIndex++;
        pushDescription('**Relics**\n\n');
    }
    relicArr.forEach(relic => pushDescription(`${relic}\n`));
    if (defaultArr.length > 0) {
        descIndex++;
        pushDescription('**Miscellaneous**\n\n');
    }
    defaultArr.forEach(relic => pushDescription(`${relic}\n`));

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(`*${rogueTheme.name}* Relics`)
        .setDescription(`**Page ${index + 1} of ${Math.ceil(descriptionArr.length / columnCount)}**`);

    for (let i = index * columnCount; i < index * columnCount + columnCount && i < descriptionArr.length; i++) {
        embed.addFields({ name: blankChar, value: descriptionArr[i].string, inline: true });
    }

    const prevButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId(`is${theme + 2}`, 'relic', index - 1))
        .setLabel('Previous')
        .setStyle(Djs.ButtonStyle.Primary);
    const nextButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId(`is${theme + 2}`, 'relic', index + 1))
        .setLabel('Next')
        .setStyle(Djs.ButtonStyle.Primary);
    const componentRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(prevButton, nextButton);

    if (index === 0) {
        prevButton.setDisabled(true);
        prevButton.setStyle(Djs.ButtonStyle.Secondary);
    }
    if (index * columnCount + columnCount >= descriptionArr.length) {
        nextButton.setDisabled(true);
        nextButton.setStyle(Djs.ButtonStyle.Secondary);
    }

    return { embeds: [embed], components: [componentRow] };
}
export async function buildRogueStageMessage(theme: number, stage: T.RogueStage, page: number): Promise<Djs.BaseMessageOptions> {
    const stageInfo = stage.excel;
    const stageData = stage.levels;

    const title = C.RogueStage.isChallenge(stage) ? `Emergency ${stageInfo.code} - ${stageInfo.name}` : `${stageInfo.code} - ${stageInfo.name}`;
    const description = C.RogueStage.isChallenge(stage) ? removeStyleTags(`${stageInfo.description}\n${stageInfo.eliteDesc}`) : removeStyleTags(stageInfo.description);

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setURL(`${paths.stageViewerUrl}?level=${stage.excel.id.toLowerCase()}`)
        .setDescription(description);

    embed.addFields(await buildStageEnemyFields(stageData));

    const imageButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId(`is${theme + 2}`, 'stage', C.RogueStage.isChallenge(stage), stageInfo.id, 0))
        .setLabel('Preview')
        .setStyle(Djs.ButtonStyle.Primary);
    const diagramButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId(`is${theme + 2}`, 'stage', C.RogueStage.isChallenge(stage), stageInfo.id, 1))
        .setLabel('Diagram')
        .setStyle(Djs.ButtonStyle.Primary);
    const buttonRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(imageButton, diagramButton);

    switch (page) {
        case 0:
            imageButton.setDisabled(true);
            break;
        case 1:
            diagramButton.setDisabled(true);
            break;
    }

    if (page === 0) {
        const imagePath = paths.myAssetUrl + `/stages/${stageInfo.id}.png`;
        if (await urlExists(imagePath)) {
            embed.setImage(imagePath);
            return { embeds: [embed], components: [buttonRow] };
        }
        else {
            embed.addFields(buildStageDiagramFields(stageData));
            return { embeds: [embed] };
        }
    }
    else {
        embed.addFields(buildStageDiagramFields(stageData));
        return { embeds: [embed], components: [buttonRow] };
    }
}
export async function buildRogueVariationMessage(variation: T.RogueVariation): Promise<Djs.BaseMessageOptions> {
    const description = `${variation.functionDesc}\n\n${variation.desc}`;

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(variation.outerName)
        .setDescription(description);

    return { embeds: [embed] };
}
export async function buildRogueVariationListMessage(theme: number): Promise<Djs.BaseMessageOptions> {
    const rogueTheme = await api.single('rogue', { query: theme.toString(), include: ['name', 'variationDict'] });

    let description = '';
    for (const variation of Object.values(rogueTheme.variationDict)) {
        description += `${variation.outerName}\n`;
    }

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(`*${rogueTheme.name}* Floor Effects`)
        .setDescription(description);

    return { embeds: [embed] };
}
export async function buildSandboxItemMessage(theme: number, item: T.SandboxItem): Promise<Djs.BaseMessageOptions> {
    const items = (await api.single('sandbox', { query: theme.toString(), include: ['itemDict'] })).itemDict;

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(item.data.itemName)
        .setDescription(`${item.data.itemUsage}\n\n${item.data.itemDesc}`);

    if (item.craft) {
        let costString = '';
        for (const [mat, count] of Object.entries(item.craft.materialItems)) {
            costString += `${items[mat].data.itemName} **x${count}**\n`;
        }
        embed.addFields({ name: 'Crafting Formula', value: costString });
    }
    if (item.food) {
        for (let i = 0; i < item.food.variants.length; i++) {
            const variant = item.food.variants[i];
            const fieldName = i === 0 ? 'Normal' : `Variant ${variant.name.slice(item.food.variants[0].name.length).trim()}`;
            embed.addFields({ name: fieldName, value: variant.usage, inline: i !== 0 });
        }
        item.food.recipes.forEach(recipe => {
            let recipeString = '';
            const mats = {};
            recipe.mats.forEach(mat => {
                mats[mat] ? mats[mat]++ : mats[mat] = 1;
            });
            for (const [mat, count] of Object.entries(mats)) {
                recipeString += `${items[mat].data.itemName} **x${count}**\n`;
            }
            embed.addFields({ name: 'Recipe', value: recipeString, inline: true });
        });
    }
    if (item.drink) {
        embed.addFields({ name: 'Energy', value: item.drink.count.toString() });
    }

    const imagePath = paths.myAssetUrl + `/sandbox/items/${item.data.itemId}.png`;
    if (await urlExists(imagePath))
        embed.setThumbnail(imagePath);

    return { embeds: [embed] };
}
export async function buildSandboxStageMessage(theme: number, stage: T.SandboxStage, page: number): Promise<Djs.BaseMessageOptions> {
    const stageInfo = stage.excel;
    const stageData = stage.levels;

    const title = `${stageInfo.code} - ${stageInfo.name}`;
    const description = removeStyleTags(stageInfo.description);

    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(title)
        .setURL(`${paths.stageViewerUrl}?level=${stage.excel.stageId.toLowerCase()}`)
        .setDescription(description);

    embed.addFields(await buildStageEnemyFields(stageData));

    const imageButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId(`ra${theme + 2}`, 'stage', stage.excel.stageId, 0))
        .setLabel('Preview')
        .setStyle(Djs.ButtonStyle.Primary);
    const diagramButton = new Djs.ButtonBuilder()
        .setCustomId(createCustomId(`ra${theme + 2}`, 'stage', stage.excel.stageId, 1))
        .setLabel('Diagram')
        .setStyle(Djs.ButtonStyle.Primary);
    const buttonRow = new Djs.ActionRowBuilder<Djs.ButtonBuilder>().addComponents(imageButton, diagramButton);

    switch (page) {
        case 0:
            imageButton.setDisabled(true);
            break;
        case 1:
            diagramButton.setDisabled(true);
            break;
    }

    if (page === 0) {
        const imagePath = paths.myAssetUrl + `/sandbox/stages/${stageInfo.stageId}.png`;

        if (await urlExists(imagePath)) {
            embed.setImage(imagePath)
            return { content: '', embeds: [embed], components: [buttonRow] };
        }
        else {
            embed.addFields(buildStageDiagramFields(stageData));
            return { content: '', embeds: [embed], components: [] };
        }
    }
    else {
        embed.addFields(buildStageDiagramFields(stageData));
        return { content: '', embeds: [embed], components: [buttonRow] };
    }
}
export async function buildSandboxWeatherMessage(theme: number, weather: T.SandboxWeather): Promise<Djs.BaseMessageOptions> {
    const embed = new Djs.EmbedBuilder()
        .setColor(embedColour)
        .setTitle(weather.name)
        .setDescription(`${weather.functionDesc}\n\n${weather.description}`);

    const imagePath = paths.myAssetUrl + `/sandbox/weather/${weather.weatherIconId}.png`;
    if (await urlExists(imagePath))
        embed.setThumbnail(imagePath);

    return { embeds: [embed] };
}
export async function buildSpineEnemyMessage(gifFile: string, enemy: T.Enemy, animArr: string[], anim: string): Promise<Djs.BaseMessageOptions> {
    const id = enemy.excel.enemyId;

    const authorField = buildEnemyAuthorField(enemy);

    const gifPath = join(__dirname, 'spine', gifFile);
    const gif = new Djs.AttachmentBuilder(gifPath);

    const animSelector = new Djs.StringSelectMenuBuilder()
        .setCustomId(createCustomId('spine', 'enemy', id, null, null))
        .setPlaceholder(anim);
    const componentRow = new Djs.ActionRowBuilder<Djs.StringSelectMenuBuilder>().addComponents(animSelector);

    for (let i = 0; i < Math.min(animArr.length, 25); i++) {
        if (animArr[i] === 'Default') continue; // Default animations are a single frame that lasts forever, they do not work and should not be shown

        animSelector.addOptions(new Djs.StringSelectMenuOptionBuilder()
            .setLabel(animArr[i])
            .setValue(animArr[i])
        );
    }

    const embed = new Djs.EmbedBuilder()
        .setAuthor(authorField)
        .setImage(`attachment://${cleanFilename(gifFile)}`)
        .setColor(embedColour);

    return { content: '', embeds: [embed], files: [gif], components: [componentRow] };
}
export async function buildSpineOperatorMessage(gifFile: string, op: T.Operator, skin: string, set: string, animArr: string[], anim: string): Promise<Djs.BaseMessageOptions> {
    const id = op.id;

    const authorField = buildDeployableAuthorField(op);

    const gifPath = join(__dirname, 'spine', gifFile);
    const gif = new Djs.AttachmentBuilder(gifPath);

    const animSelector = new Djs.StringSelectMenuBuilder()
        .setCustomId(createCustomId('spine', 'operator', id, skin, set))
        .setPlaceholder(anim);
    const componentRow = new Djs.ActionRowBuilder<Djs.StringSelectMenuBuilder>().addComponents(animSelector);

    for (let i = 0; i < Math.min(animArr.length, 25); i++) {
        if (animArr[i] === 'Default') continue; // Default animations are a single frame that lasts forever, they do not work and should not be shown

        animSelector.addOptions(new Djs.StringSelectMenuOptionBuilder()
            .setLabel(animArr[i])
            .setValue(animArr[i])
        );
    }

    const embed = new Djs.EmbedBuilder()
        .setAuthor(authorField)
        .setImage(`attachment://${cleanFilename(gifFile)}`)
        .setColor(embedColour);

    return { content: '', embeds: [embed], files: [gif], components: [componentRow] };
}
export async function buildSpineDeployMessage(gifFile: string, deploy: T.Deployable, skin: string, set: string, animArr: string[], anim: string): Promise<Djs.BaseMessageOptions> {
    const id = deploy.id;

    const authorField = buildDeployableAuthorField(deploy);

    const gifPath = join(__dirname, 'spine', gifFile);
    const gif = new Djs.AttachmentBuilder(gifPath);

    const animSelector = new Djs.StringSelectMenuBuilder()
        .setCustomId(createCustomId('spine', 'deploy', id, skin, set))
        .setPlaceholder(anim);
    const componentRow = new Djs.ActionRowBuilder<Djs.StringSelectMenuBuilder>().addComponents(animSelector);

    for (let i = 0; i < Math.min(animArr.length, 25); i++) {
        if (animArr[i] === 'Default') continue; // Default animations are a single frame that lasts forever, they do not work and should not be shown

        animSelector.addOptions(new Djs.StringSelectMenuOptionBuilder()
            .setLabel(animArr[i])
            .setValue(animArr[i])
        );
    }

    const embed = new Djs.EmbedBuilder()
        .setAuthor(authorField)
        .setImage(`attachment://${cleanFilename(gifFile)}`)
        .setColor(embedColour);

    return { content: '', embeds: [embed], files: [gif], components: [componentRow] };
}
export async function buildStageMessage(stage: T.Stage, level: number) {
    const container = new Djs.ContainerBuilder().setAccentColor(embedColour);

    level = C.Stage.clampIndex(level);

    const components = await buildStageComponents(stage, level);
    container.addTextDisplayComponents(components.text);
    if (components.gallery) {
        container.addMediaGalleryComponents(components.gallery);
    }
    if (components.galleryExists) {
        container.addSeparatorComponents(new Djs.SeparatorBuilder().setSpacing(Djs.SeparatorSpacingSize.Large));

        const buttonLabels = ['Preview', 'Diagram'];

        const levelRow = new Djs.ActionRowBuilder<Djs.StringSelectMenuBuilder>();
        container.addActionRowComponents(levelRow);

        const stageIndex = C.Stage.isChallenge(stage)
            ? (await api.single('toughstage', { query: stage.excel.code.toLowerCase() })).findIndex(x => x.excel.stageId === stage.excel.stageId)
            : (await api.single('stage', { query: stage.excel.code.toLowerCase() })).findIndex(x => x.excel.stageId === stage.excel.stageId)

        const levelSelect = new Djs.StringSelectMenuBuilder()
            .setCustomId(createCustomId('stage', stage.excel.code, stageIndex, C.Stage.isChallenge(stage)));
        levelRow.addComponents(levelSelect);

        for (let i = 0; i < buttonLabels.length; i++) {
            const levelOption = new Djs.StringSelectMenuOptionBuilder()
                .setLabel(buttonLabels[i])
                .setValue(i.toString())
                .setDefault(i === level);
            levelSelect.addOptions(levelOption);
        }
    }

    return { components: [container], flags: Djs.MessageFlags.IsComponentsV2 | Djs.MessageFlags.Ephemeral }; // remove ephemeral once patched
}

function buildDeployableAuthorField(deploy: T.Deployable): Djs.EmbedAuthorOptions {
    const authorField = { name: deploy.data.name, iconURL: paths.myAssetUrl + `/operator/avatars/${deploy.id}.png` };
    return authorField;
}
function buildEnemyAuthorField(enemy: T.Enemy): Djs.EmbedAuthorOptions {
    const authorField = { name: enemy.excel.name, iconURL: paths.myAssetUrl + `/enemy/${enemy.excel.enemyId}.png` };
    return authorField;
}
function buildBannerField(opNames: T.Operator[], banner: T.GachaPool): Djs.EmbedField {
    let bannerName = banner.client.gachaPoolName === 'Rare Operators useful in all kinds of stages'
        ? banner.client.gachaRuleType === 'CLASSIC'
            ? 'Kernel Banner'
            : 'Standard Banner'
        : banner.client.gachaPoolName;
    let bannerDates = `<t:${banner.client.openTime}> to <t:${banner.client.endTime}>`;
    if (C.GachaPool.isCurrent(banner)) {
        bannerDates += ' - Ends <t:' + banner.client.endTime + ':R>';
    }
    else if (C.GachaPool.isFuture(banner)) {
        bannerDates += ` - Starts <t:${banner.client.openTime}:R>`;
    }
    let bannerDesc = '';
    if (C.GachaPool.isJointOperation(banner)) {
        const ops6 = [], ops5 = [];
        for (const charId of banner.details.detailInfo.availCharInfo.perAvailList[0].charIdList) {
            const char = opNames.find(char => char.id === charId);
            ops6.push(getOpPrettyName(char, { rarity: false }));
        }
        for (const charId of banner.details.detailInfo.availCharInfo.perAvailList[1].charIdList) {
            const char = opNames.find(char => char.id === charId);
            ops5.push(getOpPrettyName(char, { rarity: false }));
        }
        bannerDesc = `6★ ${ops6.join(', ')}\n5★ ${ops5.join(', ')}`;
    }
    else if (C.GachaPool.isNormal(banner)) {
        const ops6 = [], ops5 = [];
        for (const charList of banner.details.detailInfo.upCharInfo.perCharList) {
            for (const charId of charList.charIdList) {
                const char = opNames.find(char => char.id === charId);
                if (charList.rarityRank === 5) ops6.push(getOpPrettyName(char, { rarity: false }));
                else if (charList.rarityRank === 4) ops5.push(getOpPrettyName(char, { rarity: false }));
            }
        }
        if (ops6.length === 0) {
            for (const charList of banner.details.detailInfo.availCharInfo.perAvailList) {
                for (const charId of charList.charIdList) {
                    const char = opNames.find(char => char.id === charId);
                    if (charList.rarityRank === 5) ops6.push(getOpPrettyName(char, { rarity: false }));
                }
            }
        }
        bannerDesc = `6★ ${ops6.join(', ')}\n5★ ${ops5.join(', ')}`;
    }
    else {
        switch (banner.client.gachaRuleType) {
            case 'FESCLASSIC': {
                bannerName = 'Kernel Locating';
                bannerDesc = 'Select and lock-in two 6★ and three 5★ Kernel operators.';
                break;
            }
            case 'CLASSIC_ATTAIN': {
                bannerDesc = 'First 6★ is guaranteed to be an unowned Kernel operator.';
                break;
            }
            case 'ATTAIN': {
                bannerDesc = `First 6★ is guaranteed to be an unowned operator from a pool.`;
                break;
            }
            case 'SPECIAL': {
                const ops6 = [];
                for (const charList of banner.details.detailInfo.availCharInfo.perAvailList) {
                    for (const charId of charList.charIdList) {
                        const char = opNames.find(char => char.id === charId);
                        if (charList.rarityRank === 5) ops6.push(getOpPrettyName(char, { rarity: false }));
                    }
                }
                bannerDesc = `Select and lock-in three 6★ and three 5★ operators from a pool.\n6★ ${ops6.join(', ')}`;
                break;
            }
            default: {
                throw new Error(`Unknown banner type: ${banner.client.gachaPoolId}, ${banner.client.gachaRuleType}`);
            }
        }
    }
    return { name: bannerName, value: `${bannerDates}\n${bannerDesc}`, inline: false };
}
function buildCostString(costs: T.LevelUpCost[], itemArr: T.Item[]): string {
    let description = '';
    for (const cost of costs) {
        const item = itemArr.find(e => e.data.itemId === cost.id);
        description += `${getItemEmoji(item)} ${item.data.name} **x${cost.count}**\n`;
    }
    return description;
}
function buildEventField(event: T.GameEvent): Djs.EmbedField {
    let eventString = `<t:${event.startTime}> to <t:${event.endTime}>`;
    if (C.GameEvent.isCurrent(event)) {
        eventString += ' - Ends <t:' + event.endTime + ':R>';
    }
    else if (C.GameEvent.isFuture(event)) {
        eventString += ` - Starts <t:${event.startTime}:R>`;
    }
    return { name: event.name, value: eventString, inline: false };
}
function buildRangeString(range: T.GridRange): string {
    let left = 0, right = 0, top = 0, bottom = 0;
    for (const square of range.grids) {
        if (square.col < left)
            left = square.col
        else if (square.col > right)
            right = square.col;
        if (square.row < bottom)
            bottom = square.row
        else if (square.row > top)
            top = square.row;
    }

    const arrCols = right - left + 1;
    const arrRows = top - bottom + 1;
    const rangeArr = new Array(arrCols);
    for (let i = 0; i < arrCols; i++) {
        rangeArr[i] = new Array(arrRows);
    }
    for (const square of range.grids) {
        rangeArr[square.col - left][-square.row - bottom] = 1;
    }
    rangeArr[-left][-bottom] = 2;

    let rangeString = '';
    for (let i = 0; i < arrRows; i++) {
        for (let j = 0; j < arrCols; j++) {
            switch (rangeArr[j][i]) {
                case (1):
                    rangeString += '🔳';
                    break;
                case (2):
                    rangeString += '🟦';
                    break;
                default:
                    rangeString += '⬛';
                    break;
            }
        }
        rangeString += '\n';
    }
    return rangeString.slice(0, -1);
}
function buildStageDiagramFields(stageData: T.StageData): Djs.EmbedField[] {
    const tileDict = {
        "unknown": {
            "emoji": "❓",
            "name": "Unknown Tile"
        },
        "tile_bigforce": {
            "emoji": "💪",
            "name": "Specialist Tactical Point"
        },
        "tile_corrosion": {
            "emoji": "💔",
            "name": "Corrosive Ground"
        },
        "tile_deepwater": {
            "emoji": "🔷",
            "name": "Deep Water Zone"
        },
        "tile_defup": {
            "emoji": "🛡️",
            "name": "Defensive Rune"
        },
        "tile_end": {
            "emoji": "🟦",
            "name": "Protection Objective"
        },
        "tile_fence": {
            "emoji": "🟨",
            "name": "Fence"
        },
        "tile_fence_bound": {
            "emoji": "🟨",
            "name": "Fence"
        },
        "tile_floor": {
            "emoji": "❎",
            "name": "Non-deployable Area"
        },
        "tile_flystart": {
            "emoji": "🔴",
            "name": "Aerial Unit Incursion Point"
        },
        "tile_forbidden": {
            "emoji": "⬛",
            "name": "No Entry Zone"
        },
        "tile_gazebo": {
            "emoji": "🔫",
            "name": "Anti-Air Rune"
        },
        "tile_grass": {
            "emoji": "🌱",
            "name": "Bush"
        },
        "tile_healing": {
            "emoji": "💟",
            "name": "Medical Rune"
        },
        "tile_hole": {
            "emoji": "🔳",
            "name": "Hole"
        },
        "tile_infection": {
            "emoji": "☢️",
            "name": "Active Originium"
        },
        "tile_rcm_crate": {
            "emoji": "✅",
            "name": "Recommended Roadblock Point"
        },
        "tile_rcm_operator": {
            "emoji": "✅",
            "name": "Recommended Deployment Point"
        },
        "tile_road": {
            "emoji": "🟩",
            "name": "Flat Ground"
        },
        "tile_shallowwater": {
            "emoji": "💧",
            "name": "Shallow Water Zone"
        },
        "tile_start": {
            "emoji": "🟥",
            "name": "Incursion Point"
        },
        "tile_telin": {
            "emoji": "🔻",
            "name": "Tunnel Entry"
        },
        "tile_telout": {
            "emoji": "🔺",
            "name": "Tunnel Exit"
        },
        "tile_volcano": {
            "emoji": "🔥",
            "name": "Heat Pump Passage"
        },
        "tile_volspread": {
            "emoji": "🌋",
            "name": "Lava Crack"
        },
        "tile_wall": {
            "emoji": "⬜",
            "name": "High Ground"
        },
        "tile_defbreak": {
            "emoji": "💔",
            "name": "Corrosive Ground"
        },
        "tile_smog": {
            "emoji": "☁️",
            "name": "Exhaust Grille"
        },
        "tile_yinyang_road": {
            "emoji": "☯️",
            "name": "Mark of Hui and Ming (Road)"
        },
        "tile_yinyang_wall": {
            "emoji": "☯️",
            "name": "Mark of Hui and Ming (Wall)"
        },
        "tile_yinyang_switch": {
            "emoji": "☯️",
            "name": "Mark of Dusk and Dawn"
        },
        "tile_poison": {
            "emoji": "☠️",
            "name": "Gas Spray"
        },
        "tile_deepsea": {
            "emoji": "🔷",
            "name": "Deep Water Zone"
        },
        "tile_icestr": {
            "emoji": "🧊",
            "name": "Icy Surface"
        },
        "tile_icetur_lb": {
            "emoji": "🧊",
            "name": "Icy Corner"
        },
        "tile_icetur_lt": {
            "emoji": "🧊",
            "name": "Icy Corner"
        },
        "tile_icetur_rb": {
            "emoji": "🧊",
            "name": "Icy Corner"
        },
        "tile_icetur_rt": {
            "emoji": "🧊",
            "name": "Icy Corner"
        },
        "tile_magic_circle": {
            "emoji": "✨",
            "name": "Activated \"Resonator\""
        },
        "tile_magic_circle_h": {
            "emoji": "✨",
            "name": "Activated \"Resonator\""
        },
        "tile_aircraft": {
            "emoji": "🛫",
            "name": "Aircraft"
        },
        "tile_creep": {
            "emoji": "🟩",
            "name": "Flat Ground (Nethersea Brand)"
        },
        "tile_creepf": {
            "emoji": "❎",
            "name": "Non-deployable Area (Nethersea Brand)"
        },
        "tile_empty": {
            "emoji": "🔳",
            "name": "Empty"
        },
        "tile_volcano_emp": {
            "emoji": "🔥",
            "name": "Heat Pump Passage"
        },
        "tile_reed": {
            "emoji": "🟢",
            "name": "Flat Ground (Reeds)"
        },
        "tile_reedf": {
            "emoji": "🌱",
            "name": "Non-deployable Area (Reeds)"
        },
        "tile_reedw": {
            "emoji": "⚪",
            "name": "High Ground (Reeds)"
        },
        "tile_mire": {
            "emoji": "🟫",
            "name": "Mire"
        },
        "tile_passable_wall": {
            "emoji": "⬜",
            "name": "Yumen Catastrophe Fortification"
        },
        "tile_passable_wall_forbidden": {
            "emoji": "◽",
            "name": "Yumen Catastrophe Fortification (Non-deployable)"
        },
        "tile_stairs": {
            "emoji": "🪜",
            "name": "Ladder"
        },
        "tile_water": {
            "emoji": "🔷",
            "name": "Clear Waters"
        },
        "tile_grvtybtn": {
            "emoji": "⏹️",
            "name": "Gravity Sensor"
        },
        "tile_woodrd": {
            "emoji": "🪵",
            "name": "Temporary Path"
        },
        "tile_flower": {
            "emoji": "🟩",
            "name": "Flat Ground (Flowerable)"
        },
        "tile_flowerf": {
            "emoji": "❎",
            "name": "Non-deployable Area (Flowerable)"
        },
        "tile_xbdpsea": {
            "emoji": "🔷",
            "name": "Deep Water Zone"
        },
        "tile_puddle": {
            "emoji": "🔷",
            "name": "Deep Water Zone"
        }
    };

    const map = stageData.mapData.map;
    const tiles = stageData.mapData.tiles;
    let mapString = '', legendArr = [];

    for (let i = 0; i < map.length; i++) {
        for (let j = 0; j < map[0].length; j++) {
            const tileKey = tiles[map[i][j]].tileKey;
            const tile = tileDict.hasOwnProperty(tileKey) ? tileDict[tileKey] : tileDict['unknown'];
            mapString += tile.emoji;

            if (legendArr.includes(`${tile.emoji} - ${tile.name}`)) continue;

            legendArr.push(`${tile.emoji} - ${tile.name}`);
        }
        mapString += '\n';
    }
    const legendString = legendArr.join('\n');

    return [{ name: 'Map', value: mapString, inline: false }, { name: 'Legend', value: legendString, inline: false }];
}
async function buildStageEnemyFields(stageData: T.StageData): Promise<Djs.EmbedField[]> {
    const waveDict: { [key: string]: number } = {}; // enemyId => enemy quantity
    for (const wave of stageData.waves) { // Count number of enemies in stage, store results in waveDict
        for (const fragment of wave.fragments) {
            for (const action of fragment.actions) {
                if (typeof action.actionType === 'string' && action.actionType === 'SPAWN' || typeof action.actionType === 'number' && action.actionType === 0)
                    waveDict[action.key] = (waveDict[action.key] ?? 0) + action.count;
                // legacy number types:
                // 0: spawn
                // 1: skip??
                // 2: tutorial/story popup
                // 3: not used
                // 4: change bgm
                // 5: enemy intro popup
                // 6: spawn npc/trap
                // 7: stage effect (rumble)
                // 8: environmental effect (blizzards)
                // 9: some sss tutorial thing idk
            }
        }
    }

    const enemyArr = await api.all('enemy', { include: ['excel.enemyId', 'excel.enemyIndex', 'excel.name', 'excel.enemyLevel', 'levels.Value.level'] })
    let enemyString = '', eliteString = '', bossString = '';
    for (const enemyRef of stageData.enemyDbRefs) {
        const enemy = enemyArr.find(e => e.excel.enemyId === enemyRef.id);

        if (!enemy) continue;

        let enemyLine = `${enemy.excel.enemyIndex} - ${enemy.excel.name}`;
        if (C.Enemy.hasLevels(enemy)) {
            enemyLine += ` (Lv${enemyRef.level + 1})`; // Add predefine level if enemy has more than one
        }
        if (waveDict.hasOwnProperty(enemy.excel.enemyId)) {
            enemyLine += ` **x${waveDict[enemy.excel.enemyId]}**`; // Enemies like IS3 chests and OD rock slugs don't have predefined quantities, exclude these
        }
        enemyLine += '\n';

        switch (enemy.excel.enemyLevel) {
            case ('NORMAL'):
                enemyString += enemyLine;
                break;
            case ('ELITE'):
                eliteString += enemyLine;
                break;
            case ('BOSS'):
                bossString += enemyLine;
                break;
        }
    }

    const fieldArr: Djs.EmbedField[] = [];
    if (enemyString !== '') {
        fieldArr.push({ name: 'Enemies', value: enemyString, inline: true });
    }
    if (eliteString !== '') {
        fieldArr.push({ name: 'Elites', value: eliteString, inline: true });
    }
    if (bossString !== '') {
        fieldArr.push({ name: 'Leaders', value: bossString, inline: false });
    }

    return fieldArr;
}
async function buildStageEnemyComponents(stageData: T.StageData): Promise<Djs.TextDisplayBuilder[]> {
    const waveDict: { [key: string]: number } = {}; // enemyId => enemy quantity
    for (const wave of stageData.waves) { // Count number of enemies in stage, store results in waveDict
        for (const fragment of wave.fragments) {
            for (const action of fragment.actions) {
                if (typeof action.actionType === 'string' && action.actionType === 'SPAWN' || typeof action.actionType === 'number' && action.actionType === 0)
                    waveDict[action.key] = (waveDict[action.key] ?? 0) + action.count;
                // legacy number types:
                // 0: spawn
                // 1: skip??
                // 2: tutorial/story popup
                // 3: not used
                // 4: change bgm
                // 5: enemy intro popup
                // 6: spawn npc/trap
                // 7: stage effect (rumble)
                // 8: environmental effect (blizzards)
                // 9: some sss tutorial thing idk
            }
        }
    }

    const enemyArr = await api.all('enemy', { include: ['excel.enemyId', 'excel.enemyIndex', 'excel.name', 'excel.enemyLevel', 'levels.Value.level'] })
    let enemyString = '', eliteString = '', bossString = '';
    for (const enemyRef of stageData.enemyDbRefs) {
        const enemy = enemyArr.find(e => e.excel.enemyId === enemyRef.id);

        if (!enemy) continue;

        let enemyLine = `${enemy.excel.enemyIndex} - ${enemy.excel.name}`;
        if (C.Enemy.hasLevels(enemy)) {
            enemyLine += ` (Lv${enemyRef.level + 1})`; // Add predefine level if enemy has more than one
        }
        if (waveDict.hasOwnProperty(enemy.excel.enemyId)) {
            enemyLine += ` **x${waveDict[enemy.excel.enemyId]}**`; // Enemies like IS3 chests and OD rock slugs don't have predefined quantities, exclude these
        }
        enemyLine += '\n';

        switch (enemy.excel.enemyLevel) {
            case ('NORMAL'):
                enemyString += enemyLine;
                break;
            case ('ELITE'):
                eliteString += enemyLine;
                break;
            case ('BOSS'):
                bossString += enemyLine;
                break;
        }
    }

    const section: Djs.TextDisplayBuilder[] = [];
    if (enemyString !== '') {
        const enemyText = new Djs.TextDisplayBuilder()
            .setContent([
                '**Enemies**',
                enemyString
            ].join('\n'));
        section.push(enemyText);
    }
    if (eliteString !== '') {
        const eliteText = new Djs.TextDisplayBuilder()
            .setContent([
                '**Elites**',
                eliteString
            ].join('\n'));
        section.push(eliteText);
    }
    if (bossString !== '') {
        const bossText = new Djs.TextDisplayBuilder()
            .setContent([
                '**Leaders**',
                bossString
            ].join('\n'));
        section.push(bossText);
    }

    return section;
}

async function buildTitleSection(deploy: T.Deployable, extendedStats: boolean = false): Promise<Djs.SectionBuilder> {
    const section = new Djs.SectionBuilder();

    let avatarThumb = `${paths.myAssetUrl}/operator/avatars/${deploy.id}.png`;
    if (deploy.id === 'char_1037_amiya3') avatarThumb = paths.myAssetUrl + `/operator/avatars/char_1037_amiya3_2.png`;
    const titleThumb = new Djs.ThumbnailBuilder({ media: { url: avatarThumb } });
    section.setThumbnailAccessory(titleThumb);

    let description = removeStyleTags(deploy.data.description);
    if (C.Deployable.hasTrait(deploy)) {
        const candidate = deploy.data.trait.candidates[deploy.data.trait.candidates.length - 1];
        if (candidate.overrideDescripton) {
            description = insertBlackboard(candidate.overrideDescripton, candidate.blackboard);
        }
    }

    const titleContent = [
        `## ${deploy.data.name} - ${'★'.repeat(gameConsts.rarity[deploy.data.rarity] + 1)}`,
        `**${gameConsts.professions[deploy.data.profession]} - ${deploy.archetype}**`,
        description
    ]
    if (extendedStats) {
        if (C.Deployable.hasRange(deploy)) {
            titleContent.push(
                '',
                '**Range**',
                buildRangeString(deploy.range),
            );
        }
        if (C.Deployable.hasTalents(deploy)) {
            for (const talent of deploy.data.talents) {
                if (talent.candidates) {
                    const candidate = talent.candidates[talent.candidates.length - 1];
                    if (candidate.name) {
                        titleContent.push(
                            '',
                            `***${candidate.name}***`,
                            insertBlackboard(candidate.description, candidate.blackboard)
                        )
                    }
                }
            }
        }
    }

    const titleText = new Djs.TextDisplayBuilder()
        .setContent(titleContent.join('\n'));
    section.addTextDisplayComponents(titleText);

    return section;
}
function buildDeployableComponents(deploy: T.Deployable): Djs.TextDisplayBuilder {
    const deployableContent = [];

    if (C.Deployable.hasPotentials(deploy)) {
        deployableContent.push(
            '\n**Potentials**',
            deploy.data.potentialRanks.map(potential => potential.description).join('\n')
        );
    }

    const trustStats = deploy.data.favorKeyFrames?.at(1).data ?? null;
    const maxStats = deploy.data.phases[deploy.data.phases.length - 1].attributesKeyFrames[deploy.data.phases[deploy.data.phases.length - 1].attributesKeyFrames.length - 1].data;
    const hp = trustStats?.maxHp ? `${maxStats.maxHp + trustStats?.maxHp} (+${trustStats?.maxHp})` : maxStats.maxHp.toString();
    const atk = trustStats?.atk ? `${maxStats.atk + trustStats?.atk} (+${trustStats?.atk})` : maxStats.atk.toString();
    const def = trustStats?.def ? `${maxStats.def + trustStats?.def} (+${trustStats?.def})` : maxStats.def.toString();
    const res = trustStats?.magicResistance ? `${maxStats.magicResistance + trustStats?.magicResistance} (+${trustStats?.magicResistance})` : maxStats.magicResistance.toString();
    const dpCost = maxStats.cost;
    const block = maxStats.blockCnt;
    const redeploy = maxStats.respawnTime;
    const atkInterval = maxStats.baseAttackTime;

    deployableContent.push(
        '',
        '**Max Stats (+Trust)**',
        `❤️ **HP**\t\t\t\t\t  ${hp}`,
        `⚔️ **ATK**\t\t\t\t\t${atk}`,
        `🛡️ **DEF**\t\t\t\t\t${def}`,
        `✨ **RES**\t\t\t\t\t${res}`,
        `🏁 **DP Cost**\t\t\t${dpCost}`,
        `✋ **Block**\t\t\t\t ${block}`,
        `⌛ **Redeploy**\t\t  ${redeploy}`,
        `⏱️ **Interval**\t\t\t ${atkInterval}`
    );

    const deployableText = new Djs.TextDisplayBuilder()
        .setContent(deployableContent.join('\n'));

    return deployableText;
}
async function buildSkillSections(deploy: T.Deployable, level: number, index: number = null): Promise<Djs.SectionBuilder[]> {
    const spTypes = {
        "INCREASE_WHEN_ATTACK": "Offensive",
        "INCREASE_WHEN_TAKEN_DAMAGE": "Defensive",
        "INCREASE_WITH_TIME": "Per Second",
        "8": "Passive"
    };
    const skillTypes = {
        "AUTO": "Auto Trigger",
        "MANUAL": "Manual Trigger",
        "PASSIVE": "Passive"
    };

    const sections: Djs.SectionBuilder[] = [];

    const seenSkills = new Set();
    for (let i = index ?? 0; i <= (index ?? deploy.skills.length - 1); i++) {
        if (!C.Skill.isValid(deploy.skills[i])) continue;

        const skill = deploy.skills[i].excel;

        if (seenSkills.has(skill.skillId)) continue;

        seenSkills.add(skill.skillId);

        const skillLevel = skill.levels[level];

        const section = new Djs.SectionBuilder();
        sections.push(section);

        const skillThumb = new Djs.ThumbnailBuilder({ media: { url: paths.myAssetUrl + `/operator/skills/skill_icon_${skill.iconId ?? skill.skillId}.png` } });
        section.setThumbnailAccessory(skillThumb);

        const content = [
            `### ${skillLevel.name}`,
            `**${spTypes[skillLevel.spData.spType]} - ${skillTypes[skillLevel.skillType]}**`,
            `***Initial:* \`${skillLevel.spData.initSp}\` SP - *Cost:* \`${skillLevel.spData.spCost}\` SP${(skillLevel.duration && skillLevel.duration > 0) ? ` - *Duration:* \`${skillLevel.duration}\` sec` : ''}**`,
            insertBlackboard(skillLevel.description, skillLevel.blackboard)
        ];
        if (skillLevel.rangeId) {
            const range = await api.single('range', { query: skillLevel.rangeId });
            content.push(
                '',
                '**Range**',
                buildRangeString(range)
            );
        }

        const skillText = new Djs.TextDisplayBuilder()
            .setContent(content.join('\n'));
        section.addTextDisplayComponents(skillText);
    }

    return sections;
}
async function buildModuleSections(op: T.Operator, level: number): Promise<Djs.SectionBuilder[]> {
    const sections: Djs.SectionBuilder[] = [];

    for (let i = 0; i < op.modules.length; i++) {
        const module = op.modules[i];

        let description = [], talentName = null, talentDescription = null;
        for (const part of module.data.phases[level].parts) {
            if (part.overrideTraitDataBundle.candidates) {
                const candidate = part.overrideTraitDataBundle.candidates[part.overrideTraitDataBundle.candidates.length - 1];
                if (candidate.additionalDescription) {
                    description.push(`${insertBlackboard(candidate.additionalDescription, candidate.blackboard)}`);
                }
                if (candidate.overrideDescripton) {
                    description.push(`${insertBlackboard(candidate.overrideDescripton, candidate.blackboard)}`);
                }
            }
            if (part.addOrOverrideTalentDataBundle.candidates) {
                const candidate = part.addOrOverrideTalentDataBundle.candidates[part.addOrOverrideTalentDataBundle.candidates.length - 1];
                talentName = candidate.name ?? talentName;
                const upgradeDesc = insertBlackboard(candidate.upgradeDescription, candidate.blackboard);
                if (upgradeDesc !== '') {
                    talentDescription = upgradeDesc;
                }
                if (candidate.rangeId) {
                    const range = await api.single('range', { query: candidate.rangeId });
                    description.push(
                        '',
                        '**Range**',
                        buildRangeString(range)
                    );
                }
            }
        }

        const section = new Djs.SectionBuilder();
        sections.push(section);

        const moduleThumb = new Djs.ThumbnailBuilder({ media: { url: paths.myAssetUrl + `/operator/modules/${module.info.uniEquipId}.png` } });
        section.setThumbnailAccessory(moduleThumb);

        const content = [
            `### ${module.info.typeIcon.toUpperCase()} - ${module.info.uniEquipName}`,
            description.join('\n')
        ];
        if (talentName && talentDescription) {
            content.push(
                '',
                `***${talentName}***`,
                talentDescription
            );
        }
        content.push(
            '',
            '**Stats**',
            module.data.phases[level].attributeBlackboard.map(attribute => `${attribute.key.toUpperCase()} ${attribute.value > 0 ? '+' : ''}${attribute.value}`).join('\n')
        );

        const moduleText = new Djs.TextDisplayBuilder()
            .setContent(content.join('\n'));
        section.addTextDisplayComponents(moduleText);
    }

    return sections;
}
function buildBaseSections(op: T.Operator): Djs.SectionBuilder[] {
    const eliteLevels = {
        "PHASE_0": "E0",
        "PHASE_1": "E1",
        "PHASE_2": "E2",
        "PHASE_3": "E3"
    };

    const sections = [];

    for (const base of op.bases) {
        const section = new Djs.SectionBuilder();
        sections.push(section);

        const baseThumb = new Djs.ThumbnailBuilder({ media: { url: paths.myAssetUrl + `/operator/bases/${base.skill.skillIcon}.png` } });
        section.setThumbnailAccessory(baseThumb);

        const baseText = new Djs.TextDisplayBuilder()
            .setContent([
                `### ${base.skill.buffName} - ${eliteLevels[base.condition.cond.phase]}`,
                removeStyleTags(base.skill.description)
            ].join('\n'));
        section.addTextDisplayComponents(baseText);
    }

    return sections;
}
async function buildCostSections(op: T.Operator, level: number): Promise<Djs.SectionBuilder[]> {
    const evolveGoldCost = [
        [0, 0],
        [0, 0],
        [10000, 0],
        [15000, 60000],
        [20000, 120000],
        [30000, 180000]
    ];

    const itemArr = await api.all('item', { include: ['data'] });

    const sections = [];

    switch (level) {
        default:
        case 0: {
            for (let i = 0; i < op.data.phases.length; i++) {
                if (op.data.phases[i].evolveCost === null) continue;

                const section = new Djs.SectionBuilder();
                sections.push(section);

                const eliteThumb = new Djs.ThumbnailBuilder({ media: { url: paths.aceshipImageUrl + `/ui/elite/${i}.png` } });
                section.setThumbnailAccessory(eliteThumb);

                const costText = new Djs.TextDisplayBuilder()
                    .setContent([
                        `### Elite ${i}`,
                        buildCostString(op.data.phases[i].evolveCost, itemArr).slice(0, -1),
                        `${getItemEmoji('GOLD')} LMD **x${evolveGoldCost[gameConsts.rarity[op.data.rarity]][i - 1]}**`
                    ].join('\n'));
                section.addTextDisplayComponents(costText);
            }
            break;
        }
        case 1: {
            const section = new Djs.SectionBuilder();
            sections.push(section);

            const costThumb = new Djs.ThumbnailBuilder({ media: { url: paths.myAssetUrl + `/items/MTL_SKILL2.png` } });
            section.setThumbnailAccessory(costThumb);

            const costText = new Djs.TextDisplayBuilder()
                .setContent([
                    '### Skills',
                    ...op.data.allSkillLvlup.map((skill, i) => {
                        if (skill.lvlUpCost === null) return '';
                        return `\n**Level ${i + 2}**\n${buildCostString(skill.lvlUpCost, itemArr).slice(0, -1)}`;
                    }
                    ).filter(e => e !== '')
                ].join('\n'));
            section.addTextDisplayComponents(costText);
            break;
        }
        case 2: {
            for (let i = 0; i < op.data.skills.length; i++) {
                const section = new Djs.SectionBuilder();
                sections.push(section);

                const masteryThumb = new Djs.ThumbnailBuilder({ media: { url: paths.myAssetUrl + `/operator/skills/skill_icon_${op.skills[i].excel.iconId ?? op.skills[i].excel.skillId}.png` } });
                section.setThumbnailAccessory(masteryThumb);

                const costText = new Djs.TextDisplayBuilder()
                    .setContent([
                        `### ${op.skills[i].excel.levels[0].name}`,
                        ...op.data.skills[i].levelUpCostCond.map((cond, j) => {
                            if (cond.levelUpCost === null) return '';
                            return `\n**Mastery ${j + 1}**\n${buildCostString(cond.levelUpCost, itemArr).slice(0, -1)}`;
                        }),
                    ].join('\n'));
                section.addTextDisplayComponents(costText);
            }
            break;
        }
        case 3: {
            for (const module of op.modules) {
                if (C.Module.isDefault(module)) continue;

                const section = new Djs.SectionBuilder();
                sections.push(section);

                const moduleThumb = new Djs.ThumbnailBuilder({ media: { url: paths.myAssetUrl + `/operator/modules/${module.info.uniEquipId}.png` } });
                section.setThumbnailAccessory(moduleThumb);

                const costText = new Djs.TextDisplayBuilder()
                    .setContent([
                        `### ${module.info.typeIcon.toUpperCase()} - ${module.info.uniEquipName}`,
                        ...Object.keys(module.info.itemCost).map(key => {
                            return `\n**Level ${key}**\n${buildCostString(module.info.itemCost[key], itemArr).slice(0, -1)}`;
                        }),
                    ].join('\n'));
                section.addTextDisplayComponents(costText);
            }
            break;
        }
    }

    return sections;
}
function buildOutfitComponents(op: T.Operator, level: number): { section: Djs.SectionBuilder, gallery: Djs.MediaGalleryBuilder } {
    const section = new Djs.SectionBuilder();

    const displaySkin = op.skins[level].displaySkin;
    switch (displaySkin.skinGroupId) {
        case 'ILLUST_0': {
            const skingroupThumb = new Djs.ThumbnailBuilder({ media: { url: paths.aceshipImageUrl + `/ui/elite/0.png` } });
            section.setThumbnailAccessory(skingroupThumb);
            break;
        }
        case 'ILLUST_1': {
            const skingroupThumb = new Djs.ThumbnailBuilder({ media: { url: paths.aceshipImageUrl + `/ui/elite/1.png` } });
            section.setThumbnailAccessory(skingroupThumb);
            break;
        }
        case 'ILLUST_2': {
            const skingroupThumb = new Djs.ThumbnailBuilder({ media: { url: paths.aceshipImageUrl + `/ui/elite/2.png` } });
            section.setThumbnailAccessory(skingroupThumb);
            break;
        }
        case 'ILLUST_3': {
            const skingroupThumb = new Djs.ThumbnailBuilder({ media: { url: paths.aceshipImageUrl + `/ui/elite/3.png` } });
            section.setThumbnailAccessory(skingroupThumb);
            break;
        }
        default: {
            const skingroupThumb = new Djs.ThumbnailBuilder({ media: { url: paths.myAssetUrl + `/skingroups/${encodeURIComponent(displaySkin.skinGroupId.split('#')[1])}.png` } });
            section.setThumbnailAccessory(skingroupThumb);
            break;
        }
    }

    const artText = new Djs.TextDisplayBuilder()
        .setContent([
            `### ${displaySkin.skinGroupName}${displaySkin.skinName ? ` - ${displaySkin.skinName}` : ''}`
        ].join('\n'));
    section.addTextDisplayComponents(artText);

    if (displaySkin.drawerList && displaySkin.drawerList.length > 0) {
        const artistText = new Djs.TextDisplayBuilder()
            .setContent([
                `**${displaySkin.drawerList.length > 1 ? 'Artists' : 'Artist'}**`,
                displaySkin.drawerList.join('\n')
            ].join('\n'));
        section.addTextDisplayComponents(artistText);
    }

    const gallery = new Djs.MediaGalleryBuilder()
    gallery.addItems(new Djs.MediaGalleryItemBuilder()
        .setURL(paths.myAssetUrl + `/operator/arts/${encodeURIComponent(op.skins[level].portraitId)}.png`)
    )

    return { section, gallery };
}
async function buildStageComponents(stage: T.Stage | T.Paradox, level: number): Promise<{ text: Djs.TextDisplayBuilder[], gallery: Djs.MediaGalleryBuilder, galleryExists: boolean }> {
    const text: Djs.TextDisplayBuilder[] = [];

    const stageInfo = stage.excel;
    const stageData = stage.levels;

    const titleText = new Djs.TextDisplayBuilder()
        .setContent([
            `### ${stageInfo.code} - ${stageInfo.name}`,
            removeStyleTags(stageInfo.description)
        ].join('\n'));
    text.push(titleText);

    const enemyComponents = await buildStageEnemyComponents(stageData);
    text.push(...enemyComponents);

    const imagePath = paths.myAssetUrl + `/stages/${stageInfo.stageId}.png`;
    const toughPath = paths.myAssetUrl + `/stages/${stageInfo.stageId.replace('tough', 'main')}.png`;
    const newPath = paths.myAssetUrl + `/stages/${stageInfo.stageId.substring(0, stageInfo.stageId.length - 3)}.png`;
    switch (level) {
        default:
        case 0: {
            if (await urlExists(imagePath)) {
                const gallery = new Djs.MediaGalleryBuilder()
                    .addItems(new Djs.MediaGalleryItemBuilder()
                        .setURL(imagePath)
                    );
                return { text, gallery, galleryExists: true }
            }
            else if (await urlExists(toughPath)) {
                const gallery = new Djs.MediaGalleryBuilder()
                    .addItems(new Djs.MediaGalleryItemBuilder()
                        .setURL(toughPath)
                    );
                return { text, gallery, galleryExists: true }
            }
            else if (await urlExists(newPath)) {
                const gallery = new Djs.MediaGalleryBuilder()
                    .addItems(new Djs.MediaGalleryItemBuilder()
                        .setURL(newPath)
                    );
                return { text, gallery, galleryExists: true }
            }
            else {
                const diagram = buildStageDiagramFields(stageData);
                const diagramText = new Djs.TextDisplayBuilder()
                    .setContent([
                        '**Map**',
                        diagram[0].value,
                        '**Legend**',
                        diagram[1].value
                    ].join('\n'));
                text.push(diagramText);
                return { text, gallery: null, galleryExists: false }
            }
        }
        case 1: {
            const diagram = buildStageDiagramFields(stageData);
            const diagramText = new Djs.TextDisplayBuilder()
                .setContent([
                    '**Map**',
                    diagram[0].value,
                    '**Legend**',
                    diagram[1].value
                ].join('\n'));
            text.push(diagramText);
            return { text, gallery: null, galleryExists: await urlExists(imagePath) || await urlExists(toughPath) || await urlExists(newPath) };
        }
    }
}