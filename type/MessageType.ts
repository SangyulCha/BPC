import { IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import { IBlock } from '@rocket.chat/apps-engine/definition/uikit';

export interface IMessageType {
    text?: string;
    blocks?: Array<IBlock>;
    attachment?: IMessageAttachment;
}
