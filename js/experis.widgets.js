/*  ______                      _          _       ___      __            __      
   / ____/_  ______  ___  _____(_)_____   | |     / (_)____/ /____ ____  / /______
  / __/  | |/_/ __ \/ _ \/ ___/ // ___/   | | /| / / // __  // __ `/ _ \/ __/ ___/
 / /___ _>  </ /_/ /  __/ /  / /(__  )    | |/ |/ / // /_/ // /_/ /  __/ /_(__  ) 
/_____//_/|_/ .___/\___/_/  /_//____/     |__/|__/_/ \__,_/ \__, /\___/\__/____/  
           /_/  Experis JS Widget Library (v. 0.1)         /____/               */

if (!experis) { alert('You must include experis.utils.js before using the Experis Widgets library.'); }

experis.widgets = {
	/*
	* fontControl(dom element[, dom element, number, function])
	* Appends a font size control to the page
	*/
	fontControl: function (wrapper, startEl, amt, callback) {
		// Set default font size
		startEl = startEl || document.getElementsByTagName('body')[0]; // Default increase at the <body> level
		amt = amt || 2; // Default increase by 2 pixels

		var savedSize = $xu.getCookie('experisFontSize');

		if (savedSize) {
			startEl.style.fontSize = savedSize;
		} else {
			startEl.style.fontSize = $xu.getFontSize(startEl) + 'px';
		}

		// Set up new elements
		var decreaseFont = document.createElement('a');
		var increaseFont = document.createElement('a');

		decreaseFont.className = 'experis-decrease-font';
		decreaseFont.setAttribute('href', 'javascript:void(0);');
		decreaseFont.innerHTML = 'A-';

		increaseFont.className = 'experis-increase-font';
		increaseFont.setAttribute('href', 'javascript:void(0);');
		increaseFont.innerHTML = 'A+';

		// Add event handlers
		var updateFontSize = function (amt) {
			var fontSize = parseFloat(startEl.style.fontSize) + amt + 'px';

			startEl.style.fontSize = fontSize;

			// Save cookie for new size
			$xu.setCookie('experisFontSize', fontSize, 30);
		};

		$xu.addListener(decreaseFont, 'click', function () { updateFontSize(-amt); if (callback) callback(); });
		$xu.addListener(increaseFont, 'click', function () { updateFontSize(amt); if (callback) callback(); });

		// Append elements to wrapper
		wrapper.appendChild(decreaseFont);
		wrapper.appendChild(increaseFont);
	},
	/*
	* slider(dom element[, object])
	* Converts an HTML structure into a functioning content slider
	*/
	slider: function (wrapper, options) {
		$xu.includeScript($x.path + 'experis.fx.js', function () { // Require FX library
			$xu.includeScript($x.cdn.nwmatcher, function () {      // Require NWMatcher
				if (wrapper.className.indexOf('experis-slider') === -1) {
					wrapper.className += ' experis-slider';
				}

				var slides = NW.Dom.select('.experis-slider > div', wrapper.parentNode);
				var nav = NW.Dom.select('.experis-slider > ul', wrapper.parentNode);
				var slideDims = $xu.getDimensions(slides[0]);
				var slideCount = slides.length;
				var curSlide = 1;
				var mouseStatus = 'out';
				var ieVersion = $xu.getIeVersion();
				var timer, transTimer;

				var defaults = {
					delay: 5000,
					transType: 'slide',
					transTime: 300,
					transEasing: 'linear',
					showArrows: true,
					stopAfterHover: true
				};

				options = $xu.mergeJson(defaults, options);

				// Build new HTML structure
				var slidePanel = document.createElement('div');
				var slideWrap = document.createElement('div');

				slidePanel.className = 'experis-slide-panel';
				slidePanel.style.position = 'relative';
				slidePanel.style.overflow = 'hidden';

				slideWrap.className = 'experis-slide-wrap';
				slideWrap.style.position = 'relative';
				slideWrap.style.left = 0;
				slideWrap.style.width = slideDims.width * slideCount + 'px';

				slidePanel.appendChild(slideWrap);
				wrapper.appendChild(slidePanel);

				for (var n = 0, slide; slide = slides[n++]; ) {
					// CSS for each slide
					with (slide.style) {
						float = 'left';      // WebKit
						cssFloat = 'left';   // Mozilla
						styleFloat = 'left'; // Trident
						position = 'relative';
						width = slideDims.width + 'px';
						height = slideDims.height + 'px';
						overflow = 'auto';
					}

					// Move slide to inner wrapper
					slideWrap.appendChild(slide);
				}

				// Event handlers
				$xu.addListener(wrapper, 'mouseover', function () {
					mouseStatus = 'over';
					stopSlider();
				});

				$xu.addListener(wrapper, 'mouseout', function () {
					mouseStatus = 'out';

					if (!options.stopAfterHover) {
						startSlider();
					}
				});

				// Navigation event handlers
				if (nav.length === 1) {
					var anchors = NW.Dom.select('.experis-slider > ul a', wrapper.parentNode);

					// Add "selected" class to first slide
					anchors[0].parentNode.className += ' selected';

					for (var n = 0, anchor; anchor = anchors[n++]; ) {
						$xu.addListener(anchor, 'click', (function (n) {
							return function (e) {
								e = (window.event) ? window.event : e;

								gotoSlide(n);

								try {
									e.preventDefault();
								} catch (exc) {
									e.returnValue = false;
								}
							}
						})(n));
					}
				}

				// Add navigation arrows
				if (options.showArrows) {
					var arrowWrap = document.createElement('div');
					var prevArrow = document.createElement('a');
					var nextArrow = document.createElement('a');

					arrowWrap.className = 'experis-slider-arrows';

					prevArrow.className = 'experis-slider-prev';
					prevArrow.setAttribute('href', 'javascript:void(0)');
					prevArrow.innerHTML = '&lt;';

					nextArrow.className = 'experis-slider-next';
					nextArrow.setAttribute('href', 'javascript:void(0)');
					nextArrow.innerHTML = '&gt;';

					arrowWrap.appendChild(prevArrow);
					arrowWrap.appendChild(nextArrow);

					wrapper.insertBefore(arrowWrap, slidePanel);

					$xu.addListener(prevArrow, 'click', function () {
						var prevSlide = (curSlide > 1) ? curSlide - 1 : slides.length;
						gotoSlide(prevSlide);
					});

					$xu.addListener(nextArrow, 'click', function () {
						var nextSlide = (curSlide < slides.length) ? curSlide + 1 : 1;
						gotoSlide(nextSlide);
					});
				}

				// Methods
				var runTransition = function (slideNum, callback) {
					if (transTimer > 0) return; // transition is already running

					var fps = 30;
					var nextSlide = slides[slideNum - 1];
					var direction = (slideNum > curSlide || curSlide === slides.length && slideNum === 1) ? 1 : -1;

					transTimer = 1;

					switch (options.transType) {
						/* Slide next photo over top of current photo */ 
						case 'slide':
							// Clone next slide and absolutely position outside the wrapper
							var slideCopy = nextSlide.cloneNode(true);

							slideCopy.style.position = 'absolute';
							slideCopy.style.top = '0';
							slideCopy.style.left = (direction === 1) ? slideDims.width + 'px' : -slideDims.width + 'px';

							slidePanel.appendChild(slideCopy);

							// Move slide over top of current slide
							$xfx.animate(slideCopy, { left: '0px' }, options.transTime, options.transEasing, function () {
								// Move slideWrap's position to next slide and remove cloned slide
								slideWrap.style.left = -(slideNum - 1) * slideDims.width + 'px';
								slidePanel.removeChild(slideCopy);
								transTimer = 0;

								if (callback) callback();
							});

							break;
						/* Fade next photo view by adjusting opacity */ 
						case 'fade':
							// Clone next slide, set opacity to zero, and absolutely position it above currently slide
							var slideCopy = nextSlide.cloneNode(true);

							$xu.setStyle(slideCopy, {
								position: 'absolute',
								top: '0',
								left: '0',
								opacity: 0
							});

							slidePanel.appendChild(slideCopy);

							// Fade cloned slide to 100% opacity
							$xfx.animate(slideCopy, { opacity: 1 }, options.transTime, options.transEasing, function () {
								// Move slideWrap's position to next slide and remove cloned slide
								slideWrap.style.left = -(slideNum - 1) * slideDims.width + 'px';
								slidePanel.removeChild(slideCopy);
								transTimer = 0;

								if (callback) callback();
							});

							break;
						/* Fade to a color, then fade in the new slide */
						case 'flash':
							var bg = '#fff';

							// Create empty "cover" slide and position over the current slide
							var cover = document.createElement('div');

							with (cover.style) {
								position = 'absolute';
								top = '0';
								left = '0';
								width = slideDims.width + 'px';
								height = slideDims.height + 'px';
								opacity = 0;
								backgroundColor = bg;
							}

							if (ieVersion > -1 && ieVersion < 9) {
								cover.style.filter = 'progid:DXImageTransform.Microsoft.Alpha(opacity=0)';
							}

							slidePanel.appendChild(cover);

							// Fade in "cover" slide
							$xfx.animate(cover, { opacity: 1 }, options.transTime / 2, options.transEasing, function () {
								// Position next slide under the cover slide
								slideWrap.style.left = -(slideNum - 1) * slideDims.width + 'px';

								// Fade out the cover slide and then remove it
								$xfx.animate(cover, { opacity: 0 }, options.transTime / 2, options.transEasing, function () {
									slidePanel.removeChild(cover);
									transTimer = 0;

									if (callback) callback();
								});
							});

							break;
							/* Wipe current photo out of the viewing area by sliding the next photo into view */
						case 'wipe':
							// Move slide wrapper to new position
							$xfx.animate(slideWrap, { left: -(slideNum - 1) * slideDims.width + 'px' }, options.transTime, options.transEasing, function () {
								transTimer = 0;
								if (callback) callback();
							});

							break;
					}
				};

				var gotoSlide = function (slideNum) {
					if (curSlide !== slideNum) {
						stopSlider();

						// Reset any video elements
						var videos = slides[slideNum - 1].getElementsByTagName('video');

						for (var n = 0, video; video = videos[n++]; ) {
							try {
								video.currentTime = 0;
								video.pause();
							} catch (exc) {
								// Video not supported or not loaded
							}
						}

						// Play transition
						runTransition(slideNum, function () {
							curSlide = slideNum;

							if (nav.length === 1) {
								// Add "selected" class to current navigation item
								var items = NW.Dom.select('.experis-slider > ul li', wrapper.parentNode);

								for (var n = 0, item; item = items[n++];) {
									item.className = item.className.replace(' selected', '');
								}

								items[curSlide - 1].className += ' selected';
							}

							if (mouseStatus === 'out') startSlider();
						});
					}
				};

				var startSlider = function () {
					timer = setInterval(function () {
						var nextSlide = (curSlide < slideCount) ? curSlide + 1 : 1;
						gotoSlide(nextSlide);
					}, options.delay);
				};

				var stopSlider = function () {
					clearInterval(timer);
				};

				// Time to slide, Quinn.
				startSlider();
			});
		});
	},
	/*
	* textCollapse(dom element array[, object])
	* Adds a "more" link at the end of a clipped block of text that can be clicked to
	* expand and view the full text.
	*/
	textCollapse: function (els, options) {
		var defaults = {
			lines: 4,
			moreLabel: 'More',
			lessLabel: 'Less'
		};

		options = $xu.mergeJson(defaults, options);

		var expand = function (el) {
			var a = el.parentNode.lastChild.getElementsByTagName('a')[0];

			a.setAttribute('data-status', 'expanded');
			a.firstChild.nodeValue = options.lessLabel;

			el.style.height = a.getAttribute('data-fullheight');
		};

		var collapse = function (el) {
			var a = el.parentNode.lastChild.getElementsByTagName('a')[0];

			a.setAttribute('data-status', 'collapsed');
			a.firstChild.nodeValue = options.moreLabel;

			el.style.height = options.lines * $xu.getLineHeight(el) + 'px';
		};

		// Setup
		for (var n = 0, len = els.length; n < len; n++) {
			var el = els[n];
			var curHeight = el.clientHeight;
			var lineHeight = $xu.getLineHeight(el);

			if (curHeight > options.lines * lineHeight) {
				// Clip text and add "more" link
				var wrapper = document.createElement('div');
				var moreBox = document.createElement('div');
				var moreLink = document.createElement('a');

				moreBox.setAttribute('class', 'experis-text-expander');
				moreLink.setAttribute('href', 'javascript:void(0);');
				moreLink.setAttribute('data-status', 'collapsed');
				moreLink.setAttribute('data-fullheight', $xu.getDimensions(el).height + 'px');

				wrapper.style.WebkitTransition = 'height 0.5s ease-out';
				wrapper.style.MozTransition = 'height 0.5s ease-out';
				wrapper.style.transition = 'height 0.5s ease-out';
				wrapper.style.height = options.lines * lineHeight + 'px';
				wrapper.style.overflow = 'hidden';

				wrapper.innerHTML = el.innerHTML;
				el.innerHTML = '';
				el.appendChild(wrapper);

				moreLink.appendChild(document.createTextNode(options.moreLabel));
				moreBox.appendChild(moreLink);
				el.appendChild(moreBox);

				// Add event handler
				$xu.addListener(moreLink, 'click', function (e) {
					e = e || event;

					var target = (e.target) ? e.target : e.srcElement;

					if (target.getAttribute('data-status') === 'collapsed') {
						expand(target.parentNode.parentNode.firstChild);
					} else {
						collapse(target.parentNode.parentNode.firstChild);
					}
				});
			}
		}
	},
	/*
	* eventTimeline(dom element[, object])
	* Converts a listing of news/event entries into an interactive timeline
	*/
	eventTimeline: function (wrapper, options) {
		$xu.includeScript($x.path + 'experis.fx.js', function () {
			var defaults = {
				months: 4,
				monthWidth: 200,
				sort: 'ascending',
				borderColor: '#000',
				legendColors: {
					random: ['#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f', '#f90', '#f09', '#0f9', '#09f', '#90f', '#9f0']
				}
			};

			options = $xu.mergeJson(defaults, options);

			$xu.includeScript($x.cdn.nwmatcher, function () {
				// Get data from HTML
				var eventItems = NW.Dom.select('div[data-category]', wrapper);
				var eventDetails = [];

				for (var n = 0, item; item = eventItems[n++];) {
					var h2 = NW.Dom.select('h2', item)[0];
					var a = NW.Dom.select('a', item)[0];
					var eventDate = new Date(Date.parse(h2.innerHTML));
					var url = a.getAttribute('href');
					var category = item.getAttribute('data-category');

					eventDetails.push({
						date: eventDate,
						category: category,
						url: url,
						html: item.innerHTML
					});
				}

				// Create new timeline structure
				var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

				if (eventDetails.length > 0) {
					var today = new Date();
					var curMonth = (options.sort == 'ascending') ? today.getMonth() : eventDetails[0].date.getMonth();

					wrapper.style.height = '2em';
					wrapper.style.borderBottom = '1px solid ' + options.borderColor;

					for (var n = 0; n < options.months; n++) {
						var div = document.createElement('div');      // Month wrapper
						var heading = document.createElement('span'); // Month heading
						var eventMonth, headingText;

						if (options.sort == 'ascending') {
							eventMonth = (curMonth + n < monthNames.length) ? curMonth + n : curMonth + n - monthNames.length;
						} else {
							eventMonth = (curMonth - n >= 0) ? curMonth - n : curMonth - n + monthNames.length;
						}

						headingText = monthNames[eventMonth];
						div.className = 'experis-timeline-month';
						
						with (div.style) {
							position = 'relative';
							cssFloat = 'left';
							styleFloat = 'left';
							paddingLeft = '10px';
							width = options.monthWidth - 10 + 'px';
							height = '2em';
							borderLeft = '1px solid ' + options.borderColor;
						}

						heading.className = 'experis-timeline-heading';
						heading.appendChild(document.createTextNode(headingText));

						div.appendChild(heading);

						for (var m = 0, detail; detail = eventDetails[m++];) {
							if (detail.date.getMonth() === eventMonth) {
								// Place hyperlink and tooltip
								var a = document.createElement('a');
								var tooltip = document.createElement('div');

								a.setAttribute('href', detail.url);
								a.setAttribute('data-category', detail.category);

								// Get category color
								var markerColor;

								if (options.legendColors[detail.category]) {
									markerColor = options.legendColors[detail.category];
								} else {
									var rand = Math.floor(Math.random() * options.legendColors.random.length);

									markerColor = options.legendColors.random[rand];
									options.legendColors.random.splice(rand, 1);
									options.legendColors[detail.category] = markerColor;
								}

								// Position hyperlink on timeline
								var leftPos;

								if (options.sort == 'ascending') {
									leftPos = parseInt(detail.date.getDate() / 31 * options.monthWidth) + 'px';
								} else {
									leftPos = options.monthWidth - parseInt(detail.date.getDate() / 31 * options.monthWidth) + 'px';
								}

								with (a.style) {
									position = 'absolute';
									bottom = '-5px';
									left = leftPos;
									display = 'block';
									width = '10px';
									height = '10px';
									borderRadius = '50%';
									backgroundColor = markerColor;
								}

								tooltip.className = 'experis-timeline-tooltip';

								with (tooltip.style) {
									position = 'absolute';
									bottom = '20px';
									left = parseInt(options.monthWidth / -2.5) + 'px';
									width = parseInt(options.monthWidth / 1.25) + 'px';
									display = 'none';
								}

								// Add tooltip event handlers
								$xu.addListener(a, 'mouseover', (function (tooltip) {
									return function () {
										tooltip.style.display = 'block';
									};
								})(tooltip));

								$xu.addListener(a, 'mouseout', (function (tooltip) {
									return function () {
										tooltip.style.display = 'none';
									};
								})(tooltip));

								tooltip.innerHTML = detail.html;
								a.appendChild(tooltip);
								div.appendChild(a);
							}
						}

						wrapper.insertBefore(div, eventItems[0]);
					}

					// Add legend
					var legend = document.createElement('ul');

					legend.className = 'experis-timeline-legend';

					for (var key in options.legendColors) {
						if (key !== 'random') {
							var item = document.createElement('li');

							item.innerHTML = '<span data-category="' + key + '" style="display:inline-block; width:10px; height:10px; background-color:' + options.legendColors[key] + '"></span> ' + key;
							legend.appendChild(item);
						}
					}

					wrapper.appendChild(legend);
				}

				// Remove old HTML
				for (var n = 0, item; item = eventItems[n++];) {
					wrapper.removeChild(item);
				}
			});
		});
	}
};

// Create shortcut
var $xw = experis.widgets;