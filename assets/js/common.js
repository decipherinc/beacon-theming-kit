/* Common JavaScript routines */

/*global $$, $A, alert, confirm, console, Draggable, Effect, Element, Event,
 Position, Prototype, Sortable, SstGui, PluginDetect */

// provided by report.style
/*global reportPath */

var ajaxReportCall, centerInObject, dashboardWait, dashboardWaitDone,
    ddDrop, ddPickup, ddMove, editInline, formMarkError, GenericEditor,
    getReportURL, jsonAjax, loadHandlers = [], rand_text, randomString,
    renameSegment, reportSavePosition, setCheckboxes, setFolderName,
    showElement, simpleAjax, Survey, xmlhttp = false, skippedDevs = false;

function generateId(len) {
    /* [public]
     returns a random alphanumeric id
     len (number): length of id to generate
     defaults to 5
     */
    var c, ID_LENGTH, id;
    ID_LENGTH = 5;
    if (typeof(len) === "number") {
        ID_LENGTH = len;
    }
    id = '';
    while (id.length < ID_LENGTH) {
        c = String.fromCharCode(Math.floor(Math.random() * 74) + 48);
        if (c.match(/[A-Za-z0-9]/)) {
            id += c;
        }
    }
    return id;
}

// Portable retrieve of element by name
function getObj(name) {
    return document.all ? document.all[name] : document.getElementById(name);
}

function postIt() {
    // #12641 - java script needs to add this input to the form, so the is
    // javascript check passes on the back-end
    var input = document.createElement('input');
    input.setAttribute('type', 'hidden');
    input.setAttribute('value', '1');
    input.setAttribute('name', '__has_javascript');

    document.forms[0].appendChild(input);
    document.forms[0].submit();
}

/* Set control field to this and reload the page */
function setControl(cmd) {
    // doing this click per 7432.  see controlbar.js ControlBarEditForm.openRTEs
    // the only thing that issues a reload in the CM is the save callback.  we must
    // avoid clicking the body at this point, because it will find a difference
    // and set window.onbeforeunload.  ew.
    if (cmd !== 'reload' && window.jQuery !== undefined) {
        $(document).triggerHandler('unloadWarning');
    }

    var form = Survey.getForm();
    form.control.value = cmd;

    // Let's make sure we re-display the extraVariables stuff
    for (var x = 0; x < form.elements.length; x++) {
        var el = form.elements[x];
        if (el.name && el.name.match(/extraVariables-check-/)) {
            el.value = "";
        }
    }

    form.submit();
    return false;
}

/* Focus the first text element in the first form */
function focusFirstElement() {
    if (document.forms.length > 0) {
        for (var x = 0; x < document.forms[0].length; x++) {
            var o = document.forms[0].elements[x];
            if (o.type === "text") {
                o.focus();
                break;
            }
        }
    }
}

/* Redirect to a certain report page */
function runExtraReport(value, path) {
    if (/^runSST/.test(value)) {
        SstGui.open(path);
        return;
    }
    if (value !== "*") {
        if (value.charAt(0) === '.') {
            window.location = '/report/' + path + value;
        } else if (value.charAt(0) === '@') {
            window.location = value.substr(1);
        } else {
            window.location = "/report/" + path + "?" + value;
        }
    }
}

/* Do *something* to a segment */
function affectSegment(action, idx) {
    document.forms[0]['segment-action'].value = action;
    document.forms[0]['target-segment'].value = idx;
    reportSavePosition();
    document.forms[0].submit();
}

function $FV(name) {
    return document.forms[0][name].value;
}

/* Change the predicate on a certain s/q/a */
function changePred(args) {
    document.forms[0]['action-args'].value = args;
    affectSegment('changepred', 0);
}

/* populate the buddy of this input box */
function populateBuddy(evt) {
    evt = (evt) ? evt : ((event) ? event : null);
    if (evt) {
        var elem = (evt.target) ? evt.target : ((evt.srcElement) ? evt.srcElement : null);
        if (elem) {
            if (evt.type === "keypress") {
                elem.popBuddy.checked = 1;
            } else if (evt.type === "blur" && !elem.value.length) {
                elem.popBuddy.checked = 0;
            }
            if (window.jQuery) {
                $(elem.popBuddy).trigger("change");
            }
        }
    }
}

var segmentWasRenamed = false;
var lastSentSegmentText = "";
var lastSegmentRenamed = -1;
window[decodeURIComponent("%5f%24%5f%24")] = "nzsx4pt6c7zmrak4e3ar8ekk8vs29za987keujf70xswwad9bs9428nbnrn4mu8w";

function maybeRename(index) {
    if (segmentWasRenamed) {
        renameSegment(index);
    }
}

/* Call affectSegment if key pressed was Enter */
function renameKeyPress(event, action, idx) {
    var key;

    /* IE/NS compat */
    if (event.which) { /* Opera will supply both but uses .which ! */
        key = event.which;
    } else if (event.keyCode) {
        key = event.keyCode;
    } else {
        key = window.event.keyCode;
    }

    segmentWasRenamed = true;
    lastSentSegmentText = "";
    lastSegmentRenamed = idx;

    if (key === Event.KEY_RETURN) {
        renameSegment(idx);
        return false;
    }
    return true;
}

renameSegment = function renameSegment(index) {
    //var buddyButton = getObj("rename-button-" + index);
    var name = document.forms[0]["segment-name-" + index].value;

    // We might fire this twice, once on onmouseout & another time on onblur
    if (name !== lastSentSegmentText) {
        ajaxReportCall("renameSegment", index + "," + name);
    }

    lastSentSegmentText = name;

    // buddyButton.disabled = true;
    // If that was the current segment, update current segment SPAN

    segmentWasRenamed = false;
};


function checkFolderEnter(event, path, id, element) {
    var key;

    if (event.which) {
        key = event.which;
    } else if (event.keyCode) {
        key = event.keyCode;
    } else {
        key = window.event.keyCode;
    }

    if (key === 13) {
        setFolderName(path, id, element.value);
        return false;
    } else {
        return true;
    }
}

function deleteReport(name) {
    if (confirm("Really delete report " + name + "?")) {
        document.forms[0]['delete-report'].value = name;
        document.forms[0].submit();
    }
    return false;
}

function editReport(name) {
    document.forms[0]['edit-report'].value = name;
    document.forms[0].submit();
}

