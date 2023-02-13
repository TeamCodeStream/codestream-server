# Using CodeStream API behind Service Gateway

Historically, the CodeStream API server accepted a bearer token in the Authorization
header to authenticate all requests. The bearer token was a JSON Web Token (JWT) that
encapsulated the CodeStream user ID in the payload.

We are moving toward (and by the time you read this, may have fully moved to) a model
whereby CodeStream relinquishes all responsibility for authentication to New Relic's
login service. Under these circumstances, the bearer token that was used for the legacy
API will be ignored, at least in production. 

Instead, CodeStream is assumed to be operating on a secure, private network behind
New Relic's request proxying service, entitled Service Gateway (SG). Identity information
is passed in the form of request headers that Service Gateway adds to every request.
For our purposes, we are interested in the 'service-gateway-user-id' header, which
gives the New Relic user ID of the user sending the request.

# Fake Service Gateway

To avoid setting up a SG configuration for developer instances, or to develop on a 
laptop, developers can run a "fake" Service Gateway on their instance (or laptop).
Fake Service Gateway (FSG) is an Elixir application that simulates the salient aspects
of Service Gateway, basically acting like a local reverse proxy. FSG is easy to set up
and use.

Note that FSG still connects to New Relic's login service to authenticate the user's
token (or api key, or cookie), so it is a not a standalone solution. Developers must
still be connected to CHI VPN.

Instructions for setting up FSG are here:
[Fake Service Gateway]https://source.datanerd.us/unified-api/fake-service-gateway

These instructions are pretty clear and need not be duplicated here. There is no need
to run the dockerized version. You will, of course, need to install the certificate
as suggested. 

Once you have setup the proxies.json file for your configuration, start the elixir app
as stated in the instructions, then you simply need to point CodeStream's serverUrl 
to https://localhost.newrelic.com:${source_port}.

# The Service Gateway Configurator

To set up a CodeStream API server behind the real Service Gateway, you must use the 
Service Gateway Configurator. The one for staging and for production are below:

https://staging-service-gateway-configurator.nr-ops.net/
https://service-gateway-configurator.nr-ops.net/

The first decision you will need to make is whether the service should be publicly 
accessible or only accessible on the "Datacenter" (through CHI VPN). CodeStream's 
production and staging servers should be public, but in most other cases the service 
should NOT be exposed and should only be available on the Datacenter.

In the staging configurator, if you go to the Datacenter tab and scroll down to
"codestream", you'll see development instances already registered (eg. 
codestream-pd.staging-service.nr-ops.net, which connects to PD). Generally the
settings you see here can be simply duplicated.

To connect Service Gateway to a CodeStream API server instance, hit the 
"New Service Config" button. 

- You'll need to set the "Deploy to cell?" option to "Yes". Service Gateway seems
unable to connect to the service on our network otherwise.

- Unless you have a compelling reason to expose your service, set Visibility to
"Datacenter".

- Leave "Configuration method" as Manual.

- The frontend host (for staging) should follow this pattern: 

codestream-<host>.staging-service.nr-ops.net

where "host" is some name meaningful to the CodeStream team. For instance,
"pd" or "pd2" (the "EU" simulating version of PD) or "staging". For developers
connecting to their local instances, use "dev-<name>", where "name" is the
name of your developer instance on the cdstrm.dev network. For instance, Colin's
frontend host is "codestream-colin-dev.staging-service.nr-ops.net".

- For publicly accessible services, replace "nr-ops.net" with "newrelic.com". 
This is required by Service Gateway for proper routing.

- The backend host should be "https" and should be the hostname of your service
on the cdstrm.dev network. For instance, "pd-api.cdstrm.dev". Similarly, Colin's
dev instance is "colin.cdstrm.dev". 

- IMPORTANT NOTE: Service Gateway will ONLY connect to port 443. Therefore, for
developer instances where our API server typically listens on another port
(eg. 12079), you will need to set up your instance with port forwarding to
forward from 443 to the port your API server is actually listening on. This is
because port 443 is "privileged" and it is non-trivial to actually conigure
the CodeSteam API server on a developer instance to listen on 443. The command
to set up the port forwarding is (substitute for 12079 if needed):

ots-sys portdir --redirect  --inbound-port 443 --forwarded-to 12079 --yes

To test that this is working properly, do (for example, change host as needed):

curl -k https://colin.cdstrm.dev/no-auth/status; echo

which should return "OK".

- Back to the Service Gateway Configurator, ignore "Routing condition" for now
(but we'll need to tackle this when we fully move to unified identity, and 
we'll have certain routes that are "no auth" and others that require authentication
through login service). 

- Ignore "Additional external host names".

- Enter a slack channel that works for you (you'll have to create it first). For
instance, Colin has "cs-colindev-service-config", and for nominal staging services
we use "cs-staging-service-config".

- Select "CS: CodeStream" as the owning team (assuming this is correct).

- Under "Advanced options", set "Login enforcement", "Account access enforcement",
and "Region enforcement" to "No". This will change when we move to relying on
the login service for authentication.

- Hit Submit and the Service Gateway connection should be created. If your created
it for "Datacenter" visibility, it will be listed under the "Datacenter" tab.
Otherwise it will be listed under the "Public" tab (and again, you should have a
good reason for exposing it publicly).

- IMPORTANT: Find the listing under the appropriate tab, and click on the heading
for the listing. This will take you to a page where you set the "Percentage of 
traffic to send to General Purpose Cells". Set this to 100%. 

- After a few minutes, you should be able to connect to CodeStream through 
Service Gateway. Try it, by setting your CodeStream serverUrl to the external
hostname of your service.