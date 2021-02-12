
import React, {PureComponent} from 'react';

type Props = {
    svgData: string;
    className?: string;
}

class InlineSVG extends PureComponent<Props> {

    createSVGMarkup() {
        return {__html: this.props.svgData};
    }

    render() {
        return (
            <div className={`image-svg ${this.props.className || ''}`} dangerouslySetInnerHTML={this.createSVGMarkup()}/>
        );
    }

}

export default InlineSVG;
