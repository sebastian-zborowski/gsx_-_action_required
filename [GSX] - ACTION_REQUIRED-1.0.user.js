// ==UserScript==
// @name         [GSX] - ACTION_REQUIRED
// @version      1.0
// @description  Sprawdza dane z maila ACTION REQUIRED i generuje wiadomości do serwisantów
// @author       Sebastian Zborowski
// @match        https://gsx2.apple.com/
// @include      https://gsx2.apple.com/*
// @updateURL    https://raw.githubusercontent.com/sebastian-zborowski/gsx_-_action_required/main/%5BGSX%5D%20-%20ACTION_REQUIRED-1.0.user.js
// @downloadURL  https://raw.githubusercontent.com/sebastian-zborowski/gsx_-_action_required/main/%5BGSX%5D%20-%20ACTION_REQUIRED-1.0.user.js
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// @grant        none
// @source       https://github.com/sebastian-zborowski

// ==/UserScript==

//Disclaimer:
//Niniejszy skrypt został utworzony metodą Vibecodingu. Nie ingeruje trwale w oryginalne strony internetowe, nie odwołuje się do danych prywatnych ani chronionych przepisami RODO,
//nie przetwarza danych osobowych, a także nie zmienia podstawowego działania strony. Skrypt dodaje kilka automatyzacji, skrótów oraz modyfikacje wizualne, które mają na celu
//usprawnienie i ułatwienie korzystania z serwisu.

//Ostatnia aktualizacja: 01.08.2025

