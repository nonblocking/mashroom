// @flow

import MashroomLogger from './MashroomLogger';

import type {MashroomLoggerContext, MashroomLoggerDelegate, MashroomLoggerFactory} from '../../type-definitions';

const create = (delegate: MashroomLoggerDelegate): MashroomLoggerFactory => {
   const factory = (category: string) => new MashroomLogger(category, null, delegate);

   const contextBoundFactory = (context: MashroomLoggerContext) => (category: string) => new MashroomLogger(category, context, delegate);
   factory.bindToContext = (context: MashroomLoggerContext) => contextBoundFactory(context);

   return factory;
};

export default create;
