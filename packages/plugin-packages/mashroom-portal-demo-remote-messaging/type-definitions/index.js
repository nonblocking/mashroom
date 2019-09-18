// @flow

import type {Store as ReduxStore, Dispatch as ReduxDispatch} from 'redux';

export type State = {|
    +subscription: Subscription,
    +publishedMessages: PublishedMessages,
    +receivedMessages: ReceivedMessages,
|}

export type Action = { type: string } & { [string]: any };

export type Dispatch = ReduxDispatch<Action>;

export type Store = ReduxStore<$Subtype<State>, Action>;

export type Subscription = {
    +topic: string,
    +status: 'Pending' | 'Success' | 'Error',
    +errorMessage?: string,
}

export type PublishedMessageStatus = 'Pending' | 'Success' | 'Error';

export type PublishedMessage = {
    +id: string,
    +topic: string,
    +message: any,
    +timestamp: number,
    status: PublishedMessageStatus,
    errorMessage?: string,
}

export type PublishedMessages = Array<PublishedMessage>;

export type ReceivedMessage = {
    +topic: string,
    +message: any,
    +timestamp: number,
}

export type ReceivedMessages = Array<ReceivedMessage>;
