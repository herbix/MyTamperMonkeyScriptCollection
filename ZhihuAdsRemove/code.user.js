// ==UserScript==
// @name         Zhihu Ads Remove
// @namespace    https://github.com/herbix
// @version      0.0.1-alpha
// @license      GPLv3
// @description  Remove ads of Zhihu
// @author       Chaofan
// @include      *://*.zhihu.com/*
// @include      *://zhihu.com/*
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// @require      https://raw.githubusercontent.com/herbix/MyTamperMonkeyScriptCollection/master/common/asyncrunner-0.1.0.js
// @homepageURL  https://github.com/herbix/MyTamperMonkeyScriptCollection
// @supportURL   https://github.com/herbix/MyTamperMonkeyScriptCollection
// @downloadURL  https://raw.githubusercontent.com/herbix/MyTamperMonkeyScriptCollection/master/ZhihuAdsRemove/code.user.js
// @updateURL    https://raw.githubusercontent.com/herbix/MyTamperMonkeyScriptCollection/master/ZhihuAdsRemove/code.user.js
// ==/UserScript==

(function() {
    'use strict';
    var $ = jQuery;
    
    setInterval(function() {
        $('img[alt="广告"]').closest('.Card.Banner').remove();
        $('.TopstoryItem--advertCard').remove();
    }, 1000);

    //$('.ad_bottom_view').closest('.l_post').remove();
    //
    //$('#pagelet_encourage-celebrity\\/pagelet\\/celebrity').remove();
    //$('#celebrity').remove();
    //$('.app_download_box').remove();
    //$('.nani_app_download_box').remove();
    //
    //setInterval(function() {
    //    $('span.pull_right.label_text').filter(function() {
    //        return $(this).text() == '广告';
    //    }).closest('li.clearfix').remove();
    //
    //    $('li.clearfix.j_feed_li.home-place-item').remove();
    //}, 1000);
})();