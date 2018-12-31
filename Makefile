DIST=dist
RASPBIAN_DIST=$(DIST)/raspbian

all: raspbian

raspbian: dist-raspbian
	cp -rT raspbian/DEBIAN $(RASPBIAN_DIST)/DEBIAN
	cp -rT raspbian/etc $(RASPBIAN_DIST)/etc
	envsubst < raspbian/control > $(RASPBIAN_DIST)/DEBIAN/control
	tools/make-package-json-public.js $(RASPBIAN_DIST)/usr/lib/signageos/server/package.json
	cd $(RASPBIAN_DIST)/usr/lib/signageos/server; npm install
	dpkg-deb --build $(RASPBIAN_DIST) $(DIST)/signageos-display-linux.deb

dist-raspbian: dist
	mkdir -p $(RASPBIAN_DIST)/usr/lib/signageos/server
	mkdir -p $(RASPBIAN_DIST)/usr/lib/signageos/client
	mkdir -p $(RASPBIAN_DIST)/var/lib/signageos/fs/internal
	mkdir -p $(RASPBIAN_DIST)/var/lib/signageos/system
	cp -r $(DIST)/client/* $(RASPBIAN_DIST)/usr/lib/signageos/client
	cp -r $(DIST)/server/* $(RASPBIAN_DIST)/usr/lib/signageos/server

dist:
	mkdir -p $(DIST)/server
	mkdir -p $(DIST)/client
	cp README.md $(DIST)
	envsubst < index.html > $(DIST)/client/index.html
	cp node_modules/@signageos/front-display/dist/webWorker.js $(DIST)/client/webWorker.js


