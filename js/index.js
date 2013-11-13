var allPhotos = [];
var allTags = [];
var allCameras = [];
var svg;
var bottomPadding = 50;
var w = 900;
var h = 400;
$(document).ready(function() {
	$("#getInterestingnessPhotos").click(function() {
		var cleared = 0; // did we have to clear the screen? if we did, we'll have to wait for animations to finish
		if($("svg").contents().length > 0) {
			// clear existing stuff
			clearSVG();
			cleared = 1;
		}
	    var month = $("#startdatepicker").val();
	    var photosFile = 'json/' + month + 'photos.json';
	    var tagsFile = 'json/' + month + 'tags.json';
	    var camerasFile = 'json/' + month + 'cameras.json';
	    var ajaxConnections = 0;

	    // grab the three json arrays

	    // after grabbing all 3 json files,
	    // show the tag bar graph using tagsFile as input
	    ajaxConnections = 3;
		$.getJSON(photosFile,
		function (data) { 
			ajaxConnections--;

			allPhotos = data; // this should work; dont think i have to manually push everything to allPhotos through .each()

			if(ajaxConnections == 0) {
				// all 3 have been retrieved
				if(cleared == 1)
					window.setTimeout(showTagGraph, 1000);
				else
					showTagGraph();
			}
		})
		.fail(function() {
			console.log("getPhotos fail");
			--ajaxConnections;
		});

		$.getJSON(tagsFile,
		function (data) { 
			ajaxConnections--;

			allTags = data;

			if(ajaxConnections == 0) {
				// all 3 have been retrieved
				if(cleared == 1)
					window.setTimeout(showTagGraph, 1000);
				else
					showTagGraph();
			}
		})
		.fail(function() {
			console.log("getPhotos fail");
			--ajaxConnections;
		});

		$.getJSON(camerasFile,
		function (data) { 
			ajaxConnections--;

			allCameras = data;

			if(ajaxConnections == 0) {
				// all 3 have been retrieved
				if(cleared == 1)
					window.setTimeout(showTagGraph, 1000);
				else
					showTagGraph();
			}
		})
		.fail(function() {
			console.log("getPhotos fail");
			--ajaxConnections;
		});

	}); // end clickhandler

	$("#show_viz-camera").click(function() {
		clearSVG();
	});
});


function clearSVG() {
	var bars = svg.selectAll("rect.bar");
	bars
		.transition()
		.duration (500)
		.attr("height", 0)
		.attr("y", h - bottomPadding);
	window.setTimeout(hide, 500);
}

function hide() {
	$("svg").children().each(function () {
		$(this).fadeOut(250, function() {
			$(this).remove();
		});
	});
}

//D3 - Copy the below fucntion
function showTagGraph() {
	var maxTagCount = d3.max(allTags, function(d) {
		return d.count;
	});
	var tickValues = [];

	// generate ticks
	for(var i = 0 ; i < maxTagCount ; i = i+50) {
		tickValues.push(i);
	}

	svg = d3.select("#viz");
	svg.attr("width", w).attr("height", h);

	// scaling the height of bar
	var yScale = d3.scale.linear()
		.domain([0, maxTagCount])
		.range([0, h - bottomPadding]);

	var yAxisScale = d3.scale.linear()
		.domain([0, maxTagCount])
		.range([h - bottomPadding, 0]);

	var yAxis = d3.svg.axis()
		.scale(yAxisScale)
		.orient("left")
		.tickValues(tickValues);

	svg.append("g")
		.attr("class", "axis")
		.attr("transform", "translate(75, 0)")
		.call(yAxis);

	// grid lines
	for (var j=0; j < tickValues.length; j++) {
	    svg.append("line")
	    	.attr({
		    	"x1": bottomPadding,
		    	"x2": w,
		    	"y1": yAxisScale(tickValues[j]),
		    	"y2": yAxisScale(tickValues[j]),
		    	"class": "grid"
	    	});
	};

	var bars = svg.selectAll("rect")
		.data(allTags.slice(0,15))
		.enter().append("rect")
		.attr("x", function(d, i) {
			return i * 50 + 80;
		})
		.attr("y", function(d) {
			return h - bottomPadding - yScale(d.count);
		})
		.attr("width", 30)

		.attr("height", function(d) {
			return yScale(d.count);
		})
		.attr("class","bar")
		.on("click",function(d){ 
			// start: added by dheera
			$(".carousel-inner").empty();

					for(var i=0;i< d.photoIDs.length; i++)
					{
						var id = d.photoIDs[i];

						for (var j = 0; j < allPhotos.length; j++) {

						    var object = allPhotos[j];
						    
						    if(id===object["id"]){
						    	
							var t_url = "http://farm" + object["farm"] + ".static.flickr.com/" + object["server"] + "/" + object["id"] + "_" + object["secret"] + "_" + "t.jpg";
						    
						    console.log(t_url);

						    if(i==0)
						    {
								$(".carousel-inner").append('<div class="item active"><img src='+t_url+' alt=""><div class="carousel-caption"><h4>Title '+(i+1)+'</h4><p></p>');

							}
							else{
								$(".carousel-inner").append('<div class="item"><img src='+t_url+' alt=""><div class="carousel-caption"><h4>Title '+(i+1)+'</h4><p></p>');
							}			   
						}

					}
				}
//end: added by dheera

	});

	// text labels
	svg.selectAll("text.barlabel")
		.data(allTags.slice(0,15))
		.sort()
		.enter()
		.append("text")
		.text(function(d) {
			if(d.tag == "") {
				return "(none)";
			} else {
				return d.tag;
			}
		})
		.attr("text-anchor", "middle")
		.attr("x", function(d, i) {
			return i * 50 + 80 + 15;
		})
		.attr("y", function(d) {
			return h - 25;
		})
		.attr("text-anchor", "middle")
		.attr("class", "barlabel")
}