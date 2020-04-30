DIST=dist
BATS_URL=https://github.com/sstephenson/bats/archive/v0.4.0.tar.gz

all: dist

dist:
	mkdir -p $(DIST)/server
	mkdir -p $(DIST)/client
	envsubst < index.html > $(DIST)/client/index.html
	cp node_modules/@signageos/front-display/dist/webWorker.js $(DIST)/client/webWorker.js
	cp -r node_modules/@signageos/front-osd/dist $(DIST)/client/osd

test: run-tests

tmp/bats:
	mkdir -p tmp
	wget -O tmp/bats.tar.gz $(BATS_URL)
	trap 'rm tmp/bats.tar.gz' exit ; tar -xzf tmp/bats.tar.gz -C tmp
	mv tmp/bats-* tmp/bats

run-tests: tmp/bats
	find test/bats -type f -exec ./tmp/bats/bin/bats {} +
