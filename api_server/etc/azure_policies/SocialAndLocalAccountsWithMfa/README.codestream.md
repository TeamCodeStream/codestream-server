# Custom policies for testing New Relic / Azure as identity provider for CodeStream

Herein find the XML files that were initially sourced from https://github.com/Azure-Samples/active-directory-b2c-custom-policy-starterpack
in support of the project to achieve unified identity between CodeStream and New Relic

The policies contained herein are experimental only and are being uploaded for posterity (perhaps to be removed in the future).
Ultimately, New Relic is to be the owner and maintainer of these policy files.

There are two directories here: cstrykernr and newrelicstaging. The first contains host names and client IDs for third-party IdPs appropriate
to the experimental tenant Colin set up for testing: cstrykernr. The second is for use in the "official" New Relic staging tenant.
