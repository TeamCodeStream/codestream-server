'use strict';

import axios from 'axios';

// Application logic goes here

export const SystemStatuses = {
	ok: 'OK', // all is well
	pending: 'PENDING', // status checks pending (warning condition)
	attention: 'ATTENTION', // something's wrong (error condition)
	notice: 'NOTICE', // informational status messages
};

const Actions = {
	STATUS_SET_UNSAVED_CHANGES: 'STATUS_SET_UNSAVED_CHANGES',
	STATUS_ACTIVATE_CONFIG: 'STATUS_ACTIVATE_CONFIG',
	STATUS_NEW_CONFIG_LOADED: 'STATUS_NEW_CONFIG_LOADED',
	STATUS_REFRESH_SYSTEM_STATUS: 'STATUS_REFRESH_SYSTEM_STATUS',
	STATUS_PROCESS_MESSAGE_EVENT: 'STATUS_PROCESS_MESSAGE_EVENT',
	STATUS_LOAD_SYSTEM_MESSAGE_HISTORY: 'STATUS_LOAD_SYSTEM_MESSAGE_HISTORY',
	STATUS_LOGIN: 'STATUS_LOGIN',
	// STATUS_: 'STATUS_',
};

// Action Creators
// export function doAnyThing(args) {
// 	console.debug(`action(STATUS): ${action.type}`);
// 	const payload = args.whatever * 5;
// 	return { type: Actions.STATUS_ANY_ACTION, payload };
// };

// Action Dispatchers (Thunk)
// export function doAnyThingThunk(args) {
// 	return (dispatch, getState) => {
// 		console.debug(`action(STATUS): ${action.type}`);
// 		const payload = getState().someProp + args.someVal * 10;
// 		dispatch ({ type: Actions.STATUS_ANY_ACTION, payload });
// 	};
// }

export function loadSystemMessageHistory() {
	return (dispatch, getState) => {
		// triggers thunk middleware
		const state = getState();
		console.debug(`loadSystemMessageHistory`);
		axios
			.get(`/api/status/history`)
			.then((resp) => {
				console.debug('system message history:', resp.data);
				dispatch({ type: Actions.STATUS_LOAD_SYSTEM_MESSAGE_HISTORY, payload: resp.data });
			})
			.catch(console.error);
	};
};

// default export is the Actions object
export default Actions;
