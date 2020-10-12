'use strict';

import React from 'react';
import { connect } from 'react-redux';
import { DocRefs } from '../../../../config';
import FormFieldSet from '../../../lib/FormFieldSet';
import { validateInput } from '../../../../lib/validation';
import ConfigActions from '../../../../store/actions/config';

// host, password, port, secure, service, username
const NodeMailerFormFieldSet = [
	[
		{
			id: 'NodeMailerHost',
			label: 'SMTP Host',
			width: 'col-7',
			type: 'text',
			mutedText: 'SMTP server accepting email from CodeStream',
			validation: {
				isHostName: true,
				minLength: 1,
				maxLength: 200,
				onBlur: validateInput,
			},
			dispatchNullForEmpty: true,
			updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
			updateActionPayload: {
				// value: ...   this will come from the form input
				property: 'emailDeliveryService.NodeMailer.host',
				updateEmailSettings: true,
			},
		},
		{
			id: 'NodeMailerPort',
			label: 'Port',
			width: 'col-3',
			type: 'number',
			validation: {
				minValue: 1,
				maxValue: 32767,
				onBlur: validateInput,
			},
			updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
			updateActionPayload: {
				// value: ...   this will come from the form input
				property: 'emailDeliveryService.NodeMailer.port',
				updateEmailSettings: true,
			},
		},
	],
	[
		{
			id: 'NodeMailerUser',
			label: 'User',
			width: 'col-5',
			type: 'text',
			mutedText: 'SMTP user account',
			validation: {
				isHostName: true,
				minLength: 1,
				maxLength: 200,
				onBlur: validateInput,
			},
			dispatchNullForEmpty: true,
			updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
			updateActionPayload: {
				// value: ...   this will come from the form input
				property: 'emailDeliveryService.NodeMailer.username',
				updateEmailSettings: true,
			},
		},
		{
			id: 'NodeMailerPass',
			label: 'Password',
			width: 'col-5',
			type: 'text',
			mutedText: 'SMTP user account password',
			validation: {
				isHostName: true,
				minLength: 1,
				maxLength: 200,
				onBlur: validateInput,
			},
			dispatchNullForEmpty: true,
			updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
			updateActionPayload: {
				// value: ...   this will come from the form input
				property: 'emailDeliveryService.NodeMailer.password',
				updateEmailSettings: true,
			},
		},
	],
	[
		{
			id: 'NodeMailerService',
			label: 'Service',
			width: 'col-10',
			type: 'text',
			validation: {
				minLength: 0,
				maxLength: 200,
				onBlur: validateInput,
			},
			dispatchNullForEmpty: true,
			updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
			updateActionPayload: {
				property: 'emailDeliveryService.NodeMailer.service',
				updateEmailSettings: true,
			},
		},
	],
	[
		{
			id: 'NodeMailerSecure',
			label: 'Enable secure communications',
			width: 'col-10',
			type: 'checkbox',
			onClickAction: ConfigActions.CONFIG_TOGGLE_DOTTED_BOOLEAN,
			onClickActionPayload: {
				property: 'emailDeliveryService.NodeMailer.secure',
				updateEmailSettings: true,
			},
		},
	],
];

const NodeMailerForm = (props) => {
	console.debug('NodeMailerForm(render) props =', props);
	return (
		<FormFieldSet
			fieldset={NodeMailerFormFieldSet}
			formData={props.formData} 
			dispatch={props.dispatch}
			helpDoc={DocRefs.mailout}
		/>
	);
};

const mapState = (state) => ({
	formData: {
		values: {
			NodeMailerHost: state.config.emailDeliveryService?.NodeMailer?.host,
			NodeMailerPort: state.config.emailDeliveryService?.NodeMailer?.port,
			NodeMailerUser: state.config.emailDeliveryService?.NodeMailer?.username,
			NodeMailerPass: state.config.emailDeliveryService?.NodeMailer?.password,
			NodeMailerService: state.config.emailDeliveryService?.NodeMailer?.service,
			NodeMailerSecure: state.config.emailDeliveryService?.NodeMailer?.secure,
		},
		revertValues: {
			NodeMailerHost: state.originalConfig.emailDeliveryService?.NodeMailer?.host,
			NodeMailerPort: state.originalConfig.emailDeliveryService?.NodeMailer?.port,
			NodeMailerUser: state.originalConfig.emailDeliveryService?.NodeMailer?.username,
			NodeMailerPass: state.originalConfig.emailDeliveryService?.NodeMailer?.password,
			NodeMailerService: state.originalConfig.emailDeliveryService?.NodeMailer?.service,
			NodeMailerSecure: state.originalConfig.emailDeliveryService?.NodeMailer?.secure,
		},
	},
});

const mapDispatch = (dispatch) => ({ dispatch });

export default connect(mapState, mapDispatch)(NodeMailerForm);
