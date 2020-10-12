'use strict';

import React from 'react';
import { connect } from 'react-redux';

import ConfigActions from '../../../../store/actions/config';
import { DocRefs } from '../../../../config';
import FormFieldSet from '../../../lib/FormFieldSet';
import { validateInput } from '../../../../lib/validation';

const OktaFormFieldSet = [
	[
		{
			id: 'oktaAppClientId',
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
				property: 'integrations.okta.localInstallation.appClientId',
			},
		},
		{
			id: 'oktaAppClientSecret',
			label: 'Secret',
			width: 'col-10',
			type: 'text',
			validation: {
				minLength: 8,
				maxLength: 200,
				onBlur: validateInput,
			},
			updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
			updateActionPayload: {
				property: 'integrations.okta.localInstallation.appClientSecret',
			},
		},
	],
];

const OktaForm = (props) => {
	return <FormFieldSet fieldset={OktaFormFieldSet} formData={props.formData} helpDoc={DocRefs.integrations.okta} dispatch={props.dispatch} />;
};

const mapState = (state) => ({
	formData: {
		values: {
			oktaAppClientId: state.config.integrations?.okta?.localInstallation?.appClientId,
			oktaAppClientSecret: state.config.integrations?.okta?.localInstallation?.appClientSecret,
		},
		revertValues: {
			oktaAppClientId: state.config.integrations?.okta?.localInstallation?.appClientId,
			oktaAppClientSecret: state.config.integrations?.okta?.localInstallation?.appClientSecret,
		},
	},
});
const mapDispatch = (dispatch) => ({ dispatch });

export default connect(mapState, mapDispatch)(OktaForm);
