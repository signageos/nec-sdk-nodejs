#!/usr/bin/env node

const fs = require('fs');
const packageConf = require('../package');

delete packageConf.devDependencies;
delete packageConf.scripts;
delete packageConf.repository;
delete packageConf.files;

const outputFile = process.argv[2];
const outputData = JSON.stringify(packageConf);
fs.writeFileSync(outputFile, outputData, 'utf8');
