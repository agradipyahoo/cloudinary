Cloudinary = Npm.require("cloudinary");
var Future = Npm.require('fibers/future');
var stream_buffers = Npm.require("stream-buffers");

_cloudinary_stream = new Meteor.Stream("c_stream");

_cloudinary_stream.permissions.read(function(user,event) {
	return true;
});

Meteor.methods({
	cloudinary_upload:function(file,options){
        check(file,Match.Any);
        check(options,Match.Any);
		this.unblock();

		var moreData = {};
		
		if (options.public_id)
			moreData.public_id = options.public_id;

		var future = new Future();

		Cloudinary.uploader.upload(file,function(result){
			if(result && !result.error) {
				_.extend(result,{total_uploaded:result.bytes,percent_uploaded:100,uploading:false});

				_cloudinary_stream.emit("upload",result,options);
			}

			future.return(result);
		},moreData);

		if(future.wait() && !future.wait().error){
			var callback_options = {
				context:options.context,
				upload_data:future.wait()
			}

			if(_.has(options,"callback")){
				Meteor.call(options.callback,callback_options);
			}

			return future.wait();
		} else {
			throw new Meteor.Error("Cloudinary Error",future.wait().error);
		}
	},
	cloudinary_upload_stream:function(file,options){
        check(file,Match.Any);
        check(options,Match.Any);
		this.unblock();


		var moreData = {};

		if (options.public_id)
			moreData.public_id = options.public_id;

        if(options.transformation){
            moreData.transformation = options.transformation;
        }

        if(options.image_metadata){
            moreData.image_metadata = options.image_metadata;
        }

        if(options.faces){
            moreData.faces = options.faces;
        }

        if(options.eager_async){
            moreData.eager_async = options.eager_async;
            moreData.eager_notification_url = options.eager_notification_url;
        }

        if(options.allowed_formats){
            moreData.allowed_formats = options.allowed_formats;
        }

        if(options.eager){
            moreData.eager = options.eager;
        }

		var file_stream_buffer = new stream_buffers.ReadableStreamBuffer({
			frequency:10,
			chunkSize:2048
		});

        console.log(moreData);
        var buffer = new Buffer(file);
		file_stream_buffer.put(buffer);

		var future = new Future();
		var stream = Cloudinary.uploader.upload_stream(function(result){
			if(result && !result.error) {
				_.extend(result,{total_uploaded:result.bytes,percent_uploaded:100,uploading:false});

				_cloudinary_stream.emit("upload",result,options);
			}

			future.return(result);
		},moreData);

		var total_buffer_size = buffer.length;
		var total_uploaded = 0;

		file_stream_buffer.on("data",function(data){
			total_uploaded += data.length;
			percent_uploaded = Number(((total_uploaded / total_buffer_size) * 100).toFixed(2));

			var upload_stats = {
				total_uploaded: total_uploaded,
				percent_uploaded: percent_uploaded,
				uploading:true
			}

			_cloudinary_stream.emit("upload",upload_stats,options);

			stream.write(data);
		});

		file_stream_buffer.on("end",stream.end);

		if(future.wait() && !future.wait().error){
			var callback_options = {
				context:options.context,
				upload_data:future.wait(),
                type:options.type,
                cropSettings:options.cropSettings
			}

			if(_.has(options,"callback")){
				Meteor.call(options.callback,callback_options);
			}

			return future.wait();
		} else {
			throw new Meteor.Error("Cloudinary Error",future.wait().error);
		}
	},
	cloudinary_delete:function(public_id){
		//This isn't very safe, lol
		this.unblock();

		var future = new Future();

		Cloudinary.api.delete_resources([public_id],function(result){
			future.return(result);
		});

		return future.wait();
	},
	cloudinary_list_all:function(){
		this.unblock();
		var future = new Future();

		Cloudinary.api.resources(function(result){
			if(result && _.has(result,"resources")){
				future.return(result.resources);
			} else {
				future.return([]);
			}
		});

		return future.wait();
	}
});