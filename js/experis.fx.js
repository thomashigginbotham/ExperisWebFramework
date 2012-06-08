/*  ______                     _         _______  __
   / ____/  ______  ___  _____(_)____   / ____/ |/ /
  / __/ | |/_/ __ \/ _ \/ ___/ / ___/  / /_   |   / 
 / /____>  </ /_/ /  __/ /  / (__  )  / __/  /   |  
/_____/_/|_/ .___/\___/_/  /_/____/  /_/    /_/|_|  
          /_/                                      */

if (!experis) { alert('You must include experis.utils.js before using Experis FX.'); }

experis.fx = {
	trans: {
		linear: [0, 0, 1, 1],
		easeIn: [0, 0, 0, 1],
		easeOut: [1, 0, 1, 1]
	},
	// Note: this function needs work. The math is currently wrong, but it does allow for basic easing.
	getBezierTransform: function (start, end, steps, bezier) {
		var transValues = [];

		for (var n = 1; n < steps; n++) {
			var t = n / steps;
			var a = 1 - 3 * bezier[2] + 3 * bezier[0];
			var b = 3 * bezier[2] - 6 * bezier[0];
			var c = 3 * bezier[0];
			var x = (((a * t) + b) * t + c) * t;

			transValues.push(start + x * (end - start));
		}

		transValues.unshift(start);
		transValues.push(end);

		return transValues;
	}
};

// Create shortcut
var $xfx = experis.fx;