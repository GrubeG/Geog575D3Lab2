//First line of main.js...wrap everything in a self-executing anonymous function to move to local scope
(function(){

//pseudo-global variables
var attrArray = ["Greenhouse_Gases", "Total_Waste", "Non-Renewable_Energy", "Freshwater_Extractions", "Air_Quality"];
var expressed = attrArray[0]; //initial attribute
    
//chart frame dimensions
var chartWidth = window.innerWidth * 0.425,
    chartHeight = 550,
    leftPadding = 25,
    rightPadding = 2,
    topBottomPadding = 5,
    chartInnerWidth = chartWidth - leftPadding - rightPadding,
    chartInnerHeight = chartHeight - topBottomPadding * 2,
    translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    
//create a scale to size bars proportionally to frame and for axis
var yScale = d3.scaleLinear()
    .range([463, 0])
    .domain([0, 300])
    
//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    
    //map frame dimensions
    var width = window.innerWidth * 0.5,
        height = 550;

    //create new svg container for the map
    var map = d3.select("div.mapContainer")
        .append("svg")
        .attr("class", "map")
        .attr("width", width)
        .attr("height", height);

    //create Albers equal area conic projection centered on Europe
    var projection = d3.geoAlbers()
        .center([-10, 49.78])
        .rotate([-20.80, 0, 0])
        .parallels([20.5, 33.5])
        .scale(1000)
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
        
        //add coordinated visualization to the map
        setChart(csvData, colorScale);
        
        //add dropdown selector
        createDropdown(csvData)
        
        changeAttribute(csvData)
        
    };
}; //end of setMap()
    
//function to create coordinated bar chart
function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 545,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    //create a second svg element to hold the bar chart
    var chart = d3.select("div.mapContainer")
        .append("svg")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("class", "chart");
    
    //create a rectangle for chart background fill
    var chartBackground = chart.append("rect")
        .attr("class", "chartBackground")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
    
    //set bars for each province
    var bars = chart.selectAll(".bar")
        .data(csvData)
        .enter()
        .append("rect")
        .sort(function(a, b){
            return a[expressed]-b[expressed]
        })
        .attr("class", function(d){
            return "bar " + d.Code;
        })
        .attr("width", chartInnerWidth / csvData.length - 1)
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);
    
    var desc = bars.append("desc")
        .text('{"stroke": "none", "stroke-width": "0px"}');
    
        //annotate bars with attribute value text
    var numbers = chart.selectAll(".numbers")
        .data(csvData)
        .enter()
        .append("text")
        .sort(function(a, b){
            return a[expressed]-b[expressed]
        })
        .attr("class", function(d){
            return "numbers " + d.Code;
        })
        .attr("text-anchor", "middle")
        .attr("width", chartInnerWidth / csvData.length - 1)
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + 35;
        })
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + 10;
        })
        .text(function(d){
            return d[expressed];
        })
        .on("mouseover", highlight)
        .on("mouseout", dehighlight)
        .on("mousemove", moveLabel);
    
    //below Example 2.8...create a text element for the chart title
    var chartTitle = chart.append("text")
        .attr("x", 40)
        .attr("y", 40)
        .attr("class", "chartTitle")
        .text("Per Capita " + expressed + " in each country");
    
    //below Example 2.8...create a text element for the chart title
    var chartLegend = chart.append("text")
        .attr("x", 40)
        .attr("y", 485)
        .attr("class", "chartLegend")
        .text("EU Country by Value: Lower number is more environmentally friendly. Equal Interval Classification.");
    
    //below Example 2.8...create a text element for the chart title
    var chartLegend2 = chart.append("text")
        .attr("x", 40)
        .attr("y", 500)
        .attr("class", "chartLegend2")
        .text("Choose variable in the upper left of the map. Hover over country or bar to see selected country and data value information.");
    
    //below Example 2.8...create a text element for the chart title
    var chartLegend3 = chart.append("text")
        .attr("x", 40)
        .attr("y", 515)
        .attr("class", "chartLegend2")
        .text("Majority of data from 2015-2018, courtesy EuroStat, United Nations and World Health Organization. See sources at the bottom of page for more details.");
    
    //below Example 2.8...create a text element for the chart title
    var chartLegend4 = chart.append("text")
        .attr("x", 40)
        .attr("y", 530)
        .attr("class", "chartLegend2")
        .text("United Kingdom included as it was a member during data gathering period, but left the EU in 2020.");
    
    
    
    //create frame for chart border
    var chartFrame = chart.append("rect")
        .attr("class", "chartFrame")
        .attr("width", chartInnerWidth)
        .attr("height", chartInnerHeight)
        .attr("transform", translate);
    
    //set bar positions, heights, and colors
    updateChart(bars, csvData.length, colorScale, numbers);
    
    //create vertical axis generator
    //var yAxis = d3.axisLeft(yScale);

    //place axis
    //var axis = chart.append("g")
        //.attr("class", "axis")
        //.attr("transform", translate)
        //.call(yAxis);
    
}; //end of setChart()
    
    
//function to create a dropdown menu for attribute selection
function createDropdown(csvData){
    //add select element
    var dropdown = d3.select("div.mapContainer")
        .append("select")
        .attr("class", "dropdown")
        .on("change", function(){
            changeAttribute(this.value, csvData)
        });

    //add initial option
    var titleOption = dropdown.append("option")
        .attr("class", "titleOption")
        .attr("disabled", "true")
        .text("Select Category");

    //add attribute name options
    var attrOptions = dropdown.selectAll("attrOptions")
        .data(attrArray)
        .enter()
        .append("option")
        .attr("value", function(d){ return d })
        .text(function(d){ return d.replaceAll("_", " ") });
    
    setLabel(props)
    
};
    
