/*  ______                     _         _______  __
   / ____/  ______  ___  _____(_)____   / ____/ |/ /
  / __/ | |/_/ __ \/ _ \/ ___/ / ___/  / /_   |   / 
 / /____>  </ /_/ /  __/ /  / (__  )  / __/  /   |  
/_____/_/|_/ .___/\___/_/  /_/____/  /_/    /_/|_|  
          /_/                                      */

if (!experis) { alert('You must include experis.utils.js before using Experis FX.'); }

experis.fx = {
	/*
	* linearTrans(number, number, number)
	* start: the number with which to start
	* end:   the number at the end of the transition
	* len:   the number of steps in the transition
	*/
	linearTrans: function (start, end, len) {
		var transValues = [];
		var step = (end - start) / len;

		for (var n = 0; n < len; n++) {
			transValues.push(start + step * n);
		}

		transValues.push(end);

		return transValues;
	}
};

// Create shortcut
var $xfx = experis.fx;