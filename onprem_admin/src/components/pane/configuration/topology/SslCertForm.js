'use strict';

import React from 'react';
// import PropTypes, { number } from 'prop-types';
import { connect } from 'react-redux';
import ConfigActions from '../../../../store/actions/config';
import PresentationActions from '../../../../store/actions/presentation';

const certificateFormIsValid = (formData) => {
	console.debug('certificateFormIsValid(): formData = ', formData);
	const errors = {};
	if (!formData.targetName?.length) errors.targetName = "target host cannot be empty";
	if (!formData.cert?.length) errors.cert = "certificate cannot be empty";
	if (!formData.key?.length) errors.key = "key cannot be empty";
	if (Object.keys(errors).length) return errors;
	return;
}

// props.id is the card we're editing!
class SslCertForm extends React.Component {
	constructor(props) {
		// FIXME: deprecated - https://reactjs.org/docs/context.html
		super(props);
		this.state = {
			id: this.props.id,	// the certificate Id in the config
			data: this.props.data,	// form input values
			errors: {},	// each form input can exist here with validation error text
		};
		this.isNewCertificate = this.props.id === 'newCert';
		this.updateState = this.updateState.bind(this);
	}

	updateState(stateUpdates) {
		this.setState(stateUpdates);
	}

	onChangeHandler(e, propName) {
		this.updateState({
			data: Object.assign({}, this.state.data, { [propName]: e.target.value }),
		});
	}

	genNewCertId() {
		let newId = this.state.data.targetName;
		newId.replace(/[^0-9a-zA-Z]/g, '');
		return newId;
	}

	addCertificateBtnHandler() {
		console.debug('addCertificateBtnHandler pressed. state', this.state);
		const errors = certificateFormIsValid(this.state.data);
		console.debug('errors = ', errors);
		if (errors) {
			this.updateState({ errors });
			return;
		}
		// if we're adding a new certificate, the temporary certificate ID of
		// 'newCert' will be changed to match a variant of the target hostname.
		// This is calculated here.  Local state must be updated as well.
		// let newId = this.state.id;
		// let newCert = false;
		// if (newId === 'newCert') {
		// 	newCert = true;
		// 	newId = this.state.data.targetName;
		// 	newId.replace(/[^0-9a-zA-Z]/g, '');
		// 	console.debug(`addCertificateBtnHandler  newId=${newId}`);
		// }
		const saveId = this.isNewCertificate ? this.genNewCertId() : this.state.id;
		console.debug(`addCertificateBtnHandler  Id=${saveId}`);
		this.updateState({ id: saveId, errors: {} });
		this.props.dispatch({ type: ConfigActions.CONFIG_SSLCERT_UPDATE_CERT, payload: { ...this.state.data, id: saveId } });
		if (this.isNewCertificate) {
			this.props.dispatch({ type: PresentationActions.PRESENTATION_CONFIG_TOPOLOGY_NO_NEW_CERT });
			this.isNewCertificate = false;
		}
	}

	deleteCertificateBtnHandler() {
		this.props.dispatch({
			type: ConfigActions.CONFIG_SSLCERT_DELETE_CERT,
			payload: this.state.id,
		});
	}

