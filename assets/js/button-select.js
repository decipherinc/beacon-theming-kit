// ATM1d.7 (Button Select) JS
$(document).ready(function() {
  // ***** The key function! Set's all widths and heights the same, toggles responsive classes.
  function equalizseButtonWidths(questionID) {
    var initialWidestButton = 0;
    var initialTallestButton = 0;
    var widestButton = 0;
    var tallestButton = 0;
    var halfContainerWidth = $(questionID).width() / 2;
    var listify = false;

    // strip buttons down
    $(questionID + ' .btn-select-group .btn-select .bs-text').css({
      'width' : 'auto',
      'height' : 'auto'
    });
    if ($(questionID).hasClass('bsg-grid') === true && $(questionID).hasClass('bsg-grid-respond') === false) {
      $(questionID).addClass('bsg-grid-respond');
    }

    // find the initial widest button
    $(questionID + ' .btn-select-group .btn-select').each(function() {
      var thisWidth = parseInt($(this).css('width'), 10);
      if (thisWidth > initialWidestButton) {
        initialWidestButton = thisWidth + 2;
      }
    });

    // find the initial tallest button
    $(questionID + ' .btn-select-group .btn-select').each(function() {
      var thisHeight = parseInt($(this).css('height'), 10);
      if (thisHeight > initialTallestButton) {
        initialTallestButton = thisHeight;
      }
    });

    // Make grid into list mode when button width > 50% of the container
    if ($(questionID).hasClass('bsg-grid') === true && initialWidestButton > halfContainerWidth) {
      $(questionID).removeClass('bsg-grid-respond');
    }

    // Make grid into list mode if words are overflowing
    if ($(questionID).hasClass('bsg-grid') === true && $(questionID).hasClass('bsg-grid-respond') === true) {
      $(questionID + ' .btn-select').each(function() {
        var buttonInnerSpan = $('.bs-text span', this);
        if (buttonInnerSpan.prop('scrollWidth') > buttonInnerSpan.width()) {
          listify = true;
        };
      });
      if (listify === true) {
        $(questionID).removeClass('bsg-grid-respond');
      }
    }

    // find the final widest button
    $(questionID + ' .btn-select-group .btn-select .bs-text').each(function() {
      var thisWidth = parseInt($(this).css('width'), 10);
      if (thisWidth > widestButton) {
        // + 2 for a little forgivness
        widestButton = thisWidth + 2;
      }
    });

    // find the final tallest button
    $(questionID + ' .btn-select-group .btn-select .bs-text').each(function() {
      var thisHeight = parseInt($(this).css('height'), 10);
      if (thisHeight > tallestButton) {
        tallestButton = thisHeight;
      }
    });

    // set new width & height of buttons
    $(questionID + ' .btn-select-group .btn-select .bs-text').css({
      'width' : widestButton + 'px',
      'height' : tallestButton + 'px'
    });
  }


  // Size up all the button selects
  function sizeUpButtonSelects() {
    $('div.buttonSelect').each(function() {
      var questionID = 'div#' + $(this).attr('id');
      equalizseButtonWidths(questionID);
    });
  }

  // initial size up
  sizeUpButtonSelects();

  // Size up buttons on viewport change, but not a million times/second.
  (function($,sr){
    // debouncing function from John Hann
    // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
    var debounce = function (func, threshold, execAsap) {
        var timeout;
        return function debounced () {
            var obj = this, args = arguments;
            function delayed () {
                if (!execAsap)
                    func.apply(obj, args);
                timeout = null;
            };
            if (timeout)
                clearTimeout(timeout);
            else if (execAsap)
                func.apply(obj, args);
            timeout = setTimeout(delayed, threshold || 100);
        };
    }
    jQuery.fn[sr] = function(fn){  return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr); };
  })(jQuery,'smartresize');

  $(window).smartresize(function(){
    sizeUpButtonSelects();
  });
});