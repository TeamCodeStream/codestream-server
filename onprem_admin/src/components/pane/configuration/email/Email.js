'use strict';

import React from 'react';
// import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Accordion from '../../../lib/Accordion';
import NodeMailerForm from './NodeMailer';
import SendGridForm from './SendGrid';

const accordionCards = [
	{
		id: 'smtpNodeMailerEmailCard',
		header: 'NodeMailer (SMTP)',
		bodyComponent: <NodeMailerForm />,
	},
	{
		id: 'sendgridEmailCard',
		header: 'SendGrid.com',
		bodyComponent: <SendGridForm />,
	},
];

class Email extends React.Component {
	render() {
		return (
			<article className="Email layout-email container-fluid col-8">
				<div>
					<h5>Email Delivery Services</h5>
					<p>Enables CodeStream to send invitation and notification emails</p>
					<Accordion accordionId="emailAccordian" cards={accordionCards} statuses={this.props.statuses} />
				</div>
			</article>
		);
	}
}

// Email.propTypes = {
// 	config: PropTypes.object.isRequired,
// 	support: PropTypes.object.isRequired
// };

const mapState = (state) => {
	console.debug('Email/mapState(integrations', state.presentation.configuration.email);
	return {
		// email: state.presentation.configuration.email,
		statuses: {
			// state.presentation.configuration.integrations.statuses
			smtpNodeMailerEmailCard: {
				status: 'success',
				value: 'CONFIGURED',
			},
			sendgridEmailCard: {
				status: 'dark',
				value: 'UNCONFIGURED',
			},
		},
	};
};

const mapDispatch = (dispatch) => ({});

export default connect(mapState, mapDispatch)(Email);
