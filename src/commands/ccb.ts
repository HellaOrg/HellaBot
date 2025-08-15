import { AutocompleteInteraction, ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder, StringSelectMenuInteraction } from 'discord.js';
import Command from '../structures/Command';
import * as api from '../utils/api';
import { autocompleteCCB, autocompleteCCBLegacy } from '../utils/autocomplete';
import { buildCCBLegacyMessage, buildCCBLegacySelectMessage, buildCCBMessage, buildCCBSelectMessage } from '../utils/build';
import { CCSeason, CCStage, CCStageLegacy } from '../utils/canon';
const { gameConsts } = require('../constants');

export default class CCBCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('ccb')
        .setDescription('Show information on a CCB stage or season')
        .addSubcommand(subcommand =>
            subcommand.setName('stage')
                .setDescription('Show information on a CCB stage')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Stage name')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('season')
                .setDescription('Show information on a CCB season')
                .addStringOption(option =>
                    option.setName('index')
                        .setDescription('Season #')
                        .setRequired(true)
                        .addChoices(
                            { name: 'poo', value: 'poo' },
                            { name: '1', value: '1' },
                            { name: '2', value: '2' },
                            { name: '3', value: '3' },
                        )
                )
        ) as SlashCommandBuilder;
    name = 'CCB';
    description = [
        'Show information on a Contingency Contract Battleplan stage.',
        '`stage`: show the enemy list, image preview, and stage diagram for a stage.',
        '`season`: show the list of stages for a season.'
    ];
    usage = [
        '`/ccb stage [stage]`',
        '`/ccb season [season]`'
    ]
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const arr = autocompleteCCBLegacy(value);
        if (arr.length < 6)
            arr.push(...await autocompleteCCB({ query: value }));
        return await interaction.respond(arr.slice(0, 6));
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const type = interaction.options.getSubcommand();

        switch (type) {
            case 'stage': {
                const name = interaction.options.getString('name').toLowerCase();

                if (gameConsts.ccbStages.find(stage => [stage.name.toLowerCase(), stage.levelId.split('/')[stage.levelId.split('/').length - 1]].includes(name))) {
                    const stage = await api.single('ccb/legacy', { query: name });

                    if (!CCStageLegacy.isValid(stage))
                        return await interaction.reply({ content: 'That stage data doesn\'t exist!', ephemeral: true });

                    await interaction.deferReply();

                    const ccbEmbed = await buildCCBLegacyMessage(stage, 0);
                    return await interaction.editReply(ccbEmbed);
                }
                else {
                    const stage = await api.single('ccb/stage', { query: name });

                    if (!CCStage.isValid(stage))
                        return await interaction.reply({ content: 'That stage data doesn\'t exist!', ephemeral: true });

                    await interaction.deferReply();

                    const ccbEmbed = await buildCCBMessage(stage, 0);
                    return await interaction.editReply(ccbEmbed);
                }
            }
            case 'season': {
                const index = interaction.options.getString('index').toLowerCase();
                if (gameConsts.ccbSeasons.hasOwnProperty(index)) {

                    await interaction.deferReply();

                    const ccbSelectEmbed = await buildCCBLegacySelectMessage(index);
                    return await interaction.editReply(ccbSelectEmbed);
                }
                else {
                    const season = await api.single('ccb', { query: `crisis_v2_season_${index}_1` })

                    if (!CCSeason.isValid(season))
                        return await interaction.reply({ content: 'That season doesn\'t exist!', ephemeral: true });

                    await interaction.deferReply();

                    const ccbSelectEmbed = await buildCCBSelectMessage(season);
                    return await interaction.editReply(ccbSelectEmbed);
                }
            }
        }
    }
    async buttonResponse(interaction: ButtonInteraction<CacheType>, idArr: string[]) {
        const name = idArr[1];
        const page = parseInt(idArr[2]);

        const ccbEmbed = gameConsts.ccbStages.find(stage => stage.name.toLowerCase() === name)
            ? await buildCCBLegacyMessage(await api.single('ccb/legacy', { query: name }), page)
            : await buildCCBMessage(await api.single('ccb/stage', { query: name }), page);
        await interaction.update(ccbEmbed);
    }
    async selectResponse(interaction: StringSelectMenuInteraction<CacheType>, idArr: string[]) {
        const name = interaction.values[0];

        const ccbEmbed = gameConsts.ccbStages.find(stage => stage.name.toLowerCase() === name)
            ? await buildCCBLegacyMessage(await api.single('ccb/legacy', { query: name }), 0)
            : await buildCCBMessage(await api.single('ccb/stage', { query: name }), 0);
        await interaction.update(ccbEmbed);
    }
}
