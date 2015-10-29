/**
 * Test scripts template that would be compiled into from the tests/spec/ scripts
 */
var expect = chai.expect;
var assert = chai.assert;
var should = chai.should;

// Test timeouts
var testTimeout = 35000;
var gUMTimeout = 25000;
var testItemTimeout = 4000;

@@util

describe('@@test', function () {
  this.timeout(testTimeout + 2000);
  this.slow(2000);

  @@script
});