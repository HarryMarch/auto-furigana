(function () {
    'use strict';

    const resumeButton = document.createElement('button');
    resumeButton.type = 'button';
    resumeButton.textContent = '▶';
    resumeButton.setAttribute('aria-label', 'Resume video');
    resumeButton.title = 'Resume video';
    Object.assign(resumeButton.style, {
        position: 'fixed',
        top: '72%',
        left: '2px',
        zIndex: '2147483647',
        width: '60px',
        height: '60px',
        padding: '0',
        border: '0',
        borderRadius: '0',
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#fff',
        font: '14px sans-serif',
        cursor: 'pointer'
    });
    resumeButton.addEventListener('click', function (event) {
        event.stopPropagation();
        const video = document.querySelector('#player .video-stream.html5-main-video');
        if (video) {
            video.play().catch(function () {});
        }
    });
    document.body.appendChild(resumeButton);

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