/*global console, $, Survey*/

// .prop() is available in jQuery 1.6+; otherwise, fall back to .attr()
$.fn.prop = $.fn.prop || $.fn.attr;

jQuery(document).ready(function () {

    var gridsAutoOptimize = $(), gridsForceDesktop = $(), gridsGroupByColCount = 0, rowClasses = [], lastWindowWidth, gridWidths = [], gridParentWidths = [];
    var resizeTimer, resizeTimer2, paintTimer, paintTimerCount = 0, unevenLabelTimer = null;

    function gridSetting(grid, settingName) {
        var val = grid.data('settings') || '';
        return val.indexOf(settingName) > -1;
    }

    // Smart open-ended repositioning

    /* When an open-ended legend is broken down, there's certain scenarios where the legend (and its OE) must repeat. For example:

        Desktop Mode:      Mobile Mode:

              1   2   OE      Row A
     ------- --- --- ----        X 1
      Row A   X   X   X          X 2
      Row B   X   X   X          X OE
                              Row B
                                 X 1
                                 X 2
                                 X OE

    Rather than clone the OE input to each row, we instead:
    - Hide the OE input
    - Insert a <span>, containing the text of the OE, into all the needed positions
    - If the user clicks on a span, the span is hidden and the real OE input is moved to that spot, so the user can edit it
    - When they type in the OE input, all its spans are updated to reflect the latest changes
    - If they click on a different span, the OE is moved to there, and the span of the last position is unhidden

     */

    function handleOEKeypress(){

        /* On OE keypress, update all spans */

        var $oe = $(this);
        if ($oe.hasClass('hasOEMobile')) { // Skip if OE isn't approved for jumping.
            $oe.closest('.grid').find('.mobile-oe-legend[data-for="' + $oe.attr('id') + '"]').html($oe.val());
        }
        return true;
    }
    function handleOELabelClick() {

        /* On span click, replace the span with the actual OE input */
        moveOE($(this), 'fast');

    }
    function moveOE($cell, speed) {
        if ($cell.hasClass('awaitingOE')) {
            var $span = $cell.find('.mobile-oe-legend'), $oe = $('#' + $span.attr('data-for').replace(/\./g, '\\.'));

            // Instantly hide the OE
            $oe.hide(0, function(){
                // Hide the target cell's span
                $span.hide(speed);
                // Show the origin cell's span (if necessary)
                if ($oe.closest('.cell').hasClass('supportsOE')) {
                    $oe.closest('.cell').toggleClass('awaitingOE activeOE').find('.mobile-oe-legend').show(speed);
                }
                // Move then show the OE
                $oe.appendTo($cell.find('.mobile-col-legend')).show(speed);
                $cell.toggleClass('awaitingOE activeOE');
            });
        }
    }
    function optimizeOE(telement, isMobile) {

        /* Method for moving all OEs to their necessary locations, and bind keypress/click functions */

        /* The 3 scenarios where grids need to have their OE moved are:
            1. All single-column grids + row-legend OE
            2. Group-by-col multi-column grids + row-legend OE
            3. Group-by-row multi-column grids + col-legend OE
         */

        if (telement.hasClass("grid-multi-col-subgrid")) {
            return;
        }

        // Grids with problematic row-legends
        if (gridSetting(telement, 'single-col') || gridSetting(telement, 'group-by-col')) {

            // If going to mobile/list view, perform the move.
            if (isMobile || telement.hasClass('grid-list-mode')) {

                // Loop through row legend OEs
                telement.find('.row-legend .oe-left, .row-legend .oe-right').each(function(){

                    // Flag the OE with a class, so we know it's been moved.
                    var $oe = $(this).addClass('hasOEMobile');
                    // Scenario single-column
                    if (gridSetting(telement, 'single-col') || telement.hasClass('grid-list-mode')) {
                        // Move the OE to the adjacent element cell. There's no repeating rows with single-columns, so no event bindings are necessary.
                        if ($oe.hasClass('oe-left')) {
                            $oe.appendTo($oe.parent().next('.element').find('.mobile-col-legend'));
                        } else {
                            $oe.appendTo($oe.parent().prev('.element').find('.mobile-col-legend'));
                        }
                    // Scenario group-by-col multi-column
                    } else {
                        // Bind the keypress event if we haven't already.
                        if (!$oe.hasClass('supportsOEMobile')) {
                            $oe.addClass('supportsOEMobile').keyup(handleOEKeypress);
                        }
                        // Loop through each of this row's element cells.
                        var first = true;
                        $oe.closest('.row').find('.element').each(function(){
                            // Flag the cell with a class, so we know it requires click events.
                            var $cell = $(this).addClass('awaitingOE');
                            // Inject the span into the cell and bind its click event, if we haven't already.
                            if (!$cell.hasClass('supportsOE')){
                                $cell.addClass('supportsOE').click(handleOELabelClick);
                                $cell.find('.mobile-col-legend').append('<span class="mobile-oe-legend" data-for="' + $oe.attr('id') + '">' + $oe.val() + '</span>');
                            }
                            // Update its span text.
                            $cell.find('.mobile-oe-legend').html($oe.val());
                            // Show the OE on the first eligable row.
                            if (first) {
                                moveOE($cell, 0);
                                first = false;
                            }
                        });
                    }
                });

            // Otherwise, undo any previous moves.
            } else {
                // Loop through any flagged OEs.
                telement.find('.hasOEMobile').each(function(){
                    // Unflag the OE class, since it's being moved back.
                    var $oe = $(this).removeClass('hasOEMobile');
                    // Remove the supporting classes from the row's element cells, so click events don't work.
                    if (!gridSetting(telement, 'single-col') && !telement.hasClass('grid-list-mode')) {
                        $oe.closest('.row').find('.element').removeClass('awaitingOE activeOE');
                    }
                    // If the OE was moved, undo those changes.
                    if ($oe.parent().hasClass('mobile-col-legend')) {
                        // Unhide the span right next to the OE.
                        $oe.siblings('.mobile-oe-legend').show(0);
                        // Move the OE to the appropriate cell.
                        if ($oe.hasClass('oe-left')) {
                            $oe.appendTo($oe.closest('.cell').prev('.row-legend')).show(0);
                        } else {
                            $oe.appendTo($oe.closest('.cell').next('.row-legend')).show(0);
                        }
                    }
                });
            }

        // Grids with problematic col-legends
        } else {

            // If going to mobile/list view, perform the move.
            if (isMobile || telement.hasClass('grid-list-mode')) {

                // Loop through col legend OEs
                telement.find('.col-legend .oe-top, .col-legend .oe-bottom').each(function(){
                    // Flag the OE with a class, so we know it's been moved. Get the cell's position in the row.
                    var $oe = $(this).addClass('hasOEMobile'), index = $oe.closest('.row').find('.cell').index($oe.parent()), first = true;
                    // Bind the keypress event if we haven't already.
                    if (!$oe.hasClass('supportsOEMobile')) {
                        $oe.addClass('supportsOEMobile').keyup(handleOEKeypress);
                    }
                    // Loop through each row with element cells.
                    $oe.closest('.grid').find('.row-elements').each(function(){
                        // Find the cell by counting and flag it with a class, so we know it requires click events.
                        var $cell = $(this).find('.cell').eq(index).addClass('awaitingOE');
                        // Inject the span into the cell and bind its click event, if we haven't already.
                        if (!$cell.hasClass('supportsOE')){
                            $cell.addClass('supportsOE').click(handleOELabelClick);
                            $cell.find('.cell-body').append('<span class="mobile-oe-legend" data-for="' + $oe.attr('id') + '">' + $oe.val() + '</span>');
                        }
                        // Update its span text.
                        $cell.find('.mobile-oe-legend').html($oe.val());
                        // Show the OE on the first eligable row.
                        if (first) {
                            moveOE($cell, 0);
                            first = false;
                        }
                    });
                });

            // Otherwise, undo any previous moves.
            } else {
                // Loop through any found spans.
                telement.find('.hasOEMobile').each(function(){
                    // Unflag the OE class, since it's being moved back. Ge the cell's position in the row.
                    var $oe = $(this).removeClass('hasOEMobile'), index = $oe.closest('.row').find('.cell').index($oe.parent());
                    // Loop through each row with element cells.
                    telement.find('.row-elements').each(function(){
                        // Remove the supporting classes from the row's element cells, so click events don't work.
                        $(this).find('.cell').eq(index).removeClass('awaitingOE awaitingOE');
                    });
                    // Unhide the span right next to the OE.
                    $oe.siblings('.mobile-oe-legend').show(0);
                    // Move the OE to the appropriate cell (col legends actually have IDs).
                    $oe.appendTo('#' + $oe.data('cell')).show(0);
                });
            }
        }

        return true;
    }

    // Smart grid breakdown.

    function regroupGroupByCols(telement, isMobile) {

        // Enables grid breakdown on group-by-column tables.

        // Works by swapping the row position with the column position for
        // every cell. So a cell on row-1 col-3 moves to row-3 col-1.

        // Set necessary variables.
        var celement, pos, t, r, currowcount, goalrowcount, height, $row, $top, simple;
        t = telement.attr("id").split("-")[3];
        currowcount = telement.find(".row").not('.mobile-top-border-row').length;
        goalrowcount = 0;
        height = telement.data('height');
        simple = gridSetting(telement, 'simple-markup');

        // If this is the parent of a multicol table, skip it.
        if (telement.hasClass("grid-multi-col") || telement.hasClass("grid-multi-col-subgrid")) {
            return;
        }

        // Loop through every cell
        telement.find(isMobile ? ".desktop" : ".mobile").each(function() {

            // Determine the target row
            celement = $(this);
            pos = celement.attr("id").split("-");
            r = parseInt(pos[isMobile ? 5 : 4]);

            // Add a new row if necessary
            if (r > goalrowcount) goalrowcount = r;
            while (r > currowcount) {
                currowcount++;
                $('<' + (simple ? 'div' : 'tr') + (height !== 'None' ? ' style="height:' + height + ';"' : '') + ' id="-grid-row-' + t + '-' + currowcount + '">').insertAfter("#-grid-row-" + t + "-" + (currowcount - 1));
            }

            // Move the cell
            celement.toggleClass("mobile desktop").appendTo("#-grid-row-" + t + "-" + r);

        });

        // Remove any leftover unused rows.
        while(currowcount>goalrowcount) {
            $("#-grid-row-" + t + "-" + currowcount).remove();
            currowcount--;
        }

        // Important post-move functionality.
        $top = $("#-grid-row-" + t + "-top");
        if ($top.length) {
            if (isMobile) {
                $top.data('span', $top.attr('colspan'));
                $top.removeAttr('colspan');
            } else {
                $top.attr('colspan', $top.data('span'));
            }
        }

        // Loop through every row.
        for (r=1; r<=currowcount; r++) {
            // If going to Mobile view, replace the classes.
            if (isMobile) {
                $row = $("#-grid-row-" + t + "-" + r);
                // Strip all current classes
                $row.removeClass();
                // Add expected classes
                $row.addClass('row row-elements ' + (r % 2 ? 'odd' : 'even'));
                // Note if the row has a zero height.
                if ($row.height() === 0) {
                    $row.addClass('zeroHeight');
                }
                // Update the hasError class
                if ($row.find("hasError").length > 0) {
                    $row.addClass("hasError");
                } else {
                    $row.removeClass("hasError");
                }
            // If returning to Desktop view, restore all the original row classes.
            } else {
                document.getElementById("-grid-row-" + t + "-" + r).className = rowClasses[t-1][r-1];
            }
        }
    }
    function prepareGroupByCols($table, t) {

        // To enable speedy lookup of unlimited cell counts, every table, row,
        // and cell is assigned a unique ID here for easy lookup. The standard
        // cell naming pattern is: -grid-cell-tableIndex-rowIndex-columnIndex

        // Row classes are also backed up for use by regroupGroupByCols.

        var $row, $cell, r=1, c, span, first, s;

        // Assign a table ID.
        $table.attr("id", "-grid-table-" + t);
        rowClasses.push([]);

        // Loop through every row.
        $table.find(".row").each(function(){

            $row = $(this);

            // Skip the mobile-only top border row.
            if ($row.hasClass('mobile-top-border-row')) {
                $row.find('.mobile-top-border-cell').attr("id", "-grid-row-" + t + "-top");
                return;
            }

            // Assign a row ID.
            $row.attr("id", "-grid-row-" + t + "-" + r);

            // Backup row classes.
            rowClasses[t-1].push($row.get(0).className);
            first = false;

            // Loop through every cell.
            c=1;
            first=true;
            $row.find(".cell").each(function(){

                $cell = $(this);

                // Assign a cell ID.
                if ($cell.hasClass("mobile-group-legend")) {
                    $cell.attr("id", "-grid-cell-" + t + "-" + r + "-" + c + "-pre");
                    // Mobile groups do not advance the column count, they reside in the same
                    // cell as their cell-control counterparts.
                } else {
                    $cell.attr("id", "-grid-cell-" + t + "-" + r + "-" + c);
                    // Include colspan values when advancing the column count.
                    span = $cell.attr("colspan");
                    c += span === undefined ? 1 : parseInt(span, 10);
                }
            });
            r++;
        });
    }
    function forceLeftLegend($telement, isMobile) {

        // To show row legends above their child elements in mobile view, they must be
        // in the left-most column. When required, move the legend between the left and right-most columns.

        var $row;

        // Loop through every row.
        $telement.find(".row").each(function(){

            $row = $(this);

            // If going to Mobile view, move legends to the left.
            if (isMobile) {
                $row.find('.unused, .row-legend-right')
                    .prependTo($row)
                    .filter('.row-legend-right')
                        .toggleClass('row-legend-right row-legend-left');

            // If going to Desktop view, move legends to the right.
            } else {
                $row.find('.unused, .row-legend-left')
                    .appendTo($row)
                    .filter('.row-legend-left')
                        .toggleClass('row-legend-right row-legend-left');
            }

        });
    }
    function autosizeCols($telement, isMobile, autoOptimize, firstRun) {

        // Set all column widths to be as wide as the current widest column (desktop mode only) to prevent bias.

        // If the resizing fails because the screen is too small, then...
        // -- For "auto-optimize" tables, they will switch to mobile view when this returns False
        // -- For "force desktop" tables, they have no behavior for handling this scenario, and the browser will just
        //    just ignore set widths and continue shrinking columns to fit the window as much as possible. This is
        //    not acceptable, so insert invisible <div>s into cells to force the width to be recognized.

        // Skip no-col tables or tables premarked for skipping.
        if ($telement.parent().parent().hasClass('noCols') || $telement.parent().parent().hasClass('skipAutosize')) { return true; }

        var success = true;

        // Create a list of col-legends to equalize.
        var $cells = $telement.find('.row-col-legends').not('.colGroup').first().find('.col-legend');

        // If there are no cells to autosize, then we're all set
        if ($cells.length === 0) {
            return success;
        }

        // Reset the col widths back to default if necessary.
        if (autoOptimize && !firstRun) {
            $cells.width('').css('min-width', '');
            $cells.filter(':data(width)').each(function(){
                var $this = $(this);
                $this.css('width', $this.data('width'));
                $this.css('min-width', $this.data('width'));
            });
        } else if (autoOptimize && firstRun) {
            $cells.filter('[style*="width"]').each(function(){
                var $this = $(this), inlineWidth = $this.prop("style").width;
                if (inlineWidth) {
                    $this.data('width', inlineWidth);
                }
            });
        } else if (isMobile) {
            $cells.find('.force-width').remove();
        }

        // If switching to desktop mode, then...
        if (!isMobile) {

            // Get the width of the widest column.

            // If column widths have been explicitly specified, first apply a 'width:auto' to the table before
            // checking cell measurements, as the browser normally tries to size columns 'proportionally by content'
            // which is impossible to get accurate minimum column sizes from. Revert the table size back afterward.
            var max= 0;
            if (gridSetting($telement, 'ss-colWidth')) { $telement.width('auto'); }
            $cells.each(function(){
                max = Math.max($(this).width(), max);
            });
            if (gridSetting($telement, 'ss-colWidth')) { $telement.width(''); }

            // Apply that width to all the cells.
            if (autoOptimize) {
                $cells.width(max);
                $cells.css('min-width', $cells.first().prop("style").width);
                if (!$telement.hasClass('setWidth')) { max = $cells.first().width(); }
            } else {
                var $filler = $cells.find('.force-width');
                if ($filler.length === 0) {
                    $filler = $cells.append('<div class="force-width" style="width:' + max + 'px"></div>');
                } else {
                    $filler.width(max);
                }
            }

            // If the width was not successfully set, the table is too narrow to support the width. Return false.
            $cells.each(function(){
                if (Math.abs($(this).width() - max) > 1) { // Allow a 1-pixel margin for error.
                    success = false;
                    return false;
                }
            });

        }
        return success;
    }
    function optimizeTables() {

        // Loop through each auto-optimize table and reoptimize it if necessary.

        gridsAutoOptimize.each(function(i){
            if ($(this).hasClass('grid-list-mode') || $(this).width() !== gridWidths[i] || $(this).parent().parent().width() !== gridParentWidths[i]) {
                optimizeTable.call(this, false);
                gridWidths[i] = $(this).width();
                gridParentWidths[i] = $(this).parent().parent().width();
            }
        });
        gridsForceDesktop.each(function(){autosizeCols($(this), false, false);});

    }
    function optimizeTable(firstRun) {

        // Optimize the provided table.

        // If there is too much content in a grid to fit onscreen, switches the grid to Mobile view. Otherwise, returns to Desktop view.
        // Runs dependent table functions afterward if necessary.

        var $grid = $(this), wasMobile = $grid.hasClass("grid-list-mode");

        // Restore the grid to Desktop view.
        $grid.removeClass("grid-list-mode").addClass("grid-table-mode");
        if (wasMobile) {
            if (gridSetting($grid, "force-left-legend")) {forceLeftLegend($grid, false);}
            if (gridSetting($grid, "group-by-col")) {regroupGroupByCols($grid, false);}
            optimizeOE($grid, false);
        }

        // If the grid cannot fit after autosizing, or cannot fit its parents width, switch it to Mobile view.
        if (!autosizeCols($grid, false, true, firstRun) || $grid.width() > $grid.parent().parent().width()) {
            $grid.removeClass("grid-table-mode").addClass("grid-list-mode");
            autosizeCols($grid, true, true);
            optimizeOE($grid, true);
            if (gridSetting($grid, "force-left-legend")) {forceLeftLegend($grid, true);}
            if (gridSetting($grid, "group-by-col")) {regroupGroupByCols($grid, true);}
        }
    }
    function handleResize() {

        // Run the necessary operations on window resize/orientationchange.

        // Uses a timer to make sure it's not overcalled during continual window resizing/dragging.

        if ($(window).width() !== lastWindowWidth) {
            lastWindowWidth = $(window).width();

            if (isScreenPainted()) {
                optimizeTables();
            } else {
                paintTimer = setTimeout(handlePaintTimer, 100);
            }

            resizeTimer = setTimeout(function(){
                resizeTimer = null;
            }, 100);
        }
    }
    function isScreenPainted() {

        // Has the browser actually repainted/fully-rendered the screen yet.

        // On slow machines, IE8 doesn't repaint/refresh the screen before the Ready or Load events. It will initially
        // size everything as if the screen was maximized, even when it's not. It needs more time to calculate and
        // position everything. As the grid's parent element should always be smaller than the screen, we can compare
        // its width against the window width to check if the screen has repainted or not.

        return gridsAutoOptimize.last().parent().parent().width() <= $(window).width();
    }

    lastWindowWidth = $(window).width();

    $(".grid").each(function (index) {

        var $grid = $(this),
            $question = $grid.closest(".question");

        var legendsLeft = $grid.find(".row-legend-left");
        var legendsRight = $grid.find(".row-legend-right");
        var colLegends = $grid.find(".row-col-legends");

        // Add various grid classes where applicable
        if (legendsLeft.length === 0 && legendsRight.length === 0) {
            $question.addClass("noRows");
        }
        if (colLegends.length === 0) {
            $question.addClass("noCols");
        }

        var GtTenColumns = $grid.find(".GtTenColumns").length;
        var customWidth = $grid.hasClass("specifiedWidths");

        if (GtTenColumns || customWidth) {
            $question.addClass("clearColWidths");
        } else {
            $grid.addClass("setWidth");
        }

        // Handle Group-by-Col, special OE cases, and Force-Left-Legend grids
        if (gridSetting($grid, "group-by-col")) {
            gridsGroupByColCount++;
            prepareGroupByCols($grid, gridsGroupByColCount);
        }
        optimizeOE($grid, $grid.hasClass("grid-list-mode"));
        if (gridSetting($grid, "force-left-legend")) {
            forceLeftLegend($grid, $grid.hasClass("grid-list-mode"));
        }

        // Handle Auto-Optimized grids
        if (gridSetting($grid, "auto-optimize") && gridSetting($grid, "table-mode")) {
            // Add to relevant lists and optimize immediately.
            if (gridsAutoOptimize.length > 0) { gridsAutoOptimize = gridsAutoOptimize.add($grid); } else { gridsAutoOptimize = $grid; }
            if (isScreenPainted()) optimizeTable.call($grid, true);
            gridWidths.push($grid.width());
            gridParentWidths.push($grid.parent().parent().width());
        } else {
        // Handle Non-Optimized grids
            // Check for Force-Desktop/Mobile grids in the wrong mode
            if (gridSetting($grid, "force-desktop")) {
                if (gridsForceDesktop.length > 0) { gridsForceDesktop = gridsForceDesktop.add($grid); } else { gridsForceDesktop = $grid; }
                if (!$grid.hasClass("grid-list-mode")) { autosizeCols($grid, false, false); }
            }
            if ((gridSetting($grid, "force-mobile") || gridSetting($grid, "list-mode")) && $grid.hasClass("grid-table-mode")) {
                $grid.removeClass("grid-table-mode").addClass("grid-list-mode");
                autosizeCols($grid, true, false);
                optimizeOE($grid, true);
                if (gridSetting($grid, "group-by-col")) {
                    regroupGroupByCols($grid, true);
                }
                if (gridSetting($grid, "force-left-legend")) {
                    forceLeftLegend($grid, true);
                }
            } else if (gridSetting($grid, "force-desktop") && $grid.hasClass("grid-list-mode")) {
                $grid.removeClass("grid-list-mode").addClass("grid-table-mode");
                optimizeOE($grid, false);
                if (gridSetting($grid, "group-by-col")) {
                    regroupGroupByCols($grid, false);
                }
                autosizeCols($grid, false, false);
            }
        }
    });

    function handlePaintTimer(){

        // Check every 1/10th second if the screen is painted yet. If so, optimize the tables.

        // Give up if it takes more than 5 seconds for the screen to paint.
        if (paintTimerCount++ > 50) { paintTimerCount = 0; return; }

        if (isScreenPainted()) {
            paintTimerCount = 0;
            optimizeTables();
        } else {
            paintTimer = setTimeout(handlePaintTimer, 100);
        }
    }

    // On window resize, run the necessary code but use timers to prevent overload.
    // On window load, check if the screen is painted and then reoptimize any tables that need it.
    if (gridsAutoOptimize.length + gridsForceDesktop.length > 0) {
        $(window).bind('orientationchange resize', function() {
            if (resizeTimer === null ) {
                handleResize();
            } else {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(handleResize, 100);
            }
        }).load(function(){
            if (isScreenPainted()) {
                optimizeTables();
            } else {
                paintTimer = setTimeout(handlePaintTimer, 100);
            }
        });
    }

    // On window resize, check if the media-query breakpoint
    // was reached and trigger an event if it has.
    var wasMobile = $('#detectBreakpoint').css('display') === 'block';
    function checkBreakpointReached() {
        var isMobile = $('#detectBreakpoint').css('display') === 'block';
        if (wasMobile !== isMobile) {
            $(this).trigger('breakpointreached');
            wasMobile = isMobile;
        }
        resizeTimer2 = setTimeout(function(){
            resizeTimer2 = null;
        }, 100);
    }
    $(window).bind('orientationchange resize', function() {
        if (resizeTimer2 === null) {
            checkBreakpointReached();
        } else {
            clearTimeout(resizeTimer2);
            resizeTimer2 = setTimeout(checkBreakpointReached, 100);
        }
    });

    // On window load and resize, equalize an left column legends on lists only.
    function fixUnequalLabelWidths() {

        if (unevenLabelTimer !== null) {
            clearTimeout(unevenLabelTimer);
            unevenLabelTimer = setTimeout(fixUnequalLabelWidths, 100);
        }

        var $elements = $('.cell-legend-left').find('label').css('display', 'inline-block');
        $elements.closest('.grid').filter('.grid-list-mode').each(function(){
            var $qelements = $(this).find($elements), maxWidth = 0;
            $qelements.width('').each(function(){
                maxWidth = Math.max($(this).width() + 1, maxWidth);
            });
            $qelements.width(maxWidth);
        });

        unevenLabelTimer = setTimeout(function(){
            unevenLabelTimer = null;
        }, 100);

    }
    $(window).bind('load orientationchange resize', fixUnequalLabelWidths);
    fixUnequalLabelWidths();

    // Opens jQuery UI Dialog for the Support Form
    $('a[href*="/support"]', ".footer").click(function (e) {

        if (window.innerWidth > 450) {
            e.preventDefault();
            $('<iframe id="support_form-iframe" marginwidth="0" marginheight="0" frameborder="0" src="' + this.href + '" />').dialog({
                'modal': true,
                'autoResize': true,
                'resizable': false,
                'draggable': true,
                'width': 400,
                'height': 500,
                'title': $(this).text(),
                'dialogClass': 'support_form-dialog'
            }).css({'width': '400px', 'padding': '0'});
        }

    });

    // respview dialogs
    Survey.uidialog = {};

    // respview dialog assets 
    Survey.uidialog.assets = {

        "btn_close": { text: "close", "class": 'btn-primary', click: function () {
            $(this).dialog("close");
        }}
    };

    // respview dialog presets - NOTE: to set options, pass them with the options argument to Survey.uidialog.make
    Survey.uidialog.presets = {

        "debug": false,
        "iframe_css": { "width": "100%", "margin": 0, "padding": 0 },
        "options_default": {
            "width": 400,
            "minWidth": 200,
            "maxWidth": false,
            "height": "auto",
            "minHeight": 180,
            "maxHeight": false,
            "modal": true,
            "resizable": false,
            "draggable": true,
            "open": "",
            "close": function () {
                $(this).dialog("destroy");
            },
            "autoOpen": true,
            "buttons": [Survey.uidialog.assets.btn_close],
            "dialogClass": ""
        }
    };

    // respview dialog make function
    Survey.uidialog.make = function (content, options) {

        /*
         * content: html fragment or jQuery object to show in the dialog *** REQUIRED ***
         *
         * options.title: title bar text (can also be specified in the content). This will overwrite a title specified in the content
         * options.width: width of dialog (overrides options.size)
         * options.buttons: buttons ARRAY to show in the dialog (with associated callbacks and other functions)
         * options.dialogClass: CSS class name(s) to be added to the dialog for additional styling
         *
         * For more complete information see: http://jqueryui.com/demos/dialog/
         */

        // make sure we have content to use for the dialog
        if (!$(content).length) {
            return;
        }

        // make sure the proposed content is a jQuery object
        var $dialog_content = $(content);

        // settings placeholder
        var settings = {};

        // default settings - overridable via options
        var defaults = this.presets.options_default;

        // merge options with defaults
        settings = $.extend(settings, defaults, options);

        // copy the settings over to the dialog options
        var dialog_options = settings;

        // is the dialog_content an iframe?
        var is_iframe = ($dialog_content[0].nodeName.toLowerCase() === "iframe");

        // a hack currently used only for iframe dialogs
        var css = (is_iframe) ? this.presets.iframe_css : "";

        // create the dialog - reference to the dialog content
        var $uidialogue = $dialog_content.dialog(dialog_options);

        // reference to the widget (entire dialog)
        var $widget = $uidialogue.dialog("widget");

        // optional debugging
        if (this.presets.debug) {

            console.info("arguments('content') =");
            console.info(content);
            console.info("arguments('options') = ");
            console.info(options);
            console.info("is_iframe = " + is_iframe);
            console.info("dialog_options = ");
            console.info(dialog_options);
            console.info("$uidialogue = ");
            console.info($uidialogue);
            console.info("$widget = ");
            console.info($widget);
        }

        // show the dialog?
        if (settings.autoOpen) {
            $uidialogue.dialog("open");
        }

        // add additional css to dialog content after it opens (A hack currently used only for iframe dialogs)
        if (css) {
            $($uidialogue).css(css);
        }

        // return a reference to the dialog content
        return $uidialogue;
    };

    /*
     * bind an event to the submit action, for adding hidden input to form, for tracking if JavaScript is turned on
     * callback - the submit form function
     */

    var addInputToForm = function (event, callback) {
        var $form = $(event.target),
            $input = $('<input type="hidden" name="__has_javascript" value="1"/>');

        if ($form.attr('id') !== 'primary') {
            $form = $('#primary');
        }

        $form.append($input);

        if ($.isFunction(callback)) {
            callback();
        }
    };

    /*
     * apply FIR and handle click events
     */
    $.fn.extend({
        swapClass: function(oldClass, newClass) {
            $(this).removeClass(oldClass);
            $(this).addClass(newClass);
        }
    });
    /* Hide FIR when QA codes turned on for these DQs*/
    if (window.cmsData && window.cmsData.qacodes) {
        // NOTE: Selecting the parent of the the targeted elements (e.g. '.survey-q .fir-icon')
        $(".sq-atm1d-widget, .sq-cardsort").parent().find(".fir-icon").remove();
    }
    var SVGSupport = !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', "svg").createSVGRect;
    $(".question .answers:has(.fir-icon)").each(function() {
        var $me          = $(this),
            $firRadio    = $me.find('.fir-radio .fir-icon'),
            $firCheckbox = $me.find('.fir-checkbox .fir-icon'),
            $firDQs      = $me.parent().find('.add-fir input[type="radio"], .add-fir input[type="checkbox"]').addClass("add-fir"),
            $inputs      = $.merge($me.find('input[type="radio"], input[type="checkbox"]'), $firDQs);

        if (!SVGSupport) {
            var $radioSVG    = $firRadio.find("svg"),
                $checkboxSVG = $firCheckbox.find("svg"),
                $radioIcon, $checkboxIcon;

            if ($radioSVG.length) {
                $radioIcon = $("<i/>", {
                    'class'   : 'fa-icon-fir-fallback-radio ' + $radioSVG.attr('class'),
                    'data-off': 'fa-icon-fir-fallback-radio',
                    'data-on' : 'fa-icon-fir-fallback-radio-selected'
               });
                $firRadio.append($radioIcon);
                $radioSVG.remove();
            }
            if ($checkboxSVG.length) {
                $checkboxIcon = $("<i/>", {
                    'class'   : 'fa-icon-fir-fallback-checkbox ' + $checkboxSVG.attr('class'),
                    'data-off': 'fa-icon-fir-fallback-checkbox',
                    'data-on' : 'fa-icon-fir-fallback-checkbox-selected'
                });
                $firCheckbox.append($checkboxIcon);
                $checkboxSVG.remove();
            }
        }

        $inputs.addClass("fir-hidden");
        $inputs.each(function() {
            var $input = $(this);
            if ($input.is(":radio")) {
                $input.after($firRadio.clone());
                // uncheck radio
                $input.parents(".cell").click(function(e) {
                    if ($(e.target).is(".oe")) { return false; }
                    if (!$(this).is('.ui-droppable, .no-uncheck')) {
                        if ($input.is(":checked")) {
                            $input.prop('checked', false).trigger('change');
                            e.stopPropagation();
                        }
                    }
                });
            } else if ($input.is(":checkbox")) {
                $input.after($firCheckbox.clone());
            }

            if (!$input.hasClass("add-fir")) {
                attachTheFir($input, $(this).siblings('.fir-icon'), $me);
            } else {
                // custom added FIR icon, setup click logic
                var $fir = $input.siblings('.fir-icon');
                $fir.click(function() {
                    if ($input.is(":checked")) {
                        $input.prop('checked', false).trigger('change');
                    } else {
                        $input.prop('checked', true).trigger('change');
                    }
                });
                attachTheFir($input, $fir, $me);
            }
        });
    });

    function attachTheFir($input, $fir, $answers) {
        var $fa = $fir.find("i"),
            faOn  = $fa.attr('data-on'),
            faOff = $fa.attr('data-off');
        if ($input.prop('checked')) {
            $fir.addClass('selected');
            $fa.swapClass(faOff, faOn);
        }
        if ($input.prop('disabled')) {
            $fir.addClass('disabled');
        }
        $input.change(function () {
            if ($input.prop('checked')) {
                $fir.addClass('selected');
                $fa.swapClass(faOff, faOn);
                if ($input.hasClass('na')) {
                    $answers.find(".na").each(function () {
                        if (!$(this).prop('checked')) {
                            $(this).parent().find('.fir-icon').addClass('disabled');
                        }
                    });
                }
            } else {
                $fir.removeClass('selected');
                $fa.swapClass(faOn, faOff);
                if ($input.hasClass('na')) {
                    $answers.find(".fir-icon").removeClass('disabled');
                }
            }
            if ($input.prop('disabled')) {
                $fir.addClass('disabled');
            } else {
                $fir.removeClass('disabled');
            }
        });
    }

    // bind to the submit and the meta page submitPrimary event
    $(document).bind('submitPrimary', addInputToForm);
    /*
     * We'll get a false positive here if we use jQuery to bind to the submit.
     *
     * If we do that, and the respondent turns off JavaScript.
     * The bind function will still run(!). Why? Because you loaded that bind already while JavaScript was on.
     *
     * With the onClick being added, that will not run if you turn off JavaScript and try to submit the form.
     *
     * so... lets be sneaky and add an onClick to the node with JS, I don't want to
     * change a style that's overwritten a lot
     */
  
    var submitInput = $('input[type="submit"]'),
        submitInputOnclick = submitInput.attr('onClick'),
        code = "var i = document.createElement('input'); i.setAttribute('type', 'hidden');i.setAttribute('value', '1');i.setAttribute('name', '__has_javascript');document.forms.primary.appendChild(i);";

    // is there an onclick function already on the submit button? Does this
    // add the has javacript tag? This add an onclick
    if (!$.isFunction(submitInputOnclick) || $.type(submitInputOnclick) === 'undefined') {
        submitInput.attr('onClick', code);
    } else {
        // the current onClick doesn't mention the adding the has javascript

        if (submitInputOnclick.toString().indexOf(code) === -1) {
            submitInput.attr('onClick', submitInputOnclick + ";" + code);
        }
    }

    // force IE 7 to use a submit button, slower to catch users turning off JS
    if (navigator.appVersion.indexOf("MSIE 7.") !== -1) {
        $(document).bind('submit', addInputToForm);
    }

});


