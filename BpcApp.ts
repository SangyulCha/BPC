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

    public async createMessage(app: IApp, read: IRead, modify: IModify, message, room: IRoom, threadId: string | undefined, bot: string) {
        if (!message) {
            return;
        }
        const sender = await read.getUserReader().getByUsername(bot);
        const msg = modify.getCreator().startMessage().setRoom(room).setSender(sender);
        const replyInThread = await getAppSettingValue(read, AppSetting.BotpressReplyInThread);
        if (threadId && replyInThread) {
            msg.setThreadId(threadId);
        }

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

        // let bot: Array<IBot>
        // settings.forEach(async (setting) => {
        //     const settingValue = await getAppSettingValue(read, setting.id);

        // })

        const botUrl: string = await getAppSettingValue(read, AppSetting.BotpressServerUrl);
        const botId: string = await getAppSettingValue(read, AppSetting.BotpressBotId);
        const botUsername: string = await getAppSettingValue(read, AppSetting.BotpressBotUsername);
        this.getLogger().debug(`this is the bot name: ${botUsername}`);
        this.getLogger().debug(`this is the sender.username ${sender.username}`);
        if (sender.username === botUsername) {
            return;
        }

        const replyInThread: boolean = await getAppSettingValue(read, AppSetting.BotpressReplyInThread);
        this.getLogger().debug(`is RIT on? : ${replyInThread}`);

        const notifiedId: string = "@" + botUsername;
        this.getLogger().debug(`this is notifiedId: ${notifiedId}`);
        const isNotified = message.text?.includes(notifiedId);
        this.getLogger().debug(`is Notified? : ${isNotified}`);
        //If "Reply In Thread" option is selected, then the bot should only respond when it is mentioned
        if (replyInThread) {
            if (!isNotified && !message.threadId) {
                return;
            }
        }

        let replyId = id;

        if (!replyInThread) {
            replyId = message.sender.id;
        }

        if (threadId) {
            replyId = threadId;
        }

        const httpRequestContent: IHttpRequest = createHttpRequest(
            { 'Content-Type': 'application/json' },
            { text },
        );

        const botWebhookUrl = `${botUrl}/api/v1/bots/${botId}/converse/${replyId}`;
        const { data } = await http.post(botWebhookUrl, httpRequestContent);
        if (!data.responses) {
            return;
        }

        data.responses.filter(response => response !== '{}').forEach(async (response) => {
            if (response.type == 'text') {
                await this.createMessage(this, read, modify, { text: response.text }, room, id, botUsername);
            }
            if (response.type == 'image') {
                const imageAttachment = {
                    imageUrl: response.image
                } as IMessageAttachment;
                await this.createMessage(this, read, modify, { attachment: imageAttachment }, room, id, botUsername);
            }
        });

    }

    protected async extendConfiguration(configuration: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        await Promise.all(settings.map((setting) => configuration.settings.provideSetting(setting)));
    }
}
