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