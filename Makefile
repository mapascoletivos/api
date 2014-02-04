REPORTER = spec
TESTS = test/*.js test/**/*.js test/**/**/*.js

test:
	@NODE_ENV=test NODE_PATH=./app/controllers ./node_modules/.bin/mocha \
    --reporter $(REPORTER) \
    --ui tdd \
    $(TESTS)

populate:
	@NODE_ENV=development NODE_PATH=./app/controllers node lib/populate.js

.PHONY: test
