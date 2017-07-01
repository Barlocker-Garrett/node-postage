$(document).ready(function () {
    $("#toggle_hand").click(function (e) {
        if ($(".select_toggle").hasClass("collapse")) {
            $(".select_toggle").toggleClass("uncollapse");
        } else {
            $(".select_toggle").toggleClass("collapse");
        }
        var val = $("#toggle").html();
        if (val == "▼") {
            $("#toggle").text("▲");
        } else {
            $("#toggle").text("▼");
        }
        //var toggleLeft = ($('.navbar').css("left") == "0px") ? "200px" : "0px";
        //$('.navbar').css({"left":toggleLeft});
    });
});