	render() {
		// console.debug('SslCertForm(render)  local state = ', this.state);
		const { id } = this.state;
		const inputTextColor = (propName) => (this.state.errors[propName] ? 'text-danger' : '');
		// const isNewCertificate = id === 'newCert';
		const buttonText = this.isNewCertificate ? 'Add Certificate' : 'Update Certificate';
		return (
			<form className="container">
				{/* <div className="form-group row">
					<label htmlFor={`${id}ExpirationDate`} className="col-sm-2 col-form-label">
						Expires
					</label>
					<div className="col-sm-10">
						<input type="text" className="form-control" id={`${id}ExpirationDate`} disabled defaultValue={expirationDate} />
					</div>
				</div> */}
				<div className="form-group row">
					<label htmlFor={`${id}TargetHostInput`} className="col-sm-2 col-form-label">
						Target Host
					</label>
					<div className="col-sm-10">
						<input
							type="text"
							className={`form-control ${inputTextColor('targetName')}`}
							id={`${id}TargetHostInput`}
							placeholder="certificate's target hostname"
							defaultValue={this.state.data.targetName}
							onChange={(e) => this.onChangeHandler(e, 'targetName')}
						/>
						{this.state.errors.targetName && <small>{this.state.errors.targetName}</small>}
					</div>
				</div>
				<div className="form-group row">
					<label htmlFor={`${id}CertInput`} className="col-sm-2 col-form-label">
						Certificate
					</label>
					<div className="col-sm-10">
						<textarea
							className={`form-control ${inputTextColor('cert')}`}
							id={`${id}CertInput`}
							rows="3"
							defaultValue={this.state.data.cert}
							onChange={(e) => this.onChangeHandler(e, 'cert')}
						></textarea>
						{this.state.errors.cert && <small>{this.state.errors.cert}</small>}
					</div>
				</div>
				<div className="form-group row">
					<label htmlFor={`${id}KeyInput`} className="col-sm-2 col-form-label">
						Key
					</label>
					<div className="col-sm-10">
						<textarea
							className={`form-control ${inputTextColor('key')}`}
							id={`${id}KeyInput`}
							rows="3"
							defaultValue={this.state.data.key}
							onChange={(e) => this.onChangeHandler(e, 'key')}
						></textarea>
						{this.state.errors.key && <small>{this.state.errors.key}</small>}
					</div>
				</div>
				<div className="form-group row">
					<label htmlFor={`${id}CAInput`} className="col-sm-2 col-form-label">
						CA Trust Chain (Bundle)
					</label>
					<div className="col-sm-10">
						<textarea
							className={`form-control ${inputTextColor('caChain')}`}
							id={`${id}CAInput`}
							rows="3"
							defaultValue={this.state.data.caChain}
							onChange={(e) => this.onChangeHandler(e, 'caChain')}
						></textarea>
						{this.state.errors.caChain && <small>{this.state.errors.caChain}</small>}
					</div>
				</div>
				{/* <fieldset className="form-group">
					<div className="row">
						<legend className="col-form-label col-sm-2 pt-0">Radios</legend>
						<div className="col-sm-10">
							<div className="form-check">
								<input className="form-check-input" type="radio" name="gridRadios" id="gridRadios1" value="option1" checked />
								<label className="form-check-label" htmlFor="gridRadios1">
									First radio
								</label>
							</div>
							<div className="form-check">
								<input className="form-check-input" type="radio" name="gridRadios" id="gridRadios2" value="option2" />
								<label className="form-check-label" htmlFor="gridRadios2">
									Second radio
								</label>
							</div>
							<div className="form-check disabled">
								<input className="form-check-input" type="radio" name="gridRadios" id="gridRadios3" value="option3" disabled />
								<label className="form-check-label" htmlFor="gridRadios3">
									Third disabled radio
								</label>
							</div>
						</div>
					</div>
				</fieldset> */}
				{/* <div className="form-group row">
					<div className="col-sm-2">Checkbox</div>
					<div className="col-sm-10">
						<div className="form-check">
							<input className="form-check-input" type="checkbox" id="gridCheck1" />
							<label className="form-check-label" htmlFor="gridCheck1">
								Example checkbox
							</label>
						</div>
					</div>
				</div> */}
				<div className="form-group row">
					<div className="col-sm-10">
						<input type="button" className="btn btn-info" onClick={() => this.addCertificateBtnHandler()} value={buttonText} />
						{!this.isNewCertificate && (
							<input type="button" className="btn btn-info ml-3" onClick={() => this.deleteCertificateBtnHandler()} value="Delete Certificate" />
						)}
					</div>
				</div>
			</form>
		);
	}
}

// ownProps are the properties that were passed to the react component
const mapState = (state, ownProps) => {
	return {
		data:
			ownProps.id !== 'newCert'
				? {
						targetName: state.config.sslCertificates[ownProps.id].targetName,
						caChain: state.config.sslCertificates[ownProps.id].caChain,
						cert: state.config.sslCertificates[ownProps.id].cert,
						key: state.config.sslCertificates[ownProps.id].key,
				  }
				: {
						targetName: state.presentation.configuration.topology.newCert.targetName,
						caChain: state.presentation.configuration.topology.newCert.caChain,
						cert: state.presentation.configuration.topology.newCert.cert,
						key: state.presentation.configuration.topology.newCert.key,
				  },
	};
};
const mapDispatch = (dispatch) => ({
	dispatch,
});
export default connect(mapState, mapDispatch)(SslCertForm);
