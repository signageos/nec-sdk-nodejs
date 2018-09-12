DIST=dist
RASPBIAN_DIST=$(DIST)/raspbian

all: raspbian

raspbian: dist-raspbian
	envsubst < raspbian/control > $(RASPBIAN_DIST)/DEBIAN/control
	tools/make-package-json-public.js $(RASPBIAN_DIST)/usr/lib/signageos/server/package.json
	cp raspbian/service.sh $(RASPBIAN_DIST)/etc/init.d/signageos
	cd $(RASPBIAN_DIST)/usr/lib/signageos/server; npm install
	dpkg-deb --build $(RASPBIAN_DIST) $(DIST)/signageos-display-linux.deb

dist-raspbian: dist
	mkdir -p $(RASPBIAN_DIST)/DEBIAN
	mkdir -p $(RASPBIAN_DIST)/usr/lib/signageos/server
	mkdir -p $(RASPBIAN_DIST)/usr/lib/signageos/client
	mkdir -p $(RASPBIAN_DIST)/var/lib/signageos/fs
	mkdir -p $(RASPBIAN_DIST)/var/lib/signageos/system
	mkdir -p $(RASPBIAN_DIST)/var/log/signageos
	mkdir -p $(RASPBIAN_DIST)/etc/init.d
	cp $(DIST)/client/* $(RASPBIAN_DIST)/usr/lib/signageos/client
	cp $(DIST)/server/* $(RASPBIAN_DIST)/usr/lib/signageos/server

dist:
	mkdir -p $(DIST)/server
	mkdir -p $(DIST)/client
	cp README.md $(DIST)
	cp index.html $(DIST)/client/index.html
	cp node_modules/@signageos/front-display/dist/webWorker.js $(DIST)/client/webWorker.js
	cp tools/ffmpeg-extract-video-last-frame.sh $(DIST)/server


