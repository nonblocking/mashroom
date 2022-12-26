
import type {MashroomSecurityAcl} from '@mashroom/mashroom-json-schemas/type-definitions';

const acl: MashroomSecurityAcl = {
    '/mashroom/**': {
        '*': {
            'allow': {
                'roles': ['Administrator'],
                'ips': ['127.0.0.1', '::1', '::ffff:127.0.0.1']
            }
        }
    },
    '/portal/public-site/**': {
        '*': {
            'allow': 'any'
        }
    },
    '/portal/**': {
        '*': {
            'allow': {
                'roles': ['Authenticated']
            }
        }
    },
    '/websocket/test/**': {
        '*': {
            'allow': {
                'roles': ['Authenticated']
            }
        }
    }
}

export default acl;

