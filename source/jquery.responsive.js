// $(selector).responsive({condition});
// $(selector).responsive([{condition1}, {condition2}]);
$.fn.responsive = function(conditions) {

	/* conditions = {
		at: 0, // threshold value
		switchTo: '', // classname to apply to the node
		alsoSwitch: {
			'selector': 'class'
		}
		switchStylesheet: '',
		targetFunction: '',
		reverseFunction: ''
	} */

	if (conditions) {
		
		var elem = this,
			options = {
				elementWidth: function() {
					return elem.outerWidth(true);
				},
				conditions: conditions
			};

		$.responsive(elem, options);
	}

	return this;
};

/*
$.responsive({
	elementWidth: function() {} // width calculation of the target element
}, {
	condition1
});

$.responsive({
	elementWidth: function() {} // width calculation of the target element
}, [{
	condition1
}, {
	condition2
}]);
*/

/*var defaultOptions = {
	// main element width to calculate
	elementWidth: function() {}, // a function that returns pixel value

	// array of conditions of ascending thresholdWidth
	conditions: [{

		// threshold for this condition
		at: 0,

		// condition specific options
		switchTo: '',
		alsoSwitch: {}, //  objects with element and class
		switchStylesheet: '',
		targetFunction: '', // function to run
		reverseFunction: '' // reverse function that reverses any action in target function
	}]
}*/

$.responsive = function(elem, options) {

	// Make sure that single condition object gets convert into array any how
	options.conditions = $.makeArray(options.conditions);

	// Accept node, selectors, jQuery elements.
	var elem = $(elem);
		
		resizeWindow = $(window),

		// Debounce resize handler to ensure it won't
		// choke up browser when window is resized.
		resizeHandler =
			$.debounce(function(){
				$.responsive.update.call(elem, options);
			}, 250),

		// Get resize event namespace if it exists
		resizeEvent = elem.data("responsiveResize") ||

			// Create a new resize event namespace if it
			// hasn't been created yet for this element.
			(function(){
				resizeEvent = "resize." + $.uid();
				elem.data("responsiveResize", resizeEvent);
				return resizeEvent;
			})();

	resizeWindow
		// Ensure any previous resize handler is unbinded
		.off(resizeEvent)
		// before we bind a new resize handler with new options.
		.on(resizeEvent, resizeHandler);

	// This is debounced, if there were multiple $.fn.responsive()
	// being called in a single chain, only the last one gets executed.
	resizeHandler();
};

$.responsive.update = function(options) {

	var node = this,
		totalConditions = options.conditions.length;

	$.responsive.sortConditions(options);

	var elementWidth;

	// calculate element width
	if ($.isFunction(options.elementWidth)) {
		elementWidth = options.elementWidth();
	} else {
		elementWidth = options.elementWidth;
	}

	// loop through each condition
	$.each(options.conditions, function(i, condition) {
		var conditionOptions = $.responsive.properConditions(condition);

		var thresholdWidth = condition.at;

		// calculate threshold width
		if ($.isFunction(condition.at)) {
			thresholdWidth = condition.at();
		} else {
			thresholdWidth = condition.at;
		}

		// perform resize if element <= threshold
		if (elementWidth <= thresholdWidth) {

			// remove all other condition first
			$.responsive.resetToDefault.call(node, options.conditions, i);

			// apply current condition
			$.responsive.resize.call(node, conditionOptions);
			return false;
		} else {
			$.responsive.deresize.call(node, conditionOptions);
		}
	});
}

$.responsive.resize = function(condition) {
	var node = this;

	if (condition.switchTo) {
		$.each(condition.switchTo, function(i, classname) {
			node.addClass(classname);
		});
	}

	if (condition.alsoSwitch) {
		$.each(condition.alsoSwitch, function(selector, classname) {
			$(selector).addClass(classname);
		});
	}

	if (condition.targetFunction) {
		condition.targetFunction();
	}

	if (condition.switchStylesheet) {
		$.each(condition.switchStylesheet, function(i, stylesheet) {
			var tmp = $('link[href$="' + stylesheet + '"]');
			if (tmp.length < 1) {
				$('<link/>', {
					rel: 'stylesheet',
					type: 'text/css',
					href: stylesheet
				}).appendTo('head');
			}
		});
	}
};

$.responsive.deresize = function(condition) {
	var node = this;

	if (condition.switchTo) {
		$.each(condition.switchTo, function(i, classname) {
			node.removeClass(classname);
		});
	}

	if (condition.alsoSwitch) {
		$.each(condition.alsoSwitch, function(selector, classname) {
			$(selector).removeClass(classname);
		});
	}

	if (condition.reverseFunction) {
		condition.reverseFunction();
	}

	if (condition.switchStylesheet) {
		$.each(condition.switchStylesheet, function(i, stylesheet) {
			$('link[href$="' + stylesheet + '"]').remove();
		});
	}
};

$.responsive.resetToDefault = function(options, current) {
	var node = this;
	$.each(options, function(i, condition) {

		var conditionOptions = $.responsive.properConditions(condition);

		if (current && i == current) {
			return true;
		} else {
			$.responsive.deresize.call(node, conditionOptions);
		}
	});
};

$.responsive.properConditions = function(condition) {
	var conditionOptions = {
		at: condition.at,
		alsoSwitch: condition.alsoSwitch,
		switchTo: $.makeArray(condition.switchTo),
		switchStylesheet: $.makeArray(condition.switchStylesheet),
		targetFunction: condition.targetFunction,
		reverseFunction: condition.reverseFunction
	};

	return conditionOptions;
};

$.responsive.sortConditions = function(options) {
	var totalConditions = options.conditions.length;

	for (var i = 0; i < totalConditions; i++) {
		for (var j = i + 1; j < totalConditions; j++) {
			var a, b;

			if ($.isFunction(options.conditions[i].at)) {
				a = options.conditions[i].at();
			} else {
				a = options.conditions[i].at;
			}

			if ($.isFunction(options.conditions[j].at)) {
				b = options.conditions[j].at();
			} else {
				b = options.conditions[j].at;
			}

			if (a > b) {
				var tmp = options.conditions[i];
				options.conditions[i] = options.conditions[j];
				options.conditions[j] = tmp;
			}
		}
	}
};