// =======================================================
// = Survey PopUp's (*depreciated* - use Survey.uidialog)
// =======================================================

var survey_popUp = {};
survey_popUp.dialog = false;

survey_popUp.nextElement = function (event, elementType, width, height, title) {

    if (event.preventDefault) {

        event.preventDefault();

    } else {

        event.returnValue = false;
    }

    // Only one of these popUps at a time please
    if (survey_popUp.dialog) {
        survey_popUp.dialog.remove();
    }

    var eventTarget = (event.srcElement) ? $(event.srcElement) : $(event.target);

    elementType = elementType ? elementType : '';

    var element = eventTarget.next(elementType + ":first");
    element = element.clone();

    width = width ? width : 500;
    height = height ? height : 'auto';
    title = title ? title : '';

    var hideTitle = title ? false : true;

    var options = {

        close: function (event, ui) {
            thedialogue.remove();
            survey_popUp.dialog = false;
            eventTarget.effect('highlight', {});
        },
        beforeclose: function (event, ui) {
            $(thedialogue).effect('transfer', { to: eventTarget, className: 'ui-effects-transfer' });
        },
        width: width,
        height: height,
        title: title,
        buttons: { "close": function () {
            $(this).dialog("close");
        } },
        resizable: false
    };

    var thedialogue = element.dialog(options);
    if (!title) {
        $(thedialogue).siblings(".ui-dialog-titlebar").hide();
    }

    survey_popUp.dialog = thedialogue;

};

