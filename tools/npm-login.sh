#!/bin/sh

npm set $(echo $NPM_REGISTRY_URL | sed 's/^https://'):_authToken=$NPM_AUTH_TOKEN
