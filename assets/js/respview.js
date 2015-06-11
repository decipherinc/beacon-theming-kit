/*global $, window, document, event*/

// .prop() is available in jQuery 1.6+; otherwise, fall back to .attr()
$.fn.prop = $.fn.prop || $.fn.attr;

$.fn.extend({
    check: function () {
        return this.prop('checked', true);
    },
    uncheck: function () {
        return this.prop('checked', false);
    },
    disable: function () {
        return this.prop('checked', false).prop('disabled', true);
    },
    enable: function () {
        return this.prop('disabled', false);
    }
});

$.extend({
    checkFirstChild: function (obj, event) {
        var children,
            x,
            node,
            tag;

        event = event || window.event; // IE doesn't pass the event as an argument

        tag = event.target.nodeName.toLowerCase();

        if (tag === "input" || tag === "a") {
            // exit if the event target is an <input> or <a> element (it will toggle itself)
            return true;
        } else if (tag === "label" && $(event.target).attr('for')) {
            // exit if the event target is a <label> pointing to an input (it will toggle itself)
            return true;
        } else if ($(event.target).hasClass("mobile-oe-legend")) {
            // exit if we're clicking an OE's label
            return true;
        } else if ($(event.target).hasClass("clickableCell")) {
            // clicked cell
            children = $(obj).find('input');
        } else {
            // exit if the event target is inside an <a> tag within the cell.
            if (!!$(event.target).parents('a').length) {
                return true;
            }
            // exit if the event target is inside a <label> pointing to an input (the label will toggle itself)
            if (!!$(event.target).closest('label[for]').length) {
                // except in ie8, where the label will not toggle itself if an img is clicked
                if (tag === 'img' && $('html').hasClass('lte-ie8')) {
                    var $checkbox = $(obj).find('[id="'+ $(event.target).closest('label').attr('for')+'"]');
                    $checkbox.prop('checked', !$checkbox.prop('checked')).trigger('change');
                }
                return true;
            }

            // row/col legend label/text was clicked
            children = $(event.currentTarget).find("input");
            // stop double bubble
            event.preventDefault();
        }

        for (x = 0; x < children.length; x++) {
            node = children[x];
            if (node.tagName ===  'INPUT' && node.disabled === false) {
                if (node.type === "radio") {
                    node.checked = 1;
                    var name = $(node).attr('name');
                    $("input[name='" + name + "']").trigger('change');
                } else {
                    node.checked = !node.checked;
                    $(node).trigger('change');
                }
                if (node.onchange) {
                    node.onchange();
                }
                return false;
            }

        }

        return true;
    }
});

$(function () {
    $(".answers").delegate('.element', 'click', function (event) {
        $.checkFirstChild(this, event);
        event.stopPropagation();
    });
    window.runLoadHandlers(); // from common.js
});

// =======================
// = Exclusive Unchecker =
// =======================

window.setupExclusive = function (grouping, elementName) {
    // currently only configured to work for col groupings
    if (grouping === 'cols') {

        var elementName_substr = elementName.substr(0, elementName.lastIndexOf('.')),
            $exclusiveElement_group = jQuery('input[name^="' + elementName_substr + '."]');

        $exclusiveElement_group.change(function () {
            var $element = $(this);

            if (this.checked) {
                if ($element.hasClass('exclusive')) {
                    $exclusiveElement_group.not($element).prop('checked', false).trigger('change');
                } else {
                    $exclusiveElement_group.filter('.exclusive').prop('checked', false).trigger('change');
                }
            }
        });
    }
};