// =======================
// = Exclusive Unchecker =
// =======================

var setupExclusive = function (grouping, elementName) {

    // currently only configured to work for col groupings
    if (grouping === 'cols') {

        var elementName_substr = elementName.substr(0, elementName.lastIndexOf('.'));
        var $exclusiveElement_group = jQuery("input[name^='" + elementName_substr + ".']");

        $exclusiveElement_group.change(function () {

            var $element = $(this);

            if ($element.length && this.checked) {

                if ($element.hasClass('exclusive')) {

                    $exclusiveElement_group.not($element).prop('checked', false).trigger('change');

                } else {

                    $exclusiveElement_group.filter('.exclusive').prop('checked', false).trigger('change');

                }
            }

        });

    }

};

var respview = {

    hide_question: function (q) {

        var element = (typeof q === "object") ? q : $("#" + q);
        return element.hide();
    },

    show_question: function (q) {

        var element = (typeof q === "object") ? q : $("#" + q);
        return element.show();
    },

    disable_question: function (q) {

        var element = (typeof q === "object") ? q : $("#" + q);
        $("input, select, textarea", element).prop('disabled', true).trigger("change");
        return element;
    },

    enable_question: function (q) {

        var element = (typeof q === "object") ? q : $("#" + q);
        $("input, select, textarea", element).prop('disabled', false).trigger("change");
        return element;
    },

    reset_question: function (q) {

        var element = (typeof q === "object") ? q : $("#" + q);
        var $elements = $("input, select, textarea", element);

        $elements.each(function () {

            var $this = $(this);
            var tagName = $this.prop('tagName').toLowerCase();

            switch (tagName) {

            case "input":

                var type = $this.attr('type').toLowerCase();

                if (type !== "text") {

                    $this.prop('checked', false);

                } else {

                    $this.val('');
                }

                break;

            case "select":

                $this.val($("option:first", $this).val());
                break;

            case "textarea":

                $this.val('');
                break;

            }

            $this.trigger("change");

        });


        return element;
    }

};