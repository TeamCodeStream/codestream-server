'use strict';

import React from 'react';
// import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Accordion, { getAccordionCardStatuses } from '../../../lib/Accordion';
import FormFieldSet from '../../../lib/FormFieldSet';
import NodeMailerForm from './NodeMailer';
import SendGridForm from './SendGrid';
import ConfigActions from '../../../../store/actions/config';
import { sendGridStatus, nodeMailerStatus } from '../../../../store/actions/presentation';
import { validateInput } from '../../../../lib/validation';

const emailFormFieldSet = [
	[
		{
			// required
			id: 'emailSenderAddress',
			label: 'Sender Email Address',
			placeholder: 'codestream@acme.com',
			type: 'text',
			updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
			updateActionPayload: {
				property: 'email.senderEmail',
				updateEmailSettings: true,
			},
			// optional
			mutedText: 'Sender email address for notifications & invites',
			// type: 'number',	// default = 'text'
			width: 'col-6', // default = defaultColWidth property
			// disabled: true,	// default = false
			validation: {
				minLength: 0,
				maxLength: 200,
				onBlur: validateInput,
			},
		},
		{
			// required
			id: 'emailReplyToDomain',
			label: 'Reply-To Domain',
			placeholder: 'cs-mail.acme.com',
			type: 'text',
			width: 'col-6', // default = defaultColWidth property
			updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
			updateActionPayload: {
				property: 'email.replyToDomain',
				updateEmailSettings: true,
			},
			// optional
			mutedText: 'Replies to notifications are sent to this domain',
			// type: 'number',	// default = 'text'
			// width: 'col-7',	// default = defaultColWidth property
			// disabled: true,	// default = false
			validation: {
				minLength: 0,
				maxLength: 200,
				onBlur: validateInput,
			},
		},
	],
	[
		{
			// required
			id: 'emailSupportEmail',
			label: 'Support Email',
			placeholder: 'help-desk@my-company.com',
			type: 'text',
			// width: 'col-6', // default = defaultColWidth property
			updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
			updateActionPayload: {
				property: 'email.supportEmail',
				updateEmailSettings: true,
			},
			// optional
			mutedText: 'Links and documentation will reference this email address for support.',
			// type: 'number',	// default = 'text'
			// width: 'col-7',	// default = defaultColWidth property
			// disabled: true,	// default = false
			validation: {
				minLength: 0,
				maxLength: 200,
				onBlur: validateInput,
			},
		},
	],
];

const accordionCards = [
	{
		id: 'nodeMailerCard',
		header: 'NodeMailer (SMTP)',
		bodyComponent: <NodeMailerForm />,
		statusSwitch: {
			// resources needed to handle on/off/disabled status switch
			onClickAction: ConfigActions.CONFIG_EMAIL_TOGGLE_DELIVERY_SERVICE,
			onClickActionPayload: {
				property: 'emailDeliveryService.NodeMailer.disabled',
				// updateEmailSettings: true,  // implied
			},
			getStatusFromState: nodeMailerStatus,
		},
	},
	{
		id: 'sendgridCard',
		header: 'SendGrid.com',
		bodyComponent: <SendGridForm />,
		statusSwitch: {
			onClickAction: ConfigActions.CONFIG_EMAIL_TOGGLE_DELIVERY_SERVICE,
			onClickActionPayload: {
				property: 'emailDeliveryService.sendgrid.disabled',
				// updateEmailSettings: true  // implied
			},
			getStatusFromState: sendGridStatus,
		},
	},
];

class Email extends React.Component {
	render() {
		return (
			<article className="Email layout-email container-fluid col-10">
				<div className="row justify-content-center">
					<div className="col-10">
						<FormFieldSet
							legend="General Email Settings"
							fieldset={emailFormFieldSet}
							formData={this.props.formData}
							dispatch={this.props.dispatch}
						/>
					</div>
				</div>
				<div className="row justify-content-center ml-1">
					<div className="col-10">
					<h5>Email Delivery Services</h5>
						<Accordion
							accordionId="emailAccordion"
							message="Enables CodeStream to send invitation and notification emails"
							cards={accordionCards}
							statuses={this.props.statuses}
							dispatch={this.props.dispatch}
						/>
					</div>
				</div>
			</article>
		);
	}
}

const mapState = (state) => ({
	formData: {
		values: {
			emailSenderAddress: state.config.email?.senderEmail,
			emailReplyToDomain: state.config.email?.replyToDomain,
			emailSupportEmail: state.config.email?.supportEmail,
		},
		revertValues: {
			emailSenderAddress: state.originalConfig.email?.senderEmail,
			emailReplyToDomain: state.originalConfig.email?.replyToDomain,
			emailSupportEmail: state.originalConfig.email?.supportEmail,
		},
	},
	statuses: getAccordionCardStatuses(state, accordionCards),
});
const mapDispatch = (dispatch) => ({
	dispatch
});

export default connect(mapState, mapDispatch)(Email);
