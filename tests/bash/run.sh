for filename in tests/karma/gen/*.conf.js; do
  karma start $filename
done