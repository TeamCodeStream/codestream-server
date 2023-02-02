# Using CodeStream API behind Service Gateway

Historically, the CodeStream API server accepted a bearer token in the Authorization
header to authenticate all requests. The bearer token was a JSON Web Token (JWT) that
encapsulated the CodeStream user ID in the payload.

We are moving toward (and by the time you read this, we have fully moved to) a model
whereby CodeStream relinquishes all responsibility for authentication to New Relic's
login service. Under these circumstances, the bearer token that was used for the legacy
API will be ignored. 

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
