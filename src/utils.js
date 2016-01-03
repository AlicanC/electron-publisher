import childProcess from 'child_process';

export function execFile(command, args, options) {
  return new Promise((resolve, reject) => {
    childProcess.execFile(command, args, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(stdout, stderr);
    });
  });
}