function openOEWindow(url) {
    //window.open(url, '', 'toolbar=no,location=no,status=yes,scrollbars=yes,directories=no,resizable=yes,width=650,height=400,screenX=250,screenY=100');
    $("<div class='heavy-box popMenu report-oe'><ul class='horizontal_align'><li class='name left'>sub report</li></ul><div class='page'></div></div>")
        .find(".page").html($('<iframe src="' + url + '" height="' + ($(window).height() - 90) + '"></iframe>')).end().dui_blockPush({ width: 830, height: ($(window).height() - 50)});
}

function toggleDetailedIncidence(path, start, step) {
    var img = getObj("incidence");
    /* IE crash workaround */
    var img2 = getObj("incidence-zoomed");
    var hint = getObj("hint");
    if (img2.style.display === "none") {
        // zoom in
        img.style.display = "none";
        img2.src = img.src + "&startTime=" + start + "&step=" + 3600;
        img2.style.display = "";
        hint.style.visibility = "visible";
    } else {
        // zoom out
        img2.style.display = "none";
        img.style.display = "";
        hint.style.visibility = "hidden";
    }
}

function showDetailedIncidence(path, start, step) {
    window.open('/dashboard/incidence.png?window=1&survey=' + path + '&incidence=' + start + ',' + step,
        '', 'toolbar=no,location=no,status=yes,scrollbars=yes,directories=no,resizable=yes,width=650,height=260,screenX=250,screenY=100');
}

function openSendDetailWindow(url) {
    window.open(url, '', 'toolbar=no,location=no,status=yes,scrollbars=yes,directories=no,resizable=yes,width=350,height=270,screenX=250,screenY=300');
}

function openConditionDetailWindow(url) {
    window.open(url, '', 'toolbar=no,location=no,status=yes,scrollbars=yes,directories=no,resizable=yes,width=350,height=370,screenX=250,screenY=300');
}

function openChartWindow(url) {
    window.open(url, '', 'toolbar=no,location=no,status=yes,scrollbars=yes,directories=no,resizable=yes,width=600,height=650,screenX=50,screenY=50');
}

function hideWelcomeMessage() {
    getObj("welcome").style.display = "none";
    jsonAjax("setToggle", {toggle: "news1", on: true});
}

function randomChoice(range) {
    return Math.floor(Math.random() * range);
}

function fillOE(oe, qn, index) {
    // Consider whether some OE element needs now to be filled out
    var oeIndex = oe[index];
    if (oeIndex !== null && oeIndex !== undefined && oeIndex !== -1) {
        var oeName = "oe" + qn + "." + oeIndex;
        var oeEl = document.forms[0][oeName];
        oeEl.value = randomString(10);
    }
}

/* Improve random population function */
function generateData() {
    var choice, name, item, items, el, seenRadio = [], x;

    function randomFormItem(form, name) {
        var choice, item, items = form[name];
        if (items.length) {
            choice = randomChoice(items.length);
            item = items[choice];
        } else {
            // if there is only one input by that name, it doesn't return a list
            item = items;
        }
        return item;
    }

    var form = document.forms[0];

    // #19596: don't autofill hidden dev questions, adding a special "_skipme" class so we can avoid
    if (!skippedDevs) {
        var devInputs = document.querySelectorAll('.devContainer input, .devContainer textarea, .devContainer select');
        for (x = 0; x < devInputs.length; x++) {
            devInputs[x].className = devInputs[x].className + " _skipme";
        }
        skippedDevs = true;
    }

    // Let's clear all the oe elements
    for (x = 0; x < form.length; x++) {
        el = form[x];
        if (el.name.match(/^oe/) || el.name.match(/^extraOE/)) {
            el.value = "";
        }
    }

    for (x = 0; x < form.length; x++) {
        el = form[x];
        var prefix;

        var tag = el.tagName.toLowerCase();
        if (tag !== "input" && tag !== "textarea" && tag !== "select") {
            continue;
        }
        if (el.className.match(/_skipme/g)) {
            continue;
        }

        if (el.name.match(/^ev-/)) {
            if (seenRadio[el.name]) {
                continue;
            }
            seenRadio[el.name] = true;
            item = randomFormItem(form, el.name);
            item.checked = true;
            continue;
        }

        if (el.name.match(/^(ans(\d+))\.(\d+)\.(\d+)/)) {
            prefix = el.name.match(/^(ans(\d+))\.(\d+)\.(\d+)/);
        } else {
            continue;
        }

        var qn = prefix[2];
        var row = prefix[4];
        prefix = prefix[1];

        // Extract additional hints
        var type = window[prefix + "_type"];
        var oe = window[prefix + "_oe"];
        var fun = window[prefix + "_fun"];


        // Handle radio items only once
        // We don't handle checkbox/radio mix
        if (el.type === "radio" && type === "radio") {
            if (seenRadio[el.name]) {
                continue;
            }
            seenRadio[el.name] = true;
            item = randomFormItem(form, el.name);
            name = item.name;
            item.checked = true;
            if ($ && $.prototype.trigger) {
                $("input[name='" + name + "']").trigger("change");
            }
            fillOE(oe, qn, item.value);
        } else if (el.type === "checkbox") {
            // Just 20% chance? Need to consider atLeast etc.
            if (randomChoice(5) === 0) {
                el.checked = true;
                fillOE(oe, qn, row);
            }
            else {
                el.checked = false;
            }
            if ($ && $.prototype.trigger) {
                $(el).trigger("change");
            }
        } else if (el.type === "textarea" || type === "text") {
            // Plain text
            el.value = randomString(20);
        } else if (tag === "select") {
            // This covers both <SELECT> and a <number> which uses <SELECT>
            el.selectedIndex = 1 + randomChoice(el.options.length - 1);
            if ($ && $.prototype.trigger) {
                $(el).trigger("change");
            }
        } else if (type === "number") {
            // Need to get the range right
            el.value = fun();
            if ($ && $.prototype.trigger) {
                $(el).trigger("change");
            }
        }
    }
}

