'use strict';

import React from 'react';
// import PropTypes, { number } from 'prop-types';
import { connect } from 'react-redux';
import FormFieldSet from '../../../lib/FormFieldSet';
import Accordion from '../../../lib/Accordion';
import ConfigActions from '../../../../store/actions/config';
import PresentationActions from '../../../../store/actions/presentation';
import SslCertForm from './SslCertForm';
import { validateInput } from '../../../../lib/validation';

const clientFacingServicesFieldSet = {
	legend: 'Client-Facing Services',
	layout: {
		formRowJustification: 'justify-content-between',
	},
	fieldset: [
		// Each index (sub-list) denotes a new row in the form construction
		[
			// Each object represents one field
			{
				// required
				id: 'publicHostName',
				label: 'Public Hostname',
				placeholder: 'my-codestream-host.my-company.com',
				type: 'text',
				// updateAction: ConfigActions.CONFIG_API_SERVER_SET_PUBLIC_API_URL,
				updateAction: ConfigActions.CONFIG_SET_SSL_PROPERTY,
				updateActionPayload: {
					sslPropName: 'apiHost',
				},
				// optional
				mutedText: 'The hostname CodeStream clients will connect to.',
				// type: 'number',	// default = 'text'
				// width: 'col-7',	// default = defaultColWidth property
				// disabled: true,	// default = false
				validation: {
					isRequired: true,
					isHostName: true,
					minLength: 1,
					maxLength: 200,
					onBlur: validateInput,
				},
			},
		],
		[
			{
				id: 'sslEnabled',
				label: 'Enable secure communications ussing SSL Certificates',
				width: 'col-10',
				type: 'checkbox',
				onClickAction: ConfigActions.CONFIG_TOGGLE_DOTTED_BOOLEAN,
				onClickActionPayload: {
					property: 'apiServer.ignoreHttps',
					updateSslConfig: true,
				},
			},
		],
		[
			{
				id: 'apiInsecurePort',
				label: 'API Insecure Port',
				placeholder: 80,
				width: 'col-4',
				type: 'number',
				// updateAction: ConfigActions.CONFIG_API_SERVER_SET_PORT,
				updateAction: ConfigActions.CONFIG_SET_SSL_PROPERTY,
				updateActionPayload: {
					sslPropName: 'apiPort',
				},
				validation: {
					isRequired: true,
					minValue: 1,
					maxValue: 32767,
					onBlur: validateInput,
				},
			},
			{
				id: 'broadcasterInsecurePort',
				label: 'Broadcaster Insecure Port',
				placeholder: 12080,
				width: 'col-4',
				type: 'number',
				// updateAction: ConfigActions.CONFIG_BROADCASTER_SET_PORT,
				updateAction: ConfigActions.CONFIG_SET_SSL_PROPERTY,
				updateActionPayload: {
					sslPropName: 'broadcasterPort',
				},
				validation: {
					isRequired: true,
					minValue: 1,
					maxValue: 32767,
					onBlur: validateInput,
				},
			},
			{
				id: 'adminInsecurePort',
				label: 'Admin Insecure Port',
				placeholder: 8080,
				width: 'col-4',
				type: 'number',
				// updateAction: ConfigActions.CONFIG_ADMIN_SET_PORT,
				updateAction: ConfigActions.CONFIG_SET_SSL_PROPERTY,
				updateActionPayload: {
					sslPropName: 'adminPort',
				},
				validation: {
					isRequired: true,
					minValue: 1,
					maxValue: 32767,
					onBlur: validateInput,
				},
			},
		],
		[
			{
				id: 'apiSecurePort',
				label: 'API Secure Port',
				placeholder: 443,
				width: 'col-4',
				type: 'number',
				// updateAction: ConfigActions.CONFIG_API_SERVER_SET_SECURE_PORT,
				updateAction: ConfigActions.CONFIG_SET_SSL_PROPERTY,
				updateActionPayload: {
					sslPropName: 'apiSecurePort',
				},
				validation: {
					isRequired: true,
					minValue: 1,
					maxValue: 32767,
					onBlur: validateInput,
				},
			},
			{
				id: 'broadcasterSecurePort',
				label: 'Broadcaster Secure Port',
				placeholder: 12443,
				width: 'col-4',
				type: 'number',
				// updateAction: ConfigActions.CONFIG_BROADCASTER_SET_SECURE_PORT,
				updateAction: ConfigActions.CONFIG_SET_SSL_PROPERTY,
				updateActionPayload: {
					sslPropName: 'broadcasterSecurePort',
				},
				validation: {
					isRequired: true,
					minValue: 1,
					maxValue: 32767,
					onBlur: validateInput,
				},
			},
			{
				id: 'adminSecurePort',
				label: 'Admin Secure Port',
				placeholder: 8443,
				width: 'col-4',
				type: 'number',
				// updateAction: ConfigActions.CONFIG_ADMIN_SET_SECURE_PORT,
				updateAction: ConfigActions.CONFIG_SET_SSL_PROPERTY,
				updateActionPayload: {
					sslPropName: 'adminSecurePort',
				},
				validation: {
					isRequired: true,
					minValue: 1,
					maxValue: 32767,
					onBlur: validateInput,
				},
			},
		],
	],
};

