'use strict';

import React from 'react';
import { connect } from 'react-redux';

import ConfigActions from '../../../../store/actions/config';
import { DocRefs } from '../../../../config';
import FormFieldSet from '../../../lib/FormFieldSet';
import { validateInput } from '../../../../lib/validation';

const JiraFormFieldSet = [
	[
		{
			id: 'jiraAppClientId',
			label: 'App ID',
			width: 'col-10',
			type: 'text',
			validation: {
				minLength: 8,
				maxLength: 100,
				onBlur: validateInput,
			},
			updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
			updateActionPayload: {
				property: 'integrations.jira.cloud.appClientId',
			},
		},
		{
			id: 'jiraAppClientSecret',
			label: 'Secret or Password',
			width: 'col-10',
			type: 'text',
			validation: {
				minLength: 8,
				maxLength: 200,
				onBlur: validateInput,
			},
			updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
			updateActionPayload: {
				property: 'integrations.jira.cloud.appClientSecret',
			},
		},
	],
];

const JiraForm = (props) => {
	return <FormFieldSet fieldset={JiraFormFieldSet} formData={props.formData} helpDoc={DocRefs.integrations.jira} dispatch={props.dispatch} />;
};

const mapState = (state) => ({
	formData: {
		values: {
			jiraAppClientId: state.config.integrations?.jira?.cloud?.appClientId,
			jiraAppClientSecret: state.config.integrations?.jira?.cloud?.appClientSecret,
		},
		revertValues: {
			jiraAppClientId: state.config.integrations?.jira?.cloud?.appClientId,
			jiraAppClientSecret: state.config.integrations?.jira?.cloud?.appClientSecret,
		},
	},
});
const mapDispatch = (dispatch) => ({ dispatch });

export default connect(mapState, mapDispatch)(JiraForm);
