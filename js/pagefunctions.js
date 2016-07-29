$(document).ajaxStart(function () {
    if (!$("body").hasClass("loading")) $("body").addClass("loading"); // Show spinning wheel whenever an ajax query is being made
});

$(document).ajaxStop(function () {
    if ($("body").hasClass("loading")) $("body").removeClass("loading"); // Hide spinning wheel when ajax query is finished
});

var apiURL = "https://order.thr1ve.me/api/";
//var apiURL = "http://www.thr1ve.blendev.com/api/";
//var apiURL = "http://localhost:53095/api/";

$(document).ready(function () {
    //InitLocalStorage();

    getCart();
    // Populate the store dropdown from the API


    $.ajax({
        url: apiURL + "GetStores",
        type: "GET",
        dataType: "json",
        crossDomain: true,
        success: function (data) {
            $(".selectStore").empty();
            $(".selectStore").append($("<option>", { selected: true, value: "0", text: "Please Select" }));
            initializeMapMarkers(null, "1");
            localStorage.setItem("storeList", JSON.stringify(data.stores));
            $.each(data.stores, function () {
                $(".selectStore").append($("<option>", { value: this["StoreId"], text: this["StoreName"] }));
                var _Latitude = this["Latitude"];
                var _Longitude = this["Longitude"];
                if (_Latitude != null && _Longitude != null) {
                    var pos = {
                        lat: _Latitude,
                        lng: _Longitude
                    };

                    initializeMapMarkers(pos, "2", this["StoreName"], this["Image"], this["PhoneNumber"], this["OpenTimeText"], this["StoreId"]);

                    //displayMarkers(pos);
                }

            });
            selectStore();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            message("Something went wrong, please try again later.");
        }
    });



    // Populate the categories tabs from the API

    $.ajax({
        url: apiURL + "GetCollections",
        type: "GET",
        dataType: "json",
        crossDomain: true,
        success: function (colelctionsResponse) {
            //var productionCollection = JSON.parse(localStorage.getItem("productCollection"));
            //if (productionCollection != null && productionCollection.length > 0)
            //{ bindProducts(colelctionsResponse); } else {
            localStorage.setItem("colelctionsResponse", JSON.stringify(colelctionsResponse));
            $.ajax({
                url: apiURL + "GetProducts",
                type: "POST",
                dataType: "json",
                data: "collectionId=" + null,
                crossDomain: true,
                success: function (productsResponse) {
                    localStorage.setItem("productCollection", JSON.stringify(productsResponse.products));
                    bindProducts(colelctionsResponse);
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    message("Something went wrong, please try again later.");
                }
            });
            //}
        },
        error: function (jqXHR, textStatus, errorThrown) {
            message("Something went wrong, please try again later.");
        }
    });

    $("#menupage").on("pagebeforeshow", function (event, data) {
        // Check that there is a valid session
        checksession();
    });

    $("#indexform").validate({
        submitHandler: function (form) {
            // Validate
            var err = 0;
            $('.advice-err').remove();
            $('.validation_pickup').each(function () {

                if ($(this).val() == '' || $(this).val() == '0') {
                    $(this).parents('.pickup-field-sec').append('<div class="advice-err">*required</div>');
                    $(this).css({ "border": "1px solid #b61312" });
                    err = 1;
                } else {
                    $(this).css({ "border": "1px solid #999" });
                }
            })
            if (err == 1) {
                $('#indexform .green').hide();
                return false;

            } else {
                //return true;
                $('#indexform .green').show();
            }

            // Create a new session
            newsession($(".selectStore").val(), $(".selectTime").val());

            // Transition to menu page
            $(":mobile-pagecontainer").pagecontainer("change", "#menupage", {
                reload: false
            });

            // Suppress submit refresh
            return false;
        }
    });

    $(".locationOrder").click(function () {
        // *** Change the store name here, assume ASAP for the time. $(".selectStore")... + trigger change + $(".selectTime")...

        // Create a new session
        newsession($(".selectStore").val(), $(".selectTime").val());

        // Transition to menu page
        $(":mobile-pagecontainer").pagecontainer("change", "#menupage", {
            reload: false
        });
    });

    $(".selectStore").change(function () {
        $(".selectStore").val(this.value);
        // *** Store selected time, update time dropdown, then attempt to reselect previous time

        $(".selectTime").empty();
        if ($(".selectStore").val() == "" || $(".selectStore").val() == "0") {
            $(".selectTime").append($("<option>", { selected: true, value: "0", text: "Select store first" }));
            $("#divJog").hide();
            return;
        }

        // Populate the time dropdown from the API
        $.ajax({
            url: apiURL + "GetStoreDetails",
            type: "POST",
            dataType: "json",
            data: "storeId=" + $(".selectStore").val(),
            crossDomain: true,
            success: function (data) {

                if (isNaN(parseInt(data.storeDetails["OpenTime"], 10)) || isNaN(parseInt(data.storeDetails["CloseTime"], 10))) {
                    $(".selectTime").append($("<option>", { selected: true, value: "0", text: "Store Closed" }));
                    return;
                }

                var openTime = new Date();
                openTime.setHours(data.storeDetails["OpenTime"].substr(0, 2), data.storeDetails["OpenTime"].substr(2, 2), 0, 0); // Set the opening time

                var closeTime = new Date();
                closeTime.setHours(data.storeDetails["CloseTime"].substr(0, 2), data.storeDetails["CloseTime"].substr(2, 2), 0, 0); // Set the closing time

                var currentTime = new Date(); // Get the current time
                var roundedCurrentTime = new Date(Math.ceil(currentTime.getTime() / 300000) * 300000); // Round current time up to the nearest 5 minutes

                var timeSlot = new Date(Math.max(openTime, roundedCurrentTime)); // Set the first timeslot based on the opening time or current time, whichever is higher

                // Create an array of times between opening/current and closing hours
                while (timeSlot < closeTime) {
                    var time24 = ("0" + timeSlot.getHours()).substr(-2);// + ":" + ("0" + timeSlot.getMinutes()).substr(-2);
                    if (time24 == "00")
                        time24 = "12" + ":" + ("0" + timeSlot.getMinutes()).substr(-2);
                    else
                        time24 = time24 + ":" + ("0" + timeSlot.getMinutes()).substr(-2);

                    var time12 = ("0" + (timeSlot.getHours() > 11 ? timeSlot.getHours() - 12 : timeSlot.getHours())).substr(-2);// + ":" + ("0" + timeSlot.getMinutes()).substr(-2) + (timeSlot.getHours() > 11 ? " PM" : " AM");
                    if (time12 == "00")
                        time12 = "12" + ":" + ("0" + timeSlot.getMinutes()).substr(-2) + (timeSlot.getHours() > 11 ? " PM" : " AM");
                    else
                        time12 = time12 + ":" + ("0" + timeSlot.getMinutes()).substr(-2) + (timeSlot.getHours() > 11 ? " PM" : " AM");

                    if (timeSlot.getTime() === roundedCurrentTime.getTime()) {
                        time24 = time12 = "ASAP"; // If the timeslot matches the rounded current time, rename it to ASAP
                    }
                    $(".selectTime").append($("<option>", { value: time24, text: time12 }));
                    timeSlot.setMinutes(timeSlot.getMinutes() + 5);
                }

                if ($(".selectTime").size() == 0) $(".selectTime").append($("<option>", { selected: true, value: "0", text: "Store Closed" }));
            },
            error: function (jqXHR, textStatus, errorThrown) {
                message("Something went wrong, please try again later.");
            }
        });
        debugger;
        $("#currentSelectedStore").text($(".selectStore :selected").text());
        $("#currentSelectedTime").text($(".selectTime").val());

        selectNearestStore($(".selectStore").val());
        // *** Update session
        bindProducts(JSON.parse(localStorage.getItem("colelctionsResponse")));
    });

    $(".selectTime").change(function () {
        $(".selectTime").val(this.value);
        // *** Update session
        $("#currentSelectedStore").text($(".selectStore :selected").text());
        $("#currentSelectedTime").text($(".selectTime").val());
    });

    getExcludedProducts();
});

