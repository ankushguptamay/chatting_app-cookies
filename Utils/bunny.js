import dotenv from "dotenv";
dotenv.config();

import axios from "axios";
const { BUNNY_HOSTNAME, BUNNY_STORAGE_ACCESS_KEY } = process.env;

export const uploadFileToBunny = async (bunnyFolderName, fileStream, filename) => {
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

export const deleteFileToBunny = async (bunnyFolderName, filename) => {
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
