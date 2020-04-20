
import type {MappingResult, VHostDefinition, VHostMappingRules} from '../../type-definitions/internal';

const reverseRules = (mapping: VHostMappingRules): VHostMappingRules => {
    const ret: any = {};
    Object.keys(mapping).forEach(key => {
        ret[mapping[key]] = key;
    });
    return ret;
};

export default (originalUrl: string, vHostDefinition: VHostDefinition, reverse = false): MappingResult | undefined => {
    const { frontendBasePath = '/', mapping } = vHostDefinition;
    const originalPath = originalUrl.split(/[?#]/)[0];

    if (mapping) {
        const determinedRules = reverse ? reverseRules(mapping) : mapping;
        const basePaths = Object.keys(determinedRules);
        for (let i = 0; i < basePaths.length; i ++) {
            const basePath = basePaths[i];
            if (originalPath.startsWith(basePath)) {
                const replacementPath = determinedRules[basePath];
                const fixedReplacementPath = replacementPath === '/' ? '' : replacementPath;
                const url = basePath === '/' && originalPath !== '/' ? replacementPath + originalUrl : originalUrl.replace(basePath, fixedReplacementPath);
                if (!reverse) {
                    const frontendPath = frontendBasePath === '/' ? originalPath : frontendBasePath + originalPath;
                    const frontendUrl = frontendBasePath === '/' ? originalUrl : frontendBasePath + originalUrl;
                    return {
                        url,
                        info: {
                            mappingRuleBasePath: basePath,
                            originalUrl,
                            frontendBasePath,
                            frontendPath,
                            frontendUrl,
                        },
                    };
                } else {
                    const frontendUrl = frontendBasePath === '/' ? url : frontendBasePath + url;
                    const frontendPath = frontendUrl.split(/[?#]/)[0];
                    return {
                        url: frontendUrl,
                        info: {
                            mappingRuleBasePath: replacementPath,
                            originalUrl,
                            frontendBasePath,
                            frontendPath,
                            frontendUrl,
                        },
                    };
                }
            }
        }
    }

    return undefined;
}
