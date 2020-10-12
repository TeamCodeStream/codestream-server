'use strict';

import React from 'react';
import { connect } from 'react-redux';

import ConfigActions from '../../../../store/actions/config';
import { DocRefs } from '../../../../config';
import FormFieldSet from '../../../lib/FormFieldSet';
import { validateInput } from '../../../../lib/validation';

const GithubFormFieldSet = [
	[
		{
			id: 'githubAppClientId',
			label: 'Client ID',
			width: 'col-10',
			type: 'text',
			validation: {
				minLength: 8,
				maxLength: 100,
				onBlur: validateInput,
			},
			updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
			updateActionPayload: {
				property: 'integrations.github.cloud.appClientId',
			},
		},
		{
			id: 'githubAppClientSecret',
			label: 'Client Secret',
			width: 'col-10',
			type: 'text',
			validation: {
				minLength: 8,
				maxLength: 100,
				onBlur: validateInput,
			},
			updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
			updateActionPayload: {
				property: 'integrations.github.cloud.appClientSecret',
			},
		},
	],
];

const GithubForm = (props) => {
	return <FormFieldSet fieldset={GithubFormFieldSet} formData={props.formData} helpDoc={DocRefs.integrations.github} dispatch={props.dispatch} />;
};

const mapState = (state) => ({
	formData: {
		values: {
			githubAppClientId: state.config.integrations?.github?.cloud?.appClientId,
			githubAppClientSecret: state.config.integrations?.github?.cloud?.appClientSecret,
		},
		revertValues: {
			githubAppClientId: state.config.integrations?.github?.cloud?.appClientId,
			githubAppClientSecret: state.config.integrations?.github?.cloud?.appClientSecret,
		},
	},
});
const mapDispatch = (dispatch) => ({ dispatch });

export default connect(mapState, mapDispatch)(GithubForm);
