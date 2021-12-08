
export let currentMessages: any = {};

export default (lang: string): Promise<any> => {
    let promise;
    if (lang === 'de') {
        promise = import('./messages_de');
    } else {
        promise = import('./messages_en');
    }

    return promise.then(
        (messagesModule) => {
            const messages = messagesModule.default;
            currentMessages = messages;
            return messages;
        },
        (error) => {
            console.error('Error loading i8n messages', error);
            return {
                'error': true
            }
        }
    );
}
