Template.c_upload.events({

});

function dataURItoBlob (dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs
    var byteString;
    if (dataURI.split(',')[0].indexOf('base64') >= 0)
        byteString = atob(dataURI.split(',')[1]);
    else
        byteString = unescape(dataURI.split(',')[1]);
    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }

    // write the ArrayBuffer to a blob, and you're done
    return new Blob([ab],{type: mimeString});
}
Template.c_upload_stream.events({
	'change input[type=file]': function (e,helper) {

		var options = {context:this};

		if(helper.data && _.has(helper.data,"callback")){
			options.callback = helper.data.callback;
		}

		if(helper.data && _.has(helper.data,"public_id")){
			options.public_id = helper.data.public_id;
		}

		var files = e.currentTarget.files;

		_.each(files,function(file){
			var reader = new FileReader;

			reader.onload = function () {
                console.log(reader.result)
				var file_data = new Uint8Array(reader.result);
				options.db_id = _cloudinary.insert({});
				Meteor.call("cloudinary_upload_stream",file_data,options,function(err,res){
					if(err){
						_cloudinary.remove(options.db_id);
						console.log(err);
					}
				});
			};

			reader.readAsArrayBuffer(file);

		});
	},
    'click .js-save-photo':function(e,helper){
        e.preventDefault();
        e.stopPropagation();

        var options = {context:this};
        var cropSettings = {};
        var $image = $('.img-to-crop');
        cropSettings = $image.cropper('getData');
        options.cropSettings = cropSettings;
        options.cropSettings.crop = 'crop';
        if(helper.data && _.has(helper.data,"callback")){
            options.callback = helper.data.callback;
        }

        if(helper.data && _.has(helper.data,"type")){
            options.type = helper.data.type;
        }

        if(helper.data && _.has(helper.data,"public_id")){
            options.public_id = helper.data.public_id;
        }

        var file = null;
        if(helper.data && _.has(helper.data,"image")){
            file = helper.data.image;
            file = dataURItoBlob(file);
            var reader = new FileReader;
            reader.onload = function () {
                console.log(reader.result)
                var file_data = new Uint8Array(reader.result);
                options.db_id = _cloudinary.insert({});
                Meteor.call("cloudinary_upload_stream",file_data,options,function(err,res){
                    if(err){
                        _cloudinary.remove(options.db_id);
                        console.log(err);
                    }
                    else{
                        $('.crop_container').modal('hide');
                    }
                });
            };
            reader.readAsArrayBuffer(file);
        }


    }
});