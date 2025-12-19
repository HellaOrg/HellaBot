import { ActivityType, ApplicationEmoji, Client, Collection, Events, GatewayIntentBits, REST, Routes } from 'discord.js';
import { readdirSync } from 'fs';
import { Operator } from 'hella-types';
import { join } from 'path';
import * as api from '../utils/api';
import Command from './Command';
const { paths } = require('../constants');

export default class HellaBot {
    static commands = new Collection<string, Command>();
    static emojis = new Collection<string, ApplicationEmoji>();
    static nonregisteredEmojis = {};

    static token: string;
    static clientId: string;
    static disabled: { [key: string]: boolean };
    static client: Client;

    public static async create(token: string, clientId: string, disabled: { [key: string]: boolean }, skipRegister: boolean = false) {
        this.token = token;
        this.clientId = clientId;
        this.disabled = disabled;
        this.client = new Client({ intents: [GatewayIntentBits.Guilds] });
        this.client.on(Events.InteractionCreate, async interaction => {
            if (interaction.isChatInputCommand()) {
                const command = this.commands.get(interaction.commandName);

                if (!command) return console.error(`No command matching ${interaction.commandName} was found.`);

                try {
                    await command.execute(interaction);
                } catch (err) {
                    console.error(err);
                    if (interaction.replied || interaction.deferred) {
                        await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                    }
                    else {
                        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                    }
                }
            }
            else if (interaction.isAutocomplete()) {
                try {
                    const command = this.commands.get(interaction.commandName);
                    await command.autocomplete(interaction);
                } catch (err) {
                    console.error(err);
                }
            }
            else if (interaction.isButton()) {
                try {
                    const idArr: string[] = interaction.customId.split('ඞ');
                    const command = this.commands.get(idArr[0]);
                    await command.buttonResponse(interaction, idArr);
                } catch (err) {
                    console.error(err);
                }
            }
            else if (interaction.isStringSelectMenu()) {
                try {
                    const idArr: string[] = interaction.customId.split('ඞ');
                    const command = this.commands.get(idArr[0]);
                    await command.selectResponse(interaction, idArr);
                } catch (err) {
                    console.error(err);
                }
            }
        });
        this.client.once(Events.ClientReady, async client => {
            client.user.setActivity('CC#13', { type: ActivityType.Competing });
            await Promise.all([
                this.registerCommands(skipRegister),
                this.registerEmojis(skipRegister)
            ]);
            console.log(`Ready! Logged in as ${this.client.user.tag}`);
        });
        await this.client.login(token);
    }

    private static async registerCommands(skipRegister: boolean) {
        const commandArr = [];
        const commandFiles = readdirSync(join(__dirname, '..', 'commands')).filter(file => file.endsWith('.ts'));
        for (const file of commandFiles) {
            const command = new (await import(join(__dirname, '..', 'commands', file))).default();

            if (this.disabled && this.disabled[command.data.name.toLowerCase()]) continue;

            this.commands.set(command.data.name, command);
            commandArr.push(command.data.toJSON());
        }
        if (!skipRegister) {
            try {
                const rest = new REST().setToken(this.token);
                await rest.put(Routes.applicationCommands(this.clientId), { body: commandArr },);
            } catch (err) {
                console.error(err);
            }
            console.log('Registered application commands');
        }
        else {
            console.log('Skipped command registration');
        }
    }

    public static getOperatorEmoji(op: Operator) {
        const emoji = this.emojis.get(op.id);
        if (!emoji)
            this.registerNewOperatorEmoji(op); // not awaited for faster response
        return emoji;
    }

    public static async registerNewOperatorEmoji(op: Operator) {
        if (this.nonregisteredEmojis[op.id]) return;
        this.nonregisteredEmojis[op.id] = true;
        try {
            await this.client.application.emojis.create({ attachment: `${paths.myAssetUrl}/operator/avatars/${op.id}.png`, name: op.id });
            this.client.application.emojis.fetch().then(emojis => emojis.values().forEach(emoji => this.emojis.set(emoji.name, emoji)));
        } catch (err) {
            console.error(err);
        }
        this.nonregisteredEmojis[op.id] = false;
    }

    private static async registerEmojis(skipRegister: boolean) {
        const emojis = await this.client.application.emojis.fetch();
        const emojiDict = Object.fromEntries(emojis.map(emoji => [emoji.name, true]));

        if (!skipRegister) {
            const operators = await api.all('operator', { include: ['id', 'data.name'] });
            for (const op of operators) {
                if (op.id === 'char_1037_amiya3') op.id = 'char_1037_amiya3_2';
                if (!emojiDict[op.id]) {
                    try {
                        await this.client.application.emojis.create({ attachment: `${paths.myAssetUrl}/operator/avatars/${op.id}.png`, name: op.id });
                    } catch (err) {
                        console.error(err);
                    }
                }
            }
            const items = (await api.searchV2('item', { filter: { 'data.itemType': { 'in': ['MATERIAL', 'CARD_EXP'] } }, include: ['data'] }))
                .filter(item => !item.data.name.includes('Token') && !item.data.itemId.includes('token') && !item.data.iconId.includes('token'))
                .sort((a, b) => a.data.sortId - b.data.sortId);
            for (const item of items) {
                if (!item.data.iconId) continue;
                if (!emojiDict[item.data.iconId]) {
                    try {
                        await this.client.application.emojis.create({ attachment: `${paths.myAssetUrl}/items/${item.data.iconId}.png`, name: item.data.iconId });
                    } catch (err) {
                        console.error(err);
                    }
                }
            }
            const lmd = await api.single('item', { query: '4001' });
            if (!emojiDict[lmd.data.iconId]) {
                try {
                    await this.client.application.emojis.create({ attachment: `${paths.myAssetUrl}/items/${lmd.data.iconId}.png`, name: lmd.data.iconId });
                } catch (err) {
                    console.error(err);
                }
            }
            console.log('Registered application emojis');
        }
        else {
            console.log('Skipped emoji registration');
        }
        this.client.application.emojis.fetch().then(emojis => emojis.values().forEach(emoji => this.emojis.set(emoji.name, emoji)));
    }
}