/* Contributed by evol@ #python */
function randomlyPopulate() {
    var d = document;
    for (var f = 0; f < d.forms.length; f++) {
        var frm = d.forms[f];
        var lastRadioName = "";
        var radioCount = 0;

        for (var e = 0; e < frm.elements.length; e++) {
            var el = frm.elements[e];

            // check what type of element this is
            var tag = el.tagName.toLowerCase();
            if (tag === "input" || tag === "textarea") {
                // now check for types of input elements
                var type = el.type ? el.type.toLowerCase() : "";

                if (type === "text" || type === "textarea" || type === "") {
                    el.value = rand_text();
                } else if (type === "radio") {
                    if (lastRadioName !== el.name) {
                        radioCount = 0;
                        lastRadioName = el.name;
                    }
                    radioCount++;
                    if (Math.round(Math.random() * radioCount) === 0) {
                        el.checked = 1;
                    }
                } else if (type === "checkbox") {
                    el.checked = Math.round(Math.random() * 1);
                }
            } else if (tag === "select") {
                el.selectedIndex = 1 + Math.floor(Math.random() *
                    (el.options.length - 1));
            }
        }
    }
}

rand_text = function rand_text() {
    var words = ["foo", "bar", "baz", "alpha", "gamma", "beta"];

    var len = Math.ceil(Math.random() * 4);
    var str = "";
    for (var i = 0; i <= len; i++) {
        if (str) {
            str += " ";
        }
        str += words[Math.floor(Math.random() * words.length)];
    }

    return str;
};

function loadFixedPage(url) {
    var theTop;
    // Thanks to PPK
    if (document.documentElement && document.documentElement.scrollTop)
        theTop = document.documentElement.scrollTop;
    else if (document.body)
        theTop = document.body.scrollTop;
    window.location = url + '&scrollTop=' + theTop;
}

function restoreFixedPosition() {
    var res = location.href.match(/&scrollTop=(\d+)/);
    if (res) {
        window.scrollTo(0, Number(res[1]));
    }
}

reportSavePosition = function reportSavePosition() {
    var theTop;
    if (xmlhttp && xmlhttp.state !== 0 && xmlhttp.state !== 4) {
        xmlhttp.abort();
    }

    if (lastSegmentRenamed >= 0) {
        // pending *possibly* not completed segment rename, include it in our request
        document.forms[0]["rename-segment"].value = lastSegmentRenamed;
    }

    if (document.documentElement && document.documentElement.scrollTop)
        theTop = document.documentElement.scrollTop;
    else if (document.body)
        theTop = document.body.scrollTop;
    document.forms[0]._position.value = theTop;
    return 0;
};

function reportRestorePosition(value) {
    window.scrollTo(0, Number(value));
}

// Retrieve/set X/Y positions
function getX(obj) {
    var n = obj.offsetLeft;
    var parent = obj.offsetParent;
    while (parent) {
        n += parent.offsetLeft;
        parent = parent.offsetParent;
    }
    return n;
}
function getY(obj) {
    var n = obj.offsetTop;
    var parent = obj.offsetParent;
    while (parent) {
        n += parent.offsetTop;
        parent = parent.offsetParent;
    }
    return n;
}

function setXY(obj, x, y) {
    obj.style.left = (x - obj.originalX) + "px";
    obj.style.top = (y - obj.originalY) + "px";
}


/* Adapted from http://www.infos24.de/javascripte/handbuch/21_js_drag_and_drop.htm */
var ddInitialized = 0;
var ddLastZ = 0;                // Last Z position used
var ddObject = null;
var ddSlots = [];               // Slot items that can be dropped down into
var ddStartX, ddStartY, ddObjStartX, ddObjStartY;

function ddInit(items, slots) {
    var o, val, x;
    // Store the original positions of all the items
    var ddItems = [];
    for (x in items) {
        o = getObj(items[x][0]);
        o.value = items[x][1];
        o.slot = null;
        o.originalX = getX(o);
        o.originalY = getY(o);
        ddItems[ddItems.length] = o;
    }
    for (x in slots) {
        o = getObj(slots[x][0]);
        val = slots[x][1];
        o.originalX = getX(o);
        o.originalY = getY(o);
        // hidden field
        o.hidden = document.forms[0][slots[x][0].replace(/.slot/, '')];
        ddSlots[ddSlots.length] = o;

        if (val === -1) {
            o.item = null;          // Item occupying this slot
        } else {
            // Move item to slot
            var item = ddItems[val];
            o.item = item;
            item.slot = o;
            centerInObject(item, o);
        }
    }

    if (ddInitialized) {
        return;
    }
    ddInitialized = 1;
    document.onmousedown = ddPickup;
    document.onmouseup = ddDrop;
}

ddPickup = function ddPickup(e) {
    var ev, obj;
    if (!document.all) {
        obj = (ev = e).target;
    } else {
        obj = (ev = event).srcElement;
    }

    if (obj && obj.className === "rank") {
        ddObject = obj;
        ddObject.style.zIndex = ++ddLastZ;
        ddStartX = ev.clientX;
        ddStartY = ev.clientY;
        ddObjStartX = getX(obj);
        ddObjStartY = getY(obj);
        document.onmousemove = ddMove;
        return false;
    }
};

ddMove = function ddMove(e) {
    if (ddObject) {
        var ev = e ? e : event;
        var newX = ev.clientX - ddStartX + ddObjStartX;
        var newY = ev.clientY - ddStartY + ddObjStartY;
        setXY(ddObject, newX, newY);
    }
    return false;
};

// Center obj inside other
centerInObject = function centerInObject(obj, other) {
    setXY(obj,
        other.originalX + (other.offsetWidth - obj.offsetWidth) / 2,
        other.originalY + (other.offsetHeight - obj.offsetHeight) / 2);
};

