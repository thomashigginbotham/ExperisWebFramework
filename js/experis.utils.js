/*     ______                      _              _______ 
      / ____/_  ______  ___  _____(_)_____       / / ___/
     / __/  | |/_/ __ \/ _ \/ ___/ // ___/  __  / /\__ \ 
    / /___ _>  </ /_/ /  __/ /  / /(__  )  / /_/ /___/ / 
   /_____//_/|_/ .___/\___/_/  /_//____/   \____//____/ 
              /_/  JavaScript Library (v. 0.2)         */

var experis = {};

/* ------------------------------------
   Properties
--------------------------------------- */
experis.path = '/js/experis/'; // Path to "experis" directory
experis.domReady = false;
experis.scripts = [];

/* Content delivery networks */
experis.cdn = {
	jquery: '//ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js',
	jqueryui: '//ajax.googleapis.com/ajax/libs/jqueryui/1/jquery-ui.min.js',
	prototype: '//ajax.googleapis.com/ajax/libs/prototype/1/prototype.js',
	nwmatcher: '//s3.amazonaws.com/nwapi/nwmatcher/nwmatcher-1.2.5-min.js'
};

/* ------------------------------------
   Utilities Class
--------------------------------------- */
experis.utils = {
	/*
	* addListener (dom element, string, function)
	* el: the DOM element to which you're attaching an event listener
	* evt: a string representation of the event type (e.g. 'click', 'keydown', etc.)
	* callback: the function that will execute when the event is triggered
	*/
	addListener: function (el, evt, callback) {
		if (window.addEventListener) { // W3C
			el.addEventListener(evt, callback, false);
		} else if (window.attachEvent) { // IE
			el.attachEvent('on' + evt, callback);
		} else { // Last resort
			el['on' + evt] = callback;
		}
	},
	/*
	* fixSubpixelPercentages (object) NOT READY FOR PRODUCTION USE
	* details: {els: dom element array, dims: object array}
	* NOTE: Percentage widths that result in subpixel values are handled differently
	* by each browser. Webkit and IE round down to the nearest whole number, and Mozilla adjusts
	* values of surrounding elements up/down to more closely mimick the expected result. This
	* function allows Webkit and IE to more closely resemble Mozilla's implementation.
	*/
	fixSubpixelPercentages: function (details) {
		var parent = details.els[0].parentNode;
		var parentDims = $xu.getDimensions(parent);
		var widthCtr = 0;
		var heightCtr = 0;
		var colCount = 0;

		details.pixelDims = [];

		// Convert percentages to pixel values
		for (var n = 0, dim; dim = details.dims[n++]; ) {
			details.pixelDims[n - 1] = { outerWidth: 0 };
			var pixelDims = details.pixelDims[n - 1];

			for (var key in dim) {
				pixelDims[key] = parentDims.width * (dim[key] / 100);

				if (dim[key] > 0 || key !== 'marginRight') { // Don't include negative right margin in outerWidth
					pixelDims.outerWidth += parseInt(pixelDims[key]);
				}
			}

			// Find number of columns that will fit in the parent
			widthCtr += pixelDims.outerWidth;

			if (widthCtr <= parentDims.width) colCount = n;
		}

		// Adjust widths of each element to integer values
		var ctr = 0;
		var ie = $xu.getIeVersion();
		var pixelVariance = (ie > -1 && ie < 9) ? 3 : 0; // Older versions of IE may be up to 3 pixels off
		var rowWidth = 0, intRowWidth = 0;
		var diff, extraPerEl, remainder;

		for (var n = 0, pixelDim; pixelDim = details.pixelDims[n++]; ) {
			intRowWidth += pixelDim.outerWidth;
			ctr++;

			if (ctr === colCount) {
				// Distribute the width difference among elements in the row
				diff = parentDims.width - intRowWidth;
				extraPerEl = parseInt(diff / colCount);
				remainder = parseInt(diff - extraPerEl * colCount);

				for (var m = n - colCount; m < n; m++) {
					var revWidth = parseInt(details.pixelDims[m].width) + extraPerEl;

					if (remainder-- > pixelVariance) revWidth++;

					for (var key in details.pixelDims[m]) {
						if (key === 'width') {
							details.els[m].style.width = revWidth + 'px';
						} else if (key !== 'outerWidth' && key !== 'offset') {
							details.els[m].style[key] = parseInt(details.pixelDims[m][key]) + 'px';
						}
					}
				}

				// Reset counters
				rowWidth = intRowWidth = ctr = 0;
			}
		}

		// Rerun this function on window resize
		var timer;

		$xu.addListener(window, 'resize', (function (details) {
			return function () {
				clearTimeout(timer);

				timer = setTimeout(function () {
					$xu.fixSubpixelPercentages(details)
				}, 200);
			};
		})(details));
	},
	/*
	* getCookie (string)
	* name: the name/key of the cookie you want to retrieve
	* Return value: the value of the requested cookie or null if not found
	*/
	getCookie: function (name) {
		// Split the cookie into name/value pairs
		var cookies = document.cookie.split(';');
		var tempCookie, cookieName, cookieValue = '', found = false;

		for (n = 0, len = cookies.length; n < len; n++) {
			tempCookie = cookies[n].split('=');

			// Trim whitespace
			cookieName = tempCookie[0].replace(/^\s+|\s+$/g, '');

			// Check if cookieName matches request
			if (cookieName === name) {
				found = true;

				// Get value
				if (tempCookie.length > 1) {
					cookieValue = unescape(tempCookie[1].replace(/^\s+|\s+$/g, ''));
				}

				return cookieValue;
			}
		}

		return null;
	},
	/*
	* getDimensions (dom element)
	* el: the DOM element for which to retrieve the dimensions
	* Return value: object (e.g. {width:200, height:150})
	*/
	getDimensions: function (el) {
		var dims = { width: 0, height: 0 };

		if (this.getIeVersion() > -1) {
			dims.width = el.offsetWidth;
			dims.height = el.offsetHeight;
		} else {
			var compStyle = document.defaultView.getComputedStyle(el, '')

			dims.width = parseInt(compStyle.getPropertyValue('width'));
			dims.height = parseInt(compStyle.getPropertyValue('height'));
		}

		return dims;
	},
	/*
	* getElementsByClassName (string[, dom element])
	* classname: the class name of the elements to retrieve
	* el: the root element to search from (defaults to document.documentElement)
	* Return value: node list (if native browser support) or array of DOM elements
	*/
	getElementsByClassName: function (classname, el) {
		var els;

		el = el || document.documentElement;

		if (document.getElementsByClassName) {
			els = el.getElementsByClassName(classname);
		} else {
			var allEls = el.getElementsByTagName('*');
			var regex = new RegExp('(^|\s)' + classname + '(\s|$)');
			els = [];

			for (var n = 0, len = allEls.length; n < len; n++) {
				if (regex.test(allEls[n].className)) {
					els.push(allEls[n]);
				}
			}
		}

		return els;
	},
	/*
	* getFontSize ([dom element])
	* el: the element from which to measure the font size (defaults to document.documentElement)
	* Return value: numeric value representing the height of the font in pixels
	*/
	getFontSize: function (el) {
		// Create a hidden div and measure its height after adding an "M" character
		var div = document.createElement('div');
		var atts = { fontSize: '1em', padding: '0', position: 'absolute', lineHeight: '1', visibility: 'hidden' };

		el = el || document.documentElement;

		for (var key in atts) {
			div.style[key] = atts[key];
		}

		div.appendChild(document.createTextNode('M'));
		el.appendChild(div);

		var fontSize = div.offsetHeight;

		el.removeChild(div);

		return fontSize;
	},
	/*
	* getIeVersion ()
	* Return value: Internet Explorer's version number or -1 for other browsers
	*/
	getIeVersion: function () {
		var version = -1;
		var ua = navigator.userAgent;
		var re = new RegExp('MSIE ([0-9]{1,}[\.0-9]{0,})');

		if (re.exec(ua) != null) version = parseFloat(RegExp.$1);

		return version;
	},
	/*
	* getLineHeight (dom element)
	* el: the DOM element of which you want to retrieve the line height
	* Return value: number in pixels representing the element's line height
	*/
	getLineHeight: function (el) {
		var lineHeight = 0;
		var newEl = document.createElement(el.nodeName);

		newEl.style.margin = '0';
		newEl.style.padding = '0';
		newEl.style.clear = 'both';
		newEl.style.fontFamily = el.style.fontFamily;
		newEl.style.fontSize = el.style.fontSize;

		newEl.appendChild(document.createTextNode('&nbsp;'));

		el.parentNode.appendChild(newEl);
		lineHeight = newEl.clientHeight;
		el.parentNode.removeChild(newEl);

		return lineHeight;
	},
	/*
	* getScrollPosition ([dom element])
	* el: the DOM element of which you want to retrieve the scrollbar position
	* Return value: an object representing the location of the scrollbar for a given element assuming the
	*     zero point is at the top left corner and values increase as the scrollbar moves (e.g. {x:0, y:25})
	*/
	getScrollPosition: function (el) {
		var offset = { x: 0, y: 0 };

		if (window.pageXOffset != null) {
			el = el || window;
			offset.x = el.pageXOffset;
			offset.y = el.pageYOffset;
		} else {
			el = el || (document.compatMode && document.compatMode != 'BackCompat') ? document.documentElement : document.body;

			offset.x = el.scrollLeft;
			offset.y = el.scrollTop;
		}

		return offset;
	},
	/*
	* getPageDimensions ([bool])
	* viewPortOnly: a boolean value to determine whether to return dimensions for the full page or only the viewable area
	* Return value: an object containing the dimensions of the page (e.g. {width:1024, height:3450})
	*/
	getPageDimensions: function (viewPortOnly) {
		var dims = {
			width: 0,
			height: 0
		};

		if (!viewPortOnly) {
			dims.width = document.documentElement.scrollWidth;
			dims.height = document.documentElement.scrollHeight;
		} else {
			if (window.innerWidth != null) {
				dims.width = window.innerWidth;
				dims.height = window.innerHeight;
			} else {
				dims.width = document.documentElement.offsetWidth;
				dims.height = document.documentElement.offsetHeight;
			}
		}

		return dims;
	},
	/*
	* getQueryString (string)
	* key: the identifier for the query string value you want to obtain
	* Return value: the query string value or null if not found
	*/
	getQueryString: function (key) {
		// Under construction
	},
	/*
	* hasAncestor (dom element, string)
	* descendant: the element to check for an ancestor
	* tag: the node name of the ancestor element
	* Return value: true if descendant element has the provided node name as an ancestor, or false otherwise
	*/
	hasAncestor: function (descendant, tag) {
		var answer = false;
		var curNode = descendant;

		tag = tag.toLowerCase();

		while (curNode.nodeName.toLowerCase() != 'html') {
			curNode = curNode.parentNode;

			if (curNode.nodeName.toLowerCase() === tag) {
				anwer = true;
				break;
			}
		}

		return answer;
	},
	/*
	* inArray (object, array)
	* needle: the object for which to look in the array
	* haystack: the array in which to search
	* Return value: true if object is found in the array, or false otherwise
	*/
	inArray: function (needle, haystack) {
		for (var n = 0, len = haystack.length; n < len; n++) {
			if (haystack[n] == needle) return true;
		}

		return false;
	},
	/*
	* includeScript (string[, function])
	* url: the URL of the script to include
	* callback: a function to execute after the script has loaded
	*/
	includeScript: function (url, callback) {
		// Check if script is already added
		var scripts = document.getElementsByTagName('script');
		var scriptFound = false;

		for (var n = 0, len = scripts.length; n < len; n++) {
			if (scripts[n].getAttribute('src') === url) {
				scriptFound = true;
				if (callback) $xu.onScriptReady(scripts[n], callback);
				break;
			}
		}

		if (!scriptFound) {
			// Insert new script
			var firstScript = document.getElementsByTagName('script')[0];
			var newScript = document.createElement('script');

			if (callback) $xu.onScriptReady(newScript, callback);

			newScript.src = url;
			firstScript.parentNode.insertBefore(newScript, firstScript);
		}
	},
	/*
	* mergeJson (json object, json object)
	* a: the first object
	* b: the second object
	* Return value: a single object with values from both a and b objects (b values will overwrite a if conflicts occur)
	*/
	mergeJson: function (a, b) {
		for (var val in b) {
			a[val] = b[val];
		}

		return a;
	},
	/*
	* onDomReady (function)
	* callback: the function to execute when the DOM is fully formed
	*/
	onDomReady: function (callback) {
		if ($x.domReady === true) {
			callback();
			return;
		}

		// Internet Explorer
		/*@cc_on
		@if (@_win32 || @_win64)
		if (document.getElementById('ieScriptLoad') == null) {
			document.write('<script id="ieScriptLoad" defer src="//:"><\/script>');
		}

		document.getElementById('ieScriptLoad').onreadystatechange = function () {
			var readyState = document.getElementById('ieScriptLoad').readyState;

			if (readyState === 'complete' || readyState === 'loaded') {
				$x.domReady = true;
				callback();
			}
		};

		return;
		@end@*/

		// Mozilla, Chrome, Opera
		if (document.addEventListener) {
			document.addEventListener('DOMContentLoaded', callback, false);
			return;
		}

		// Safari, iCab, Konqueror
		if (/KHTML|WebKit|iCab/i.test(navigator.userAgent)) {
			var DOMLoadTimer = setInterval(function () {
				if (/loaded|complete/i.test(document.readyState)) {
					callback();
					clearInterval(DOMLoadTimer);
				}
			}, 10);

			return;
		}

		// Other web browsers
		window.onload = callback;
	},
	/*
	* onScriptReady (dom <script> element, function)
	* scriptEl: the DOM <script> element for which to check the ready state
	* callback: the function to execute when the script is ready
	*/
	onScriptReady: function (scriptEl, callback) {
		if (scriptEl.getAttribute('data-loaded') === 'true' || scriptEl.readyState === 'loaded' || scriptEl.readyState === 'complete') {
			callback();
		} else {
			// W3C
			$xu.addListener(scriptEl, 'load', function () {
				scriptEl.setAttribute('data-loaded', 'true');
				callback();
			});

			// IE
			$xu.addListener(scriptEl, 'readystatechange', function () {
				if (scriptEl.readyState === 'loaded' || scriptEl.readyState === 'complete') {
					scriptEl.setAttribute('data-loaded', 'true');
					callback();
				}
			});
		}

	},
	/*
	* setCookie (string, string[, int])
	* name: the name/key of the cookie to set
	* value: the value of the cookie to set
	* expDays: the number of days the cookie will remain on the user's machine (defaults to "end of session")
	*/
	setCookie: function (name, value, expDays) {
		var cookie = name + '=' + escape(value);

		if (expDays) {
			var expDate = new Date();
			expDate.setDate(expDate.getDate() + expDays);

			cookie += ';expires=' + expDate.toGMTString();
		}

		document.cookie = cookie;

	}
};


/* ------------------------------------
   Additional Setup
--------------------------------------- */
// Create shortcuts
var $x = experis;
var $xu = experis.utils;

// Assume all previously included scripts are loaded
$x.scripts = document.getElementsByTagName('script');

for (var n = 0, len = $x.scripts.length; n < len; n++) {
	$x.scripts[n].setAttribute('data-loaded', 'true');
}

// Check for DOM readiness, in case other scripts check too late
$xu.onDomReady(function () { $x.domReady = true; });