import { AutocompleteInteraction, ButtonInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../structures/Command';
import * as api from '../utils/api';
import { autocompleteRogueRelic, autocompleteRogueStage, autocompleteRogueToughStage } from '../utils/autocomplete';
import { buildRogueRelicListMessage, buildRogueRelicMessage, buildRogueStageMessage } from '../utils/build';
import { RogueRelic, RogueStage } from '../utils/canon';

const innerIndex = 4;
const outerIndex = innerIndex + 2;
const outerName = 'Sui\'s Garden of Grotesqueries';

export default class IS5Command implements Command {
    data = new SlashCommandBuilder()
        .setName(`is${outerIndex}`)
        .setDescription(`Show information on IS${outerIndex}: ${outerName}`)
        .addSubcommandGroup(subcommandGroup =>
            subcommandGroup.setName('stage')
                .setDescription(`Show information on an IS${outerIndex} stage`)
                .addSubcommand(subcommand =>
                    subcommand.setName('normal')
                        .setDescription(`Show information on an IS${outerIndex} stage`)
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('Stage name')
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                )
                .addSubcommand(subcommand =>
                    subcommand.setName('emergency')
                        .setDescription(`Show information on an IS${outerIndex} emergency stage`)
                        .addStringOption(option =>
                            option.setName('name')
                                .setDescription('Stage name')
                                .setRequired(true)
                                .setAutocomplete(true)
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('relic')
                .setDescription(`Show information on an IS${outerIndex} relic`)
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Relic name')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ) as SlashCommandBuilder;
    name = `IS${outerIndex}`;
    description = [
        `Show information on IS${outerIndex}: ${outerName}.`,
        '`stage normal`: show the enemy list, image preview, and stage diagram for a stage.',
        '`stage emergency`: show the enemy list, image preview, and stage diagram for the emergency version of a stage.',
        '`relic`: show the cost and description of a relic.'
    ];
    usage = [
        `\`/is${outerIndex} stage normal [stage]\``,
        `\`/is${outerIndex} stage emergency [stage]\``,
        `\`/is${outerIndex} relic [relic]\``
    ];
    async autocomplete(interaction: AutocompleteInteraction) {
        const type = interaction.options.getSubcommand();
        const value = interaction.options.getFocused().toLowerCase();
        switch (type) {
            case 'normal': {
                const arr = await autocompleteRogueStage(innerIndex, { query: value });
                return await interaction.respond(arr);
            }
            case 'emergency': {
                const arr = await autocompleteRogueToughStage(innerIndex, { query: value });
                return await interaction.respond(arr);
            }
            case 'relic': {
                const arr = await autocompleteRogueRelic(innerIndex, { query: value });
                arr.push({ name: 'List All', value: 'list' });
                return await interaction.respond(arr);
            }
        }
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const type = interaction.options.getSubcommand();
        const name = interaction.options.getString('name').toLowerCase();

        switch (type) {
            case 'normal': {
                const stage = await api.single(`rogue/stage/${innerIndex}`, { query: name });

                if (!RogueStage.isValid(stage))
                    return await interaction.reply({ content: 'That stage doesn\'t exist!', ephemeral: true });

                await interaction.deferReply();

                const stageEmbed = await buildRogueStageMessage(innerIndex, stage, 0);
                return await interaction.editReply(stageEmbed);
            }
            case 'emergency': {
                const stage = await api.single(`rogue/toughstage/${innerIndex}`, { query: name });

                if (!RogueStage.isValid(stage))
                    return await interaction.reply({ content: 'That stage doesn\'t exist!', ephemeral: true });

                await interaction.deferReply();

                const stageEmbed = await buildRogueStageMessage(innerIndex, stage, 0);
                return await interaction.editReply(stageEmbed);
            }
            case 'relic': {
                if (name === 'list') {
                    await interaction.deferReply();

                    const relicListEmbed = await buildRogueRelicListMessage(innerIndex, 0);
                    return await interaction.editReply(relicListEmbed);
                }

                const relic = await api.single(`rogue/relic/${innerIndex}`, { query: name });

                if (!RogueRelic.isValid(relic))
                    return await interaction.reply({ content: 'That relic doesn\'t exist!', ephemeral: true });

                await interaction.deferReply();

                const relicEmbed = await buildRogueRelicMessage(relic);
                return await interaction.editReply(relicEmbed);
            }
        }
    }
    async buttonResponse(interaction: ButtonInteraction<CacheType>, idArr: string[]) {
        switch (idArr[1]) {
            case 'relic': {
                const index = parseInt(idArr[2]);

                const relicListEmbed = await buildRogueRelicListMessage(innerIndex, index);
                await interaction.update(relicListEmbed);

                break;
            }
            case 'stage': {
                const stage = idArr[2] === 'true'
                    ? await api.single(`rogue/toughstage/${innerIndex}`, { query: idArr[3] })
                    : await api.single(`rogue/stage/${innerIndex}`, { query: idArr[3] });
                const page = parseInt(idArr[4]);

                const stageEmbed = await buildRogueStageMessage(innerIndex, stage, page);
                await interaction.update(stageEmbed);

                break;
            }
        }
    }
}