#!/bin/bash
cd /var/www/newly
npm ls @swc/core-linux-x64-gnu
npm ls @swc/core
node -e "console.log(process.platform, process.arch)"
node -e "try { require('@swc/core'); console.log('SWC OK'); } catch(e) { console.log('SWC FAIL', e.message); }"
