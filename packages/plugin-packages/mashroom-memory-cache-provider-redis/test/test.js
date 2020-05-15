
const {setConfig, close} = require('../dist/redis_client');
const MashroomMemoryCacheProviderRedis = require('../dist/MashroomMemoryCacheProviderRedis').default;

const loggerFactory = () => console;

async function test() {

    await setConfig({
        redisOptions: {
            host: 'localhost',
            port: '6379',
            keyPrefix: 'mashroom:cache:',
            maxRetriesPerRequest: 3,
            enableOfflineQueue: false,
        },
        loggerFactory,
    });

    const provider = new MashroomMemoryCacheProviderRedis(loggerFactory);

    await provider.set('reg1', 'test1', 'value1', 300);
    await provider.set('reg1', 'test2', 'value2', 300);
    await provider.set('reg2', 'test1', 'value1', 300);
    await provider.set('reg2', 'test2', 'value2', 300);
    await provider.set('reg2', 'test3', 'value3', 300);
    await provider.set('reg2', 'test4', 'value4', 300);
    await provider.set('reg3', 'test1', {
        foo: 'bar',
        x: 2,
    }, 300);

    console.info('Value reg1:test1:', await provider.get('reg1', 'test1'));
    console.info('Object value type reg3:test1:', typeof(await provider.get('reg3', 'test1')));
    await provider.del('reg1', 'test1');
    console.info('Value reg1:test1 after del:', await provider.get('reg1', 'test1'));

    console.info('Entry count reg2:', await provider.getEntryCount('reg2'));
    await provider.clear('reg2');
    console.info('Entry count reg 2 after clear:', await provider.getEntryCount('reg2'));

    console.info('Entry count reg1:', await provider.getEntryCount('reg1'));

    await close();
}

test();