function getExcludedProducts() {
    $.ajax({
        url: apiURL + "GetExcludedProducts",
        type: "GET",
        dataType: "json",
        crossDomain: true,
        success: function (excludedProductsResponse) {

            localStorage.setItem("excludedProductCollection", JSON.stringify(excludedProductsResponse));
        },
        error: function (jqXHR, textStatus, errorThrown) {
            message("<h1>Whoops!</h1>Something went wrong, please try again later.");
        }
    });
}

function bindProducts(colelctionsResponse) {
    $(".nav-tabs").empty();
    
    var productionCollection = JSON.parse(localStorage.getItem("productCollection"));
    var firstcollectionId = null;
    $("#mainProductDiv").empty();
    // *** We need to sort by sortOrder first. http://stackoverflow.com/questions/8886494/jquery-sort-results-of-each
    $.each(colelctionsResponse.collections, function () {
        var collectionId = this["id"];

        // Populate the products in each category tab from the API
        var products = productionCollection.filter(function (obj) {
            return obj.collectionId === collectionId;
        });
        if (products.length > 0) {
            if (firstcollectionId == null)
                firstcollectionId = collectionId;
            var excludeProducts = JSON.parse(localStorage.getItem("excludedProductCollection")).filter(function (obj) {
                return obj.StoreId === parseInt($(".selectStore").val());
            });
            $(".nav-tabs").append('<li id="li' + collectionId + '" role="tab" aria-controls="tab_item-' + collectionId + '" class="resp-tab-item"><a href="#' + collectionId + '" data-toggle="tab">' + this["title"] + '</a></li>');
            var newParent = "";
            newParent = '<div role="tabpanel" class="tab-pane fade" id=' + collectionId + '>';
            newParent = newParent + '<div class="wraper_menu_list">';
            newParent = newParent + '<div class="container">';
            newParent = newParent + '<div class="row menu_list">';

            $.each(products, function () {
                var addProduct = true;
                var productId = this["productId"];
                $.each(excludeProducts, function () {
                    if (this.ProductId == productId)
                        addProduct = false;
                });
                
                if (addProduct) {

                    var _price = "";
                    if (this["price"] > 0)
                        _price = "$" + this["price"];

                    if (this["title"].indexOf("#") < 0) {
                        var productImg = processImage(this["image"]);
                        newParent = newParent + '<div class="col-lg-3 col-md-3 col-sm-6 col-xs-12" data-toggle="modal"  data-target="#MenuSelect" onclick="loadproduct(' + this["productId"] + ');">';
                        newParent = newParent + '<div class="menu_list_item">';
                        newParent = newParent + '<div class="holder matchHeight">';
                        newParent = newParent + '<div class="pic"><img src="' + productImg + '" alt="" width="322" height="290"></div>';
                        newParent = newParent + '<div class="data">';
                        newParent = newParent + '<h3><a>' + this["title"] + '</a></h3>';
                        newParent = newParent + '<h4>' + _price + '</h4>';
                        newParent = newParent + '<ul class="feature">';
                        newParent = newParent + '<li class="veg visible"></li>';
                        newParent = newParent + '<li class="milk visible"></li>';
                        newParent = newParent + '<li class="juice visible"></li>';
                        newParent = newParent + '</ul>';
                        newParent = newParent + '<p>' + this["descriptionHtml"] + '</p>';

                        newParent = newParent + '</div>';
                        newParent = newParent + '</div>';
                        newParent = newParent + '</div>';
                        newParent = newParent + '</div>';
                    }
                }
            });

            newParent = newParent + '</div>';
            newParent = newParent + '</div>';
            newParent = newParent + '</div>';
            newParent = newParent + '</div>';
            $("#mainProductDiv").append(newParent);
        }
    });

    if (firstcollectionId != null)
        showProductTab(firstcollectionId);
    $(".matchHeight").matchHeight();
    if ($("body").hasClass("loading")) $("body").removeClass("loading"); // Hide spinning wheel when ajax query is finished
}

