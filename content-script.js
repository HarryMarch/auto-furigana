(function () {
    'use strict';

    let enableInsertRomaji = true;
    let pitchAccentCache = {};
    let kanjiCache = {};

    const excludeTags = new Set(['ruby', 'rt', 'script', 'select', 'option', 'textarea']);
    const WHITE_LISTED_KANJI = new Set(['学校', '学生', '先生', '勉強', '日本', '英語',
        '国語', '数学', '大学', '留学', '友達', '友達', '名前', '外国', '男子', '女子',
        '大人', '子供', '会社', '社員', '今日', '明日', '昨日', '毎日', '毎週', '今週',
        '来週', '午前', '午後', '時間', '日本', '東京', '学校', '駅前', '空港', '病院',
        '銀行', '郵便', '公園', '本屋', '食事', '飲物', '牛肉', '豚肉', '鳥肉', '野菜',
        '果物', '水道', '料理', '朝食', '勉強', '運動', '旅行', '電話', '買物', '散歩',
        '仕事', '結婚', '休憩', '練習', '元気', '有名', '簡単', '大切', '上手', '下手', '便利', '不便', '電車', '自動', '車道', '空港', '道路', '交通', '乗車', '下車', '運転', '駐車', '天気', '電気', '人気', '元日', '毎年', '来年', '去年', '部屋', '家事', '住所', '電話', '写真', '映画', '音楽', '雑誌', '新聞', '地図', '問題', '意味', '研究', '試験', '宿題', '授業', '卒業', '入学', '退学', '就職', '転職', '失業',
        '経験', '意見', '約束', '関係', '理由', '性格', '習慣', '感情', '自由', '平和',
        '最近', '最初', '最後', '途中', '以上', '以下', '以前', '以後', '当時', '将来',
        '場所', '住所', '近所', '郊外', '都会', '田舎', '景色', '自然', '環境', '地域',
        '準備', '説明', '連絡', '相談', '利用', '案内', '予約', '参加', '運転', '注意',
        '必要', '大事', '安全', '危険', '便利', '不便', '簡単', '複雑', '有名', '特別',
        '交通', '事故', '運賃', '到着', '出発', '遅刻', '早退', '渋滞', '駐車', '移動',
        '生活', '食事', '掃除', '洗濯', '買物', '料理', '家事', '留守', '留学', '帰国',
        '意味', '理解', '可能', '絶対', '原因', '結果', '方法', '目的', '計画', '決定',
        '新聞', '記事', '放送', '番組', '連続', '中止', '変更', '発表', '会議', '予定',
        '無理', '十分', '普通', '特に', '全然', '必ず', '多分', '一度', '二度', '一緒',
        '今回', '次回', '前回', '確認', '判断', '解決', '説明', '理解', '関心', '印象',
        '状況', '原因', '結果', '目的', '方法', '計画', '相談', '注意', '確認', '経験',
        '自分', '結構', '本当', '一応', '全部', '女性', '男性', '言葉', '合格', '人間',
        '場合', '綺麗', '高校', '一番', '家族', '基本', '秘密', '動画', '会話', '相手', '紹介', '重要', '失敗', '部分', '成功',
        '世界', '漢字', '緊張', '存在', '彼女', '中国', '韓国', '試合', '温泉', '面接', '心配',
        '警察', '突然', '母親', '父親', '笑顔', '荷物', '風邪', '個人', '先輩', '社長', '挨拶', '野球', 
        '是非', '店員', '態度', '興味', '息子', '恋人', '情報', '恋愛', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);

    // ============== observe ==============
    let domChanged = false;
    const observer = new MutationObserver(mutations => {
        if (!enableInsertRomaji) {
            return;
        }
        if (domChanged) {
            return;
        }
        for (let mutation of mutations) {
            for (let node of mutation.addedNodes) {
                if (excludeTags.has(node.nodeName.toLowerCase())) {
                    continue;
                }
                const parent = node.parentNode;
                if (parent) {
                    if (excludeTags.has(parent.nodeName.toLowerCase())) {
                        continue;
                    }
                    if (parent.classList && parent.classList.contains('chrome-ext-furigana-translation')) {
                        continue;
                    }
                }

                domChanged = true;
                setTimeout(function () {
                    if (!domChanged) {
                        return;
                    }
                    try {
                        scanDocument();
                    } finally {
                        domChanged = false;
                    }
                }, 100);
                return;
            }
        }
    });

    // ============== kuromoji ==============
    const tokenizerPromise = new Promise(function (resolve, reject) {
        kuromoji
            .builder({ dicPath: chrome.runtime.getURL("kuromoji/dict/") })
            .build(function (err, tokenizer) {
                if (tokenizer) {
                    resolve(tokenizer);
                } else {
                    reject(err);
                }
            });
    });
    let tokenizer = null;

    // ============== init ==============
    async function init() {
        const configs = await new Promise(function (resolve) {
            chrome.storage.sync.get(resolve);
        });

        // Load pitch accent cache (merge additional cache if present)
        const storageData = await new Promise(function (resolve) {
            chrome.storage.local.get(['pitchAccentCache', 'pitchAccentCacheAdditional', 'kanjiCache', 'kanjiCacheAdditional'], resolve);
        });
        pitchAccentCache = Object.assign({}, storageData.pitchAccentCache || {}, storageData.pitchAccentCacheAdditional || {});
        kanjiCache = Object.assign({}, storageData.kanjiCache || {}, storageData.kanjiCacheAdditional || {});

        const globalDisabled = configs['globalDisabled'] || false;
        const disabledDomains = configs['disabledDomains'] || [];
        tokenizer = await tokenizerPromise;
        enableInsertRomaji = !(globalDisabled || disabledDomains.includes(location.host) || window.location.hostname.includes('github.com'));
        chrome.runtime.sendMessage({ type: 'current-tab-state-change', content: enableInsertRomaji });
        observer.observe(document, { childList: true, subtree: true });
        const style = document.createElement('style');
        style.textContent = `
            .toast-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }

            .toast {
                min-width: 220px;
                max-width: 420px;
                padding: 12px 16px;
                border-radius: 8px;
                color: #fff;
                font-size: 40px;
                line-height: 1.4;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);

                opacity: 0;
                transform: translateY(-10px);
                animation: toast-in 0.25s ease forwards;
            }

            .toast.success { background: #4caf50; }
            .toast.error   { background: #f44336; }
            .toast.info    { background: #2196f3; }

            .toast.hide {
                animation: toast-out 0.25s ease forwards;
            }

            @keyframes toast-in {
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes toast-out {
                to {
                    opacity: 0;
                    transform: translateY(-10px);
                }
            }
            
            div.lln-vertical-view-sub.lln-sentence-wrap.lln-with-play-btn.odd.lln-bigger-item-font.in-scroll.active {
                background-color: yellowgreen !important;
            }

            div.bg-df.box-footer.ng-star-inserted {
                display: none !important;
            }

            [class^="css-"][class*="--DivOverlayBottomContent"] > div > div {
                position: absolute !important;
                top: 2% !important;
                left: 5% !important;
                z-index: 9999 !important;
            }

            [class^="css-"][class*="--DivVideoControlTop"] > div > div {
                position: absolute !important;
                z-index: 9999 !important;
                margin-top: -650px;
                width: 100%;
            }

            [class^="css-"][class*="--DivSecondPartyTagsContainer"], [class^="css-"][class*="--DivMultilineTextContainer"] {
                display: none !important;
            }

            [class^="css-"][class*="--DivVideoClosedCaption"] > ruby {
                font-size: 1rem !important;
                color: beige;
            }

            [class^="css-"][class*="--DivVideoClosedCaption"] > ruby > rt {
                font-size: 3rem !important;
            }

            [class^="css-"][class*="--DivMediaCardOverlay"] {
                flex-direction: row-reverse !important;
            }

            [class^="css-"][class*="--DivMediaCardOverlayTop"] {
                flex-direction: column !important;
            }

            [class^="css-"][class*="--DivMediaCardOverlayBottom"] {
                width: 100% !important;
            }

            ytd-transcript-segment-renderer.active .segment.ytd-transcript-segment-renderer {
                background-color: yellowgreen !important;
                font-size: 25px !important;
                line-height: 45px !important;
            }

            .segment.ytd-transcript-segment-renderer {
                font-size: 20px !important;
                line-height: 36px !important;
            }

            .lln-word[data-word-key$=ja] {
                font-size: 3rem;
                line-height: 4.5rem;
            }
        `;
        document.head.appendChild(style);
        if (window.location.hostname.includes("tiktok.com")) {
            const url = new URL(window.location.href);
            if (url.searchParams.get("lang") !== "ja") {
                url.searchParams.set("lang", "ja");
                window.location.replace(url.toString()); // reload with ?lang=ja
            }
        }

        // Define toast container element
        let container = document.getElementById("toast-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "toast-container";
            container.className = "toast-container";

            document.body.appendChild(container);
        }
        // 
        if (enableInsertRomaji) {
            scanDocument();
        }
    }

    init();

    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (!message) {
            return;
        }
        switch (message.type) {
            case 'set-enabled': {
                if (enableInsertRomaji !== message.content) {
                    enableInsertRomaji = message.content;
                    chrome.runtime.sendMessage({ type: 'current-tab-state-change', content: enableInsertRomaji });
                    if (enableInsertRomaji) {
                        scanDocument();
                    } else {
                        deleteRubies();
                    }
                }
            }
                break;
            case 'is-enabled-on-tab': {
                sendResponse(enableInsertRomaji);
            }
                break;
            case 'is-actual-enabled': {
                sendResponse(enableInsertRomaji);
            }
                break;
        }
    });

    function deleteRubies() {
        const excludeTags = new Set(['script', 'select', 'textarea']);

        function scanRubyNodes(node) {
            if (excludeTags.has(node.nodeName.toLowerCase())) {
                return;
            }
            if (node.nodeName.toLowerCase() === 'ruby') {
                if (node.classList.contains('chrome-ext-furigana')) {
                    const parent = node.parentNode;
                    const textNode = Array.from(node.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
                    if (textNode) {
                        parent.replaceChild(textNode, node);
                    }
                }
                return;
            }
            if (node.hasChildNodes()) {
                node.childNodes.forEach(scanRubyNodes);
            }
        }

        scanRubyNodes(document.body);
    }

    // ============== japanese regexp ==============
    const kanaRegexp = /[ぁ-んァ-ン]/;
    const kanjiRegexp = /[\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u3005\u3007\u3021-\u3029\u3038-\u303B\u3400-\u4DB5\u4E00-\u9FCC\uF900-\uFA6D\uFA70-\uFAD9]/;

    function includesKana(text) {
        return kanaRegexp.test(text);
    }

    function includesKanji(text) {
        return kanjiRegexp.test(text);
    }

    function isKatakana(word) {
        return /^[\u30A0-\u30FF]+$/.test(word);
    }

    function isTwoKanji(word) {
        const kanjiRegex = /[\u4E00-\u9FFF]/g;
        const matches = word.match(kanjiRegex);
        return matches && matches.length === 2 && word.length === 2;
    }

    const toastQueue = [];
    let isProcessing = false;

    // Track active (visible) toasts
    const activeToasts = new Set();

    function showToast(message, type = "info", duration = 2500) {
        const container = document.getElementById("toast-container");
        if (!container) {
            return;
        }
        const key = `${type}|${message}`;

        // ❌ Skip if already queued
        const existsInQueue = toastQueue.some(t => `${t.type}|${t.message}` === key);

        // ❌ Skip if already visible
        if (existsInQueue || activeToasts.has(key)) {
            return;
        }

        toastQueue.push({ message, type, duration, key });
        processQueue();
    }

    function processQueue() {
        if (isProcessing) return;
        if (toastQueue.length === 0) return;

        isProcessing = true;

        const { message, type, duration, key } = toastQueue.shift();
        const container = document.getElementById("toast-container");

        const toast = document.createElement("div");
        toast.className = `toast ${type}`;
        toast.innerHTML = message;

        container.appendChild(toast);

        // Mark as active
        activeToasts.add(key);

        // Lifetime (FIFO behavior preserved)
        setTimeout(() => {
            toast.classList.add("hide");

            setTimeout(() => {
                toast.remove();
                activeToasts.delete(key); // ✅ allow future duplicates again
            }, 250);
        }, duration);

        isProcessing = false;
        processQueue();
    }

    function includesJapanese(text) {
        return includesKana(text) || includesKanji(text);
    }

    function addJapaneseTokenToStorage(accent) {
        chrome.storage.local.get(['japaneseToken'], function (result) {
            const japaneseToken = typeof result.japaneseToken === 'string' ? result.japaneseToken : '';
            chrome.storage.local.set({ japaneseToken: japaneseToken + accent + ';' });
        });
    }

    // ============== check is page chinese ==============
    let isPageChinese = false;
    if (document.documentElement.lang.includes('zh')) {
        isPageChinese = true;
    } else {
        const pageText = document.body.innerText;
        const matchKana = pageText.match(/[ぁ-んァ-ン]/g);
        const kanaNum = matchKana ? matchKana.length : 0;
        const matchChinese = pageText.match(/[\u3400-\u4DBF\u4E00-\u9FEF\u20000-\u2EBFF]/g);
        const chineseNum = matchChinese ? matchChinese.length : 0;
        isPageChinese = chineseNum && (kanaNum / chineseNum < 0.02);
    }
    if (window.location.hostname.includes('youtube.com') || window.location.hostname.includes('tiktok.com')) {
        isPageChinese = false;
    }

    // ============== scan document ==============
    const captionClassNames = [
        'DivVideoClosedCaption',
        'ytp-caption-segment',
    ];
    function scanDocument() {
        const stack = [document.body];
        const textNodes = [];
        for (; ;) {
            const node = stack.shift();
            if (!node) {
                break;
            }
            if (node.classList && node.classList.contains('chrome-ext-furigana-translation')) {
                continue;
            }
            if (node.hasChildNodes()) {
                const childNodes = node.childNodes;
                for (let i = 0, len = childNodes.length; i < len; ++i) {
                    const child = childNodes.item(i);
                    if (!excludeTags.has(child.nodeName.toLowerCase())) {
                        stack.push(child);
                    }
                }
            } else if (node.nodeType === Node.TEXT_NODE) {
                textNodes.push(node);
            }
        }
        for (let i = 0, len = textNodes.length; i < len; ++i) {
            createRuby(textNodes[i]);
        }
    }

    // ============== create ruby ==============
    const specialCases = {
        'た': 'TA',
        'てる': 'TÊRƯ',
        'する': 'SƯRƯ',
        'れる': 'RÊRƯ',
        'ある': 'ARƯ',
        'できる': 'ĐỀKIRƯ',
        'さ': 'SA',
    }
    const specialCaseKeys = Object.keys(specialCases);
    async function createRuby(node) {
        const text = node.nodeValue;
        if (!(
            isPageChinese && includesKana(text) // prevent treating chinese as japanese kanji
            || !isPageChinese && includesJapanese(text)
        )) {
            return;
        }
        const tokens = tokenizer.tokenize(text);
        if (!tokens) {
            return;
        }
        if (!enableInsertRomaji) {
            return;
        }
        const parent = node.parentNode;
        if (!parent) {
            return;
        }
        for (let i = 0, len = tokens.length; i < len; ++i) {
            const token = tokens[i];
            const willShowToast = node.parentNode && node.parentNode.className && captionClassNames.some(cls => node.parentNode.className.includes(cls));
            if (willShowToast && isTwoKanji(token.surface_form) && !WHITE_LISTED_KANJI.has(token.surface_form)) {
                googleTranslate('ja', 'vi', token.surface_form).then((res) => {
                    const meaning = formatGoogleTranslateResult(res);
                    const pronunciation = token.pronunciation ? japanese.romanize(token.pronunciation).toLowerCase() : '';
                    if (meaning.toLowerCase() !== pronunciation) {
                        showToast(token.surface_form + '<br>' + meaning);
                    }
                });
            }
            // if (willShowToast && isKatakana(token.surface_form)) {
            //     googleTranslate('ja', 'en', token.surface_form).then((res) => {
            //         showToast(token.surface_form + '<br>' + formatGoogleTranslateResult(res));
            //     });
            // }

            let dom;
            if (includesKana(token.pronunciation) || includesJapanese(token.surface_form)) {
                dom = document.createElement('ruby');
                dom.classList.add('chrome-ext-furigana');
                dom.appendChild(document.createTextNode(token.surface_form));
                const rt = document.createElement('rt');
                if (pitchAccentCache[token.surface_form] && includesJapanese(pitchAccentCache[token.surface_form])) {
                    addJapaneseTokenToStorage(pitchAccentCache[token.surface_form]);
                }
                const nextWord = ((tokens[i + 1] || {}).surface_form || '');
                if ((specialCaseKeys.includes(token.surface_form) && (nextWord.startsWith('ん')) || nextWord.startsWith('っ')) || (token.surface_form === 'さ' && ['れ', 'せ', 'れる'].includes(nextWord))) {
                    rt.textContent = specialCases[token.surface_form];
                } else {
                    rt.textContent = pitchAccentCache[token.surface_form] || japanese.romanize(
                        includesKana(token.pronunciation) ? token.pronunciation : token.surface_form
                    );
                }
                dom.appendChild(rt);
            } else {
                dom = document.createTextNode(token.surface_form);
            }

            if (i === 0) {
                parent.replaceChild(dom, node);
            } else {
                node.after(dom);
            }
            node = dom;
        }
    }

    // ============== google translate ==============
    const googleTranslateCache = {};

    function googleTranslate(sLang, tLang, text) {
        text = (text || '').trim();
        const hash = `${tLang}/${text}`
        if (googleTranslateCache.hasOwnProperty(hash)) {
            return googleTranslateCache[hash];
        }
        return googleTranslateCache[hash] = new Promise(function (resolve) {
            const url = `https://clients5.google.com/translate_a/single?dj=1&dt=t&dt=sp&dt=ld&dt=bd&client=dict-chrome-ex&sl=${sLang}&tl=${tLang}&q=${encodeURIComponent(text)}`;
            chrome.runtime.sendMessage({ type: 'fetch-json', content: url }, function (json) {
                resolve(json);
            });
        });
    }

    function formatGoogleTranslateResult(res) {
        if (res.dict?.length) {
            return res.dict.map(item =>
                item.pos + ' ' + item.entry.map(item => item.word).join(', ')
            ).join('<br>');
        } else if (res.sentences?.length) {
            return res.sentences.map(item => item.trans).join(', `');
        } else {
            return undefined;
        }
    }

    // ============== translation ==============
    const translationDom = document.createElement('div');
    translationDom.classList.add('chrome-ext-furigana-translation');
    document.body.appendChild(translationDom);

    // ============== get mouseover ruby ==============
    let currHoverNode = null;
    document.addEventListener('mouseover', async function (e) {
        translationDom.classList.remove('show');
        let node = e.target;
        if (!node) {
            return;
        }
        if (node.nodeName.toLowerCase() === 'rt') {
            node = node.parentNode;
        }
        currHoverNode = node;
        if (node.nodeName.toLowerCase() === 'ruby'
            && node.classList.contains('chrome-ext-furigana')
        ) {
            const configs = await new Promise(function (resolve) {
                chrome.storage.sync.get(resolve);
            });
            if (configs['translationDisabled']) {
                return;
            }

            await new Promise(function (resolve) {
                setTimeout(resolve, 200);
            });

            if (currHoverNode !== node) {
                return;
            }
            const textNode = Array.from(node.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
            if (!textNode) {
                return;
            }
            const text = textNode.data || '';
            const res = await googleTranslate('ja', configs['targetLang'] || 'en', text);
            let kanjiInfo = '';
            text.split('').forEach(char => {
                if (kanjiCache[char]) {
                    kanjiInfo += char + ': ' + kanjiCache[char] + '<br>';
                }
            });
            if (formatGoogleTranslateResult(res)) {
                translationDom.innerHTML = (kanjiInfo ? kanjiInfo + '<br>' : '') + formatGoogleTranslateResult(res);
            } else {
                return;
            }

            const rect = node.getBoundingClientRect();
            translationDom.style.top = (rect.bottom + 2) + 'px';
            translationDom.style.left = rect.left + 'px';
            translationDom.classList.add('show');
        }
    });

    document.addEventListener('scroll', function () {
        translationDom.classList.remove('show');
    });
})();
