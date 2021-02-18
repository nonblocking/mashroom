
import type {Store as ReduxStore, Dispatch as ReduxDispatch, AnyAction} from 'redux';

export type State = {
    readonly subscription: Subscription;
    readonly publishedMessages: PublishedMessages;
    readonly receivedMessages: ReceivedMessages;
}

export type Action = AnyAction;

export type Dispatch = ReduxDispatch<Action>;

export type Store = ReduxStore<State, Action>;

export type Subscription = {
    readonly topic: string;
    readonly status: 'Pending' | 'Success' | 'Error';
    readonly errorMessage?: string;
}

export type PublishedMessageStatus = 'Pending' | 'Success' | 'Error';

export type PublishedMessage = {
    readonly id: string;
    readonly topic: string;
    readonly message: any;
    readonly timestamp: number;
    status: PublishedMessageStatus;
    errorMessage?: string;
}

export type PublishedMessages = Array<PublishedMessage>;

export type ReceivedMessage = {
    readonly topic: string;
    readonly message: any;
    readonly timestamp: number;
}

export type ReceivedMessages = Array<ReceivedMessage>;
