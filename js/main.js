//an AJAX function
function jQueryAjax(){
    var mydata = $.ajax("data/MegaCities.geojson", {
        dataType: "json"
    });
    return mydata;
};

var mydata = jQueryAjax();

console.log(mydata); //the jQuery XMLHttpRequest object