(function () {
    'use strict';

    window.addEventListener('message', function (event) {
        if (event.source !== window.parent || event.data?.type !== 'auto-furigana:pause-video-and-get-info') {
            return;
        }

        const video = document.querySelector('#player .video-stream.html5-main-video');
        if (video && !video.paused) {
            video.pause();
        }

        const videoInfo = video ? {
            currentTime: video.currentTime,
            duration: video.duration,
            paused: video.paused,
            ended: video.ended,
            readyState: video.readyState
        } : null;

        event.source.postMessage({
            type: 'auto-furigana:video-info',
            requestId: event.data.requestId,
            video: videoInfo
        }, event.origin);
    });
})();