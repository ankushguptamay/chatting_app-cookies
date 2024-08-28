import path from "path";
import multer from "multer";

const filter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb("Please upload only Image or PDF.", false);
  }
};

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(`${__dirname}/../Resource`));
  },
  filename: (req, file, callback) => {
    var filename = `${Date.now()}-${file.originalname}`;
    callback(null, filename);
  },
});
const uploadImage = multer({ storage: storage, fileFilter: filter });

export default uploadImage ;
