DIST=dist
ALPINE_DIST=$(DIST)/alpine

all: dist

alpine: dist
	mkdir -p $(ALPINE_DIST)/
	cp $(DIST)/LICENSE $(ALPINE_DIST)
	cp -r $(DIST)/client $(ALPINE_DIST)/client
	cp -r $(DIST)/server $(ALPINE_DIST)/server
	cp alpine/* $(ALPINE_DIST)
	sed -i "s/pkgver=\"x\"/pkgver=\"${VERSION}\"/" $(ALPINE_DIST)/APKBUILD
	tools/make-package-json-public.js $(ALPINE_DIST)/server/package.json
	cd $(ALPINE_DIST)/server; npm install
	cd $(ALPINE_DIST); tar -czf display-linux.tar.gz client server
	cd $(ALPINE_DIST); abuild checksum
	cd $(ALPINE_DIST); abuild -r

dist:
	mkdir -p $(DIST)/server
	mkdir -p $(DIST)/client
	cp README.md $(DIST)
	cp LICENSE $(DIST)
	envsubst < index.html > $(DIST)/client/index.html
	cp node_modules/@signageos/front-display/dist/webWorker.js $(DIST)/client/webWorker.js
	cp node_modules/@signageos/front-osd/dist/index.html $(DIST)/client/osd.html


