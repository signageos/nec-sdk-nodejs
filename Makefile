DIST=dist

all: dist

dist:
	mkdir -p $(DIST)/server
	mkdir -p $(DIST)/client
	envsubst < index.html > $(DIST)/client/index.html
	cp node_modules/@signageos/front-display/dist/webWorker.js $(DIST)/client/webWorker.js
	cp -r node_modules/@signageos/front-osd/dist $(DIST)/client/osd


