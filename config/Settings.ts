import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export enum AppSetting {
    BotpressBotUsername = 'botpress_bot_username',
    BotpressServerUrl = 'botpress_server_url',
    BotpressEnableCallbacks = 'botpress_enable_callbacks',
    BotpressDefaultHandoverDepartment = 'botpress_target_handover_department',
    BotpressBotId = 'botpress_bot_id'
}

export const settings: Array<ISetting> = [
    {
        id: AppSetting.BotpressBotUsername,
        public: true,
        type: SettingType.STRING,
        packageValue: '',
        hidden: false,
        i18nLabel: 'botpress_bot_username',
        required: true,
    },
    {
        id: AppSetting.BotpressBotId,
        public: true,
        type: SettingType.STRING,
        packageValue: '',
        i18nLabel: 'botpress_bot_id',
        required: false,
    },
    {
        id: AppSetting.BotpressServerUrl,
        public: true,
        type: SettingType.STRING,
        packageValue: '',
        i18nLabel: 'botpress_server_url',
        required: false,
    },
];
