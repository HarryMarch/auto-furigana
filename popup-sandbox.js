Vue.createApp({
    template: document.getElementById('template').innerText,
    setup() {
        const enableOnAllPage = Vue.ref(false);
        const enableOnThisSite = Vue.ref(false);
        const siteDomain = Vue.ref('google.com');
        const enableOnThisTab = Vue.ref(false);
        const showTranslationOnMouseHover = Vue.ref(false);
        const targetLanguage = Vue.ref('en');
        const newWordInput = Vue.ref('');

        // ==========================================

        function postMessage(type, content) {
            window.parent.postMessage({ type, content }, "*");
        }

        window.addEventListener('message', function (e) {
            const message = e.data;
            if (!message) {
                return;
            }
            switch (message.type) {
                case 'domain': {
                    siteDomain.value = message.content;
                }
                    break;
                case 'state': {
                    const {
                        globalDisabled,
                        disabledDomains,
                        currentTabEnabled,
                        translationDisabled,
                        targetLang,
                    } = message.content;
                    enableOnAllPage.value = !globalDisabled;
                    enableOnThisSite.value = !disabledDomains.includes(siteDomain.value);
                    enableOnThisTab.value = currentTabEnabled;
                    showTranslationOnMouseHover.value = !translationDisabled;
                    targetLanguage.value = targetLang;
                }
            }
        });

        postMessage('init');

        // ==========================================

        function setEnableOnAllPage(val) {
            enableOnAllPage.value = val;
            postMessage('set-global-disabled', !val);
        }

        function setEnableOnThisSite(val) {
            enableOnThisSite.value = val;
            if (val) {
                postMessage('enable-on-domain', siteDomain.value);
            } else {
                postMessage('disable-on-domain', siteDomain.value);
            }
        }

        function setEnableOnThisTab(val) {
            enableOnThisTab.value = val;
            if (val) {
                postMessage('enable-on-current-tab');
            } else {
                postMessage('disable-on-current-tab');
            }
        }

        function setShowTranslationOnMouseHover(val) {
            showTranslationOnMouseHover.value = val;
            postMessage('set-enable-translation', val);
        }

        function addNewWord() {
            const value = newWordInput.value.trim();
            if (!value) {
                alert('Please enter a word in format: key;value');
                return;
            }
            const parts = value.split(';');
            if (parts.length !== 2) {
                alert('Invalid format. Please use: key;value');
                return;
            }
            const key = parts[0].trim();
            const accentValue = parts[1].trim();
            if (!key || !accentValue) {
                alert('Key and value cannot be empty');
                return;
            }

            postMessage('add-pitch-accent', { key, value: accentValue });
            newWordInput.value = '';
            alert('Word added successfully!');
        }

        function exportAdditional() {
            postMessage('export-pitch-accent-additional');
        }

        // Handle exported data from parent
        window.addEventListener('message', function (e) {
            const message = e.data;
            if (!message) return;
            if (message.type === 'export-pitch-accent-additional-result') {
                try {
                    const cache = message.content || {};
                    const entryCount = Object.keys(cache).length;
                    if (entryCount === 0) {
                        alert('No additional pitch accent data to export.');
                        return;
                    }
                    const lines = Object.keys(cache).map(k => `${k};${cache[k]}`).join('\n');
                    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'pitch_accent_additional.txt';
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    // Trigger download with delay for macOS compatibility
                    setTimeout(() => {
                        a.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                        setTimeout(() => {
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                            alert(`Successfully exported ${entryCount} entries to pitch_accent_additional.txt`);
                        }, 100);
                    }, 100);
                } catch (err) {
                    alert(`Error exporting pitch accent data: ${err.message}`);
                    console.error('Export error:', err);
                }
            }
        });

        Vue.watch(targetLanguage, function (val) {
            postMessage('set-target-lang', val);
        });

        return {
            enableOnAllPage,
            enableOnThisSite,
            siteDomain,
            enableOnThisTab,
            showTranslationOnMouseHover,
            targetLanguage,
            newWordInput,

            setEnableOnAllPage,
            setEnableOnThisSite,
            setEnableOnThisTab,
            setShowTranslationOnMouseHover,
            addNewWord,
            exportAdditional,
        };
    }
}).mount('#app');