/*
 * Copyright (c) 2012 Adobe Systems Incorporated. All rights reserved.
 *  
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"), 
 * to deal in the Software without restriction, including without limitation 
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to whom the 
 * Software is furnished to do so, subject to the following conditions:
 *  
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
 * DEALINGS IN THE SOFTWARE.
 * 
 */


/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

/**
 * A "modal bar" component. This is a lightweight replacement for modal dialogs that
 * appears at the top of the editor area for operations like Find and Quick Open.
 */
define(function (require, exports, module) {
    "use strict";
    
    var EditorManager = require("editor/EditorManager");

    /**
     * @constructor
     *
     * Creates a modal bar whose contents are the given template.
     * @param {string} template The HTML contents of the modal bar.
     * @param {boolean} autoClose If true, then close the dialog if the user hits RETURN or ESC 
     *      in the first input field, or if the modal bar loses focus to an outside item. Dispatches 
     *      jQuery events for these cases: "closeOk" on RETURN, "closeCancel" on ESC, and "closeBlur" 
     *      on focus loss.
     */
    function ModalBar(template, autoClose) {
        this._handleInputKeydown = this._handleInputKeydown.bind(this);
        this._handleFocusChange = this._handleFocusChange.bind(this);
        
        this.$root = $("<div class='modal-bar'/>")
            .html(template)
            .appendTo("#main-toolbar");
        
        if (autoClose) {
            var $firstInput = $("input[type='text']", this.$root).first()
                .on("keydown", this._handleInputKeydown);
            window.document.body.addEventListener("focusin", this._handleFocusChange, true);
                
            // Set focus to the first input field, or the first button if there is no input field.
            if ($firstInput.length > 0) {
                $firstInput.focus();
            } else {
                $("button", this.$root).first().focus();
            }
        }
        
        // Preserve scroll position across the editor refresh, adjusting for the height of the modal bar
        // so the code doesn't appear to shift if possible.
        var activeEditor = EditorManager.getActiveEditor(),
            scrollPos;
        if (activeEditor) {
            scrollPos = activeEditor.getScrollPos();
        }
        EditorManager.resizeEditor();
        if (activeEditor) {
            activeEditor._codeMirror.scrollTo(scrollPos.x, scrollPos.y + this.$root.outerHeight());
        }
    }
    
    /**
     * A jQuery object containing the root node of the ModalBar.
     */
    ModalBar.prototype._$root = null;
    
    /**
     * Closes the modal bar and returns focus to the active editor.
     */
    ModalBar.prototype.close = function () {
        var barHeight = this.$root.outerHeight();

        window.document.body.removeEventListener("focusin", this._handleFocusChange, true);
        this.$root.remove();

        // Preserve scroll position across the editor refresh, adjusting for the height of the modal bar
        // so the code doesn't appear to shift if possible.
        var activeEditor = EditorManager.getActiveEditor(),
            scrollPos;
        if (activeEditor) {
            scrollPos = activeEditor.getScrollPos();
        }
        EditorManager.resizeEditor();
        if (activeEditor) {
            activeEditor._codeMirror.scrollTo(scrollPos.x, scrollPos.y - barHeight);
        }
        EditorManager.focusEditor();
    };
    
    /**
     * If autoClose is set, handles the RETURN/ESC keys in the input field.
     */
    ModalBar.prototype._handleInputKeydown = function (e) {
        if (e.keyCode === 13 || e.keyCode === 27) {
            e.stopPropagation();
            e.preventDefault();
            this.close();
            $(this).triggerHandler(e.keyCode === 13 ? "closeOk" : "closeCancel");
        }
    };
    
    /**
     * If autoClose is set, detects when something other than the modal bar is getting focus and
     * dismisses the modal bar.
     */
    ModalBar.prototype._handleFocusChange = function (e) {
        if (!$.contains(this.$root.get(0), e.target)) {
            this.close();
            $(this).triggerHandler("closeBlur");
        }
    };
    
    /**
     * @return {jQueryObject} A jQuery object representing the root of the ModalBar.
     */
    ModalBar.prototype.getRoot = function () {
        return this.$root;
    };
    
    exports.ModalBar = ModalBar;
});