(function () {
    'use strict';

// Kontrola wersji alert ---------------------------------------------------------
    const SCRIPT_NAME = 'ACTION_REQUIRED';
    const CURRENT_VERSION = '1.0';
// -------------------------------------------------------------------------------

    document.body.style.backgroundColor = "#555";
    const DELAY_MS = 3000;
    const gnumToName = {}; // slownik: Gnum -> imie
    let codes = [];

    setTimeout(() => {
        const footer = document.querySelector('.ac-gf-footer .left');
        if (!footer || document.querySelector('#action-required-trigger')) return;

        const triggerBtn = document.createElement('button');
        triggerBtn.id = 'action-required-trigger';
        triggerBtn.textContent = 'ACTION REQUIRED';
        triggerBtn.style.cssText = 'margin-left:12px;padding:4px 8px;background:#444;color:#eee;border:1px solid #666;border-radius:3px;font-size:12px;cursor:pointer;opacity:0.8;';
        triggerBtn.addEventListener('mouseenter', () => triggerBtn.style.opacity = '1');
        triggerBtn.addEventListener('mouseleave', () => triggerBtn.style.opacity = '0.8');

        triggerBtn.addEventListener('click', () => {
            triggerBtn.disabled = true;
            triggerBtn.textContent = 'Wczytywanie...';

            setTimeout(() => {
                addInlineParser();

                triggerBtn.style.display = 'none';

                const reloadBtn = document.createElement('button');
                reloadBtn.textContent = 'Przeładuj';
                reloadBtn.style.cssText = 'margin-left:12px;padding:4px 8px;background:#444;color:#eee;border:1px solid #666;border-radius:3px;font-size:12px;cursor:pointer;opacity:0.8;';
                reloadBtn.addEventListener('mouseenter', () => reloadBtn.style.opacity = '1');
                reloadBtn.addEventListener('mouseleave', () => reloadBtn.style.opacity = '0.8');

                const closeBtn = document.createElement('button');
                closeBtn.textContent = 'Zamknij';
                closeBtn.style.cssText = 'margin-left:12px;padding:4px 8px;background:#444;color:#eee;border:1px solid #666;border-radius:3px;font-size:12px;cursor:pointer;opacity:0.8;';
                closeBtn.addEventListener('mouseenter', () => closeBtn.style.opacity = '1');
                closeBtn.addEventListener('mouseleave', () => closeBtn.style.opacity = '0.8');

                const footer = document.querySelector('.ac-gf-footer .left');
                footer.appendChild(reloadBtn);

                function resetUI() {
                    const container = document.querySelector('div[style*="Szybkie sprawdzanie ACTION REQUIRED"]');
                    if (container) container.remove();
                    const iframesContainer = document.getElementById('iframes-container');
                    if (iframesContainer) iframesContainer.remove();
                    const statusText = document.getElementById('current-check-status');
                    if (statusText) statusText.remove();
                    const progressBarWrapper = document.querySelector('div[style*="progressBarWrapper"]');
                    if (progressBarWrapper) progressBarWrapper.remove();
                    reloadBtn.remove();
                    closeBtn.remove();
                    triggerBtn.style.display = 'inline-block';
                    triggerBtn.disabled = false;
                    triggerBtn.textContent = 'ACTION REQUIRED';
                    codes = [];
                    Object.keys(gnumToName).forEach(key => delete gnumToName[key]);
                }

                reloadBtn.onclick = () => {
                    location.reload();
                };

                triggerBtn.textContent = 'Wczytano.';
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            }, 500);
        });


        footer.appendChild(triggerBtn);
    }, DELAY_MS);

    function addInlineParser() {
        const container = document.createElement('div');
        container.style.cssText = 'position:relative;padding:20px;border-top:3px solid #0275d8;background:#000;color:white;width:80%; max-width: 80vw; margin:20px auto;font-family:Arial,sans-serif;';


        container.innerHTML = `
        <h2 style="color:#00bfff;">Szybkie sprawdzanie ACTION REQUIRED</h2><br>
        <textarea id="input" placeholder="Wklej tutaj tabelkę z maila" style="width:100%;height:150px;font-family:monospace;font-size:14px;padding:8px;background:#111;color:white;border:1px solid #444;box-sizing:border-box;"></textarea><br>
        <div id="buttons-wrapper" style="margin-top:10px; display:flex; justify-content:center; gap:10px; flex-wrap: wrap;">
            <button id="extract" style="padding:8px 16px;background:gray;color:white;border:none;border-radius:4px;font-weight:bold;cursor:pointer;">Pokaż numery</button>
            <button id="fetchAll" style="padding:8px 16px;background:gray;color:white;border:none;border-radius:4px;font-weight:bold;cursor:pointer; display:none;">Pobierz wszystkie PO</button>
        </div>
        <div id="results" style="margin-top:20px;white-space:pre-wrap;font-family:monospace;"></div>
    `;

        document.body.appendChild(container);

        const input = container.querySelector('#input');
        const extractBtn = container.querySelector('#extract');
        const fetchAllBtn = container.querySelector('#fetchAll');
        const buttonsWrapper = container.querySelector('#buttons-wrapper');
        const resultsDiv = container.querySelector('#results');

        const bulkMsgBtn = document.createElement('button');
        bulkMsgBtn.textContent = '📩 Wiadomość zbiorcza';
        bulkMsgBtn.style.cssText = 'padding:8px 16px;background:gray;color:white;border:none;border-radius:4px;font-weight:bold;cursor:pointer;display:none;';

        buttonsWrapper.appendChild(bulkMsgBtn);

        let codes = [];

        extractBtn.onclick = () => {
            const matches = input.value.match(/G[A-Z0-9]{9}/gi);
            resultsDiv.innerHTML = '';
            fetchAllBtn.style.display = 'none';
            bulkMsgBtn.style.display = 'none';
            codes = [];

            if (matches?.length) {
                codes = [...new Set(matches)];
                resultsDiv.style.display = 'grid';
                resultsDiv.style.gridTemplateColumns = 'repeat(4, 1fr)';//ilość elementów iframe sprawdzanych na raz
                resultsDiv.style.gap = '10px';
                resultsDiv.style.whiteSpace = 'normal';

                codes.forEach(code => {
                    const line = document.createElement('div');
                    line.className = 'result-line';
                    line.dataset.code = code;
                    line.textContent = `${code}: X`;

                    line.style.border = 'none';
                    line.style.padding = '4px 6px';
                    line.style.borderRadius = '0';
                    line.style.whiteSpace = 'nowrap';
                    line.style.lineHeight = '24px';
                    line.style.overflow = 'hidden';
                    line.style.textOverflow = 'ellipsis';
                    line.style.width = '100%';

                    resultsDiv.appendChild(line);
                });
                fetchAllBtn.style.display = 'inline-block';
            } else {
                resultsDiv.innerHTML = '<span style="color:red;">Brak numerów G*********</span>';
            }
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
        };
        const fetchCodeData = (code) => {
            return new Promise(resolve => {
                const line = resultsDiv.querySelector(`.result-line[data-code="${code}"]`);
                line.textContent = `${code}: WCZYTUJE...`;

                let statusText = document.getElementById('current-check-status');
                if (!statusText) {
                    statusText = document.createElement('div');
                    statusText.id = 'current-check-status';
                    statusText.style.cssText = 'text-align:center;margin:10px auto 5px auto;font-weight:bold;color:#00bfff;font-size:16px;';
                    document.body.appendChild(statusText);
                }
                statusText.textContent = ``;

                const currentDate = Date.now();
                const iframeId = 'current-check-iframe-' + currentDate;

                const wrapper = document.createElement('div');
                wrapper.id = 'iframe-wrapper-' + currentDate;
                wrapper.style.cssText = 'display:inline-block;vertical-align:top;width:18%;padding:5px;margin:5px;margin-bottom:2%;border:1px solid #00bfff;background:#111;text-align:center;border-radius:4px;';

                const header = document.createElement('div');
                header.textContent = code;
                header.style.cssText = 'color:#00bfff;font-weight:bold;margin-bottom:5px;font-size:14px;';

                const timerDiv = document.createElement('div');
                timerDiv.id = 'iframe-timer' + currentDate;
                timerDiv.style.cssText = 'color:white;font-weight:bold;font-size:13px;margin-bottom:5px;';
                timerDiv.textContent = 'Rozpoczynam';

                const iframe = document.createElement('iframe');
                iframe.id = iframeId;
                iframe.src = `https://gsx2.apple.com/repairs/${code}`;
                iframe.style.cssText = 'width:100%;height:15vh;border:2px solid #00bfff;border-radius:3px;';

                wrapper.appendChild(header);
                wrapper.appendChild(timerDiv);
                wrapper.appendChild(iframe);

                const iframesContainerId = 'iframes-container';
                let iframesContainer = document.getElementById(iframesContainerId);
                if (!iframesContainer) {
                    iframesContainer = document.createElement('div');
                    iframesContainer.id = iframesContainerId;
                    iframesContainer.style.cssText = 'width:100%;display:flex;flex-wrap:wrap;justify-content:center;margin:10px auto;';
                    document.body.insertBefore(iframesContainer, statusText.nextSibling);
                }

                iframesContainer.appendChild(wrapper);

                let secondsElapsed = 0;
                const timerInterval = setInterval(() => {
                    secondsElapsed++;
                    timerDiv.textContent = `Czas ładowania: ${secondsElapsed}s`;

                    if (secondsElapsed <= 3) {
                        timerDiv.style.color = 'lightgreen';
                    } else if (secondsElapsed <= 6) {
                        timerDiv.style.color = 'yellow';
                    } else {
                        timerDiv.style.color = 'red';
                    }

                    if (secondsElapsed >= 20) {
                        clearInterval(timerInterval);
                        clearInterval(checkInterval);
                        wrapper.remove();
                        line.textContent = `${code}: BŁĄD - przekroczono czas ładowania`;
                        statusText.textContent = '';
                        resolve({ code, value: 'BŁĄD - przekroczono czas ładowania' });
                    }
                }, 1000);


                const checkInterval = setInterval(() => {
                    try {
                        const doc = iframe.contentDocument || iframe.contentWindow.document;

                        const statusSpan = doc.querySelector('span.objectId.header-4[aria-label="Repair status - Unit Returned Replaced"]');
                        if (statusSpan) {
                            clearInterval(timerInterval);
                            clearInterval(checkInterval);
                            wrapper.remove();
                            line.textContent = `${code}: Unit Returned Replaced`;
                            statusText.textContent = '';
                            gnumToName[code] = 'Unit Returned Replaced';
                            resolve({ code, value: 'Unit Returned Replaced' });
                            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                            return;
                        }


                        const tech = doc.querySelector('div.v-center.repair-tech__wrapper h2.objectId');
                        if (tech && tech.textContent.trim().length > 0) {
                            clearInterval(timerInterval);
                            clearInterval(checkInterval);
                            wrapper.remove();
                            const status = tech.textContent.trim();
                            line.textContent = `${code}: ${status}`;
                            statusText.textContent = '';
                            gnumToName[code] = status;
                            resolve({ code, value: status });
                            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                            return;
                        }

                        const alt = doc.querySelector('span.objectId.header-4[aria-label*="Closed and completed"]');
                        if (alt && alt.textContent.trim() === 'Closed and completed') {
                            clearInterval(timerInterval);
                            clearInterval(checkInterval);
                            wrapper.remove();
                            const status = 'Closed and completed';
                            line.textContent = `${code}: ${status}`;
                            statusText.textContent = '';
                            gnumToName[code] = status;
                            resolve({ code, value: status });
                            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                            return;
                        }
                    } catch (e) {
                    }
                }, 500);
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            });
        };


        fetchAllBtn.onclick = async () => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            if (codes.length === 0) return;

            fetchAllBtn.disabled = true;

            const chunks = [];
            const chunkSize = 4;
            let results = [];

            for (let i = 0; i < codes.length; i += chunkSize) {
                chunks.push(codes.slice(i, i + chunkSize));
            }

            const delay = (ms) => new Promise(res => setTimeout(res, ms));

            let iframesContainer = document.getElementById('iframes-container');
            if (!iframesContainer) {
                iframesContainer = document.createElement('div');
                iframesContainer.id = 'iframes-container';
                iframesContainer.style.cssText = 'width:100%;display:flex;flex-wrap:wrap;justify-content:center;margin:10px auto;';
                document.body.appendChild(iframesContainer);
            }

            const progressBarWrapper = document.createElement('div');
            progressBarWrapper.style.cssText = 'width:80%;margin:3vh auto;text-align:center;';

            const progressBar = document.createElement('div');
            progressBar.style.cssText = 'height:20px;background:#222;border:1px solid #555;border-radius:10px;overflow:hidden;';
            const progressFill = document.createElement('div');
            progressFill.style.cssText = 'height:100%;width:0%;background:#00bfff;transition:width 0.3s;';
            progressBar.appendChild(progressFill);

            const progressText = document.createElement('div');
            progressText.style.cssText = 'color:white;margin-top:5px;font-weight:bold;font-size:18px;';
            progressText.textContent = 'Ładowanie';

            progressBarWrapper.appendChild(progressBar);
            progressBarWrapper.appendChild(progressText);

            iframesContainer.parentNode.insertBefore(progressBarWrapper, iframesContainer);


            let checkedCount = 0;
            const totalCount = codes.length;

            for (const chunk of chunks) {
                const chunkResults = await Promise.all(chunk.map(async (code, i) => {
                    await delay(i * 100);
                    try {
                        const result = await fetchCodeData(code);
                        return result;
                    } catch (err) {
                        const line = resultsDiv.querySelector(`.result-line[data-code="${code}"]`);
                        if (line) line.textContent = `${code}: BŁĄD - ${err?.message || 'nieznany problem'}`;
                        return { code, value: `BŁĄD - ${err?.message || 'nieznany problem'}` };
                    } finally {
                        checkedCount++;
                        const percent = Math.min(100, Math.round((checkedCount / totalCount) * 100));
                        progressFill.style.width = percent + '%';
                        progressText.textContent = `${percent}% (${checkedCount} z ${totalCount})`;
                    }
                }));

                results = results.concat(chunkResults);
            }

            await delay(500);

            progressFill.style.width = '100%';
            progressText.textContent = `GOTOWE (${totalCount} z ${totalCount})`;
            setTimeout(() => {
                progressBarWrapper.remove();
            }, 2000);


            const grouped = {};
            results.forEach(r => {
                if (!grouped[r.value]) grouped[r.value] = [];
                grouped[r.value].push(r);
            });

            const order = ['Repair Marked Complete', 'Closed and completed'];
            const sortedGroups = Object.keys(grouped).sort((a, b) => {
                const aIndex = order.indexOf(a);
                const bIndex = order.indexOf(b);
                return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
            });

            resultsDiv.innerHTML = '';
            sortedGroups.forEach(group => {
                const entries = grouped[group];

                const block = document.createElement('div');
                block.style.marginBottom = '30px';
                block.style.border = '1px solid #00bfff';
                block.style.borderRadius = '5px';
                block.style.padding = '10px';

                const linesGrid = document.createElement('div');
                linesGrid.style.display = 'grid';
                linesGrid.style.gridTemplateColumns = 'repeat(4, 1fr)'; // Ilość kolumnz numerami napraw
                linesGrid.style.gap = '10px';

                entries.forEach(r => {
                    const line = document.createElement('div');
                    line.className = 'result-line';
                    line.textContent = `${r.code}: ${r.value}`;
                    line.style.padding = '4px 6px';
                    line.style.borderRadius = '3px';
                    linesGrid.appendChild(line);
                });

                block.appendChild(linesGrid);

                block.style.position = 'relative';
                block.style.paddingBottom = '60px';

                const buttonsContainer = document.createElement('div');
                buttonsContainer.style.cssText = `
    position: absolute;
    bottom: 10px;
    left: 0;
    right: 0;
    margin: 0 auto;
    width: 100%;
    max-width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;  /* center buttons horizontally */
    gap: 10px;
    box-sizing: border-box; /* important to contain padding */
    padding: 0 10px; /* optional padding inside */
`;

                const copyBtn = document.createElement('button');
                copyBtn.textContent = `KOPIUJ: ${group}`;
                copyBtn.style.cssText = `
    padding: 6px 12px;
    background: #00bfff;
    color: black;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    width: 100%;  /* fill container width */
    max-width: 400px; /* optional max width */
    height: 36px;
    font-weight: bold;
    white-space: normal;
`;

                buttonsContainer.appendChild(copyBtn);
                block.appendChild(buttonsContainer);

                copyBtn.onclick = () => {
                    const messagesByName = {};
                    entries.forEach(({ code }) => {
                        const name = gnumToName[code] || 'Serwisant';
                        if (!messagesByName[name]) messagesByName[name] = new Set();
                        messagesByName[name].add(code);
                    });

                    let textToCopy = '';
                    for (const [name, codesSet] of Object.entries(messagesByName)) {
                        const codesList = Array.from(codesSet).join('\n');
                        textToCopy += `Hej ${name},\nApple CSS poinformowało o naprawach:\n\n${codesList}\n\nRzuć proszę na to okiem ^^ \n\~nWiadomość wygenerowana automatycznie\n\n`;
                    }

                    navigator.clipboard.writeText(textToCopy).then(() => {
                        copyBtn.textContent = 'Skopiowano!';
                        setTimeout(() => copyBtn.textContent = `KOPIUJ: ${group}`, 1500);
                    });
                };

                buttonsContainer.appendChild(copyBtn);
                block.appendChild(buttonsContainer);

                resultsDiv.appendChild(block);
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
            });


            bulkMsgBtn.style.display = 'inline-block';
            fetchAllBtn.disabled = false;
        };
        bulkMsgBtn.onclick = () => {
            const nameToCodes = {};
            Array.from(resultsDiv.querySelectorAll('.result-line')).forEach(div => {
                const text = div.textContent.trim();
                const match = text.match(/(G[A-Z0-9]{9})/);
                if (!match) return;
                const code = match[1];
                const status = text.replace(code + ': ', '');
                const name = gnumToName[code] || 'ID:';
                if (!nameToCodes[name]) nameToCodes[name] = [];
                nameToCodes[name].push({ code, status });
            });

            let listLines = '';
            for (const [name, entries] of Object.entries(nameToCodes)) {
                listLines += `Serwisant: ${name}\n`;
                entries.forEach(({ code, status }) => {
                    listLines += `  ${code}\n`;
                });
                listLines += '\n';
            }

            const message = `Cześć,\nPrzesłane naprawy należą kolejno do:\n\n${listLines}Osoby z listy zostały już poinformowane.~nWiadomość wygenerowana automatycznie\n\n`;

            navigator.clipboard.writeText(message).then(() => {
                bulkMsgBtn.textContent = 'Skopiowano!';
                setTimeout(() => {
                    bulkMsgBtn.textContent = '📩 Wiadomość zbiorcza';
                }, 1500);
            }).catch(() => {
                alert('Nie udało się skopiować do schowka. Spróbuj ponownie.');
            });
        };

    }


// Kontrola wersji alert ---------------------------------------------------------
(async function() {
    const scriptList = [
        { name: 'VERSION_CONTROL_SYSTEM', url: 'https://raw.githubusercontent.com/sebastian-zborowski/fixably_-_version-control-system/b2b6d4cbfe5cef3fcb98d3e23d79657ff9eae127/%5BFIXABLY%5D%20-%20VERSION%20CONTROL%20SYSTEM-1.0.user.js' },
        { name: 'PASTE_LINK', url: 'https://raw.githubusercontent.com/sebastian-zborowski/ast2_-_paste_link/main/%5BAST2%5D%20-%20PASTE_LINK-1.0.user.js' },
        { name: 'INTERFACE_TWEAKS', url: 'https://raw.githubusercontent.com/sebastian-zborowski/fixably_-_interface_tweaks/main/%5BFIXABLY%5D%20-%20INTERFACE_TWEAKS-1.0.user.js' },
        { name: 'PHOTO_PREVIEW', url: 'https://raw.githubusercontent.com/sebastian-zborowski/fixably_-_photo-preview/main/%5BFIXABLY%5D%20-%20PHOTO_PREVIEW-0.8.user.js' },
        { name: 'ACTION-REQUIRED', url: 'https://raw.githubusercontent.com/sebastian-zborowski/gsx_-_action_required/main/%5BGSX%5D%20-%20ACTION_REQUIRED-1.0.user.js' },
        { name: 'ADD_PARTS', url: 'https://raw.githubusercontent.com/sebastian-zborowski/gsx_-_add_parts/main/%5BGSX%5D%20-%20ADD_PARTS-1.0.user.js' },
    ];

    const currentVersions = {
        VERSION_CONTROL_SYSTEM: '1.0',
        PASTE_LINK: '1.0',
        INTERFACE_TWEAKS: '1.0',
        PHOTO_PREVIEW: '0.8',
        'ACTION-REQUIRED': '1.0',
        ADD_PARTS: '1.0',
    };

    await Promise.all(scriptList.map(async script => {
        try {
            const res = await fetch(script.url);
            const text = await res.text();
            const match = text.match(/@version\s+([0-9.]+)/);
            if (match) {
                const version = match[1];
                localStorage.setItem(script.name, JSON.stringify({
                    name: script.name,
                    remote: version
                }));
                console.log(`[VERSION CONTROL] ${script.name}: ${version}`);
            } else {
                console.warn(`[VERSION CONTROL] Nie znaleziono wersji dla: ${script.name}`);
            }
        } catch (err) {
            console.warn(`[VERSION CONTROL] Błąd ładowania ${script.name}:`, err);
        }
    }));

    let popupCount = 0;
    scriptList.forEach(script => {
        const storedStr = localStorage.getItem(script.name);
        if (!storedStr) return;
        try {
            const data = JSON.parse(storedStr);
            const remoteVer = data?.remote;
            const currentVer = currentVersions[script.name] || '0.0';

            if (remoteVer && compareVersions(remoteVer, currentVer) > 0) {
                showUpdatePopup(script.name, currentVer, remoteVer, popupCount++);
            }
        } catch(e) {
            console.warn(`[UPDATE CHECK] Błąd sprawdzania wersji dla ${script.name}:`, e);
        }
    });

    function compareVersions(v1, v2) {
        const split1 = v1.split('.').map(Number);
        const split2 = v2.split('.').map(Number);
        const length = Math.max(split1.length, split2.length);
        for (let i = 0; i < length; i++) {
            const a = split1[i] || 0;
            const b = split2[i] || 0;
            if (a > b) return 1;
            if (a < b) return -1;
        }
        return 0;
    }

    function showUpdatePopup(scriptName, current, remote, index) {
        const popup = document.createElement('div');
        popup.textContent = `🔔 Aktualizacja dostępna dla ${scriptName}: ${remote} (masz ${current})`;
        Object.assign(popup.style, {
            position: 'fixed',
            bottom: `${20 + index * 50}px`,
            right: '20px',
            backgroundColor: '#222',
            color: '#fff',
            padding: '12px 18px',
            borderRadius: '8px',
            fontSize: '14px',
            zIndex: 9999 + index,
            boxShadow: '0 0 10px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'opacity 0.3s ease',
            opacity: '1',
        });

        popup.addEventListener('click', () => popup.remove());

        document.body.appendChild(popup);

        setTimeout(() => {
            // animacja znikania
            popup.style.opacity = '0';
            setTimeout(() => popup.remove(), 500);
        }, 7500);
    }
})();
// ---------------------------------------------------------------------------------

})();
