var apiKey = '180b1bf5a5f6f2399676fd9ad13fc2e9';
var allTags = [];
var allCameras = [];
var svg;
var bottomPadding = 50;
var w = 900;
var h = 400;
var currentDisplay = 'tags';
//get yesterday's date in yyyy-mm-dd format
function GetYestDate() {
        // Yesterday's date time which will used to set as default date.
        var yestDate = new Date();
        yestDate = yestDate.getFullYear() + "-" +
                       ("0" + (yestDate.getMonth() + 1)).slice(-2) + "-" +
                       ("0" + (yestDate.getDate()-1)).slice(-2);
 
        return yestDate;
}


$(document).ready(function() {
	//form the URL for getting interestingness photos
	var url='http://api.flickr.com/services/rest/?method=flickr.interestingness.getList&api_key=' + apiKey + '&date=' + GetYestDate() + '&extras=url_n&per_page=5&format=json&jsoncallback=?';

	//call flickr API for getting ten interesting photos from yesterday
	$.getJSON(url,function(data) {
	var index=0;
		$.each(data.photos.photo, function(key, value) {
			if(index==0)
			{
				$(".carousel-inner").append('<div class="item active"><img src='+value.url_n+' alt="">');

			}
			else{
				$(".carousel-inner").append('<div class="item"><img src='+value.url_n+' alt="">');
			}
			index++;

		});
	});

	var totalMonths = 58;
	var firstMonth = new Date(2009, 0, 1);
    $( "#slider" ).slider({
		min: 0,
		max: totalMonths - 1,
		step: 1,
		value: totalMonths - 1,
		slide: function( event, ui ) {
			var selectedMonth = new Date(firstMonth.getTime());
			selectedMonth.setMonth(selectedMonth.getMonth() + ui.value);
			$('#sliderVal').text( selectedMonth.getFullYear() + '-' + zeroPad(selectedMonth.getMonth() + 1,2) );
			clearSVG('instant');
			getData();
		}
    });
    var selectedMonth = new Date(firstMonth.getTime());
    selectedMonth.setMonth(selectedMonth.getMonth() + (totalMonths-1));

    $('#sliderVal').text( selectedMonth.getFullYear() + '-' + zeroPad(selectedMonth.getMonth() + 1,2) );

	getData();

	$('#show_viz').click(function() {
		var month = $('#sliderVal').text();
	    if(!month) {
			$('#error').fadeIn('fast');
		} else if(currentDisplay == 'tags') {
			// we're already on this mode. don't do anything.
			return false;
		} else {
			// transitioning from camera to tags
			currentDisplay = 'tags';
			$('#criteria i').fadeTo('fast', 1.0);
			$('#error').fadeOut('fast');
			clearSVG();
			window.setTimeout(showTagGraph, 1000);
		}
		return false;
	});


	$("#show_viz-camera").click(function() {
		var month = $('#sliderVal').text();
	    if(!month) {
			$('#error').fadeIn('fast');
		} else if(currentDisplay == 'cameras') {
			// we're already on this mode. don't do anything.
			return false;
		} else {
			currentDisplay = 'cameras';
			$('#criteria i').fadeTo('fast', 1.0);
			$('#error').fadeOut('fast');
			clearSVG();
			window.setTimeout(showCameraGraph, 1000);
		}
		return false;
	});

});

function clearSVG(instant) {
	if(instant)
	{
		$("svg").children().each(function () {
			$(this).remove();
		});
	} else {
		var bars = svg.selectAll("rect.bar");
		bars
			.transition()
			.duration (500)
			.attr("height", 0)
			.attr("y", h - bottomPadding);
		window.setTimeout(hide, 500);
	}
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

function getData() {
	var month = $('#sliderVal').text();
    var tagsFile = 'json/' + month + 'tags.json';
    var camerasFile = 'json/' + month + 'cameras.json';
    var ajaxConnections = 0;

    if(!month) {
		$('#error').fadeIn('fast');
	} else {
		$('#criteria i').fadeTo('fast', 1.0);
		$('#error').fadeOut('fast');

	    // grab the three json arrays

	    // after grabbing all 2 json files,
	    // show the tag bar graph using tagsFile as input
	    ajaxConnections = 2;

		// get tags
		$.getJSON(tagsFile,
		function (data) { 
			ajaxConnections--;

			allTags = data;

			if(ajaxConnections == 0) {
				// all 3 have been retrieved
				clearSVG('instant');
				if(currentDisplay == 'cameras')
					showCameraGraph();
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
				clearSVG('instant');
				if(currentDisplay == 'cameras')
					showCameraGraph();
				else
					showTagGraph();
			}
		})
		.fail(function() {
			console.log("getPhotos fail");
			--ajaxConnections;
		});
	} // end error checking if
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
		.attr("desc", function(d) {
			return d.count;
		})
		.attr("width", barWidth)
		.attr("height", 0)
		.attr("y", h - bottomPadding)

		.attr("class","bar")
		.on("click",function(d){ 
			// when clicking on a bar, populate the carousel with 5 photos from the interestingness list
			$(".carousel-inner").empty();

			var carouselConnections = 0;
			for(var i = 0 ; i < 5 ; i++)
			{
				++carouselConnections;
				var id = d.photoIDs[i];

				//call flickr API for getting ten interesting photos from yesterday

				$.getJSON('http://api.flickr.com/services/rest/?method=flickr.photos.getInfo&api_key=' + apiKey + '&photo_id=' + id + '&format=json&jsoncallback=?',function(data) {
						// find the url information for this photo
						--carouselConnections;
						var t_url = "http://farm" + data.photo.farm + ".static.flickr.com/" + data.photo.server + "/" + data.photo.id + "_" + data.photo.secret + "_" + "z.jpg";
					    
						$(".carousel-inner").append('<div class="item"><img src='+t_url+' alt="">');
						if(carouselConnections == 0) {
							$('.carousel-inner .item:first-child').addClass('active');
						}
				});
			}
		})
		.transition()
		.duration (500)
		.attr("height", function(d) {
			return yScale(d.count);
		})

		.attr("y", function(d) {
			return h - bottomPadding - yScale(d.count);
		});

	// onHover, show count
	// hover event interaction
	$("#viz rect").on("mouseenter", function() {
		var self = $(this);

		self.animate({"opacity": .8}, 100);

		$("#count-popup")
			.css({
				"left": parseInt(self.position().left) - barWidth / 2 - 5,
				"top": self.position().top + 5
			})
			.text(self.attr("desc"))
			.fadeIn(50);
	}).on("mouseleave", function() {
		var self = $(this);
		self.animate({"opacity": 1}, 100);
		$("#count-popup").fadeOut(50);
	});


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
}


// flickr api expects date and month to be two digits. this function zero pads
function zeroPad(num, width) {
	var n = Math.abs(num);
	var zeros = Math.max(0, width - Math.floor(n).toString().length );
	var zeroString = Math.pow(10,zeros).toString().substr(1);
	if( num < 0 ) {
		zeroString = '-' + zeroString;
	}

	return zeroString+n;
}
