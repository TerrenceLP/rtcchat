for filename in tests/karma/gen/*.conf.js; do
  karma start $filename --browsers $1 --protocol https:
done