const serverSideServicesFieldSet = {
	legend: 'Internal-Facing Services',
	fieldset: [
		[
			{
				id: 'mongoUrl',
				placeholder: 'mongodb://mongo-url',
				label: 'MongoDB URL',
				type: 'text',
				// updateAction: ConfigActions.CONFIG_STORAGE_MONGO_SET_URL,
				updateAction: ConfigActions.CONFIG_SET_DOTTED_PROPERTY,
				updateActionPayload: {
					property: 'storage.mongo.url',
				},
				validation: {
					isMongoUrl: true,
					isRequired: true,
					minValue: 1,
					maxValue: 32767,
					onBlur: validateInput,
				},
			},
		],
		[
			{
				id: 'rabbitMq',
				placeholder: 'localhost',
				label: 'RabbitMQ Hostname',
				disabled: true,
				type: 'text',
			},
		],
	],
};

const sslCertAccordion = {
	id: 'sslCertAccordion',
	title: 'SSL Certificates',
	desc: 'Secure communications, when configured, will use these certificates',
	cards: [],
	// newCard: {
	// 	id: 'newSSLCard',
	// 	header: null,
	// 	bodyComponent: <xyz />,
	// 	statusSwitch: {
	// 		onClickAction: null,
	// 		onClickActionPayload: null,
	// 		getStatusFromState: (state) => {
	// 			return standardIntegrationStatus(state, 'xyz');
	// 		},
	// 	},
	// },
};

class Topology extends React.Component {
	render() {
		console.debug('sslCertAccordion:', sslCertAccordion);
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
						<FormFieldSet
							legend={clientFacingServicesFieldSet.legend}
							fieldset={clientFacingServicesFieldSet.fieldset}
							formData={this.props.clientFacingServices.formData}
							dispatch={this.props.dispatch}
							layout={clientFacingServicesFieldSet.layout}
						/>
						<FormFieldSet
							legend={serverSideServicesFieldSet.legend}
							fieldset={serverSideServicesFieldSet.fieldset}
							formData={this.props.internalFacingServices.formData}
							dispatch={this.props.dispatch}
							layout={this.props.internalFacingServices.layout}
						/>
					</div>
				</div>
				<div className="row justify-content-center ml-2">
					<div className="col-8">
						<div key={sslCertAccordion.id}>
							<h5>{sslCertAccordion.title}</h5>
							{/* <p>{sslCertAccordion.desc}</p> */}
							<Accordion
								accordionId={sslCertAccordion.id}
								message={sslCertAccordion.desc}
								cards={this.props.sslCerts.cards}
								// newCard={}
								// statuses={this.props.sslCerts.statuses}
								dispatch={this.props.dispatch}
								onClickPlus={this.props.addNewSSlCertificate}
							/>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

// create a list of of accordion cards for each ssl cert in the config state
function refreshSslCertCardsInAccordion(state) {
	const cardList = [];
	if (state.presentation.configuration.topology.newCert) {
		cardList.push({
			id: 'newCert',
			header: 'New Certificate',
			bodyComponent: <SslCertForm id="newCert" />
		});
	}
	if (state.config?.sslCertificates) {
		Object.keys(state.config.sslCertificates).forEach(certId => {
			console.debug('refreshSslCertCardsInAccordion() certId=', certId);
			cardList.push({
				id: certId,
				// header: certId === 'newCert' ? 'New Certificate' : state.config.sslCertificates[certId].targetName,
				header: state.config.sslCertificates[certId].targetName,
				bodyComponent: <SslCertForm id={certId} />,
			});
		});
	}
	return cardList;
}


const mapState = (state) => {
	const x = {
		sslCerts: {
			cards: refreshSslCertCardsInAccordion(state) || [],
			// statuses: setSslCertStatuses(state),
		},
		clientFacingServices: {
			formData: {
				values: {
					publicHostName: new URL(state.config.apiServer.publicApiUrl).hostname,
					apiInsecurePort: state.config.apiServer.port || 0,
					broadcasterInsecurePort: state.config.broadcastEngine.codestreamBroadcaster?.port || 0,
					adminInsecurePort: state.config.adminServer.port || 0,
					apiSecurePort: state.config.apiServer.securePort || 0,
					broadcasterSecurePort: state.config.broadcastEngine.codestreamBroadcaster?.securePort || 0,
					adminSecurePort: state.config.adminServer.securePort || 0,
					sslEnabled: !state.config.apiServer.ignoreHttps,
				},
				revertValues: {
					publicHostName: new URL(state.originalConfig.apiServer.publicApiUrl).hostname,
					apiInsecurePort: state.originalConfig.apiServer.port || 0,
					broadcasterInsecurePort: state.originalConfig.broadcastEngine.codestreamBroadcaster?.port || 0,
					adminInsecurePort: state.originalConfig.adminServer.port || 0,
					apiSecurePort: state.originalConfig.apiServer.securePort || 0,
					broadcasterSecurePort: state.originalConfig.broadcastEngine.codestreamBroadcaster?.securePort || 0,
					adminSecurePort: state.originalConfig.adminServer.securePort || 0,
				},
			},
		},
		internalFacingServices: {
			formData: {
				values: {
					mongoUrl: state.config.storage.mongo.url,
					rabbitMq: state.config.queuingEngine.rabbitmq?.host,
				},
				revertValues: {
					mongoUrl: state.originalConfig.storage.mongo.url,
					rabbitMq: state.originalConfig.queuingEngine.rabbitmq?.host,
				},
			},
		},
	};
	console.debug('Topology(mapState)', x);
	return x;
};
const mapDispatch = dispatch => ({
	dispatch,
	addNewSSlCertificate: () => dispatch({ type: PresentationActions.PRESENTATION_CONFIG_TOPOLOGY_NEW_CERT }),
});

export default connect(mapState, mapDispatch)(Topology);
