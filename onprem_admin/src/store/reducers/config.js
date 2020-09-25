'use strict';

import produce from 'immer';
import Actions from '../actions/config';


export default (state = null, action) =>
	produce(state, (draft) => {
		// console.debug(`reducer(config/apiServer): ${action.type}`);
		switch (action.type) {
			case Actions.CONFIG_API_SERVER_SET_PHONEHOME_DISABLED:
				draft.apiServer.disablePhoneHome = !(state.apiServer.disablePhoneHome || false);
				break;
			case Actions.CONFIG_TELEMETRY_SET_DISABLED:
				draft.telemetry.disabled = action.payload;
				break;
			case Actions.CONFIG_LOAD_NEW_CONFIG:
				// here we replace the entire config slice of the state
				// with a new version
				return action.payload;
		}
	});

