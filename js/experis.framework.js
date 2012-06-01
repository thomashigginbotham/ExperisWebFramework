/*  ______                      _          ______                                              __  
   / ____/_  ______  ___  _____(_)_____   / ____/_________ _____ ___  ___ _      ______  _____/ /__
  / __/  | |/_/ __ \/ _ \/ ___/ // ___/  / /_   / ___/ __ `/ __ `__ \/ _ \ | /| / / __ \/ ___/ //_/
 / /___ _>  </ /_/ /  __/ /  / /(__  )  / __/  / /  / /_/ / / / / / /  __/ |/ |/ / /_/ / /  / ,<   
/_____//_/|_/ .___/\___/_/  /_//____/  /_/    /_/   \__,_/_/ /_/ /_/\___/|__/|__/\____/_/  /_/|_|  
           /_/  Scripts for the Experis Web Framework                                            */

if (!experis) { alert('You must include experis.utils.js before using the Experis Framework.'); }

experis.framework = {
	fixColumnPercentageWidths: function () {
		var ieVersion = $xu.getIeVersion();

		if (ieVersion === -1 || ieVersion >= 8) { // Function doesn't work in IE 7 yet
			$xu.includeScript($x.path + 'experis.polyfills.js', function () {
				$xu.onDomReady(function () {
					var gutter = 2; // This needs to be pulled from style sheet
					var rows = $xu.getElementsByClassName('row');

					for (var n = 0, row; row = rows[n++]; ) {
						var children = $xu.getChildNodesByType(document.ELEMENT_NODE, row);
						var dims = [];

						for (var m = 0, child; child = children[m++]; ) {
							var cssClassParts = child.className.split('size-');
							var size, width, marginLeft, marginRight;

							for (var x = 1, len = cssClassParts.length; x < len; x++) {
								var piece = cssClassParts[x];
								size = parseInt(piece);

								if (size !== NaN) break;
							}

							width = (100 - gutter * (12 / size - 1)) / (12 / size);

							marginLeft = (m > 1) ? gutter / 2 : 0;
							marginRight = (m < children.length) ? gutter / 2 : 0;

							dims.push({ width: width, marginLeft: marginLeft, marginRight: marginRight });
						}

						$xp.fixSubpixelWidths(row, dims);
					}
				});
			});
		}
	}
};

// Create shortcut
var $xf = experis.framework;