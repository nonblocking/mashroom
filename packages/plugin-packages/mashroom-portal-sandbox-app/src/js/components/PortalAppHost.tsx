
import React, {PureComponent} from 'react';
import {CircularProgress} from '@mashroom/mashroom-portal-ui-commons';

import type {ReactNode} from 'react';
import type {ActivePortalApp} from '../types';

type Props = {
    hostElementId: string;
    width: string;
    activePortalApp: ActivePortalApp | undefined | null;
    setHostWidth: (width: string) => void;
}

export default class PortalApp extends PureComponent<Props> {

    wrapperElemRef: { current: null | HTMLDivElement };
    boundResizerMouseUp: (event: MouseEvent) => void;
    boundResizerMouseMove: (event: MouseEvent) => void;

    constructor(props: Props) {
        super(props);
        this.wrapperElemRef = React.createRef();
        this.boundResizerMouseUp = this.resizerMouseUp.bind(this);
        this.boundResizerMouseMove = this.resizerMouseMove.bind(this);
    }

    resizerMouseDown(): void {
        global.addEventListener('mousemove', this.boundResizerMouseMove);
        global.addEventListener('mouseup', this.boundResizerMouseUp);
    }

    resizerMouseUp(): void {
        global.removeEventListener('mousemove', this.boundResizerMouseMove);
        global.removeEventListener('mouseup', this.boundResizerMouseUp);
    }

    resizerMouseMove(event: MouseEvent): void {
        if (!this.wrapperElemRef.current) {
            return;
        }

        const {setHostWidth} = this.props;
        const width = event.pageX - this.wrapperElemRef.current.getBoundingClientRect().left;
        if (width > 100) {
            setHostWidth(`${width}px`);
        }
    }

    render(): ReactNode {
        const {activePortalApp, hostElementId} = this.props;
        if (!activePortalApp) {
            return null;
        }

        let {width} = this.props;
        if (width.match(/^\d+$/)) {
            width = `${width}px`;
        }

        const pluginName = activePortalApp.setup.pluginName;
        const classFromPluginName = pluginName.toLowerCase().replace(/ /g, '-');

        return (
            <div className='mashroom-sandbox-app-host-wrapper' style={{width}} ref={this.wrapperElemRef}>
                <div id={hostElementId} className={`mashroom-sandbox-app-host-elem portal-app-${classFromPluginName}`}>
                    <CircularProgress/>
                </div>
                <div className='mashroom-sandbox-app-host-resizer' onMouseDown={this.resizerMouseDown.bind(this)}>
                    <div className='grip'/>
                </div>
            </div>
        );
    }
}
