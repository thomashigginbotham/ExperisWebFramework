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
		easeIn: [.42, 0, 1, 1],
		easeOut: [0, 0, .58, 1],
		easeInOut: [.42, 0, .58, 1],
		bounceIn: [.42, -.42, 1, 1],
		bounceOut: [.17, .67, .58, 1.3]
	},
	/*
	* animate (dom element array, object, number[, string, function])
	* els: an element or array of elements
	* object: an object of CSS rules in the format { attribute: value }
	* duration: the duration of the animation in milliseconds
	* easing: a string representation of the easing effect (e.g. easeIn)
	* callback: a function to be executed after the animation is complete
	*/
	animate: function (els, values, duration, easing, callback) {
		if (!easing) easing = 'easeInOut';
		if (els.length === undefined) els = [els];

		var fps = 60;
		var ieVersion = $xu.getIeVersion();

		for (var n = 0, el; el = els[n++];) {
			for (var key in values) {
				(function (el, key) {
					var curValue = parseFloat(el.style[key]);
					var newValue = parseFloat(values[key]);
					var unit = values[key].toString().replace(newValue, '');
					var steps = (duration / 1000) * fps; // Number of frames of animation

					if (ieVersion > -1 && ieVersion < 9 && key === 'opacity') {
						// Get IE opacity filter value
						if (el.filters['DXImageTransform.Microsoft.Alpha']) {
							curValue = el.filters['DXImageTransform.Microsoft.Alpha'].opacity;
						} else {
							curValue = 1;
						}
					}

					var transVals = $xfx.getBezierTransform(curValue, newValue, steps, $xfx.trans[easing]);
					var curFrame = 0;

					var transTimer = setInterval(function () {
						var newStyle = {};
						newStyle[key] = transVals[curFrame++] + unit;
						$xu.setStyle(el, newStyle);

						if (curFrame === transVals.length) {
							clearInterval(transTimer);
							transTimer = 0;

							if (callback) callback();
						}
					}, 1000 / fps);
				})(el, key);
			}
		}
	},
	/*
	* getBezierTransform (number, number, number, array)
	* start: the starting value
	* end: the ending value
	* steps: the number of transitionary numbers
	* bezier: the cubic bezier for the transform
	*/
	getBezierTransform: function (start, end, steps, bezier) {
		var transValues = [];

		for (var n = 1; n < steps; n++) {
			var t = n / steps;
			var y = $xfx.spline(t, bezier[0], bezier[1], bezier[2], bezier[3]);

			transValues.push(start + y * (end - start));
		}

		transValues.unshift(start);
		transValues.push(end);

		return transValues;
	},
	/*
	* spline (number, number, number, number, number)
	* x: The x position on a cartesian plane in the range 0 - 1
	* x1, y1, x2, y2: Coordinate points representing the handles of a cubic bezier
	*/
	spline: function (x, x1, y1, x2, y2) {
		var a = function (a1, a2) { return 1.0 - 3.0 * a2 + 3.0 * a1; };
		var b = function (a1, a2) { return 3.0 * a2 - 6.0 * a1; };
		var c = function (a1) { return 3.0 * a1; };

		var calcBezier = function (t, a1, a2) {
			return ((a(a1, a2) * t + b(a1, a2)) * t + c(a1)) * t;
		};

		var getSlope = function (t, a1, a2) {
			return 3.0 * a(a1, a2) * t * t + 2.0 * b(a1, a2) * t + c(a1);
		};

		var getTForX = function (x) {
			var t = x;

			for (var n = 0; n < 4; ++n) {
				var slope = getSlope(t, x1, x2);

				if (slope === 0.0) return t;

				var curX = calcBezier(t, x1, x2) - x;
				t -= curX / slope;
			}

			return t;
		};

		if (x1 === y1 && x2 === y2) return x; // Linear

		return calcBezier(getTForX(x), y1, y2);
	}
};

// Create shortcut
var $xfx = experis.fx;