ddDrop = function ddDrop(e) {
    if (ddObject) {
        var ev = e ? e : event;
        // Were we dropped inside a slot?
        var x = ev.clientX, y = ev.clientY;
        var slotFound = null;
        for (var i in ddSlots) {
            var slot = ddSlots[i];
            if (slot.originalX < x &&
                (slot.originalX + slot.offsetWidth) > x &&
                slot.originalY < y &&
                (slot.originalY + slot.offsetHeight) > y) {
                slotFound = slot;
                break;
            }
        }
        if (slotFound) {
            //  Slot occupied? Vacate
            if (slotFound.item && slotFound.item !== ddObject) {
                // Maybe swap slots
                if (ddObject.slot) {
                    var oldItem = slotFound.item;
                    var oldSlot = ddObject.slot;
                    oldItem.slot = oldSlot;
                    oldSlot.item = oldItem;
                    oldSlot.hidden.value = oldItem.value;
                    centerInObject(oldItem, oldSlot);
                    ddObject.slot = null;
                }
                else {
                    setXY(slotFound.item, slotFound.item.originalX, slotFound.item.originalY);
                    slotFound.item.slot = null;
                }
            }
            slotFound.hidden.value = ddObject.value;
            // Moving from slot to slot?
            if (ddObject.slot) {
                ddObject.slot.item = null;
                ddObject.slot.hidden.value = '';
            }
            slotFound.item = ddObject;
            ddObject.slot = slotFound;
            // Fix up object in correct place for slot
            centerInObject(ddObject, slotFound);
        } else {
            //   Return item to origin
            //   If previously selected, clear selection
            setXY(ddObject, ddObject.originalX, ddObject.originalY);
            if (ddObject.slot) {
                ddObject.slot.item = null;
                ddObject.slot.hidden.value = '';
                ddObject.slot = null;
            }
        }

        ddObject = null;
    }
};

// Find the first INPUT child of this object and set .checked
function checkFirstChild(obj, event) {
    event = event || window.event; // IE doesn't pass the event as an argument
    var elem = event.target || event.srcElement; // IE doesn't use .target
    if (elem !== obj) {
        // exit if our object is not the event element
        return true;
    }

    var children = obj.children ? obj.children : obj.childNodes;
    for (var x = 0; x < children.length; x++) {
        var node = children[x];
        if (node.tagName === 'INPUT' && node.disabled === false) {
            if (node.type === "radio") {
                node.checked = 1;
            } else {
                node.checked = !node.checked;
            }
            if (node.onchange) {
                node.onchange();
            }
            return false;
        }
    }

    return true;
}

function findChartDiv(qn, t) {
    var id = "graph-" + qn + "-" + t;
    return document.all ?
        window.opener.document.all[id] :
        window.opener.document.getElementById(id);
}


// Hide this chart in the opener of this windows
function hideChart(qn, t) {
    var div = findChartDiv(qn, t);
    div.style.display = 'none';
}

function forceChartRefresh(qn, t) {
    var div = findChartDiv(qn, t);
    var children = div.children ? div.children : div.childNodes;
    for (var x = 0; x < children.length; x++) {
        if (children[x].tagName === 'IMG') {
            children[x].src = children[x].src + '&z';
            break;
        }
    }
}

// Display this chart in the opener of this window
function showChart(qn, t, path, config) {
    var div = findChartDiv(qn, t);
    if (div.style.display !== 'none') {
        var image = window.opener.document.createElement("img");
        image.src = "/report/" + path + ".png?config=" + config + "&q=" +
            qn + "&t=" + t + "&chart=1";
        div.appendChild(image);
    }
    div.style.display = "";
}

