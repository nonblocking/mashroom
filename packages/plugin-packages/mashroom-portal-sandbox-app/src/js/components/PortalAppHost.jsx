// @flow

import React, {PureComponent} from 'react';
import {CircularProgress} from '@mashroom/mashroom-portal-ui-commons';

import type {ActivePortalApp} from '../../../type-definitions';

export const HOST_ELEMENT_ID = 'mashroom-sandbox-app-host-elem';

type Props = {
    width: string,
    activePortalApp: ?ActivePortalApp,
    setHostWidth: (string) => void,
}

export default class PortalApp extends PureComponent<Props> {

    wrapperElemRef: { current: null | HTMLDivElement };
    boundResizerMouseUp: MouseEvent => void;
    boundResizerMouseMove: MouseEvent => void;

    constructor() {
        super();
        this.wrapperElemRef = React.createRef();
        this.boundResizerMouseUp = this.resizerMouseUp.bind(this);
        this.boundResizerMouseMove = this.resizerMouseMove.bind(this);
    }

    resizerMouseDown(event: MouseEvent) {
        window.addEventListener('mousemove', this.boundResizerMouseMove);
        window.addEventListener('mouseup', this.boundResizerMouseUp);
    }

    resizerMouseUp(event: MouseEvent) {
        window.removeEventListener('mousemove', this.boundResizerMouseMove);
        window.removeEventListener('mouseup', this.boundResizerMouseUp);
    }

    resizerMouseMove(event: MouseEvent) {
        if (!this.wrapperElemRef.current) {
            return;
        }

        const { setHostWidth } = this.props;
        const width = event.pageX - this.wrapperElemRef.current.getBoundingClientRect().left;
        if (width > 100) {
            setHostWidth('' + width + 'px');
        }
    }

    render() {
        const { activePortalApp } = this.props;
        if (!activePortalApp) {
            return null;
        }

        let { width } = this.props;
        if (width.match(/^\d+$/)) {
            width = width + 'px';
        }

        const pluginName = activePortalApp.setup.pluginName;
        const classFromPluginName = pluginName.toLowerCase().replace(/ /g, '-');

        return (
            <div className='mashroom-sandbox-app-host-wrapper' style={{ width }} ref={this.wrapperElemRef}>
                <div id={HOST_ELEMENT_ID} className={`portal-app-${classFromPluginName}`}>
                   <CircularProgress />
                </div>
                <div className='mashroom-sandbox-app-host-resizer' onMouseDown={this.resizerMouseDown.bind(this)}>
                    <div className='grip' />
                </div>
            </div>
        );
    }
}
