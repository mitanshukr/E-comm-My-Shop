const fs = require('fs');
const path = require('path');
const rootDir = require('./path');

const deleteFile = (filePath) => {
    const deletePath = path.join(rootDir, 'public', filePath);
    console.log(deletePath);
    fs.unlink(deletePath, (err) => {
        if(err){
            throw(err);
        }
    });
};

exports.deleteFile = deleteFile;