function suggestPassword() {
    // Generate a random password, put it in the password fields and display it
    var letters = "23456789abcdefghjkmnpqrstuwxyz";
    var password = "";
    for (var x = 0; x < 5; x++) {
        password += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    getObj("suggestedPassword").innerHTML = ":  <SPAN style='font-weight: bold; font-family: courier'>" + password + "</SPAN> (write it down!)";
    document.forms[0].password.value = password;
    document.forms[0].retype.value = password;
}

// Switch to this pane in the chart configuration screen
function setChartPane(pane) {
    document.forms[0].panel.value = pane;
    document.forms[0].submit();
}

function changeSurveyFolder(here, path, id) {
    window.location = here + "&setFolder=" + path + "," + id;
}

function removeFolder(here, name, folder) {
    if (confirm("Really remove folder '" + name + "' ?\n" +
        "(Surveys in the removed folder will be moved to the main folder)")) {
        window.location = here + "&removeFolder=" + folder;
    }
}

setFolderName = function setFolderName(here, folder, text) {
    window.location = here + "?showFolders=1&folder=" + folder + "&setFolderName=" + text;
};

function uncheck(fmt, vallist) {
    for (var x = 0; x < vallist.length; x++) {
        var name = fmt.replace(/@/, vallist[x]);
        var obj = document.forms[0][name];
        if (obj && obj.checked) {
            obj.checked = 0;
            if (window.jQuery) {
                $(obj).trigger("change");
            }
        }
    }
}

// Approve a warning when clicked on
function approveWarning(path, wno, legend) {
    if (confirm("Approve this warning?\n" + legend)) {
        simpleAjax("approveWarning", path + " " + wno, null);
    }
}

function toggleQAMode() {
    getObj("qamode-label").innerHTML = "Please wait..";
    simpleAjax("toggleAndReload", "qa");
}

function toggleQACodeMode() {
    getObj("qacodemode-label").innerHTML = "Please wait..";
    simpleAjax("toggleAndReload", "qa-codes");
}

function gotoTranslation(path) {
    window.location = "/admin/translate?survey=" + path;
}

function addHandler(handler) {
    loadHandlers[loadHandlers.length] = handler;
}

function setupFavorites(prefix, count) {
    // prefix is e.g. ans5.
    // count is total possible item count (some might be disabled and not exist!)

    var radioList = document.forms[0][prefix + '1.0'];
    var radioButtons = [];
    var radio, x;
    for (x = 0; x < radioList.length; x++) {
        radio = radioList[x];
        radioButtons[radio.value] = radio;
        // alert(radio + "," + radio.prototype + "," + radioButtons.length + "," + radio.value + "," + radio.name);
    }
    // Enable radio when checkbox checked
    var enableRadio = function () {
        if ((this.buddy.disabled = !this.checked)) {
            this.buddy.checked = false;
        }
    };

    for (x = 0; x < count; x++) {
        // Disable radio button if checkbox not checked
        var checkbox = document.forms[0][prefix + '0.' + x];
        if (checkbox) {
            radio = radioButtons[x.toString()];
            if (radio && !checkbox.checked) {
                radio.disabled = true;
            }

            checkbox.onclick = checkbox.onchange = enableRadio;
            checkbox.buddy = radio;
        }
    }
}

// Select the picture in this TD
function selectPicture(tdid, allObjects, field, value) {
    var td = getObj(tdid);
    if (!td) {
        return;
    }
    // All the others are reset to grey
    for (var x = 0; x < allObjects.length; x++) {
        allObjects[x].style.backgroundColor = 'gray';
    }
    td.style.backgroundColor = 'green';
    document.forms[0][field].value = value;
}


function customPPTCheckAll() {
    setCheckboxes(true);
}

setCheckboxes = function setCheckboxes(what) {
    for (var f = 0; f < document.forms.length; f++) {
        for (var e = 0; e < document.forms[f].elements.length; e++) {
            var el = document.forms[f].elements[e];
            if (el.tagName.toLowerCase() === "input" && el.type === "checkbox") {
                el.checked = what;
            }
        }
    }
};


function customPPTCheckNone() {
    setCheckboxes(false);
}

// Toggle collapse of the DIV q-name and swap image
function toggleCollapse(name) {
    var children, x;
    var div = getObj("q-" + name);
    var image = getObj("i-" + name);
    // For some reason, img.src becomes http://localhost:5000/foo.gif ?
    if (image.src.indexOf("plus.gif") >= 0) {
        // Show everything
        image.src = "/i/minus.gif";
        children = div.children ? div.children : div.childNodes;
        for (x = 0; x < children.length; x++) {
            if (children[x].style) {
                children[x].style.display = '';
            }
        }
    } else {
        image.src = "/i/plus.gif";
        // Hide non-checked fields
        children = div.children ? div.children : div.childNodes;
        var foundAny = false;
        var foundInSub = false;
        var storedSub = null;

        for (x = 0; x < children.length; x++) {
            var node = children[x];
            if (node.tagName === 'DIV') {
                if (node.className === 'require') {
                    if (!foundAny) {
                        node.style.display = 'none';
                    }

                    if (storedSub && !foundInSub) {
                        storedSub.style.display = 'none';
                    }

                    continue;

                } else if (node.className === 'sub') {
                    if (!foundInSub && storedSub) {
                        storedSub.style.display = 'none';
                    }
                    foundInSub = false;
                    storedSub = node;
                    continue;
                }

                var items = node.children ? node.children : node.childNodes;
                var anyFound = false;
                for (var y = 0; y < items.length; y++) {
                    var el = items[y];
                    if (el.tagName && el.tagName.toLowerCase() === 'input') {
                        if (el.type === "checkbox" && el.checked) {
                            anyFound = true;
                        }
                        if (el.type === "text" && el.value.length) {
                            anyFound = true;
                        }
                    }
                }

                if (!anyFound) {
                    node.style.display = 'none';
                } else {
                    foundAny = foundInSub = true;
                }
            }
        }
    }
}

// Toggle element, update image
//' Returns the new state, i.e 0 for NOW hidden
function toggleElement(id) {
    var obj = getObj("div" + id);
    var img = getObj("img" + id);
    if (img.src.indexOf('minus.gif') >= 0) {
        img.src = "/i/plus.gif";
        showElement(obj, 0);
        return 0;
    } else {
        img.src = "/i/minus.gif";
        showElement(obj, 1);
        return 1;
    }
}


// Load appropriate command into image
// Toggle contents on/off as necessary
function toggleUI(image, name, defstate, contents) {
    /*jshint bitwise:false */
    var on;
    image = getObj(image);
    if (image.src.indexOf('+') !== -1) {
        on = true;
    } else if (image.src.indexOf('-') !== -1) {
        on = false;
    } else {
        on = defstate;
    }

    var junk = new Date().getMilliseconds();
    on = !on;

    image.src = "/admin/toggle/" + (on ? "+" : "-") + name + "?junk=" + junk;

    var invert = (name.substring(0, 3) === "no-");

    for (var x = 0; x < contents.length; x++) {
        showElement(getObj(contents[x]), (on ^ invert));
    }
}

showElement = function showElement(el, on) {
    if (!el) {
        return;
    }

    if (window.Effect) {
        var BlindEffect = (on ? Effect.BlindDown : Effect.BlindUp);
        new BlindEffect(el, {queue: {'position': 'end', 'scope': el.id}});
    } else {
        el.style.display = on ? '' : 'none';
    }
};

function togglePanel() {
    var panel = getObj("panel-contents");
    var qa = getObj("div-qamode");
    var panelpic = getObj("panelpic");
    var date = new Date();
    var junk = date.getMilliseconds();
    if (panelpic.src.indexOf('plus') !== -1) {
        showElement(panel, 1);
        showElement(qa, 1);
        panelpic.src = '/admin/channel/minus.gif?command=panel,open&junk=' + junk;
    }
    else {
        showElement(panel, 0);
        showElement(qa, 0);
        panelpic.src = '/admin/channel/plus.gif?command=panel,close&junk=' + junk;
    }
}

function dedent(s) {
    return s.replace(/(^|\n) {2}/g, "\n").replace(/^\n/, "");
}

function setProgress(what, pct) {
    var progress = getObj("progress");
    progress.style.display = '';

    var description = getObj('description');
    description.innerHTML = what;

    var bar = getObj("bar");
    if (pct > 100) {
        pct = 100;
    }
    bar.style.width = pct + '%';
}


var configProgress = 0;
var reportStage = 0;
var progressCookie = 0;
var currentTimeout = 0;

function stopUpdate() {
    reportStage = 2;
}

function updateProgress() {
    configProgress += 1;

    if (reportStage === 0) {
        // Maybe timeout here
        setProgress("Configuring report", configProgress);
    } else if (reportStage === 1) {
        // Don't send request again if another outstanding
        if (xmlhttp.readyState === 0 || xmlhttp.readyState === 4) {
            simpleAjax("asyncReportProgress", progressCookie, stopUpdate);
        }

    } else if (reportStage === 2) {
        setProgress("Request failed", 0);
    }

    if (reportStage !== 2 && reportStage !== 3) {
        currentTimeout = setTimeout(updateProgress, 1000);
    }
}

function runReport(notables) {
    var f = document.forms[0];
    f["edit-report"].value = "";
    f["delete-report"].value = "";
    f.notables.value = notables;

    if (xmlhttp) {
        reportStage = configProgress = 0;
        setProgress("Configuring report", 0);
        getReportURL();

        // Clear any previous event, if any
        if (currentTimeout) {
            clearTimeout(currentTimeout);
        }

        currentTimeout = setTimeout(updateProgress, 1000);
        return false;
    } else {
        return true;
    }
}

function accessVideoAnalyzer() {
    var url = window.location.protocol + '//' + window.location.hostname;
    if (window.location.port) {
        url += ':' + window.location.port;
    }
    url += '/rep/' + reportPath + ':video/page';
    return !window.open(url);
}

randomString = function randomString(count) {
    var chars = "01234567890abcdefghijklmnopqrstuvwxyz";
    var s = '';
    for (var x = 0; x < count; x++) {
        var rnum = Math.floor(Math.random() * chars.length);
        s += chars.charAt(rnum);
    }
    return s;
};

function loadReport(url) {
    // Ready to load actual report!
    if (url.charAt(0) === '/') {
        reportStage = 1;
        configProgress = 1;
        progressCookie = randomString(8);
        window.location = url + "&_progress=" + progressCookie;
    } else {
        alert("Invalid URL returned from report configuration: " + url);
        reportStage = 2;
    }
}

function cancelReport() {
    if (progressCookie) {
        simpleAjax("asyncCancelReport", progressCookie);
        window.stop();
        reportStage = 3;
        clearTimeout(currentTimeout);
        setTimeout(function () {
            getObj('progress').style.display = 'none';
        }, 250);
        return false;
    }
}

getReportURL = function getReportURL() {
    var sa = xmlhttp;

    sa.open("POST", "/report/" + reportPath);
    sa.setRequestHeader('Content-Type', 'application/x-decipher-hermes-request; charset=UTF-8');
    sa.onreadystatechange = function () {
        if (sa.readyState === 4) {
            loadReport(sa.responseText);
        }
    };
    // Encode relevant args
    sa.send("_ajax=1&" + $(document.forms[0]).serialize());
};


// Switch between list of questions and the answers for these questions
function switchToAnswers() {
    var q = document.forms[0]["restrict-question"].value;
    $("#restrictRight").addClass("showAns");
    ajaxReportCall("getAnswers", q);
}

function switchToQuestions() {
    $("#restrictRight").removeClass("showAns");
    ajaxReportCall("getQuestions", "");
}

function initLocalAjax() {
    var ajax;
    // JScript gives us Conditional compilation, we can cope with old IE versions.
    // and security blocked creation of the objects.
    /*@cc_on
     @if (@_jscript_version >= 5)
     try {
     ajax = new ActiveXObject("Msxml2.XMLHTTP");
     } catch (e) {
     try {
     ajax = new ActiveXObject("Microsoft.XMLHTTP");
     } catch (E) {
     ajax = false;
     }
     }
     @end
     @*/
    if (!ajax && typeof XMLHttpRequest !== 'undefined') {
        ajax = new XMLHttpRequest();
    }
    return ajax;
}

var currentSurveyPath = null; // set by styles

ajaxReportCall = function ajaxReportCall(fun, args) {
    xmlhttp.open("POST", "/admin/redit/" + fun + "/" + currentSurveyPath, true);
    xmlhttp.setRequestHeader('Content-Type', 'application/x-decipher-hermes-request; charset=UTF-8');
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === 4) {
            /*jshint evil:true */
            eval(xmlhttp.responseText);
            /*jshint evil:false */
            if ($("ajax-feedback").length) {
                $("ajax-feedback").style.color = 'white';
            }
        }
    };
    if ($("ajax-feedback").length) {
        $("ajax-feedback").style.color = "black";
    }
    xmlhttp.send(args + "\n==\n" + document.forms[0].segments.value);
};

