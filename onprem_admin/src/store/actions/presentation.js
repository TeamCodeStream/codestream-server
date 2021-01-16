'use strict';

import axios from 'axios';
import StatusActions from './status';
import ConfigActions from './config';
import PresentationActions from './presentation';
import OriginalConfigActions from './originalConfig';

import ModalContinueOrCancel from '../../components/lib/ModalContinueOrCancel';

const Actions = {
	PRESENTATION_NAV_GLOBAL_SELECT: 'PRESENTATION_NAV_GLOBAL_SELECT',

	PRESENTATION_CONFIG_NAV_SELECT: 'PRESENTATION_CONFIG_NAV_SELECT',

	// PRESENTATION_CONFIG_INTGR_TOGGLE_CARD: 'PRESENTATION_CONFIG_INTGR_TOGGLE_CARD',

	PRESENTATION_CONFIG_HIST_LOAD: 'PRESENTATION_CONFIG_HIST_LOAD',
	PRESENTATION_CONFIG_HIST_REFRESH_ONE: 'PRESENTATION_CONFIG_HIST_REFRESH_ONE',
	PRESENTATION_CONFIG_HIST_DELETE: 'PRESENTATION_CONFIG_HIST_DELETE',
	PRESENTATION_CONFIG_HIST_ACTIVATE: 'PRESENTATION_CONFIG_HIST_ACTIVATE',

	PRESENTATION_CONFIG_GEN_TELEMETRY_SET_DISABLED: 'PRESENTATION_CONFIG_GEN_TELEMETRY_SET_DISABLED',
	// PRESENTATION_: 'PRESENTATION_',
};

export const globalNavItems = {
	status: 'status',
	configuration: 'configuration',
	updates: 'updates',
	support: 'support',
	license: 'license',
}

export const configNavItems = {
	topology: 'topology',
	general: 'general',
	email: 'email',
	integrations: 'integrations',
	history: 'history',
}

export const integrationStatuses = {
	disabled: 'disabled',
	on: 'on',
	off: 'off',
};

// Action Creators

// Config > Email
// disabled, on, off
export function nodeMailerStatus(state) {
	const nodeMailerProps = state.config.emailDeliveryService?.NodeMailer;
	if (!nodeMailerProps || !(nodeMailerProps.host && nodeMailerProps.port)) {
		return integrationStatuses.disabled;
	}
	return !nodeMailerProps.disabled ? integrationStatuses.on : integrationStatuses.off;
}

export function sendGridStatus(state) {
	console.debug('sendGridStatus(state.config.emailDeliveryService)', state.config.emailDeliveryService);
	const sendGridProps = state.config.emailDeliveryService?.sendgrid;
	if (!sendGridProps || !sendGridProps.apiKey) {
		return integrationStatuses.disabled;
	}
	return !sendGridProps.disabled ? integrationStatuses.on : integrationStatuses.off;
}

// Config > Integrations
// disabled, on, off
export function standardIntegrationStatus(state, integrationSource, subSection = 'cloud') {
	// console.debug(`standardIntegrationStatus() src=${integrationSource}  subSection=${subSection}`);
	const integration = state.config.integrations?.[integrationSource]?.[subSection];
	if (!integration || !(integration.appClientId && integration.appClientSecret)) {
		return integrationStatuses.disabled;
	}
	return !integration.disabled ? integrationStatuses.on : integrationStatuses.off;
}

// Config > History
// --------------------------------------------------------------------------
function deleteConfiguration(serialNumber) {
	return (dispatch, getState) => {	// triggers thunk middleware
		console.debug(`deleteConfiguration(${serialNumber})`);
		axios
			.delete(`/api/config/${serialNumber}`)
			.then((resp) => {
				if (resp.data) {
					dispatch({ type: Actions.PRESENTATION_CONFIG_HIST_DELETE, payload: serialNumber });
				}
				else {
					console.error(`deleteConfiguration(${serialNumber}) failed`);
				}
			})
			.catch(console.error);
	}
};

function activateConfiguration(serialNumber) {
	return (dispatch, getState) => {	// triggers thunk middleware
		console.debug(`activateConfiguration(${serialNumber})`);
		axios
			.put(`/api/config/activate/${serialNumber}`)
			.then((resp) => {
				if (resp.data) {
					dispatch({
						type: Actions.PRESENTATION_CONFIG_HIST_ACTIVATE,
						payload: { currentActivatedConfigSerial: getState().status.activeConfigSerialNumber, newActivatedConfigSerial: serialNumber },
					});
					dispatch({ type: StatusActions.STATUS_ACTIVATE_CONFIG, payload: serialNumber });
				} else {
					console.error(`activateConfiguration(${serialNumber}) failed`);
				}
			})
			.catch(console.error);
	}
};

