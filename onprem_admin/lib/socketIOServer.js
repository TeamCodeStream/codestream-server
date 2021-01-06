'use strict';

// the socketIO server

import GlobalData from '../config/globalData';

function startSocketServer(io) {
	let statusHeartBeat;

	GlobalData.Logger.log('SocketIO Server is subscribing to connection events');

	io.on('connection', (socket) => {
		GlobalData.Logger.info('New socket IO client connected');

		// Each connection emits 'systemStatus' messages every X seconds as a heartbeat
		if (statusHeartBeat) {
			clearInterval(statusHeartBeat);
		}
		statusHeartBeat = setInterval(function () {
			GlobalData.Logger.debug(`emitting systemStatus ${GlobalData.SystemStatusMonitor.systemStatus}`);
			GlobalData.SystemStatusMonitor.broadcastSystemStatus();
		}, 30000);

		// upon disconnect, clear the heartbeat timer
		socket.on('disconnect', () => {
			clearInterval(statusHeartBeat);
			GlobalData.Logger.info('Socket IO client disconnected');
		});

		// Broadcast to all clients EXCEPT 'socket'
		// socket.broadcast.emit('xxx', data);
	});

	// Broadcast to all clients
	// io.emit('xxx', data);
}

export default startSocketServer;
