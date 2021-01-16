import React, { Component } from 'react';
// import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import axios from 'axios';

import StatusActions from '../../store/actions/status';
import ConfigActions from '../../store/actions/config';
import OriginalConfigActions from '../../store/actions/originalConfig';

// This input form will use uncontrolled inputs

class Login extends Component {
	// state = {
	// 	config: this.props.config,
	// 	installation: this.props.installation
	// };
	constructor(props) {
		super(props);
		this.email = React.createRef();
		this.pass = React.createRef();
		this.passVerify = React.createRef();
		this.login = this.login.bind(this);
		this.register = this.register.bind(this);
		this.loginId = 'root';
		this.state = {
			errorMessage: null
		};
	}

	validateLoginForm(user, options = {}) {
		let errorMessage = null;
		if (options.verifyEmail && !user.email?.length) {
			errorMessage = 'Email required';
		} else if (!user.password?.length) {
			errorMessage = 'Password required';
		} else if (options.verifyEmail && user.email.indexOf(' ') >= 0) {
			errorMessage = 'E-mail addresses cannot contain spaces';
		} else if (options.verifyPassword && user.passVerify !== user.password) {
			errorMessage = 'Passwords do not match';
		} else {
			errorMessage = null;
		}
		// console.debug(`validateLoginForm: ${errorMessage}`);
		// console.debug(user, options);
		this.setState({ errorMessage });
		return errorMessage ? false : true;
	}

	postLogin(user) {
		axios
			.post('/api/no-auth/login', user)
			.then((resp) => {
				console.debug('login: response data', resp.data);
				if (resp.data.loggedIn) {
					console.debug('login: fetching active config');
					axios
						.get('/api/config/active')
						.then((resp) => {
							this.props.dispatch({ type: ConfigActions.CONFIG_LOAD_NEW_CONFIG, payload: resp.data.configData });
							this.props.dispatch({ type: OriginalConfigActions.ORIGINAL_CFG_LOAD_NEW_CONFIG, payload: resp.data.configData });
							this.props.dispatch({
								type: StatusActions.STATUS_LOGIN,
								payload: {
									activeConfigSerialNumber: resp.data.activeConfigSerialNumber,
									codeSchemaVersion: resp.data.codeSchemaVersion,
									runningRevision: resp.data.runningRevision,
								},
							});
						})
						.catch(console.error);
				} else {
					console.debug('login failed');
				}
			})
			.catch(console.error);
	}

	register(e) {
		e.preventDefault();
		const user = {
			id: this.loginId,
			email: this.email.current?.value,
			password: this.pass.current?.value,
			passVerify: this.passVerify.current?.value,
		};
		console.debug('register:', this.email.current?.value);
		if (!this.validateLoginForm(user, { verifyPassword: true, verifyEmail: true })) {
			console.debug(`verifyPassword failed`);
			return;
		}
		console.log(`in register with ${this.state.errorMessage}`);
		axios
			.post('/api/no-auth/register', user)
			.then((resp) => {
				console.debug('register: response data', resp.data);
				this.postLogin(user);
			})
			.catch(console.error);
	}

	login(e) {
		e.preventDefault();
		const user = {
			id: this.loginId,
			email: this.email.current?.value,
			password: this.pass.current?.value,
		};
		console.debug('login:', user);
		if (!this.validateLoginForm(user)) {
			console.debug(`verifyPassword failed`);
			return;
		}
		this.postLogin(user);
	}

	emailElt() {
		return (
			<div className="form-group">
				<label className="ml-1" htmlFor="emailLoginInput">
					Email address
				</label>
				<input type="email" ref={this.email} className="form-control" id="emailLoginInput" aria-describedby="emailHelp" placeholder="Enter email" />
				<small id="emailHelp" className="form-text text-light">
					Primary email associated for CodeStream support. We'll never share this with anyone else.
				</small>
			</div>
		);
	}

	passVerifyElt() {
		return (
			<div className="form-group">
				<label className="ml-1" htmlFor="passwordLoginVerifyInput">
					Verify Password
				</label>
				<input
					type="password"
					autoComplete="on"
					className="form-control"
					ref={this.passVerify}
					id="passwordLoginVerifyInput"
					placeholder="Verify Password"
				/>
			</div>
		);
	}

	render() {
		const whichForm = this.props.adminAccountExists && !this.props.loggedIn ? 'Login' : 'Register';
		const passwordLabel = whichForm === 'Login' ? 'Administrator Password' : 'Password';
		return (
			<section className="Login layout-login col-12">
				<div className="container justify-content-center col-6">
					<div className="mt-5">
						<form onSubmit={whichForm === 'Login' ? this.login : this.register}>
							{whichForm === 'Register' ? this.emailElt() : <></>}
							<div className="form-group">
								<label className="ml-1" htmlFor="passwordLoginInput">
									{passwordLabel}
								</label>
								<input
									type="password"
									autoComplete="on"
									className="form-control"
									ref={this.pass}
									id="passwordLoginInput"
									placeholder="Password"
								/>
							</div>
							{whichForm === 'Register' ? this.passVerifyElt() : <></>}
							<button type="submit" className="btn btn-dark mt-2" value="login">
								{whichForm}
							</button>
							{this.state.errorMessage ? <p className="mt-2 text-warning">{this.state.errorMessage}</p> : <></>}
						</form>
					</div>
				</div>
			</section>
		);
	}
}

const mapState = (state) => ({
	loggedIn: state.status.loggedIn,
	adminAccountExists: state.status.adminAccountExists,
});
const mapDispatch = (dispatch) => ({ dispatch });

export default connect(mapState, mapDispatch)(Login);
