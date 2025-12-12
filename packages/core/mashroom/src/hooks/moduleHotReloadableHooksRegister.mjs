import {register} from 'module';

const logMessagePort = globalThis['HOOK_LOG_MESSAGE_PORT'];

register('./moduleHotReloadableHooks.mjs', import.meta.url, {
    data: {
        logMessagePort,
    },
    transferList: [logMessagePort],
});


