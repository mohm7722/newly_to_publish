#!/bin/bash
cd /var/www/newly
node -e "try { require('@rollup/rollup-linux-x64-gnu'); console.log('Rollup OK'); } catch(e) { console.log('Rollup FAIL', e.message); }"
node -e "try { require('lightningcss'); console.log('lightningcss OK'); } catch(e) { console.log('lightningcss FAIL', e.message); }"
