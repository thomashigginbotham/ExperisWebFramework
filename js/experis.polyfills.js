/*  ______                      _          ____        __       _____ ____     
   / ____/_  ______  ___  _____(_)_____   / __ \____  / /__  __/ __(_) / /_____
  / __/  | |/_/ __ \/ _ \/ ___/ // ___/  / /_/ / __ \/ // / / / /_/ / / // ___/
 / /___ _>  </ /_/ /  __/ /  / /(__  )  / ____/ /_/ / // /_/ / __/ / / /(__  ) 
/_____//_/|_/ .___/\___/_/  /_//____/  /_/    \____/_/ \__, /_/ /_/_/_//____/  
           /_/  Experis JS Polyfills Library (v. 0.1) /____/                 */

if (!experis) { alert('You must include experis.utils.js before using the Experis Polyfills library.'); }

experis.polyfills = {
	/*
	* fixSubpixelWidths (dom element, object[, number])
	* Percentage widths that result in subpixel values are handled differently by each
	* browser. Webkit and IE round values down to the nearest whole number, and Mozilla adjusts
	* values of surrounding elements up/down to more closely mimick the expected result. This
	* function allows Webkit and IE to more closely resemble Mozilla's implementation.
	* Child elements are assumed to have box-sizing set to border-box.
	* childWidths is in the format: [{width:25, marginLeft:1, marginRight:1}, {...}] where each number represents a percentage
	*/
	fixSubpixelWidths: function (wrapper, childWidths, callCount) {
		if ($xu.getPageDimensions().width <= 480) return;

		if (!callCount) callCount = 0;

		var wrapperWidth = $xu.getDimensions(wrapper).width;
		var totalWidth = 0;      // The total number of pixels the children "should" take up
		var totalWidthInt = 0;   // The total width actually taken up
		var el;

		for (var n = 0, ctr = 0, child; child = childWidths[n++]; ctr++) {
			// Convert percentage values to pixels and add to totalWidth
			child.widthPx = wrapperWidth * (child.width / 100);
			child.marginLeftPx = wrapperWidth * (child.marginLeft / 100);
			child.marginRightPx = wrapperWidth * (child.marginRight / 100);
			child.widthPxInt = parseInt(child.widthPx);
			child.marginLeftPxInt = parseInt(child.marginLeftPx);
			child.marginRightPxInt = parseInt(child.marginRightPx);

			totalWidth += child.widthPx + child.marginLeftPx + child.marginRightPx;
			totalWidthInt += child.widthPxInt + child.marginLeftPxInt + child.marginRightPxInt;

			// Update width/margins of child to integer pixel values
			while (wrapper.childNodes[ctr].nodeType === 3) {
				ctr++; // Ignore text nodes
			}

			el = wrapper.childNodes[ctr];
			el.style.width = child.widthPxInt + 'px';
			el.style.marginLeft = child.marginLeftPxInt + 'px';
			el.style.marginRight = child.marginRightPxInt + 'px';
		}

		// Distribute remaining pixels among children's widths
		var remaining = parseInt(totalWidth - totalWidthInt);

		while (remaining > 0) {
			var ctr = 0, el;

			while (wrapper.childNodes[ctr].nodeType === 3) {
				ctr++; // Ignore text nodes
			}

			if (ctr > wrapper.childNodes.length - 1) {
				// Move back to the first child
				ctr = 0;

				while (wrapper.childNodes[ctr].nodeType === 3) {
					ctr++;
				}
			}

			el = wrapper.childNodes[ctr];
			el.style.width = parseInt(el.style.width) + 1 + 'px';

			remaining--;
		}

		if (callCount === 0) {
			var timer;
			callCount++;

			// Rerun this function on window resize
			$xu.addListener(window, 'resize', (function (wrapper, childWidths, callCount) {
				return function () {
					clearTimeout(timer);

					// Clear out width and margin styles
					for (var n = 0, el; el = wrapper.childNodes[n++]; ) {
						if (el.nodeType !== 3) {
							el.style.width = el.style.marginLeft = el.style.marginRight = '';
						}
					}

					// Run function after a set time (to ease CPU load)
					timer = setTimeout(function () {
						$xp.fixSubpixelWidths(wrapper, childWidths, callCount);
					}, 200);
				};
			})(wrapper, childWidths, callCount));
		}
	},
	/*
	* placeholder ()
	* Polyfill for @placeholder support
	*/
	placeholder: function () {
		$xu.onDomReady(function () {
			if (!('placeholder' in document.createElement('input'))) {
				var inputs = document.getElementsByTagName('input');
				var textareas = document.getElementsByTagName('textarea');

				var setup = function (els) {
					for (var n = 0, len = els.length; n < len; n++) {
						var placeholder = els[n].getAttribute('placeholder');

						if (placeholder) {
							var curInput = els[n];

							if (curInput.getAttribute('value') == null || curInput.getAttribute('value') === '') {
								curInput.setAttribute('value', placeholder);
							}

							if (curInput.nodeName.toLowerCase() === 'textarea' && curInput.childNodes.length === 0) {
								curInput.appendChild(document.createTextNode(placeholder));
							}

							$xu.addListener(curInput, 'focus', function (e) {
								if (!e) e = event;

								var target = (e.target) ? e.target : e.srcElement;
								var placeholder = target.getAttribute('placeholder');

								if (target.getAttribute('value') === placeholder) target.setAttribute('value', '');
								if (target.nodeName.toLowerCase() === 'textarea' && target.innerHTML === placeholder) target.innerHTML = '';
							});

							$xu.addListener(curInput, 'blur', function (e) {
								if (!e) e = event;

								var target = (e.target) ? e.target : e.srcElement;
								var placeholder = target.getAttribute('placeholder');

								if (target.getAttribute('value') == null || target.getAttribute('value') === '') target.setAttribute('value', placeholder);
								if (target.nodeName.toLowerCase() === 'textarea' && target.innerHTML === '') target.innerHTML = placeholder;
							});
						}
					}
				}

				setup(inputs);
				setup(textareas);
			}
		});
	},
	/*
	* video([number, number])
	* Replaces HTML <video> tags with FlowPlayer (http://flowplayer.org/) Flash video player
	* when videos fail to load or if <video> is unsupported.
	*/
	video: function (vidWidth, vidHeight) {
		$xu.onDomReady(function () {
			$xu.includeScript($x.path + 'flowplayer/flowplayer-3.2.6.min.js', function () {
				// Check if video loaded, and if not, use FlowPlayer
				var videos = document.getElementsByTagName('video');
				for (var n = 0, len = videos.length; n < len; n++) {
					if (!videos[n].currentSrc || videos[n].networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
						var children = videos[n].childNodes;

						for (m = 0, child_len = children.length; m < child_len; m++) {
							if (children[m].nodeName.toLowerCase() === 'a') {
								// Move anchor above video and hide video
								var movieUrl = children[m].getAttribute('href');
								var wrapper = document.createElement('div');

								wrapper.id = children[m].id + '-clone';

								videos[n].parentNode.insertBefore(wrapper, videos[n]);
								videos[n].style.display = 'none';
								children[m].style.display = 'none';

								// Set video dimensions and call flowplayer()
								var widthAttr = videos[n].getAttribute('width');
								var heightAttr = videos[n].getAttribute('height');

								if (!vidWidth && widthAttr !== null) {
									vidWidth = widthAttr;
								} else if (!vidWidth) {
									vidWidth = 320;
								}

								if (!vidHeight && heightAttr !== null) {
									vidHeight = heightAttr;
								} else if (!vidHeight) {
									vidHeight = 240;
								}

								with (wrapper.style) {
									display = 'block';
									width = vidWidth + 'px';
									height = vidHeight + 'px';
									overflow = 'hidden';
								}

								flowplayer(wrapper.id, { src: $x.path + 'flowplayer/flowplayer-3.2.7.swf', wmode: 'opaque' }, { clip: { url: movieUrl, autoPlay: false} });

								// Sometimes IE doesn't load the player on the first try
								if (wrapper.innerHTML.toLowerCase().indexOf('<object') == -1) {
									flowplayer(wrapper.id, { src: $x.path + 'flowplayer/flowplayer-3.2.7.swf', wmode: 'opaque' }, { clip: { url: movieUrl, autoPlay: false} });
								}
							}
						}
					}
				}
			});
		});
	}
};

// Create shortcut
var $xp = experis.polyfills;