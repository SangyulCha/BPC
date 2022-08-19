import {
    IAppAccessors,
    IConfigurationExtend,
    IEnvironmentRead,
    IHttp,
    ILogger,
    IModify,
    IPersistence,
    IRead,
} from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { IMessage, IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';
import { AppSetting, settings } from './config/Settings';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';

export class BpcApp extends App implements IPostMessageSent {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async createMessage(app: IApp, read: IRead, modify: IModify, message, room: IRoom, bot: string) {
        if (!message) {
            return;
        }
        const sender = await read.getUserReader().getByUsername(bot);
        const msg = modify.getCreator().startMessage().setRoom(room).setSender(sender);
        msg.setText("I'm a bot")
        msg.addAttachment({ imageUrl: "https://picsum.photos/200/300" })
        return new Promise(async (resolve) => {
            modify.getCreator().finish(msg)
                .then((result) => resolve(result))
                .catch((error) => console.error(error));
        });
    }

    public async executePostMessageSent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void> {
        const { text, room, sender } = message;
        this.getLogger().info(`this is the room type: ${JSON.stringify(room.type)}`);
        if (!text) {
            return;
        }


        const botUsername = await read.getEnvironmentReader().getSettings().getValueById(AppSetting.BotpressBotUsername);
        this.getLogger().info(`this is the bot name: ${botUsername}`)
        this.getLogger().info(`this is the sender.username ${sender.username}`)
        if (sender.username === botUsername) {
            return;
        }
        await this.createMessage(this, read, modify, message, room, botUsername);
    }

    protected async extendConfiguration(configuration: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        await Promise.all(settings.map((setting) => configuration.settings.provideSetting(setting)));
    }
}
