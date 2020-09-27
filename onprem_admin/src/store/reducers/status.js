
import produce from 'immer';
import Actions from '../actions/status';

// 'produce' creates a mutable object called 'draft' which you can consider a
// deep copy of the state. 'draft' should be modified to reflect the next state.
// The 'produce' function should not return anything. 'draft' is used as the
// next state.

// Reducers only see a 'reduced' state
export default (state=null, action) => produce(state, draft => {
	console.debug(`reducer(status): ${action.type}`);
	switch (action.type) {
		case Actions.STATUS_SET_UNSAVED_CHANGES:
			draft.unsavedChanges = action.payload;
			break;
		case Actions.STATUS_ACTIVATE_CONFIG:
			draft.activeConfigSerialNumber = action.payload;
			break;
		case Actions.STATUS_NEW_CONFIG_LOADED:
			draft.serialLastLoaded = action.payload.serialNumber;
			draft.baselineRevision = action.payload.revision;
			draft.unsavedChanges = false;
			break;
		}
});
