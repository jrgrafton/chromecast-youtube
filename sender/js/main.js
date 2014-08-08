window.addEventListener('load',function() {

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