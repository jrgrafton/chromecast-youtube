function UI(rootNode) {
	this.states = ["idle", "video-info", "video-play"];
	this.rootNode = rootNode;
}

UI.prototype.switchToState = function(state) {
	if(this.states.indexOf(state) !== -1) {
		var currentClasses = this.rootNode.classList;
		for(var i = 0; i < currentClasses; i++) {
			this.rootNode.classList.remove(currentClasses[i]);
		}
		this.rootNode.classList.add(state);
	}
}