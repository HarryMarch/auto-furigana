function setIcon(active) {
    chrome.action.setIcon({path: active ? 'icon.png' : 'icon-inactive.png'});
}

const RANDOM_KANJI_ALARM = 'random-kanji-notification';
const notificationLinks = {};

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
                    // line = line.trim();
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

function showRandomKanjiNotification() {
    chrome.storage.local.get(['kanjiCache'], function (result) {
        const cache = result.kanjiCache || {};
        const kanjiList = Object.entries(cache);

        if (kanjiList.length === 0) {
            return;
        }

        const randomIndex = Math.floor(Math.random() * kanjiList.length);
        const [kanji, meaning] = kanjiList[randomIndex];
        const notificationId = `random-kanji-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        notificationLinks[notificationId] = `https://jisho.org/search/*${encodeURIComponent(kanji)}*`;

        chrome.notifications.create(notificationId, {
            type: 'basic',
            iconUrl: 'icon.png',
            title: 'Random Kanji',
            message: `${kanji}: ${meaning}`
        });
    });
}

function openUrlFromNotification(targetUrl) {
    chrome.windows.create({ url: targetUrl, focused: true, type: 'normal' }, function () {
        if (!chrome.runtime.lastError) {
            return;
        }

        console.error('Failed to open new window:', chrome.runtime.lastError.message);
        chrome.tabs.create({ url: targetUrl }, function () {
            if (chrome.runtime.lastError) {
                console.error('Fallback tab open failed:', chrome.runtime.lastError.message);
            }
        });
    });
}

chrome.notifications.onClicked.addListener(function (notificationId) {
    const targetUrl = notificationLinks[notificationId];
    if (targetUrl) {
        openUrlFromNotification(targetUrl);
        chrome.notifications.clear(notificationId);
        delete notificationLinks[notificationId];
    }
});

chrome.notifications.onClosed.addListener(function (notificationId) {
    delete notificationLinks[notificationId];
});

function setupRandomKanjiAlarm() {
    chrome.alarms.create(RANDOM_KANJI_ALARM, {
        delayInMinutes: 1,
        periodInMinutes: 5
    });
}

function clearAllExtensionNotifications() {
    chrome.notifications.getAll(function (notifications) {
        Object.keys(notifications).forEach(function (notificationId) {
            chrome.notifications.clear(notificationId);
        });
    });
}

function resetRandomKanjiNotifications() {
    chrome.alarms.clear(RANDOM_KANJI_ALARM, function () {
        setupRandomKanjiAlarm();
    });
}

chrome.alarms.onAlarm.addListener(function (alarm) {
    if (alarm.name === RANDOM_KANJI_ALARM) {
        const now = new Date();
        const hour = now.getHours();
        if (hour >= 6 && hour < 19) {
            showRandomKanjiNotification();
        }
    }
});

// Run once on extension install
chrome.runtime.onInstalled.addListener(function (details) {
    console.log('onInstalled details:', details);
    if (details.reason === 'install') {
        console.log('Extension installed. Performing initial setup...');

        // Load pitch accent data into cache
        loadPitchAccentCache();

        // Load kanji data into cache
        loadKanjiCache();

        // Start periodic random kanji notifications
        clearAllExtensionNotifications();
        resetRandomKanjiNotifications();

        // Set default values in storage
        chrome.storage.local.set({
            extensionInstalled: true,
            installDate: new Date().toISOString()
        });

        // Example: Open welcome/options page (uncomment to use)
        // chrome.tabs.create({url: 'popup.html'});
    } else if (details.reason === 'update') {
        clearAllExtensionNotifications();
        resetRandomKanjiNotifications();
    }
});

chrome.runtime.onStartup.addListener(function () {
    clearAllExtensionNotifications();
    resetRandomKanjiNotifications();
});