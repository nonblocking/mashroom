
import React, {PureComponent} from 'react';
import {CircularProgress} from '@mashroom/mashroom-portal-ui-commons';

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

    resizerMouseDown() {
        global.addEventListener('mousemove', this.boundResizerMouseMove);
        global.addEventListener('mouseup', this.boundResizerMouseUp);
    }

    resizerMouseUp() {
        global.removeEventListener('mousemove', this.boundResizerMouseMove);
        global.removeEventListener('mouseup', this.boundResizerMouseUp);
    }

    resizerMouseMove(event: MouseEvent) {
        if (!this.wrapperElemRef.current) {
            return;
        }

        const {setHostWidth} = this.props;
        const width = event.pageX - this.wrapperElemRef.current.getBoundingClientRect().left;
        if (width > 100) {
            setHostWidth(`${width}px`);
        }
    }

    render() {
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
                <div id={hostElementId} className={`portal-app-${classFromPluginName}`}>
                    <CircularProgress/>
                </div>
                <div className='mashroom-sandbox-app-host-resizer' onMouseDown={this.resizerMouseDown.bind(this)}>
                    <div className='grip'/>
                </div>
            </div>
        );
    }
}
