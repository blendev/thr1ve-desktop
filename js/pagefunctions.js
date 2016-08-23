$(document).ajaxStart(function () {
    if (!$("body").hasClass("loading")) $("body").addClass("loading"); // Show spinning wheel whenever an ajax query is being made
});

$(document).ajaxStop(function () {
    if ($("body").hasClass("loading")) $("body").removeClass("loading"); // Hide spinning wheel when ajax query is finished
});

//var apiURL = "https://order.thr1ve.me/api/";            //Desktop API
var apiURL = "http://localhost:53095/api/";

$(document).ready(function () {
    //initMap();
    InitLocalStorage();

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
        getExcludedProducts();

        $(".selectStore").val(this.value);
        getOrderTypes();
        // *** Store selected time, update time dropdown, then attempt to reselect previous time

        $(".selectTime").empty();

        if ($(".selectStore").val() == "" || $(".selectStore").val() == "0") {
            $(".selectTime").append($("<option>", { selected: true, value: "0", text: "Please select..." }));
            $("#divJog").hide();
            bindProducts(JSON.parse(localStorage.getItem("colelctionsResponse")));
            return;
        }

        // Populate the time dropdown from the API
        $.ajax({
            url: apiURL + "GetStoreDetails",
            type: "POST",
            dataType: "json",
            data: {
                StoreId: $(".selectStore").val()
            },
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

                if ($('select.selectTime option').length == 0) $(".selectTime").append($("<option>", { selected: true, value: "0", text: "Store Closed" }));
                if ($("body").hasClass("loading")) $("body").removeClass("loading"); // Hide spinning wheel when ajax query is finished

                $(".currentSelectedStore").text($("#checkoutSelectStore :selected").text());
                $(".currentSelectedTime").text($("#checkoutSelectStoreTime").val());
                checkCollectionTime();
                bindProducts(JSON.parse(localStorage.getItem("colelctionsResponse")));
            },
            error: function (jqXHR, textStatus, errorThrown) {
                message("<h1>Whoops!</h1>Something went wrong, please try again later.");
                if ($("body").hasClass("loading")) $("body").removeClass("loading"); // Hide spinning wheel when ajax query is finished
            }
        });

        selectNearestStore($(".selectStore").val());
        // *** Update session
        
    });

    $(".selectTime").change(function () {
        $(".selectTime").val(this.value);
        // *** Update session
        $(".currentSelectedStore").text($("#checkoutSelectStore :selected").text());
        $(".currentSelectedTime").text($("#checkoutSelectStoreTime").val());

        checkCollectionTime();
        bindProducts(JSON.parse(localStorage.getItem("colelctionsResponse")));
    });

    $(".currentSelectedStore").text("Please Select...");
    $(".currentSelectedTime").text("Please Select...");
    getExcludedProducts();
    getOrderTypes();
});

function createSession(refreshStores) {
    var postData = {
        AppType: "web",
        AppVersion: "",
        UserAgent: getUserAgent(),
        CustomField: ""
    }
    $.ajax({
        url: apiURL + "session",
        type: "POST",
        dataType: "json",
        data: postData,
        crossDomain: true,
        success: function (data) {
            localStorage.setItem("userBrowserKey", data.SessionId);
            getCart(false);
            if (refreshStores) {
                $.ajax({
                    url: apiURL + "GetStores",
                    type: "GET",
                    dataType: "json",
                    crossDomain: true,
                    success: function (data) {
                        $(".selectStore").empty();
                        $(".selectStore").append($("<option>", { selected: true, value: "0", text: "Please Select..." }));
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
                        message("<h1>Whoops!</h1>Something went wrong, please try again later.");
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
                                message("<h1>Whoops!</h1>Something went wrong, please try again later.");
                            }
                        });
                        //}
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        message("<h1>Whoops!</h1>Something went wrong, please try again later.");
                    }
                });
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            message("<h1>Whoops!</h1>Something went wrong, Session could not be start. please try again later.");
        }
    });
}

