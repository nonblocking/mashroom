
export let currentMessages: any = {};

export default async (lang: string) => {
    let promise;
    if (lang === 'de') {
        promise = import('./messages-de');
    } else {
        promise = import('./messages-en');
    }

    try {
        const messagesModule = await promise;
        const messages = messagesModule.default;
        currentMessages = messages;
        return messages;
    } catch (error) {
        console.error('Error loading i8n messages', error);
        return {
            error: true
        };
    };
};
