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
            node;

        event = event || window.event; // IE doesn't pass the event as an argument

        if (event.target.nodeName.toLowerCase() === "input") {
            // exit if the event target is an input or label element (it will toggle itself)
            return true;
        } else if (!$(event.target).hasClass("clickableCell")) {
            // row/col legend label/text was clicked
            children = $(event.currentTarget).find("input");
            // stop double bubble
            event.preventDefault();
        } else {
            // clicked cell
            children = $(obj).find('input');
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
    $("table").delegate('.clickableCell', 'click', function (event) {
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
