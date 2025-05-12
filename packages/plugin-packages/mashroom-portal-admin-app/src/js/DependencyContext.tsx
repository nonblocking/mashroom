
import React from 'react';

import type {ReactNode} from 'react';
import type {DependencyContext as DependencyContextType} from './types';

type ProviderProps = {
    deps: DependencyContextType;
    children: ReactNode;
}

const dummy: any = {};
const defaultContext: DependencyContextType = dummy;

const Context = React.createContext<DependencyContextType>(defaultContext);

export const DependencyContextProvider = (props: ProviderProps) => {
    return (
        <Context.Provider value={props.deps}>
            {props.children}
        </Context.Provider>
    );
};

export const DependencyContext = Context;
