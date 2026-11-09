import { AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../structures/Command';
import * as api from '../utils/api';
import { autocompleteSandboxItem, autocompleteSandboxStage, autocompleteSandboxWeather } from '../utils/autocomplete';
import { buildSandboxItemMessage, buildSandboxStageMessage, buildSandboxWeatherMessage } from '../utils/build';
import { SandboxItem, SandboxStage, SandboxWeather } from '../utils/canon';

const innerIndex = 0;
const outerIndex = innerIndex + 2;
const outerName = 'Tales Within the Sand';

export default class RA2Command implements Command {
    data = new SlashCommandBuilder()
        .setName(`ra${outerIndex}`)
        .setDescription(`Show information on RA${outerIndex}: ${outerName}`)
        .addSubcommand(subcommand =>
            subcommand.setName('stage')
                .setDescription(`Show information on an RA${outerIndex} stage`)
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Stage name')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('item')
                .setDescription(`Show information on an RA${outerIndex} item`)
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Item name')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand.setName('weather')
                .setDescription(`Show information on an RA${outerIndex} weather effect`)
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Weather name')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        ) as SlashCommandBuilder;
    name = `RA${outerIndex}`;
    description = [
        `Show information on RA${outerIndex}: ${outerName}.`,
        '`stage`: show the enemy list, image preview, and stage diagram for a stage.',
        '`item`: show the description of an item.',
        '`weather`: show the description of a weather effect.',
    ];
    usage = [
        `\`/ra${outerIndex} stage [stage]\``,
        `\`/ra${outerIndex} item [item]\``,
        `\`/ra${outerIndex} weather [weather]\``,
    ];
    async autocomplete(interaction: AutocompleteInteraction) {
        const type = interaction.options.getSubcommand();
        const value = interaction.options.getFocused().toLowerCase();
        switch (type) {
            case 'stage': {
                const arr = await autocompleteSandboxStage(innerIndex, { query: value });
                return await interaction.respond(arr);
            }
            case 'item': {
                const arr = await autocompleteSandboxItem(innerIndex, { query: value });
                return await interaction.respond(arr);
            }
            case 'weather': {
                const arr = await autocompleteSandboxWeather(innerIndex, { query: value });
                return await interaction.respond(arr);
            }
        }
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const type = interaction.options.getSubcommand();
        const name = interaction.options.getString('name').toLowerCase();

        switch (type) {
            case 'stage': {
                const stage = await api.single(`sandbox/stage/${innerIndex}`, { query: name });

                if (!SandboxStage.isValid(stage))
                    return await interaction.reply({ content: 'That stage doesn\'t exist!', ephemeral: true });

                await interaction.deferReply();

                const stageEmbed = await buildSandboxStageMessage(innerIndex, stage, 0);
                return await interaction.editReply(stageEmbed);
            }
            case 'item': {
                const item = await api.single(`sandbox/item/${innerIndex}`, { query: name });

                if (!SandboxItem.isValid(item))
                    return await interaction.reply({ content: 'That item doesn\'t exist!', ephemeral: true });

                await interaction.deferReply();

                const itemEmbed = await buildSandboxItemMessage(innerIndex, item);
                return await interaction.editReply(itemEmbed);
            }
            case 'weather': {
                const weather = await api.single(`sandbox/weather/${innerIndex}`, { query: name });

                if (!SandboxWeather.isValid(weather))
                    return await interaction.reply({ content: 'That weather effect doesn\'t exist!', ephemeral: true });

                await interaction.deferReply();

                const weatherEmbed = await buildSandboxWeatherMessage(weather);
                return await interaction.editReply(weatherEmbed);
            }
        }
    }
    async buttonResponse(interaction: ButtonInteraction, idArr: string[]) {
        switch (idArr[1]) {
            case 'stage': {
                const stage = await api.single(`sandbox/stage/${innerIndex}`, { query: idArr[2] });
                const page = parseInt(idArr[3]);

                const stageEmbed = await buildSandboxStageMessage(innerIndex, stage, page);
                await interaction.update(stageEmbed);

                break;
            }
        }
    }
}