//dropdown change listener handler
function changeAttribute(attribute, csvData){
    //change the expressed attribute
    expressed = attribute;

    //recreate the color scale
    var colorScale = makeColorScale(csvData);

    //recolor enumeration units
    var EuropeanUnionCountries = d3.selectAll(".EuropeanUnionCountries")
        .transition()
        .duration(1000)
        .style("fill", function(d){
            return choropleth(d.properties, colorScale)
        });
    
    //re-sort, resize, and recolor bars
    var bars = d3.selectAll(".bar")
        //re-sort bars
        .sort(function(a, b){
            return a[expressed] - b[expressed];
        })
        .transition() //add animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(500);
    
    //re-sort, resize, and recolor bars
    var numbers = d3.selectAll(".numbers")
        //re-sort bars
        .sort(function(a, b){
            return a[expressed] - b[expressed];
        })
        .transition() //add animation
        .delay(function(d, i){
            return i * 20
        })
        .duration(500);
        
    updateChart(bars, csvData.length, colorScale, numbers);
};
    
//function to position, size, and color bars in chart
function updateChart(bars, n, colorScale, numbers){
    
    var maxDomain = null;
        if (expressed == "Greenhouse_Gases") {var maxDomain = 30;}
            if (expressed == "Total_Waste") {var maxDomain = 28;}
            if (expressed == "Non-Renewable_Energy") {var maxDomain = 300;}
            if (expressed == "Freshwater_Extractions") {var maxDomain = 1450;}
            if (expressed == "Air_Quality") {var maxDomain = 30;}
    
    var yScale = d3.scaleLinear()
    .range([463, 0])
    .domain([0, maxDomain])
    
    console.log(maxDomain)
    
    //position bars
    bars.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + leftPadding;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //color/recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
    
    numbers.attr("x", function(d, i){
            return i * (chartInnerWidth / n) + 35;
        })
        //size/resize bars
        .attr("height", function(d, i){
            return 463 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + 20;
        })
        .text(function(d){
            return d[expressed];
        });
    
      
    //at the bottom of updateChart()...add text to chart title
    var chartTitle = d3.select(".chartTitle")
        .text(function(d){
            if (expressed == "Greenhouse_Gases"){
              return  "Greenhouse Gases Produced - Metric Tons Per Capita";
            } else if (expressed == "Total_Waste"){
              return  "Total Waste Produced – Metric Tons Per Capita";
            } else if (expressed == "Non-Renewable_Energy"){
              return  "Energy From Non-Renewable Sources - Gigajoules Per Capita";
            } else if (expressed == "Freshwater_Extractions"){
              return  "Extraction of Fresh Surface and Groundwater - Cubic Meters Per Capita";
            } else if (expressed == "Air_Quality"){
              return "Average Concentrations of Fine Particulate Matter (PM2.5)";
            }   
        });
};
    
    
//function to create color scale generator
function makeColorScale(data){

    var colorClasses = [
        "#1a9850",
        "#91cf60",
        "#d9ef8b",
        "#fee08b",
        "#fc8d59",
        "#d73027"
    ];

    //create color scale generator
    var colorScale = d3.scaleQuantile()
        .range(colorClasses);

    //build two-value array of minimum and maximum expressed attribute values
    var minmax = [
        d3.min(data, function(d) { return parseFloat(d[expressed]); }),
        d3.max(data, function(d) { return parseFloat(d[expressed]); })
    ];
    
    //assign two-value array as scale domain
    colorScale.domain(minmax);

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
    var attrArray = ["Greenhouse_Gases", "Total_Waste", "Non-Renewable_Energy", "Freshwater_Extractions", "Air_Quality"];

    //loop through csv to assign each set of csv attribute values to geojson region
    for (var i=0; i<csvData.length; i++){
        var csvRegion = csvData[i]; //the current region
        var csvKey = csvRegion.Code; //the CSV primary key

        //loop through geojson regions to find correct region
        for (var a=0; a<europeCountries.length; a++){

            var geojsonProps = europeCountries[a].properties; //the current region geojson properties
            var geojsonKey = geojsonProps.Code; //the geojson primary key

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
                return "EuropeanUnionCountries " + d.properties.Code;
            })
            .attr("d", path)
            .style("fill", function(d){
                return choropleth(d.properties, colorScale);
            })
            .on("mouseover", function(d){
                highlight(d.properties);
            })
            .on("mouseout", function(d){
            dehighlight(d.properties);
            })
            .on("mousemove", moveLabel);
            
        var desc = EuropeanUnionCountries.append("desc")
        .text('{"stroke": "#000", "stroke-width": "0.5px"}');
        
        
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
    
//function to highlight enumeration units and bars
function highlight(props){
    //change stroke
    var selected = d3.selectAll("." + props.Code)
        .style("stroke", "#41fdfe")
        .style("stroke-width", "2");
    
    setLabel(props)
};
    
 //function to reset the element style on mouseout
function dehighlight(props){
    var selected = d3.selectAll("." + props.Code)
        .style("stroke", "black")
        .style("stroke-width", "0.75");
        
    //below Example 2.4 line 21...remove info label
        var removeLabel = d3.select(".infolabel")
            .remove();
    
};
    
//function to create dynamic label
function setLabel(props){
    
    //label content
    var labelAttribute = "<h2>" + props[expressed] +
        "</h2>";

    //create info label div
    var infolabel = d3.select("div.mapContainer")
        .append("div")
        .attr("class", "infolabel")
        .attr("id", props.Code + "_label")
        .html(labelAttribute);

    var regionName = infolabel.append("div")
        .attr("class", "labelname")
        .html(props.Country);
    
};
    
//function to move info label with mouse
function moveLabel(){
//get width of label
    var labelWidth = d3.select(".infolabel")
        .node()
        .getBoundingClientRect()
        .width;

    //use coordinates of mousemove event to set label coordinates
    var x1 = d3.event.clientX + 10,
        y1 = d3.event.clientY - 75,
        x2 = d3.event.clientX - labelWidth - 10,
        y2 = d3.event.clientY + 25;

    //horizontal label coordinate, testing for overflow
    var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    //vertical label coordinate, testing for overflow
    var y = d3.event.clientY < 75 ? y2 : y1; 

    d3.select(".infolabel")
        .style("left", x + "px")
        .style("top", y + "px");
};
    
    
})(); //last line of main.js