function showProductTab(collectionId) {
    //$("#productTabs > *").css('display', 'none');
    $("#" + collectionId).removeClass("active in");
    $("#collectionTabs li").removeClass("active");
    $("#li" + collectionId).addClass("active");
    $("#" + collectionId).addClass("active in");
    //$("#" + collectionId).show();
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function selectStore() {

    var storeId = getParameterByName('StoreId');
    if (storeId != null && storeId != "") {
        $(".selectStore").val(storeId);
        // *** Store selected time, update time dropdown, then attempt to reselect previous time

        $(".selectTime").empty();

        if ($(".selectStore").val() == "" || $(".selectStore").val() == "0") {
            $(".selectTime").append($("<option>", { selected: true, value: "0", text: "Select store first" }));
            $("#divJog").hide();
            return;
        }

        // Populate the time dropdown from the API
        $.ajax({
            url: apiURL + "GetStoreDetails",
            type: "POST",
            dataType: "json",
            data: "storeId=" + $(".selectStore").val(),
            crossDomain: true,
            success: function (data) {

                if (isNaN(parseInt(data.storeDetails["OpenTime"], 10)) || isNaN(parseInt(data.storeDetails["CloseTime"], 10))) {
                    $(".selectTime").append($("<option>", { selected: true, value: "0", text: "Store Closed" }));
                    return;
                }

                var openTime = new Date();
                openTime.setHours(data.storeDetails["OpenTime"].substr(0, 2), data.storeDetails["OpenTime"].substr(2, 2), 0, 0); // Set the opening time

                var closeTime = new Date();
                closeTime.setHours(data.storeDetails["CloseTime"].substr(0, 2), data.storeDetails["CloseTime"].substr(2, 2), 0, 0); // Set the closing time

                var currentTime = new Date(); // Get the current time
                var roundedCurrentTime = new Date(Math.ceil(currentTime.getTime() / 300000) * 300000); // Round current time up to the nearest 5 minutes

                var timeSlot = new Date(Math.max(openTime, roundedCurrentTime)); // Set the first timeslot based on the opening time or current time, whichever is higher

                // Create an array of times between opening/current and closing hours
                while (timeSlot < closeTime) {
                    var time24 = ("0" + timeSlot.getHours()).substr(-2);// + ":" + ("0" + timeSlot.getMinutes()).substr(-2);
                    if (time24 == "00")
                        time24 = "12" + ":" + ("0" + timeSlot.getMinutes()).substr(-2);
                    else
                        time24 = time24 + ":" + ("0" + timeSlot.getMinutes()).substr(-2);

                    var time12 = ("0" + (timeSlot.getHours() > 11 ? timeSlot.getHours() - 12 : timeSlot.getHours())).substr(-2);// + ":" + ("0" + timeSlot.getMinutes()).substr(-2) + (timeSlot.getHours() > 11 ? " PM" : " AM");
                    if (time12 == "00")
                        time12 = "12" + ":" + ("0" + timeSlot.getMinutes()).substr(-2) + (timeSlot.getHours() > 11 ? " PM" : " AM");
                    else
                        time12 = time12 + ":" + ("0" + timeSlot.getMinutes()).substr(-2) + (timeSlot.getHours() > 11 ? " PM" : " AM");

                    if (timeSlot.getTime() === roundedCurrentTime.getTime()) {
                        time24 = time12 = "ASAP"; // If the timeslot matches the rounded current time, rename it to ASAP
                    }
                    $(".selectTime").append($("<option>", { value: time24, text: time12 }));
                    timeSlot.setMinutes(timeSlot.getMinutes() + 5);
                }

                if ($(".selectTime").size() == 0) $(".selectTime").append($("<option>", { selected: true, value: "0", text: "Store Closed" }));
            },
            error: function (jqXHR, textStatus, errorThrown) {
                message("Something went wrong, please try again later.");
            }
        });
        window.location.href = "#menupage";
    }
}

function getCart() {

    $.ajax({
        url: apiURL + "GetCart",
        type: "POST",
        dataType: "json",
        data: "sessionValue=" + localStorage.getItem("userBrowserKey"),
        crossDomain: true,
        success: function (data) {
            $(".table1").empty();
            var _total = 0;
            $.each(data.cart, function () {
                _total = _total + (parseFloat(this.price) + parseFloat(this.ExtraPrice));
                $(".table1").append("<tr>" +
                      "<td align=\"left\" valign=\"middle\">" + this.qty + "</td>" +
                      "<td align=\"left\" valign=\"middle\">" + this.title + "</td>" +
                      "<td align=\"left\" valign=\"middle\">$" + (parseFloat(this.price) + parseFloat(this.ExtraPrice)) + "</td>" +
                      "<td align=\"left\" valign=\"middle\"><a onclick='removeCartItem(" + this.Id + ")' href=\"#\" class=\"remove_item\">(remove)</a></td>" +
                  "</tr>");
            });
            sessionStorage.setItem("cartItems", data.cart.length);
            $(".table1").append("<tr>" +
                      "<td align=\"left\" valign=\"middle\">&nbsp;</td>" +
                      "<td align=\"left\" valign=\"middle\">TOTAL</td>" +
                      "<td align=\"left\" valign=\"middle\">$" + _total + "</td>" +
                      "<td align=\"left\" valign=\"middle\">&nbsp;</td>" +
                  "</tr>");
        },
        error: function (jqXHR, textStatus, errorThrown) {
            message("Something went wrong, please try again later.");
        }
    });
}

function InitLocalStorage() {
    // Clear the stored productCollection object and prepare a new array
    var a = [];
    a.push(JSON.parse(localStorage.getItem('productCollection')));
    localStorage.setItem('productCollection', JSON.stringify(a));

    // Create a new sessionId
    localStorage.setItem("userBrowserKey", getSessionId())
}

function getSessionId() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 8; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function SaveDataToLocalStorage(data) {

    var a = [];
    // Parse the serialized data back into an array of objects
    a = JSON.parse(localStorage.getItem('productCollection'));
    // Push the new data (whether it be an object or anything else) onto the array
    a.push(data);
    // Re-serialize the array back into a string and store it in localStorage
    localStorage.setItem('productCollection', JSON.stringify(a));
}

function loadproduct(productId) {
    $("#divAddtocart").empty();
    $("#divAddtocart").append('<a class="btn" href="#" onclick="addtocart()">Add To Order</a>');
    $("#divAddtocart").append('<h5>Any extras?</h5>');
    localStorage.removeItem("allsteptext");
    localStorage.removeItem("steptext");

    var data = [];
    // Parse the serialized data back into an array of objects
    data = JSON.parse(localStorage.getItem('productCollection'));
    var result = data.filter(function (obj) { return obj.productId == productId; });
    
    $("#mainVariantId").val(result[0].variantId);
    $("#mainProductId").val(result[0].productId);
    $("#selProductImage").attr("src", processImage(result[0].image));

    $("#selproductTitle").html(result[0].title + " ");
    $("#selproductPrice").html("$" + result[0].price);
    $("#selproductDescription").html(result[0].description);

    $("#addtocartCustomBowl").hide();
    $("#nextStepVariantExtra").hide();
    $("#addvarianttoCart").hide();
    $("#addtoCart").show();
    $("#nextStep").hide();
    
    if (result[0].variants == null || result[0].variants.length === 0) {
        $("#selproductExtras").html("");
        if (result[0].extras == null || result[0].extras.length === 0) {
            $("#selproductExtras").html("");
        } else {
            $("#addvarianttoCart").hide();
            $("#addtoCart").show();
            $("#nextStep").hide();

            $.each(result[0].extras, function () {
                var newElement = $('<tr></tr>');
                $("#selproductExtras").append(newElement);
                var productImg = processImage(this["image"]);
                newElement.append('<td>' + this["title"] + '</td>');
                newElement.append('<td>$' + this["price"] + '</td>');
                newElement.append('<td><a id="' + this["variantId"] + '" class="btn" href="#">Add</a></td>');
                //newElement.append('<li><div class="add_img"><img src="' + productImg + '"></div><div class="add_price clearfix"><h2>' + this["title"] + '</h2><span> $' + this["price"] + '</span></div><div class="added_overlay" id="' + this["variantId"] + '"><span>ADDED!</span></div></li>');
            });
        }
    } else {
        localStorage.setItem("variants", JSON.stringify(result[0].variants));
        localStorage.setItem("variantExtras", JSON.stringify(result[0].extras));
        localStorage.setItem("step", 0);
        var _variants = result[0].variants[0];
        $("#productExtras").html("<h2>" + _variants.title + "</h2>");
        var newElement = $('<ul></ul>');
        $("#productExtras").append(newElement);

        var _variantsArray = _variants.values.split(',');
        for (i = 0; i < _variantsArray.length; i++) {
            newElement.append('<li><div class="add_img"><img src=""></div><div class="add_price clearfix"><h2>' + _variantsArray[i].replace('[', '').replace(']', '') + '</h2><span></span></div><div class="added_overlay"><span>ADDED!</span></div></li>');
        }

        $("#addvarianttoCart").hide();
        $("#addtoCart").hide();
        $("#nextStep").show();
        
    }


    $('.btn').click(function (e) {
        e.preventDefault();
        $(this).text('ADDED!').addClass('active');
        //$(this).parent().parent().find('.anyExtra').show();
    });
    //$(".add_item li").click(function () {

    //    if ($("#addtoCart").is(":hidden"))
    //        $(".added_overlay").removeClass("open_close");
    //    var selectedText = $(this).find(".add_price h2").text();
    //    if (localStorage.getItem("steptext") == selectedText)
    //        localStorage.removeItem("steptext");
    //    else {
    //        localStorage.setItem("steptext", selectedText);
    //        $(this).find(".added_overlay").toggleClass("open_close");
    //    }
    //});

    //$(":mobile-pagecontainer").pagecontainer("change", "#productpage", {
    //    reload: false
    //});
}

function loadVariantExtras() {
    $("#nextStepVariantExtra").hide();
    var _resultExtras = JSON.parse(localStorage.getItem("variantExtras"));
    $("#addvarianttoCart").hide();
    $("#addtoCart").hide();
    $("#nextStep").hide();
    $("#addtocartCustomBowl").show();
    $("#productExtras").html('<h2>Don\'t Feel Saucy..</h2>');
    var newElement = $('<ul></ul>');
    $("#productExtras").append(newElement);
    $.each(_resultExtras, function () {

        var productImg = processImage(this["image"]);
        newElement.append('<li><div class="add_img"><img src="' + productImg + '"></div><div class="add_price clearfix"><h2>' + this["title"] + '</h2><span></span></div><div class="added_overlay" id="' + this["variantId"] + '"><span>ADDED!</span></div></li>');
    });

    $(".add_item li").click(function () {

        if ($("#addtoCart").is(":hidden"))
            $(".added_overlay").removeClass("open_close");
        var selectedText = $(this).find(".add_price h2").text();
        if (localStorage.getItem("steptextExtra") == selectedText)
            localStorage.removeItem("steptextExtra");
        else {
            localStorage.setItem("steptextExtra", selectedText);
            $(this).find(".added_overlay").toggleClass("open_close");
        }
    });

    $(":mobile-pagecontainer").pagecontainer("change", "#productpage", {
        reload: false
    });
}

function nextstep() {
    var prevText = localStorage.getItem("allsteptext");
    var steptext = localStorage.getItem("steptext");
    if (steptext != null && steptext != "") {
        if (prevText == null)
            prevText = "";
        else
            prevText = prevText + ",";
        localStorage.setItem("allsteptext", prevText + steptext);


        var step = localStorage.getItem("step");
        var _result = JSON.parse(localStorage.getItem("variants"));
        $("#productExtras").html("");
        var _variants = _result[parseInt(step) + 1];
        $("#productExtras").html("<h2>" + _variants.title + "</h2>");
        var newElement = $('<ul></ul>');
        $("#productExtras").append(newElement);

        var _variantsArray = _variants.values.split(',');
        for (i = 0; i < _variantsArray.length; i++) {
            newElement.append('<li><div class="add_img"><img src=""></div><div class="add_price clearfix"><h2>' + _variantsArray[i].replace('[', '').replace(']', '') + '</h2><span></span></div><div class="added_overlay"><span>ADDED!</span></div></li>');
        }
        
        localStorage.setItem("step", parseInt(step) + 1);
        if (_result.length - 1 == parseInt(step) + 1) {
            var _resultExtras = JSON.parse(localStorage.getItem("variantExtras"));
            if (_resultExtras != null && _resultExtras.length > 0) {
                $("#nextStepVariantExtra").show();
                $("#addvarianttoCart").hide();
                $("#addtoCart").hide();
                $("#nextStep").hide();
            } else {
                $("#nextStepVariantExtra").hide();
                $("#addvarianttoCart").show();
                $("#addtoCart").hide();
                $("#nextStep").hide();
            }
        }
        else {
            $("#nextStepVariantExtra").hide();
            $("#addvarianttoCart").hide();
            $("#addtoCart").hide();
            $("#nextStep").show();
        }


        $(".add_item li").click(function () {

            $(".added_overlay").removeClass("open_close");
            var selectedText = $(this).find(".add_price h2").text();
            if (localStorage.getItem("steptext") == selectedText)
                localStorage.removeItem("steptext");
            else {
                localStorage.setItem("steptext", selectedText);
                $(this).find(".added_overlay").toggleClass("open_close");
            }
        });

        $(":mobile-pagecontainer").pagecontainer("change", "#productpage", {
            reload: false
        });
        localStorage.removeItem("steptext");
    }
    else {
        message("Please Choose One.");
    }
}

function processImage(img) {
    if (img == null) {
        return "";
    } else {
        return (img.substr(0, 2) == "//" ? "https:" : "") + img;
    }
}

function addvarianttocart() {
    
    if (localStorage.getItem("steptext") != null && localStorage.getItem("steptext") != "") {
        var prevText = localStorage.getItem("allsteptext");
        var _text = prevText.split(',');
        var _options1 = "";
        var _options2 = "";
        var _options3 = "";
        if (_text != null && _text[0] != undefined)
            _options1 = _text[0];
        if (_text != null && _text[1] != undefined)
            _options2 = _text[1];
        if (_text != null && _text[2] != undefined)
            _options3 = _text[2];

        if (localStorage.getItem("steptext") != null && localStorage.getItem("steptext") != "")
            _options3 = localStorage.getItem("steptext");

        if (_options2 == "") {
            _options2 = _options3;
            _options3 = "";
        }

        $.ajax({
            url: apiURL + "GetVariantId",
            type: "post",
            data: {
                ProductId: $("#mainProductId").val(),
                Option1: _options1,
                Option2: _options2,
                Option3: _options3
            },
            dataType: "json",
            crossDomain: true,
            success: function (data) {

                var postData = {
                    sessionValue: localStorage.getItem("userBrowserKey"),
                    variantId: data.VariantId,
                    qty: "1",
                    variantTitle: _options1 + "," + _options2 + "," + _options3
                }
                if (data == null || data.isSuccess == false) {
                    message("Invalid Combination.");
                }
                else {
                    $.ajax({
                        url: apiURL + "AddCart",
                        type: "POST",
                        dataType: "json",
                        data: postData,
                        crossDomain: true,
                        success: function (data) {
                            getCart();
                            window.location.href = "#menupage";
                            message("Item Added in Cart");
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            message("Something went wrong, please try again later.");
                        }
                    });
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                message("Something went wrong, please try again later.");
            }
        });

        //var mainVariantId = $("#mainProductId").val();
        //var extras = [];
        //$.each($('.added_overlay.open_close'), function () {
        //    extras.push({ 'variantId': '' + this.id + '' });
        //});
    }
    else
        message("Please Choose One.");
}

function addtocart() {
    var mainVariantId = $("#mainVariantId").val();
    var extras = [];
    $.each($('.btn'), function () {
        if (this.innerText == "ADDED!") {
            extras.push({ 'variantId': '' + this.id + '' });
        }
    });
    var postData = {
        sessionValue: localStorage.getItem("userBrowserKey"),
        variantId: $("#mainVariantId").val(),
        qty: "1",
        variantTitle: "",
        extras: extras
    }
    $.ajax({
        url: apiURL + "AddCart",
        type: "POST",
        dataType: "json",
        data: postData,
        crossDomain: true,
        success: function (data) {
            getCart();
            window.location.href = "#menupage";
            message("Item Added in Cart");
        },
        error: function (jqXHR, textStatus, errorThrown) {
            message("Something went wrong, please try again later.");
        }
    });
}

function addvarianttocartCustom() {

    if (localStorage.getItem("steptext") != null && localStorage.getItem("steptext") != "") {
        var prevText = localStorage.getItem("allsteptext");
        var _text = prevText.split(',');
        var _options1 = "";
        var _options2 = "";
        var _options3 = "";
        if (_text != null && _text[0] != undefined)
            _options1 = _text[0];
        if (_text != null && _text[1] != undefined)
            _options2 = _text[1];
        if (_text != null && _text[2] != undefined)
            _options3 = _text[2];

        if (localStorage.getItem("steptext") != null && localStorage.getItem("steptext") != "")
            _options3 = localStorage.getItem("steptext");

        if (_options2 == "") {
            _options2 = _options3;
            _options3 = "";
        }
        
        $.ajax({
            url: apiURL + "GetVariantId",
            type: "post",
            data: {
                ProductId: $("#mainProductId").val(),
                Option1: _options1,
                Option2: _options2,
                Option3: _options3
            },
            dataType: "json",
            crossDomain: true,
            success: function (data) {
                
                var postData = {
                    sessionValue: localStorage.getItem("userBrowserKey"),
                    variantId: data.VariantId,
                    qty: "1",
                    variantTitle: _options1 + "," + _options2 + "," + _options3
                }
                if (data == null || data.isSuccess == false) {
                    message("Invalid Combination.");
                }
                else {
                    $.ajax({
                        url: apiURL + "AddCart",
                        type: "POST",
                        dataType: "json",
                        data: postData,
                        crossDomain: true,
                        success: function (data) {
                            addtocartCustom();
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            message("Something went wrong, please try again later.");
                        }
                    });
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                message("Something went wrong, please try again later.");
            }
        });

        //var mainVariantId = $("#mainProductId").val();
        //var extras = [];
        //$.each($('.added_overlay.open_close'), function () {
        //    extras.push({ 'variantId': '' + this.id + '' });
        //});
    }
    else
        message("Please Choose One.");
}

function addtocartCustom() {
    
    var mainVariantId = $("#mainVariantId").val();
    var extras = [];
    $.each($('.added_overlay.open_close'), function () {
        extras.push({ 'variantId': '' + this.id + '' });
    });
    var postData = {
        sessionValue: localStorage.getItem("userBrowserKey"),
        variantId: $("#mainVariantId").val(),
        qty: "1",
        variantTitle: "",
        extras: extras
    }

    $.ajax({
        url: apiURL + "AddCart",
        type: "POST",
        dataType: "json",
        data: postData,
        crossDomain: true,
        success: function (data) {
            window.location.href = "#menupage";
            getCart();
            //message("Item Added in Cart");
        },
        error: function (jqXHR, textStatus, errorThrown) {
            message("Something went wrong, please try again later.");
        }
    });
}

function message(msg) {
    var popup_html = "<div class=\"popup_choose_ur_base\"><div class=\"alert_popup\"><div class=\"close-btn\"></div>" + msg + "</div></div>";
    $("body").append(popup_html);
}

function removeCartItem(cartItemId) {

    $.ajax({
        url: apiURL + "DeleteCartItem",
        type: "DELETE",
        dataType: "json",
        data: "cartItemId=" + cartItemId,
        crossDomain: true,
        success: function (data) {
            getCart();
            message("Item removed from cart.");
        },
        error: function (jqXHR, textStatus, errorThrown) {
            message("Something went wrong, please try again later.");
        }
    });
}



var map;
function initializeMapMarkers(pos, init, storeName, image, phoneNumber, openTimeText, storeId) {

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var targetpos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            if (init == "2") {
                var distance = getDistanceFromLatLonInKm(targetpos.lat, targetpos.lng, pos.lat, pos.lng);
                if (distance <= 100) {
                    $("#storeLocations").append("<li class=\"clearfix\">" +
                               "<div class=\"loc_img\"><img src=\"" + image + "\" alt=\"no img\"></div>" +
                               "<div class=\"loc_cont\">" +
                                   "<h3>" + storeName + "</h3>" +
                                   "<p>" + phoneNumber + " <br>" + openTimeText + "</p>" +
                                   "<h4></h4>" +
                                   "<input onclick='menupage(" + storeId + ",menupage)' type=\"button\" value=\"START ORDER\" class=\"my_order locationOrder\" data-role=\"none\">" +
                               "</div>" +
                           "</li>");

                    displayMarkers(pos);
                }
            }
            else {
                locationName(position.coords.latitude, position.coords.longitude);
                map.setCenter(targetpos);
            }
        }, function () {
            //handleLocationError(true, infoWindow, map.getCenter());
        });
    } else {
        // Browser doesn't support Geolocation
        //handleLocationError(false, infoWindow, map.getCenter());
    }
}

