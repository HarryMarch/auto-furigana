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
        const newKanjiInput = Vue.ref('');
        const showFlashcards = Vue.ref(false);
        const flashcardType = Vue.ref('kanji');
        const flashcards = Vue.ref([]);
        const currentCardIndex = Vue.ref(0);
        const isFlipped = Vue.ref(false);

        // ==========================================

        const currentCard = Vue.computed(() => {
            if (flashcards.value.length === 0) {
                return { front: '', back: '' };
            }
            return flashcards.value[currentCardIndex.value];
        });

        // ==========================================

        function handleKeydown(e) {
            if (!showFlashcards.value || flashcards.value.length === 0) {
                return;
            }

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                e.stopPropagation();
                previousCard();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                e.stopPropagation();
                nextCard();
            } else if (e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                flipCard();
            }
        }

        Vue.onMounted(() => {
            document.addEventListener('keydown', handleKeydown, true);
        });

        Vue.onUnmounted(() => {
            document.removeEventListener('keydown', handleKeydown, true);
        });

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
                    break;
                case 'flashcard-data': {
                    const data = message.content;
                    flashcards.value = data;
                    currentCardIndex.value = 0;
                    isFlipped.value = false;
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

        function addNewKanji() {
            const value = newKanjiInput.value.trim();
            if (!value) {
                alert('Please enter a kanji in format: key;value');
                return;
            }
            const parts = value.split(';');
            if (parts.length !== 2) {
                alert('Invalid format. Please use: key;value');
                return;
            }
            const key = parts[0].trim();
            const kanjiValue = parts[1].trim();
            if (!key || !kanjiValue) {
                alert('Key and value cannot be empty');
                return;
            }

            postMessage('add-kanji', { key, value: kanjiValue });
            newKanjiInput.value = '';
            alert('Kanji added successfully!');
        }

        function exportAdditional() {
            postMessage('export-cache-additional');
        }

        function toggleFlashcards() {
            showFlashcards.value = !showFlashcards.value;
            if (showFlashcards.value && flashcards.value.length === 0) {
                loadFlashcards();
            }
            if (showFlashcards.value) {
                // Ensure body has focus for keyboard events
                Vue.nextTick(() => {
                    document.body.focus();
                });
            }
        }

        function loadFlashcards() {
            postMessage('get-flashcard-data', flashcardType.value);
        }

        function flipCard() {
            isFlipped.value = !isFlipped.value;
            document.body.focus();
        }

        function nextCard() {
            if (currentCardIndex.value < flashcards.value.length - 1) {
                currentCardIndex.value++;
                isFlipped.value = false;
                document.body.focus();
            }
        }

        function previousCard() {
            if (currentCardIndex.value > 0) {
                currentCardIndex.value--;
                isFlipped.value = false;
                document.body.focus();
            }
        }

        function shuffleCards() {
            const shuffled = [...flashcards.value];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            flashcards.value = shuffled;
            currentCardIndex.value = 0;
            isFlipped.value = false;
        }

        // Handle exported data from parent
        window.addEventListener('message', function (e) {
            const message = e.data;
            if (!message) return;
            if (message.type === 'export-kanji-additional-result') {
                try {
                    const content = message.content || {};
                    // If the host (popup) handled the download, just show success
                    if (content && content.downloadedByHost) {
                        alert(`Exported ${content.entryCount || 0} entries to kanji_additional.txt`);
                        return;
                    }

                    const cache = content || {};
                    const entryCount = Object.keys(cache).length;
                    if (entryCount === 0) {
                        alert('No additional kanji data to export.');
                        return;
                    }
                    const lines = Object.keys(cache).map(k => `${k};${cache[k]}`).join('\n');
                    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
                    const objUrl = URL.createObjectURL(blob);

                    // Anchor fallback for environments without downloads API
                    const a = document.createElement('a');
                    a.href = objUrl;
                    a.download = 'kanji_additional.txt';
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    setTimeout(() => {
                        try {
                            a.target = '_blank';
                            a.rel = 'noopener';
                            a.click();
                        } catch (err) {
                            a.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                        }
                        setTimeout(() => {
                            document.body.removeChild(a);
                            URL.revokeObjectURL(objUrl);
                            alert(`Successfully exported ${entryCount} entries to kanji_additional.txt`);
                        }, 300);
                    }, 100);
                } catch (err) {
                    alert(`Error exporting kanji data: ${err.message}`);
                    console.error('Export error:', err);
                }
            } else if (message.type === 'export-pitch-accent-additional-result') {
                try {
                    const content = message.content || {};
                    // If the host (popup) handled the download, just show success
                    if (content && content.downloadedByHost) {
                        alert(`Exported ${content.entryCount || 0} entries to pitch_accent_additional.txt`);
                        return;
                    }

                    const cache = content || {};
                    const entryCount = Object.keys(cache).length;
                    if (entryCount === 0) {
                        alert('No additional pitch accent data to export.');
                        return;
                    }
                    const lines = Object.keys(cache).map(k => `${k};${cache[k]}`).join('\n');
                    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
                    const objUrl = URL.createObjectURL(blob);

                    // Anchor fallback for environments without downloads API
                    const a = document.createElement('a');
                    a.href = objUrl;
                    a.download = 'pitch_accent_additional.txt';
                    a.style.display = 'none';
                    document.body.appendChild(a);
                    setTimeout(() => {
                        try {
                            a.target = '_blank';
                            a.rel = 'noopener';
                            a.click();
                        } catch (err) {
                            a.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                        }
                        setTimeout(() => {
                            document.body.removeChild(a);
                            URL.revokeObjectURL(objUrl);
                            alert(`Successfully exported ${entryCount} entries to pitch_accent_additional.txt`);
                        }, 300);
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
            newKanjiInput,
            showFlashcards,
            flashcardType,
            flashcards,
            currentCardIndex,
            isFlipped,
            currentCard,

            setEnableOnAllPage,
            setEnableOnThisSite,
            setEnableOnThisTab,
            setShowTranslationOnMouseHover,
            addNewWord,
            addNewKanji,
            exportAdditional,
            toggleFlashcards,
            loadFlashcards,
            flipCard,
            nextCard,
            previousCard,
            shuffleCards
        };
    }

}).mount('#app');
