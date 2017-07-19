#!/bin/sh

echo "Updating permissions..."
chown -Rf node:node /src /usr/local/lib/node_modules
echo "Executing process..."
exec su-exec node:node /sbin/tini -- "$@"
