const Config = require('./config');
const OutboundEmailServer = require('./outboundEmailServer');

var OutboundEmailService;

exports.handler = async function(event) {
	try {
		OutboundEmailService = OutboundEmailService || new OutboundEmailServer(Config);
		OutboundEmailService.start((error) => {
			if (error) {
				console.error('server failed to start: ' + error); // eslint-disable-line no-console
				process.exit();	
			}
			OutboundEmailService.lambda(event);
		});
	}
	catch (error) {
		console.warn('Error processing lambda event:', error);
		throw error;
	}
}
 
