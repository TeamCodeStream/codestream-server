
// Application logic goes here

export const SystemStatuses = {
	ok: 'OK',	// all is well
	attention: 'ATTENTION', // something's wrong
	pending: 'PENDING',	// updating status
}
export function worstStatus(alertA, alertB) {
	if (alertA === SystemStatuses.ok) return alertB;
	if (alertA === SystemStatuses.pending && alertB !== SystemStatuses.ok) return alertB;
	return alertA;
}

const Actions = {
	STATUS_SET_UNSAVED_CHANGES: 'STATUS_SET_UNSAVED_CHANGES',
	STATUS_ACTIVATE_CONFIG: 'STATUS_ACTIVATE_CONFIG',
	STATUS_NEW_CONFIG_LOADED: 'STATUS_NEW_CONFIG_LOADED',
	STATUS_REFRESH_SYSTEM_STATUS: 'STATUS_REFRESH_SYSTEM_STATUS',
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

// default export is the Actions object
export default Actions;
