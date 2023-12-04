module.exports = {
    NR_AZURE_SIGNUP_POLICY: 'azureb2c',
    NR_AZURE_PASSWORD_POLICY: 'azureb2c-csropc',
    NR_AZURE_LOGIN_POLICY: 'azureb2c-cs', // change to 'azureb2c' if we go back to using the "New Relic" policy
    FEDERATION_ON_LOGIN: false // change to login with "federation" on New Relic auth
}