const axios = require("axios");
const { BUNNY_HOSTNAME, BUNNY_STORAGE_ACCESS_KEY } = process.env;

exports.uploadFileToBunny = async (bunnyFolderName, fileStream, filename) => {
  return new Promise((resolve, reject) => {
    axios
      .put(`${BUNNY_HOSTNAME}/${bunnyFolderName}/${filename}`, fileStream, {
        headers: {
          AccessKey: BUNNY_STORAGE_ACCESS_KEY,
        },
      })
      .then(
        (data) => {
          resolve(data);
        },
        (error) => {
          reject(error);
        }
      );
  });
};

exports.deleteFileToBunny = async (bunnyFolderName, filename) => {
  return new Promise((resolve, reject) => {
    axios
      .delete(`${BUNNY_HOSTNAME}/${bunnyFolderName}/${filename}`, {
        headers: {
          AccessKey: BUNNY_STORAGE_ACCESS_KEY,
        },
      })
      .then(
        (data) => {
          resolve(data);
        },
        (error) => {
          reject(error);
        }
      );
  });
};
