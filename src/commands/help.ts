import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from '../structures/Command';
import { autocompleteHelp } from '../utils/autocomplete';
import { buildHelpListMessage, buildHelpMessage } from '../utils/build';

export default class HelpCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show help info')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Command name')
                .setAutocomplete(true)
        ) as SlashCommandBuilder;
    name = 'Help';
    description = ['Show information on commands. If no command is specified, show a list of all commands.'];
    usage = [
        '`/help`',
        '`/help [command]`'
    ];
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const arr = await autocompleteHelp(value);
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('command')?.toLowerCase();

        await interaction.deferReply();

        const helpEmbed = name ? await buildHelpMessage(name) : await buildHelpListMessage();
        return await interaction.editReply(helpEmbed);
    }
}