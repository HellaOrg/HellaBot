import { AutocompleteInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder, StringSelectMenuInteraction } from 'discord.js';
import { promises, unlinkSync } from 'fs';
import { join } from 'path';
import Command from '../structures/Command';
import * as api from '../utils/api';
import { autocompleteDeployable, autocompleteEnemy, autocompleteOperator } from '../utils/autocomplete';
import { buildSpineDeployMessage, buildSpineEnemyMessage, buildSpineOperatorMessage } from '../utils/build';
import { Deployable, Enemy, Operator } from '../utils/canon';
import * as spineHelper from '../utils/spine/spineHelper';
const { paths } = require('../constants');

const fileExists = async (path: string) => !!(await promises.stat(path).catch(e => false));
const getSkelAnims = skelData => skelData.animations.filter(animation => animation.name !== 'Default').map(animation => animation.name);

const enemySpineIdOverride = {
    "enemy_1037_lunsbr": "enemy_1037_lunsabr",
    "enemy_1043_zomsbr": "enemy_1043_zomsabr",
    "enemy_1043_zomsbr_2": "enemy_1043_zomsabr_2'"
};

async function enemyPageClose(browser, interaction, enemy, animArr, anim, random) {
    await new Promise(r => setTimeout(r, 1000));
    await browser.close();

    const gifFile = join((enemySpineIdOverride[enemy.excel.enemyId] ?? enemy.excel.enemyId) + random + '.gif');
    const gifPath = join(__dirname, '..', 'utils', 'spine', gifFile);
    const spineEmbed = await buildSpineEnemyMessage(gifFile, enemy, animArr, anim);
    await interaction.editReply(spineEmbed);

    if (await fileExists(gifPath)) unlinkSync(gifPath);
}
async function operatorPageClose(browser, interaction, op, skin, set, animArr, anim, random) {
    await new Promise(r => setTimeout(r, 1000));
    await browser.close();

    const gifFile = join(skin + random + '.gif');
    const gifPath = join(__dirname, '..', 'utils', 'spine', gifFile);
    const spineEmbed = await buildSpineOperatorMessage(gifFile, op, skin, set, animArr, anim);
    await interaction.editReply(spineEmbed);

    if (await fileExists(gifPath)) unlinkSync(gifPath);
}
async function deployPageClose(browser, interaction, deploy, skin, set, animArr, anim, random) {
    await new Promise(r => setTimeout(r, 1000));
    await browser.close();

    const gifFile = join(skin + random + '.gif');
    const gifPath = join(__dirname, '..', 'utils', 'spine', gifFile);
    const spineEmbed = await buildSpineDeployMessage(gifFile, deploy, skin, set, animArr, anim);
    await interaction.editReply(spineEmbed);

    if (await fileExists(gifPath)) unlinkSync(gifPath);
}

