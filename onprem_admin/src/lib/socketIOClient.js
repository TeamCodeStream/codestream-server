'use strict';

import socketIOClient from 'socket.io-client';
import Actions from '../store/actions';

function setupSocketClientHandler(Store) {
	// each client creates a socketIO connection to the admin server and receives
	// regular updates of the system status as a heart beat
	const socket = socketIOClient(window.location.origin);

	socket.on('systemStatus', (data) => {
		console.debug('got a systemStatus event', data);
		Store.dispatch({ type: Actions.STATUS_REFRESH_SYSTEM_STATUS, payload: data });
	});

	socket.on('statusMessage', (data) => {
		console.debug('got a statusMessage event', data);
		Store.dispatch({ type: Actions.STATUS_PROCESS_MESSAGE_EVENT, payload: data });
	});

	return socket;
}

export default setupSocketClientHandler;
