// ==UserScript==
// @name         Steam Badge Buy Card
// @namespace    https://github.com/herbix
// @version      1.0.1-alpha
// @license      GPLv3
// @description  Helper to buy cards in steam badge page
// @author       Chaofan
// @include      *://steamcommunity.com/profiles/*/gamecards/*
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// @require      https://code.jquery.com/ui/1.12.1/jquery-ui.js
// @homepageURL  https://github.com/herbix/MyTamperMonkeyScriptCollection
// @supportURL   https://github.com/herbix/MyTamperMonkeyScriptCollection
// @downloadURL  https://raw.githubusercontent.com/herbix/MyTamperMonkeyScriptCollection/master/SteamBadge/code.user.js
// @updateURL    https://raw.githubusercontent.com/herbix/MyTamperMonkeyScriptCollection/master/SteamBadge/code.user.js
// ==/UserScript==

(function() {
    'use strict';
    var $ = jQuery;

    function log(message) {
        console.log("Steam Badge Buy Card: " + message);
    }

    var hrefMatch = window.location.href.match(/http(s)?:\/\/steamcommunity.com\/profiles\/([0-9]+)\/gamecards\/([0-9]+)/)
    var currentPageId = hrefMatch[2];
    var badgeId = hrefMatch[3];
    if (g_steamID != currentPageId) {
        log("not current user: " + hrefMatch[2]);
        return;
    }
    
    var border = window.location.href.match(/border=1/) != null ? 1 : 0;

    var inventory = false;
    var cardSetInfomation = false;
    var walletInfo = false;
    var currencyData = false;
    var currencyPrefix = "";
    var currencySuffix = "";
    var cardsInformation = {};

    var buyCardButton = $('<a class="btn_grey_grey btn_small_thin" href="javascript:;"><span>购买卡牌</span></a>');
    buyCardButton.click(showBuyCardDialog);
    
    function loadCardSetInfo(count) {
        $.get("https://steamcommunity.com/market/search/render/", "query=&category_753_Game%5B%5D=tag_app_" + badgeId + "&category_753_cardborder%5B%5D=tag_cardborder_" + border + "&category_753_item_class%5B%5D=tag_item_class_2&appid=753&norender=1&count=" + count, function(result) {
            if (result.total_count > count) {
                setTimeout(function() {
                    loadCardSetInfo(result.total_count);
                }, 10);
                return;
            }
            
            cardSetInfomation = result;
            for (var i=0; i<cardSetInfomation.results.length; i++) {
                var item = cardSetInfomation.results[i];
                if (item.sell_listings <= 0) {
                    continue;
                }
                if (!(item.hash_name in cardsInformation)) {
                    cardsInformation[item.hash_name] = {
                        amount: 0,
                        icon: "https://steamcommunity-a.akamaihd.net/economy/image/" + item.asset_description.icon_url + "/96fx96f",
                        name: item.name,
                        price: item.sell_price,
                        price_text: item.sell_price_text,
                        hash_name: item.hash_name
                    }
                }
            }
            console.log(cardSetInfomation);
            
            setTimeout(function() {
                $.get("https://steamcommunity.com/inventory/" + g_steamID + "/753/6", "l=schinese&count=1", function(result) {
                    setTimeout(function() {
                        var count = result.total_inventory_count;
                        getInventory(count);
                    }, 10);
                });
            }, 10);
            
        }).fail(function() {
            setTimeout(function() {
                loadCardSetInfo();
            }, 1000);
        });;
    }

    function getInventory(count) {
        $.get("https://steamcommunity.com/inventory/" + g_steamID + "/753/6", "l=schinese&count=" + count, function(fullResult) {
            inventory = fullResult;
            fillCardInformation();
            $('.gamecards_inventorylink').append(buyCardButton);
        }).fail(function() {
            setTimeout(function() {
                getInventory(count);
            }, 1000);
        });
    }
    
    function getWalletInfo() {
        $.get("https://steamcommunity.com/market/", function(result) {
            var walletString = result.match(/var\s*g_rgWalletInfo\s*=\s*(\{.*\});/)
            walletInfo = JSON.parse(walletString[1]);
            console.log(walletInfo);
            
            for (var k in g_rgCurrencyData) {
                if (g_rgCurrencyData[k].eCurrencyCode == walletInfo.wallet_currency) {                    
                    currencyData = g_rgCurrencyData[k];
                    if (currencyData.bSymbolIsPrefix) {
                        currencyPrefix = currencyData.strSymbol + " ";
                    } else {
                        currencySuffix = " " + currencyData.strSymbol;
                    }
                    break;
                }
            }
            
            loadCardSetInfo(100);
        }).fail(function() {
            setTimeout(function() {
                getCurrencyInfo();
            }, 1000);
        });
    }

    function fillCardInformation() {
        var assets = inventory.assets;
        var descs = inventory.descriptions;
        var descMap = {};
        var i;

        for (i=0; i<descs.length; i++) {
            descMap[descs[i].classid] = descs[i];
        }
        
        for (i=0; i<assets.length; i++) {
            var asset = assets[i];
            var desc = descMap[asset.classid];
            if (desc.market_fee_app == badgeId) {
                var tagCheck = false;
                for (var j=0; j<desc.tags.length; j++) {
                    var tag = desc.tags[j];
                    if (tag.category == "cardborder" && tag.internal_name == "cardborder_" + border) {
                        tagCheck = true;
                        break;
                    }
                }
                
                if (tagCheck) {
                    if (desc.market_hash_name in cardsInformation) {
                        cardsInformation[desc.market_hash_name].amount += parseInt(asset.amount);
                    } else {
                        cardsInformation[desc.market_hash_name] = {
                            amount: parseInt(asset.amount),
                            icon: "https://steamcommunity-a.akamaihd.net/economy/image/" + desc.icon_url + "/96fx96f",
                            name: desc.name,
                            hash_name: desc.market_hash_name
                        };
                    }
                }
            }
        }
        
        console.log(cardsInformation);
    }
    
    function showBuyCardDialog() {
        var base = $("<div></div>");
        var maxAmount = 1;
        var maxPrice = 0;
        var k, cardInfo;
        for (k in cardsInformation) {
            cardInfo = cardsInformation[k];
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
        var buyAllButton = $('<a class="btn_green_white_innerfade btn_medium_wide" style="min-width:140px"><span>购买所有</span></a>');
        
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
            
            buyAllButton.find("span").text("购买所有(" + currencyPrefix + (sum / 100.0) + currencySuffix + ")");
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
            var buyQueue = [];
            for (var i=0; i<amountInputs.length; i++) {
                var amountInput = amountInputs[i];
                var priceInput = priceInputs[i];
                
                var cardHash = cardHashes[i];
                var amount = parseInt(amountInput.val());
                var price = Math.round(parseFloat(priceInput.val()) * 100);
                var item = items[i];
                
                item.animate({backgroundColor: 'transparent'});
                
                buyQueue.push((function(cardHash, amount, price, item) {
                    return function() {
                        var callback = function(result) {
                            if (result.success == 1) {
                                item.animate({backgroundColor: '#5c7836'});
                            } else {
                                item.animate({backgroundColor: '#803030'});
                            }
                            
                            if (buyQueue.length > 0) {
                                (buyQueue.shift())();
                            } else {
                                loading.remove();
                                buying = false;
                                buyAllButton.removeClass('btn_disabled');
                            }
                        }
                        
                        if (amount > 0) {
                            $.post("https://steamcommunity.com/market/createbuyorder/", {
                                sessionid: g_sessionID,
                                currency: walletInfo.wallet_currency,
                                appid: 753,
                                market_hash_name: cardHash,
                                price_total: price * amount,
                                quantity: amount
                            }, callback);
                        } else {
                            callback({success: 1});
                        }
                    }
                })(cardHash, amount, price, item));
            }
            
            if (buyQueue.length > 0) {
                (buyQueue.shift())();
            } else {
                loading.remove();
                buying = false;
                buyAllButton.removeClass('btn_disabled');
            }
        });
        
        price.keyup(priceChange);
        price.on('paste', priceChange);
        price.on('cut', priceChange);
        
        topBar.append(buttonUp);
        topBar.append(buttonDown);
        topBar.append('<span style="margin-left:15px">' + currencyPrefix + '</span>');
        topBar.append(price);
        topBar.append(currencySuffix);
        
        base.append(topBar);
        base.append('<div style="clear:both;"></div>');

        for (k in cardsInformation) {
            cardInfo = cardsInformation[k];
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
            item.append(' x ' + currencyPrefix);
            item.append(priceInput);
            item.append(currencySuffix);
            
            base.append(item);
        }
        
        calculateSum();
        
        var buyAllButtonOuter = $('<div style="text-align:center;margin:10px"></div>');
        buyAllButtonOuter.append(buyAllButton);
        base.append(buyAllButtonOuter);
        
        ShowDialog("购买卡牌", base);
    }
    
    getWalletInfo();
})();;