import type {MashroomSecurityTopicAcl} from '@mashroom/mashroom-json-schemas/type-definitions';

const topicACL: MashroomSecurityTopicAcl = {
    'external2/#': {
        allow: ['Administrator']
    }
};

export default topicACL;
