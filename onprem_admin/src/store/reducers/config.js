'use strict';

import produce from 'immer';
import Actions from '../actions/config';
import dotPropertyInit, { getDottedProperty } from '../../lib/nestedObjectInit';
// import actions from '../actions';

// handle the ssl certificate config setting dependencies across all services
export function sslConfigurationUpdate(config, payload={}) {
	if (config.apiServer.ignoreHttps !== config.broadcastEngine.codestreamBroadcaster.ignoreHttps) {
		console.log('api and broadcaster do not agree on using ssl');
	}
	const sslEnabled = typeof payload.sslEnabled === 'boolean' ? payload.sslEnabled : !config.apiServer.ignoreHttps;
	const protocol = sslEnabled ? 'https://' : 'http://';
	const oldApiUrl = new URL(config.apiServer.publicApiUrl);

	const apiPublicPort = payload.apiPublicPort || oldApiUrl.port;
	const apiHost = payload.apiHost || oldApiUrl.hostname;
	const apiPort = payload.apiPort || config.apiServer.port;
	const apiSecurePort = payload.apiSecurePort || config.apiServer.securePort;

	const broadcasterHost = apiHost;
	const broadcasterPort = payload.broadcasterPort || config.broadcastEngine.codestreamBroadcaster.port;
	const broadcasterSecurePort = payload.broadcasterPort || config.broadcastEngine.codestreamBroadcaster.securePort;

	const adminPort = payload.adminPort || config.adminServer.port;
	const adminSecurePort = payload.adminSecurePort || config.adminServer.securePort;

	let apiPublicPortNum = parseInt(apiPublicPort, 10) || '';
	if (isNaN(apiPublicPortNum)) apiPublicPortNum = sslEnabled ? 443 : 80;
	const apiPortSuffix = apiPublicPortNum === 443 && sslEnabled ? '' : apiPublicPortNum === 80 && !sslEnabled ? '' : `:${apiPublicPortNum}`;
	const publicApiUrl = `${protocol}${apiHost}${apiPortSuffix}`;

	config.apiServer.ignoreHttps = !sslEnabled;
	config.apiServer.publicApiUrl = publicApiUrl;
	config.apiServer.port = apiPort;
	config.apiServer.securePort = apiSecurePort;
	config.broadcastEngine.codestreamBroadcaster.ignoreHttps = !sslEnabled;
	config.broadcastEngine.codestreamBroadcaster.host = broadcasterHost;
	config.broadcastEngine.codestreamBroadcaster.port = broadcasterPort;
	config.broadcastEngine.codestreamBroadcaster.securePort = broadcasterSecurePort;
	config.adminServer.ignoreHttps = !sslEnabled;
	config.adminServer.port = adminPort;
	config.adminServer.securePort = adminSecurePort;
}

// const isDisabled = (flag) => flag || typeof flag === 'undefined' || flag === null;

// handle email config settings & dependencies across all services
function emailConfigurationUpdate(draft, payload) {
	const disableNodeMailer = (cfg) => dotPropertyInit(cfg, 'emailDeliveryService.NodeMailer.disabled', true);
	const disableSendGrid = (cfg) => dotPropertyInit(cfg, 'emailDeliveryService.sendgrid.disabled', true);

	let nodeMailerDisabled = getDottedProperty(draft, 'emailDeliveryService.NodeMailer.disabled') || false;
	let sendGridDisabled = getDottedProperty(draft, 'emailDeliveryService.sendgrid.disabled') || false;
	const whichService = payload.property.startsWith('emailDeliveryService.NodeMailer') ? 'NodeMailer' : 'sendgrid';

	if (payload.senderEmail) draft.email.senderEmail = payload.value;
	if (payload.supportEmail) draft.email.supportEmail = payload.value;
	if (payload.replyToDomain) draft.email.replyToDomain = payload.value;

	if (payload.toggleService && whichService === 'NodeMailer') {
		nodeMailerDisabled = !nodeMailerDisabled;
		dotPropertyInit(draft, 'emailDeliveryService.NodeMailer.disabled', nodeMailerDisabled);
		if (!nodeMailerDisabled) disableSendGrid(draft);
	} else if (payload.toggleService && whichService === 'sendgrid') {
		sendGridDisabled = !sendGridDisabled;
		dotPropertyInit(draft, 'emailDeliveryService.sendgrid.disabled', sendGridDisabled);
		if (!sendGridDisabled) disableNodeMailer(draft);
	}

	// Safety!! Only one email delivery service can be selected
	if (!nodeMailerDisabled && !sendGridDisabled) {
		console.error('Both email delivery services are enabled - this shiould not happen');
		if (whichService === 'NodeMailer') {
			disableSendGrid(draft);
			console.log('disabling sendgrid');
		} else {
			disableNodeMailer(draft);
			console.log('disabling NodeMailer');
		}
	}
	// FIXME: we need to add the 'selected' property to the config schema
	// draft.emailDeliveryService.selected = payload.property;
	draft.email.suppressEmails = nodeMailerDisabled && sendGridDisabled;
	draft.apiServer.confirmationNotRequired = draft.email.suppressEmails;
}


