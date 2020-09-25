'use strict';

import axios from 'axios';
import StatusActions from './status';
import ConfigActions from './config';
import OriginalConfigActions from './originalConfig';

import ModalContinueOrCancel from '../../components/lib/ModalContinueOrCancel';

const Actions = {
	PRESENTATION_NAV_GLOBAL_SELECT: 'PRESENTATION_NAV_GLOBAL_SELECT',

	PRESENTATION_CONFIG_NAV_SELECT: 'PRESENTATION_CONFIG_NAV_SELECT',

	// PRESENTATION_CONFIG_INTGR_TOGGLE_CARD: 'PRESENTATION_CONFIG_INTGR_TOGGLE_CARD',

	PRESENTATION_CONFIG_HIST_LOAD: 'PRESENTATION_CONFIG_HIST_LOAD',
	PRESENTATION_CONFIG_HIST_DELETE: 'PRESENTATION_CONFIG_HIST_DELETE',
	PRESENTATION_CONFIG_HIST_ACTIVATE: 'PRESENTATION_CONFIG_HIST_ACTIVATE',
	// PRESENTATION_: 'PRESENTATION_',
};

export const globalNavItems = {
	status: 'status',
	configuration: 'configuration',
	update: 'updates',
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


// Action Creators

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

function loadConfiguration(serialNumber) {
	return (dispatch, getState) => {	// triggers thunk middleware
		console.debug(`loadConfiguration(${serialNumber})`);
		axios
			.get(`/api/config/${serialNumber}`)
			.then(resp => {
				if (resp.status == 200) {
					// state.config
					dispatch({ type: ConfigActions.CONFIG_LOAD_NEW_CONFIG, payload: resp.data.configData });
					// state.originalConfig
					dispatch({ type: OriginalConfigActions.ORIGINAL_CFG_LOAD_NEW_CONFIG, payload: resp.data.configData });
					// state.status.unsavedChanges = false
					// state.status.baselineRevision
					// state.status.serialLastLoaded
					dispatch({
						type: StatusActions.STATUS_NEW_CONFIG_LOADED,
						payload: {
							serialNumber,
							revision: resp.data.revision,
						},
					});
				} else {
					console.error(`loadConfiguration(${serialNumber} failed`, resp.data);
				}
			})
			.catch(console.error);
	}
};

export function loadConfigurationHistory() {
	return (dispatch, getState) => {
		// triggers thunk middleware
		const state = getState();
		console.debug(`loadConfigurationHistory: fetching config summary for schema ${state.status.codeSchemaVersion}`);
		axios
			.get(`/api/config/summary/${state.status.codeSchemaVersion}`)
			.then((resp) => {
				// we add presentation data to the configuration list
				const configSummary = resp.data;
				configSummary.map((entry) => {
					Object.assign(entry, {
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
				});
				dispatch({ type: Actions.PRESENTATION_CONFIG_HIST_LOAD, payload: configSummary });
				console.debug('loadConfigurationHistory: new config summary:', configSummary);
			})
			.catch(console.error);
	};
};



// default export the apiServer actions
export default Actions;
