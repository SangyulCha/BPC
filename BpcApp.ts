import {
    IAppAccessors,
    IConfigurationExtend,
    IEnvironmentRead,
    IHttp,
    IHttpRequest,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { IMessage, IMessageAttachment, IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';
import { AppSetting, settings } from './config/Settings';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp'; import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';
import { getAppSettingValue } from './lib/Setting';
import { createHttpRequest } from './lib/Http';
import { IBot } from './type/Bot';

export class BpcApp extends App implements IPostMessageSent {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    private async isMultiUser(room: IRoom, read: IRead) {
        const users = await read.getRoomReader().getMembers(room.id);
        if (users.length < 3) {
            return false;
        }
        return true;
    }

    private isIBotFilled(bot: IBot) {
        if (bot.id !== '' && bot.username !== '' && bot.url !== '') {
            return true;
        }
        return false;
    }

    private isNotified(message: IMessage, username: string) {
        const notifiedName = "@" + username;
        return message.text?.includes(notifiedName);
    }

    public async createMessage(app: IApp, read: IRead, modify: IModify, message, room: IRoom, threadId: string | undefined, bot: string) {
        if (!message) {
            return;
        }
        const sender = await read.getUserReader().getByUsername(bot);
        const msg = modify.getCreator().startMessage().setRoom(room).setSender(sender);

        const { text, attachment, blocks } = message;

        if (text) {
            msg.setText(text);
        }

        if (attachment) {
            app.getLogger().debug(`this is final Url of image = ${JSON.stringify(attachment.imageUrl)}`)
            msg.addAttachment(attachment);
            app.getLogger().debug(`this is msg = ${JSON.stringify(msg)}`)
        }

        if (blocks) {
            msg.addBlocks(blocks);
        }

        return new Promise(resolve => {
            modify.getCreator().finish(msg)
                .then((result) => resolve(result))
                .catch((error) => console.error(error));
        });
    }

    public async executePostMessageSent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void> {
        const { text, room, sender, id, threadId } = message;
        this.getLogger().debug(`this is the roomid: ${room.id}`);
        this.getLogger().debug(`this is the messageId(=threadId): ${id}`);
        this.getLogger().debug(`this is the room type: ${JSON.stringify(room.type)}`);

        if (!text) {
            return;
        }

        let bots = new Map();
        let bot: IBot = {
            id: '',
            username: '',
            url: '',
            replyInThread: false
        };
        settings.forEach(async (setting) => {
            const settingValue = await getAppSettingValue(read, setting.id);

            if (setting.id.includes(AppSetting.BotpressReplyInThread)) {
                bot.replyInThread = settingValue;
            }

            if (this.isIBotFilled(bot)) {
                const botInstance: IBot = JSON.parse(JSON.stringify(bot));
                bots.set(bot.username, botInstance);
                this.getLogger().debug(`this is the hashmap about setted bots: ${[...bots.entries()]}`)
                this.getLogger().debug(`saved bot data : ${JSON.stringify(bots.get(bot.username))}`);
                this.getLogger().debug(`multibot1 : ${JSON.stringify(bots.get('multibot1'))}`);
                this.getLogger().debug(`multibot2 : ${JSON.stringify(bots.get('multibot2'))}`);
                this.getLogger().debug(`multibot3 : ${JSON.stringify(bots.get('multibot3'))}`);
                bot.id = '';
                bot.url = '';
                bot.username = '';
                bot.replyInThread = false;
            }

            if (setting.id.includes(AppSetting.BotpressBotUsername)) {
                bot.username = settingValue;
            }

            if (setting.id.includes(AppSetting.BotpressServerUrl)) {
                bot.url = settingValue;
            }

            if (setting.id.includes(AppSetting.BotpressBotId)) {
                bot.id = settingValue;
            }
        })

        this.getLogger().debug(`sender = bot? : ${bots.has(sender.username)}`);



        let isGroupChat = await this.isMultiUser(room, read);
        this.getLogger().debug(`is group chat? = ${isGroupChat}`);
        let contactedBot: string | undefined = '';
        if (isGroupChat) {
            for (const [username] of bots) {
                if (!this.isNotified(message, username)) {
                    continue;
                }
                contactedBot = username;
            }
        } else {
            const roomMember = await read.getRoomReader().getMembers(room.id);
            const bot = roomMember.find(user => user.username !== sender.username);
            contactedBot = bot?.username;
        }

        this.getLogger().debug(`this is contactedBot : ${contactedBot}`);

        if (bots.has(sender.username)) {
            return;
        }

        if (contactedBot === '') {
            return;
        }

        const beingConnectedBot = bots.get(contactedBot);

        this.getLogger().debug(`beingConnectedBot object = ${JSON.stringify(beingConnectedBot)}`);
        const httpRequestContent: IHttpRequest = createHttpRequest(
            { 'Content-Type': 'application/json' },
            { text },
        );

        const botWebhookUrl = `${beingConnectedBot.url}/api/v1/bots/${beingConnectedBot.id}/converse/${beingConnectedBot.username}`;
        const { data } = await http.post(botWebhookUrl, httpRequestContent);
        if (!data.responses) {
            return;
        }

        this.getLogger().debug(`data = ${JSON.stringify(data.responses)}`);

        data.responses.filter(response => response !== '{}').forEach(async (response) => {
            if (response.type == 'text') {
                await this.createMessage(this, read, modify, { text: response.text }, room, id, beingConnectedBot.username);
            }
            if (response.type == 'image') {
                const imageAttachment = {
                    imageUrl: response.image
                } as IMessageAttachment;
                await this.createMessage(this, read, modify, { attachment: imageAttachment }, room, id, beingConnectedBot.username);
            }
        });

    }

    protected async extendConfiguration(configuration: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        await Promise.all(settings.map((setting) => configuration.settings.provideSetting(setting)));
    }
}