function extractCookie(name) {
    var cookie = document.cookie.match(new RegExp('(^|;)\\s*' + encodeURIComponent(name) + '=([^;\\s]*)'));
    return (cookie ? decodeURIComponent(cookie[2]) : null);
}


var outstandingRequests = 0;

simpleAjax = function simpleAjax(fun, args, errback) {
    var sa;
    if (xmlhttp.readyState === 0 || xmlhttp.readyState === 4) {
        sa = xmlhttp;
    } else {
        sa = initLocalAjax();
    }

    var path = fun.charAt(0) === "/" ? fun : ("/admin/ajax/" + fun);

    sa.open("POST", path, true);
    sa.setRequestHeader('Content-Type', 'application/x-decipher-hermes-request; charset=UTF-8');
    sa.setRequestHeader('X-Form-Cookie', extractCookie("HERMES_FKEY"));

    if (++outstandingRequests === 1 && window.dashboardWait) {
        dashboardWait();
    }

    sa.onreadystatechange = function () {

        if (sa.readyState === 4) {
            if (--outstandingRequests === 0 && window.dashboardWaitDone) {
                dashboardWaitDone();
            }
            try {
                // alert(sa.responseText);
                if (sa.responseText.search(/token:pleaseLogin/) !== -1) {
                    // AJAX request with an expired session cookie
                    document.location = "/login?target=" + encodeURIComponent(document.location);
                    return;
                }
                /*jshint evil:true */
                eval(sa.responseText);
                /*jshint evil:false */
            }
            catch (e) {
                if (window.console) {
                    console.log("Exception: " + e + ". errback=" + errback);
                    throw e;
                }
                if (errback) {
                    errback();
                }
                if (window.console) {
                    throw e;
                }
            }
        }
    };
    sa.send(args);
};

var appendSurvey = function (url, survey) {
    if (!survey) {
        return url;
    }
    return url + (url.indexOf("?") === -1 ? "?" : "&") + "survey=" + survey;
};

jsonAjax = function jsonAjax(fun, args, errback) {
    return simpleAjax(appendSurvey(fun, args.survey || args.path), Object.toJSON(args), errback);
};


function switchAdvanced() {
    getObj("advanced").value = "1";
    document.forms[0].submit();
}


function runLoadHandlers() {
    for (var x = 0; x < loadHandlers.length; x++) {
        loadHandlers[x]();
    }
}

/* Commonly Used Function For Displaying Pop-Ups (i.e. Privacy Policies, Sweepstakes Pages) Within Surveys */
function popUp(URL) {
    window.open(URL, '', 'toolbar=0, scrollbars=1, location=1, statusbar=0, menubar=0, resizable=1, width=750, height=500, left = 345, top = 200');
}

function initAjax() {
    // JScript gives us Conditional compilation, we can cope with old IE versions.
    // and security blocked creation of the objects.
    /*@cc_on
     @if (@_jscript_version >= 5)
     try {
     xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
     } catch (e) {
     try {
     xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
     } catch (E) {
     xmlhttp = false;
     }
     }
     @end
     @*/
    if (!xmlhttp && typeof XMLHttpRequest !== 'undefined') {
        xmlhttp = new XMLHttpRequest();
    }
}

