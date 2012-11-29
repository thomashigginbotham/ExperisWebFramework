require.config({
	paths: {
		prism: 'lib/prism'
	},
	shim: {
		'prism': {
			'exports': 'Prism'
		}
	}
});

require(['prism'], function(Prism) {
	try {
		Prism.highlightAll();
	} catch (ex) {

	}
});

// Page-specific features
$(function() {
	var button = $('#dynamic-resize');
	var wrap = $('#wrap');

	button.click(function() {
		wrap.toggleClass('container');

		if (wrap.hasClass('container')) {
			button.text('Revert to Dynamic Resizing');
		} else {
			button.text('Try it Now!');
		}
	})
});