'use strict';

import produce from 'immer';
import Actions from '../actions/config';
import nestedObjectInit from '../../lib/nestedObjectInit';

export default (state = null, action) =>
	produce(state, (draft) => {
		// console.debug(`reducer(config/apiServer): ${action.type}`);
		switch (action.type) {
			case Actions.CONFIG_API_SERVER_SET_PHONEHOME_DISABLED:
				draft.apiServer.disablePhoneHome = !(state.apiServer.disablePhoneHome || false);
				break;
			// case Actions.CONFIG_TELEMETRY_SET_DISABLED:
			// 	draft.telemetry.disabled = action.payload;
			// 	break;
			case Actions.CONFIG_LOAD_NEW_CONFIG:
				// here we replace the entire config slice of the state with a new version
				return action.payload;
			case Actions.CONFIG_INTG_SLACK_APP_ID:
				if (!draft.integrations?.slack?.cloud) nestedObjectInit(draft, 'draft.integrations.slack.cloud');
				draft.integrations.slack.cloud.appId = action.payload;
				break;
			case Actions.CONFIG_INTG_SLACK_CLIENT_ID:
				if (!draft.integrations?.slack?.cloud) nestedObjectInit(draft, 'draft.integrations.slack.cloud');
				draft.integrations.slack.cloud.appClientId = action.payload;
				break;
			case Actions.CONFIG_INTG_SLACK_CLIENT_SECRET:
				if (!draft.integrations?.slack?.cloud) nestedObjectInit(draft, 'draft.integrations.slack.cloud');
				draft.integrations.slack.cloud.appClientSecret = action.payload;
				break;
			case Actions.CONFIG_INTG_SLACK_SIGNING_SECRET:
				if (!draft.integrations?.slack?.cloud) nestedObjectInit(draft, 'draft.integrations.slack.cloud');
				draft.integrations.slack.cloud.appSigningSecret = action.payload;
				break;
			case Actions.CONFIG_INTG_SLACK_INTERACTIVE_COMPONENTS:
				if (!draft.integrations?.slack?.cloud) nestedObjectInit(draft, 'draft.integrations.slack.cloud');
				draft.integrations.slack.cloud.interactiveComponentsEnabled = action.payload;
				break;
		}
	});
