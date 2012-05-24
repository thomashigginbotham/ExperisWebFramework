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
	slider: function (el, options) {
		var timer, sliderWidth, sliderHeight, imageWidth, imageHeight;

		// Default options
		defaults = {
			delay: 5000,
			transTime: 500,
			transEffect: 'slide', // 'slide' or 'fade' ('fade' setting is problematic in IE)
			finishEffect: 'cycle', // 'cycle' (cycles back through slides at end) or 'none' (proceeds to first slide at end as if it were next in line)
			showArrows: true,
			width: null,
			height: null,
			imagesPerSlide: 1 // Only one image is assumed per slide by default
		}

		options = $xu.mergeJson(defaults, options);

		$xu.onDomReady(function () {
			// Use jQuery for animation
			$xu.includeScript($x.cdn.jquery, function () {
				(function ($) {
					var slider = $(el);
					var slides = slider.find('>div');
					var navLinks = slider.find('>ul li a');
					var firstImg = slider.find('> div').eq(0).find('img');

					if (slider.length === 0) return;

					var animate = function (posX, directionalNav) {
						if (options.transEffect === 'slide') {
							// Use sliding transition
							if (directionalNav && options.finishEffect === 'none') {
								if (posX === 0 || typeof (posX) !== 'string') {
									// Create a copy of the first/last slide(s) and place it at the end/beginning of the slider
									var imgCopies = [];
									var changeOperator = (posX === 0) ? '-=' : '+=';

									for (var n = 0; n <= options.imagesPerSlide; n++) {
										var imgCopy = (posX === 0) ? slides.eq(n).clone() : slides.eq(slides.length - n).clone();

										imgCopy
											.css('position', 'absolute')
											.css('top', 0)

										if (posX === 0) {
											imgCopy.css('left', imageWidth * slides.length + n * imageWidth);
											wrapper.append(imgCopy);
										} else {
											imgCopy.css('left', -imageWidth * n);
											wrapper.prepend(imgCopy);
										}

										imgCopies.push(imgCopy);
									}

									// Slide the main images out of the view area to reveal the copied image(s)
									wrapper.animate({ 'left': changeOperator + (imageWidth * (options.imagesPerSlide)) }, options.transTime, function () {
										// Move the slider back to the first slide and delete the copied slide
										wrapper.css('left', posX);

										for (var n = 0; n <= options.imagesPerSlide; n++) {
											imgCopies[n].remove();
										}
									});

									return;
								}
							}

							wrapper.animate({ 'left': posX }, options.transTime);
						} else {
							// Use fading transition
							// To do this, we're going to make a copy of the slides, and hide it under the main slider.
							// Then we'll adjust the opacity of the top slider to reveal the slides below.
							if (!$.browser.msie) {
								var subwrapper = wrapper.clone();

								subwrapper.css({ position: 'absolute', zIndex: '0' });

								wrapper.parent().append(subwrapper);

								subwrapper.animate({ 'left': posX }, 0, function () {
									wrapper.stop().animate({ 'opacity': 0 }, options.transTime, function () {
										wrapper.animate({ 'left': posX }, 0);
										wrapper.css('opacity', 1);
										subwrapper.remove();
									});
								});
							} else {
								// IE has problems with the opacity. Move to the next slide without a transition.
								wrapper.css('left', posX);
							}
						}
					};

					var advanceSlider = function () {
						var leftPos = wrapper.position().left;
						var posX = (leftPos <= (-sliderWidth * (slides.length - 1) + 2) / options.imagesPerSlide) ? 0 : '-=' + sliderWidth;

						// Add selected class to navigation
						var navParents = slider.find('>ul li');
						var nextSlideNum = (posX == 0) ? 0 : Math.abs(leftPos - sliderWidth - 1) / sliderWidth;

						navParents.removeClass('selected');
						navParents.eq(nextSlideNum).addClass('selected');

						// Advance the slider
						animate(posX, true);
					};

					var gotoSlide = function (href) {
						stopSlider();

						// Trim possible absolute path from href
						var hrefParts = href.split('#');
						href = '#' + hrefParts[hrefParts.length - 1];

						var slide = $(href);
						var posX = -sliderWidth * (slide.position().left / sliderWidth);
						var parent = slider.find('a[href="' + href + '"]').parent();

						parent.siblings().removeClass('selected');
						parent.addClass('selected');

						animate(posX);

						startSlider();
					};

					var startSlider = function () {
						if (!timer) timer = setInterval(advanceSlider, options.delay);
					};

					var stopSlider = function () {
						clearInterval(timer);
						timer = false;
					};

					// Add wrapper around slides
					var wrapper = $('<div class="experis-slider-wrap"></div>');

					wrapper
						.append(slides)
						.css('position', 'relative')
						.css('width', '50000px')
						.css('z-index', 1);

					slides.css('float', 'left');

					slider
						.css('position', 'relative')
						.append(wrapper);

					var init = function () {
						// Use first image to determine slider dimensions
						imageWidth = firstImg.width();
						imageHeight = firstImg.height();
						sliderWidth = (options.width) ? options.width : imageWidth * options.imagesPerSlide;
						sliderHeight = (options.height) ? options.height : imageHeight * options.imagesPerSlide;

						slider
							.width(sliderWidth)
							.height(sliderHeight)
							.css('overflow', 'hidden');

						// Hook up event handlers
						slider.hover(function () {
							stopSlider();
						}, function () {
							startSlider();
						});

						navLinks.click(function () {
							gotoSlide(this.getAttribute('href'));
							return false;
						});

						// Add navigation arrows
						if (options.showArrows) {
							var arrowNav = $('<ul class="experis-slider-arrows" style="position:absolute; z-index:2"><li class="experis-slider-prev"><a href="#">&lt;</a></li><li class="experis-slider-next"><a href="#">&gt;</a></li></ul>');

							arrowNav.insertBefore(wrapper.parent());

							arrowNav.find('.experis-slider-prev').click(function () {
								stopSlider();

								var leftPos = wrapper.position().left;
								var lastSlidePos = -sliderWidth * (slides.length - 1) / options.imagesPerSlide;
								var posX = (leftPos >= 0) ? lastSlidePos : '+=' + sliderWidth;

								// Add selected class to navigation
								var navParents = slider.find('>ul li');
								var prevSlideNum = (posX === lastSlidePos) ? slides.length - 1 : Math.abs(leftPos + sliderWidth - 1) / sliderWidth;

								navParents.removeClass('selected');
								navParents.eq(prevSlideNum).addClass('selected');

								// Continue
								animate(posX, true);

								return false;
							});

							arrowNav.find('.experis-slider-next').click(function () {
								stopSlider();
								advanceSlider();
								startSlider();

								return false;
							});
						}

						// Time to slide, Quinn.
						navLinks.eq(0).parent().addClass('selected');
						startSlider();
					};

					if ($.browser.msie) {
						init();
					} else {
						$xu.addListener(window, 'load', init);
					}
				})(jQuery);
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
	}
};

// Create shortcut
var $xw = experis.widgets;