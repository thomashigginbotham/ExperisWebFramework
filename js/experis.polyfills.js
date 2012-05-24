/*  ______                      _          ____        __       _____ ____     
   / ____/_  ______  ___  _____(_)_____   / __ \____  / /__  __/ __(_) / /_____
  / __/  | |/_/ __ \/ _ \/ ___/ // ___/  / /_/ / __ \/ // / / / /_/ / / // ___/
 / /___ _>  </ /_/ /  __/ /  / /(__  )  / ____/ /_/ / // /_/ / __/ / / /(__  ) 
/_____//_/|_/ .___/\___/_/  /_//____/  /_/    \____/_/ \__, /_/ /_/_/_//____/  
           /_/  Experis JS Polyfills Library (v. 0.1) /____/                 */

if (!experis) { alert('You must include experis.utils.js before using the Experis Polyfills library.'); }

experis.polyfills = {
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
		if (!vidWidth) vidWidth = 320;
		if (!vidHeight) vidHeight = 240;

		$xu.addListener(window, 'load', function () {
			$xu.includeScript($x.path + 'flowplayer/flowplayer-3.2.6.min.js', function () {
				// Check if video loaded, and if not, use FlowPlayer
				var videos = document.getElementsByTagName('video');

				for (var n = 0, len = videos.length; n < len; n++) {
					if (!videos[n].currentSrc || videos[n].networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
						var children = videos[n].childNodes;

						for (m = 0, child_len = children.length; m < child_len; m++) {
							if (children[m].nodeName.toLowerCase() === 'a') {
								// Move anchor above video and hide video
								var clone = children[m].cloneNode(true);

								clone.id = clone.id + '-clone';

								videos[n].parentNode.insertBefore(clone, videos[n]);
								videos[n].style.display = 'none';

								// Set video dimensions and call flowplayer()
								clone.style.display = 'block';
								clone.style.width = vidWidth + 'px';
								clone.style.height = vidHeight + 'px';

								flowplayer(clone.id, $x.path + 'flowplayer/flowplayer-3.2.7.swf', { clip: { autoPlay: false} });

								// Sometimes IE doesn't load the player on the first try
								if (clone.innerHTML.toLowerCase().indexOf('<object') == -1) {
									flowplayer(clone.id, $x.path + 'flowplayer/flowplayer-3.2.7.swf', { clip: { autoPlay: false} });
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