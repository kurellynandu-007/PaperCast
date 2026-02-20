import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';

// Configure fluent-ffmpeg to use the static binary we installed
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeStatic.path);

export function mergeAudioFiles(filePaths, outputPath) {
    return new Promise((resolve, reject) => {
        // We will use concat demuxer for merging as it's faster for many files with same encoding

        if (!filePaths || filePaths.length === 0) {
            return reject(new Error('No files to merge'));
        }

        const command = ffmpeg();
        filePaths.forEach((file) => {
            command.input(file);
        });

        command
            .on('error', (err) => {
                console.error('Error merging audio:', err);
                reject(err);
            })
            .on('end', () => {
                resolve(outputPath);
            })
            .mergeToFile(outputPath, './temp');
    });
}