function initMap() {
    map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: -34.397, lng: 150.644 },
        zoom: 10
    });
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {

    infoWindow.setPosition(pos);
    infoWindow.setContent(browserHasGeolocation ?
                          'Error: The Geolocation service failed.' :
                          'Error: Your browser doesn\'t support geolocation.');
}

function displayMarkers(pos) {

    var image = 'images/thr1velocation.png';
    var beachMarker = new google.maps.Marker({
        position: { lat: pos.lat, lng: pos.lng },
        map: map,
        icon: image
    });
    beachMarker.setMap(map);
}

function locationName(latitude, longitude) {
    var geocoder;
    geocoder = new google.maps.Geocoder();
    var latlng = new google.maps.LatLng(latitude, longitude);

    geocoder.geocode(
        { 'latLng': latlng },
        function (results, status) {
            if (status == google.maps.GeocoderStatus.OK) {
                if (results[0]) {
                    var add = results[0].formatted_address;
                    var value = add.split(",");
                    
                    count = value.length;
                    country = value[count - 1];
                    state = value[count - 2];
                    city = value[count - 3];
                    $("#locationHeader").show();
                    $("#currentCity").show();

                    if (city != "")
                        $("#currentCity").text(city);
                    else {
                        $("#locationHeader").hide();
                        $("#currentCity").hide();
                    }
                }
                else {
                    message("address not found");
                }
            }
            else {
                message("Geocoder failed due to: " + status);
            }
        }
    );
}