export default (state = null, action) =>
	produce(state, (draft) => {
		console.debug(`reducer(config): ${action.type}`);
		switch (action.type) {
			case Actions.CONFIG_LOAD_NEW_CONFIG:
				// here we replace the entire config slice of the state with a new version
				return action.payload;
			case Actions.CONFIG_SET_DOTTED_PROPERTY:
				dotPropertyInit(draft, action.payload.property, action.payload.value);
				if (action.payload.updateEmailSettings) emailConfigurationUpdate(draft, action.payload);
				console.debug(`CONFIG_SET_DOTTED_PROPERTY  action = `, action);
				// console.debug('***DRAFT=', JSON.stringify(draft.emailDeliveryService, null, 2));
				break;
			case Actions.CONFIG_TOGGLE_DOTTED_BOOLEAN:
				console.log('NOW WE ARE HERE***');
				const propVal = getDottedProperty(draft, action.payload.property) || false;
				dotPropertyInit(draft, action.payload.property, !propVal);
				if (action.payload.updateEmailSettings) emailConfigurationUpdate(draft, action.payload);
				if (action.payload.updateSslConfig) sslConfigurationUpdate(draft);
				console.debug(`CONFIG_TOGGLE_DOTTED_BOOLEAN  action = `, action);
				// console.debug('***DRAFT=', JSON.stringify(draft.emailDeliveryService, null, 2));
				break;
			case Actions.CONFIG_SET_SSL_PROPERTY:
				const propName = action.payload.sslPropName;
				sslConfigurationUpdate(draft, { [propName]: action.payload.value });
				break;

			case Actions.CONFIG_API_SERVER_SET_PHONEHOME_DISABLED:
				draft.apiServer.disablePhoneHome = !(state.apiServer.disablePhoneHome || false);
				break;

			case Actions.CONFIG_EMAIL_TOGGLE_DELIVERY_SERVICE:
				emailConfigurationUpdate(draft, { ...action.payload, toggleService: true });
				console.log(`----- CONFIG_EMAIL_TOGGLE_DELIVERY_SERVICE  action = `, action);
				break;

			// case Actions.CONFIG_TELEMETRY_SET_DISABLED:
			// 	draft.telemetry.disabled = action.payload;
			// 	break;

			// case Actions.CONFIG_SSLCERT_NEW_CERT:
			// 	if (!draft.sslCertificates) draft.sslCertificates = {};
			// 	console.debug('reducer(config): CONFIG_SSLCERT_NEW_CERT');
			// 	draft.sslCertificates.newCert = {};
			// 	break;
			// case Actions.XXX_CONFIG_SSLCERT_UPDATE_CERT: {
			// 	// the strategy here is to replace the entire
			// 	// draft.sslCertificates object with a new one. The 'newCert'
			// 	// property (if it exists) is deleted. We have to create
			// 	// an entirely new object so the state change is
			// 	// properly recognized by React.
			// 	const newCerts = Object.assign({}, draft.sslCertificates);
			// 	console.debug('reducer(config) CONFIG_SSLCERT_UPDATE_CERT  payload:', action.payload);
			// 	const newCertId = action.payload.id;
			// 	if (!newCerts[newCertId]) newCerts[newCertId] = {};
			// 	newCerts[newCertId].targetName = action.payload.targetName;
			// 	newCerts[newCertId].cert = action.payload.cert;
			// 	newCerts[newCertId].key = action.payload.key;
			// 	if (action.payload.caChain) newCerts[newCertId].caChain = action.payload.caChain;
			// 	if ('newCert' in newCerts) delete newCerts.newCert;
			// 	console.debug('NEWCERTS:', newCerts);
			// 	draft.sslCertificates = newCerts;
			// 	break;
			// }
			case Actions.CONFIG_SSLCERT_UPDATE_CERT:
				const newCertData = {
					targetName: action.payload.targetName,
					cert: action.payload.cert,
					key: action.payload.key,
				};
				['expirationDate', 'privateCA', 'selfSigned', 'caChain'].forEach((p) => {
					if (p in action.payload) newCertData[p] = action.payload[p];
				});
				if (!draft.sslCertificates) draft.sslCertificates = {};
				draft.sslCertificates[action.payload.id] = newCertData;
				return;
			case Actions.CONFIG_SSLCERT_DELETE_CERT: {
				// const newCerts = Object.assign({}, draft.sslCertificates);
				// delete newCerts[action.payload];
				// draft.sslCertificates = newCerts;
				delete draft.sslCertificates[action.payload];
				break;
			}

			// case Actions.CONFIG_STORAGE_MONGO_SET_URL:
			// 	draft.storage.mongo.url = action.payload;
			// 	break;
		}
	});
