(function () {
	// Run startup scripts
	$xu.includeScript($x.path + 'experis.polyfills.js', function () {
		$xp.placeholder(); // Add @placeholder support
		$xp.video();       // Add support for HTML 5 video
	});

	$xu.includeScript($x.path + 'experis.widgets.js', function () {
		// Add code for any Experis widgets you need to use
	});

	/* --
	   Add your own scripts here
	   -- */
})();