// dispatch a sequence of events needed to load a new configuration
function dispatchLoadConfiguration(dispatch, state, configDoc ) {
	const { configData, serialNumber, revision } = configDoc;
	console.debug('dispatchLoadConfiguration()  state =', state);
	dispatch({ type: ConfigActions.CONFIG_LOAD_NEW_CONFIG, payload: configData });
	dispatch({ type: OriginalConfigActions.ORIGINAL_CFG_LOAD_NEW_CONFIG, payload: configData });

	// locate the entry in the config history with the active serial number
	let entry = state.presentation.configuration.history.summary.filter((cfg) => {
		return cfg.serialNumber === serialNumber;
	})[0];
	// it is possible for this config (serialNumber) not to be in the summary
	// so we add an entry to the history (no api call needed)
	if (!entry) {
		console.debug('adding new serialnumber to config history. configDoc =', configDoc);
		entry = {
			...configDoc,
			_id: configDoc.serialNumber,
		};
	}
	console.debug(`dispatchLoadConfiguration()  serial=${serialNumber} entry =`, entry);
	dispatch({
		type: PresentationActions.PRESENTATION_CONFIG_HIST_REFRESH_ONE,
		payload: {
			serialNumber,
			entry: refreshConfigurationSpecialProps(dispatch, state, entry),
		},
	});
	dispatch({
		type: StatusActions.STATUS_NEW_CONFIG_LOADED,
		payload: {
			serialNumber,
			revision,
		},
	});
}

function loadConfiguration(serialNumber) {
	return (dispatch, getState) => {	// triggers thunk middleware
		console.debug(`loadConfiguration(${serialNumber})`);
		axios
			.get(`/api/config/${serialNumber}`)
			.then(resp => {
				if (resp.status == 200) {
					dispatchLoadConfiguration(dispatch, getState(), resp.data);
				} else {
					console.error(`loadConfiguration(${serialNumber} failed`, resp.data);
				}
			})
			.catch(console.error);
	}
};

export function saveConfiguration(activate = false, desc = null) {
	return (dispatch, getState) => {
		// triggers thunk middleware
		const state = getState();
		console.debug(`saveConfiguration()`);
		axios
			.post(activate ? '/api/config/activte' : '/api/config', {
				configData: state.config,
				desc,
			})
			.then((resp) => {
				console.debug('saveConfiguration(): response data', resp.data);
				if (resp.data?.success) {
					const configDoc = resp.data.response.configDoc;
					if (activate) {
						dispatch({ type: StatusActions.STATUS_ACTIVATE_CONFIG, payload: configDoc.serialNumber });
					}
					dispatchLoadConfiguration(dispatch, state, {
						...configDoc,
						configData: state.config,
					});
					// dispatch(loadConfigurationHistory)
				} else {
					console.error(`ssaveConfiguration() failed`, resp.data);
				}
			})
			.catch(console.error);
	};
};

function refreshConfigurationSpecialProps(dispatch, state, entry) {
	return Object.assign({}, entry, {
		dateString: new Date(entry.timeStamp).toUTCString(),
		// tooltips for 'standard' properties
		tooltip: {
			// desc: `Serial number ${entry.serialNumber}`,
			schemaVersion: `Your API server is using schema ${state.status.codeSchemaVersion}. You can activate any config with that version.`,
			revision: `Serial number ${entry.serialNumber}`,
			dateString: `Serial number ${entry.serialNumber}`,
			desc: `Serial number ${entry.serialNumber}`,
		},
		// these are 'special' properties for the Table component
		deletable: {
			on: entry.serialNumber !== state.status.activeConfigSerialNumber,
			onClick: {
				whenOn: () => dispatch(deleteConfiguration(entry.serialNumber)),
			},
			tooltip: {
				whenOn: `Delete configuration ${entry.schemaVersion}.${entry.revision} from the database.`,
				whenOff: 'You cannot delete the active configuration',
				whenDisabled: null,
			},
		},
		loadable: {
			on: !(state.status.serialLastLoaded === entry.serialNumber && !state.status.unsavedChanges),
			onClick: {
				whenOn: () => dispatch(loadConfiguration(entry.serialNumber)),
			},
			tooltip: {
				whenOn: `Load configuration ${entry.schemaVersion}.${entry.revision} into the app for editing.`,
			},
		},
		active:
			entry.schemaVersion !== state.status.codeSchemaVersion
				? {
						on: null,
						tooltip: {
							whenDisabled: 'This schema version is not compatible with the server software.',
						},
				  }
				: {
						on: entry.serialNumber === state.status.activeConfigSerialNumber,
						onClick: {
							whenOff: () => dispatch(activateConfiguration(entry.serialNumber)),
						},
						tooltip: {
							whenOn: `Activate a different configuration in order to deactivate this one.`,
							whenOff: `Activate configuration ${entry.schemaVersion}.${entry.revision}. Restart needed for changes to take effect.`,
						},
				  },
	});
}

export function loadConfigurationHistory() {
	return (dispatch, getState) => {
		// triggers thunk middleware
		const state = getState();
		console.debug(`loadConfigurationHistory: fetching config summary for schema ${state.status.codeSchemaVersion}`);
		axios
			.get(`/api/config/summary/${state.status.codeSchemaVersion}`)
			.then((resp) => {
				const configSummary = [];
				resp.data.map((entry) => {
					configSummary.push(refreshConfigurationSpecialProps(dispatch, state, entry));
				});
				dispatch({ type: Actions.PRESENTATION_CONFIG_HIST_LOAD, payload: configSummary });
				console.debug('refreshConfigurationHistory: new config summary:', configSummary);
			})
			.catch(console.error);
	};
};



// default export the apiServer actions
export default Actions;
