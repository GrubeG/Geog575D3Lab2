//begin script when window loads
window.onload = setMap();

//set up choropleth map
function setMap(){
    //use queue to parallelize asynchronous data loading
    d3.queue()
        .defer(d3.csv, "data/EnvironmentalStatisticsEUFinal.csv") //load attributes from csv
        .defer(d3.json, "data/EUCountries.topojson") //load background spatial data
        .defer(d3.json, "data/RegionalCountries.topojson") //load choropleth spatial data
        .await(callback);
    
    function callback(error, csvData, europe, region){
        //translate europe TopoJSON
        //var europeCountries = topojson.feature(europe, europe.objects.EUCountries),
            //regionalCountries = topojson.feature(region, region.objects.RegionalCountries).features;

        //examine the results
        console.log(error);
        console.log(csvData);
        console.log(europe);
        console.log(region);
        //console.log(europeCountries);
        //console.log(regionalCountries);
    };
}