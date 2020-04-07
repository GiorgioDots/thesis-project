const path = require("path");

const FILE_EXT_ALLOWED = [".png", ".jpg", ".jpeg"];

exports.checkImageFileExtension = (fileName) => {
  if (!FILE_EXT_ALLOWED.includes(path.extname(fileName))) {
    return false;
  } else {
    return true;
  }
};
