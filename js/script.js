
var interestingPhotos = [];
var allTags = [];
var allCameras = [];


$(document).ready(function(){
    

   

   console.log("In ready");





    // Add tags that a user types in
    $("#getInterestingnessPhotos").click(function(){
            console.log("Inside javascript");
            var startdate= $("#startdatepicker").val();
           // var enddate = $("#enddatepicker").val() );

            console.log( "startdate = "+startdate );

            
            var url = "http://api.flickr.com/services/rest/?method=flickr.interestingness.getList&api_key=803b4fba97fed821c7d451d31da3c60f&date=" + startdate + "&per_page=500&format=json&jsoncallback=?";
                

            $.getJSON(url, function(data){
                $.each(data.photos.photo, function(key,value){

                    //console.log("Photo id = "+value.id);

                     //get tags for each photo
                     var url1 = "http://api.flickr.com/services/rest/?method=flickr.photos.getInfo&api_key=803b4fba97fed821c7d451d31da3c60f&photo_id="+value.id+"&format=json&jsoncallback=?" 
                     $.getJSON(url1, function(data){
                         $.each(data.photo.tags.tag, function(key,value){

                            allTags.push(value._content);

                         });

                          //get camera info for each photo
                          var url2 = "http://api.flickr.com/services/rest/?method=flickr.photos.getExif&api_key=803b4fba97fed821c7d451d31da3c60f&photo_id="+value.id+"&format=json&jsoncallback=?"
                          $.getJSON(url2, function(data){
                             
                                 allCameras.push(data.photo.camera);

                        
                            });
                        
                     });


                    interestingPhotos.push(value.id);
                
                });

            //console.log( JSON.stringify(data) );
            }); 
            
            return false;       
        });

});
