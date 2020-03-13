DIST=dist

all: dist

dist:
	mkdir -p $(DIST)/server
	mkdir -p $(DIST)/client
	cp README.md $(DIST)
	cp LICENSE $(DIST)
	envsubst < index.html > $(DIST)/client/index.html
	cp node_modules/@signageos/front-display/dist/webWorker.js $(DIST)/client/webWorker.js
	cp node_modules/@signageos/front-osd/dist/index.html $(DIST)/client/osd.html


