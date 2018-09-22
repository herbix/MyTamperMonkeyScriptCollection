// ==UserScript==
// @name         Steam Upload Screenshot
// @namespace    https://github.com/herbix
// @version      1.0.0-alpha
// @license      GPLv3
// @description  Helper to upload screenshot to steam community
// @author       Chaofan
// @include      *://steamcommunity.com/app/*/screenshots/*
// @include      *://steamcommunity.com/sharedfiles/edititem/*/3/*
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// @require      https://raw.githubusercontent.com/herbix/MyTamperMonkeyScriptCollection/master/common/asyncrunner-0.1.1.js
// @homepageURL  https://github.com/herbix/MyTamperMonkeyScriptCollection
// @supportURL   https://github.com/herbix/MyTamperMonkeyScriptCollection
// @downloadURL  https://raw.githubusercontent.com/herbix/MyTamperMonkeyScriptCollection/master/SteamUploadScreenshot/code.user.js
// @updateURL    https://raw.githubusercontent.com/herbix/MyTamperMonkeyScriptCollection/master/SteamUploadScreenshot/code.user.js
// ==/UserScript==

(function() {
    'use strict';
    var $ = jQuery;

    var _csUploadButton = "上传您的截图";
    var _csArtwork = "艺术作品";
    var _csScreenshot = "截图";

    var hrefMatch = window.location.href.match(/http(s)?:\/\/steamcommunity.com\/app\/([0-9]+)\/screenshots\//);
    if (hrefMatch != null) {
        screenshotPage(hrefMatch[2]);
        return;
    }

    hrefMatch = window.location.href.match(/http(s)?:\/\/steamcommunity.com\/sharedfiles\/edititem\/([0-9]+)\/3\//);
    if (hrefMatch != null) {
        if (window.location.href.match(/screenshot=1/) != null) {
            uploadPage();
        }
    }

    function screenshotPage(gameId) {
        var button = $('<a class="btn_darkblue_white_innerfade btn_medium" href="/sharedfiles/edititem/' + gameId + '/3/?screenshot=1"><span>' + _csUploadButton + '</span></a>');
        var buttonOuter = $('<div class="apphub_UploadImageLink responsive_local_menu"></div>');
        button.appendTo(buttonOuter);
        var filter = $('.apphub_SectionFilter');
        var lastDiv = filter.children("div:last");
        if (lastDiv.css('clear')) {
            lastDiv.before(buttonOuter);
        } else {
            filter.append(buttonOuter);
        }
    }

    function uploadPage() {
        $('input[name="file_type"]').val(5);
        $('a.apphub_sectionTab').each(function(index, elem) {
            var obj = $(elem);
            var href = obj.attr("href");
            if (href && href.indexOf('screenshots') >= 0) {
                $(".cancelButton").attr("href", href);
                obj.addClass("active");
            } else {
                obj.removeClass("active");
            }
        });
        $('title, .pageTitle, .pageDesc, form .detailBox, .non_game_related_desc, a').html(function(index, html) {
            return html.replace(new RegExp(_csArtwork, 'g'), _csScreenshot);
        });
    }

})();