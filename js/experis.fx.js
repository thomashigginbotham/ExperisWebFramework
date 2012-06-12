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
		easeIn: [0, 0, .58, 1],
		easeOut: [1, 0, 1, 1],
		swing: [-1, 0, -1, 1],
		bounceIn: [-1, 0, 1, 1]
	},
	// Note: this function needs work. The math is currently wrong, but it does allow for basic easing.
	getBezierTransform: function (start, end, steps, bezier) {
		var transValues = [];

		for (var n = 1; n < steps; n++) {
			var t = n / steps;

			var a = 1 - 3 * bezier[2] + 3 * bezier[0];
			var b = 3 * bezier[2] - 6 * bezier[0];
			var c = 3 * bezier[0];
			var e = 1 - 3 * bezier[3] + 3 * bezier[1];
			var f = 3 * bezier[3] - 6 * bezier[1];
			var g = 3 * bezier[1];

			var x = (((a * t) + b) * t + c) * t;
			var y = (((e * x) + f) * x + g) * x;

			transValues.push(start + y * (end - start));
		}

		transValues.unshift(start);
		transValues.push(end);
		console.log(transValues);
		return transValues;
	}
};

// Create shortcut
var $xfx = experis.fx;