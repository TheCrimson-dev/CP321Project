(function () {
    'use strict';

    var element = d3
        .select(".visualisation")
        .node()
        .parentNode.getBoundingClientRect();
    var margin = 90;
    var ratio = width / (height - margin);
    var rotate = -9.9;
    var width = element.width;
    var height = 500;
    // this creates the border and the layout parameters


    var sizing = d3
        .zoom()
        .scaleExtent([1, 30])
        .translateExtent([
            [0, 0],
            [width, height] ])
        .on("zoom", function () {
            d3.select("g").attr("transform", d3.event.transform);
        }); // this is so you can zoom in and out on the map


    var svg = d3
        .select(".visualisation")
        .append("svg")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr("viewBox", ("0 0 " + width + " " + height))
        .attr("width", width)
        .attr("height", height)
        .call(sizing);
        // this creates the svg element so the graph fits in there

    var worldMap = svg.append("g");
    // this is to append the world map to the svg element

    var tooltip = d3
        .select(".visualisation")
        .append("div")
        .attr("class", "hidden tooltip");
    // this is to create the popup so when you hover over a country it shows the country name and data

    var contrast = d3
        .geoMercator()
        .rotate([rotate, 0])
        .scale(height / (1.4 * Math.PI))
        .translate([width / 2, (height - margin) / 1.2]);
        // this changes the size of the map and its position

    var countryDisplay = d3.geoPath().projection(contrast);
    // this is to display all the countries

    var colorScale = d3.scaleSqrt(["#CCD6FB", "#B705D4", "#71001E"]);
    // this is the colors defined for the color scale and what will appear on the legend as well as each country

    var worldData = {};

    var northBtn = document.getElementById("northBtn");
    var southButton = document.getElementById("southButton");

    var highestCases = document.getElementById("highestCase");
    var lowestCases = document.getElementById("lowestCase");
    var countryBtn = document.getElementById("countryBtn");

    var preview = document.getElementById("showing");
    // defining all buttons and values

    var showAll = [
        d3.json("./world.topojson"),
        
        d3.json("./na-sa.json") ];
    // this pulls the data from the json files in order to parse it

    countryBtn.onclick = function () {
        preview.textContent = "Showing North America and South America";
        showAll = [
            d3.json("./world.topojson"),
            
            d3.json("./na-sa.json") ];
        highestCases.textContent = "";
        lowestCases.textContent = "";
        generate(showAll);
        //this function is for a button so when it is clicked it will show the data from North America and South America
    };

    northBtn.onclick = function () {
        preview.textContent = "Showing North America";
        showAll = [
            d3.json("./world.topojson"),
           
            d3.json("./na.json") ];
        highestCases.textContent = "";
        lowestCases.textContent = "";
        generate(showAll);
    };// this function is also for a button so when it is clicked the data from North America will show

    southButton.onclick = function () {
        preview.textContent = "Showing South America";
        showAll = [
            d3.json("./world.topojson"),
            
            d3.json("./sa.json") ];
        highestCases.textContent = "";
        lowestCases.textContent = "";
        generate(showAll);
    };// this function is also for a button so when it is clicked the data from South America will show

    var generate = function (promiseFunc) {
        Promise.all(promiseFunc).then(function (ref) {
            var countries = ref[0];
            var data = ref[1];

            
            for (var j = 0; j < data.length; j++) {
                var parser = data[j];
                parser["Difference"] =
                    parser["Cases in the last 7 days"] -
                    parser["Cases in the preceding 7 days"];
                
            }
            // this is the promise function so it parses the data and pulls data from the html in order to show cases

            var sortedHighest = data.sort(
                function (a, b) { return b["Cases in the last 7 days"] - a["Cases in the last 7 days"]; }
                    // sorted functions to show the highest cases
            );
            var top = sortedHighest.slice(0, 5);
            var bottom = sortedHighest.slice(
                sortedHighest.length - 6,
                sortedHighest.length - 1
            );
            
            for (var j$1 = 0; j$1 < top.length; j$1++) {
                var parser$1 = top[j$1];
                
                highestCases.innerHTML +=
                    j$1 + 1 + ". " + parser$1["Country"]["Other"] + " ";
            } // displays the information for the top 5 countries

            for (var j$2 = 0; j$2 < bottom.length; j$2++) {
                var parser$2 = bottom[j$2];
                lowestCases.innerHTML +=
                    j$2 + 1 + ". " + parser$2["Country"]["Other"] + " ";
            }// displays the information for the bottom 5 countries

            var countries = topojson.feature(countries, "custom.geo"); // this pulls info from the world.topojson files
            
            worldData.features = countries.features;
            worldData.data = data;
            worldData.valueG = d3.select("#metrics").property("value");
            // this is calling the metrics/statistics from the index.html

            grabInfo();
            colorScale.domain([
                0,
                d3.median(worldData.features, function (d) { return d.properties.dataPoint; }),
                d3.max(worldData.features, function (d) { return d.properties.dataPoint; }) ]);
            create();
            showLegend();
            
            d3.select("#metrics").on("projection", projection);
        });

        function grabInfo() {
            worldData.features.forEach(function (d) {
                console.log("worldData", worldData.data);
               
                var firstSelection = worldData.data.filter(function (t) {
                    console.log("filter worldData is", t["Country"]["Other"]);
                    return t["Country"]["Other"] == d.properties.name;
                })[0];
                console.log("firstSelection", firstSelection, d.properties.name);
                if (firstSelection) {
                    d.properties.dataPoint = firstSelection[worldData.valueG];
                    d.properties.country = firstSelection["Country"]["Other"];
                } else {
                    d.properties.dataPoint = 0;
                    d.properties.country = "Unknown";
                }
            });// this chunk of code is grabbing the list within the html in order to display and parse data for the dropdown menu
        }

        function create() {
            worldMap.selectAll("path.country").remove();
            worldMap
                .selectAll("path.country")
                .data(worldData.features)
                .enter()
                .append("path")
                .attr("class", "country")
                .attr("d", countryDisplay)
                .style("fill", function (d) { return colorScale(d.properties.dataPoint); })
                .on("mousemove", function (d) {
                    tooltip
                        .classed("hidden", false)
                        .html(
                            "<h6>" +
                                d.properties.country +
                                ": " +
                                d.properties.dataPoint +
                                "</h6>"
                        )
                        .attr(
                            "style",
                            "left:" +
                                (d3.event.pageX + 15) +
                                "px; top:" +
                                (d3.event.pageY + 20) +
                                "px"
                        );// this chunk of code is what is occuring when the mouse is hovered over a country and the color fades in
                })
                .on("mouseout", function () {
                    tooltip.classed("hidden", true);
                })
                .on("mousedown ", function () {
                    alert("This is a popup");
                });
        }

        function showLegend() {
            svg.select(".legendScale").remove();
            svg.append("g")
                .attr("class", "legendScale")
                .attr("transform", "translate(10,20)");
                // this function is for the scale to appear and its properties

            var countrySize = 40,
                numOfSelec = 5,
                padding = 2,
                heading =
                    worldData.valueG.replace("PerOneMillion", "") +
                    " per million population: ";

            var legendScale = d3
                .legendColor()
                .title(heading)
                .shape("rect")
                .shapeWidth(countrySize)
                .cells(numOfSelec)
                .labelFormat(d3.format(".3s"))
                .orient("top")
                .shapePadding(padding)
                .scale(colorScale);
                // attributes and the legend color scale

            svg.select(".legendScale")
                .append("rect")
                .attr("class", "legendBackground")
                .attr("x", -5)
                .attr("y", -22)
                .attr("opacity", 0.9)
                .attr("rx", 8)
                .attr("ry", 8)
                .attr("width", heading.length * 7.4)
                .attr("height", margin);

            svg.select(".legendScale").call(legendScale);
        }

        function projection() {
            worldData.valueG = d3.select("#metrics").property("value");
            grabInfo();
            colorScale.domain([
                0,
                d3.median(worldData.features, function (d) { return d.properties.dataPoint; }),
                d3.max(worldData.features, function (d) { return d.properties.dataPoint; }) ]);
            create();
            showLegend();
            // this function is so the color legend matches to what data is being displayed on the map
            
        }

        d3.select(window).on("resize", function () {
            var windowSize = d3
                .select(".visualisation")
                .node()
                .parentNode.getBoundingClientRect();
            svg.attr("width", windowSize);
            svg.attr("height", windowSize / ratio);
            svg.attr("viewBox", ("0 0 " + width + " " + height));
        });
    };
    generate(showAll);

})();
//# sourceMappingURL=bundle.js.map
