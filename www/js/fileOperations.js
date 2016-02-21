var FileOperations = (function () {

    this.images = [];

    /**
     * ##FileOperations.prototype.bindEvents
     * _Binds events to different DOM elements._
     */
    FileOperations.prototype.bindEvents = function () {
        var self = this;
        $('#image-file').on('change', function (event) {
            self.validate(event);
        });
        $('.upload').on('click', function (event) {
            self.upload(event);
        });
        $('.crop-image').on('click', function (event) {
            self.buttonClickHandler(event);
            self.flag = true;
        });
        $('#save-cropped-area').on('click', function (event) {
            self.renderCanvas(event);
        });
        $('#crop-preview').on('load', function () {
            if (self.flag) {
                self.initJcrop(this);
            }
        });
    };

    /**
     * ##FileOperations.prototype.validate
     * _This function validates the size of the image._
     * _It checks if the images is 1024 x 1024 and returns true else false._
     * @param event
     */
    FileOperations.prototype.validate = function (event) {
        var self = this;
        if ($('#image-file')[0].files.length == 1) {
            var file = event.target.files[0];
            var target = '#main-image';
            var image = self.previewImage(file, target);
            image.onload = function () {
                var height = this.height;
                var width = this.width;
                if (height >= 1024 && width >= 1024) {
                    self.image = file;
                    self.valid = true;
                    $('#warning-message').addClass('hidden');
                } else {
                    $('#warning-message').removeClass('hidden');
                }
            };
        } else {
            self.images = $.makeArray($('#image-file')[0].files);
        }
    };

    /**
     * ##FileOperations.prototype.upload
     * _This function is called on click of upload._
     * _It uploads the image to S3 bucket and displays a message._
     */
    FileOperations.prototype.upload = function (event) {
        event.preventDefault();
        var self = this;
        if (self.valid) {
            var awsOperations = new AwsOperations();
            awsOperations.initialize();
            $.each(self.images, function (index, value) {
                var params = {
                    Key: index + value.name,
                    ContentType: value.type,
                    Body: value,
                    ACL: 'public-read'
                };
                var bucket = awsOperations.bucket;
                bucket.upload(params, function (err, data) {
                    if (err) {
                        console.log(err);
                        $('#image-file').val('');
                        $('.success-message').addClass('hidden');
                        $('.warning-message-fail').removeClass('hidden');
                    } else {
                        $('.warning-message-fail').addClass('hidden');
                        $('.success-message').removeClass('hidden');
                    }
                });
            });
        } else {
            $('.warning-message').removeClass('hidden');
        }
    };

    /**
     * ##FileOperations.prototype.buttonClickHandler
     * _Click handler for crop buttons._
     */
    FileOperations.prototype.buttonClickHandler = function (event) {
        var self = this;
        $('#save-cropped-area').attr('data-tag', event.target.dataset.id);
        if(self.image) {
            var image = self.previewImage(self.image, '#crop-preview');
        }
    };

    /**
     * ##FileOperations.prototype.previewImage
     * _Called for previewing an image._
     * _Return the image._
     * @param file
     * @param target
     * @returns {Image}
     */
    FileOperations.prototype.previewImage = function (file, target) {
        var image = new Image();
        image.src = window.URL.createObjectURL(file);
        var reader = new FileReader();
        reader.onload = function (e) {
            $(target).attr('src', image.src);
        };
        reader.readAsDataURL(file);
        return image;
    };

    /**
     * ##FileOperations.prototype.getCroppedImage
     * _Converts canvas to image and returns the cropped image._
     * @param tag
     * @returns {Image}
     */
    FileOperations.prototype.getCroppedImage = function (tag) {
        var canvas = document.getElementById('canvas-image');
        var img = new Image();
        var dataUrl = canvas.toDataURL("image/png");
        img.src = dataUrl;
        return img;
    };

    /**
     * ##FileOperations.prototype.renderCanvas
     * _Copies the clipped image on canvas._
     */
    FileOperations.prototype.renderCanvas = function (event) {
        var self = this;
        if (self._jcrop) {
            var croppedArea = self._jcrop.tellSelect();
            var width = croppedArea.w;
            var height = croppedArea.h;
            var newImage = $('#main-image')[0];
            $(newImage).removeClass("hidden");
            var canvas = $('#canvas-image')[0];
            $(canvas).css({
                width: width,
                height: height
            });
            var tag = "#" + event.target.dataset.tag;
            $(canvas).attr('width', width);
            $(canvas).attr('height', height);
            var context = canvas.getContext('2d');
            context.drawImage(newImage, croppedArea.x, croppedArea.y, width, height, 0, 0, width, height);
            var canvasToImage = self.getCroppedImage(tag);
            self.getBlob(canvasToImage, tag);
            self.updatePreview(canvasToImage, tag);
            self.destroyJcrop('#crop-preview');
        }
    };

    /**
     * ##FileOperations.prototype.initJcrop
     * _Initializes jcrop view._
     * @param context
     */
    FileOperations.prototype.initJcrop = function (context) {
        var self = this;
        $(context).Jcrop({
            //aspectRatio: 1,
            bgOpacity: 0.4,
            setSelect: [0, 0, 360, 360]
        }, function () {
            self._jcrop = this;
        });
    };

    /**
     * ##FileOperations.prototype.updatePreview
     * _Updates the preview of cropped images._
     * @param image
     * @param target
     */
    FileOperations.prototype.updatePreview = function (image, target) {
        $(target)[0].src = image.src;
    };

    /**
     * ##FileOperations.prototype.destroyJcropAndPreview
     * _Destroys jcrop._
     * @param target
     */
    FileOperations.prototype.destroyJcrop = function (target) {
        $(target).data('Jcrop').destroy();
        this.flag = false;
    };

    /**
     * ##FileOperations.prototype.getBlob
     * _Converts the image to blob and creates a link to download image._
     * @param image
     * @param tag
     */
    FileOperations.prototype.getBlob = function (image, tag) {
        var self = this;
        var xhr = new XMLHttpRequest();
        xhr.open("GET", image.src, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function (e) {
            var arrayBufferView = new Uint8Array(this.response);
            var blob = new Blob([arrayBufferView], {type: "image/png"});
            var urlCreator = window.URL || window.webkitURL;
            var imageUrl = urlCreator.createObjectURL(blob);
            $('#download-file').attr({
                id: 'download-file',
                target: '_blank',
                href: imageUrl
            });
        };
        xhr.send();
    };
});