# Integrations

### Scenario: Slack Authentication

1. clientIDE: Generates a signup token (unique code), constructs a request to
   the API for slack auth and opens a browser to execute that request.

2. clientBrowser: makes API request using URL constructed by clientIDE

3. API: Constructs a **state** parameter (which includes environment, validation
   data & more) and returns a redirect (which includes this state param) back to
   the browser for Slack's authentication page. This request uses the
   appStrictClientId & appStrictClientSecret credentials (the app listed in the
   Slack App Directory).

4. ClientBrowser: Redirects to slack authentication page so user can press
   **Allow**.

5. ClientBrowser: Auth form submitted to Slack which sends a redirect to the API
   server, back to the browser. This redirect is the **Rediredct URL** which
   must be listed in the Slack App's OAuth Redirect Links section. Slack
   adds an **Auth Code** as part of this redirect.

6. ClientBrowser: Redirects back to API or to an auth router - our proxy in
   this case - if **authOrigin** specifies a different host.

7. (optional): If **authOrigin** is an auth router, it parses the URL for the
   environment (which was added when the state query parameter was constructed
   in step 3) and generates a redirect to the correct API server with the same
   payload.

8. API server accepts request with **Auth Code**, validates the state param for
   authenticity and timeliness and then makes a request directly to Slack in
   order to get a **slack access token** the client can use. This token is
   written to mongodb and the API considers the client logged in.

9. Finally, the API sends a redirect back to the clientBrowser to a page that
   says **All Set**.

10. All the while, the clientIDE has been polling the API waiting for auth
    approval and the **slack access token**. Once step 8 complets, the request
    returns the **slack access token** and the process is complete.