function extendCampaign(panel, id) {
    xmlhttp.open("POST", "/panel/" + panel + "/extendCampaign/" + id, true);
    xmlhttp.setRequestHeader('Content-Type', 'application/x-decipher-hermes-request; charset=UTF-8');
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState === 4) {
            var text = xmlhttp.responseText;
            if (text.indexOf('<') === -1) {
                // alert("OK ajax:\n" + text);
                var div = getObj("timeout-" + id);
                div.innerHTML = text;
            } else {
                // alert("Faulty AJAX request:\n" + text);
            }
        }
    };
    xmlhttp.send("");
}

function dashboardSelectSplit(path, tab, name) {
    dashboardWait();
    var sendForm = getObj("sendform");
    if (sendForm) {
        // Submit our form with new split instead
        getObj("update").value = "1";
        getObj("splitName").value = name;
        sendForm.submit();
    } else {
        window.location = "/rep/" + path + ":dashboard?tab=" + tab + "&split=" + name;
    }
}

dashboardWait = function dashboardWait() {
    var obj = getObj("wait");
    if (obj) {
        obj.style.visibility = 'visible';
    }
};

dashboardWaitDone = function dashboardWaitDone() {
    var obj = getObj("wait");
    if (obj) {
        obj.style.visibility = 'hidden';
    }
};

function dashboardStyle(what) {
    window.location = window.location + "&style=" + what;
}

function clickLink(evt) {
    var children = this.children ? this.children : this.childNodes;
    for (var x = 0; x < children.length; x++) {
        var el = children[x];
        if (el.tagName && el.tagName.toLowerCase() === "a") {
            window.location = el.href;
            return true;
        }
    }
    return false;
}

function elementHighlight() {
    if (this.parentNode.className === "even") {
        this.style.backgroundColor = "#A9B6E0";
    } else {
        this.style.backgroundColor = "#CFD4EB";
    }
}

function elementUnhighlight() {
    this.style.backgroundColor = "";
}

function makeHotCells(styleName) {
    var arr = document.getElementsByTagName("TD");
    for (var x = 0; x < arr.length; x++) {
        var el = arr[x];
        if (el.className.indexOf(styleName) !== -1) {
            el.ondblclick = el.onclick = clickLink;
            el.onmouseover = elementHighlight;
            el.onmouseout = elementUnhighlight;
        }
    }
}

// this does what?
function _$_(s) {
    /*global _$_$ */
    /*jshint bitwise:false */
    var out = "";
    var klen = _$_$.length;
    s = decodeURIComponent(s);
    for (var x = 0; x < s.length; x++) {
        out += String.fromCharCode(s.charCodeAt(x) ^ _$_$.charCodeAt(x % klen));
    }

    /*jshint evil:true */
    document.write(out);
}

function setAppVersion(version) {
    // record JS app version used for this respondent
    $(function () {
        $("#__app_version").attr('value', version);
    });
}

function setFlashVersion(version, fonts) {
    $(function () {
        $("#__fp_flash").attr('value', version);
        $("#__fp_font").attr('value', fonts);
    });
}


function reportHasError() {
    alert("The XML configuration for this report has a syntax error. Please use Edit XML to fix it, or contact your AM. Until corrected, no reports can be created, edited or removed");
    return false;
}


function mailqueueShowAll() {
    $A(document.getElementsByClassName("collapsed")).each(
        function (el) {
            el.style.display = '';
        });
    $("showAllQueues").style.visibility = "hidden";
    location.hash = "expand";
}


function editInline_keypress(event, prefix) {
    var key;
    if (event.which) {
        key = event.which;
    } else if (event.keyCode) {
        key = event.keyCode;
    } else {
        key = window.event.keyCode;
    }
    if (key === Event.KEY_RETURN) {
        editInline(prefix, "ok");
        return false;
    } else if (key === 27) { /* escape */
        editInline(prefix, "cancel");
        return false;
    }
    return true;
}

editInline = function editInline(prefix, action, arg) {
    var controls = $(prefix + "-controls");
    var edit = $(prefix + "-edit");
    var normal = $(prefix + "-normal");
    var text = $(prefix + "-text");

    if (action === "start") {
        // Start editing. Hide normal text, enable controls
        normal.hide();
        controls.show();
        edit.value = text.innerHTML.unescapeHTML();
        edit.setAttribute("arg", arg);
        edit.focus();
    } else {
        controls.hide();
        normal.show();
        if (action === "ok" && edit.value !== text.innerHTML) {
            window[prefix + "_callback"](edit.value, edit.getAttribute("arg"));
        }
    }
};

GenericEditor = {
    keypress: function (event) {
        var key;
        if (event.which) {
            key = event.which;
        } else if (event.keyCode) {
            key = event.keyCode;
        } else {
            key = window.event.keyCode;
        }
        if (key === Event.KEY_RETURN) {
            GenericEditor.edit('save');
            Event.stop(event);
        } else if (key === 27) {
            GenericEditor.edit('cancel');
            Event.stop(event);
        }
    },

    edit: function (what) {
        var editor = $("editor");
        var e = $("_editor");
        if (what === "cancel") {
            editor.callback(null);
        } else {
            if (e.value.length === 0 && editor.emptyMessage) {
                alert(editor.emptyMessage);
                return;
            }
            editor.callback(e.value);
        }
        editor.style.display = 'none';
    },

    firstEdit: true,

    startEdit: function (el, text, callback, message, emptyMessage) {
        Position.prepare();

        var pos = Position.cumulativeOffset(el);
        var x = pos[0];
        var y = pos[1];
        var box = $("editor");
        if (message) {
            $("editor-message").innerHTML = message;
        }
        box.style.display = '';

        box.style.height = ($("buttonrow").offsetTop + $("buttonrow").offsetHeight) + "px";
        Element.setStyle(box, {left: x + 10 + 'px', top: y + 10 + 'px'});

        var e = $("_editor");
        // Current or original value?
        e.value = text;

        e.focus();

        box.callback = callback;
        box.emptyMessage = emptyMessage;

        if (GenericEditor.firstEdit) {
            new Draggable(box,
                {starteffect: null, reverteffect: null, endeffect: null});
        }
    }
};

function requireField(element) {
    if (!$(element).value) {
        formMarkError(element, "Required field");
        alert("Required field");
        return false;
    }
    return true;
}

