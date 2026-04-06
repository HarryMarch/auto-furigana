function setIcon(active) {
    chrome.action.setIcon({ path: active ? 'icon.png' : 'icon-inactive.png' });
}

const RANDOM_KANJI_ALARM = 'random-kanji-notification';
const notificationLinks = {};

chrome.tabs.onActivated.addListener(function (activeInfo) {
    chrome.tabs.sendMessage(
        activeInfo.tabId,
        { type: 'is-actual-enabled' },
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

    loadFile('data/pitch_accent.txt')
        .then(() => loadFile('data/pitch_accent_additional.txt'))
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

const memoryCache = {}; // in-memory cache

async function fetchJisho(kanji) {
    if (memoryCache[kanji]) {
        return memoryCache[kanji];
    }
    const url = `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(kanji)}`;

    try {
        const res = await fetch(url);
        const json = await res.json();

        const results = [];

        json.data.forEach(entry => {
            [entry.japanese[0] || { word: '' }].forEach(jp => {
                const word = jp.word;
                const reading = jp.reading;

                // ✅ Filter: must have word and exactly 2 kanji chars
                if (word && isTwoKanji(word) && word.includes(kanji)) {
                    // const definition = entry.senses[0]?.english_definitions?.join("; ") || "";
                    // results.push(`${word}[${reading}]`);
                    results.push(word);
                }
            });
        });

        const definitions = results.length ? results.join(", ") : "";
        memoryCache[kanji] = definitions;
        return definitions;
    } catch (err) {
        console.error(err);
    }
};

// 🔍 Helper: check exactly 2 kanji
function isTwoKanji(word) {
    const kanjiRegex = /[\u4E00-\u9FFF]/g;
    const matches = word.match(kanjiRegex);
    return matches && matches.length === 2 && word.length === 2;
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

        fetchJisho(kanji).then(definitions => {
            const message = `${meaning}`;
            chrome.notifications.create(notificationId, {
                type: 'basic',
                iconUrl: 'icon.png',
                title: definitions ? `${kanji}: ${definitions}` : kanji,
                message: message
            });
        });
    });
}

function openUrlFromNotification(targetUrl) {
    // Primary: open the target URL in a new tab. If that fails (for example
    // due to platform restrictions), attempt an Android intent:// fallback to
    // surface app choices. Log errors if both attempts fail.
    try {
        chrome.tabs.create({ url: targetUrl }, function (tab) {
            if (!chrome.runtime.lastError) {
                return; // opened successfully
            }

            // If creating a normal tab failed, try intent:// fallback for Android
            console.warn('Opening normal tab failed, attempting intent fallback:', chrome.runtime.lastError.message);
            try {
                const stripped = targetUrl.replace(/^https?:\/\//i, '');
                const intentUrl = `intent://${stripped}#Intent;scheme=https;action=android.intent.action.VIEW;end`;
                chrome.tabs.create({ url: intentUrl }, function (intentTab) {
                    if (chrome.runtime.lastError) {
                        console.error('Intent fallback failed:', chrome.runtime.lastError.message);
                        // final fallback: try opening the target URL again (best-effort)
                        chrome.tabs.create({ url: targetUrl }, function () {
                            if (chrome.runtime.lastError) {
                                console.error('Final fallback failed:', chrome.runtime.lastError.message);
                            }
                        });
                    }
                });
            } catch (intentErr) {
                console.error('Error constructing intent URL:', intentErr && intentErr.message);
            }
        });
    } catch (err) {
        console.error('Error opening tab:', err && err.message);
        // As a last resort try intent fallback
        try {
            const stripped = targetUrl.replace(/^https?:\/\//i, '');
            const intentUrl = `intent://${stripped}#Intent;scheme=https;action=android.intent.action.VIEW;end`;
            chrome.tabs.create({ url: intentUrl }, function () {
                if (chrome.runtime.lastError) {
                    console.error('Intent fallback failed in catch:', chrome.runtime.lastError.message);
                }
            });
        } catch (intentErr) {
            console.error('Error constructing intent URL in catch:', intentErr && intentErr.message);
        }
    }
}

function onClickListener(notificationId) {
    const targetUrl = notificationLinks[notificationId];
    if (targetUrl) {
        openUrlFromNotification(targetUrl);
        chrome.notifications.clear(notificationId);
        delete notificationLinks[notificationId];
    }
}

chrome.notifications.onClicked.addListener(onClickListener);
chrome.notifications.onButtonClicked.addListener(onClickListener);

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