export default class SpineCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('spine')
        .setDescription('Render spine animations')
        .addSubcommand(subcommand =>
            subcommand.setName('operator')
                .setDescription('Render an operator\'s spine animations')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Operator name')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option.setName('skin')
                        .setDescription('Operator skin')
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option.setName('set')
                        .setDescription('Operator animation set')
                        .addChoices(
                            { name: 'front', value: 'front' },
                            { name: 'back', value: 'back' },
                            { name: 'base', value: 'build' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('enemy')
                .setDescription('Render an enemy\'s spine animations')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Enemy name')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('deploy')
                .setDescription('Render a deployable\'s spine animations')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Deployable name')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option.setName('skin')
                        .setDescription('Deployable skin')
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option.setName('set')
                        .setDescription('Deployable animation set')
                        .setAutocomplete(true)
                )
        ) as SlashCommandBuilder;
    name = 'Spine';
    description = [
        'Render an operator or enemy\'s spine animations and send it as a GIF.',
        '`operator`: render an operator\'s spine animations. The `[skin]` and `[set]` fields are optional. If not specified, the values `default` and `front` will be used, respectively.',
        '`enemy`: render an enemy\'s spine animations.',
        '`deploy`: render a deployable\'s spine animations'
    ];
    usage = [
        '`/spine operator [operator]`',
        '`/spine operator [operator] [skin] [set]`',
        '`/spine enemy [enemy]`',
        '`/spine deploy [deployable]`'
    ];
    async autocomplete(interaction: AutocompleteInteraction) {
        const type = interaction.options.getSubcommand();
        switch (type) {
            case 'operator': {
                const focused = interaction.options.getFocused(true);
                switch (focused.name) {
                    case 'name': {
                        const arr = await autocompleteOperator({ query: focused.value });
                        return await interaction.respond(arr);
                    }
                    case 'skin': {
                        const name = interaction.options.getString('name').toLowerCase();
                        const op = await api.single('operator', { query: name, include: ['skins'] });
                        const arr = [{ name: 'Default', value: 'default' }]
                            .concat(...op.skins
                                .filter(s => s.displaySkin.skinName)
                                .map(s => ({ name: s.displaySkin.skinName, value: s.battleSkin.skinOrPrefabId })))
                            .filter(s => s.name.toLowerCase().includes(focused.value.toLowerCase()));
                        return await interaction.respond(arr);
                    }
                }
            }
            case 'enemy': {
                const value = interaction.options.getFocused().toLowerCase();
                const arr = await autocompleteEnemy({ query: value });
                return await interaction.respond(arr);
            }
            case 'deploy': {
                const focused = interaction.options.getFocused(true);
                switch (focused.name) {
                    case 'name': {
                        const arr = await autocompleteDeployable({ query: focused.value });
                        return await interaction.respond(arr);
                    }
                    case 'skin': {
                        const name = interaction.options.getString('name').toLowerCase();
                        const deploy = await api.single('deployable', { query: name, include: ['skins'] });
                        const arr = [{ name: 'Default', value: 'default' }]
                            .concat(...deploy.skins
                                .filter(s => s.battleSkin.skinOrPrefabId)
                                .map(s => ({ name: s.battleSkin.skinOrPrefabId, value: s.battleSkin.skinOrPrefabId })))
                            .filter(s => s.name.toLowerCase().includes(focused.value.toLowerCase()));
                        return await interaction.respond(arr);
                    }
                    case 'set': {
                        const name = interaction.options.getString('name').toLowerCase();
                        const skin = interaction.options.getString('skin')?.toLowerCase() ?? 'default';
                        const deploy = await api.single('deployable', { query: name });
                        const skinId = encodeURIComponent(deploy.skins.find(s => s.battleSkin.skinOrPrefabId?.toLowerCase() === skin)?.battleSkin.skinOrPrefabId?.toLowerCase() ?? deploy.id);
                        const arr = [];
                        const urlExists = async url => (await fetch(url)).status === 200;
                        for (const set of ['front', 'back', 'down']) {
                            const url = `${paths.myAssetUrl}/spine/deploy/battle/${skinId}/${set}/${skinId}.atlas`
                            if (await urlExists(url)) arr.push({ name: set, value: set });
                        };
                        return await interaction.respond(arr);
                    }
                }
            }
        }
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const type = interaction.options.getSubcommand();
        const name = interaction.options.getString('name').toLowerCase();

        switch (type) {
            case 'operator': {
                const skin = interaction.options.getString('skin')?.toLowerCase() ?? 'default';
                const set = interaction.options.getString('set')?.toLowerCase() ?? 'front';
                const op = await api.single('operator', { query: name, include: ['id', 'data', 'skins'] });

                if (!Operator.isValid(op))
                    return await interaction.reply({ content: `That ${type} doesn\'t exist!`, ephemeral: true });
                if (!Operator.containsSkin(op, skin))
                    return await interaction.reply({ content: 'That skin doesn\'t exist!', ephemeral: true });

                const skinId = op.skins.find(s => s.battleSkin.skinOrPrefabId.toLowerCase() === skin || s.displaySkin.skinName?.toLowerCase() === skin)?.battleSkin.skinOrPrefabId.toLowerCase() ?? op.id;
                const skelData = await spineHelper.loadSkel(type, skinId, set);

                if (!skelData)
                    return await interaction.reply({ content: 'There was an error while loading the spine data!', ephemeral: true });

                const animArr = getSkelAnims(skelData);

                await interaction.deferReply();

                const { page, browser, random } = await spineHelper.launchPage(type, skinId, set, animArr[0]);
                page.on('console', async message => {
                    if (message.text() === 'done') {
                        await operatorPageClose(browser, interaction, op, skinId, set, animArr, animArr[0], random);
                    }
                }).on('pageerror', async ({ message }) => {
                    await browser.close();
                    console.error(`Spine error for ${skinId}: ` + message);
                    return await interaction.editReply({ content: 'There was an error while generating the animation!' });
                });

                break;
            }
            case 'enemy': {
                const enemy = await api.single('enemy', { query: name, include: ['excel'] });

                if (!Enemy.isValid(enemy))
                    return await interaction.reply({ content: `That ${type} doesn\'t exist!`, ephemeral: true });

                const id = enemy.excel.enemyId;
                const skelData = await spineHelper.loadSkel(type, id, null, null);

                if (!skelData)
                    return await interaction.reply({ content: 'There was an error while loading the spine data!', ephemeral: true });

                const animArr = getSkelAnims(skelData);

                await interaction.deferReply();

                const { page, browser, random } = await spineHelper.launchPage(type, id, null, null, animArr[0]);
                page.on('console', async message => {
                    if (message.text() === 'done') {
                        await enemyPageClose(browser, interaction, enemy, animArr, animArr[0], random);
                    }
                }).on('pageerror', async ({ message }) => {
                    await browser.close();
                    console.error(`Spine error for ${id}: ` + message);
                    return await interaction.editReply({ content: 'There was an error while generating the animation!' });
                });

                break;
            }
            case 'deploy': {
                const skin = interaction.options.getString('skin')?.toLowerCase() ?? 'default';
                const set = interaction.options.getString('set')?.toLowerCase() ?? 'front';
                const deploy = await api.single('deployable', { query: name });

                if (!Deployable.isValid(deploy))
                    return await interaction.reply({ content: `That ${type} doesn\'t exist!`, ephemeral: true });
                if (!Deployable.containsSkin(deploy, skin))
                    return await interaction.reply({ content: 'That skin doesn\'t exist!', ephemeral: true });

                const skinId = deploy.skins.find(s => s.battleSkin.skinOrPrefabId?.toLowerCase() === skin)?.battleSkin.skinOrPrefabId?.toLowerCase() ?? deploy.id;
                const skelData = await spineHelper.loadSkel(type, skinId, set);

                if (!skelData)
                    return await interaction.reply({ content: 'There was an error while loading the spine data!', ephemeral: true });

                const animArr = getSkelAnims(skelData);

                await interaction.deferReply();

                const { page, browser, random } = await spineHelper.launchPage(type, skinId, set, animArr[0]);
                page.on('console', async message => {
                    if (message.text() === 'done') {
                        await deployPageClose(browser, interaction, deploy, skinId, set, animArr, animArr[0], random);
                    }
                }).on('pageerror', async ({ message }) => {
                    await browser.close();
                    console.error(`Spine error for ${skinId}: ` + message);
                    return await interaction.editReply({ content: 'There was an error while generating the animation!' });
                });

                break;
            }
        }
    }
    async selectResponse(interaction: StringSelectMenuInteraction<CacheType>, idArr: string[]) {
        const type = idArr[1];
        const id = idArr[2];
        const skin = idArr[3];
        const set = idArr[4];
        const anim = interaction.values[0];

        await interaction.update({ content: `Generating \`${anim}\` gif...`, components: [] });

        switch (type) {
            case 'operator': {
                const op = await api.single('operator', { query: id, include: ['id', 'data', 'skins'] });
                const skelData = await spineHelper.loadSkel(type, skin, set);
                const animArr = getSkelAnims(skelData);
                const { page, browser, random } = await spineHelper.launchPage(type, skin, set, anim);
                page.on('console', async message => {
                    if (message.text() === 'done') {
                        await operatorPageClose(browser, interaction, op, skin, set, animArr, anim, random)
                    }
                }
                ).on('pageerror', async ({ message }) => {
                    await browser.close();
                    console.error(`Spine error for ${id}: ` + message);
                    return await interaction.update({ content: 'There was an error while generating the animation!' });
                });

                break;
            }
            case 'enemy': {
                const enemy = await api.single('enemy', { query: id, include: ['excel'] });
                const skelData = await spineHelper.loadSkel(type, id, null, null);
                const animArr = getSkelAnims(skelData);
                const { page, browser, random } = await spineHelper.launchPage(type, id, null, anim);
                page.on('console', async message => {
                    if (message.text() === 'done') {
                        await enemyPageClose(browser, interaction, enemy, animArr, anim, random);
                    }
                }).on('pageerror', async ({ message }) => {
                    await browser.close();
                    console.error(`Spine error for ${id}: ` + message);
                    return await interaction.update({ content: 'There was an error while generating the animation!' });
                });

                break;
            }
            case 'deploy': {
                const deploy = await api.single('deployable', { query: id });
                const skelData = await spineHelper.loadSkel(type, skin, set);
                const animArr = getSkelAnims(skelData);
                const { page, browser, random } = await spineHelper.launchPage(type, skin, set, anim);
                page.on('console', async message => {
                    if (message.text() === 'done') {
                        await deployPageClose(browser, interaction, deploy, skin, set, animArr, anim, random);
                    }
                }).on('pageerror', async ({ message }) => {
                    await browser.close();
                    console.error(`Spine error for ${id}: ` + message);
                    return await interaction.update({ content: 'There was an error while generating the animation!' });
                });

                break;
            }
        }
    }
};