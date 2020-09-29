
import React from 'react';
import { connect } from 'react-redux';

import ConfigActions from '../../../../store/actions/config';
import { DocRefs } from '../../../../config';
import FormFieldSet from '../../../lib/FormFieldSet';

function validateInput(input, field) {
	console.debug('validateInput()', input, field);
	if (field.type === 'text') {
		if (input.length < field.validation.minLength || input.length > field.validation.maxLength) {
			console.debug('string length out of range');
			return `string length must be between ${field.validation.minLength} and ${field.validation.maxLength} characters.`;
		}
	}
}

const SlackFormFieldSet = [
	[
		{
			id: 'slackAppId',
			label: 'App ID',
			width: 'col-10',
			type: 'text',
			validation: {
				minLength: 8,
				maxLength: 12,
				onBlur: validateInput,
			},
			updateAction: ConfigActions.CONFIG_INTG_SLACK_APP_ID, // update config state
			// These props will be set in the mapState routine
			// value,
			// revertValue
		},
	],
	[
		{
			id: 'slackClientId',
			label: 'Client ID',
			width: 'col-10',
			type: 'text',
			validation: {
				minLength: 15,
				maxLength: 100,
				onBlur: validateInput,
			},
			updateAction: ConfigActions.CONFIG_INTG_SLACK_CLIENT_ID, // update config state
		},
	],
	[
		{
			id: 'slackClientSecret',
			label: 'Client Secret',
			width: 'col-10',
			mutedText: 'this is nice',
			type: 'text',
			validation: {
				minLength: 15,
				maxLength: 100,
				onBlur: validateInput,
			},
			updateAction: ConfigActions.CONFIG_INTG_SLACK_CLIENT_SECRET, // update config state
		},
	],
	[
		{
			id: 'slackSigningSecret',
			label: 'Signing Secret',
			width: 'col-10',
			type: 'text',
			validation: {
				minLength: 15,
				maxLength: 100,
				onBlur: validateInput,
			},
			updateAction: ConfigActions.CONFIG_INTG_SLACK_SIGNING_SECRET, // update config state
			// mutedText: (
			// 	<a href={DocRefs.integrations.slack} target="_blank">
			// 		Documentation reference
			// 	</a>
			// ),
		},
	],
];

// convenience and nicer code - returns ref to the named
// object embeded in the form layout.
const fieldById = () => ({
	slackAppId: SlackFormFieldSet[0][0],
	slackClientId: SlackFormFieldSet[1][0],
	slackClientSecret: SlackFormFieldSet[2][0],
	slackSigningSecret: SlackFormFieldSet[3][0],
});

const SlackForm = props => {
	return (
		<FormFieldSet fieldset={props.fieldset} helpDoc={DocRefs.integrations.slack} />
	);
};

const mapState = (state) => {
	// Add the data needed from the state to the SlackFormFieldSet data object
	fieldById().slackAppId.value = state.config.integrations?.slack?.cloud?.appId;
	fieldById().slackClientId.value = state.config.integrations?.slack?.cloud?.appClientId;
	fieldById().slackClientSecret.value = state.config.integrations?.slack?.cloud?.appClientSecret;
	fieldById().slackSigningSecret.value = state.config.integrations?.slack?.cloud?.appSigningSecret;
	// revert value comes from the original config we loaded
	fieldById().slackAppId.revertValue = state.originalConfig.integrations?.slack?.cloud?.appId;
	fieldById().slackClientId.revertValue = state.originalConfig.integrations?.slack?.cloud?.appClientId;
	fieldById().slackClientSecret.revertValue = state.originalConfig.integrations?.slack?.cloud?.appClientSecret;
	fieldById().slackSigningSecret.revertValue = state.originalConfig.integrations?.slack?.cloud?.appSigningSecret;

	console.debug('Slack.js(mapState)', SlackFormFieldSet);
	return {
		fieldset: SlackFormFieldSet,
	};
};
// const mapDispatch = (dispatch) => ({});

export default connect(mapState)(SlackForm);
// export default SlackForm;
