$(document).ready(function () {
    $("#dropin-container").next('form').remove();
    var formElement = '<form id="checkout-form">' +
           '<input type="submit" style="margin-left:30%;" class="btnAddtoCart" value="PLACE ORDER">' +
       '</form>';
    $("#dropin-container").after(formElement);
    //localStorage.removeItem("customerNewId1");

    $("#btnLogout").click(function () {
        $("#dropin-container").empty();
        $("#dropin-container").next('form').remove();
        //var formElement = '<form id="checkout-form">' +
        //       '<input type="submit" class="my_order" value="PLACE ORDER">' +
        //   '</form>';
        //$("#dropin-container").after(formElement);
        localStorage.removeItem("customerNewId1");
        localStorage.removeItem("customerfirstName");
        localStorage.removeItem("customerlastName");
        localStorage.removeItem("customerEmailAddress");
        localStorage.removeItem("customerphoneNumber");

        $("#personalDetailsInner").hide();
        $("#customerLoginForm").show();
        $("#dvLogin").show();

        $("#returncustomerForm").hide();
        $("#dvLogout").hide();
        $("#returnmember").prop('checked', 'checked');
    });

    $('#horizontalTab').easyResponsiveTabs({
        type: 'default', //Types: default, vertical, accordion           
        width: 'auto', //auto or any width like 600px
        fit: true,   // 100% fit in a container
        closed: 'accordion', // Start closed if in accordion view
        activate: function (event) { // Callback function if tab is switched
            var $tab = $(this);
            var $info = $('#tabInfo');
            var $name = $('span', $info);

            $name.text($tab.text());

            $info.show();
        }
    });

    $("#returnmember").change(function () {
        $("#customerEmailAddress").val('');
        $("#customerPassword").val('');
        $("#dropin-container").empty();
        $("#dropin-container").next('form').remove();

        $("#returncustomerForm").hide();
        $("#dvLogout").hide();
        $("#personalDetailsInner").hide();
        if (localStorage.getItem("customerEmailAddress") != null && localStorage.getItem("customerEmailAddress") != "") {
            $("#firstName").val(localStorage.getItem("customerfirstName"));
            $("#lastName").val(localStorage.getItem("customerlastName"));
            $("#emailAddress").val(localStorage.getItem("customerEmailAddress"));
            $("#phoneNumber").val(localStorage.getItem("customerphoneNumber"));
        }
        if (localStorage.getItem("customerNewId1") == null || (localStorage.getItem("customerEmailAddress") == null || localStorage.getItem("customerEmailAddress") == "")) {
            $("#customerLoginForm").show();
            $("#dvLogin").show();
        }
        else {
            var formElement = '<form id="checkout-form">' +
                '<input type="submit" style="margin-left:30%;" class="btnAddtoCart" value="PLACE ORDER">' +
            '</form>';
            $("#dropin-container").after(formElement);

            $("#customerLoginForm").hide();
            $("#dvLogin").hide();
            $("#returncustomerForm").show();
            $("#dvLogout").show();
            if (localStorage.getItem("customerEmailAddress") != null && localStorage.getItem("customerEmailAddress") != "") {
                $("#returncustomerEmailAddress").val(localStorage.getItem("customerEmailAddress"));
            }
            returnCustomerToken();
        }
    });
    $("#newuser").change(function () {
        $("#dropin-container").empty();
        $("#dropin-container").next('form').remove();
        var formElement = '<form id="checkout-form">' +
               '<input type="submit" style="margin-left:30%;" class="btnAddtoCart" value="PLACE ORDER">' +
           '</form>';
        $("#dropin-container").after(formElement);
        $("#personalDetailsInner").show();
        $("#customerLoginForm").hide();
        $("#dvLogin").hide();
        $("#returncustomerForm").hide();
        $("#dvLogout").hide();
        $("#firstName").val('');
        $("#lastName").val('');
        $("#emailAddress").val('');
        $("#phoneNumber").val('');
        if (localStorage.getItem("customerEmailAddress") != null && localStorage.getItem("customerEmailAddress") != "") {
            $("#firstName").val(localStorage.getItem("customerfirstName"));
            $("#lastName").val(localStorage.getItem("customerlastName"));
            $("#emailAddress").val(localStorage.getItem("customerEmailAddress"));
            $("#phoneNumber").val(localStorage.getItem("customerphoneNumber"));
        }
        newCustomerToken();
    });

    $("#buttonLogin").click(function () {

        $("#customerEmailAddress").removeClass("validation"); // remove it
        $("#customerPassword").removeClass("validation"); // remove it
        if ($("#customerEmailAddress").val() == "" || $("#customerEmailAddress").val() == null) {
            $("#customerEmailAddress").addClass("validation");
        }
        if ($("#customerPassword").val() == "" || $("#customerPassword").val() == null) {
            $("#customerPassword").addClass("validation");
        }
        if ($("#customerEmailAddress").val() != "" && $("#customerPassword").val() != "") {
            var JSONObject = {
                "EmailAddress": $("#customerEmailAddress").val(),
                "Password": $("#customerPassword").val()
            };
            if (checkSession()) {
                $.ajax({
                    url: apiURL + localStorage.getItem("userBrowserKey") + "/GetCustomerDetails",
                    type: "POST",
                    dataType: "json",
                    data: JSONObject,
                    crossDomain: true,
                    success: function (data) {
                        //localStorage.setItem("storeList", JSON.stringify(data.stores));

                        if (data.Customer == undefined || data.Customer == null) {
                            message("<h1>Whoops!</h1>Unable to log in, username or password incorrect. Please check your details and try again.");
                        }
                        else {
                            var customerDetails = data.Customer;
                            localStorage.setItem("customerNewId1", customerDetails.Id);

                            localStorage.setItem("customerfirstName1", customerDetails.first_name);
                            localStorage.setItem("customerlastName1", customerDetails.last_name);
                            localStorage.setItem("customerEmailAddress1", customerDetails.email);
                            localStorage.setItem("customerphoneNumber", customerDetails.phoneNumber);

                            $("#firstName").val(customerDetails.first_name);
                            $("#lastName").val(customerDetails.last_name);
                            $("#emailAddress").val(customerDetails.email);
                            $("#phoneNumber").val(customerDetails.phoneNumber);
                            $("#returncustomerEmailAddress").val(customerDetails.email);
                            $("#returncustomerForm").show();
                            $("#dvLogout").show();

                            var formElement = '<form id="checkout-form">' +
                               '<input type="submit" style="margin-left:30%;" class="btnAddtoCart" value="PLACE ORDER">' +
                           '</form>';
                            $("#dropin-container").after(formElement);

                            $("#customerLoginForm").hide();
                            $("#dvLogin").hide();
                            returnCustomerToken();
                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        message("<h1>Whoops!</h1>Customer not exist.");
                    }
                });
            }
        }
    });

    $(".cart").click(function () {
        $("#password").val('');
        $("#customerEmailAddress").val('');
        $("#customerPassword").val('');
        var cartItems = sessionStorage.getItem("cartItems");
        if (cartItems > 0) {
            $("#PickUpTimeSelect").modal("show");
            if ($("#dropin-container").is(':empty')) {

                $("#personalDetailsInner").hide();
                $("#customerLoginForm").hide();
                $("#dvLogin").hide();
                $("#returncustomerForm").hide();
                $("#dvLogout").hide();

                if (localStorage.getItem("customerEmailAddress") != null && localStorage.getItem("customerEmailAddress") != "") {
                    $("#firstName").val(localStorage.getItem("customerfirstName"));
                    $("#lastName").val(localStorage.getItem("customerlastName"));
                    $("#emailAddress").val(localStorage.getItem("customerEmailAddress"));
                    $("#phoneNumber").val(localStorage.getItem("customerphoneNumber"));
                }
                if (localStorage.getItem("customerNewId1") == null || (localStorage.getItem("customerEmailAddress") == null || localStorage.getItem("customerEmailAddress") == "")) {
                    $("#personalDetailsInner").show();
                    $("#newuser").prop('checked', 'checked');
                    newCustomerToken();
                }
                else {
                    $("#returnmember").prop('checked', 'checked');
                    if (localStorage.getItem("customerEmailAddress") != null && localStorage.getItem("customerEmailAddress") != "") {
                        $("#firstName").val(localStorage.getItem("customerfirstName"));
                        $("#lastName").val(localStorage.getItem("customerlastName"));
                        $("#emailAddress").val(localStorage.getItem("customerEmailAddress"));
                        $("#phoneNumber").val(localStorage.getItem("customerphoneNumber"));
                        $("#returncustomerEmailAddress").val(localStorage.getItem("customerEmailAddress"));
                        $("#returncustomerForm").show();
                        $("#dvLogout").show();
                    }
                    returnCustomerToken();
                }
            }
        }
        else {
            message("<h1>Whoops!</h1>Cart is empty.");
        }
    });

    $(".close1, .close2, .close1_thankyou").click(function () {
        $(".popup_sec1").hide("slow");
        $(".popup_sec2").hide("slow");
        $(".terms").hide("slow");
        $(".privacyPolicy").hide("slow");
    });

    $(".add_item li").click(function () {
        $(this).find(".added_overlay").toggleClass("open_close");
    });

    $('.next_step').click(function () {
        var total_choose_ur_base = $(".choose_ur_base li").length;
        var not_choosed_ur_base = $(".choose_ur_base li").find(".added_overlay:hidden").length;
        //alert(total_choose_ur_base);
        //alert(not_choosed_ur_base);
        if (total_choose_ur_base == not_choosed_ur_base) {
            var popup_html = '<div class="popup_choose_ur_base"><div class="alert_popup"><div class="close-btn"></div>Please choose one</div></div>';
            $("body").append(popup_html);
        } else {
            //window.location='custom_build3.html';
        }
    })
    $("body").on('click', '.popup_choose_ur_base .close-btn', function () {
        $('.popup_choose_ur_base').remove();
        $(".terms").hide("slow");
        $(".privacyPolicy").hide("slow");
    });

    $("body").on('click', '.btnPopup', function () {
        $('.popup_choose_ur_base').remove();
        $(".terms").hide("slow");
        $(".privacyPolicy").hide("slow");
    });

});

function newCustomerToken() {
    if (checkSession()) {
        $.ajax({
            url: apiURL + localStorage.getItem("userBrowserKey") + "/GetClientAccessToken",
            type: "GET",
            dataType: "json",
            crossDomain: true,
            success: function (data) {
                $("#dropin-container").empty();
                $("#dropin-container").next('form').remove();
                var formElement = '<form id="checkout-form">' +
                       '<input type="submit" class="my_order" value="PLACE ORDER">' +
                   '</form>';
                $("#dropin-container").after(formElement);
                braintree.setup(data.clientToken, 'dropin', {
                    container: 'dropin-container',
                    form: 'checkout-form',
                    paypal: {
                        singleUse: false, // Required
                        currency: 'AUD',
                        button: {
                            type: 'checkout'
                        }
                    },
                    onPaymentMethodReceived: function (nonce) {
                        debugger;
                        placeOrder(nonce, 0);
                    }
                });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                //alert(textStatus + "; " + errorThrown);
            }
        });
    }
}

function returnCustomerToken() {
    var JSONObject = {
        "CustomerId": localStorage.getItem("customerNewId1")
    };
    if (checkSession()) {
        $.ajax({
            url: apiURL + localStorage.getItem("userBrowserKey") + "/GetClientAccessToken",
            type: "POST",
            dataType: "json",
            data: JSONObject,
            crossDomain: true,
            success: function (data) {
                $("#dropin-container").empty();
                $("#dropin-container").next('form').remove();
                var formElement = '<form id="checkout-form">' +
                       '<input type="submit" class="my_order" value="PLACE ORDER">' +
                   '</form>';
                $("#dropin-container").after(formElement);
                braintree.setup(data.clientToken, 'dropin', {
                    container: 'dropin-container',
                    form: 'checkout-form',
                    paypal: {
                        singleUse: false, // Required
                        currency: 'AUD',
                        button: {
                            type: 'checkout'
                        }
                    },
                    onPaymentMethodReceived: function (nonce) {
                        placeOrder(nonce, 1);
                    }
                });
            },
            error: function (jqXHR, textStatus, errorThrown) {
                //alert(textStatus + "; " + errorThrown);
            }
        });
    }
}

function placeOrder(nonce, repeatCustomer) {
    var checked = $("#orderType :radio:checked");
    var selOrderType = 3;
    $("#orderType :radio").each(function () {
        if (this.checked)
            selOrderType = parseInt(this.id);
    });

    if ($(".selectStore").val() == '' || $(".selectStore").val() == '0')
        $(".selectStore").addClass("validation");

    if ($(".selectTime").val() == '' || $(".selectTime").val() == '0') {
        message("<h1>Whoops!</h1>This store is closed for the day. Please choose another store or come back tomorrow.");
    }
    if (repeatCustomer == 0) {
        $("#firstName").removeClass("validation"); // remove it
        $("#lastName").removeClass("validation"); // remove it
        $("#emailAddress").removeClass("validation"); // remove it
        $("#phoneNumber").removeClass("validation"); // remove it
        $(".selectStore").removeClass("validation"); // remove it
        if ($("#firstName").val() == "" || $("#firstName").val() == null) {
            $("#firstName").addClass("validation");//.parent().after("<div class='validation'>Please enter first name.</div>");
        }
        if ($("#lastName").val() == "" || $("#lastName").val() == null) {
            $("#lastName").addClass("validation");
        }
        if ($("#emailAddress").val() == "" || $("#emailAddress").val() == null) {
            $("#emailAddress").addClass("validation");
        }
        if ($("#phoneNumber").val() == "" || $("#phoneNumber").val() == null) {
            $("#phoneNumber").addClass("validation");
        }
    }
    if (($("#firstName").val() == "" || $("#firstName").val() == null || $("#lastName").val() == "" || $("#lastName").val() == null
        || $("#emailAddress").val() == "" || $("#emailAddress").val() == null || $("#phoneNumber").val() == "" || $("#phoneNumber").val() == null
        || $(".selectStore").val() == '' || $(".selectStore").val() == '0' || $(".selectTime").val() == '' || $(".selectTime").val() == '0') && repeatCustomer == 0) {
        $(window).scrollTop(100);
    }
    else {
        var cusId = 0;
        if (repeatCustomer == 1)
            cusId = localStorage.getItem("customerNewId1");
        else if ($("#rememberme").is(":checked"))
            cusId = 0;
        var JSONObject = {
            "orderShopify": false, "storeId": $("#checkoutSelectStore").val(), "storeName": $("#checkoutSelectStore :selected").text(),
            "time": $(".selectTime").val(), "nonce": nonce.nonce,
            "Customer": { "email": $("#emailAddress").val(), "first_name": $("#firstName").val(), "last_name": $("#lastName").val(), "phoneNumber": $("#phoneNumber").val(), "password": $("#password").val() },
            "customerId": cusId, "paymentToken": null, "orderType": selOrderType
        };

        if ($("#newuser").is(":checked") && $("#rememberme").is(":checked")) {
            localStorage.setItem("customerfirstName", $("#firstName").val());
            localStorage.setItem("customerlastName", $("#lastName").val());
            localStorage.setItem("customerEmailAddress", $("#emailAddress").val());
            localStorage.setItem("customerphoneNumber", $("#phoneNumber").val());
        }
        if (checkSession()) {
            $.ajax({
                url: apiURL + localStorage.getItem("userBrowserKey") + "/PlaceOrder",
                type: "POST",
                dataType: "json",
                data: JSONObject,
                crossDomain: true,
                success: function (data) {
                    if (!data.OrderSuccess) {
                        $('.popup_choose_ur_base').remove();
                        if (data.orderDetails == undefined || data.orderDetails == null || data.orderDetails.BraintreeStatus == null || data.orderDetails.BraintreeStatus == undefined) {
                            messageReqButtonClick("<h1>Whoops!</h1>Unable to send order to store, Something went wrong, please try again later.<br><button type='button' class='btnPopup'>OK, GOT IT!</button>");
                        }
                        else if (data.orderDetails.BraintreeStatus == "customer already exist.") {
                            message("<h1>Whoops!</h1>Customer email already exist.");
                            $("#personalDetailsInner").show();
                            $("#customerLoginForm").hide();
                            $("#returncustomerForm").hide();
                            $("#dvLogout").hide();
                        }
                        else if (data.orderDetails.BraintreeStatus == "Payment Success")
                            messageReqButtonClick("<h1>HANG ON...</h1>We can't reach the store right now, please try again later! Your payment has been voided, any pending transactions in your bank account will disappear within 72 hours.<br><button type='button' class='btnPopup'>OK, GOT IT!</button>");
                        else if (data.orderDetails.BraintreeStatus.indexOf("payment_method_nonce does not contain a valid payment instrument type.") >= 0)
                            messageReqButtonClick("<h1>HANG ON...</h1> We’re sorry, THR1VE does not currently accept AMEX. We are working on having this resolved soon!<br><button type='button' class='btnPopup'>OK, GOT IT!</button>");
                        else if (data.orderDetails.BraintreeStatus.indexOf("Nonce") < 0)
                            messageReqButtonClick("<h1>HANG ON...</h1>We weren't able to process your payment. Please check your details and try again.<br><button type='button' class='btnPopup'>OK, GOT IT!</button>");

                        if (localStorage.getItem("customerNewId1") == null) {
                            newCustomerToken();
                        }
                        else {
                            $("#returnmember").prop('checked', 'checked');
                            returnCustomerToken();
                        }
                    }
                    else {

                        if (($("#rememberme").is(":checked")) && (data.customerId != null && data.customerId != undefined && data.customerId != "")) {
                            localStorage.setItem("customerNewId1", data.customerId);
                            localStorage.setItem("customerfirstName", data.firstName);
                            localStorage.setItem("customerlastName", data.lastName);
                            localStorage.setItem("customerEmailAddress", data.emailAddress);
                            localStorage.setItem("customerphoneNumber", data.phone);
                        }
                        else {
                            localStorage.removeItem("customerNewId1");
                            localStorage.removeItem("customerfirstName");
                            localStorage.removeItem("customerlastName");
                            localStorage.removeItem("customerEmailAddress");
                            localStorage.removeItem("customerphoneNumber");
                        }
                        $(".popup_sec1").hide("slow");

                        var storesList = JSON.parse(localStorage.getItem("storeList"));
                        storesList = $.grep(storesList, function (element, index) {
                            return element.StoreId == $("#checkoutSelectStore").val();
                        });
                        var _PhoneNumber = storesList[0].PhoneNumber;

                        $("#orderNumber").text(data.orderNumber);

                        $("#orderStore").text($("#checkoutSelectStore :selected").text());
                        $("#orderTime").text($(".selectTime").val());
                        if ($("#emailAddress").val() != null && $("#emailAddress").val() != "")
                            $("#orderEmail").text($("#emailAddress").val());

                        $("#storePhoneNumber").text(_PhoneNumber);

                        $(".popup_sec1").hide("slow");
                        $(".popup_sec2").toggle("slow");
                        $("body").removeClass("loading");
                        resetCart();
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    if ($("body").hasClass("loading")) $("body").removeClass("loading"); // Hide spinning wheel when ajax query is finished
                    $(".popup_sec1").hide("slow");
                    $(".popup_sec2").hide("slow");
                    resetCart();
                    messageReqButtonClick("<h1>Whoops!</h1>Unable to send order to store, Something went wrong, please try again later.<br><button type='button' class='btnPopup'>OK, GOT IT!</button>");
                }
            });
        }
    }
}

function resetCart() {
    $(".table1").empty();
    $("#firstName").val("");
    $("#lastName").val("");
    $("#emailAddress").val("");
    $("#phoneNumber").val("");
    $("#dropin-container").empty();
    window.location.href = "#indexpage";
    selectNearestStore($(".selectStore").val());
    sessionStorage.setItem("cartItems", 0);

    createSession(false);
}

function message(msg) {
    $('.popup_choose_ur_base').remove();
    var popup_html = "<div class=\"popup_choose_ur_base\"><div class=\"alert_popup\"><div class=\"close-btn\"></div>" + msg + "</div></div>";
    $("body").append(popup_html);

    setTimeout(function () {
        $('.popup_choose_ur_base').remove();
    }, 2000);
}

function messageReqButtonClick(msg) {
    $('.popup_choose_ur_base').remove();
    var popup_html = "<div class=\"popup_choose_ur_base\"><div class=\"alert_popup\"><div class=\"close-btn\"></div>" + msg + "</div></div>";
    $("body").append(popup_html);
}

function changeStore() {
    $(".changeStore").hide();
    $(".changeStoreSelect").show();
}

function changeStoreDone() {
    $(".changeStore").show();
    $(".changeStoreSelect").hide();
}

function checkSession() {
    if (localStorage.getItem("userBrowserKey") == null || localStorage.getItem("userBrowserKey") == "") {
        window.location.href = "#indexpage";
        createSession(false);
        messageReqButtonClick("<h1>Whoops!</h1>Session expired, please start your order again.");
        return false;
    }
    return true;
}