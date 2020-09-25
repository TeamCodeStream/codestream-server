import React, { Component } from 'react';

class Updates extends Component {
	render() {
		return (
			<section className="Updates layout-updates container col-6">
				<div className="row justify-content-center">
					<p>
						Updates are currently managed through the control script on your CodeStream On-Prem linux host. Login to the host via <b>ssh</b> and run these two commands:
					</p>
				</div>
				<div className="row justify-content-center">
					<pre className="text-light">
						~/.codestream/codestream --update-myself<br />~/.codestream/codestream --update-containers
					</pre>
				</div>
				<div className="row justify-content-center">
					<p>
						More information can be found in the{' '}<a href="https://docs.codestream.com/onprem/">On-Prem Guide</a>.
					</p>
				</div>
			</section>
		);
	}
}

export default Updates;
