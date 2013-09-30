#!/bin/sh
echo "beginning ng-annotate defs-build"
rm -rf es5
mkdir es5

declare -a files=(ng-annotate.js ng-annotate-main.js run-tests.js)
for i in ${files[@]}
do
  echo "building $i with defs"
  defs ../$i > es5/$i
done

cp ng-annotate es5/

cd es5

echo "running tests (in es5 mode i.e. without --harmony)"
cp -r ../../tests .
/usr/bin/env node run-tests.js
echo "done self-build"
