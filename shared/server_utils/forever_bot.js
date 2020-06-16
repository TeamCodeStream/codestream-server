// run this process forever, executing a function at a specified interval

'use strict';

var EventEmitter = require('events');

class ForeverBot extends EventEmitter () {

	runForever (func, options) {
		this.runForeverFunc = func;
		this.runForeverOptions = options;
		const now = Date.now();
		if (!options.startAt || options.startAt < now) {
			process.nextTick(this.foreverRunNow);
		}
		else {
			this.lastRun = options.startAt - options.interval;
			this.scheduleNextRun();
		}
	}

	foreverRunNow () {
		this.emit('foreverRunning');
		this.lastRun = Date.now();
		this.runForeverFunc(() => {
			this.emit('foreverRan');
			this.scheduleNextRun();
		});
	}

	scheduleNextRun () {
		const now = Date.now();
		let startWhen = this.lastRun + (this.runForeverOptions.interval || 1);
		let wait = startWhen - now;
		this.emit('foreverScheduled', { at: startWhen, wait: wait });
		setTimeout(this.foreverRunNow, wait);
	}
}

module.exports = ForeverBot;
