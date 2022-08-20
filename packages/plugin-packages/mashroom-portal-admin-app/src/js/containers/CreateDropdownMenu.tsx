
import {connect} from 'react-redux';
import {setShowModal} from '@mashroom/mashroom-portal-ui-commons';
import CreateDropdownMenu from '../components/CreateDropdownMenu';
import {setSelectedPageNew, setSelectedSiteNew} from '../store/actions';

import type {Dispatch, State} from '../types';

const mapStateToProps = (state: State) => ({
});

const mapDispatchToProps = (dispatch: Dispatch) => ({
    showModal: (name: string) => { dispatch(setShowModal(name, true)); },
    initConfigureSite: () => { dispatch(setSelectedSiteNew()); },
    initConfigurePage: () => { dispatch(setSelectedPageNew()); }
});

export default connect(mapStateToProps, mapDispatchToProps)(CreateDropdownMenu);
