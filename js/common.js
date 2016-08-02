$(document).ready(function () {
    $("#dropin-container").next('form').remove();
    var formElement = '<form id="checkout-form">' +
           '<input type="submit" style="margin-left:30%;" class="btnAddtoCart" value="PLACE ORDER">' +
       '</form>';
    $("#dropin-container").after(formElement);
    localStorage.removeItem("customerNewId1");

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
        $("#dropin-container").empty();
        $("#dropin-container").next('form').remove();

        $("#returncustomerForm").hide();
        $("#personalDetailsInner").hide();
        if (localStorage.getItem("customerNewId1") == null)
            $("#customerLoginForm").show();
        else {
            var formElement = '<form id="checkout-form">' +
                '<input type="submit" style="margin-left:30%;" class="btnAddtoCart" value="PLACE ORDER">' +
            '</form>';
            $("#dropin-container").after(formElement);

            $("#customerLoginForm").hide();
            if (localStorage.getItem("customerEmailAddress") != null && localStorage.getItem("customerEmailAddress") != "") {
                $("#firstName").val(localStorage.getItem("customerfirstName"));
                $("#lastName").val(localStorage.getItem("customerlastName"));
                $("#emailAddress").val(localStorage.getItem("customerEmailAddress"));
                $("#phoneNumber").val(localStorage.getItem("customerphoneNumber"));
                $("#returncustomerEmailAddress").val(localStorage.getItem("customerEmailAddress"));
                $("#returncustomerForm").show();
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
        $("#returncustomerForm").hide();
        $("#firstName").val('');
        $("#lastName").val('');
        $("#emailAddress").val('');
        $("#phoneNumber").val('');
        newCustomerToken();
    });

    $("#buttonLogin").click(function () {
        debugger;
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
            $.ajax({
                url: apiURL + "GetCustomerDetails",
                type: "POST",
                dataType: "json",
                data: JSONObject,
                crossDomain: true,
                success: function (data) {
                    //localStorage.setItem("storeList", JSON.stringify(data.stores));
                    debugger;
                    if (data.Customer == undefined || data.Customer == null) {
                        message("<h1>Whoops!</h1>Customer not exist.");
                    }
                    else {
                        var customerDetails = data.Customer;
                        localStorage.setItem("customerNewId1", customerDetails.Id);

                        $("#firstName").val(customerDetails.first_name);
                        $("#lastName").val(customerDetails.last_name);
                        $("#emailAddress").val(customerDetails.email);
                        $("#phoneNumber").val(customerDetails.phoneNumber);
                        $("#returncustomerEmailAddress").val(customerDetails.email);
                        $("#returncustomerForm").show();

                        var formElement = '<form id="checkout-form">' +
                           '<input type="submit" style="margin-left:30%;" class="btnAddtoCart" value="PLACE ORDER">' +
                       '</form>';
                        $("#dropin-container").after(formElement);

                        $("#customerLoginForm").hide();
                        returnCustomerToken();
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    message("<h1>Whoops!</h1>Customer not exist.");
                }
            });
        }
    });

    $(".cart").click(function () {
        
        var cartItems = sessionStorage.getItem("cartItems");
        if (cartItems > 0) {
            $("#PickUpTimeSelect").modal("show");
            if ($("#dropin-container").is(':empty')) {

                $("#personalDetailsInner").hide();
                $("#customerLoginForm").hide();
                $("#returncustomerForm").hide();
                if (localStorage.getItem("customerNewId1") == null) {
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
                    }
                    returnCustomerToken();
                }
            }
        }
        else {
            message("<h1>Whoops!</h1>Cart is empty.");
        }
    });

    $(".close1").click(function () {
        $(".popup_sec1").hide("slow");
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
    });

    $("body").on('click', '.btnPopup', function () {
        $('.popup_choose_ur_base').remove();
    });

});

function newCustomerToken() {
    $.ajax({
        url: apiURL + "GetClientAccessToken",
        type: "GET",
        dataType: "json",
        crossDomain: true,
        success: function (data) {
            
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
                    
                    placeOrder(nonce, 0);
                }
            });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            alert(textStatus + "; " + errorThrown);
        }
    });
}

