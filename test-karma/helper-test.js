// Testing attributes
var array = [];
var sw = new Skylink();

var pushOneToArray = function(){
  array.push(1);
};
var pushToArrayPlusOne = function(value) {
  array.push(value + 1);
};
var pushToArrayPlusTwo = function(value) {
  array.push(value + 2);
};
var pushToArrayPlusThree = function(value) {
  array.push(value + 3);
};
var pushToArrayPlusFour = function(value) {
  array.push(value + 4);
};
var cancelTrigger = function(value) {
  return false;
};


console.log('API: Tests the _throttle() function');
console.log('===============================================================================================');

describe("A test suite", function() {

   beforeEach(function() { 
   	var test_func_before_throttle = function(){
	    sw._throttle(pushOneToArray,2000)();
	  }  

	  //Test if only one function fires among these
	  test_func_before_throttle();
	  test_func_before_throttle();
	  test_func_before_throttle();
	  test_func_before_throttle();
	  test_func_before_throttle();
	  test_func_before_throttle();
	  test_func_before_throttle();
	  test_func_before_throttle();

	  //Test if function can not fire halfway during timeout
	  setTimeout(test_func_before_throttle, 1000);

	  //Test if function can fire after timeout was gone
	  setTimeout(test_func_before_throttle, 3000);
   });

   it('Testing throttle', function(done) { 
   	this.timeout(7000);
   	setTimeout(function(){
	    assert.deepEqual(array, [1,1]);
	    done();
	  }, 5000);
   });
});


