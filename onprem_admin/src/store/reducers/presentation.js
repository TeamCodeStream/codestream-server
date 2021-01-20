import produce from 'immer';
import Actions from '../actions/presentation';

const presentationState = {
	nav: {},	// global nav bar
	configuration: {},	// configuration panes
	updates: {},
	support: {},
	license: {},
};

export default (state = {}, action) =>
	produce(state, (draft) => {
		// console.debug(`reducer(presentation): ${action.type}`);
		switch (action.type) {
			case Actions.PRESENTATION_NAV_GLOBAL_SELECT:
				draft.nav.paneSelected = action.payload;
				return;
			case Actions.PRESENTATION_CONFIG_NAV_SELECT:
				draft.configuration.paneSelected = action.payload;
				return;
			case Actions.PRESENTATION_CONFIG_HIST_LOAD:
				draft.configuration.history.summary = action.payload;
				return;
			case Actions.PRESENTATION_CONFIG_HIST_DELETE:
				draft.configuration.history.summary = state.configuration.history.summary.filter((cfg) => {
					return cfg.serialNumber !== action.payload;
				});
				return;
			case Actions.PRESENTATION_CONFIG_HIST_REFRESH_ONE:
				const entry =
					draft.configuration.history.summary.filter((cfg) => {
						return cfg.serialNumber === action.payload.serialNumber;
					})[0] || {};
				Object.assign(entry, action.payload.entry);
				return;
			case Actions.PRESENTATION_CONFIG_HIST_ACTIVATE:
				// it's tecnically possible for there not to be an active configuration
				if (action.payload.currentActivatedConfigSerial) {
					const curRef = draft.configuration.history.summary.filter((cfg) => {
						return cfg.serialNumber === action.payload.currentActivatedConfigSerial;
					});
					curRef[0].active.on = false;
					curRef[0].deletable.on = true;
				}
				const newRef = draft.configuration.history.summary.filter((cfg) => {
					return cfg.serialNumber === action.payload.newActivatedConfigSerial;
				});
				newRef[0].active.on = true;
				newRef[0].deletable.on = false;
				return;
			// case Actions.PRESENTATION_CONFIG_GEN_TELEMETRY_SET_DISABLED:
			// 	draft.configuration.general.telemetryDisabled = action.payload;
			// 	return;
			case Actions.PRESENTATION_CONFIG_TOPOLOGY_NEW_CERT:
				// !newCert === no new card being edited
				if (!draft.configuration.topology.newCert) {
					draft.configuration.topology.newCert = {};
				}
				return;
			case Actions.PRESENTATION_CONFIG_TOPOLOGY_NO_NEW_CERT:
				draft.configuration.topology.newCert = null;
				return;
		}
	}
);
