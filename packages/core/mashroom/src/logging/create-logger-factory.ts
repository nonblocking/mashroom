
import MashroomLogger from './MashroomLogger';

import type {MashroomLoggerContext, MashroomLoggerFactory} from '../../type-definitions';
import type {MashroomLoggerDelegate} from '../../type-definitions/internal';

const create = (delegate: MashroomLoggerDelegate): MashroomLoggerFactory => {
   const factory = (category: string) => new MashroomLogger(category, null, delegate);

   const contextBoundFactory = (context: MashroomLoggerContext) => {
       const subFactory = (category: string) => new MashroomLogger(category, context, delegate);
       subFactory.bindToContext = (context2: MashroomLoggerContext) => contextBoundFactory({
           ...context,
           ...context2,
       });
       return subFactory;
   };
   factory.bindToContext = (context: MashroomLoggerContext) => contextBoundFactory(context);

   return factory;
};

export default create;
