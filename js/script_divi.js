var allPhotos = [];
var allTags = [];
var allCameras = [];
var ajaxConnections = 0;
var photosPerDay = 5;
var totalAjax = 0;
var topTags = [];
var tagThreshold = 5;
// var apikey = '803b4fba97fed821c7d451d31da3c60f';

// dan's auth info
// var apikey = '844ff70b5e025eac452ff98c661b7295';
// var secret = '821ad3df37bd73f5';
// divi's auth info
var apikey = '180b1bf5a5f6f2399676fd9ad13fc2e9'
var secret = 'a46531d0184ed274'


// FlickrPhoto object constructor. Doesn't have the camera/make/model, which are added later
	function FlickrPhoto(id, farm, server, secret, title, tags) {
		this.id = id;
		this.farm = farm;
		this.server = server;
		this.secret = secret;
		this.title = title;
		this.tags = tags;
		this.tagcount = tags.length;
		this.camera = null;
		this.model = null;
		this.make = null;
	}

	// tag object constructor (used in allTags)
	function FlickrTag(tag, count, photoid) {
		this.tag = tag;
		this.count = count;
		this.photoIDs = [photoid];
	}

	// camera object constructor (used in allCameras)
	function FlickrCamera(cameraString, make, model, count, photoid) {
		this.camera = cameraString;
		this.make = make;
		this.model = model;
		this.count = count;
		this.photoIDs = [photoid];
	}

$(document).ready(function() {

	// Add tags that a user types in
	$("#getInterestingnessPhotos").click(function() {
		var startdate = $("#startdatepicker").val();
		var thisDate;

		for (var day = 1; day <= 31; ++day) {
			// build date string (yyyy-mm-dd)
			// get list of interesting photos for all dates that are valid within yyyy-mm-dd from 01-31
			// (ie, not all months have 01-31, don't waste API calls for 2013-02-29 through 2013-02-31
			thisDate = startdate + '-' + zeroPad(day, 2);
			if (isValidDate2(thisDate)) {
				ajaxConnections++;
				$.getJSON('http://api.flickr.com/services/rest/?method=flickr.interestingness.getList&api_key=' + apikey + '&date=' + thisDate + '&extras=tags&per_page=' + photosPerDay + '&format=json&jsoncallback=?',
					function(data) {
						ajaxConnections--;

						if (data.stat == 'fail') {
							// some sort of error.
							//console.log("interestingness.getList error " + data.code + ": " + data.message);
						} else {
							$.each(data.photos.photo, function(key, value) {
								var tagString = value.tags.trim();
								var tagArray = tagString.split(' ');

								// add photos and tags into the allPhotos array
								allPhotos.push(new FlickrPhoto(value.id, value.farm, value.server, value.secret, value.title, tagArray));

								// if tag doesn't exist in allTags, add it. if it exists, add photoID to photo list
								addPhotoTag(tagArray, value.id);

								//get camera info for each photo
								ajaxConnections++;
								// console.log("getting exif for " + value.id);
								// console.log("ajaxConnections: " + ajaxConnections);
								getExif(value);

							});
						} // end error check
					})
					.fail(function() {
						//console.log("flickr.interestingness.getList fail");
						--ajaxConnections;
					});
			}
		}
	});

});

// given a photo object, get the EXIF and add it to the appropriate arrays. Once the EXIF gathering is done, output the JSON
function getExif(photoObj) {
	$.getJSON('http://api.flickr.com/services/rest/?method=flickr.photos.getExif&api_key=' + apikey + '&photo_id=' + photoObj.id + '&format=json&jsoncallback=?',
		function(data) {
			ajaxConnections--;
			// console.log("ajaxConnections: " + ajaxConnections);

			var cameraMake, cameraModel;

			if (data.stat == 'fail') {
				// some sort of error. if everything is set up correctly, probably permissions, or EXIF is not available.
				//console.log("getExif error " + data.code + ": " + data.message + ". Photo ID " + photoObj.id);
			} else {
				//console.log("EXIF worked for " + photoObj.id);
				if (data.photo.camera) {
					// camera exists
					// console.log(photoObj.id + " camera: " + data.photo.camera);
				} else {
					console.log("no camera string");
				}

				for (var i = 0, j = data.photo.exif.length; i < j; ++i) {
					// check if this exif item is make or model. the case may be different depending on camera... depending on how much variation we have in capitalization, we may have to save a different "normalized" name for binning, and a separate "display" name
					if (data.photo.exif[i].label.toLowerCase() === 'make') {
						// console.log(photoObj.id + " make: " + data.photo.exif[i].raw._content);
						cameraMake = data.photo.exif[i].raw._content;
					} else if (data.photo.exif[i].label.toLowerCase() === 'model') {
						// console.log(photoObj.id + " model: " + data.photo.exif[i].raw._content);
						cameraModel = data.photo.exif[i].raw._content;
					}
				}

				// add cameras into the allCameras array. Also update the allPhotos array with camera information
				if (data.photo.camera) {
					addCameraToPhotos(photoObj.id, data.photo.camera, cameraMake, cameraModel);
				}

				if (ajaxConnections == 0) {
					// finished with all requests, stringify
					$("#allPhotosResult").text(JSON.stringify(allPhotos, null, " "));
					$("#allTagsResult").text(JSON.stringify(allTags, null, " "));
					for (var i = 0, l = allTags.length; i < l; i++) {
						if (allTags[i].count > tagThreshold && allTags[i].tag != "") {
							topTags.push(allTags[i])
						}
					}
					console.log("Length of All:" + allTags.length)
					console.log("Length of Top:" + topTags.length)
					plotTagHist(topTags);
				}

				$("#allCamerasResult").text(JSON.stringify(allCameras, null, " "));
			}
		}
	)
		.fail(function() {
			console.log("flickr.photos.getExif fail for " + photoObj.id);
			--ajaxConnections;
		});
}

