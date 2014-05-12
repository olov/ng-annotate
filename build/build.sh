#!/bin/sh
echo "beginning ng-annotate defs-build"
rm -rf es5
mkdir es5

declare -a files=(heap.js ng-annotate.js ng-annotate-main.js nginject-comments.js run-tests.js)
DEFS="../node_modules/.bin/defs"
if [[ ! -f "$DEFS" ]]; then DEFS="../../../../node_modules/.bin/defs" ; fi
if [[ ! -f "$DEFS" ]]; then DEFS="defs" ; fi

for i in ${files[@]}
do
  echo "building $i with defs"
  $DEFS ../$i > es5/$i
done

cp ng-annotate es5/

echo "hard-coding version"
node --harmony inline-version.js

cd es5

echo "running tests (in es5 mode i.e. without --harmony)"
cp -r ../../tests .
/usr/bin/env node run-tests.js
echo "done self-build"
