import React, { Component } from 'react';
import { connect } from 'react-redux';
import { SystemStatuses } from '../../store/actions/status';
import { saveConfiguration } from '../../store/actions/presentation';

class Omnibar extends Component {
	displaySystemStatusElement() {
		// console.debug('Omnibar: displaySystemStatus()');
		switch (this.props.systemStatus) {
			case SystemStatuses.ok:
				return <span className="badge badge-success">OK</span>;
			case SystemStatuses.attention:
				return <span className="badge badge-danger">ATTENTION</span>;
			default:	// case SystemStatuses.pending:
				return (
					<span className="spinner-border spinner-border-sm text-warning mt-1" role="status">
						<span className="sr-only">Pending...</span>
					</span>
				);
		}
	}

	render() {
		return (
			<section className="Omnibar layout-omnibar container-fluid bg-dark py-2">
				<div className="row justify-content-around">
					<span className="mt-1">
						<span>On-Prem Version: </span>
						<strong>{this.props.onPremVersion}</strong>
					</span>
					<span className="mt-1">
						<span>Schema: </span>
						<strong>{this.props.schemaVersion}</strong>
					</span>
					<span className="mt-1">
						Editing Revision: {this.props.revision ? <strong>{this.props.revision}</strong> : <span className="badge badge-warning mt-1">?</span>}
					</span>
					<span className="mt-1">
						<span>System Status: </span>
						{this.displaySystemStatusElement()}
					</span>
					{this.props.unsavedChanges && <span className="btn btn-info btn-sm" onClick={() => this.props.saveConfiguration()}>Save Changes</span>}
				</div>
			</section>
		);
	}
}

const mapState = state => ({
	onPremVersion: state.installation.onPremVersion,
	systemStatus: state.status.systemStatus,
	schemaVersion: state.status.codeSchemaVersion,
	revision: state.status.baselineRevision,
	unsavedChanges: state.status.unsavedChanges,
});

const mapDispatch = dispatch => ({
	saveConfiguration: () => dispatch(saveConfiguration()),
});

export default connect(mapState, mapDispatch)(Omnibar);
