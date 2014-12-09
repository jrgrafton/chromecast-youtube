window.addEventListener('load',function() {
	var DEBUG = true;

	// Turn off logging when not in debugging
	if(!DEBUG) {
		console.log = function() {}
		console.debug = function() {}
		console.info = function() {}
	}
	
	// Wait for Chromecast to be detected
    window['__onGCastApiAvailable'] = function(loaded, errorInfo) {
	   	if (loaded) {
	   		window.ui = new UI();
			window.sender = new Sender();
		} else {
			console.error(errorInfo);
		};
	};
});