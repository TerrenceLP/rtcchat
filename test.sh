#grunt karma #generate configs
grunt test

for filename in tests/gen/conf/*.peer.conf.js; do
  karma start $filename
done
