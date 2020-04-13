const FILE_EXT_ALLOWED = ['image/png', 'image/jpg', 'image/jpeg'];

exports.checkImageFileExtension = (mimetype) => {
  if (!FILE_EXT_ALLOWED.includes(mimetype)) {
    return false;
  } else {
    return true;
  }
};
