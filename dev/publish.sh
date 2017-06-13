#! /bin/bash

cd `dirname $0`
cd ..

git add .
git commit -m
npm run dist && npm run mocha && npm publish

