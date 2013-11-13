var allPhotos = [];
var allTags = [];
var allCameras = [];
var allPhotosWithCameras = [];
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

	    if(!month) {
			$('#error').fadeIn('slow');
		} else {
			$('#criteria i').fadeTo('slow', 1.0);
			$('#error').fadeOut('slow');

		    // grab the three json arrays

		    // after grabbing all 3 json files,
		    // show the tag bar graph using tagsFile as input
		    ajaxConnections = 3;

		    // get photos
			$.getJSON(photosFile,
			function (data) { 
				ajaxConnections--;

				allPhotos = data; // this should work; dont think i have to manually push everything to allPhotos through .each()

				allPhotosWithCameras = allPhotos.filter(filterCameras);
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

			// get tags
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

			// get cameras
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
		} // end error checking if
	}); // end clickhandler

	$("#show_viz-camera").click(function() {
	    var month = $("#startdatepicker").val();
	    if(!month) {
			$('#error').fadeIn('slow');
		} else {
			$('#criteria i').fadeTo('slow', 1.0);
			$('#error').fadeOut('slow');
			clearSVG();
			window.setTimeout(showCameraGraph, 1000);
		}
	});

	$('#show_viz').click(function() {
	    var month = $("#startdatepicker").val();
	    if(!month) {
			$('#error').fadeIn('slow');
		} else {
			$('#criteria i').fadeTo('slow', 1.0);
			$('#error').fadeOut('slow');
			clearSVG();
			window.setTimeout(showTagGraph, 1000);
		}
	});
});

// filtering function for allPhotos to remove photos without cameras
function filterCameras(element) {
	return element.camera;
}

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

function showTagGraph() {
	showGraph(allTags, 'tags');
}

function showCameraGraph() {
	showGraph(allCameras, 'cameras');
}

// general graph. type is either tags or cameras
function showGraph(arr, type) {
	var maxCount = d3.max(arr, function(d) {
		return d.count;
	});
	var tickSpacing;
	var barCount;
	var barWidth;
	var barSpacing; // total spacing between bars
	switch(type) {
		case "tags":
			tickSpacing = 50;
			barCount = 15;
			barWidth = 30;
			barSpacing = 50;
			break;
		case "cameras":
			tickSpacing = 20;
			barCount = 12;
			barWidth = 30;
			barSpacing = 65;
			break;
	}
	var tickValues = [];

	// generate ticks
	for(var i = 0 ; i < maxCount ; i = i+tickSpacing) {
		tickValues.push(i);
	}

	svg = d3.select("#viz");
	svg.attr("width", w).attr("height", h);

	// scaling the height of bar
	var yScale = d3.scale.linear()
		.domain([0, maxCount])
		.range([0, h - bottomPadding]);

	var yAxisScale = d3.scale.linear()
		.domain([0, maxCount])
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
		    	"x1": 80,
		    	"x2": w,
		    	"y1": yAxisScale(tickValues[j]),
		    	"y2": yAxisScale(tickValues[j]),
		    	"class": "grid"
	    	});
	};

	// bars
	var bars = svg.selectAll("rect")
		.data(arr.slice(0,barCount))
		.enter().append("rect")
		.attr("x", function(d, i) {
			return i * barSpacing + 80;
		})
		.attr("width", barWidth)
		.attr("height", 0)
		.attr("y", h - bottomPadding)

		.attr("class","bar")
		.on("click",function(d){ 
			// when clicking on a bar, populate the carousel with 10 photos from the interestingness list
			$(".carousel-inner").empty();

			for(var i=0;i< d.photoIDs.length; i++)
			{
				var id = d.photoIDs[i];

				for (var j = 0; j < allPhotos.length; j++) {

				    var object = allPhotos[j];
				    
				    if(id===object["id"]){
				    	
						var t_url = "http://farm" + object["farm"] + ".static.flickr.com/" + object["server"] + "/" + object["id"] + "_" + object["secret"] + "_" + "z.jpg";
					    
					    console.log(t_url);

					    if(i==0)
					    {
							$(".carousel-inner").append('<div class="item active"><img src='+t_url+' alt="">');

						}
						else{
							$(".carousel-inner").append('<div class="item"><img src='+t_url+' alt="">');
						}			   
					}

				}
			}
		})
		.transition()
		.duration (500)
		.attr("height", function(d) {
			return yScale(d.count);
		})

		.attr("y", function(d) {
			return h - bottomPadding - yScale(d.count);
		})
;

	// text labels
	svg.selectAll("text.barLabel")
		.data(arr.slice(0,barCount))
		.sort()
		.enter()
		.append("text")
		.text(function(d) {
			var label;
			switch(type) {
				case "tags":
					label = d.tag;
					break;
				case "cameras":
					label = d.camera;
					break;
			}
			return (label == "") ? '(none)' : label;
		})
		.attr("text-anchor", "middle")
		.attr("x", function(d, i) {
			return i * barSpacing + (barWidth / 2) + 80;
		})
		.attr("y", function(d, i) {
			// stagger cameras because they're longer names
			if(type == "cameras") {
				return (i % 2 == 1) ? h - 10 : h - 25;
			} else {
				return h - 25;
			}
		})
		.attr("class", "barLabel");

	// show total photo count in topright
	var totalString;
	if(type == "tags") {
		// get total number of photos
		totalString = "total number of photos: " + allPhotos.length;
	} else if(type == "cameras") {
		// get total number of photos with a valid camera (not all photos have camera exif info available)
		totalString = "photos with camera info: " + allPhotosWithCameras.length;
	}

	svg.append("text")
		.text(totalString)
		.attr("text-anchor", "end")
		.attr("x", w - 50)
		.attr("y", 15)
		.attr("class", "countLabel");

}