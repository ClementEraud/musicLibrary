'use strict';

const readdirp = require('readdirp');
const audioMetaData = require('audio-metadata');
const fs = require('fs');
const _ = require('lodash');
const async = require('async');
const path = require('path');

const rootPath = 'E:/TestMusicAPI'
let previousEvent;

console.log(`Let's get started !`);

async.series({
  allSongs: cb => getSongsFromRepo(rootPath, cb)
},
 (err, {allSongs}) => {
  if(err) throw new Error('Error while reading the stupid repo.');

  console.log('All songs at the beginning : ', allSongs);

  fs.watch(rootPath, {recursive: true}, (event, filePath) => {
    if(event !== 'rename') return;
    const fileName = _.last(filePath.split('\\'));
    let song;

    allSongs.forEach(songToFind => {
      if (songToFind.name === fileName) {
        song = songToFind;
      }
    });

    if(song) {
      _.pull(allSongs, song);
      console.log(`Removed song: `, song.name);
      console.log('All songs now :', allSongs);
    } else {
      getSongsFromRepo(path.join(rootPath, filePath), (err, songs) => {
        console.log('Added song : ', songs);
        console.log('All songs are now :', allSongs);
        Array.prototype.push.apply(allSongs, songs);
      })
    }
  })
});



function getSongsFromRepo(path, cb) {
  const allFiles = [];
  const settings = {
    root: path,
    fileFilter: ['*.mp3','*.opus','*.ogg','*.wav','*.aac','*.m4a','*.mp4','*.webm','*.flac']
  };

  readdirp(settings)
  .on('data', file => allFiles.push(file))
  .on('end', () => {
    const songsInRep = allFiles.map(file => {
      let fileDatas = fs.readFileSync(file.fullPath);
      let song = audioMetaData.id3v2(fileDatas);
      if(song === null) song = audioMetaData.id3v1(fileDatas);
      if(song === null) song = audioMetaData.ogg(fileDatas);
      if(song === null) return;
      song.path = file.fullPath;
      song.name = file.name;
      return song;
    });
    cb(null, songsInRep);
  });
}