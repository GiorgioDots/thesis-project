const fs = require("fs");
const path = require("path");

const FILE_EXT_ALLOWED = [".png", ".jpg", ".jpeg"];

exports.saveFileSync = (file, fileName) => {
  return new Promise((resolve, reject) => {
    file.mv(fileName, (error) => {
      if (error) {
        reject(error);
      }
      resolve(fileName);
    });
  });
};

exports.FILE_EXT_ALLOWED;

exports.checkImageFileExtension = (fileName) => {
  if (!FILE_EXT_ALLOWED.includes(path.extname(fileName))) {
    return false;
  } else {
    return true;
  }
};
