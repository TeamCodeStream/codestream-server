const SignupTokens = require(process.env.CS_API_TOP + '/modules/users/signup_tokens');
const UUID = require('uuid/v4');

class SigninFlowUtils {
    constructor (options) {
        Object.assign(this, options);
    }

    async insertToken (teamId, tenantId) {
        const signupTokens = new SignupTokens({ api: this.api });
        signupTokens.initialize();
        // replace the hyphens with nothing as it makes copy/pasting easier
        const tenantToken = UUID().replace(/-/g, '');
        const result = await signupTokens.insert(tenantToken, this.user.id, {
            expiresIn: 600000,
            more: {
                teamId: teamId,
                tenantId: tenantId
            }
        });
        return result;
    }

    finish (finishUrl, additional) {
        let redirect = `${(finishUrl || '/web/finish')}?identify=true&provider=CodeStream`;
        if (additional) {
            redirect += '&'+Object.keys(additional).map((key) => {
                return encodeURIComponent(key) + '=' + encodeURIComponent(additional[key])
            }).join('&')
        }
        this.response.redirect(redirect);
        return true;
    }
}

module.exports = SigninFlowUtils;