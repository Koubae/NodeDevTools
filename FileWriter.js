/* @Author: Federico Bau
*  @Date: 13/12/2021
*
* Simple Handle for creating folders (if not exists) and bunch of files
* Build appon StackOverlow answer here: https://stackoverflow.com/questions/21194934/how-to-create-a-directory-if-it-doesnt-exist-using-node-js
* Some Credits goes to:
*   https://stackoverflow.com/a/26815894/13903942
*   https://stackoverflow.com/a/21196961/13903942
*   https://stackoverflow.com/a/54137611/13903942
*
* @TO-Check:
*   https://www.npmjs.com/package/writefile
*
* TOD0:
*   Implement this with the current 3 available api in node (Promise API, Callback, Synchronous) givin the user
*   the choise of which one to use. Currentl the Callback one is used (more clear) but eventually all of 3 should be
*   and probably the defult one the Promise API
*
* * Write some test
* * Fix for race condition. so far the tests I run did not fail however I've feeling that is prone for a rece condition.
* * At least, using a loop and calling fileWriter I see how everything is fired all in once.
*
* */

const fs = require('fs')
const path = require('path');
const { open, close, constants } = fs;
/**
 * @root: ...
 * @dir: ...
 * @options: ...
 * @files: ...
 * @cb: ...
 *
* */
async function fileWriter(root=__dirname, dir, options, files, cb) {
    let { recursive, mask, debug } = options;
    if (!mask) mask = 0o777;
    let directory_root = __dirname;

    // Grab the files, if any
    // @Credit: https://stackoverflow.com/a/19292598/13903942
    let fileRoot = root.match(/[^\\/]+\.[^\\/]+$/);
    if (fileRoot) throw Error(`A file extension found in the root ${root} ${fileRoot[0]} not allowed`);
    let fileDir = dir.match(/[^\\/]+\.[^\\/]+$/);
    if (fileDir) fileDir = fileDir[0];
    if (!files && fileDir) files = [fileDir];
    else if (files && fileDir) files.splice(0, 0, fileDir); // insert at the first index

    // Remove leading directory markers, and remove ending /file-name.extension
    // @Credit: https://stackoverflow.com/a/54137611/13903942
    root =  root.replace(/^\.*\/|\/?[^\/]+\.[a-z]+|\/$/g, '');
    dir =  dir.replace(/^\.*\/|\/?[^\/]+\.[a-z]+|\/$/g, '');

    if (root !== __dirname) {
        recursive = true; // Need to enable recursive
        directory_root = path.join(__dirname, root);
    }
    let directory = path.join(directory_root, dir);
    if (debug) console.debug(` File Writer writing on ${directory}`);
    if (cb === undefined) cb = _fileWriter.bind(_fileWriter);

    // ----------------- DIRECTORY MAKER ---------------------- \\
    await fs.mkdir(directory, { recursive: recursive, mask: mask }, function(err, other) {
        if (err && err.code !== 'EEXIST') { // Ignore EEXIST means that directory exists and we can safaly proceed
            return cb(err, false);
        }
        cb(null, './db/' + dir, files);
    })

    // ----------------- FILES MAKER ---------------------- \\
    /**
     * @private
     * */
    async function _fileWriter(err, dir, files) {
        if (err) {
            console.error(`Error occurred while creating files (${files}) for folder ${directory} | Error: ${err}`);
            throw err;
        } else if (files) {
           if (debug) console.debug(`
           ----------------------------------------------------
             >>> Creating ${files.length} files to directory ${dir}
           ----------------------------------------------------
           `);

            await files.forEach(file => {
                let fileDir = path.join(dir, file);
                open(fileDir, 'a+', (err, fd) => {
                    if (err) {
                        console.error((`Error occurred while opening file (${file}) in path ${fileDir} | Error: ${err}`));
                        throw err;
                    }

                    try {
                        if (debug) console.debug(`> Creating file ${file} in ${fileDir} `);
                    } catch (err) {
                        console.error((`Error occurred while creating file (${file}) in path ${fileDir} | Error: ${err}`));
                        throw err;
                    } finally {
                        close(fd, (err) => {
                            if (err) {
                                console.error("Error", err);
                                throw err;
                            }
                            if (debug) console.debug(`
                                    ----------------------------------------------------
                                    >>> File ${file} Created Successfully in directory: ${fileDir} 
                                    ----------------------------------------------------
                                `);
                        });
                    }
                });
           })
        }
        return true;
    }

}


// ------------- TESTS ------------------ \\
if (require.main === module) {
    (async function createDirStruct() {
        const years = ['2019', '2020', '2021'];
        await Promise.all(years.map(async (year) => {
            const files = ['file_1.json', 'file_2.json', 'file_3.json'];
            await fileWriter('/db/', year, { recursive: false, mask:  0o777, debug: true}, files);
        }))
    }());

}
