import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export enum AppSetting {
    BotpressBotUsername = 'botpress_bot_username',
    BotpressServerUrl = 'botpress_server_url',
    BotpressEnableCallbacks = 'botpress_enable_callbacks',
    BotpressDefaultHandoverDepartment = 'botpress_target_handover_department',
    BotpressBotId = 'botpress_bot_id',
    BotpressReplyInThread = 'botpress_reply_in_thread',
    BotpressBotSettings = 'botpress_bot_settings'
}

export const settings: Array<ISetting> = createSettings(
    AppSetting.BotpressBotUsername,
    AppSetting.BotpressBotId,
    AppSetting.BotpressServerUrl,
    AppSetting.BotpressReplyInThread
);


function createSettings(...ids: Array<AppSetting>): Array<ISetting> {
    const settings: Array<ISetting> = [];

    for (let i = 0; i < 3; i++) {
        ids.forEach((id) => {
            settings.push(settingsTemplate(
                id + `${i}`,
                id,
                id == AppSetting.BotpressReplyInThread ? false : '',
                id == AppSetting.BotpressReplyInThread ? SettingType.BOOLEAN : SettingType.STRING,
                id == AppSetting.BotpressReplyInThread ? true : false
            ))
        })
    }

    return settings;
}

function settingsTemplate(id: string, i18nLabel: string, packageValue: string | boolean, type: SettingType, hidden: boolean): ISetting {
    return {
        id: id,
        public: true,
        type: type,
        packageValue: packageValue,
        section: AppSetting.BotpressBotSettings,
        hidden: hidden,
        required: true,
        i18nLabel: i18nLabel
    }
}


// export const settings: Array<ISetting> = [
//     {
//         id: AppSetting.BotpressBotUsername + '1',
//         public: true,
//         type: SettingType.STRING,
//         packageValue: '',
//         section: AppSetting.BotpressBotSettings,
//         hidden: false,
//         i18nLabel: 'botpress_bot_username',
//         required: true,
//     },
//     {
//         id: AppSetting.BotpressBotId + '1',
//         public: true,
//         type: SettingType.STRING,
//         packageValue: '',
//         section: AppSetting.BotpressBotSettings,
//         i18nLabel: 'botpress_bot_id',
//         required: false,
//     },
//     {
//         id: AppSetting.BotpressServerUrl + '1',
//         public: true,
//         type: SettingType.STRING,
//         packageValue: '',
//         section: AppSetting.BotpressBotSettings,
//         i18nLabel: 'botpress_server_url',
//         required: false,
//     },
//     {
//         id: AppSetting.BotpressReplyInThread + '1',
//         public: true,
//         type: SettingType.BOOLEAN,
//         packageValue: false,
//         section: AppSetting.BotpressBotSettings,
//         i18nLabel: 'botpress_reply_in_thread',
//         required: true
//     },
//     {
//         id: AppSetting.BotpressBotUsername + '2',
//         public: true,
//         type: SettingType.STRING,
//         packageValue: '',
//         section: AppSetting.BotpressBotSettings,
//         hidden: false,
//         i18nLabel: 'botpress_bot_username',
//         required: true,
//     },
//     {
//         id: AppSetting.BotpressBotId + '2',
//         public: true,
//         type: SettingType.STRING,
//         packageValue: '',
//         section: AppSetting.BotpressBotSettings,
//         i18nLabel: 'botpress_bot_id',
//         required: false,
//     },
//     {
//         id: AppSetting.BotpressServerUrl + '2',
//         public: true,
//         type: SettingType.STRING,
//         packageValue: '',
//         section: AppSetting.BotpressBotSettings,
//         i18nLabel: 'botpress_server_url',
//         required: false,
//     },
//     {
//         id: AppSetting.BotpressReplyInThread + '2',
//         public: true,
//         type: SettingType.BOOLEAN,
//         packageValue: false,
//         section: AppSetting.BotpressBotSettings,
//         i18nLabel: 'botpress_reply_in_thread',
//         required: true
//     }, {
//         id: AppSetting.BotpressBotUsername + '1',
//         public: true,
//         type: SettingType.STRING,
//         packageValue: '',
//         section: AppSetting.BotpressBotSettings,
//         hidden: false,
//         i18nLabel: 'botpress_bot_username',
//         required: true,
//     },
//     {
//         id: AppSetting.BotpressBotId + '1',
//         public: true,
//         type: SettingType.STRING,
//         packageValue: '',
//         section: AppSetting.BotpressBotSettings,
//         i18nLabel: 'botpress_bot_id',
//         required: false,
//     },
//     {
//         id: AppSetting.BotpressServerUrl + '1',
//         public: true,
//         type: SettingType.STRING,
//         packageValue: '',
//         section: AppSetting.BotpressBotSettings,
//         i18nLabel: 'botpress_server_url',
//         required: false,
//     },
//     {
//         id: AppSetting.BotpressReplyInThread + '1',
//         public: true,
//         type: SettingType.BOOLEAN,
//         packageValue: false,
//         section: AppSetting.BotpressBotSettings,
//         i18nLabel: 'botpress_reply_in_thread',
//         required: true
//     },

// ];
