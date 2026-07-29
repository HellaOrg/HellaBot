import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../structures/Command';
import * as api from '../utils/api';
import { autocompleteFaction } from '../utils/autocomplete';
import { buildFactionListMessage, buildFactionMessage } from '../utils/build';
import { Faction } from '../utils/canon';

export default class FactionCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('faction')
        .setDescription('Show the operators in a faction')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Name')
                .setRequired(true)
                .setAutocomplete(true)
        ) as SlashCommandBuilder;
    name = 'Faction';
    description = ['Show the operators in a faction.'];
    usage = [
        '`/faction [faction]`'
    ];
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const arr = await autocompleteFaction({ query: value });
        arr.push({ name: 'List All', value: 'list' });
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const term = interaction.options.getString('name').toLowerCase();

        if (term === 'list') {
            await interaction.deferReply();

            const factionListEmbed = await buildFactionListMessage();
            return await interaction.editReply(factionListEmbed);
        }
        else {
            const faction = await api.single('faction', { query: term });

            if (!Faction.isValid(faction))
                return await interaction.reply({ content: 'That faction doesn\'t exist!', ephemeral: true });

            await interaction.deferReply();

            const factionEmbed = await buildFactionMessage(faction);
            return await interaction.editReply(factionEmbed);
        }
    }
}