function plotTagHist(allTags) {
	console.log('Tags:');
	console.log(allTags);

	var w = 900;
	var h = 400;
	var xScale = d3.scale.ordinal()
		.domain(d3.range(allTags.length))
		.rangeRoundBands([0, w], 0.05);

	var yScale = d3.scale.linear()
		.domain([0, d3.max(allTags, function(d) {
			return d.count;
		})])
		.range([0, h]);

	var tag = function(d) {
		return d.tag;
	};


	var svg = d3.select("#viz");
	svg.attr("width", w).attr("height", h);
	svg.selectAll("rect")
		.data(allTags, tag)
		.enter().append("rect")
		.attr("x", function(d, i) {
			return i * 40 + 80;
		})
	// .attr("width", 3
	// 			)
	.attr("y", function(d) {
		return h - yScale(d.count);
	})
	// .attr("width", xScale.rangeBand())
	.attr("width", 15)

	.attr("height", function(d) {
		return yScale(d.count);
	})
		.attr("fill", function(d) {
			return "rgb(0, 0, " + (d.count * 30) + ")";
		});

	//Create labels
	svg.selectAll("text")
		.data(allTags, tag)
		.sort()
		.enter()
		.append("text")
		.text(function(d) {
			return d.tag;
		})
		.attr("text-anchor", "middle")
		.attr("x", function(d, i) {
			return i * 40 + 80;
		})
		.attr("y", function(d) {
			return h - yScale(d.count) + 14;
		})
		.attr("dx", "-.8em")
		.attr("dy", 15)
		.attr("text-anchor", "middle")
		.attr("font-family", "sans-serif")
		.attr("font-size", "11px")
		.attr("fill", "black")
		.attr("transform", function(d) {
			// First, rotate the group (not the text) and then translate it
			// by the same amount that used to be applied via "x" attr
			return "rotate(" + ((d.x + d.dx / 2 - Math.PI / 2) / Math.PI * 180) + ") " +
				"translate(" + Math.sqrt(d.y) + ")";
		});



	console.log('D3 completed');

}


// if tag doesn't exist in allTags, add it
// if it exists, add photoID to photo list
function addPhotoTag(tagArray, photoid) {
	for (var i = 0, j = tagArray.length; i < j; ++i) {
		var found = 0;
		for (var k = 0, m = allTags.length; k < m; ++k) {
			if (allTags[k].tag == tagArray[i]) {
				// found it!
				allTags[k].count++;
				allTags[k].photoIDs.push(photoid);
				found = 1;
			} else if (k == (m - 1) && found == 0) {
				// it's not in allTags (ie, it is not found, and we reached the last tag in allTags)
				allTags.push(new FlickrTag(tagArray[i], 1, photoid));
			}
		}
		if (allTags.length == 0) {
			// edge case -- nothing in allTags yet
			allTags.push(new FlickrTag(tagArray[i], 1, photoid));
		}
	}
}

// add camera to allPhotos and allCameras
function addCameraToPhotos(photoid, cameraString, make, model) {
	// add to allPhotos. photoid should already exist from interestingness.getInfo
	for (var i = 0, j = allPhotos.length; i < j; ++i) {
		if (allPhotos[i].id == photoid) {
			allPhotos[i].camera = cameraString;
			allPhotos[i].make = make;
			allPhotos[i].model = model;
		}
	}

	// if camera doesn't exist in allCameras, add it. if it exists, add photoID to photo list
	for (var i = 0, j = allCameras.length; i < j; ++i) {
		var found = 0;
		if (allCameras[i].camera == cameraString) {
			// found it!
			allCameras[i].photoIDs.push(photoid);
			found = 1;
		} else if (i == (j - 1) && found == 0) {
			// it's not in allCamera (ie, it is not found, and we reached the last camera in array allCameras
			allCameras.push(new FlickrCamera(cameraString, make, model, 1, photoid));
		}
	}
	if (allCameras.length == 0) {
		// edge case -- nothing in allCameras yet
		allCameras.push(new FlickrCamera(cameraString, make, model, 1, photoid));
	}
}

// check if date string is a valid date
function isValidDate2(s) {
	var bits = s.split('-');
	var y = bits[0],
		m = bits[1],
		d = bits[2];
	// Assume not leap year by default (note zero index for Jan)
	var daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

	// If evenly divisible by 4 and not evenly divisible by 100,
	// or is evenly divisible by 400, then a leap year
	if ((!(y % 4) && y % 100) || !(y % 400)) {
		daysInMonth[1] = 29;
	}
	return d <= daysInMonth[--m]
}

// flickr api expects date and month to be two digits. this function zero pads
function zeroPad(num, width) {
	var n = Math.abs(num);
	var zeros = Math.max(0, width - Math.floor(n).toString().length);
	var zeroString = Math.pow(10, zeros).toString().substr(1);
	if (num < 0) {
		zeroString = '-' + zeroString;
	}

	return zeroString + n;
}
