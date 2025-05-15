function setupLoginModal() {
    const loginBtn = document.getElementById("loginBtn");
    const loginModal = document.getElementById("loginModal");
    if (!loginBtn || !loginModal) return;

    loginBtn.onclick = function() {
        loginModal.style.display = "block";
    };

    loginModal.querySelector(".close").onclick = function() {
        loginModal.style.display = "none";
    };

    window.onclick = function(event) {
        if (event.target === loginModal) {
            loginModal.style.display = "none";
        }
    };
}

function getCookie(name) {
    const cookies = document.cookie.split('; ');
    for (let c of cookies) {
        const [key, value] = c.split('=');
        if (key === name) return decodeURIComponent(value);
    }
    return null;
}

function updateLoginModal() {
    const userCookie = getCookie('user');
    const loginModal = document.getElementById('loginModal');
    const loginBtn = document.getElementById('loginBtn');

    if (!loginModal || !loginBtn) return;
    const modalContent = loginModal.querySelector('.modal-content');

    if (userCookie) {
        try {
            const decodedCookie = decodeURIComponent(userCookie);
            const user = JSON.parse(decodedCookie);

            modalContent.innerHTML = `
                <span class="close">&times;</span>
                <h2>Вітаємо, ${user.username}!</h2>
                <p>Email: ${user.email}</p>
                <button id="logoutBtn">Вийти</button>
            `;

            loginBtn.innerText = user.username;

            document.getElementById('logoutBtn').addEventListener('click', () => {
                document.cookie = 'user=; Max-Age=0; path=/;';
                location.reload();
            });

            modalContent.querySelector('.close').addEventListener('click', () => {
                loginModal.style.display = 'none';
            });
        } catch (e) {
            console.error('Помилка обробки куки:', e);
            // Якщо кука погана — видалити її
            document.cookie = 'user=; Max-Age=0; path=/;';
        }
    }
}


document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'loginForm') {
        e.preventDefault();

        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
            });

            const result = await response.json();

            if (response.ok) {
                updateLoginModal();
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error('Помилка входу:', error);
        }
    }
});
