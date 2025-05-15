function getCookie(name) {
    const cookies = document.cookie.split('; ');
    for (let c of cookies) {
        const [key, value] = c.split('=');
        if (key === name) return decodeURIComponent(value);
    }
    return null;
}

async function loadRoadmaps() {
    try {
        const res = await fetch('/roadmaps.json');
        const json = await res.json();
        return json;
    } catch (err) {
        console.error('Помилка завантаження роадмапів', err);
        return {};
    }
}

function createRoadmapLink(filename) {
    const a = document.createElement('a');
    a.href = `./Roadmaps-pages.html`;
    a.classList.add('selection--block');
    a.id = filename;
    a.textContent = filename.replaceAll('_', ' ');
    a.style.position = 'relative';

    a.addEventListener('click', () => {
        localStorage.setItem("selectedId", encodeURIComponent(filename));
    });

    // Додаємо кнопку видалення лише якщо користувач — адмін
    const userCookie = getCookie('user');
    if (userCookie) {
        try {
            const user = JSON.parse(decodeURIComponent(decodeURIComponent(userCookie)));
            if (user?.role === 'admin') {
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '×';
                deleteBtn.classList.add('delete-button');
                deleteBtn.style.position = 'absolute';
                deleteBtn.style.top = '5px';
                deleteBtn.style.right = '8px';
                deleteBtn.style.background = 'transparent';
                deleteBtn.style.border = 'none';
                deleteBtn.style.color = '#fff';
                deleteBtn.style.fontSize = '42px';
                deleteBtn.style.cursor = 'pointer';

                deleteBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    e.preventDefault();

                    if (!confirm(`Видалити "${filename}"?`)) return;

                    const enteredPassword = prompt('Підтвердіть пароль для видалення:');
                    if (!enteredPassword) return;

                    try {
                        const res = await fetch('/delete-roadmap', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ filename, password: enteredPassword })
                        });

                        if (res.ok) {
                            a.remove();
                        } else {
                            const msg = await res.text();
                            alert(`Помилка: ${msg}`);
                        }
                    } catch (err) {
                        console.error('Помилка видалення:', err);
                    }
                });

                a.appendChild(deleteBtn);
            }
        } catch (err) {
            console.error('Помилка читання куки:', err);
        }
    }

    return a;
}

async function setupAdminControls() {
    const userCookie = document.cookie.split('user=')[1];
    if (!userCookie) {
        console.error('Кука "user" не знайдена');
        return;
    }

    let role = null;
    try {
        // Декодуємо куку двічі
        const decodedUserCookie = decodeURIComponent(decodeURIComponent(userCookie));

        const user = JSON.parse(decodedUserCookie);
        role = user?.role;
    } catch (err) {
        console.error('Помилка читання куки:', err);
        return;
    }

    if (role !== 'admin') return;

    const categories = document.querySelectorAll('.category');
    categories.forEach(category => {
        const title = category.querySelector('h2');
        const selection = category.querySelector('.selection');
        if (!title || !selection) return;

        const addBtn = document.createElement('button');
        addBtn.textContent = 'Додати';
        addBtn.classList.add('add-button');
        selection.appendChild(addBtn);

        addBtn.addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Введіть назву...';
            input.classList.add('add-input');

            const saveBtn = document.createElement('button');
            saveBtn.textContent = 'Зберегти';
            saveBtn.classList.add('save-button');

            selection.appendChild(input, addBtn.nextSibling);
            selection.appendChild(saveBtn, input.nextSibling);
            addBtn.disabled = true;

            saveBtn.addEventListener('click', async () => {
                const filename = input.value.trim();
                if (!filename) return;

                const sectionKey = title.id;
                const roadmap = { category: sectionKey, filename };

                try {
                    const res = await fetch('/create-roadmap', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(roadmap)
                    });

                    if (res.ok) {
                        const link = createRoadmapLink(filename, sectionKey);
                        selection.insertBefore(link, addBtn);
                    } else {
                        alert('Помилка при створенні роадмапу');
                    }
                } catch (err) {
                    console.error('Помилка створення:', err);
                }

                input.remove();
                saveBtn.remove();
                addBtn.disabled = false;
            });
        });
    });
}

async function renderRoadmaps() {
    const data = await loadRoadmaps();
    const sections = document.querySelectorAll('.category');

    sections.forEach(section => {
        const title = section.querySelector('h2');
        const selection = section.querySelector('.selection');
        if (!title || !selection) return;

        const key = title.id;
        const items = data[key] || [];

        items.forEach(filename => {
            const link = createRoadmapLink(filename, key); // додали key як sectionKey
            selection.appendChild(link);
        });
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    await renderRoadmaps();
    await setupAdminControls();
});
