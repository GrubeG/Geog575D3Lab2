function setMap(){var t=d3.select("body").append("svg").attr("class","map").attr("width",800).attr("height",600),e=d3.geoAlbers().center([-10,50.78]).rotate([-20.8,0,0]).parallels([20.5,33.5]).scale(1100).translate([400,300]),a=d3.geoPath().projection(e);d3.queue().defer(d3.csv,"data/EnvironmentalStatisticsEUFinal.csv").defer(d3.json,"data/RegionalCountries.topojson").defer(d3.json,"data/EUCountries.topojson").await((function(e,o,r,n){for(var s=d3.geoGraticule().step([5,5]),d=(t.append("path").datum(s.outline()).attr("class","gratBackground").attr("d",a),t.selectAll(".gratLines").data(s.lines()).enter().append("path").attr("class","gratLines").attr("d",a),topojson.feature(r,r.objects.RegionalCountries)),i=topojson.feature(n,n.objects.EUCountries).features,l=["GHG","Waste","TotalEner","NonRenewEner","WaterAbsAvg"],p=0;p<o.length;p++)for(var c=o[p],u=c.Code,g=0;g<i.length;g++){var f=i[g].properties;f.GeogCode==u&&l.forEach((function(t){var e=parseFloat(c[t]);f[t]=e}))}t.append("path").datum(d).attr("class","regional").attr("d",a),t.selectAll(".EuropeanUnionCountries").data(i).enter().append("path").attr("class",(function(t){return"EuropeanUnionCountries "+t.properties.GeogCode})).attr("d",a)}))}window.onload=setMap();