// dan's auth info
// var apikey = '844ff70b5e025eac452ff98c661b7295';
// var secret = '821ad3df37bd73f5';

var interestingPhotos = [];
var allTags = [];
var allCameras = [];
var ajaxConnections = 0;
var apikey = '803b4fba97fed821c7d451d31da3c60f';

$(document).ready(function(){
    // Add tags that a user types in
    $("#getInterestingnessPhotos").click(function(){
            console.log("Inside javascript");
            var startdate= $("#startdatepicker").val();
           // var enddate = $("#enddatepicker").val() );

            console.log( "startdate = "+startdate );
            var tagsWithSpaces;


			// get list of interesting photos for date      
            ajaxConnections++;
			$.getJSON('http://api.flickr.com/services/rest/?method=flickr.interestingness.getList&api_key=' + apikey + '&date=' + startdate + '&extras=tags&per_page=10&format=json&jsoncallback=?',
			function (data) { 
				ajaxConnections--;

				$.each(data.photos.photo, function(key,value){
                    tagsWithSpaces=value.tags.trim();

                    var tagsWithoutSpaces = tagsWithSpaces.split(' ');

                    allTags.push(tagsWithoutSpaces);

                    console.log("getting exif for " + value.id);

                    ajaxConnections++;
					console.log("ajaxConnections: " + ajaxConnections);

					//get camera info for each photo
					$.getJSON('http://api.flickr.com/services/rest/?method=flickr.photos.getExif&api_key=' + apikey + '&photo_id=' + value.id + '&format=json&jsoncallback=?',
					function(data) {
						ajaxConnections--;
						console.log("ajaxConnections: " + ajaxConnections);

						var cameraString, cameraMake, cameraModel;

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
						
    
/*
            var url = "http://api.flickr.com/services/rest/?method=flickr.interestingness.getList&api_key=803b4fba97fed821c7d451d31da3c60f&date=" + startdate + "&extras=tags&per_page=500&format=json&jsoncallback=?";

            $.ajax({
				beforesend: function(xhr) {
				    ajaxConnections++;
				    console.log("beforesend1. aC = " + ajaxConnections);
				},
                url: url,
                dataType: 'json',
                success: function(data){
                	ajaxConnections--;
                	console.log("ajaxConnections = " + ajaxConnections);

	                $.each(data.photos.photo, function(key,value){
                        tagsWithSpaces=value.tags.trim();

                        var tagsWithoutSpaces = tagsWithSpaces.split(' ');

                        allTags.push(tagsWithoutSpaces);

						//get camera info for each photo
                        var url2 = "http://api.flickr.com/services/rest/?method=flickr.photos.getExif&api_key=803b4fba97fed821c7d451d31da3c60f&photo_id="+value.id+"&format=json&jsoncallback=?"

                        $.ajax({
                        	beforesend: function(xhr) {
                        		ajaxConnections++;
                        		console.log("beforesend2. aC = " + ajaxConnections);
                        	},
                            url: url2,
                            dataType: 'json',
                            success: function(data){
                            	ajaxConnections--;
	                            $.each(data, function(key,value){
		                            if(typeof this.camera !== "undefined") {
		                                //console.log(this.camera);
	                                    allCameras.push(this.camera);
	                                }
	                            });
	                        },
                			error: function (xhr, errDesc, exception) {
	                    	    ajaxConnections--;
								console.log("ajaxConnections = " + ajaxConnections);
	                    	}
                        });
                                    
                    }); //end each

                }, // end success
                error: function (xhr, errDesc, exception) {
                	ajaxConnections--;
                	console.log("ajaxConnections = " + ajaxConnections);
                }
            });
*/

            //console.log( JSON.stringify(data) );
            }); 
});
