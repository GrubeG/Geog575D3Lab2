//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

//pseudo-global variables
var attrArray = ["GHG", "Waste", "TotalEner", "NonRenewEner", "WaterAbsAvg"];
var expressed = attrArray[0]; //initial attribute
    
//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    
    //map frame dimensions
    var width = 800,
        height = 600;

    //create new svg container for the map
    var map = d3.select("body")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on France
    var projection = d3.geoAlbers()
        .center([-10, 50.78])
        .rotate([-20.80, 0, 0])
        .parallels([20.5, 33.5])
        .scale(1100)
        .translate([width / 2, height / 2]);
    
     var path = d3.geoPath()
        .projection(projection);
    
    //use queue to parallelize asynchronous data loading
    d3.queue()
        .defer(d3.csv, "data/EnvironmentalStatisticsEUFinal.csv") //load attributes from csv
        .defer(d3.json, "data/RegionalCountries.topojson") //load background spatial data
        .defer(d3.json, "data/EUCountries.topojson") //load choropleth spatial data
        .await(callback);
    
    function callback(error, csvData, region, europe){
        
        //place graticule on the map
        setGraticule(map, path);
        
        //translate europe TopoJSON
        var regionalCountries = topojson.feature(region, region.objects.RegionalCountries),
            europeCountries = topojson.feature(europe, europe.objects.EUCountries).features;
        
        //add regional countries to map
        var regional = map.append("path")
            .datum(regionalCountries)
            .attr("class", "regional")
            .attr("d", path);
        
        //join csv data to GeoJSON enumeration units
        europeCountries = joinData(europeCountries, csvData);
        
        //create the color scale
        var colorScale = makeColorScale(csvData);

        //add enumeration units to the map
        setEnumerationUnits(europeCountries, map, path, colorScale);
        
    };
}; //end of setMap()
    
//function to create color scale generator
function makeColorScale(data){
    var colorClasses = [
        "#D4B9DA",
        "#C994C7",
        "#DF65B0",
        "#DD1C77",
        "#980043"
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build two-value array of minimum and maximum expressed attribute values
    var minmax = [
        d3.min(data, function(d) { return parseFloat(d[expressed]); }),
        d3.max(data, function(d) { return parseFloat(d[expressed]); })
    ];
    
    //assign two-value array as scale domain
    colorScale.domain(minmax)

    return colorScale;
};
    
function setGraticule(map, path){
    //create graticule generator
        var graticule = d3.geoGraticule()
            .step([5, 5]); //place graticule lines every 5 degrees of longitude and latitude
        
        //create graticule background
        var gratBackground = map.append("path")
            .datum(graticule.outline()) //bind graticule background
            .attr("class", "gratBackground") //assign class for styling
            .attr("d", path) //project graticule
        
        //create graticule lines
        var gratLines = map.selectAll(".gratLines") //select graticule elements that will be created
            .data(graticule.lines()) //bind graticule lines to each element to be created
            .enter() //create an element for each datum
            .append("path") //append each element to the svg as a path element
            .attr("class", "gratLines") //assign class for styling
            .attr("d", path); //project graticule lines
};

function joinData(europeCountries, csvData){
    
    //variables for data join
    var attrArray = ["GHG", "Waste", "TotalEner", "NonRenewEner", "WaterAbsAvg"];

    //loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i]; //the current region
        var csvKey = csvRegion.Code; //the CSV primary key

        //loop through geojson regions to find correct region
        for (var a=0; a<europeCountries.length; a++){

            var geojsonProps = europeCountries[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.GeogCode; //the geojson primary key

            //where primary keys match, transfer csv data to geojson properties object
            if (geojsonKey == csvKey){

                //assign all attributes and values
                attrArray.forEach(function(attr){
                    var val = parseFloat(csvRegion[attr]); //get csv attribute value
                    geojsonProps[attr] = val; //assign attribute and value to geojson properties
                });
            };
        };
    };

    return europeCountries;
};

function setEnumerationUnits(europeCountries, map, path, colorScale){
    
    //add EU Countries to map
        var EuropeanUnionCountries = map.selectAll(".EuropeanUnionCountries")
            .data(europeCountries)
            .enter()
            .append("path")
            .attr("class", function(d){
                return "EuropeanUnionCountries " + d.properties.GeogCode;
            })
            .attr("d", path)
            .style("fill", function(d){
                return choropleth(d.properties, colorScale);
            });
};

//function to test for data value and return color
function choropleth(props, colorScale){
    //make sure attribute value is a number
    var val = parseFloat(props[expressed]);
    //if attribute value exists, assign a color; otherwise assign gray
    if (typeof val == 'number' && !isNaN(val)){
        return colorScale(val);
    } else {
        return "#CCC";
    };
};
    
})(); //last line of main.js