function getUserAgent() {
    return navigator.userAgent;
}

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
        if (products != null && products.length > 0) {
            if (firstcollectionId == null)
                firstcollectionId = collectionId;
            if (localStorage.getItem("excludedProductCollection") != null) {
                var excludeProducts = JSON.parse(localStorage.getItem("excludedProductCollection")).filter(function (obj) {
                    return obj.StoreId === parseInt($(".selectStore").val());
                });
            }
            $(".nav-tabs").append('<li id="li' + collectionId + '" role="tab" aria-controls="tab_item-' + collectionId + '" class="resp-tab-item"><a href="#' + collectionId + '" data-toggle="tab">' + this["title"] + '</a></li>');
            var newParent = "";
            newParent = '<div role="tabpanel" class="tab-pane fade" id=' + collectionId + '>';
            newParent = newParent + '<div class="wraper_menu_list">';
            newParent = newParent + '<div class="container">';
            newParent = newParent + '<div class="row menu_list">';

            $.each(products, function () {
                var addProduct = true;
                var productId = this["productId"];
                if (excludeProducts != null) {
                    $.each(excludeProducts, function () {
                        if (this.ProductId == productId)
                            addProduct = false;
                    });
                }

                if (addProduct) {
                    var barcode = this.barCode;
                    
                    var displayFrom = barcode.substring(barcode.indexOf("displayFrom"));
                    if (displayFrom.indexOf(";") >= 0)
                        displayFrom = displayFrom.substring(0, displayFrom.indexOf(";"));

                    var displayTo = barcode.substring(barcode.indexOf("displayTo"));
                    if (displayTo.indexOf(";") >= 0)
                        displayTo = displayTo.substring(0, displayTo.indexOf(";"));

                    displayFrom = displayFrom.split(':')[1].split(',').toString().trim();
                    displayTo = displayTo.split(':')[1].split(',').toString().trim();
                    debugger;
                    if ((checkProductTime(displayFrom, displayTo)) || (displayFrom == "" || displayTo == "")) {
                        var tag1Image = "";

                        var barCodeAllergens = "";

                        if (barcode != null && barcode != "") {

                            if (barcode.indexOf("allergens") >= 0) {
                                barCodeAllergens = barcode.substring(barcode.indexOf("allergens"));
                                if (barCodeAllergens.indexOf(";") >= 0)
                                    barCodeAllergens = barCodeAllergens.substring(0, barCodeAllergens.indexOf(";"));
                                barCodeAllergens = barCodeAllergens.split(':')[1].split(',');
                            }
                            if (barcode.indexOf("tag1") >= 0)
                                tag1Image = "images/tag1.png";
                            //if (barcode.indexOf("img2") >= 0)
                            //    img2 = "images/img2.png";
                            //if (barcode.indexOf("img3") >= 0)
                            //    img3 = "images/img3.png";
                        }
                        var _price = "";
                        if (this["price"] > 0)
                            _price = "$" + this["price"];

                        if (this.variants.length > 0)
                            _price = "";

                        if (this["title"].indexOf("#") < 0) {
                            var productImg = processImage(this["image"]);
                            if (this.variants == null || this.variants.length === 0) {

                                var extrasExtra = this.extras;
                                var vId = extrasExtra == null ? null : extrasExtra[0].variantId;
                                var resultExtras = null;
                                if (vId != null && vId != undefined) {
                                    resultExtras = productionCollection.filter(function (obj) { return obj.variantId == vId; });
                                }

                                if (resultExtras != null && resultExtras.length > 0) {

                                    newParent = newParent + '<div class="col-lg-3 col-md-3 col-sm-6 col-xs-12" data-toggle="modal"  data-target="#MenuSelect1" onclick="loadproduct(' + this["productId"] + ');">';
                                }
                                else
                                    newParent = newParent + '<div class="col-lg-3 col-md-3 col-sm-6 col-xs-12" data-toggle="modal"  data-target="#MenuSelect" onclick="loadproduct(' + this["productId"] + ');">';
                            }
                            else
                                newParent = newParent + '<div class="col-lg-3 col-md-3 col-sm-6 col-xs-12" data-toggle="modal"  data-target="#MenuSelect1" onclick="loadproduct(' + this["productId"] + ');">';
                            newParent = newParent + '<div class="menu_list_item">';
                            newParent = newParent + '<div class="holder matchHeight">';
                            newParent = newParent + '<div class="pic"><img src="' + productImg + '" alt="" width="322" height="290"></div>';
                            newParent = newParent + '<div class="data">';
                            newParent = newParent + '<h3><a>' + this["title"] + '</a></h3>';
                            newParent = newParent + '<h4>' + _price + '</h4>';
                            newParent = newParent + '<ul class="feature">';

                            for (var im = 0; im < barCodeAllergens.length; im++) {
                                newParent = newParent + '<li><img src="images/' + barCodeAllergens[im].toString().trim() + '"></li>';
                            }
                            //if (img2 != "")
                            //    newParent = newParent + '<li class="veg visible"></li>';
                            //if (img3 != "")
                            //    newParent = newParent + '<li class="milk visible"></li>';
                            //newParent = newParent + '<li class="juice visible"></li>';
                            newParent = newParent + '</ul>';
                            newParent = newParent + '<p>' + this["descriptionHtml"] + '</p>';

                            newParent = newParent + '</div>';
                            newParent = newParent + '</div>';
                            newParent = newParent + '</div>';
                            newParent = newParent + '</div>';
                        }
                    }
                }
            });

            checkCollectionTime();
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

function checkCollectionTime() {
    var colelctionsResponse = JSON.parse(localStorage.getItem("colelctionsResponse"));
    var selectedTime = $(".selectTime").val();

    //if (selectedTime == "ASAP") {
    //    var secondTime = $(".selectTime option:eq(1)").val();
    //    if (secondTime != null) {
    //        secondTime = secondTime.toString().replace(":", "");
    //        selectedTime = secondTime - 5;
    //    }
    //}

    if (selectedTime == "ASAP") {
        var selectedTime = $(".selectTime option:eq(1)").val();
    }

    if (selectedTime != null && selectedTime != 0) {
        selectedTime = selectedTime.toString().replace(":", "");
        $.each(colelctionsResponse.collections, function () {

            var displayFrom = this["displayFrom"];
            var displayTo = this["displayTo"];
            if (selectedTime >= displayFrom && selectedTime <= displayTo)
                $("#li" + this["id"]).show();
            else
                $("#li" + this["id"]).hide();
        });
    }
}

function checkProductTime(displayFrom, displayTo) {

    var selectedTime = $(".selectTime").val();

    if (selectedTime == "ASAP") {
        var selectedTime = $(".selectTime option:eq(1)").val();
    }

    if (selectedTime != null && selectedTime != 0) {
        selectedTime = selectedTime.toString().replace(":", "");
        if (selectedTime >= displayFrom && selectedTime <= displayTo)
            return false;
        else
            return true;
    }
    return true;
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
            $(".selectTime").append($("<option>", { selected: true, value: "0", text: "Please Select..." }));
            $("#divJog").hide();
            return;
        }

        getStoreDetails("menupage");
    }
}