function menupage(storeId, pageName) {
    if (storeId != null && storeId != "") {
        $(".selectStore").val(storeId);
        // *** Store selected time, update time dropdown, then attempt to reselect previous time

        $(".selectTime").empty();

        if ($(".selectStore").val() == "" || $(".selectStore").val() == "0") {
            $(".selectTime").append($("<option>", { selected: true, value: "0", text: "Select store first" }));
            $("#divJog").hide();
            return;
        }

        // Populate the time dropdown from the API
        $.ajax({
            url: apiURL + "GetStoreDetails",
            type: "POST",
            dataType: "json",
            data: "storeId=" + $(".selectStore").val(),
            crossDomain: true,
            success: function (data) {

                if (isNaN(parseInt(data.storeDetails["OpenTime"], 10)) || isNaN(parseInt(data.storeDetails["CloseTime"], 10))) {
                    $(".selectTime").append($("<option>", { selected: true, value: "0", text: "Store Closed" }));
                    return;
                }

                var openTime = new Date();
                openTime.setHours(data.storeDetails["OpenTime"].substr(0, 2), data.storeDetails["OpenTime"].substr(2, 2), 0, 0); // Set the opening time

                var closeTime = new Date();
                closeTime.setHours(data.storeDetails["CloseTime"].substr(0, 2), data.storeDetails["CloseTime"].substr(2, 2), 0, 0); // Set the closing time

                var currentTime = new Date(); // Get the current time
                var roundedCurrentTime = new Date(Math.ceil(currentTime.getTime() / 300000) * 300000); // Round current time up to the nearest 5 minutes

                var timeSlot = new Date(Math.max(openTime, roundedCurrentTime)); // Set the first timeslot based on the opening time or current time, whichever is higher

                // Create an array of times between opening/current and closing hours
                while (timeSlot < closeTime) {
                    var time24 = ("0" + timeSlot.getHours()).substr(-2);// + ":" + ("0" + timeSlot.getMinutes()).substr(-2);
                    if (time24 == "00")
                        time24 = "12" + ":" + ("0" + timeSlot.getMinutes()).substr(-2);
                    else
                        time24 = time24 + ":" + ("0" + timeSlot.getMinutes()).substr(-2);

                    var time12 = ("0" + (timeSlot.getHours() > 11 ? timeSlot.getHours() - 12 : timeSlot.getHours())).substr(-2);// + ":" + ("0" + timeSlot.getMinutes()).substr(-2) + (timeSlot.getHours() > 11 ? " PM" : " AM");
                    if (time12 == "00")
                        time12 = "12" + ":" + ("0" + timeSlot.getMinutes()).substr(-2) + (timeSlot.getHours() > 11 ? " PM" : " AM");
                    else
                        time12 = time12 + ":" + ("0" + timeSlot.getMinutes()).substr(-2) + (timeSlot.getHours() > 11 ? " PM" : " AM");

                    if (timeSlot.getTime() === roundedCurrentTime.getTime()) {
                        time24 = time12 = "ASAP"; // If the timeslot matches the rounded current time, rename it to ASAP
                    }
                    $(".selectTime").append($("<option>", { value: time24, text: time12 }));
                    timeSlot.setMinutes(timeSlot.getMinutes() + 5);
                }

                if ($(".selectTime").size() == 0) $(".selectTime").append($("<option>", { selected: true, value: "0", text: "Store Closed" }));
            },
            error: function (jqXHR, textStatus, errorThrown) {
                message("Something went wrong, please try again later.");
            }
        });
        window.location.href = "#" + pageName;
    }
}




function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {

    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km

    return d;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}


function selectNearestStore(storeId) {
    //window.location.href = "#locationspage";
    var nearestStore;
    var prevDistance = 0;
    var storesList = JSON.parse(localStorage.getItem("storeList"));
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var targetpos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            if (storeId != 0 && storeId != -1) {
                
                storesList = $.grep(storesList, function (element, index) {
                    return element.StoreId == storeId;
                });
            }
            
            $.each(storesList, function () {
                var _Latitude = this["Latitude"];
                var _Longitude = this["Longitude"];
                var distance = getDistanceFromLatLonInKm(targetpos.lat, targetpos.lng, _Latitude, _Longitude);

                if (prevDistance == 0 || distance < prevDistance) {
                    prevDistance = distance;
                    nearestStore = this;
                }
            });
            $("#divJog").hide();
            if (prevDistance > 5)
                $("#divJog").show();
            if (storeId == 0) {
                $(".selectStore").val(nearestStore.StoreId);
                menupage(nearestStore.StoreId, "menupage");
            }
            if (storeId == -1) {
                $(".selectStore").val(nearestStore.StoreId);
                menupage(nearestStore.StoreId, "locationspage");

            }
        });
    }
}