function returnCustomerToken() {
    var JSONObject = {
        "CustomerId": localStorage.getItem("customerNewId1")
    };
    $.ajax({
        url: apiURL + "GetClientAccessToken",
        type: "POST",
        dataType: "json",
        data: JSONObject,
        crossDomain: true,
        success: function (data) {            
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
            alert(textStatus + "; " + errorThrown);
        }
    });
}

function placeOrder(nonce, repeatCustomer) {
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
        if ($(".selectStore").val() == '' || $(".selectStore").val() == '0')
            $(".selectStore").addClass("validation");
    }
    if (($("#firstName").val() == "" || $("#firstName").val() == null || $("#lastName").val() == "" || $("#lastName").val() == null
        || $("#emailAddress").val() == "" || $("#emailAddress").val() == null || $("#phoneNumber").val() == "" || $("#phoneNumber").val() == null
        || $(".selectStore").val() == '' || $(".selectStore").val() == '0') && repeatCustomer == 0) {
        $(window).scrollTop(100);
    }
    else {
        var cusId = 0;
        if (repeatCustomer == 1)
            cusId = localStorage.getItem("customerNewId1");
        else if ($("#rememberme").is(":checked"))
            cusId = 0;
        var JSONObject = {
            "orderShopify": false, "sessionValue": localStorage.getItem("userBrowserKey"), "storeId": $("#checkoutSelectStore").val(), "storeName": $("#checkoutSelectStore :selected").text(),
            "time": $(".selectTime").val(), "nonce": nonce.nonce,
            "Customer": { "email": $("#emailAddress").val(), "first_name": $("#firstName").val(), "last_name": $("#lastName").val(), "phoneNumber": $("#phoneNumber").val(), "password": $("#password").val() },
            "customerId": cusId, "paymentToken": null
        };
        $.ajax({
            url: apiURL + "PlaceOrder",
            type: "POST",
            dataType: "json",
            data: JSONObject,
            crossDomain: true,
            success: function (data) {

                if (!data.OrderSuccess) {

                    if (data.orderDetails.BraintreeStatus == "customer already exist.") {
                        message("<h1>Whoops!</h1>Customer email already exist.");

                        $("#dropin-container").empty();
                        $("#dropin-container").next('form').remove();
                        var formElement = '<form id="checkout-form">' +
                               '<input type="submit" style="margin-left:30%;" class="btnAddtoCart" value="PLACE ORDER">' +
                           '</form>';
                        $("#dropin-container").after(formElement);
                        $("#personalDetailsInner").show();
                        $("#customerLoginForm").hide();
                        $("#returncustomerForm").hide();
                        newCustomerToken();
                    }
                    else if (data.orderDetails.BraintreeStatus.indexOf("Nonce") < 0) {
                        message("<h1>Whoops!</h1>Unable to send order to store, Something went wrong, please try again later.");
                        $(".popup_sec1").hide("slow");
                        $(".popup_sec2").hide("slow");
                        resetCart();
                    }
                }
                else {

                    if (($("#rememberme").is(":checked")) && (data.customerId != null && data.customerId != undefined && data.customerId != "")) {
                        localStorage.setItem("customerNewId1", data.customerId);

                        localStorage.setItem("customerfirstName", $("#firstName").val());
                        localStorage.setItem("customerlastName", $("#lastName").val());
                        localStorage.setItem("customerEmailAddress", $("#emailAddress").val());
                        localStorage.setItem("customerphoneNumber", $("#phoneNumber").val());
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


                $(".popup_sec1").hide("slow");
                $(".popup_sec2").hide("slow");
                resetCart();
                message("<h1>Whoops!</h1>Unable to send order to store, Something went wrong, please try again later.");
            }
        });
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

    sessionStorage.setItem("cartItems", 0);
}

function message(msg) {
    var popup_html = "<div class=\"popup_choose_ur_base\"><div class=\"alert_popup\"><div class=\"close-btn\"></div>" + msg + "</div></div>";
    $("body").append(popup_html);

    setTimeout(function () {
        $('.popup_choose_ur_base').remove();
    }, 2000);
}

function changeStore()
{
    $(".changeStore").hide();
    $(".changeStoreSelect").show();
}

function changeStoreDone()
{
    $(".changeStore").show();
    $(".changeStoreSelect").hide();
}