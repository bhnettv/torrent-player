export const NO_TORRENTS_SEARCH_RPOVIDERS = {
    'animeVost': 'AnimeVost',
    'anidub': 'AniDub',
    'kinokrad': 'Kinokrad',
    'kinogo': 'Kinogo',
    'hdrezka': 'HDRezka'
}

export const SEARCH_RPOVIDERS = {
    'rutor': 'RuTor',
    // 'rutracker-movies': 'RuTracker Movies',
    // 'rutracker-tv-shows': 'RuTracker TV Shows',
    // 'rutracker-cartoons': 'RuTracker Cartoons',
    // 'rutracker-anime': 'RuTracker Anime',
    'x1337x-movies': 'x1337x Movies',
    'x1337x-tv-shows': 'x1337x TV Shows',
    'x1337x-anime': 'x1337x Anime',
    'fastTorrent-movies': 'FastTorrent Movies',
    'fastTorrent-tv-shows': 'FastTorrent TV Shows',
    'fastTorrent-cartoons': 'FastTorrent Cartoons',
    'nnm-movies': 'NNMClub Movies',
    'nnm-cartoons': 'NNMClub Cartoons',
    'nnm-tv-shows': 'NNMClub TV Shows',
    'nnm-anime': 'NNMClub Anime',
    'limetorrents-movies': 'LimeTorrents Movies',
    'limetorrents-tv-shows': 'LimeTorrents TV Shows',
    'limetorrents-anime': 'LimeTorrents Anime',
    ...NO_TORRENTS_SEARCH_RPOVIDERS
}

export const DEFUALT_SEARCH_PROVIDERS = [
    'hdrezka', 'kinogo', 'animeVost'
]

export const NO_TORRENTS_SEARCH_RPVODERS_PRESET = [
    {
        name: 'Anime Hostings',
        providers: ['animeVost', 'anidub']
    },
    {
        name: 'Video Hostings',
        providers: ['hdrezka', 'kinogo']
    }
]

export const SEARCH_RPVODERS_PRESET = [
    {
        name: 'Torrents',
        presets: [
            {
                name: 'Movies',
                providers: [
                    'x1337x-movies',
                    'limetorrents-movies',
                    'rutracker-movies',
                    'nnm-movies',
                    'fastTorrent-movies',
                    'rutor'
                ]
            },
            {
                name: 'TV Shows',
                providers: [
                    'x1337x-tv-shows',
                    'limetorrents-tv-shows',
                    'rutracker-tv-shows',
                    'nnm-tv-shows',
                    'fastTorrent-tv-shows',
                    'rutor'
                ]
            },
            {
                name: 'Cartoons',
                providers: [
                    'rutracker-cartoons',
                    'fastTorrent-cartoons',
                    'nnm-cartoons',
                    'rutor'
                ]
            },
            {
                name: 'Anime',
                providers: [
                    'x1337x-anime',
                    'limetorrents-anime',
                    'rutracker-anime',
                    'nnm-anime',
                    'fastTorrent-cartoons',
                    'rutor'
                ]
            }
        ]
    },
    ...NO_TORRENTS_SEARCH_RPVODERS_PRESET
]

export const SEARCH_HISTORY_MAX_SIZE = 100

export const ALLOWED_REMOTE_STATE_FIELDS = [
    'playlist',
    'marks',
    'currentFileIndex',
    'currentTime',
    'duration',
    'buffered',
    'isPlaying',
    'isLoading',
    'error',
    'volume',
    'isMuted',
    'audioTracks',
    'audioTrack',
]

export const END_FILE_TIME_OFFSET = 60