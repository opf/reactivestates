#! /bin/bash

cd `dirname $0`
cd ..

git add .
git commit -m "new release"
npm run dist && npm run mocha && npm publish
npm version patch
