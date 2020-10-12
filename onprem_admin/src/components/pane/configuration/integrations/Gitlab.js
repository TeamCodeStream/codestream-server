import React from 'react';
import { connect } from 'react-redux';

import ConfigActions from '../../../../store/actions/config';
import { DocRefs } from '../../../../config';
import FormFieldSet from '../../../lib/FormFieldSet';
import { validateInput } from '../../../../lib/validation';

const GitlabFormFieldSet = [
	[
		{
			id: 'gitlabAppClientId',
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
				property: 'integrations.gitlab.cloud.appClientId',
			},
		},
		{
			id: 'gitlabAppClientSecret',
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
				property: 'integrations.gitlab.cloud.appClientSecret',
			},
		},
	],
];

const GitlabForm = (props) => {
	return <FormFieldSet fieldset={GitlabFormFieldSet} formData={props.formData} helpDoc={DocRefs.integrations.gitlab} dispatch={props.dispatch} />;
};

const mapState = (state) => ({
	formData: {
		values: {
			gitlabAppClientId: state.config.integrations?.gitlab?.cloud?.appClientId,
			gitlabAppClientSecret: state.config.integrations?.gitlab?.cloud?.appClientSecret,
		},
		revertValues: {
			gitlabAppClientId: state.config.integrations?.gitlab?.cloud?.appClientId,
			gitlabAppClientSecret: state.config.integrations?.gitlab?.cloud?.appClientSecret,
		},
	},
});
const mapDispatch = (dispatch) => ({ dispatch });

export default connect(mapState, mapDispatch)(GitlabForm);
