
const Actions = {
	CONFIG_LOAD_NEW_CONFIG: 'CONFIG_LOAD_NEW_CONFIG',
	CONFIG_API_SERVER_SET_PHONEHOME_DISABLED: 'CONFIG_API_SERVER_SET_PHONEHOME_DISABLED',
	CONFIG_INTG_SLACK_APP_ID: 'CONFIG_INTG_SLACK_APP_ID',
	CONFIG_INTG_SLACK_CLIENT_ID: 'CONFIG_INTG_SLACK_CLIENT_ID',
	CONFIG_INTG_SLACK_CLIENT_SECRET: 'CONFIG_INTG_SLACK_CLIENT_SECRET',
	CONFIG_INTG_SLACK_SIGNING_SECRET: 'CONFIG_INTG_SLACK_SIGNING_SECRET',
	CONFIG_INTG_SLACK_INTERACTIVE_COMPONENTS: 'CONFIG_INTG_SLACK_INTERACTIVE_COMPONENTS',
	// CONFIG_TELEMETRY_SET_DISABLED: 'CONFIG_TELEMETRY_SET_DISABLED',
};

// Action Creators
export function togglePhoneHome() {
	console.debug('in togglePhoneHome action creator');
	return { type: Actions.CONFIG_API_SERVER_SET_PHONEHOME_DISABLED };
}

export function telemetryDataIsMissing(telemetry) {
	let answer = false;
	[
		['intercom.token', telemetry?.intercom?.token],
		['segment.token', telemetry?.segment?.token],
		['segment.webToken', telemetry?.segment?.webToken],
	].forEach((property) => {
		if (!property[1]) {
			console.warn(`${property[0]} missing from config`);
			answer = true;
		}
	});
	return answer;
}

// default export the apiServer actions
export default Actions;
