const AWS = require("aws-sdk");
const uuid = require("uuid");

const AWS_ID = process.env.AWS_ID;
const AWS_SECRET = process.env.SECRET;
const AWS_REGION = process.env.AWS_REGION;

const s3 = new AWS.S3();
const rekognition = new AWS.Rekognition({
  accessKeyId: AWS_ID,
  secretAccessKey: AWS_SECRET,
  region: AWS_REGION,
});

exports.createCollectionSync = () => {
  const collectionId = uuid();
  const params = {
    CollectionId: collectionId,
  };
  return new Promise((resolve, reject) => {
    rekognition.createCollection(params, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(collectionId);
    });
  });
};

exports.s3UploadFileSync = (file, fileId, bkt_name) => {
  const s3Params = {
    Bucket: bkt_name,
    Key: fileId,
    Body: file,
    ACL: "public-read",
  };
  return new Promise((resolve, reject) => {
    s3.upload(s3Params, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data.Location);
    });
  });
};

exports.s3DeleteFileSync = (objName, bkt_name) => {
  const params = {
    Bucket: bkt_name,
    Key: objName,
  };
  return new Promise((resolve, reject) => {
    s3.deleteObject(params, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
};

exports.deleteFacesFromCollectionSync = (collectionId, faceIds) => {
  const params = {
    CollectionId: collectionId,
    FaceIds: faceIds,
  };
  return new Promise((resolve, reject) => {
    rekognition.deleteFaces(params, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(data);
    });
  });
};

exports.indexFacesSync = (collectionId, fileId, bkt_name) => {
  const params = {
    CollectionId: collectionId,
    Image: {
      S3Object: {
        Bucket: bkt_name,
        Name: fileId,
      },
    },
  };
  return new Promise((resolve, reject) => {
    rekognition.indexFaces(params, (error, data) => {
      if (error) {
        reject(error);
        return;
      }
      // if (data.FaceRecords.length > 1) {
      //   reject(new Error("Please, only one person per photo!"));
      //   return;
      // }
      // resolve(data.FaceRecords[0].Face.FaceId);
      resolve(data.FaceRecords);
    });
  });
};

exports.searchFacesByImage = (collectionId, bkt_name, file) => {
  var params = {
    CollectionId: collectionId,
    Image: {
      Bytes: file,
    },
    FaceMatchThreshold: 85,
    MaxFaces: 1,
    QualityFilter: "HIGH",
  };
  return new Promise((resolve, reject) => {
    rekognition.searchFacesByImage(params, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      if (data) {
        resolve(data.FaceMatches);
      } else {
        resolve([]);
      }
    });
  });
};
