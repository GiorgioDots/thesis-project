const AWS = require('aws-sdk');
const AWS_ID = process.env.AWS_ID;
const AWS_SECRET = process.env.AWS_SECRET;

const s3Options = {
    accessKeyId: AWS_ID,
    secretAccessKey: AWS_SECRET
};

const rekognitionOptions = {
    accessKeyId: AWS_ID,
    secretAccessKey: AWS_SECRET,
    region: process.env.AWS_REGION
};

const s3 = new AWS.S3(s3Options);

const rekognition = new AWS.Rekognition(rekognitionOptions);

module.exports.s3UploadFileSync = (file, fileId, bkt_name) => {
    const s3Params = {
        Bucket: bkt_name,
        Key: fileId,
        Body: file,
        ACL: 'public-read'
    };
    return new Promise((resolve, reject) => {
        s3.upload(s3Params, (err, data) => {
            if (err) {
                reject(err)
            }
            resolve(data.Location);
        });
    });
}

module.exports.s3DeleteFileSync = (objName, bkt_name) => {
    const params = {
        Bucket: bkt_name,
        Key: objName
    }
    return new Promise((resolve, reject) => {
        s3.deleteObject(params, (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        })
    })
}

module.exports.deleteFaceFromCollectionSync = (collectionId, faceId) => {
    const params = {
        CollectionId: collectionId,
        FaceIds: [
            faceId
        ]
    }
    return new Promise((resolve, reject) => {
        rekognition.deleteFaces(params, (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}

module.exports.addFaceInCollectionSync = (collectionId, fileId, bkt_name) => {
    const params = {
        CollectionId: collectionId,
        Image: {
            S3Object: {
                Bucket: bkt_name,
                Name: fileId
            }
        }
    };
    return new Promise((resolve, reject) => {
        rekognition.indexFaces(params, (error, data) => {
            if (error) {
                reject(error);
            }
            if (data.FaceRecords.length > 1) {
                reject(new Error('Please, only one person per photo!'));
            }
            resolve(data.FaceRecords[0].Face.FaceId);
        });
    });
}

module.exports.searchFacesByImage = (collectionId, bkt_name, file) => {
    var params = {
        CollectionId: collectionId,
        Image: {
            Bytes: file
        },
        FaceMatchThreshold: 85,
        MaxFaces: 1,
        QualityFilter: "HIGH"
    };
    return new Promise((resolve, reject) => {
        rekognition.searchFacesByImage(params, (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data.FaceMatches);
        });
    })
}