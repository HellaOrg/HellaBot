import { AutocompleteInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder, StringSelectMenuInteraction } from 'discord.js';
import * as api from '../utils/api';
import { autocompleteOperator } from '../utils/autocomplete';
import { buildInfoMessage } from '../utils/build';
import { Operator } from '../utils/canon';

export default class InfoCommand {
    data = new SlashCommandBuilder()
        .setName('info')
        .setDescription('Show an operator\'s information and attributes')
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Operator name')
                .setRequired(true)
                .setAutocomplete(true))
        .addStringOption(option =>
            option.setName('page')
                .setDescription('Info page')
                .addChoices(
                    { name: 'Stats', value: '0' },
                    { name: 'Skills', value: '1' },
                    { name: 'Deployables', value: '7' },
                    { name: 'Modules', value: '2' },
                    { name: 'Base Skills', value: '3' },
                    { name: 'Upgrade Costs', value: '4' },
                    { name: 'Outfits', value: '5' },
                    { name: 'Paradox Simulation', value: '6' },
                )
        ) as SlashCommandBuilder;
    name = 'Info';
    description = ['Show information on an operator, including stats, talents, skills, modules, and more.'];
    usage = [
        '`/info [operator]`'
    ];
    async autocomplete(interaction: AutocompleteInteraction) {
        const value = interaction.options.getFocused().toLowerCase();
        const arr = await autocompleteOperator({ query: value });
        return await interaction.respond(arr);
    }
    async execute(interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString('name').toLowerCase();
        const page = parseInt(interaction.options.getString('page') ?? '0');
        const op = await api.single('operator', { query: name });

        if (!Operator.isValid(op))
            return await interaction.reply({ content: 'That operator doesn\'t exist!', ephemeral: true });

        await interaction.deferReply();

        const operatorEmbed = await buildInfoMessage(op, page);
        return await interaction.editReply(operatorEmbed);
    }
    async selectResponse(interaction: StringSelectMenuInteraction<CacheType>, idArr: string[]) {
        const op = await api.single('operator', { query: idArr[1] });
        const value = interaction.values[0];
        const type = parseInt(idArr[2] === 'select' ? value : idArr[2]);
        const level = parseInt(idArr[3] === 'select' ? value : idArr[3]);
        const extras = idArr.slice(4).map(value => parseInt(value === 'select' ? interaction.values[0] : value));

        const infoEmbed = await buildInfoMessage(op, type, level, extras);
        await interaction.update(infoEmbed);
    }
}