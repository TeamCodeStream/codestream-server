'use strict';

import React from 'react';
import { connect } from 'react-redux';
import { DocRefs } from '../../../../config';
import FormFieldSet from '../../../lib/FormFieldSet';
import { validateInput } from '../../../../lib/validation';
import ConfigActions from '../../../../store/actions/config';

const SendGridFormFieldSet = [
	[
		{
			id: 'sendGridApiKey',
			label: 'API Key',
			width: 'col-10',
			type: 'text',
			mutedText: 'The key must work with the sendgrid api version 3',
			validation: {
				minLength: 10,
				maxLength: 100,
				onBlur: validateInput,
			},
			dispatchNullForEmpty: true,
			updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
			updateActionPayload: {
				// value: ...   this will come from the form input
				property: 'emailDeliveryService.sendgrid.apiKey',
				updateEmailSettings: true,
			},
		},
	],
];

const SendGridForm = props => {
	return (
		<FormFieldSet
			fieldset={SendGridFormFieldSet}
			formData={props.formData}
			dispatch={props.dispatch}
			helpDoc={DocRefs.mailout}
		/>
	);
};

const mapState = state => ({
	formData: {
		values: {
			sendGridApiKey: state.config.emailDeliveryService?.sendgrid?.apiKey,
		},
		revertValues: {
			sendGridApiKey: state.originalConfig.emailDeliveryService?.sendgrid?.apiKey,
		}
	}
});

const mapDispatch = dispatch => ({ dispatch });

export default connect(mapState, mapDispatch)(SendGridForm);
