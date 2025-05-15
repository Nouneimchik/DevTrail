document.addEventListener('DOMContentLoaded', () => {
    const userCookie = document.cookie.split('user=')[1];
    if (!userCookie) return;

    let role = null;
    try {
        const user = JSON.parse(decodeURIComponent(decodeURIComponent(userCookie)));
        role = user?.role;
    } catch {
        return;
    }

    if (role !== 'admin') return;   

    const observer = new MutationObserver(() => {
        const body = document.querySelector('.roadmaps--body');
        if (!body || body.dataset.editButtonInjected === 'true') return;

        const wrapper = document.createElement('div');
        wrapper.className = 'edit-button-wrapper';
        wrapper.style.position = 'sticky';
        wrapper.style.top = '0';
        wrapper.style.background = '#121212';
        wrapper.style.padding = '10px';
        wrapper.style.display = 'flex';
        wrapper.style.flexWrap = 'wrap';
        wrapper.style.gap = '10px';

        const editBtn = document.createElement('button');
        editBtn.textContent = 'Редагувати';
        editBtn.className = 'edit-button';
        editBtn.style.background = '#333';
        editBtn.style.color = '#fff';
        editBtn.style.border = 'none';
        editBtn.style.padding = '8px 16px';
        editBtn.style.cursor = 'pointer';
        editBtn.style.borderRadius = '5px';
        editBtn.style.fontSize = '16px';

        wrapper.appendChild(editBtn);
        body.prepend(wrapper);
        body.dataset.editButtonInjected = 'true';

        let isEditing = false;
        let extraButtons = [];

        const elements = {
            'Заголовок': () => {
                const h2 = document.createElement('h2');
                h2.className = 'addDeleteBtn';
                h2.textContent = 'Введіть текст';
                h2.setAttribute('data-editable', 'true');
                makeElementDraggable(h2);
                addDeleteButton(h2);
                return h2;
            },
            'Підзаголовок': () => {
                const h3 = document.createElement('h3');
                h3.className = 'addDeleteBtn';
                h3.textContent = 'Введіть текст';
                h3.setAttribute('data-editable', 'true');
                makeElementDraggable(h3);
                addDeleteButton(h3);
                return h3;
            },
            'Розділ': () => {
                const h4 = document.createElement('h4');
                h4.className = 'addDeleteBtn';
                h4.textContent = 'Введіть текст';
                h4.setAttribute('data-editable', 'true');
                makeElementDraggable(h4);
                addDeleteButton(h4);
                return h4;
            },
            'Текст': () => {
                const p = document.createElement('p');
                p.className = 'addDeleteBtn';
                p.textContent = 'Введіть текст';
                p.setAttribute('data-editable', 'true');
                makeElementDraggable(p);
                addDeleteButton(p);
                return p;
            },
            'Текстовий блок': () => {
                const div = document.createElement('div');
                div.className = 'description addDeleteBtn';
                div.setAttribute('data-editable', 'true');
                makeElementDraggable(div);
                const p = document.createElement('p');
                p.textContent = 'Введіть текст';
                div.appendChild(p);
                addDeleteButton(div);
                return div;
            },
            'Код': () => {
                const wrapper = document.createElement('div');
                wrapper.className = 'monaco-wrapper';
                wrapper.setAttribute('data-editable', 'true');
                makeElementDraggable(wrapper);
                wrapper.style.border = '1px solid #ccc';
                wrapper.style.padding = '10px';
                wrapper.style.margin = '10px 0';
                wrapper.style.position = 'relative';

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '✖';
                deleteBtn.title = 'Видалити';
                deleteBtn.className = 'delete-code-block';
                deleteBtn.style.position = 'absolute';
                deleteBtn.style.top = '5px';
                deleteBtn.style.right = '5px';
                deleteBtn.style.background = '#e00';
                deleteBtn.style.color = '#fff';
                deleteBtn.style.border = 'none';
                deleteBtn.style.borderRadius = '3px';
                deleteBtn.style.padding = '2px 6px';
                deleteBtn.style.cursor = 'pointer';
                deleteBtn.addEventListener('click', () => {
                    wrapper.remove();
                });

                const select = document.createElement('select');
                ['javascript', 'html', 'css', 'C++'].forEach(lang => {
                    const opt = document.createElement('option');
                    opt.value = lang;
                    opt.textContent = lang;
                    select.appendChild(opt);
                });

                const container = document.createElement('div');
                container.className = 'monaco-editor-container';
                container.style.height = '200px';
                container.style.border = '1px solid #888';
                container.style.marginTop = '10px';

                wrapper.appendChild(deleteBtn);
                wrapper.appendChild(select);
                wrapper.appendChild(container);

                const editor = monaco.editor.create(container, {
                    value: '// Введіть код тут',
                    language: select.value,
                    theme: 'vs-dark',
                    automaticLayout: true
                });

                container.__monaco__ = editor;

                select.addEventListener('change', () => {
                    monaco.editor.setModelLanguage(editor.getModel(), select.value);
                });

                return wrapper;
            },
            'Посилання': () => {
                const ul = document.createElement('ul');
                ul.setAttribute('data-editable', 'true');
                ul.classList.add('draggable-block');

                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = '#';
                a.target = '_blank';
                a.textContent = 'Введіть посилання';
                li.appendChild(a);
                ul.appendChild(li);

                setTimeout(() => initLinkBlock(ul), 0);
                return ul;
            }
        };

        // Функція для додавання кнопки видалення
        function addDeleteButton(el) {
            el.style.position = 'relative';

            const btn = document.createElement('button');
            btn.textContent = '✖';
            btn.title = 'Видалити';
            btn.className = 'delete-element-button devtrail-editor-button';
            btn.style.position = 'absolute';
            btn.style.top = '5px';
            btn.style.right = '5px';
            btn.style.background = '#e00';
            btn.style.color = '#fff';
            btn.style.border = 'none';
            btn.style.borderRadius = '3px';
            btn.style.padding = '2px 6px';
            btn.style.cursor = 'pointer';

            btn.addEventListener('click', () => {
                el.remove();
            });

            el.appendChild(btn);
        }

        editBtn.addEventListener('click', () => {
            const toggleEditMode = (enable) => {
                const editableElements = body.querySelectorAll('[data-editable]');
                // Ініціалізація збережених посилань
                body.querySelectorAll('ul[data-editable]').forEach(ul => {
                    delete ul.dataset.linkInit;
                });
                body.querySelectorAll('ul[data-editable]:not([data-link-init="true"])').forEach(initLinkBlock);

                editableElements.forEach(el => {
                    if (enable) {
                        el.setAttribute('contenteditable', 'true');
                        if (el.classList.contains('addDeleteBtn')) addDeleteButton(el);
                    } else {
                        el.removeAttribute('contenteditable');
                    }
                });
        
                if (!enable) {
                    const pagesSection = document.querySelector('.roadmaps--pages');
                    if (!pagesSection) return;

                    const bodyClone = pagesSection.querySelector('.roadmaps--body');
                    if (bodyClone) {
                        cleanupBodyContent(bodyClone); // 🧹 очищаємо активні Monaco тут!
                        bodyClone.removeAttribute('data-edit-button-injected');
                        const editPanel = bodyClone.querySelector('.edit-button-wrapper');
                        if (editPanel) editPanel.remove();
                    }

                    const nav = pagesSection.querySelector('.roadmaps--navigation');
                    if (nav) nav.innerHTML = '';

                    const filePath = document.querySelector('#Roadmaps-pagesLoad')?.getAttribute('data-file');
                    if (filePath) {
                        const cleanHTML = formatHTML(pagesSection.outerHTML);

                        fetch('/save-roadmap', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ path: filePath, content: cleanHTML })
                        })
                        .then(res => {
                            if (!res.ok) throw new Error('Помилка збереження');
                            iziToast.success({ title: 'OK', message: 'Зміни збережено', theme: 'dark', color: 'black' });
                        })
                        .catch(err => {
                            console.error(err);
                            iziToast.error({ title: 'Помилка', message: 'Не вдалося зберегти файл', color: 'red' });
                        });
                    }
                }
            };
        
            if (!isEditing) {
                editBtn.textContent = 'Зберегти';
                toggleEditMode(true);

                convertCodeBlocksToMonaco(body);
        
                extraButtons = Object.keys(elements).map(label => {
                    const btn = document.createElement('button');
                    btn.textContent = label;
                    btn.style.background = '#f0f0f0';
                    btn.style.color = '#000';
                    btn.style.border = '1px solid #ccc';
                    btn.style.padding = '6px 12px';
                    btn.style.borderRadius = '4px';
                    btn.style.cursor = 'pointer';
        
                    btn.addEventListener('click', () => {
                        const el = elements[label]();
                        el.setAttribute('contenteditable', 'true');
                        body.appendChild(el);

                        if (label === 'Посилання') {
                            initLinkBlock(el); // тепер ul вже в DOM, .after працює
                        }
                    });
        
                    wrapper.appendChild(btn);
                    return btn;
                });
            } else {
                editBtn.textContent = 'Редагувати';
                toggleEditMode(false);
                extraButtons.forEach(btn => btn.remove());
                extraButtons = [];
            }
        
            isEditing = !isEditing;
        });
    });

    function initLinkBlock(ul) {
        if (!ul || ul.dataset.linkInit === 'true') return;
        ul.dataset.linkInit = 'true';

        ul.classList.add('draggable-block');

        makeElementDraggable(ul);

        const controls = document.createElement('div');
        controls.className = 'link-controls non-savable devtrail-editor-button';
        controls.style.marginTop = '10px';
        controls.style.display = 'flex';
        controls.style.gap = '10px';

        const addLinkBtn = document.createElement('button');
        addLinkBtn.textContent = 'Додати посилання';
        addLinkBtn.style.cssText = 'padding: 5px 10px; cursor: pointer; background: #333; border-radius: 5px; border: none; color: #fff;';
        addLinkBtn.addEventListener('click', () => {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.textContent = 'Введіть посилання';
            a.target = '_blank';
            li.appendChild(a);
            ul.appendChild(li);
            setupLinkEdit(a);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Видалити блок';
        deleteBtn.style.cssText = 'padding: 5px 10px; cursor: pointer; background: #333; border-radius: 5px; border: none; color: red;';
        deleteBtn.addEventListener('click', () => {
            controls.remove();
            ul.remove();
        });

        controls.appendChild(addLinkBtn);
        controls.appendChild(deleteBtn);
        ul.after(controls);

        ul.querySelectorAll('a').forEach(setupLinkEdit);
    }
        
    function makeElementDraggable(el) {
        el.classList.add('draggable-block');
        el.setAttribute('draggable', 'true');

        el.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', null); // Firefox fix
            el.classList.add('dragging');
        });

        el.addEventListener('dragend', () => {
            el.classList.remove('dragging');
        });
    }

    document.addEventListener('dragover', (e) => {
        const draggingEl = document.querySelector('.dragging');
        if (!draggingEl) return;

        const body = document.querySelector('.roadmaps--body');
        const draggableBlocks = [...body.querySelectorAll('.draggable-block')];

        const closest = draggableBlocks.find(el => {
            const rect = el.getBoundingClientRect();
            return e.clientY < rect.top + rect.height / 2 && el !== draggingEl;
        });

        if (closest && closest !== draggingEl && closest !== draggingEl.nextSibling) {
            body.insertBefore(draggingEl, closest);
        } else if (!closest && draggingEl !== body.lastElementChild) {
            body.appendChild(draggingEl);
        }
    });

    function setupLinkEdit(a) {
        a.addEventListener('dblclick', () => {
            const newHref = prompt('Введіть URL:', a.href || '');
            if (newHref?.trim()) {
                a.href = newHref.trim();
            }
        });
    }

    const initDraggableBlocks = () => {
        const editableBlocks = document.querySelectorAll('[data-editable]');
        editableBlocks.forEach(block => {
            makeElementDraggable(block);
        });
    };

    const initExistingMonacoEditors = () => {
        const wrappers = document.querySelectorAll('.monaco-wrapper');
        wrappers.forEach(wrapper => {
            const select = wrapper.querySelector('select');
            const container = wrapper.querySelector('.monaco-editor-container');

            // Пропускаємо, якщо контейнер вже ініціалізований або містить редактор
            if (!container || container.__monaco__ instanceof monaco.editor.IStandaloneCodeEditor) return;

            const editor = monaco.editor.create(container, {
                value: '// Введіть код тут',
                language: select?.value || 'javascript',
                theme: 'vs-dark',
                automaticLayout: true
            });

            container.__monaco__ = editor;

            select?.addEventListener('change', () => {
                monaco.editor.setModelLanguage(editor.getModel(), select.value);
            });
        });
    };


    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 👇 Спеціально чекаємо, коли з’явиться roadmaps--body і лише потім ініціалізуємо моніторинг
    const waitForRoadmapBody = setInterval(() => {
        const body = document.querySelector('.roadmaps--body');
        if (body) {
            clearInterval(waitForRoadmapBody);
            initExistingMonacoEditors();
            initDraggableBlocks();
        }
    }, 100); // перевіряємо кожні 100мс

    function convertCodeBlocksToMonaco(body) {
        const preBlocks = body.querySelectorAll('pre > code[class^="language-"]');

        preBlocks.forEach(code => {
            const lang = code.className.replace('language-', '') || 'plaintext';
            const rawCode = code.textContent;

            const wrapper = document.createElement('div');
            wrapper.className = 'monaco-wrapper';
            wrapper.setAttribute('data-editable', 'true');
            wrapper.style.border = '1px solid #ccc';
            wrapper.style.padding = '10px';
            wrapper.style.margin = '10px 0';

            const select = document.createElement('select');
            ['javascript', 'html', 'css', 'C++'].forEach(l => {
                const opt = document.createElement('option');
                opt.value = l;
                opt.textContent = l;
                if (l === lang) opt.selected = true;
                select.appendChild(opt);
            });

            const container = document.createElement('div');
            container.className = 'monaco-editor-container';
            container.style.height = '200px';
            container.style.border = '1px solid #888';
            container.style.marginTop = '10px';

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = '✖';
            deleteBtn.title = 'Видалити';
            deleteBtn.className = 'delete-code-block';
            deleteBtn.style.position = 'absolute';
            deleteBtn.style.top = '5px';
            deleteBtn.style.right = '5px';
            deleteBtn.style.background = '#e00';
            deleteBtn.style.color = '#fff';
            deleteBtn.style.border = 'none';
            deleteBtn.style.borderRadius = '3px';
            deleteBtn.style.padding = '2px 6px';
            deleteBtn.style.cursor = 'pointer';
            deleteBtn.addEventListener('click', () => {
                wrapper.remove();
            });
            wrapper.style.position = 'relative';
            wrapper.appendChild(deleteBtn);

            wrapper.appendChild(select);
            wrapper.appendChild(container);

            const editor = monaco.editor.create(container, {
                value: rawCode,
                language: lang,
                theme: 'vs-dark',
                automaticLayout: true
            });

            container.__monaco__ = editor;

            select.addEventListener('change', () => {
                monaco.editor.setModelLanguage(editor.getModel(), select.value);
            });

            code.closest('pre').replaceWith(wrapper);
        });
    }


    function formatHTML(html) {
        return html
            .replace(/></g, '>\n<')
            .replace(/\s*\n\s*/g, '\n')
            .trim();
    }

    function cleanupBodyContent(body) {
        const monacoBlocks = body.querySelectorAll('.monaco-wrapper');
        monacoBlocks.forEach(wrapper => {
            const container = wrapper.querySelector('.monaco-editor-container');
            const editor = container?.__monaco__;
            const lang = wrapper.querySelector('select')?.value || 'plaintext';
            // Видаляємо всі кнопки додавання та видалення
            body.querySelectorAll('.non-savable').forEach(el => el.remove());

            if (!editor) return;

            const rawCode = editor.getValue();

            const pre = document.createElement('pre');
            const code = document.createElement('code');
            code.className = `language-${lang}`;
            code.textContent = rawCode;

            pre.appendChild(code);
            wrapper.replaceWith(pre);
        });

        // 🧹 Видалити службові кнопки (редагування, додавання, видалення)
        body.querySelectorAll('.devtrail-editor-button').forEach(btn => btn.remove());
    }      
});
