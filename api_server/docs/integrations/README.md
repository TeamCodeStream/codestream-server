# Integrations

## 3rd Party Services
- [Slack](slack.md)

## OAuth & SSO Handshake

### OAuth Without SSO

1. User presses the **Connect to X** (3rd party) button in the webview.

1. Webview notifies the **LSP agent** which uses the IDE’s internal apis to
   hand-off a CS API request (URL) to a browser. This request initiates the
   handshake (`/web/provider-auth/<provider>`).

1. Browser makes CS API request which returns a 302 redirect link to the 3rd
   party site (referred to as the _**auth-me**_ link for purpose of this
   write-up). The redirect link contains:
    - CodeStream state object
    - 3rd party App ID
    - Callback URL (which we will call the provider-token URL) which also
      includes a state object containing the codestream runTime environment
    - App-specific scopes being requested

1. Browser makes the _**auth-me**_ request to the 3rd party site which ensures
   the request callback is valid & prompts the user to approve access to its
   service.

1. The 3rd party responding to the _**auth-me**_ request sends the callback URL
   (`/no-auth/provider-token` URL) as a 302 redirect to the browser along with:
    - A short-lived authorization code
    - The state object passed in from CodeStream

1. The browser, responding to the callback redirect, makes a
   `/no-auth/provider-token` request of the CS API which then:
    1. Validates the CodeStream state object
    1. Makes a server-to-server request from the CS API to the 3rd party service
       using the short-lived authorization code in order to get an **access token**.
    1. Stores the **access token** in the CodeStream database
    1. Responds with a 302 redirect for the browser to request a **Successful
       Auth** page on the marketing site.
   1. Publishes a broadcast message containing the **access token** on the
      user’s **me-channel** which the client's LSP agent receives. The client is
      now authorized and has the necessary token to place API requests directly
      to the 3rd party service.

### OAuth With SSO

Similar to non-SSO OAuth with a bit more apparatus.

1. User presses Sign-Up with X button in webview

1. CodeStream client generates a sign-up token (a guid)

1. This sign-up token is included in the initial CS API request URL (step 2
   above)

1. This sign-up token is also embedded within the state object within the
   auth-me link (step 3 above)

1. Once the IDE api’s pass the request off to a browser, the lsp agent enters a
   loop, polling the CS API waiting for the server to say that access is granted
   (the /no-auth/check-signup request).

1. The provider-token request (step 6 above) decodes and parses the embedded
   state object, including the sign-up token in the server-to-server call.

1. Once the CS API server completes the provider-token request, the polling
   check-signup request will respond successfully (access allowed) with a data
   package containing the me-object which includes the access token.

### Shared Development Apps

As CodeStream supports any number of development environments, including
ephemeral ones, we have a mechanism to accommodate using one OAuth callback for
multiple environments. In these cases, the state object that’s included in the
callback URL (step 3 above) will contain the name of the CodeStream environment
(sharedGeneral.runTimeEnvironment). Our nginx configuration will parse this
state out of the URL’s query string and redirect it to the correct environment.
This does not work in all cases. Some 3rd party apps are restrictive in their
operation.

In these cases, the apiServer.authOrigin URL will be used to construct the
callback URL in lieu of the apiServer.publicApiUrl value.

### Internal Environments

For environments that are only accessible behind the VPN, some integrations,
notably **Slack** & **MS Teams**, which provide for server-to-server calls
initiated by the 3rd party (such as **Interactive Components** in slack), will
need to go through a proxy.

In these cases a predetermined URL will be configured in the CodeStream
integration connector app on the 3rd party’s system, to send the requests to the
CodeStream proxy which, in turn, will proxy them to the correct environment.

Today this is the same hostname as is used for the Shared Development Apps above
(this should change).
