
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
            var tagsWithSpaces;

            
            var url = "http://api.flickr.com/services/rest/?method=flickr.interestingness.getList&api_key=803b4fba97fed821c7d451d31da3c60f&date=" + startdate + "&extras=tags&per_page=500&format=json&jsoncallback=?";
                

            $.ajax({
               url: url,
                dataType: 'json',
                success: function(data){

               $.each(data.photos.photo, function(key,value){

                                tagsWithSpaces=value.tags.trim();
                                
                                var tagsWithoutSpaces = tagsWithSpaces.split(' ');
                                
                                allTags.push(tagsWithoutSpaces);
                               

                            

                                      //get camera info for each photo
                                      var url2 = "http://api.flickr.com/services/rest/?method=flickr.photos.getExif&api_key=803b4fba97fed821c7d451d31da3c60f&photo_id="+value.id+"&format=json&jsoncallback=?"
                                      

                                        $.ajax({
                                           url: url2,
                                            dataType: 'json',
                                            success: function(data){

                                                 $.each(data, function(key,value){
                                                    if(typeof this.camera !== "undefined")
                                                    {
                                                        //console.log(this.camera);
                                                     allCameras.push(this.camera);
                                                    }
                                                    
                                                 });
                                             }
                                         });
                                    
                                 });

                             }
                         });





           
            // return false;  

            //console.log( JSON.stringify(data) );
            }); 
            

        $.ajaxStop(function() {
         console.log("Stopped");
        });       

});
