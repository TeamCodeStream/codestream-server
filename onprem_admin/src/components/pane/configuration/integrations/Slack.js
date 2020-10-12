
import React from 'react';
import { connect } from 'react-redux';

import ConfigActions from '../../../../store/actions/config';
import { DocRefs } from '../../../../config';
import FormFieldSet from '../../../lib/FormFieldSet';
import { validateInput } from '../../../../lib/validation';

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
			updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
			updateActionPayload: {
				property: 'integrations.slack.cloud.appId',
			},
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
			updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
			updateActionPayload: {
				property: 'integrations.slack.cloud.appClientId',
			},
		},
	],
	[
		{
			id: 'slackClientSecret',
			label: 'Client Secret',
			width: 'col-10',
			// mutedText: 'this is nice',
			type: 'text',
			validation: {
				minLength: 15,
				maxLength: 100,
				onBlur: validateInput,
			},
			updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
			updateActionPayload: {
				property: 'integrations.slack.cloud.appClientSecret',
			},
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
			updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
			updateActionPayload: {
				property: 'integrations.slack.cloud.appSigningSecret',
			},
		},
	],
	[
		{
			id: 'slackInteractiveComponentsEnabled',
			label: 'Enable interactive components',
			width: 'col-10',
			type: 'checkbox',
			onClickAction: ConfigActions.CONFIG_TOGGLE_DOTTED_BOOLEAN,
			onClickActionPayload: {
				property: 'integrations.slack.cloud.interactiveComponentsEnabled',
			},
		},
	],
];

const SlackForm = props => {
	return (
		<FormFieldSet
			fieldset={SlackFormFieldSet}
			formData={props.formData}
			helpDoc={DocRefs.integrations.slack}
			dispatch={props.dispatch}
		/>
	);
};

const mapState = (state) => {
	const formData = {
		values: {
			// keys must match id's in the SlackFormFieldSet object
			slackAppId: state.config.integrations?.slack?.cloud?.appId,
			slackClientId: state.config.integrations?.slack?.cloud?.appClientId,
			slackClientSecret: state.config.integrations?.slack?.cloud?.appClientSecret,
			slackSigningSecret: state.config.integrations?.slack?.cloud?.appSigningSecret,
			slackInteractiveComponentsEnabled: state.config.integrations?.slack?.cloud?.interactiveComponentsEnabled,
		},
		revertValues: {
			// keys must match id's in the SlackFormFieldSet object
			slackAppId: state.originalConfig.integrations?.slack?.cloud?.appId,
			slackClientId: state.originalConfig.integrations?.slack?.cloud?.appClientId,
			slackClientSecret: state.originalConfig.integrations?.slack?.cloud?.appClientSecret,
			slackSigningSecret: state.originalConfig.integrations?.slack?.cloud?.appSigningSecret,
			slackInteractiveComponentsEnabled: state.originalConfig.integrations?.slack?.cloud?.interactiveComponentsEnabled,
		},
	};
	console.debug('Slack.js(mapState) formData:', formData);
	return { formData };
};
const mapDispatch = (dispatch) => ({ dispatch });

export default connect(mapState, mapDispatch)(SlackForm);