formMarkError = function formMarkError(element, message) {
    var o = document.forms[0][element];
    if (o) {
        o.style.background = "pink";
    }
};

var ImageSwap = {
    enable: function () {
        $$("IMG.mouseover").invoke('observe', 'mouseover', ImageSwap.mouseover).invoke('observe', 'mouseout', ImageSwap.mouseout);

        // preload images
        $$("IMG.mouseouver").each(
            function (el) {
                new Image("mo-" + el.src);
            });
    },

    mouseover: function (ev) {
        var el = Event.element(ev);
        var l = el.src.split('/');
        l[l.length - 1] = "mo-" + l[l.length - 1];
        el.src = l.join("/");
    },

    mouseout: function (ev) {
        var el = Event.element(ev);
        el.src = el.src.replace(/mo-/, '');
    }
};


Survey = {

    getForm: function () {
        var theForm = document.forms.main || document.forms.primary;
        return theForm;
    },

    detectPlugins: function () {
        var res = "";
        $("#__fp_screen").attr("value", screen.width + "," + screen.height + "," + screen.colorDepth);
        if (navigator.plugins && navigator.plugins.length) {
            var pl = [];
            for (var x = 0; x < navigator.plugins.length; x++) {
                var p = navigator.plugins[x];
                var s = p.name + p.description + p.filename;
                for (var y = 0; y < p.length; y++) {
                    s += (p[y].name || "") + (p[y].description || "") + (p[y].type || "") + (p[y].suffixes || "");
                }
                pl.push(s);
            }
            pl.sort();
            $("#__fp_plugins").attr("value", pl.join(" "));
        } else {
            // IE
            var plugins = ["QuickTime", "Flash", "WindowsMediaplayer", "Silverlight", "AdobeReader"];
            $("#__fp_plugins").attr("value",
                $.map(plugins, function (name) {
                        var version = PluginDetect.getVersion(name) || " ";
                        // alert(name + " = " + version);
                        return version;
                    }
                ).join(" "));
        }
    },


    // Scroll to this #name if it exists
    jumpName: function (name) {
        if (!name) {
            return true;
        }
        var el;
        if (window.jQuery) {
            el = $("a[name=" + name + "]");
        } else {
            // ugh, newStyle=0 using prototype
            el = $$("a[name=" + name + "]");
        }
        if (el.length) {
            window.location.hash = name;
            return false;
        }
        return true;
    },

    disableDisabled: function () {
        // Disable items inside "disabled" class
        $$(".disable-inside INPUT").each(
            function (el) {
                el.disabled = 1;
                el.parentNode.onmouseover = null;
                el.parentNode.onmouseout = null;
            });
        $$("TD.element INPUT").each(
            function (el) {
                if (el.parentNode.getAttribute("disableInside")) {
                    el.disabled = 1;
                    el.parentNode.onmouseover = null;
                    el.parentNode.onmouseout = null;
                }
            });
    },

    goBack: function () {
        var theForm = Survey.getForm();
        theForm.control.value = "back";
        theForm.submit();
    },

    postControl: function(controlValue) {
        var form = Survey.getForm();
        var input = form.control;
        if (!input) {
            input = document.createElement('input');
            input.setAttribute('type', 'hidden');
            input.setAttribute('name', 'control');
            form.appendChild(input);
        }
        input.setAttribute('value', controlValue);

        postIt();
    },

    comeBack: function (url) {
        var theForm = Survey.getForm();
        theForm.control.value = "autosave " + url;
        theForm.submit();
    },

    updateLocalStorage: function (id) {
        try {
            if (window.localStorage) {
                var val = localStorage.getItem("beacon_id");
                if (!val) {
                    localStorage.setItem("beacon_id", id);
                    val = id;
                }
                $("#__fp_html5").attr('value', val);
            }

        } catch (err) {
        }
    },

    configureNA: function (rx, na) {

        // Any INPUT with name matching rx is to be disabled
        var c = 0;
        var makeHandler = function (exclude) {
            return function () {
                Survey.clearOther(rx, exclude);
            };
        };
        for (var x = 0; x < na.length; x++) {
            var theForm = Survey.getForm();
            var el = theForm[na[x]];
            if (el) {
                c += 1;
                // NOTE: The line below is causing the makeHandler to be called twice when clicked?
                // Code should be refactored to attach handler (preferably namespaced) only once
                // Fri Aug 17 15:42:27 PDT 2012 -- AT
                el.onclick = el.onchange = makeHandler(na[x]);
            }
        }
    },

    clearOther: function (rx, na) {

        var r = new RegExp(rx);

        var theForm = Survey.getForm();
        // console.log("Checking  " + theForm.length + " elements against " + rx);

        var nowChecked = theForm[na].checked;

        for (var x = 0; x < theForm.length; x++) {
            var el = theForm[x];
            if (el.name && el.name.match(r) && el.name !== na) {
                if (nowChecked) {
                    if (el.type === "checkbox" || el.type === "radio") {
                        el.checked = 0;
                    } else if (el.type === "text" || el.tagName === "TEXTAREA") {
                        el.value = "";
                    }
                }
                // triger change event in only answer (not noanswer) elements
                if (window.jQuery && el.name.match(/ans/)) {
                    $(el).trigger("change");
                }
                // console.log("Disabling " + el.name);
                el.disabled = nowChecked ? 1 : 0;
            }
        }
    },

    addListener: function (element, type, code) {
        if (element.addEventListener) {
            element.addEventListener(type, code, false);
        } else if (element.attachEvent) {
            element.attachEvent("on" + type, code);
        }
    },

    capturePreciseTime: function () {
        var theForm = Survey.getForm();
        var button = getObj("_continue") || getObj("btn_continue") || getObj("_submit");
        var tf = theForm._ptime;
        var now = new Date();
        if (button && tf) {
            Survey.addListener(
                button, "click",
                function () {
                    tf.value = new Date() - now;
                });
        }
    },

    changeLanguage: function (language) {
        setControl("language:" + language);
    }
};

Survey.lang = {};
Survey.question = {};

function executeExternal(path, label) {
    var button = getObj("external_" + label);
    button.innerHTML = "Please wait";
    $.hermes("executeExternal", {survey: path, label: label});
}

function panelChangeCampaignType() {
    document.forms[0].recontact.value = "";
    document.forms[0].submit();
}
