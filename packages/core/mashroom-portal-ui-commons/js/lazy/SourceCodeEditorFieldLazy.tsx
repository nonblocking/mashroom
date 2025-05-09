
import React, {Suspense} from 'react';
import CircularProgress from '../components/CircularProgress';
const SourceCodeEditorField = React.lazy(() => import('../components/SourceCodeEditorField'));

type Props = {
    id: string;
    name: string;
    labelId: string;
    language: 'json' | 'css';
    theme?: 'light' | 'dark';
    height?: number;
}

export default (props: Props) => (
    <Suspense fallback={<CircularProgress />}>
        <SourceCodeEditorField {...props}/>
    </Suspense>
);
