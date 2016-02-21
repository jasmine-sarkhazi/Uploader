var AwsOperations = (function () {

    /**
     * ##AwsOperations.prototype.initialize
     * _Initializes the S3 bucjet by supplying the required parameters._
     */
    AwsOperations.prototype.initialize = function () {
        var self = this;

        //The bucket name
        self.bucketName = '';

        //The region name
        AWS.config.region = '';

        //The credentials required to make a request to the bucket
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: '',
            accessKeyId: '',
            secretAccessKey: ''
        });

        //S3 bucket
        self.bucket = new AWS.S3({
            params: {
                Bucket: self.bucketName
            },
            signatureVersion: "v3",
            endpoint: '',
            credentials: AWS.config.credentials.params
        });
    };
});

