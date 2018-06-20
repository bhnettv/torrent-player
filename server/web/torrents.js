const express = require('express')
const fs = require('fs')
const path = require('path')
const torrentsService = require('../service/torrents')
const transcodeService = require('../service/transcode')
const ResponseError = require('../utils/ResponseError')
const { isVideo, parseRange, formatDLNADuration } = require('../utils')
const mimeLookup = require('mime-types').lookup
const { pick } = require('lodash')
const { TORRENTS_DIR } = require('../config')

const router = express.Router()

router.get('/', (req, res) => {
    res.json(torrentsService.getTorrents().map(mapTorrent))
})

router.post('/', (req, res, next) => {
    if (!req.body.magnetUrl)
        throw new ResponseError('magnetUrl reuired')

    torrentsService.addTorrent(req.body.magnetUrl)
        .then((torrent) => res.json(mapTorrent(torrent)))
        .catch(next)
})

router.get('/:id', (req, res) => {
    res.json(mapTorrent(torrentsService.getTorrent(req.params.id)))
})

router.delete('/:id', (req, res, next) => {
    torrentsService
        .removeTorrent(req.params.id)
        .then(() => res.json({ status: 'OK' }))
        .catch(next)
})

router.get('/:torrentId/files/:fileId', (req, res) => {
    const { file } = getTorrentAndFile(req)
    writeFileRange(file, req, res)
})

router.get('/:torrentId/files/:fileId/transcoded', (req, res, next) => {
    const { torrent, file } = getTorrentAndFile(req)
    const { clientId } = req.query

    if (!clientId) throw new ResponseError('clientId required', 404)
    if (!isVideo(file.path)) throw new ResponseError('Not video file', 404)

    let start = 0, duration = 0
    const dlnaTimeSeek = req.header('TimeSeekRange.dlna.org')

    if (dlnaTimeSeek) {
        const ranges = parseRange(dlnaTimeSeek)
        start = ranges[0].start
    } else if (req.query.start) {
        start = parseInt(req.query.start)
    }

    if (req.query.duration) {
        duration = parseInt(req.query.duration)
    }

    if (isNaN(start)) start = 0
    if (isNaN(duration)) duration = 0

    const transcoder = transcodeService.getTranscoder(clientId)
    transcoder
        .transcode(torrent, file, start, duration)
        .then(({ buffer, metadata: { format } }) => {
            const duration = formatDLNADuration(format.duration)
            const startTime = formatDLNADuration(start)
            const headers = {
                'Content-Type': 'video/mpegts',
                'TransferMode.dlna.org': 'Streaming',
                'TimeSeekRange.dlna.org': 'npt=' + startTime + '-' + duration + '/' + duration,
                'X-Seek-Range': 'npt=' + startTime + '-' + duration + '/' + duration
            }

            res.writeHead(200, headers)
            res.once('finish', () => transcoder.notifyIdle())

            // Write the headers to the socket
            //res.socket.write(res._header)
            // Mark the headers as sent
            //res._headerSent = true

            buffer.readStream().pipe(res)
        })
        .catch(next)
})

router.get('/:torrentId/files/:fileId/hls', (req, res, next) => {
    const { torrent, fileId } = getTorrentAndFile(req)

    transcodeService.getHLSTranscoder(torrent, fileId)
        .transcode(req.query.hasOwnProperty('force'))
        .then((transcoder) =>
            transcoder.readM3U8()
        )
        .then((file) => {
            res.set('Content-Type', 'application/x-mpegURL')
            res.end(file)
        })
        .catch(next)
})

router.get('/:torrentId/files/:fileId/hls/:segment', (req, res) => {
    const { torrent, fileId } = getTorrentAndFile(req)

    const transcoder = transcodeService.getHLSTranscoder(torrent, fileId)

    res.set('Content-Type', 'video/mp2ts')

    transcoder.getSegment(req.params.segment).pipe(res)
})

function getTorrentAndFile(req) {
    const { torrentId, fileId } = req.params

    const torrent = torrentsService.getTorrent(torrentId)
    if (!torrent) throw new ResponseError('Torrent not found', 404)

    const file = torrent.files[fileId]
    if (!file) throw new ResponseError('File not found', 404)

    return { torrentId, torrent, fileId, file }
}

function writeFileRange(file, req, res) {
    // indicate this resource can be partially requested
    res.set('Accept-Ranges', 'bytes')
    res.set('Content-Type', mimeLookup(file.name))
    // if this is a partial request

    var ranges = req.range(file.length)

    if(ranges === -1)
        throw new ResponseError('Malformed range', 400)

    if(ranges === -2)
        throw new ResponseError('Unsatisfiable ranges', 416)

    if (ranges && ranges.type === 'bytes') {
        // parse ranges
        
        if (ranges.length > 1) {
            throw new ResponseError('Multiple ranges not supported', 416)
        }

        var start = ranges[0].start
        var end = ranges[0].end

        res.writeHead(206, {
            'Content-Length' : (end - start) + 1,
            'Content-Range': 'bytes ' + start + '-' + end + '/' + file.length,
        })

        // slicing the stream to partial content
        createFileStream(file, { start, end }).pipe(res)
    } else {
        res.set('Content-Length', file.length)
        createFileStream(file).pipe(res)
    }
}

function createFileStream(file, opts) {
    if(file.progress >= 1) {
        return fs.createReadStream(path.join(TORRENTS_DIR, file.path), opts)
    }
    return file.createReadStream(opts)
}
 
function mapTorrent(torrent) {
    const filterdTorrent = pick(torrent, [
        'infoHash',
        'name',
        'timeRemaining',
        'received',
        'downloaded',
        'uploaded',
        'downloadSpeed',
        'uploadSpeed',
        'ratio',
        'numPeers',
        'path',
        'files'
    ])

    const filtredFiles = filterdTorrent.files
        .map((file) => pick(file, [
            'name',
            'path',
            'length',
            'downloaded',
            'progress'
        ]))

    filtredFiles.forEach((file) => {
        file.mimeType = mimeLookup(file.name)
    })

    filterdTorrent.files = filtredFiles

    return filterdTorrent
}

module.exports = router