function getCart() {

    $.ajax({
        url: apiURL + "GetCart",
        type: "POST",
        dataType: "json",
        data: {
            sessionValue: localStorage.getItem("userBrowserKey")
        },
        crossDomain: true,
        success: function (data) {
            $(".table1").empty();
            var _total = 0;
            $.each(data.cart, function () {
                var extraItems = "";
                if (this.ExtraName != null && this.ExtraName != "")
                    extraItems = this.ExtraName;
                else if (this.VariantTitle != null && this.VariantTitle != "")
                    extraItems = this.VariantTitle;

                _total = _total + (parseFloat(this.price) + parseFloat(this.ExtraPrice));
                $(".table1").append("<tr>" +
                      "<td align=\"left\" valign=\"middle\">" + this.qty + "</td>" +
                      "<td align=\"left\" valign=\"middle\" style=\"word-break:break-all;\">" + this.title + "<br><span class='cartSubText'>" + extraItems + "</span></td>" +
                      //"<td align=\"left\" valign=\"middle\">" + this.title + "</td>" +
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

            if (data.cart.length <= 0) {
                $("#cartSelectButton").click();
                //message("<h1>Whoops!</h1>Cart is empty.");
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            message("<h1>Whoops!</h1>Something went wrong, please try again later.");
        }
    });
}

function getOrderTypes() {
    $.ajax({
        url: apiURL + "GetOrderType",
        type: "post",
        data: {
            StoreId: $(".selectStore").val()
        },
        dataType: "json",
        crossDomain: true,
        success: function (data) {
            $("#orderType").empty();
            var count = 0;
            $.each(data, function () {
                var checked = false;
                if (count == 0)
                    checked = true;
                if (this.Status != "False") {
                    if (checked) {
                        $("#orderType").append('<div class="col-lg-6 col-md-6 col-sm-6 col-xs-12"><div class="form-row">' +
                                '<input type="radio" id=' + this.OrderTypeEnum + ' name="radio-1-set" value=' + this.OrderTypeEnum + ' class="regular-radio" checked />' +
                                '<label  for=' + this.OrderTypeEnum + '>' + this.OrderType + '</label>' +
                            '</div></div>');
                    }
                    else {
                        $("#orderType").append('<div class="col-lg-6 col-md-6 col-sm-6 col-xs-12"><div class="form-row">' +
                                '<input type="radio" id=' + this.OrderTypeEnum + ' name="radio-1-set" value=' + this.OrderTypeEnum + ' class="regular-radio" />' +
                                '<label for=' + this.OrderTypeEnum + '>' + this.OrderType + '</label>' +
                            '</div></div>');
                    }
                }
                else {
                    $("#orderType").append('<div class="col-lg-6 col-md-6 col-sm-6 col-xs-12"><div class="form-row">' +
                        '<input disabled="disabled" type="radio" id=' + this.OrderTypeEnum + ' name="radio-1-set" value=' + this.OrderTypeEnum + ' class="regular-radio" />' +
                        '<label for=' + this.OrderTypeEnum + '>' + this.OrderType + '</label>' +
                    '</div></div>');
                }
                count = count + 1;
            });

            //if (count < 2)
            //    $("#orderType").hide();
            //else
            //    $("#orderType").show();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            message("<h1>Whoops!</h1>Something went wrong, please try again later.");
        }
    });
}

function InitLocalStorage() {
    // Clear the stored productCollection object and prepare a new array
    //var a = [];
    //a.push(JSON.parse(localStorage.getItem('productCollection')));
    //localStorage.setItem('productCollection', JSON.stringify(a));

    // Create a new sessionId
    //localStorage.setItem("userBrowserKey", getSessionId())

    createSession(true);
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
    if ($(".selectStore").val() == '' || $(".selectStore").val() == '0') {
        
        $(".selectStore").addClass("validation");
        setTimeout(function () {
            $('.selectStore').removeClass("validation");
        }, 4000);
    }
    else if ($(".selectTime").val() == '' || $(".selectTime").val() == '0') {
        message("<h1>Whoops!</h1>This store is closed for the day. Please choose another store or come back tomorrow.");
    }
    else {
        $("#divAddtocart").empty();
        $("#divAddtocartButton").empty();
        
        $("#productFeatureModal").empty();
        localStorage.removeItem("steptext");
        
        var data = [];
        // Parse the serialized data back into an array of objects
        data = JSON.parse(localStorage.getItem('productCollection'));
        var result = data.filter(function (obj) { return obj.productId == productId; });
        //var img2 = "";
        //var img3 = "";
        var barcode = result[0].barCode;
        var barCodeAllergens = "";
        if (barcode != null && barcode != "") {
            if (barcode.indexOf("allergens") >= 0) {
                barCodeAllergens = barcode.substring(barcode.indexOf("allergens"));
                if (barCodeAllergens.indexOf(";") >= 0)
                    barCodeAllergens = barCodeAllergens.substring(0, barCodeAllergens.indexOf(";"));
                barCodeAllergens = barCodeAllergens.split(':')[1].split(',');
            }
            //if (barcode.indexOf("img2") >= 0)
            //    $("#productFeatureModal").append('<li class="veg visible"></li>');
            //if (barcode.indexOf("img3") >= 0)
            //    $("#productFeatureModal").append('<li class="milk visible"></li>');
        }

        for (var im = 0; im < barCodeAllergens.length; im++) {
            $("#productFeatureModal").append('<li><img src="images/' + barCodeAllergens[im].toString().trim() + '"></li>');
        }

        $("#mainVariantId").val(result[0].variantId);
        $("#mainProductId").val(result[0].productId);
        $("#selProductImage").attr("src", processImage(result[0].image));
        $("#selproductTitle").html(result[0].title + " ");
        $("#selproductPrice").html("$" + result[0].price);
        $("#selproductDescription").html(result[0].descriptionHtml);

        $("#selproductVTitle").html(result[0].title + " ");
        $("#selVProductImage").attr("src", processImage(result[0].image));
        $("#selproductVDescription").html(result[0].descriptionHtml);

        $("#addvarianttoCart").hide();
        $("#addvariantExtrastoCart").hide();
        $("#addtoCart").show();
        $("#variantSteps").empty();

        if (result[0].variants == null || result[0].variants.length === 0) {
            $("#selproductExtras").html("");
            if (result[0].extras == null || result[0].extras.length === 0) {
                $("#selproductExtras").html("");
            } else {
                $("#addvarianttoCart").hide();
                $("#addvariantExtrastoCart").hide();
                $("#addtoCart").show();


                var vId = result[0].variantId;
                var resultExtras = null;
                if (vId != null && vId != undefined) {
                    resultExtras = data.filter(function (obj) { return obj.variantId == vId; });
                }
                if (resultExtras != null && resultExtras.length > 0 && resultExtras[0].extras[0].title.indexOf("#") >= 0) {
                    loadExtrasExtra(result);
                    $("#addvariantExtrastoCart").show();
                    $("#addvarianttoCart").hide();
                    $("#addtoCart").hide();
                }
                else {
                    $("#divAddtocart").append('<h5>Any extras?</h5>');
                    $.each(result[0].extras, function () {
                        var _extraprice = "";
                        if (this["price"] > 0)
                            _extraprice = "$" + this["price"];

                        var newElement = $('<tr></tr>');
                        $("#selproductExtras").append(newElement);
                        var productImg = processImage(this["image"]);
                        newElement.append('<td>' + this["title"] + '</td>');
                        newElement.append('<td>' + _extraprice + '</td>');
                        newElement.append('<td><a id="' + this["variantId"] + '" class="btn" href="#">Add</a></td>');
                        //newElement.append('<li><div class="add_img"><img src="' + productImg + '"></div><div class="add_price clearfix"><h2>' + this["title"] + '</h2><span> $' + this["price"] + '</span></div><div class="added_overlay" id="' + this["variantId"] + '"><span>ADDED!</span></div></li>');
                    });
                }
            }
            $("#divAddtocartButton").append('<a class="btn" href="#" onclick="addtocart()">Add To Order</a>');
        } else {
            localStorage.setItem("variantExtras", JSON.stringify(result[0].extras));

            var _variants = result[0].variants;
            localStorage.setItem("variantSteps", _variants.length);
            for (v = 0; v < _variants.length; v++) {
                $("#variantSteps").append("<h2>" + _variants[v].title + "</h2>");
                var newElement = $('<div class="productList"></div>');
                $("#variantSteps").append(newElement);

                var innerElements = "<ul class='add_item'>"
                var _variantsArray = _variants[v].values.split(',');
                var _variantsImageArray = "";
                if (_variants[v].image != null && _variants[v].image != "")
                    _variantsImageArray = _variants[v].image.split(',');

                for (i = 0; i < _variantsArray.length; i++) {

                    if (_variantsImageArray != "" && _variantsImageArray[i] != undefined)
                        innerElements = innerElements + '<li><div class="card"><div class="prodImg"></div><img src="' + _variantsImageArray[i].replace('[', '').replace(']', '') + '" alt=""><div class="detail"><h3>' + _variantsArray[i].replace('[', '').replace(']', '') + '</h3><span></span>' +
                                                        '</div></div></li>';
                    else
                        innerElements = innerElements + '<li><div class="card"><div class="prodImg"><img src="" alt=""></div><div class="detail"><h3>' + _variantsArray[i].replace('[', '').replace(']', '') + '</h3><span></span>' +
                                                    '</div></div></li>';
                }
                innerElements = innerElements + '</ul>';
                newElement.append(innerElements);
                $(".add_item li").click(function () {
                    $(this).parent("ul").find(".card").removeClass("open_close");
                    $(this).find(".card").toggleClass("open_close");
                    
                    $(this).parent("ul").find(".prodImg").removeClass("open_close_img");
                    $(this).find(".prodImg").toggleClass("open_close_img");
                });
            }
            $("#addvarianttoCart").show();

            $(".add_item li").click(function () {
                
                $(this).find(".added_overlay").toggleClass("open_close");
            });
        }
        $('.btn').click(function (e) {
            e.preventDefault();
            $(this).text('ADDED!').addClass('active');
            //$(this).parent().parent().find('.anyExtra').show();
        });
        
    }
}

function loadExtrasExtra(result) {
    var data = [];
    data = JSON.parse(localStorage.getItem('productCollection'));
    $("#variantSteps").empty();
    var _variants = result[0].extras;

    localStorage.setItem("variantSteps", _variants.length);
    for (v = 0; v < _variants.length; v++) {
        var resultExtras = null;
        var vId = _variants[v].variantId;
        if (vId != null && vId != undefined) {
            resultExtras = data.filter(function (obj) { return obj.variantId == vId; });

            if (resultExtras != null && resultExtras.length > 0) {
                resultExtras = resultExtras[0].extras;

                $("#variantSteps").append("<h2>" + _variants[v].title.replace('#', '') + "</h2>");
                var newElement = $('<div class="productList"></div>');
                $("#variantSteps").append(newElement);
                var innerElements = "<ul class='add_item'>"

                for (ve = 0; ve < resultExtras.length; ve++) {
                    var _rextraprice = "";
                    if (resultExtras[ve].price > 0)
                        _rextraprice = "$" + resultExtras[ve].price;

                    var productImg = processImage(resultExtras[ve].image);
                    innerElements = innerElements + '<li><div class="card" id="' + resultExtras[ve].variantId + '"><div class="prodImg"></div><img src="' + productImg + '" alt=""><div class="detail"><h3>' + resultExtras[ve].title + '<span>' + _rextraprice + '</span></h3>' +
                                    //'<div class="iconBar"><a href="#"><img src="images/img3.png" alt=""></a> <a href="#"><img src="images/img2.png" alt=""></a></div>' +
                                    //'<div class="description">' + resultExtras[ve].descriptionHtml + '</div>' +
                                    '</div></div></li>';
                }
                innerElements = innerElements + '</ul>';
                newElement.append(innerElements);
            }
        }

    }
    $(".add_item li").click(function () {
        $(this).find(".card").toggleClass("open_close");
        $(this).find(".prodImg").toggleClass("open_close_img");
    });
    
}

function processImage(img) {
    if (img == null) {
        return "";
    } else {
        return (img.substr(0, 2) == "//" ? "https:" : "") + img;
    }
}

function addvariantExtrastocart() {
    var extras = [];
    var variantSteps = localStorage.getItem("variantSteps");
    $.each($('.card.open_close'), function () {
        extras.push({ 'variantId': '' + this.id + '' });
    });
    var validSteps = true;
    $("#variantSteps > .productList").each(function () {
        debugger;
        var op = $(this).find(".open_close");
        if (op.length <= 0)
            validSteps = false;
    });

    if (validSteps) {
        var postData = {
            storeId: $(".selectStore").val(),
            time: $(".selectTime").val(),
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
                
                if (!data.isSuccess && data.errorMessage.indexOf("BasketOverLimit") >= 0) {
                    var maxOrderAmount = data.errorMessage.substring(data.errorMessage.indexOf("#") + 1);
                    window.location.href = "#menupage";
                    messageReqButtonClick("<h1>WE'RE SORRY</h1>Due to high demand at the moment we are accepting orders up to $" + maxOrderAmount + " only. If you have a larger order, please contact the store directly. Thank you!  <br> <button type='button' class='btnPopup'>OK, GOT IT!</button>");
                    $(".close").click();
                }
                else {
                    getCart();
                    window.location.href = "#menupage";
                    message('<img src="images/Untitled-1.png"/><h1>Boom</h1>Added to your order!');
                    $(".close").click();
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                message("<h1>Whoops!</h1>Something went wrong, please try again later.");
            }
        });
    }
    else
        messageReqButtonClick("<h1>HANG ON...</h1>You have to choose at least one from each step to proceed, please<button type='button' class='btnPopup'>OK, GOT IT!</button>");
}

function addvarianttocart() {
    
    var _variantTitle = "";
    var variantSteps = localStorage.getItem("variantSteps");
    $.each($('.card.open_close'), function () {

        _variantTitle = _variantTitle + $(this).find("h3").text() + ",";
    });
    if (variantSteps == $('.card.open_close').length) {
        _variantTitle = _variantTitle.substring(0, _variantTitle.length - 1);
        $.ajax({
            url: apiURL + "GetVariantId",
            type: "post",
            data: {
                ProductId: $("#mainProductId").val(),
                Option1: _variantTitle
            },
            dataType: "json",
            crossDomain: true,
            success: function (data) {
                var postData = {
                    storeId: $(".selectStore").val(),
                    time: $(".selectTime").val(),
                    sessionValue: localStorage.getItem("userBrowserKey"),
                    variantId: data.VariantId,
                    qty: "1",
                    variantTitle: _variantTitle
                }
                if (data == null || data.isSuccess == false) {
                    message("<h1>Whoops!</h1>Invalid Combination.");
                }
                else {
                    $.ajax({
                        url: apiURL + "AddCart",
                        type: "POST",
                        dataType: "json",
                        data: postData,
                        crossDomain: true,
                        success: function (data) {
                            if (!data.isSuccess && data.errorMessage.indexOf("BasketOverLimit") >= 0) {
                                var maxOrderAmount = data.errorMessage.substring(data.errorMessage.indexOf("#") + 1);
                                window.location.href = "#menupage";
                                messageReqButtonClick("<h1>WE'RE SORRY</h1>Due to high demand at the moment we are accepting orders up to $" + maxOrderAmount + " only. If you have a larger order, please contact the store directly. Thank you!  <br> <button type='button' class='btnPopup'>OK, GOT IT!</button>");
                                $(".close").click();
                            }
                            else {
                                getCart();
                                window.location.href = "#menupage";
                                message('<img src="images/Untitled-1.png"/><h1>Boom</h1>Added to your order!');
                                $(".close").click();
                            }
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            message("<h1>Whoops!</h1>Something went wrong, please try again later.");
                        }
                    });
                }
            },
            error: function (jqXHR, textStatus, errorThrown) {
                message("<h1>Whoops!</h1>Something went wrong, please try again later.");
            }
        });
    }
    else
        messageReqButtonClick("<h1>HANG ON...</h1>You have to choose at least one to proceed, please<button type='button' class='btnPopup'>OK, GOT IT!</button>");
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
        storeId: $(".selectStore").val(),
        time: $(".selectTime").val(),
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
            if (!data.isSuccess && data.errorMessage.indexOf("BasketOverLimit") >= 0) {
                var maxOrderAmount = data.errorMessage.substring(data.errorMessage.indexOf("#") + 1);
                window.location.href = "#menupage";
                messageReqButtonClick("<h1>WE'RE SORRY</h1>Due to high demand at the moment we are accepting orders up to $" + maxOrderAmount + " only. If you have a larger order, please contact the store directly. Thank you!  <br> <button type='button' class='btnPopup'>OK, GOT IT!</button>");
                $(".close").click();
            }
            else {
                getCart();
                window.location.href = "#menupage";
                message('<img src="images/Untitled-1.png"/><h1>Boom</h1>Added to your order!');
                $(".close").click();
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            message("<h1>Whoops!</h1>Something went wrong, please try again later.");
        }
    });
}

function message(msg) {
    var popup_html = "<div class=\"popup_choose_ur_base\"><div class=\"alert_popup\"><div class=\"close-btn\"></div>" + msg + "</div></div>";
    $("body").append(popup_html);

    setTimeout(function () {
        $('.popup_choose_ur_base').remove();
    }, 2000);
}

function messageReqButtonClick(msg) {
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
            message('<img src="images/Untitled-1.png"/><h1>Boom</h1>Item removed from cart.');
        },
        error: function (jqXHR, textStatus, errorThrown) {
            message("<h1>Whoops!</h1>Something went wrong, please try again later.");
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
                //var distance = getDistanceFromLatLonInKm(targetpos.lat, targetpos.lng, pos.lat, pos.lng);
                //if (distance <= 100) {
                    $("#storeLocations").append("<p>" +
                           "<img src=\"" + image + "\" alt=\"no img\">" +
                           "<div class=\"locDes\">" +
                               "<h3>" + storeName + "</h3>" +
                               "<p>" + phoneNumber + " <br>" + openTimeText + "</p>" +
                               "<input onclick='menupage(" + storeId + ",\"menupage\")' type=\"button\" value=\"START ORDER\" class=\"my_order locationOrder\" data-role=\"none\">" +
                           "</div>");

                    //displayMarkers(pos);
                //}
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

    $('body').mouseover(function () {
        google.maps.event.trigger(map, 'resize');
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
                    message("<h1>Whoops!</h1>Address not found.");
                }
            }
            else {
                message("<h1>Whoops!</h1>Geocoder failed due to:" + status);
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
            $(".selectTime").append($("<option>", { selected: true, value: "0", text: "Please select..." }));
            $("#divJog").hide();
            return;
        }

        getStoreDetails(pageName);
    }
}


function getStoreDetails(pageName) {
    // Populate the time dropdown from the API
    $.ajax({
        url: apiURL + "GetStoreDetails",
        type: "POST",
        dataType: "json",
        data: {
            StoreId: $(".selectStore").val()
        },
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
            if ($('select.selectTime option').length == 0) $(".selectTime").append($("<option>", { selected: true, value: "0", text: "Store Closed" }));

            $(".currentSelectedStore").text($("#checkoutSelectStore :selected").text());
            $(".currentSelectedTime").text($("#checkoutSelectStoreTime").val());
        },
        error: function (jqXHR, textStatus, errorThrown) {
            message("<h1>Whoops!</h1>Something went wrong, please try again later.");
        }
    });
    window.location.href = "#" + pageName;
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

function privacy() {
    $(".privacyPolicy").show();
    $(".privacyPolicy").animate({ scrollTop: 0 }, "fast");
    $(".terms").hide();
}

function terms() {
    $(".terms").show();
    $(".terms").animate({ scrollTop: 0 }, "fast");
    $(".privacyPolicy").hide();
}