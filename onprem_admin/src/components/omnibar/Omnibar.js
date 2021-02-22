import React, { Component } from 'react';
import { connect } from 'react-redux';
import { SystemStatuses } from '../../store/actions/status';
import { saveConfiguration } from '../../store/actions/presentation';
import Modal from 'react-bootstrap/Modal';

class Omnibar extends Component {
	// the save-changes modal (SaveModal) uses local state to show/hide and manage its form
	modalDescRef = React.createRef();
	state = {
		showModal: false,
		modalErrorMsg: null,
	};

	displaySystemStatusElement() {
		// console.debug('Omnibar: displaySystemStatus()');
		switch (this.props.systemStatus) {
			case SystemStatuses.ok:
				return <span className="badge badge-success">OK</span>;
			case SystemStatuses.attention:
				return <span className="badge badge-danger">ATTENTION</span>;
			default:
				// case SystemStatuses.pending:
				return (
					<span className="spinner-border spinner-border-sm text-warning mt-1" role="status">
						<span className="sr-only">Pending...</span>
					</span>
				);
		}
	}

	validateModalDesc = () => {
		console.debug('Omnibar.validateModalDesc(): ', this.modalDescRef.current?.value);
		if (!this.modalDescRef.current?.value.length) {
			this.setState({ modalErrorMsg: 'Description required (5 to 60 chars)' });
			return false;
		}
		if (this.modalDescRef.current.value.length < 5 || this.modalDescRef.current.value.length > 60) {
			this.setState({ modalErrorMsg: 'Description must be between 5 and 60 chars' });
			return false;
		}
		this.setState({ modalErrorMsg: null });
		return true;
	};

	SaveModal = () => {
		console.log('Omnibar.saveModal()');
		return (
			<Modal className="saveConfigModal" show={this.state.showModal} onHide={this.closeModal}>
				<Modal.Header>
					<h4>Save Configuration</h4>
					<button type="button" className="close" onClick={this.closeModal}>
						<span aria-hidden="true">&times;</span>
					</button>
				</Modal.Header>
				<Modal.Body>
					<form>
						<div className="form-group">
							<label htmlFor="configDescription">Enter a brief description to accompany these changes:</label>
							<input
								type="text"
								ref={this.modalDescRef}
								// defaultValue={this.modalDescRef.current?.value}
								className="form-control"
								id="configDescription"
								aria-describedby="configDescriptionHelp"
							/>
							<small id="configDescriptionHelp" className="form-text text-danger">
								{this.state.modalErrorMsg}
							</small>
						</div>
					</form>
					<p>
						Both <strong>Save</strong> and <strong>Save &amp; Activate</strong> will save your changes as a new revision.{' '}
						<em>Activating the configuration requires a restart before taking effect.</em>
					</p>
				</Modal.Body>
				<Modal.Footer>
					<button type="button" className="btn btn-sm btn-secondary" onClick={this.closeModal}>
						Cancel
					</button>
					<button type="button" className="btn btn-sm btn-info" onClick={this.saveConfigPressed}>
						Save
					</button>
					<button type="button" className="btn btn-sm btn-info" onClick={this.saveConfigAndActivatePressed}>
						Save &amp; Activate
					</button>
				</Modal.Footer>
			</Modal>
		);
	};

	closeModal = () => this.setState({ showModal: false });

	saveNewConfig = (activate) => {
		console.debug(`Omnibar.saveNewConfig(activate=${activate})`);
		if (this.validateModalDesc()) {
			this.props.dispatch(saveConfiguration(activate, this.modalDescRef.current.value));
			this.closeModal();
		}
	};

	saveConfigAndActivatePressed = () => this.saveNewConfig(true);

	saveConfigPressed = () => this.saveNewConfig(false);

	saveChangesPressed = () => this.setState({ showModal: true });

	render() {
		return (
			<section className="Omnibar layout-omnibar container-fluid bg-dark py-2">
				<div className="row justify-content-around">
					<this.SaveModal />
					<span className="mt-1">
						<span>On-Prem Version: </span>
						<strong>{this.props.onPremVersion}</strong>
					</span>
					<span className="mt-1">
						{typeof this.props.runningRevision === 'number' ? (
							<span>
								Running Config:
								<strong>
									{this.props.codeSchemaVersion}.{this.props.runningRevision}
								</strong>
							</span>
						) : (
							<span>
								Schema: <strong>{this.props.codeSchemaVersion}</strong>
								<span className="badge badge-light mt-1 ml-1">FILE</span>
							</span>
						)}
					</span>
					<span className="mt-1">
						Editing Revision:{' '}
						{typeof this.props.revisionLastLoaded === 'number' ? (
							<strong>{this.props.revisionLastLoaded}</strong>
						) : (
							<span className="badge badge-warning mt-1">?</span>
						)}
					</span>
					<span className="mt-1">
						<span>System Status: </span>
						{this.displaySystemStatusElement()}
					</span>
					{this.props.unsavedChanges && (
						<span className="btn btn-info btn-sm" onClick={this.saveChangesPressed}>
							Save Changes
						</span>
					)}
				</div>
			</section>
		);
	}
}

const mapState = (state) => ({
	onPremVersion: state.installation.onPremVersion,
	systemStatus: state.status.systemStatus.status,
	codeSchemaVersion: state.status.codeSchemaVersion,
	runningRevision: state.status.runningRevision,
	revisionLastLoaded: state.status.revisionLastLoaded,
	unsavedChanges: state.status.unsavedChanges,
});

const mapDispatch = dispatch => ({
	dispatch,
});

export default connect(mapState, mapDispatch)(Omnibar);
