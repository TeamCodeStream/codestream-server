'use strict';

import React from 'react';
import PropTypes, { number } from 'prop-types';
import { connect } from 'react-redux';
import FormFieldSet from '../../../lib/FormFieldSet';

const clientFacingServicesFieldSet = {
	legend: 'Client-Facing Services',
	fieldset: [
		// Each index (sub-list) denotes a new row in the form construction
		[
			// Each object represents one field
			{
				// required
				id: 'publicHostName',
				label: 'Public Hostname',
				placeholder: 'my-host.my-company.com',
				// optional
				mutedText: 'The hostname CodeStream clients will connect to.',
				// type: 'number',	// default = 'text'
				// width: 'col-7',	// default = defaultColWidth property
				// disabled: true,	// default = false
			},
		],
		[
			{
				id: 'apiInsecurePort',
				label: 'API Insecure Port',
				placeholder: 80,
				width: 'col-4',
				type: 'number',
			},
			{
				id: 'broadcasterInsecurePort',
				label: 'Broadcaster Insecure Port',
				placeholder: 12080,
				width: 'col-4',
				type: 'number',
			},
			{
				id: 'adminInsecurePort',
				label: 'Admin Insecure Port',
				placeholder: 8080,
				width: 'col-4',
				type: 'number',
			},
		],
		[
			{
				id: 'apiSecurePort',
				label: 'API Secure Port',
				placeholder: 443,
				width: 'col-4',
				type: 'number',
			},
			{
				id: 'broadcasterSecurePort',
				label: 'Broadcaster Secure Port',
				placeholder: 12443,
				width: 'col-4',
				type: 'number',
			},
			{
				id: 'adminSecurePort',
				label: 'Admin Secure Port',
				placeholder: 8443,
				width: 'col-4',
				type: 'number',
			},
		],
	],
};

const serverSideServicesFieldSet = {
	legend: 'Server-Side Services',
	fieldset: [
		[
			{
				id: 'mongoUrl',
				placeholder: 'mongodb://localhost/codestream',
				label: 'MongoDB URL',
			},
		],
		[
			{
				id: 'rabbitMq',
				placeholder: 'localhost',
				label: 'RabbitMQ Hostname',
				disabled: true,
			},
		],
	],
};

const sslCertAccordion = [
	{
		id: 'sslCertAccordion',
		title: 'SSL Certificates',
		desc: 'Secure communications, when configured, will use these certificates',
		cards: [],
	},
];

class Topology extends React.Component {
	// lifecycle methods
	componentDidMount() {
		// dom has been mounted in browser successfully
		// ajax calls, set timers & listeners, etc...
	}

	componentWillUnmount() {
		// component is about to be unmounted
		// cleanup timers & listeners
	}

	render() {
		return (
			<div className="Topology layout-pane-topology">
				<div className="row justify-content-center">
					<p className="col-8">
						Your system's topology describes how your installation sits on your network and how your clients (users running CodeStream in their IDE)
						will connect to it.{' '}
						<em style={{ color: '#EEE8AA' }}>
							Take care when making changes to this section. If not verified before activation, they could inadvertantly leave you unable to
							connect.
						</em>
					</p>
				</div>
				<div className="row justify-content-center">
					<div className="col-8">
						<form className="form">
							<FormFieldSet legend={clientFacingServicesFieldSet.legend} fieldset={clientFacingServicesFieldSet.fieldset} />
							<FormFieldSet legend={serverSideServicesFieldSet.legend} fieldset={serverSideServicesFieldSet.fieldset} />
						</form>
					</div>
				</div>
				<div className="row justify-content-center">
					<div className="col-8">
						
					</div>
				</div>
			</div>
		);
	}
}

const mapState = state => ({
	api: state.config.apiServer,
	broadcaster: state.config.broadcastEngine?.codestreamBroadcaster || {},
	rabbitmq: state.config.queuingEngine?.rabbitmq || {},
	mongo: state.config.storage.mongo,
	ssl: state.config.ssl,
});

// const mapDispatch = dispatch => ({
// });

export default connect(mapState)(Topology);
