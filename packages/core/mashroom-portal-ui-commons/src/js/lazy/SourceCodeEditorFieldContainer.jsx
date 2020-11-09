// @flow

import React, {Suspense} from 'react';
import CircularProgress from '../components/CircularProgress';
const SourceCodeEditorFieldContainer = React.lazy(() => import('../containers/SourceCodeEditorFieldContainer'));

type Props = {|
    name: string,
    labelId: string,
    language: 'javascript' | 'json' | 'css' | 'html',
    theme?: 'blackboard' | 'idea',
    height?: number
|}

export default (props: Props) => (
    <Suspense fallback={<CircularProgress />}>
        <SourceCodeEditorFieldContainer {...props}/>
    </Suspense>
);
