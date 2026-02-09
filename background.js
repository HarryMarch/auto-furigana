function setIcon(active) {
    chrome.action.setIcon({path: active ? 'icon.png' : 'icon-inactive.png'});
}

chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.sendMessage(
        activeInfo.tabId,
        {type: 'is-actual-enabled'},
        function (val) {
            setIcon(val);
        }
    );
});

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (!message) {
        return;
    }
    switch (message.type) {
        case 'current-tab-state-change':
            setIcon(message.content);
            break;
        case 'fetch-json':
            fetch(message.content).then(res => res.json().then(sendResponse));
            return true;
    }
});

// Load pitch accent cache from file
function loadPitchAccentCache() {
    const cache = {};

    const loadFile = (relativePath) =>
        fetch(chrome.runtime.getURL(relativePath))
            .then(res => res.text())
            .then(text => {
                const lines = text.split('\n');
                lines.forEach(line => {
                    line = line.trim();
                    if (line) {
                        const [word, accent] = line.split(';');
                        if (word && accent) {
                            cache[word] = accent;
                        }
                    }
                });
            });

    Promise.all([
        loadFile('data/pitch_accent.txt'),
        loadFile('data/pitch_accent_additional.txt')
    ])
        .then(() => {
            chrome.storage.local.set({ pitchAccentCache: cache }, () => {
                console.log(`Loaded ${Object.keys(cache).length} pitch accent entries into cache`);
            });
        })
        .catch(err => console.error('Failed to load pitch accent cache:', err));
}

// Load kanji cache from file
function loadKanjiCache() {
    fetch(chrome.runtime.getURL('data/kanji.txt'))
        .then(res => res.text())
        .then(text => {
            const cache = {};
            const lines = text.split('\n');
            
            lines.forEach(line => {
                line = line.trim();
                if (line) {
                    const [kanji, meaning] = line.split(';');
                    if (kanji && meaning) {
                        cache[kanji] = meaning;
                    }
                }
            });
            
            chrome.storage.local.set({ kanjiCache: cache }, () => {
                console.log(`Loaded ${Object.keys(cache).length} kanji entries into cache`);
            });
        })
        .catch(err => console.error('Failed to load kanji cache:', err));
}

// Run once on extension install
chrome.runtime.onInstalled.addListener(function (details) {
    console.log('onInstalled details:', details);
    if (details.reason === 'install') {
        console.log('Extension installed. Performing initial setup...');

        // Load pitch accent data into cache
        loadPitchAccentCache();

        // Load kanji data into cache
        loadKanjiCache();

        // Set default values in storage
        chrome.storage.local.set({
            extensionInstalled: true,
            installDate: new Date().toISOString()
        });

        // Example: Open welcome/options page (uncomment to use)
        // chrome.tabs.create({url: 'popup.html'});
    }
});