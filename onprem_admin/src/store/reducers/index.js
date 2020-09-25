'use strict';

import { combineReducers } from 'redux';

// config reducers
// import apiServer from './config/apiServer';
// import broadcastEngine from './config/broadcastEngine';
// import email from './config/email';
// import emailDeliveryService from './config/emailDeliveryService';
// import inboundEmailServer from './config/inboundEmailServer';
// import integrations from './config/integrations';
// import outboundEmailServer from './config/outboundEmailServer';
// import queuingEngine from './config/queuingEngine';
// import sharedGeneral from './config/sharedGeneral';
// import sharedSecrets from './config/sharedSecrets';
// import ssl from './config/ssl';
// import storage from './config/storage';
// import telemetry from './config/telemetry';

import config from './config';
import originalConfig from './originalConfig';
import installation from './installation';
import presentation from './presentation';
import status from './status';

export default combineReducers({
	// config: combineReducers({	// 'config' maps to the native schema
	// 	apiServer,
	// 	broadcastEngine,
	// 	email,
	// 	emailDeliveryService,
	// 	inboundEmailServer,
	// 	integrations,
	// 	outboundEmailServer,
	// 	queuingEngine,
	// 	sharedGeneral,
	// 	sharedSecrets,
	// 	ssl,
	// 	storage,
	// 	telemetry,
	// }),
	config,
	installation,
	presentation,
	originalConfig,
	status,
});
