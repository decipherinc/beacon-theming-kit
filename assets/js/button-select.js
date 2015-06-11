(function($){

    // begin atm1d class
    var atm1d = function(options){

        var _me = this;

        // begin classes
        // HTML element classes for jQuery
        var classes = {
            base: "sq-atm1d",
            question: "label_" + options.label,

            answers: "answers",
            grid: "grid",
            row: "row",
            element: "element",

            widget: "-widget",
            breakpoint: "-breakpoint",
            block: "-block",
            buttons: "-buttons",
            button: "-button",
            content: "-content",
            icon: "-icon",
            image: "[data-src]",
            openEnd: "-openEnd",
            openOptional: "-openOptional",

            checkbox: ":checkbox",
            radio: ":radio",
            textInput: "oe",

            // these view size names are based on the dynamic
            //   breakpoint and not the static breakpoint
            //   (@breakpoint) in the atm1d.less
            large: "-large",
            small: "-small",

            horizontal: "-horizontal",
            multicol: "-multicol",
            tiled: "-tiled",
            vertical: "-vertical",

            errQuestion: "hasError",
            errElement: "hasError",
            errOpenEnd: "rowLegendErr",

            errButtons: "-error-buttons",
            errButton: "-error-button",
            errTextInput: "-error-open-end",

            debug: "-debug",
            loading: "-loading",
            hovered: "-hovered",
            selected: "-selected",

            buttonAlignLeft: "-button-align-left",
            buttonAlignCenter: "-button-align-center",
            buttonAlignRight: "-button-align-right",

            contentAlignLeft: "-content-align-left",
            contentAlignCenter: "-content-align-center",
            contentAlignRight: "-content-align-right"
        };
        // end classes

        // begin selectors
        // HTML element selectors for jQuery
        var selectors = function(){
            var baseClass = classes.base;
            var selectors = {};

            for (var k in classes) {
                var v = classes[k];

                if (v.match(/^-/)) {
                    v = baseClass + v;
                    classes[k] = v;
                }

                selectors[k] = (v.match(/^[A-Za-z]/i) ? "." : "") + v;
            }

            return selectors;
        }();
        // end selectors

        // begin events
        var events = {
            button: {
                change: "change",
                mouseenter: "mouseenter",
                mouseleave: "mouseleave"
            },
            ready: "ready"
        };
        // end events

        // begin objects
        var objects = function(){
            var $question = $(selectors.question).addClass(classes.base);

            var $answers = $question.find(selectors.answers);
            var $grid = $answers.find(selectors.grid);
            var $row = $grid.find(selectors.row);
            var $element = $row.find(selectors.element);
            var $input = $element.find([selectors.checkbox, selectors.radio].join(", "));

            var $widget = $question.find(selectors.widget);
            var $breakpoint = $widget.find(selectors.breakpoint);
            var $block = $widget.find(selectors.block);
            var $buttons = $block.find(selectors.buttons);
            var $button = $buttons.find(selectors.button);
            var $content = $button.find(selectors.content);
            var $icon = $button.find(selectors.icon);
            var $image = $button.find(selectors.image);

            return {
                question: $question,

                answers: $answers,
                grid: $grid,
                row: $row,
                element: $element,
                input: $input,

                widget: $widget,
                breakpoint: $breakpoint,
                block: $block,
                buttons: $buttons,
                button: $button,
                content: $content,
                icon: $icon,
                image: $image
            };
        }();
        // end objects

        // begin commons
        var commons = {
            // begin isUndefined
            // determine if a value is null or undefined
            isUndefined: function(value){
                return (value === null) || (value === undefined);
            },
            // end isUndefined

            // begin stripNumber
            // strip the numeric portion at the beginning
            //   of a string
            // inputs
            //   value: value in string format ("1px", "1")
            // outputs
            //   parsed numeric value in string format
            //     or empty string if no numeric value
            stripNumber: function(value){
                var num;

                if (commons.isUndefined(value)) {
                    num = "";
                }
                else {
                    var val = (value || "").toLowerCase();

                    if (val === "auto") {
                        num = val;
                    }
                    else {
                        num = window.parseFloat(val) + "";
                    }
                }

                return num;
            },
            // end stripNumber

            // begin stripUnit
            // strip the unit of measure from the end
            //   of a string
            // inputs
            //   value: value in string format ("1px", "1")
            // outputs
            //   parsed unit or empty string
            stripUnit: function(value){
                var unit;

                if (commons.isUndefined(value)) {
                    unit = "";
                }
                else {
                    var val = (value || "").toLowerCase();

                    if (val === "auto") {
                        unit = "";
                    }
                    else {
                        unit = (("" + value).match(/[^\d]+$/gi) || [""])[0];
                    }
                }

                return unit;
            },
            // end stripUnit

            // begin stripNumUnit
            // strip the number and unit as a string value
            // if no number is included,
            //   return an empty string
            // if number but no unit,
            //   use the defUnit (default unit)
            // inputs
            //   value: value to be processed
            //   defUnit: default unit if value has no unit
            stripNumUnit: function(value, defUnit){
                var num = commons.stripNumber(value);

                if (num) {
                    var unit = commons.stripUnit(value);

                    if (! unit) {
                        if (num !== "auto") {
                            unit = defUnit;
                        }
                    }

                    return num + unit;
                }
                else {
                    return "";
                }
            },
            // end stripNumUnit

            // begin stripNumUnitAll
            // strip the number and unit as a string value
            //   from all values in a hash array
            // inputs
            //   values: hash array
            // outputs
            //   hash array with same keys but proper
            //     number and units
            stripNumUnitAll: function(values, defUnit){
                var locals = {};

                for (var k in values) {
                    locals[k] = commons.stripNumUnit(values[k], defUnit);
                }

                return locals;
            },
            // end stripNumUnitAll

            // begin lowerCaseAll
            // lower case all values in a hash array
            // inputs
            //   values: hash array
            // outputs
            //   hash array with same keys but lower cased values
            lowerCaseAll: function(values){
                var locals = {};

                for (var k in values) {
                    locals[k] = (values[k] || "").toLowerCase();
                }

                return locals;
            },
            // end lowerCaseAll

            // begin toTitleCase
            toTitleCase: function(text){
                return text.charAt(0).toUpperCase() + text.substr(1);
            },
            // end toTitleCase

            // begin getSelector
            // simple function to concatenate a CSS selector
            //   specific to the current question
            // inputs
            //   argument array of keys from the selectors
            //     object literal
            // outputs
            //   string of concatenated selector
            getSelector: function() {
                var parts = [selectors.question];

                for (var i = 0, l = arguments.length; i < l; i++) {
                    parts.push(selectors[arguments[i]]);
                }

                return parts.join(" ");
            },
            // end getSelector

            // seriously... IE8...
            // style tags do not work, maybe due to quirks mode
            // IE8 needs the style placed inline
            // this is where we detect IE8
            isIE8: ! ! $(".lte-ie8.lte-ie9").length
        };
        // end commons

        // begin setups
        var setups = {
            // begin disable context menu
            fixMouseEvents: function(widget){
                widget.on({
                    contextmenu: function(evnt){
                        return false;
                    }
                });
            },
            // end disable context menu

            // begin injectErrors
            // based on the errors array of the $(jserrors()) object,
            //   determine if the element(s) has an error and add the
            //   specified class if it does
            injectErrors: function($element, errors, dimension, errorClass){
                return $element
                    .each(
                        function(i){
                            var errs = setups.extractErrors(errors, dimension, i);

                            if (errs.length) {
                                $(this).addClass(errorClass);
                            }
                        }
                    );
            },
            // end injectErrors

            // begin clearErrors
            // remove any error class from the element
            // inputs
            //   $element: jQuery element(s)
            // outputs
            //   same jQuery element(s) passed in
            clearErrors: function($element){
                var errorClasses = [
                        classes.errQuestion,
                        classes.errButtons,
                        classes.errButton,
                        classes.errTextInput
                    ].join(" ");

                return $element.removeClass(errorClasses);
            },
            // end clearErrors

            // begin bindHover
            // bind hover (mouseenter, mouseleave) event using delegation
            //   * do nothing if element is selected (classes.selected)
            //   * toggle classes.hovered
            // inputs
            //   $element: parent element of element(s) to delegate
            //   children: children selector for delegation
            // outputs
            //   the parent element passed in (for code chaining
            //     purposes)
            bindHover: function($element, children){
                return $element
                    .on({
                        // begin mouseenter
                        mouseenter: function(event){
                            var $this = $(this);

                            if (! $this.hasClass(classes.selected)) {
                                $this.addClass(classes.hovered);
                            }

                            // trigger the mouseenter event for the button
                            var ordinal = window.parseInt($this.data("ordinal"), 10);
                            var btn = _me.buttons[ordinal];

                            $(btn)
                                .trigger(
                                    $.Event(events.button.mouseenter, {
                                        $button: $this,
                                        _button: btn
                                    })
                                );
                        },
                        // end mouseenter

                        // begin mouseleave
                        mouseleave: function(event){
                            var $this = $(this);

                            if (! $this.hasClass(classes.selected)) {
                                $this.removeClass(classes.hovered);
                            }

                            // trigger the mouseleave event for the button
                            var ordinal = window.parseInt($this.data("ordinal"), 10);
                            var btn = _me.buttons[ordinal];

                            $(btn)
                                .trigger(
                                    $.Event(events.button.mouseleave, {
                                        $button: $this,
                                        _button: btn
                                    })
                                );
                        }
                        // end mouseleave
                    }, children);
            },
            // end bindHover

            // begin bindClick
            // bind click event using delegation
            //   * do nothing if clicked target is open-end (classes.textInput)
            //   * toggle classes.selected
            //   * remove classes.hovered
            //   * set focus onto open-end if there is one
            //   * clear open-end if deselected
            // inputs
            //   $element: parent element of element(s) to delegate
            //   children: children selector for delegation
            bindClick: function($element, children){
                return $element
                    .on({
                        click: function(event){
                            var $this = $(this);
                            var $open = $this.find(selectors.textInput);

                            // clear all errors by removing the question
                            //   error class from the question element
                            setups.clearErrors(objects.question);

                            setups.selectAnswer($this, null).removeClass(classes.hovered);
                            setups.synchAnswers(objects.button, objects.element);

                            if ($open.length) {
                                // if button selected, focus onto text input
                                if ($this.hasClass(classes.selected)) {
                                    $open.trigger("focus");
                                }
                                // if button deselected, clear text input value
                                else {
                                    $open.val("")
                                        // and trigger change event so all bound
                                        //   open-ended text inputs get cleared
                                        .trigger("change");
                                }
                            }
                        }
                    }, children);
            },
            // end bindClick

            // begin bindOpenEnds
            // match up open-ended text inputs of the dynamic
            //   question to the HTML question and create a
            //   binding between them, so that their values
            //   always stay synchronized
            // do all this now to avoid having to match the
            //   open-ended text inputs on each keypress
            // inputs
            //   $oefrom: detect when the values of these text
            //     inputs change and copy their values
            //   $oeto: the values are copied to these text
            //     inputs (based ordinal positions)
            //   autosel: boolean value when true, will
            //     automatically select the button when text
            //     is entered into the open-end or deselect
            //     the button when cleared
            // outputs
            //   all the open-ended text inputs
            bindOpenEnds: function($oefrom, $oeto, autosel){
                $oefrom.each(
                    function(i){
                        $(this).on({
                            // open-ended text inputs must not pass on
                            //   the click event
                            click: function(event){
                                event.stopImmediatePropagation();
                            },

                            "change keyup": function(event){
                                var $this = $(this);
                                var $that = $oeto.eq(i);
                                var value = $this.val();
                                var $btn = $this.add($that).closest(selectors.button);

                                // clear all errors by removing the question
                                //   error class from the question element
                                setups.clearErrors(objects.question);

                                $that.val(value);

                                if (autosel) {
                                    // if there is text, select the checkbox / radio
                                    //   of the HTML row
                                    if (value) {
                                        setups.selectAnswer($btn, true);
                                    }
                                    // there is no text, deselect the checkbox / radio
                                    //   of the HTML row if open-end is mandatory
                                    else {
                                        if (! $btn.hasClass(classes.openOptional)) {
                                            setups.selectAnswer($btn, false);
                                        }
                                    }
                                }

                                // synchronize responses
                                setups.synchAnswers(objects.button, objects.element);
                            },

                            // some phones will show the keyboard and
                            //   readjust the scroll position to
                            //   where the text input is not visible
                            // need to hack this and force the scroll
                            //   position to where the text input is
                            //   still visible
                            // note that IE8 uses
                            //   document.documentElement.clientHeight,
                            //   while other browsers use window.innerHeight
                            focus: function(event) {
                                var $this = $(this);

                                if ($this.is(":visible")) {
                                    // remove the hovered class from the button
                                    $this
                                        .closest(selectors.button)
                                        .removeClass(classes.hovered);

                                    var threshold = 50;
                                    var inputTop = $this.offset().top;
                                    var inputHeight = $this.height();
                                    var scrollTop = $(document).scrollTop();
                                    var screenHeight = window.innerHeight || window.document.documentElement.clientHeight;

                                    if ((inputTop < (scrollTop + threshold)) || (inputTop > (scrollTop + screenHeight - inputHeight - threshold))) {
                                        var scrollTop = inputTop - (screenHeight / 2.0) + (inputHeight / 2.0);

                                        $this
                                            .closest("body")
                                            .scrollTop(scrollTop);
                                    }
                                }
                            }
                        });
                    }
                );
            },
            // end bindOpenEnds

            // begin preloadImages
            // preload images to allow proper synchronizing of
            //   button sizes
            // inputs
            //   $element: images not yet preloaded (these will
            //     have data-src attribute and no src attribute)
            // outputs
            //   jQuery promise; the resolution contains an argument
            //     of the same images passed in, now loaded
            preloadImages: function($element){
                var deferred = $.Deferred();
                var length = $element.length;
                var count = 0;

                // resolve if no images to preload
                if (! length) {
                    deferred.resolve($element);
                }

                $element.each(
                    function(i){
                        var $this = $(this);
                        var src = $this.data("src");
                        var img = new Image();

                        img.onload = function(){
                            // have to use attr, prop does not work
                            $this.attr({src: src});

                            count++;

                            if (count >= length) {
                                deferred.resolve($element);
                            }
                        };

                        img.src = src;
                    }
                );

                return deferred.promise();
            },
            // end preloadImages

            // begin addStyle
            // add style tag containing specified styles to the
            //   dynamic question widget (selectors.widget)
            // inputs
            //   $element: element to append the style tag
            //   styles: hash array of hash arrays; first key is
            //     selector of element; second key is CSS property
            //     {".sq-atm1d": {"display": "block", "width": "80%"}}
            addStyle: function($element, styles){
                var text = [];

                for (var selector in styles) {
                    text.push([selector, " {"].join(""));

                    var pairs = styles[selector];

                    for (var property in pairs) {
                        var value = pairs[property];

                        text.push(["    ", property, ": ", value, ";"].join(""));
                    }

                    text.push("}");
                }

                var style = ["<style>", text.join("\n"), "</style>"].join("\n");

                $element.append(style);
            },
            // end addStyle

            // begin calcSize
            // somewhat of a strange name but here is the description
            // of all the $element specified, choose the largest property
            // the intended usage is something like calcSize($(".sq-atm1d-button"), "height")
            // inputs
            //   $element: jQuery array of elements to compare
            //   property: string name of method (height, innerHeight, outerHeight, ...)
            // outputs
            //   integer value of largest
            calcSize: function($element, property){
                var largest = 0;

                $element
                    .each(
                        function(i){
                            var $this = $(this);

                            if ($this.is(":visible")) {
                                var size = $this[property](true);

                                if (size > largest) {
                                    largest = size;
                                }
                            }
                        }
                    );

                return largest;
            },
            // end calcSize

            // begin synchSize
            // synchronize the height and width of the buttons
            // technically, the contents (classes.content) are
            //   synchronized
            // the extra parts are for the FIR icon, so no
            //   need to size those; they should automatically
            //   size themselves
            // oddly, the open-ends are not accounted for when
            //   jQuery calculates the size of the element, so
            //   if the button has an open-end, it must be
            //   included in the height calculation
            // inputs
            //   $element: jQuery elements to synchronize size
            // outputs
            //   jQuery promise; the resolution contains an argument
            //     of the same elements with their sizes synchronized
            synchSize: function($element){
                var deferred = $.Deferred();
                var selector = commons.getSelector(_me.stylevars.viewMode, "button");

                // remove inline height and width style for IE8
                if (commons.isIE8) {
                    $element.css({
                        height: "",
                        width: ""
                    });
                }

                if (_me.stylevars.viewMode === "vertical") {
                    $element.css({display: "inline-block"});
                }

                var synchWidth = function(){
                    // widest value is button width
                    // add 2 to fix weird internet explorer 8 issue
                    // do not forget to add the margin and padding
                    var widest = setups.calcSize($element, "outerWidth") + 2;
                    //widest += window.parseInt($element.css("margin-left"), 10);
                    //widest += window.parseInt($element.css("margin-right"), 10);
                    var maxWidest =  $element.css("max-width");

                    if (maxWidest && (! isNaN(maxWidest))) {
                        maxWidest = window.parseInt(maxWidest, 10);

                        if (widest > maxWidest) {
                            widest = maxWidest;
                        }
                    }

                    var style = {};

                    style[selector] = {width: widest + "px"};
                    setups.addStyle(objects.widget, style);

                    // IE8 needs inline styles
                    if (commons.isIE8) {
                        $element.width(widest);
                    }
                };

                var synchHeight = function(){
                    // tallest value is button height plus open-end height
                    // add 2 to fix weird internet explorer 8 issue
                    // do not forget to add the margin and padding
                    var tallest = setups.calcSize($element, "outerHeight") + 2;
                    //tallest += window.parseInt($element.css("margin-bottom"), 10);
                    //tallest += window.parseInt($element.css("margin-top"), 10);
                    var maxTallest = $element.css("max-height");

                    if (maxTallest && (! isNaN(maxTallest))) {
                        maxTallest = window.parseInt(maxTallest, 10);

                        if (tallest > maxTallest) {
                            tallest = maxTallest;
                        }
                    }

                    var style = {};

                    style[selector] = {height: tallest + "px"};
                    setups.addStyle(objects.widget, style);

                    // IE8 needs inline styles
                    if (commons.isIE8) {
                        $element.height(tallest);
                    }
                };

                window.setTimeout(
                    function() {
                        synchWidth();
                    },
                    0
                );

                window.setTimeout(
                    function(){
                        synchHeight();

                        if (_me.stylevars.viewMode === "vertical") {
                            $element.css({display: ""});
                        }

                        deferred.resolve($element);
                    },
                    250
                );


                return deferred.promise();
            },
            // end synchSize

            // begin selectAnswer
            // select an answer in the HTML answer table
            // the HTML answer table is used as the main
            //   source of tracking responses
            // inputs
            //   $element: the dynamic question button corresponding to
            //     the answer to select
            // outputs
            //   the dynamic question button passed in (for code chaining
            //     purposes)
            selectAnswer: function($element, value){
                var ordinal = window.parseInt($element.data("ordinal"), 10);
                var $this = objects.input.eq(ordinal);

                if (commons.isUndefined(value)) {
                    value = ! $this.prop("checked");
                }

                // be sure to trigger the change event to
                //   keep FIR up to date
                var triggerChange = ! ($this.prop("checked") === value);

                $this.prop({
                    checked: value
                });

                if (triggerChange) {
                    $this.trigger("change");
                }

                return $element;
            },
            // end selectAnswer

            // begin synchAnswers
            // synchronize the button selections to the HTML
            //   answer table, which is the main source of
            //   tracking the responses
            // selections are passed through to the HTML
            //   answer table, and then marshalled back to
            //   the buttons in case there are other events
            //   attached to the DOM elements
            // inputs
            //   $elDQ: the dynamic question buttons (selectors.button)
            //   $elHTML: the HTML elements (selectors.element)
            // outputs
            //   the dynamic question buttons passed in (for code
            //     chaining purposes)
            synchAnswers: function($elDQ, $elHTML){
                return $elDQ.each(
                    function(i){
                        var $btn = $(this);
                        var $binp = $btn.find([selectors.checkbox, selectors.radio].join(", "));
                        var sel = $binp.prop("checked");

                        var $elm = $elHTML.eq(window.parseInt($btn.data("ordinal"), 10));
                        var $einp = $elm.find([selectors.checkbox, selectors.radio].join(", "));
                        var chk = $einp.prop("checked");

                        // button and element are not the same
                        if (! (sel === chk)) {
                            // toggle button selection to match element
                            $btn.toggleClass(classes.selected);
                            $binp.prop({checked: chk});

                            // trigger the change event for the button
                            // note that this also triggers when a button
                            //   is automatically deselected due to an
                            //   exclusive button being selected or
                            //   something like that
                            var ordinal = window.parseInt($btn.data("ordinal"), 10);
                            var btn = _me.buttons[ordinal];

                            $(btn)
                                .trigger(
                                    $.Event(events.button.change, {
                                        $button: $btn,
                                        _button: btn
                                    })
                                );
                        }
                    }
                );
            },
            // end synchAnswers

            // begin bindElement
            // bind click event using delegation
            // when HTML element (classes.element) or input
            //   (classes.input) is clicked, be sure to
            //   synchronize responses (setups.synchAnswers)
            // inputs
            //   $element: parent element of element(s) to delegate
            //   children: children selector for delegation
            // outputs
            //   the element passed in (for code chaining purposes)
            bindElement: function($element, children){
                return $element
                    .on({
                        click: function(event){
                            // added 20150602 1917
                            // use a simple timeout to allow the
                            //   input to toggle before synchronizing
                            //   the responses
                            // this is now needed, because all the
                            //   extra FIR elements are no longer
                            //   added to the table elements
                            window.setTimeout(
                                function(){
                                    setups.synchAnswers(objects.button, objects.element);
                                },
                                0
                            );
                        }
                    }, children)
            },
            // end bindElement

            // begin extractErrors
            // extract error messages from the ${jsexport()}
            //   errors object
            // inputs
            //   errors: ${jsexport()} errors object, an array of
            //     arrays in the format
            //     errors = [
            //       ["error message", "col", 0],
            //       ["error message", "row", 1]
            //      ];
            //   dimension: affected dimension (choice, col, row)
            //   index: the positional index of the dimension
            // outputs
            //   array of error messages (or empty array)
            extractErrors: function(errors, dimension, index){
                var errs = [];

                for (var i = 0, l = errors.length; i < l; i++) {
                    var err = errors[i];

                    if (err.length >= 3) {
                        if (err[1] === dimension) {
                            if (err[2] === index) {
                                errs.push(err[0]);
                            }
                        }
                    }
                }

                return errs;
            },
            // end extractErrors

            // begin normalize
            // normalize the options as an object literal
            // use default values as appropriate (viewMode = vertical, etcetera)
            // in short, create local scope variables
            // inputs
            //   options: $(jsexport()) output
            // outputs
            //   object literal of necessary properties and methods
            normalize: function(options){
                return {
                    atleast: window.parseInt(options.atleast || 0, 10),

                    // most number of buttons that can be selected
                    // if not specified, defaults to the number of
                    //   non-exclusive buttons
                    atmost: function(value, rows){
                        var atmost;

                        if (value) {
                            atmost = window.parseInt(value, 10);
                        }
                        else {
                            atmost = 0;

                            for (var i = 0, l = rows.length; i < l; i++) {
                                if (! rows[i].exclusive) {
                                    atmost++;
                                }
                            }
                        }

                        return atmost;
                    }(options.atmost, options.rows),

                    buttons: function(rows){
                        var buttons = [];

                        for (var i = 0, l = rows.length; i < l; i++) {
                            var row = rows[i];

                            buttons.push({
                                classNames: row["ss:rowClassNames"] || "",

                                // button has error if
                                //   type = "row"
                                //   index = row.index
                                // each item of errors array is itme
                                //   an array
                                //   ["error message", "row", 0]
                                errors: setups.extractErrors(options.errors, "row", row.index),

                                exclusive: row.exclusive,

                                hasErrors: ! ! setups.extractErrors(options.errors, "row", row.index).length,

                                index: row.index,

                                label: row.label,

                                open: function(){
                                    var open;

                                    if (row.open) {
                                        open = {
                                            errors: setups.extractErrors(options.errors, "row-legend", row.index),

                                            hasErrors: ! ! setups.extractErrors(options.errors, "row-legend", row.index).length,

                                            optional: ! ! row.openOptional,

                                            value: row.openValue || "",
                                        };
                                    }
                                    else {
                                        open = false;
                                    }

                                    return open;
                                }(),

                                ordinal: i,

                                selected: function(qtype, answers){
                                    var selected;

                                    if (qtype === "checkbox") {
                                        selected = ! ! answers[i];
                                    }

                                    if (qtype === "radio") {
                                        selected = answers[0] === row.index;
                                    }

                                    return selected;
                                }(options.type, options.answers),

                                text: row.text || "",

                                uid: row.uid
                            });
                        }

                        return buttons;
                    }(options.rows),

                    comment: options.comment || "",

                    debug: options.debug,

                    errors: setups.extractErrors(options.errors, "col", 0),

                    fir: options.fir,

                    hasErrors: ! ! setups.extractErrors(options.errors, "col", 0).length,

                    label: options.label,

                    stylevars: {
                        buttonAlign: commons.lowerCaseAll({
                                large: options["atm1d:large_buttonAlign"],
                                small: options["atm1d:small_buttonAlign"]
                            }),

                        contentAlign: commons.lowerCaseAll({
                                large: options["atm1d:large_contentAlign"],
                                small: options["atm1d:small_contentAlign"]
                            }),

                        maxHeight: commons.lowerCaseAll(commons.stripNumUnitAll({
                                large: options["atm1d:large_maxHeight"],
                                small: options["atm1d:small_maxHeight"]
                            }, "%")),

                        maxWidth: commons.lowerCaseAll(commons.stripNumUnitAll({
                                large: options["atm1d:large_maxWidth"],
                                small: options["atm1d:small_maxWidth"]
                            }, "%")),

                        minHeight: commons.lowerCaseAll(commons.stripNumUnitAll({
                                large: options["atm1d:large_minHeight"],
                                small: options["atm1d:small_minHeight"]
                            }, "%")),

                        minWidth: commons.lowerCaseAll(commons.stripNumUnitAll({
                                large: options["atm1d:large_minWidth"],
                                small: options["atm1d:small_minWidth"]
                            }, "%")),

                        numCols: function(value){
                            return value || 0;
                        }(options["atm1d:numCols"]),

                        showInput: function(value){
                            return ! ! value;
                        }(options["atm1d:showInput"]),

                        viewMode: function(value){
                            return (value || "vertical").toLowerCase();
                        }(options["atm1d:viewMode"])
                    },

                    title: options.title || "",

                    touch: options.touch,

                    type: options.type,

                    uid: options.uid
                };
            },
            // end normalize

            // begin injectStyleOverrides
            // inject the style overrides set by the
            //   stylevar
            injectStyleOverrides: function(stylevars){
                var style = {};

                // vertical view mode supports
                //   max-height, min-width, max-width
                if (stylevars.viewMode === "vertical") {
                    style[commons.getSelector("large", "button")] = {
                        "max-height": stylevars.maxHeight.large,
                        "min-width": stylevars.minWidth.large,
                        "max-width": stylevars.maxWidth.large
                    };

                    // this view mode supports small size
                    style[commons.getSelector("small", "button")] = {
                        "max-height": stylevars.maxHeight.small,
                        "min-width": stylevars.minWidth.small,
                        "max-width": stylevars.maxWidth.small
                    };
                }

                // multicol view mode supports
                //   max-height, max-width
                // will convert to vertical view only if
                //   numCols do not fit the width
                if (stylevars.viewMode === "multicol") {
                    style[commons.getSelector("large", "button")] = {
                        "max-height": stylevars.maxHeight.large,
                        "max-width": stylevars.maxWidth.large
                    };

                    // this view mode supports small size if numCols
                    //   are specified more than one
                    if (stylevars.numCols > 1) {
                        style[commons.getSelector("small", "button")] = {
                            "max-height": stylevars.maxHeight.small,
                            "max-width": stylevars.maxWidth.small
                        };
                    }
                }

                // tiled view mode supports
                //   max-height, max-width
                // will convert to vertical view only if
                //   numCols do not fit the width
                if (stylevars.viewMode === "tiled") {
                    style[commons.getSelector("large", "button")] = {
                        "max-height": stylevars.maxHeight.large,
                        "max-width": stylevars.maxWidth.large
                    };

                    // this view mode supports small size if numCols
                    //   are specified more than one
                    if (stylevars.numCols > 1) {
                        style[commons.getSelector("small", "button")] = {
                            "max-height": stylevars.maxHeight.small,
                            "max-width": stylevars.maxWidth.small
                        };
                    }
                }

                // horizontal view mode supports
                //   min-height, max-height, max-width
                // will convert to vertical only if
                //   all buttons do not fit the width
                if (stylevars.viewMode === "horizontal") {
                    style[commons.getSelector("large", "button")] = {
                        "min-height": stylevars.minHeight.large,
                        "max-height": stylevars.maxHeight.large,
                        "max-width": stylevars.maxWidth.large
                    };

                    // this view mode supports small size
                    style[commons.getSelector("small", "button")] = {
                        "min-height": stylevars.minHeight.small,
                        "max-height": stylevars.maxHeight.small,
                        "max-width": stylevars.maxWidth.small
                    };
                }

                setups.addStyle(objects.widget, style);
            },
            // end injectStyleOverrides

            // begin handleColumns
            handleColumns: function(me){
                // this is the dynamic breakpoint custom to
                //   this specific question
                // the static breakpoint may be 768px, but the
                //   dynamic breakpoint could be 850px
                //     * (10 left padding + 150 button width + 10 right padding) * 5 buttons
                //         for a horizontal layout
                // large and small view are based on dynamic,
                //   breakpoint, unless the view is vertical,
                //   then the dynamic breakpoint would be the
                //   same as the static breakpoint
                var minWidth;

                if (me.stylevars.viewMode === "vertical") {
                    me.stylevars.numCols = 1;

                    minWidth = objects.breakpoint.width();
                }
                else {
                    if (me.stylevars.viewMode === "horizontal") {
                        me.stylevars.numCols = me.buttons.length;
                    }

                    // begin number of columns check
                    // only limit the width if the number of columns
                    //   is more than one
                    if (me.stylevars.numCols > 1) {
                        // calculate the absolute minimum width of the
                        //   button container to allow proper
                        //   responsive behavior based on the number
                        //   of columns
                        minWidth = objects.button.outerWidth(true);
                        minWidth *= me.stylevars.numCols;
                        // need to add a few pixels because firefox falls
                        //   a few pixels short compared to webkit
                        //minWidth += (2 * me.stylevars.numCols);

                        // set the width of the buttons container
                        // this is for those cases where user wants
                        //   three columns tiled or four columns
                        //   multicol (specific number of columns)
                        var style = {};

                        style[commons.getSelector(me.stylevars.viewMode)] = {
                            width: minWidth + "px"
                        };

                        // IE8 needs the style to be inline
                        if (commons.isIE8) {
                            objects.buttons.width(minWidth);
                        }

                        setups.addStyle(objects.widget, style);

                    }
                    else {
                        minWidth = objects.breakpoint.width();
                    }
                    // end number of columns check
                }

                objects.buttons.data({width: minWidth});
            },
            // end handleColumns

            // begin bindResize
            bindResize: function($element){
                var timer = 0;

                var clearTimer = function(timer){
                    if (timer) {
                        window.clearTimeout(timer);
                        timer = 0;
                    }
                }

                $element
                    .on({
                        resize: function(event){
                            // button container width
                            var buttonsWidth = objects.buttons.data("width");
                            // container of button container width
                            var blockWidth = objects.block.width();

                            // view mode (layout) classes
                            var viewClassToAdd = "";
                            var viewClassToRemove = "";

                            // view size classes
                            var sizeClassToAdd = "";
                            var sizeClassToRemove = "";

                            // button align classes
                            var balignClassToAdd = "";
                            var balignClassToRemove = "";

                            // content align classes
                            var calignClassToAdd = "";
                            var calignClassToRemove = "";

                            // if button container width reaches width of
                            //   the container of the button container,
                            //   the view mode needs to be switched to
                            //   vertical
                            // also, switch the class on the sq-atm1d-widget
                            //   from sq-atm1d-large to sq-atm1d-small
                            if (buttonsWidth < blockWidth) {
                                viewClassToAdd = classes[_me.stylevars.viewMode];
                                viewClassToRemove = classes.vertical;

                                sizeClassToAdd = classes.large;
                                sizeClassToRemove = classes.small;

                                balignClassToAdd = classes["buttonAlign" + commons.toTitleCase(_me.stylevars.buttonAlign.large)] || "";
                                balignClassToRemove = classes["buttonAlign" + commons.toTitleCase(_me.stylevars.buttonAlign.small)] || "";

                                calignClassToAdd = classes["contentAlign" + commons.toTitleCase(_me.stylevars.contentAlign.large)] || "";
                                calignClassToRemove = classes["contentAlign" + commons.toTitleCase(_me.stylevars.contentAlign.small)] || "";
                            }
                            else {
                                viewClassToAdd = classes.vertical;
                                viewClassToRemove = classes[_me.stylevars.viewMode];

                                sizeClassToAdd = classes.small;
                                sizeClassToRemove = classes.large;

                                balignClassToAdd = classes["buttonAlign" + commons.toTitleCase(_me.stylevars.buttonAlign.small)] || "";
                                balignClassToRemove = classes["buttonAlign" + commons.toTitleCase(_me.stylevars.buttonAlign.large)] || "";

                                calignClassToAdd = classes["contentAlign" + commons.toTitleCase(_me.stylevars.contentAlign.small)] || "";
                                calignClassToRemove = classes["contentAlign" + commons.toTitleCase(_me.stylevars.contentAlign.large)] || "";
                            }

                            // the size class is for the sq-atm1d-widget
                            if (! objects.widget.hasClass(sizeClassToAdd)) {
                                objects
                                    .widget
                                    .removeClass(sizeClassToRemove)
                                    .addClass(sizeClassToAdd);
                            }

                            // the layout class (viewMode) is for the
                            //   sq-atm1d-buttons
                            // if more than one column
                            if (_me.stylevars.numCols > 1) {
                                if (! objects.buttons.hasClass(viewClassToAdd)) {
                                    objects
                                        .buttons
                                        .removeClass(viewClassToRemove)
                                        .addClass(viewClassToAdd);
                                }
                            }

                            // the button align class is for the
                            //   sq-atm1d-block
                            if (! objects.block.hasClass(balignClassToAdd)) {
                                objects
                                    .block
                                    .removeClass(balignClassToRemove)
                                    .addClass(balignClassToAdd);
                            }

                            // the content align class is for the
                            //   sq-atm1d-content
                            if (! objects.content.hasClass(calignClassToAdd)) {
                                objects
                                    .content
                                    .removeClass(calignClassToRemove)
                                    .addClass(calignClassToAdd);
                            }
                        }
                    })
                .trigger("resize");
            }
            // end bindResize
        };
        // end setups

        // begin initialize
        // inputs
        //   me: class instance
        //   options: $(jsexport()) output
        var initialize = function(me, options) {
            // inject additional setup details into the
            //   class instance
            $.extend(me, setups.normalize(options));
            // only allow right-click when debugging
            //if (! me.debug) {
            //    setups.fixMouseEvents(objects.widget);
            //}

            // inject min-height, max-height, min-width, max-width, numCols
            //   based on view mode
            // need this done before button sizes are synchronized
            setups.injectStyleOverrides(me.stylevars);

            // inject question errors, which would occur
            //   when the question requirements (optional=0,
            //   atleast=3, etcetera)
            setups.injectErrors(objects.buttons, options.errors, "col", classes.errButtons);

            // inject row errors, which would occur when
            //   the open-ended data is specified but the
            //   button is not selected
            setups.injectErrors(objects.button, options.errors, "row", classes.errButton);

            // inject open-end errors, which would occur
            //   when the button is selected but no
            //   open-ended data is specified
            setups.injectErrors(objects.button, options.errors, "row-legend", classes.errTextInput);

            // add hovering behavior for non-touch devices
            // buttons need classes added / removed when
            //   hovering
            // pseudo-classes do not work too well for
            //   touch only devices
            if (! me.touch) {
                setups.bindHover(objects.buttons, selectors.button);
            }

            // bind to the click event to synchronize
            //   responses between the buttons and HTML
            //   grid
            setups.bindClick(objects.buttons, selectors.button);

            // bind to the HTML grid to synchronize
            //   responses between the buttons and HTML
            //   grid
            setups.bindElement(objects.grid, selectors.element);

            // button open-ended text inputs need to be
            //   synchronized with grid open-ended text
            //   inputs
            setups.bindOpenEnds(
                objects.buttons.find(selectors.textInput),
                objects.grid.find(selectors.textInput),
                true
            );

            // grid open-ended text inputs need to be
            //   synchronized with button open-ended
            //   text inputs
            setups.bindOpenEnds(
                objects.grid.find(selectors.textInput),
                objects.buttons.find(selectors.textInput),
                true
            );

            // preload images and wait for all images to
            //   be loaded
            setups.preloadImages(objects.image)
                .then(
                    function(result){
                        // initial button size calculation
                        // if vertical view mode or internet explorer 8
                        //   then skip this first sizing
                        (function(me){
                            var deferred = $.Deferred();

                            // resolve the promise if vertical view mode
                            if (me.stylevars.viewMode === "vertical") {
                                window.setTimeout(
                                    function(){
                                        deferred.resolve(objects.button);
                                    },
                                    0
                                );
                            }
                            // otherwise, change the view mode to vertical
                            //   and calculate the size for vertical
                            // need to do this because every other view mode
                            //   will change to vertical if the screen
                            //   width becomes too small
                            //     * horizontal
                            //     * multicol with number of columns specified
                            //     * tiled with number of columns specified
                            else {
                                var viewMode = me.stylevars.viewMode;
                                me.stylevars.viewMode = "vertical";

                                objects
                                    .buttons
                                    .removeClass(classes[viewMode])
                                    .addClass(classes[me.stylevars.viewMode]);

                                setups.synchSize(objects.button)
                                    .then(
                                        function(){
                                            // be sure to change the view mode back to
                                            //   what it originally is set to
                                            objects
                                                .buttons
                                                .removeClass(classes[me.stylevars.viewMode])
                                                .addClass(classes[viewMode]);

                                            me.stylevars.viewMode = viewMode;

                                            deferred.resolve(objects.button);
                                        }
                                    );
                            }

                            return deferred.promise();
                        }(_me))
                            .then(
                                function() {
                                    // now size the buttons for whatever its
                                    //   specified view mode is
                                    setups.synchSize(objects.button)
                                        .then(
                                            function (result) {
                                                // what handle columns does is
                                                //   size the outer container properly so that
                                                //   when the browser width is smaller than
                                                //   the outer container, the view mode will
                                                //   switch to vertical
                                                setups
                                                    .handleColumns(_me);

                                                // the view mode must automatically
                                                //   adjust itself to vertical and back
                                                setups
                                                    .bindResize($(window));

                                                // remove the loading page
                                                objects
                                                    .widget
                                                    .removeClass(classes.loading);

                                                // trigger a ready event on the question
                                                //   container
                                                objects
                                                    .question
                                                    .trigger(
                                                        $.Event(events.ready, {_dq: _me})
                                                    );
                                            }
                                        );
                                }
                            );
                    }
                );
        };
        // end initialize

        initialize(_me, options);
    };
    // end atm1d class

    global_atm1d = {
        setup: function(options){
            $(function(){
                var dq = new atm1d(options);
            }());
        }
    };

}(jQuery));
