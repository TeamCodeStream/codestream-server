

import React from 'react';
import { connect } from 'react-redux';

import ConfigActions from '../../../../store/actions/config';
import { DocRefs } from '../../../../config';
import FormFieldSet from '../../../lib/FormFieldSet';
import { validateInput } from '../../../../lib/validation';

const DevopsFormFieldSet = [
	[
		{
			id: 'devopsAppClientId',
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
				property: 'integrations.devops.cloud.appClientId',
			},
		},
		{
			id: 'devopsAppClientSecret',
			label: 'Secret',
			width: 'col-10',
			type: 'text',
			validation: {
				minLength: 8,
				maxLength: 250,
				onBlur: validateInput,
			},
			updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
			updateActionPayload: {
				property: 'integrations.devops.cloud.appClientSecret',
			},
		},
	],
];

const DevopsForm = (props) => {
	return <FormFieldSet fieldset={DevopsFormFieldSet} formData={props.formData} helpDoc={DocRefs.integrations.devops} dispatch={props.dispatch} />;
};

const mapState = (state) => ({
	formData: {
		values: {
			devopsAppClientId: state.config.integrations?.devops?.cloud?.appClientId,
			devopsAppClientSecret: state.config.integrations?.devops?.cloud?.appClientSecret,
		},
		revertValues: {
			devopsAppClientId: state.config.integrations?.devops?.cloud?.appClientId,
			devopsAppClientSecret: state.config.integrations?.devops?.cloud?.appClientSecret,
		},
	},
});
const mapDispatch = (dispatch) => ({ dispatch });

export default connect(mapState, mapDispatch)(DevopsForm);
