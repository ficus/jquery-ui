/*!
 * jQuery UI Calendar @VERSION
 * http://jqueryui.com
 *
 * Copyright 2014 jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */

//>>label: Datepicker
//>>group: Widgets
//>>description: Displays a calendar for inline date selection.
//>>docs: http://api.jqueryui.com/calendar/
//>>demos: http://jqueryui.com/calendar/

(function( factory ) {
	if ( typeof define === "function" && define.amd ) {

		// AMD. Register as an anonymous module.
		// TODO Add globalize and $.date
		// TODO: Keep button even if its optional?
		define([
			"jquery",
			"./core",
			"./widget",
			"./button"
		], factory );
	} else {

		// Browser globals
		factory( jQuery );
	}
}(function( $ ) {

return $.widget( "ui.calendar", {
	version: "@VERSION",
	options: {
		buttons: [],
		dateFormat: { date: "short" },
		eachDay: $.noop,
		max: null,
		min: null,
		numberOfMonths: 1,
		showWeek: false,
		value: null,

		// callbacks
		select: null
	},

	refreshRelatedOptions: {
		eachDay: true,
		max: true,
		min: true,
		showWeek: true,
		value: true
	},

	_create: function() {
		this.id = this.element.uniqueId().attr( "id" );
		this.labels = Globalize.translate( "datepicker" );
		this.buttonClickContext = this.element[ 0 ];

		this.date = $.date( this.options.value, this.options.dateFormat ).select();
		this.date.eachDay = this.options.eachDay;

		this._on( this.element, {
			"click .ui-calendar-prev": function( event ) {
				event.preventDefault();
				this.date.adjust( "M", -this.options.numberOfMonths );
				this.refresh();
			},
			"click .ui-calendar-next": function( event ) {
				event.preventDefault();
				this.date.adjust( "M", this.options.numberOfMonths );
				this.refresh();
			},
			"mousedown .ui-calendar-calendar button": function( event ) {
				event.preventDefault();

				// TODO Exclude clicks on lead days or handle them correctly
				// TODO Store/read more then just date, also required for multi month picker
				this._select( event, $( event.currentTarget ).data( "timestamp" ) );
				this.grid.focus();
			},
			"mouseenter .ui-calendar-header button": "_hover",
			"mouseleave .ui-calendar-header button": "_hover",
			"mouseenter .ui-calendar-calendar button": "_hover",
			"mouseleave .ui-calendar-calendar button": "_hover",
			"keydown .ui-calendar-calendar": "_handleKeydown"
		});

		this._createCalendar();
	},

	_hover: function( event ) {
		$( event.currentTarget ).toggleClass( "ui-state-hover" );
	},

	_handleKeydown: function( event ) {
		var oldMonth = this.date.month(),
			oldYear = this.date.year();

		// TODO: Handle for pickers with multiple months
		switch ( event.keyCode ) {
		case $.ui.keyCode.ENTER:
			this.activeDescendant.mousedown();
			return;
		case $.ui.keyCode.PAGE_UP:
			this.date.adjust( event.altKey ? "Y" : "M", -1 );
			break;
		case $.ui.keyCode.PAGE_DOWN:
			this.date.adjust( event.altKey ? "Y" : "M", 1 );
			break;
		case $.ui.keyCode.END:
			this.date.setDay( this.date.daysInMonth() );
			break;
		case $.ui.keyCode.HOME:
			this.date.setDay( 1 );
			break;
		case $.ui.keyCode.LEFT:
			this.date.adjust( "D", -1 );
			break;
		case $.ui.keyCode.UP:
			this.date.adjust( "D", -7 );
			break;
		case $.ui.keyCode.RIGHT:
			this.date.adjust( "D", 1 );
			break;
		case $.ui.keyCode.DOWN:
			this.date.adjust( "D", 7 );
			break;
		default:
			event.preventDefault();
			return;
		}

		if ( this.date.month() !== oldMonth || this.date.year() !== oldYear ) {
			this.refresh();
			this.grid.focus();
		}

		this._setActiveDescendant();
	},

	_setActiveDescendant: function() {
		var id = this.id + "-" + this.date.day();

		this.grid
			.attr( "aria-activedescendant", id )
			.find( ".ui-state-focus" )
			.removeClass( "ui-state-focus" );

		this.activeDescendant = this.grid.find(
			this._sanitizeSelector( "#" + id ) + " > button"
		).addClass( "ui-state-focus" );
	},

	_createCalendar: function() {
		var classes = "ui-calendar ui-widget ui-widget-content ui-helper-clearfix ui-corner-all",
			pickerHtml = "";

		if ( this.options.numberOfMonths === 1 ) {
			pickerHtml = this._buildHeader() + this._buildGrid();
		} else {
			pickerHtml = this._buildMultiplePicker();
			classes += " ui-calendar-multi";
		}

		this.element
			.addClass( classes )
			.attr({
				role: "region",
				"aria-labelledby": this.id + "-title"
			})
			.html( pickerHtml );

		this._createButtonPane();

		this.grid = this.element.find( ".ui-calendar-calendar" );
	},

	_buildMultiplePicker: function() {
		var headerClass,
			html = "",
			currentDate = this.date,
			months = this.date.months( this.options.numberOfMonths - 1 ),
			i = 0;

		for ( ; i < months.length; i++ ) {

			// TODO: Shouldn't we pass date as a parameter to build* fns instead of setting this.date?
			this.date = months[ i ];
			if ( months[ i ].first ) {
				headerClass = "ui-corner-left";
			} else if ( months[ i ].last ) {
				headerClass = "ui-corner-right";
			}

			html += "<div class='ui-calendar-group'>" +
				"<div class='ui-calendar-header ui-widget-header ui-helper-clearfix " +
				headerClass + "'>";
			if ( months[ i ].first ) {
				html += this._buildPreviousLink();
			} else if ( months[ i ].last ) {
				html += this._buildNextLink();
			}

			html += this._buildTitlebar() + "</div>" + this._buildGrid() + "</div>";
		}

		html += "<div class='ui-calendar-row-break'></div>";

		this.date = currentDate;

		return html;
	},

	_buildHeader: function() {
		return "<div class='ui-calendar-header ui-widget-header ui-helper-clearfix ui-corner-all'>" +
				this._buildPreviousLink() +
				this._buildNextLink() +
				this._buildTitlebar() +
			"</div>";
	},

	_buildPreviousLink: function() {
		var prevText = this._getTranslation( "prevText" );

		return "<button class='ui-calendar-prev ui-corner-all' title='" +
					prevText + "'>" +
			"<span class='ui-icon ui-icon-circle-triangle-w'>" +
				prevText +
			"</span>" +
		"</button>";
	},

	_buildNextLink: function() {
		var nextText = this._getTranslation( "nextText" );

		return "<button class='ui-calendar-next ui-corner-all' title='" +
					nextText + "'>" +
			"<span class='ui-icon ui-icon-circle-triangle-e'>" +
				nextText +
			"</span>" +
		"</button>";
	},

	_buildTitlebar: function() {
		return "<div role='header' id='" + this.id + "-title'>" +
			"<div id='" + this.id + "-month-label' class='ui-calendar-title'>" +
					this._buildTitle() +
				"</div>" +
				"<span class='ui-helper-hidden-accessible'>, " +
					this._getTranslation( "datePickerRole" ) +
				"</span>" +
			"</div>";
	},

	_buildTitle: function() {
		return "<span class='ui-calendar-month'>" +
			this.date.monthName() +
		"</span> " +
		"<span class='ui-calendar-year'>" +
			this.date.year() +
		"</span>";
	},

	_buildGrid: function() {
		return "<table class='ui-calendar-calendar' role='grid' aria-readonly='true' " +
				"aria-labelledby='" + this.id + "-month-label' tabindex='0' " +
				"aria-activedescendant='" + this.id + "-" + this.date.day() + "'>" +
				this._buildGridHeading() +
				this._buildGridBody() +
			"</table>";
	},

	_buildGridHeading: function() {
		var cells = "",
			i = 0,
			weekDayLength = this.date.weekdays().length;

		if ( this.options.showWeek ) {
			cells += "<th class='ui-calendar-week-col'>" + this._getTranslation( "weekHeader" ) + "</th>";
		}
		for ( ; i < weekDayLength; i++ ) {
			cells += this._buildGridHeaderCell( this.date.weekdays()[ i ] );
		}

		return "<thead role='presentation'>" +
				"<tr role='row'>" + cells + "</tr>" +
			"</thead>";
	},

	_buildGridHeaderCell: function( day ) {
		return "<th role='columnheader' abbr='" + day.fullname + "' aria-label='" + day.fullname + "'>" +
				"<span title='" + day.fullname + "'>" +
					day.shortname +
				"</span>" +
			"</th>";
	},

	_buildGridBody: function() {

		// this.date.days() needs caching as it has O(n^2) complexity.
		var days = this.date.days(),
			i = 0,
			rows = "";

		for ( ; i < days.length; i++ ) {
			rows += this._buildWeekRow( days[ i ] );
		}

		return "<tbody role='presentation'>" + rows + "</tbody>";
	},

	_buildWeekRow: function( week ) {
		var cells = "",
			i = 0;

		if ( this.options.showWeek ) {
			cells += "<td class='ui-calendar-week-col'>" + week.number + "</td>";
		}
		for ( ; i < week.days.length; i++ ) {
			cells += this._buildDayCell( week.days[ i ] );
		}

		return "<tr role='row'>" + cells + "</tr>";
	},

	_buildDayCell: function( day ) {
		var content = "",
			attributes = [
				"role='gridcell'",
				"aria-selected='" + ( day.current ? true : false ) + "'"
			],
			selectable = ( day.selectable && this._isValid( new Date( day.timestamp ) ) );

		if ( day.render ) {
			attributes.push( "id='" + this.id + "-" + day.date + "'" );

			if ( !selectable ) {
				attributes.push( "aria-disabled='true'" );
				attributes.push( "class='ui-state-disabled'" );
			}

			content = this._buildDayElement( day, selectable );
		}

		return "<td " + attributes.join( " " ) + ">" + content + "</td>";
	},

	_buildDayElement: function( day, selectable ) {
		var attributes, content,
			classes = [ "ui-state-default" ];

		if ( day === this.date && selectable ) {
			classes.push( "ui-state-focus" );
		}
		if ( day.current ) {
			classes.push( "ui-state-active" );
		}
		if ( day.today ) {
			classes.push( "ui-state-highlight" );
		}
		// TODO Explain and document this
		if ( day.extraClasses ) {
			classes.push( day.extraClasses.split( " " ) );
		}

		attributes = " class='" + classes.join( " " ) + "'";
		if ( selectable ) {
			attributes += " tabindex='-1' data-timestamp='" + day.timestamp + "'";
		} else {
			attributes += " disabled='disabled'";
		}
		content = "<button" + attributes + ">" + day.date + "</button>";

		if ( day.today ) {
			content += "<span class='ui-helper-hidden-accessible'>, " + this._getTranslation( "currentText" ) + "</span>";
		}

		return content;
	},

	_createButtonPane: function() {
		this.buttonPane = $( "<div>" )
			.addClass( "ui-calendar-buttonpane ui-widget-content ui-helper-clearfix" );

		this.buttonSet = $( "<div>" )
			.addClass( "ui-calendar-buttonset" )
			.appendTo( this.buttonPane );

		this._createButtons();
	},

	_createButtons: function() {
		var that = this,
			buttons = this.options.buttons;

		this.buttonPane.remove();
		this.buttonSet.empty();

		if ( $.isEmptyObject( buttons ) || ( $.isArray( buttons ) && !buttons.length ) ) {
			this.element.removeClass( "ui-calendar-buttons" );
			return;
		}

		$.each( buttons, function( name, props ) {
			var click, buttonOptions;
			props = $.isFunction( props ) ?
				{ click: props, text: name } :
				props;

			// Default to a non-submitting button
			props = $.extend( { type: "button" }, props );

			// Change the context for the click callback to be the main element
			click = props.click;
			props.click = function() {
				click.apply( that.buttonClickContext, arguments );
			};
			buttonOptions = {
				icons: props.icons,
				text: props.showText
			};
			delete props.icons;
			delete props.showText;
			$( "<button></button>", props )
				.button( buttonOptions )
				.appendTo( that.buttonSet );
		});
		this.element.addClass( "ui-calendar-buttons" );
		this.buttonPane.appendTo( this.element );
	},

	// Refreshing the entire calendar during interaction confuses screen readers, specifically
	// because the grid heading is marked up as a live region and will often not update if it's
	// destroyed and recreated instead of just having its text change. Additionally, interacting
	// with the prev and next links would cause loss of focus issues because the links being
	// interacted with will disappear while focused.
	refresh: function() {
		this.labels = Globalize.translate( "datepicker" );

		// Determine which day gridcell to focus after refresh
		// TODO: Prevent disabled cells from being focused
		if ( this.options.numberOfMonths === 1 ) {
			this.grid = $( this._buildGrid() );
			this.element.find( ".ui-calendar-title" ).html( this._buildTitle() );
			this.element.find( ".ui-calendar-calendar" ).replaceWith( this.grid );
			$( ".ui-calendar-prev", this.element ).attr( "title", this.labels.prevText )
				.children().html( this.labels.prevText );
			$( ".ui-calendar-next", this.element ).attr( "title", this.labels.nextText )
				.children().html( this.labels.nextText );
			this._createButtons();
		} else {
			this._refreshMultiplePicker();
		}
	},

	_refreshMultiplePicker: function() {
		var i = 0;

		for ( ; i < this.options.numberOfMonths; i++ ) {
			this.element.find( ".ui-calendar-title" ).eq( i ).html( this._buildTitle() );
			this.element.find( ".ui-calendar-calendar" ).eq( i ).html( this._buildGrid() );
			this.date.adjust( "M", 1 );
		}
		this.date.adjust( "M", -this.options.numberOfMonths );

		// TODO: This assumes focus is on the first grid. For multi pickers, the widget needs
		// to maintain the currently focused grid and base queries like this off of it.
		this.element.find( ".ui-state-focus" ).not( ":first" ).removeClass( "ui-state-focus" );
	},

	_getTranslation: function( key ) {
		return $( "<a>" ).text( this.labels[ key ] ).html();
	},

	_sanitizeSelector: function( hash ) {
		return hash ? hash.replace( /[!"$%&'()*+,.\/:;<=>?@\[\]\^`{|}~]/g, "\\$&" ) : "";
	},

	_setHiddenPicker: function() {
		this.element.attr({
			"aria-hidden": "true",
			"aria-expanded": "false"
		});
	},

	_select: function( event, time ) {
		this.valueAsDate( new Date( time ) );
		this._trigger( "select", event );
	},

	value: function( value ) {
		if ( arguments.length ) {
			this.valueAsDate( Globalize.parseDate( value, this.options.dateFormat ) );
		} else {
			return Globalize.format( this.option( "value" ), this.options.dateFormat );
		}
	},

	valueAsDate: function( value ) {
		if ( arguments.length ) {
			this.option( "value", value );
		} else {
			return this.options.value;
		}
	},

	_isValid: function( value ) {
		if ( $.type( value ) !== "date" ) {
			return false;
		}

		if ( $.type( this.options.max ) === "date" ) {
			if ( value > this.options.max ) {
				return false;
			}
		}

		if ( $.type( this.options.min ) === "date" ) {
			if ( value < this.options.min ) {
				return false;
			}
		}

		return true;
	},

	_destroy: function() {
		this.element
			.off( ".calendar" )
			.removeClass( "ui-calendar ui-widget ui-widget-content ui-helper-clearfix ui-corner-all ui-calendar-multi" )
			.removeAttr( "role aria-labelledby" )
			.removeUniqueId()
			.empty();
	},

	_setOptions: function( options ) {
		var that = this,
			refresh = false;

		$.each( options, function( key, value ) {
			that._setOption( key, value );

			if ( key in that.refreshRelatedOptions ) {
				refresh = true;
			}
		});

		if ( refresh ) {
			this.refresh();
		}
	},

	_setOption: function( key, value ) {
		if ( key === "value" ) {
			if ( this._isValid( value ) ) {
				this.date.setTime( value.getTime() ).select();
				this._super( key, value );
			}
			return;
		}

		if ( key === "max" || key === "min" ) {
			if ( $.type( value ) === "date" || value === null ) {
				this._super( key, value );
			}
			return;
		}

		this._super( key, value );

		if ( key === "buttons" ) {
			this._createButtons();
		}

		if ( key === "disabled" ) {
			this.element
				.toggleClass( "ui-state-disabled", value )
				.attr( "aria-disabled", value );
		}

		if ( key === "eachDay" ) {
			this.date.eachDay = value;
		}

		if ( key === "dateFormat" ) {
			this.date.setFormat( value );
		}
	}
});

}));
