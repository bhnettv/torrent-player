const crawler = require('../../utils/crawler')
const parseTorrent = require('parse-torrent')
const superagent = require('superagent')
const { PROVIDERS_CONFIG } = require('../../config')

class Provider {
    constructor(name, config) {
        this.name = name
        this.config = Object.assign(
            {
                baseUrl: PROVIDERS_CONFIG[name].baseUrl,
                searchUrl: PROVIDERS_CONFIG[name].searchUrl,
                pageSize: 50,
                scope: '',
                slectors: {},
                pagenatorSelector: '',
                headers: {
                    'User-Agent': 'Mozilla/5.0 Gecko/20100101 Firefox/59.0'
                },
                detailsScope: 'body',
                useProxy: false
            },
            config
        )

        this.config.detailsSelectors = Object.assign(
            {
                magnetUrl: {
                    selector: 'a[href*="magnet:?xt=urn:btih:"]',
                    transform: ($el) => $el.attr('href')
                }
            },
            this.config.detailsSelectors
        )
    }

    async search(query, page, pageCount) {
        if (page < 1) page = 1
        if (pageCount < 1) pageCount = 1

        const name = this.getName()
        const {
            scope,
            selectors,
            pagenatorSelector,
            headers,
            pageSize,
            useProxy
        } = this.config

        const limit = pageCount * pageSize

        let results = await crawler
            .get(
                this.getSearchUrl(query, page),
                this._crawlerSearchRequestGenerator(query, page),
                useProxy
            )
            .headers(headers)
            .scope(scope)
            .set(selectors)
            .paginate(pagenatorSelector)
            .limit(limit)
            .gather()

        results = await this._postProcessResult(results)

        return results
            .filter((item) => item.id)
            .map((item) => {
                item.provider = name
                return item
            })
    }

    async getInfo(resultsId) {
        const { detailsScope, detailsSelectors, headers, useProxy } = this.config

        let details = await crawler
            .get(this.getInfoUrl(resultsId), null, useProxy)
            .limit(1)
            .headers(headers)
            .scope(detailsScope)
            .set(detailsSelectors)
            .gather()

        details = details[0]
        details = await this._postProcessResultDetails(details, resultsId)
        details = {
            ...details,
            provider: this.getName(),
            type: this.getType()
        }

        return this._loadTorrentFileInfo(details)
    }

    // eslint-disable-next-line no-unused-vars
    getSearchUrl(query, page) {
        throw new Error('Provider not implement _getSearchUrl()')
    }

    // eslint-disable-next-line no-unused-vars
    getInfoUrl(resultsId) {
        throw new Error('Provider not implement getInfoUrl()')
    }

    getName() {
        const { subtype } = this.config
        return `${this.name}${subtype ? '-' + subtype : ''}`
    }

    getType() {
        return 'torrent'
    }

    async _postProcessResult(results) {
        results.forEach((result) => {
            result.infoUrl = this.getInfoUrl(result.id)
            if (result.seeds) result.seeds = parseInt(result.seeds)
            if (result.leechs) result.leechs = parseInt(result.leechs)
        })
        return results
    }

    async _postProcessResultDetails(details) {
        return details
    }

    _crawlerSearchRequestGenerator(query, page) { } // eslint-disable-line

    async  _loadTorrentFileInfo(details) {
        if (details.torrentUrl) {
            const parsedTorrent = await this.loadTorentFile(details.torrentUrl)
            return {
                ...details,
                files: this._extractFilesFromParsedTorrent(parsedTorrent)
            }
        } else {
            return details
        }
    }

    _extractFilesFromParsedTorrent(parsedTorrent) {
        return parsedTorrent.files
            .map((file, fileIndex) => {
                const lastSeparator = file.path.lastIndexOf('/')
                const path = lastSeparator > -1 ? file.path.substring(0, lastSeparator) : ''

                return {
                    path,
                    name: file.name,
                    id: fileIndex,
                    length: file.length
                }
            })
            .sort((f1, f2) => f1.name.localeCompare(f2.name))
    }

    loadTorentFile(torrentUrl) {
        return superagent
            .get(torrentUrl)
            .set(this.config.headers)
            .parse(superagent.parse.image)
            .buffer(true)
            .then((res) => parseTorrent(res.body))
    }
}

module.exports = Provider
