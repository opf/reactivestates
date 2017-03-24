#! /bin/bash

cd `dirname $0`
cd ..

npm run dist && npm run mocha && npm publish

