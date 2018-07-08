// ==UserScript==
// @name         Steam Badge Buy Card
// @namespace    https://github.com/herbix
// @version      1.0.5-alpha
// @license      GPLv3
// @description  Helper to buy cards in steam badge page
// @author       Chaofan
// @include      *://steamcommunity.com/profiles/*/gamecards/*
// @include      *://steamcommunity.com/id/*/gamecards/*
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// @require      https://code.jquery.com/ui/1.12.1/jquery-ui.js
// @require      https://raw.githubusercontent.com/herbix/MyTamperMonkeyScriptCollection/master/common/asyncrunner-0.1.0.js
// @homepageURL  https://github.com/herbix/MyTamperMonkeyScriptCollection
// @supportURL   https://github.com/herbix/MyTamperMonkeyScriptCollection
// @downloadURL  https://raw.githubusercontent.com/herbix/MyTamperMonkeyScriptCollection/master/SteamBadge/code.user.js
// @updateURL    https://raw.githubusercontent.com/herbix/MyTamperMonkeyScriptCollection/master/SteamBadge/code.user.js
// ==/UserScript==

(function() {
    'use strict';
    var $ = jQuery;

    var _csBuyCards = "购买卡牌";
    var _csNotOrdered = "以下列表未按卡牌顺序列出";

    var _iBadgeOwner;
    var _iBadgeAppId;
    var _iBorder;

    var _cBuyCardButton = $('<a class="btn_grey_grey btn_small_thin" href="javascript:;"><span>' + _csBuyCards + '</span></a>');

    var _oInventory;
    var _oCardSetInfomation;
    var _oWalletInfo;
    var _oCurrencyData;
    var _sCurrencyPrefix = "";
    var _sCurrencySuffix = "";
    var _aCards = [];
    var _oCardsInformation = {};

    function log(message) {
        console.log("Steam Badge Buy Card: " + message);
    }

    function parseCurrentURL() {
        var hrefMatch = window.location.href.match(/http(s)?:\/\/steamcommunity.com\/profiles\/([0-9]+)\/gamecards\/([0-9]+)/);
        var isId = false;
        if (hrefMatch == null) {
            hrefMatch = window.location.href.match(/http(s)?:\/\/steamcommunity.com\/id\/(.*)\/gamecards\/([0-9]+)/);
            if (hrefMatch == null) {
                return false;
            }
            isId = true;
        }

        _iBorder = window.location.href.match(/border=1/) != null ? 1 : 0;
        _iBadgeOwner = hrefMatch[2];
        _iBadgeAppId = hrefMatch[3];

        if (isId) {
            return $('.gamecards_inventorylink').length > 0;
        } else {
            if (g_steamID != _iBadgeOwner) {
                log("not current user: " + hrefMatch[2]);
                return false;
            }
        }

        return true;
    }

    function fillCardInfomartion() {
        for (var i=0; i<_oCardSetInfomation.results.length; i++) {
            var item = _oCardSetInfomation.results[i];
            if (item.sell_listings <= 0) {
                continue;
            }

            if (!(item.hash_name in _oCardsInformation)) {
                _oCardsInformation[item.hash_name] = {
                    amount: 0,
                    icon: "https://steamcommunity-a.akamaihd.net/economy/image/" + item.asset_description.icon_url + "/96fx96f",
                    name: item.name,
                    price: item.sell_price,
                    price_text: item.sell_price_text,
                    hash_name: item.hash_name
                }
            }
        }
        console.log(_oCardSetInfomation);
    }

    function loadCardSetInfo(count, success) {
        $.get("https://steamcommunity.com/market/search/render/", "query=&category_753_Game%5B%5D=tag_app_" + _iBadgeAppId + "&category_753_cardborder%5B%5D=tag_cardborder_" + _iBorder + "&category_753_item_class%5B%5D=tag_item_class_2&appid=753&norender=1&count=" + count, function(result) {
            if (result.total_count > count) {
                loadCardSetInfo(result.total_count, success);
                return;
            }

            _oCardSetInfomation = result;
            success();
        }).fail(function() {
            setTimeout(function() {
                loadCardSetInfo(count, success);
            }, 1000);
        });;
    }

    function getInventory(count, success) {
        $.get("https://steamcommunity.com/inventory/" + g_steamID + "/753/6", "l=schinese&count=" + count, function(result) {
            if (result.total_inventory_count > count) {
                getInventory(result.total_inventory_count, success);
                return;
            }
            _oInventory = result;
            success();
        }).fail(function() {
            setTimeout(function() {
                getInventory(count, success);
            }, 1000);
        });
    }

    function fillCurrencyData() {
        for (var k in g_rgCurrencyData) {
            if (g_rgCurrencyData[k].eCurrencyCode == _oWalletInfo.wallet_currency) {                    
                _oCurrencyData = g_rgCurrencyData[k];
                if (_oCurrencyData.bSymbolIsPrefix) {
                    _sCurrencyPrefix = _oCurrencyData.strSymbol + " ";
                } else {
                    _sCurrencySuffix = " " + _oCurrencyData.strSymbol;
                }
                break;
            }
        }
    }

    function getWalletInfo(success) {
        var then = null;
        $.get("https://steamcommunity.com/market/", function(result) {
            var walletString = result.match(/var\s*g_rgWalletInfo\s*=\s*(\{.*\});/)
            _oWalletInfo = JSON.parse(walletString[1]);
            success();
        }).fail(function() {
            setTimeout(function() {
                getWalletInfo(success);
            }, 1000);
        });
    }

    function fillCardAmounts() {
        var assets = _oInventory.assets;
        var descs = _oInventory.descriptions;
        var descMap = {};
        var i;

        for (i=0; i<descs.length; i++) {
            descMap[descs[i].classid] = descs[i];
        }

        for (i=0; i<assets.length; i++) {
            var asset = assets[i];
            var desc = descMap[asset.classid];
            if (desc.market_fee_app == _iBadgeAppId) {
                var tagCheck = false;
                for (var j=0; j<desc.tags.length; j++) {
                    var tag = desc.tags[j];
                    if (tag.category == "cardborder" && tag.internal_name == "cardborder_" + _iBorder) {
                        tagCheck = true;
                        break;
                    }
                }

                if (tagCheck) {
                    if (desc.market_hash_name in _oCardsInformation) {
                        _oCardsInformation[desc.market_hash_name].amount += parseInt(asset.amount);
                    } else {
                        _oCardsInformation[desc.market_hash_name] = {
                            amount: parseInt(asset.amount),
                            icon: "https://steamcommunity-a.akamaihd.net/economy/image/" + desc.icon_url + "/96fx96f",
                            name: desc.name,
                            hash_name: desc.market_hash_name
                        };
                    }
                }
            }
        }

        console.log(_oCardsInformation);
    }

    function sendBuyRequest(cardHash, amount, price, item, success) {
        var callback = function(result) {
            if (result.success == 1) {
                item.animate({backgroundColor: '#5c7836'});
            } else {
                item.animate({backgroundColor: '#803030'});
            }

            success();
        }

        if (amount > 0) {
            $.post("https://steamcommunity.com/market/createbuyorder/", {
                sessionid: g_sessionID,
                currency: _oWalletInfo.wallet_currency,
                appid: 753,
                market_hash_name: cardHash,
                price_total: price * amount,
                quantity: amount
            }, callback);
        } else {
            callback({success: 1});
        }
    }

    function showBuyCardDialog() {
        var base = $("<div></div>");
        var maxAmount = 1;
        var maxPrice = 0;
        var k, cardInfo;
        for (k in _oCardsInformation) {
            cardInfo = _oCardsInformation[k];
            if (cardInfo.amount > maxAmount) {
                maxAmount = cardInfo.amount;
            }
            if (cardInfo.price > maxPrice) {
                maxPrice = cardInfo.price;
            }
        }

        var cardHashes = [];
        var amountInputs = [];
        var priceInputs = [];
        var items = [];

        var buttonUp = $('<a class="btn_green_white_innerfade btn_small_thin"><span>+1</span></a>');
        var buttonDown = $('<a class="btn_green_white_innerfade btn_small_thin"><span>-1</span></a>');
        var price = $('<input style="width:50px" type="text" value="' + (maxPrice / 100.0) + '"/>');
        var topBar = $('<div style="float:right;margin:5px"></div>');
        var buyAllButton = $('<a class="btn_green_white_innerfade btn_medium_wide" style="min-width:140px"><span>' + _csBuyCards + '</span></a>');

        buttonUp.click(function() {
            for (var i=0; i<amountInputs.length; i++) {
                var amountInput = amountInputs[i];
                amountInput.val(parseInt(amountInput.val()) + 1);
            }
            calculateSum();
        });

        buttonDown.click(function() {
            for (var i=0; i<amountInputs.length; i++) {
                var amountInput = amountInputs[i];
                var value = parseInt(amountInput.val());
                amountInput.val(value > 0 ? value - 1 : 0);
            }
            calculateSum();
        });

        function priceChange() {
            var value = price.val();
            for (var i=0; i<priceInputs.length; i++) {
                var priceInput = priceInputs[i];
                priceInput.val(value);
            }
            calculateSum();
        }

        function calculateSum() {
            var sum = 0;
            for (var i=0; i<amountInputs.length; i++) {
                var amountInput = amountInputs[i];
                var priceInput = priceInputs[i];
                var amount = parseInt(amountInput.val());
                var price = Math.round(parseFloat(priceInput.val()) * 100);
                sum += amount * price;
            }

            buyAllButton.find("span").text(_csBuyCards + "(" + _sCurrencyPrefix + (sum / 100.0) + _sCurrencySuffix + ")");
        }

        var buying = false;
        buyAllButton.click(function() {
            if (buying) {
                return;
            }

            buying = true;
            var loading = $('<img src="https://steamcommunity-a.akamaihd.net/public/images/login/throbber.gif" style="height:20px;vertical-align:middle;margin-left: 5px"/>')

            buyAllButton.addClass('btn_disabled');
            buyAllButton.find("span").append(loading);

            var cards = {};
            var runner = AsyncRunner.prepare();
            var insertToRunner = function(cardHash, amount, price, item) {
                runner = runner.then(function(_, onfinish) {
                    sendBuyRequest(cardHash, amount, price, item, onfinish);
                });
            }

            for (var i=0; i<amountInputs.length; i++) {
                var amountInput = amountInputs[i];
                var priceInput = priceInputs[i];

                var cardHash = cardHashes[i];
                var amount = parseInt(amountInput.val());
                var price = Math.round(parseFloat(priceInput.val()) * 100);
                var item = items[i];

                item.animate({backgroundColor: 'transparent'});
                insertToRunner(cardHash, amount, price, item);
            }

            runner = runner.then(function(_, onfinish) {
                loading.remove();
                buying = false;
                buyAllButton.removeClass('btn_disabled');
                onfinish();
            });

            runner.start();
        });

        price.keyup(priceChange);
        price.on('paste', priceChange);
        price.on('cut', priceChange);

        topBar.append(buttonUp);
        topBar.append(buttonDown);
        topBar.append('<span style="margin-left:15px">' + _sCurrencyPrefix + '</span>');
        topBar.append(price);
        topBar.append(_sCurrencySuffix);

        var keys;
        if (_aCards != null) {
            keys = _aCards;
        } else {
            keys = [];
            for (k in _oCardsInformation) {
                keys.push(k);
            }
            base.append('<div style="padding:10px;background:#803030">' + _csNotOrdered + '</div>');
        }

        base.append(topBar);
        base.append('<div style="clear:both;"></div>');

        for (k=0; k<keys.length; k++) {
            cardInfo = _oCardsInformation[keys[k]];
            var amountInput = $('<input style="width:50px;" type="text" value="' + (maxAmount - cardInfo.amount) + '" />');
            var priceInput = $('<input style="width:50px;" type="text" value="' + (cardInfo.price / 100.0) + '" /></div>');
            var item = $('<div style="vertical-align:middle;padding:5px"><img src="' + cardInfo.icon + '" style="vertical-align:middle"/>' +
                '<span style="width:300px;display:inline-block">' + cardInfo.name + '</span>');

            amountInputs.push(amountInput);
            priceInputs.push(priceInput);
            cardHashes.push(cardInfo.hash_name);
            items.push(item);

            amountInput.keyup(calculateSum);
            amountInput.on('paste', calculateSum);
            amountInput.on('cut', calculateSum);
            priceInput.keyup(calculateSum);
            priceInput.on('paste', calculateSum);
            priceInput.on('cut', calculateSum);

            item.append(amountInput);
            item.append(' x ' + _sCurrencyPrefix);
            item.append(priceInput);
            item.append(_sCurrencySuffix);

            base.append(item);
        }

        calculateSum();

        var buyAllButtonOuter = $('<div style="text-align:center;margin:10px"></div>');
        buyAllButtonOuter.append(buyAllButton);
        base.append(buyAllButtonOuter);

        ShowDialog(_csBuyCards, base);
    }

    function getCardsOrder() {
        var cardItems = $(".badge_card_set_card");
        var cardNames = [];
        var cardAmounts = [];
        var i;

        cardItems.each(function(index, o) {
            var item = $(o);
            var cardTextObj = item.find(".badge_card_set_text:first");
            var cardName = cardTextObj.contents().filter(function(index, elem) { return elem.nodeType === 3 && $(elem).text().trim() != ""; }).first().text().trim();
            var cardAmountObj = cardTextObj.children(".badge_card_set_text_qty");
            var cardAmount = cardAmountObj.length == 0 ? 0 : cardAmountObj.text();

            if (cardAmountObj.length != 0) {
                cardAmount = parseInt(cardAmount.substring(1, cardAmount.length - 1));
            }

            cardNames.push(cardName);
            cardAmounts.push(cardAmount);
        });

        for (var k in _oCardsInformation) {
            var item = _oCardsInformation[k];
            for (i=0; i<cardNames.length; i++) {
                if (item.name == cardNames[i] || (item.name.startsWith(cardNames[i]) && item.name.substring(cardNames[i].length).match(/^\s*\([^\)]+\)\s*$/) != null)) {
                    break;
                }
            }

            if (i == cardNames.length) {
                _aCards = null;
                return false;
            }

            _aCards[i] = k;
            item.amount = cardAmounts[i];
        }

        console.log(_aCards);
        return true;
    }

    if (!parseCurrentURL()) {
        return;
    }

    AsyncRunner.run(function(_, onfinish) {
        getWalletInfo(onfinish);
    })
    .then(function(_, onfinish) {
        console.log(_oWalletInfo);
        fillCurrencyData();
        loadCardSetInfo(100, onfinish);
    })
    .then(function(_, onfinish) {
        fillCardInfomartion();
        if (getCardsOrder()) {
            _cBuyCardButton.click(showBuyCardDialog);
            $('.gamecards_inventorylink').append(_cBuyCardButton);
            // don't call onfinish to exit
        } else {
            getInventory(100, onfinish);
        }
    })
    .then (function(_, onfinish) {
        fillCardAmounts();
        _cBuyCardButton.click(showBuyCardDialog);
        $('.gamecards_inventorylink').append(_cBuyCardButton);
        onfinish();
    })
    .start();

})();