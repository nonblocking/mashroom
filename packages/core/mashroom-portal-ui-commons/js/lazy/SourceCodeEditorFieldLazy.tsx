
import React, {Suspense} from 'react';
import CircularProgress from '../components/CircularProgress';
const SourceCodeEditorField = React.lazy(() => import('../containers/SourceCodeEditorField'));

type Props = {
    id: string;
    name: string;
    labelId: string;
    language: 'javascript' | 'json' | 'css' | 'html';
    theme?: 'blackboard' | 'idea';
    height?: number;
}

export default (props: Props) => (
    <Suspense fallback={<CircularProgress />}>
        <SourceCodeEditorField {...props}/>
    </Suspense>
);
