
export const topicToRoutingKey = (topic: string): string => topic.replace(/\//g, '.');

export const routingKeyToTopic = (routingKey: string): string => routingKey.replace(/\./g, '/');

