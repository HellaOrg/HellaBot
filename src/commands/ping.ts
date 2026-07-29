import { ButtonInteraction, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { paths } from '../constants.json';
import Command from '../structures/Command';
import { buildPingMessage } from '../utils/build';
const { apiUrl } = require('../../config.json');

export default class PingCommand implements Command {
    data = new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Get bot network latency') as SlashCommandBuilder;
    name = 'Ping';
    description = ['Get bot network latency.'];
    usage = [
        '`/ping`'
    ];
    async ping(interaction: ChatInputCommandInteraction | ButtonInteraction) {
        const pingEmbed = await buildPingMessage();
        await interaction.editReply(pingEmbed);

        const embed = EmbedBuilder.from(pingEmbed.embeds[0]);
        const start = Date.now();
        // race condition :^)
        fetch('https://discord.com/api/gateway').then(res => {
            const apiField = embed.data.fields.find(field => field.name === 'HellaAPI');
            const githubField = embed.data.fields.find(field => field.name === 'GitHub');
            embed.setFields([
                { name: 'Discord', value: res.ok ? `${Date.now() - start}ms` : 'Unreachable', inline: true },
                githubField,
                apiField
            ]);
            interaction.editReply({ embeds: [embed] });
        });
        fetch('https://api.github.com/').then(res => {
            const discordField = embed.data.fields.find(field => field.name === 'Discord');
            const apiField = embed.data.fields.find(field => field.name === 'HellaAPI');
            embed.setFields([
                discordField,
                { name: 'GitHub', value: res.ok ? `${Date.now() - start}ms` : 'Unreachable', inline: true },
                apiField
            ]);
            interaction.editReply({ embeds: [embed] });
        });
        fetch(`${apiUrl ?? paths.apiUrl}/about`).then(async res => {
            const discordField = embed.data.fields.find(field => field.name === 'Discord');
            const githubField = embed.data.fields.find(field => field.name === 'GitHub');
            embed.setFields([
                discordField,
                githubField,
                { name: 'HellaAPI', value: res.ok ? `${Date.now() - start}ms` : 'Unreachable', inline: true }
            ]);
            interaction.editReply({ embeds: [embed] });
        });
    }
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();
        return await this.ping(interaction);
    }
    async buttonResponse(interaction: ButtonInteraction, idArr: string[]) {
        if (idArr[1] === 'refresh') {
            await interaction.deferUpdate();
            return await this.ping(interaction);
        }
    }
}
