import type {ResourceMetrics} from '@opentelemetry/sdk-metrics';

// Make ResourceMetrics serializable so it can be sent via inter-process communication
export default (resourceMetrics: ResourceMetrics): ResourceMetrics => {
    const {resource: { attributes, asyncAttributesPending}, scopeMetrics} = resourceMetrics;
    const serializableResource: Omit<ResourceMetrics['resource'], 'waitForAsyncAttributes' | 'merge'> = {
        attributes,
        asyncAttributesPending,
    };
    return {
        resource: serializableResource as any,
        scopeMetrics
    };
};
