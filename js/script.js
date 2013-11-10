// dan's auth info
// var apikey = '844ff70b5e025eac452ff98c661b7295';
// var secret = '821ad3df37bd73f5';


/*
Primary Data Structures
One set of JSON arrays per time period (month). Each array stored in a separate .json file that we will load via $.GET and json.parse

Array of Photo objects (allPhotos):
{
	// the following variables are from the interestingness.getList call
	id: 12345,
	farm: 5,
	server: 4444,
	secret: 'e3d64kdk3',
	title: 'sunset at the bridge'
	tags: ["tag1","tag2","tag3"]

	// the following variables are from the getExif call
	// in my experience, make and model are inconsistent, perhaps to different file structures? i dunno. probably better to rely on the camera string than make+model
	camera: "Canon 5D",
	make: "Canon",
	model: "5D",
}

Array of tags (allTags):
{
	tag: 'bridge',
	count: 193,
	photoIDs: [1234, 3841, 374, 173, 42853]
}

Array of Camera objects (allCameras):
{
	camera: "Canon 5D",
	make: "Canon",
	model: "5D",
	count: 48,
	photoIDs: [19481, 17263, 18723, 123, 44]
}
*/

var allPhotos = [];
var allTags = [];
var allCameras = [];
var ajaxConnections = 0;
var apikey = '803b4fba97fed821c7d451d31da3c60f';

// FlickrPhoto object constructor. Doesn't have the camera/make/model, which are added later
function FlickrPhoto(id, farm, server, secret, title, tags) {
	this.id = id;
	this.farm = farm;
	this.server = server;
	this.secret = secret;
	this.title = title;
	this.tags = tags;
	this.camera = null;
	this.model = null;
	this.make = null;
}

function FlickrTag(tag, count, photoid) {
	this.tag = tag;
	this.count = count;
	this.photoIDs = [photoid];
}

function FlickrCamera(cameraString, make, model, count, photoid) {
	this.camera = cameraString;
	this.make = make;
	this.model = model;
	this.count = count;
	this.photoIDs = [photoid];
}

$(document).ready(function(){
    // Add tags that a user types in
    $("#getInterestingnessPhotos").click(function(){
            console.log("Inside javascript");
            var startdate= $("#startdatepicker").val();
            // var enddate = $("#enddatepicker").val() );

            console.log( "startdate = "+startdate );

			// get list of interesting photos for date      
            ajaxConnections++;
			$.getJSON('http://api.flickr.com/services/rest/?method=flickr.interestingness.getList&api_key=' + apikey + '&date=' + startdate + '&extras=tags&per_page=10&format=json&jsoncallback=?',
			function (data) { 
				ajaxConnections--;

				$.each(data.photos.photo, function(key,value){
                    var tagString=value.tags.trim();
                    var tagArray = tagString.split(' ');
                    var cameraString, cameraMake, cameraModel;


                    // add photos and tags into the allPhotos array
                    allPhotos.push(new FlickrPhoto(value.id, value.farm, value.server, value.secret, value.title, tagArray));

                    // if tag doesn't exist in allTags, add it. if it exists, add photoID to photo list
                    addPhotoTag(tagArray, value.id);

					//get camera info for each photo
                    ajaxConnections++;
                    console.log("getting exif for " + value.id);
					console.log("ajaxConnections: " + ajaxConnections);
					$.getJSON('http://api.flickr.com/services/rest/?method=flickr.photos.getExif&api_key=' + apikey + '&photo_id=' + value.id + '&format=json&jsoncallback=?',
					function(data) {
						ajaxConnections--;
						console.log("ajaxConnections: " + ajaxConnections);

						if(data.stat == 'fail') {
							// some sort of error. if everything is set up correctly, probably permissions, or EXIF is not available.
							console.log("getExif error " + data.code + ": " + data.message + ". Photo ID " + value.id);
						} else {
							console.log("EXIF worked for " + value.id);
							if(data.photo.camera) {
								// camera exists
								console.log(value.id + " camera: " + data.photo.camera);
							} else {
								console.log("no camera string");
							}

							for(var i=0,j=data.photo.exif.length ; i > j ; ++i) {
								// check if this exif item is make or model. the case may be different depending on camera... depending on how much variation we have in capitalization, we may have to save a different "normalized" name for binning, and a separate "display" name
								if(data.photo.exif[i].label.toLowerCase() === 'make') {
									console.log(value.id + " make: " + data.photo.exif[i].tag);
									cameraMake = data.photo.exif[i].tag;
								} else if(data.photo.exif.label.toLowerCase() === 'model') {
									console.log(value.id + " model: " + data.photo.exif[i].tag);
									cameraModel = data.photo.exif[i].tag;
								}
							}

							// add cameras into the allCameras array. Also update the allPhotos array with camera information
							if(data.photo.camera) {
								addCameraToPhotos(value.id, data.photo.camera, cameraMake, cameraModel);
							}

							if(ajaxConnections==0) {
								// finished with all requests, stringify
								$("#allPhotosResult").text(JSON.stringify(allPhotos, null, " "));
								$("#allTagsResult").text(JSON.stringify(allTags, null, " "));
							}
						}
					})
					.fail(function() {
						console.log("flickr.photos.getExif fail for " + value.id);
					});
                });
			})
			.fail(function() {
				console.log("flickr.interestingness.getList fail");
			});
    });
});

// if tag doesn't exist in allTags, add it. if it exists, add photoID to photo list
function addPhotoTag(tagArray, photoid) {
	for(var i=0, j=tagArray.length ; i<j ; ++i) {
		for(var k=0, m=allTags.length ; k<m ; ++k) {
			if(allTags[k].tag == tagArray[i]) {
				// found it!
				allTags[k].count++;
				allTags[k].photoIDs.push(tagArray[i]);
			}
			else if (k == (m-1)) {
				// it's not in allTags (ie, it is not found, and we reached the last tag in allTags)
				allTags.push(new FlickrTag(tagArray[i],1,photoid));
			}
		}
		if(allTags.length == 0) {
			// edge case -- nothing in allTags yet
			allTags.push(new FlickrTag(tagArray[i],1,photoid));
		}
	}
}

// add camera to allPhotos and allCameras
function addCameraToPhotos(photoid, cameraString, make, model) {
	// add to allPhotos. photoid should already exist from interestingness.getInfo
	for(var i=0, j=allPhotos.length; i < j ; ++i) {
		if(allPhotos[i].id == photoid) {
			allPhotos[i].camera = cameraString;
			allPhotos[i].make = make;
			allPhotos[i].model = model;
		}
	}

	// if camera doesn't exist in allCameras, add it. if it exists, add photoID to photo list
	for(var i=0, j=allCameras.length ; i<j ; ++i) {
		if(allCameras[i].camera == cameraString) {
			// found it!
			allCameras[i].photoIDs.push(photoid);
		} else if(i == (j-1)) {
			// it's not in allCamera (ie, it is not found, and we reached the last camera in array allCameras
			allCameras.push(new FlickrCamera(cameraString, make, model, 1, photoid));
		}
	}
}