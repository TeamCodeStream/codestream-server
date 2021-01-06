
import produce from 'immer';
import Actions from '../actions/status';
import findObjectsBy from '../../lib/findObjectInObjectList';
import sortBy from '../../lib/sortObjectListByProps';

// 'produce' creates a mutable object called 'draft' which you can consider a
// deep copy of the state. 'draft' should be modified to reflect the next state.
// The 'produce' function should not return anything. 'draft' is used as the
// next state.

// Reducers only see a 'reduced' state
export default (state = null, action) =>
	produce(state, (draft) => {
		// console.debug(`reducer(status): ${action.type}`);
		switch (action.type) {
			case Actions.STATUS_SET_UNSAVED_CHANGES:
				draft.unsavedChanges = action.payload;
				break;
			case Actions.STATUS_ACTIVATE_CONFIG:
				draft.activeConfigSerialNumber = action.payload;
				break;
			case Actions.STATUS_NEW_CONFIG_LOADED:
				draft.serialLastLoaded = action.payload.serialNumber;
				draft.revisionLastLoaded = action.payload.revision;
				draft.unsavedChanges = false;
				break;
			case Actions.STATUS_REFRESH_SYSTEM_STATUS:
				// console.log('STATUS_REFRESH_SYSTEM_STATUS', action.payload);
				draft.systemStatus = action.payload;
				break;
			case Actions.STATUS_PROCESS_MESSAGE_EVENT:
				// FIXME: we need to create enumerated type here
				switch (action.payload.msgType) {
					case 'add':
						if (findObjectsBy(state.statusMessages, { and: { msgId: action.payload.msgId } }).length > 0) {
							console.error(`${Actions.STATUS_PROCESS_MESSAGE_EVENT} Reducer dropping duplicate message`, {
								payload: action.payload,
								beforeState: Object.assign({}, state.statusMessages)
							});
							// console.error("X=", x);
						} else {
							// console.log('adding message', action.payload);
							draft.statusMessages.unshift(action.payload);
						}
						break;
					default:
						console.error(`${Actions.STATUS_PROCESS_MESSAGE_EVENT} Reducer got bad msgType`, action.payload);
						break;
				}
				// console.log('STATUS_PROCESS_MESSAGE_EVENT', { payload: action.payload, store: draft.statusMessages });
				break;
			case Actions.STATUS_LOAD_SYSTEM_MESSAGE_HISTORY:
				draft.statusMessages = action.payload;
				// console.log('STATUS_LOAD_SYSTEM_MESSAGE_HISTORY', action.payload);
				break;
		}
	});
