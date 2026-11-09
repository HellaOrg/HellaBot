import { AutocompleteInteraction, ButtonInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../structures/Command';
import * as api from '../utils/api';
import { autocompleteSandboxV3Item, autocompleteSandboxV3Stage, autocompleteSandboxV3Weather } from '../utils/autocomplete';
import { buildSandboxV3ItemMessage, buildSandboxV3StageMessage, buildSandboxV3WeatherMessage } from '../utils/build';
import { SandboxV3Item, SandboxV3Stage, SandboxV3Weather } from '../utils/canon';

const innerIndex = 0;
const outerIndex = innerIndex + 3;
const outerName = 'Relaunch Anchor';

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
                const arr = await autocompleteSandboxV3Stage(innerIndex, { query: value });
                return await interaction.respond(arr);
            }
            case 'item': {
                const arr = await autocompleteSandboxV3Item(innerIndex, { query: value });
                return await interaction.respond(arr);
            }
            case 'weather': {
                const arr = await autocompleteSandboxV3Weather(innerIndex, { query: value });
                return await interaction.respond(arr);
            }
        }
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const type = interaction.options.getSubcommand();
        const name = interaction.options.getString('name').toLowerCase();

        switch (type) {
            case 'stage': {
                const stage = await api.single(`sandboxv3/stage/${innerIndex}`, { query: name });

                if (!SandboxV3Stage.isValid(stage))
                    return await interaction.reply({ content: 'That stage doesn\'t exist!', ephemeral: true });

                await interaction.deferReply();

                const stageEmbed = await buildSandboxV3StageMessage(innerIndex, stage, 0);
                return await interaction.editReply(stageEmbed);
            }
            case 'item': {
                const item = await api.single(`sandboxv3/item/${innerIndex}`, { query: name });

                if (!SandboxV3Item.isValid(item))
                    return await interaction.reply({ content: 'That item doesn\'t exist!', ephemeral: true });

                await interaction.deferReply();

                const itemEmbed = await buildSandboxV3ItemMessage(innerIndex, item);
                return await interaction.editReply(itemEmbed);
            }
            case 'weather': {
                const weather = await api.single(`sandboxv3/weather/${innerIndex}`, { query: name });

                if (!SandboxV3Weather.isValid(weather))
                    return await interaction.reply({ content: 'That weather effect doesn\'t exist!', ephemeral: true });

                await interaction.deferReply();

                const weatherEmbed = await buildSandboxV3WeatherMessage(innerIndex, weather);
                return await interaction.editReply(weatherEmbed);
            }
        }
    }
    async buttonResponse(interaction: ButtonInteraction, idArr: string[]) {
        switch (idArr[1]) {
            case 'stage': {
                const stage = await api.single(`sandboxv3/stage/${innerIndex}`, { query: idArr[2] });
                const page = parseInt(idArr[3]);

                const stageEmbed = await buildSandboxV3StageMessage(innerIndex, stage, page);
                await interaction.update(stageEmbed);

                break;
            }
        }
    }
}