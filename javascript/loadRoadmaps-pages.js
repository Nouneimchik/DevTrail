document.addEventListener("DOMContentLoaded", function () {
    let selectedId = localStorage.getItem("selectedId");
    let loadFragment = document.querySelector("#Roadmaps-pagesLoad");

    if (selectedId && loadFragment) {
        let decodedId = decodeURIComponent(selectedId);
        console.log("Підвантаження:", decodedId);
        loadFragment.setAttribute("data-file", `/Roadmaps/${decodedId}.html`);
        loadContent(loadFragment);
    }
});

// Функція для підвантаження вмісту
function loadContent(element) {
    let filePath = element.getAttribute("data-file");

    if (filePath) {
        fetch(filePath)
            .then(response => {
                if (!response.ok) throw new Error("Файл не знайдено");
                return response.text();
            })
            .then(data => {
                element.innerHTML = data;

                if (window.Prism) Prism.highlightAll();

                generateNavigation();
            })
            .catch(error => console.error("Помилка завантаження:", error));
    }
}

// Функція для створення навігації
function generateNavigation() {
    const roadmapsBody = document.querySelector("#Roadmaps-pagesLoad");
    const navigation = document.querySelector(".roadmaps--navigation");

    if (!roadmapsBody || !navigation) return;

    let menuHTML = "";

    roadmapsBody.querySelectorAll("h2, h3").forEach(header => {
        const id = header.id || header.textContent.trim().replace(/\s+/g, "-").toLowerCase();
        header.id = id;

        const text = header.textContent.trim();
        const isMain = header.tagName === "H2";

        if (isMain) {
            if (menuHTML) menuHTML += `</div></div>`; // Закриваємо попередній dropdown
            menuHTML += `
                <div class="dropdown">
                    <div>
                        <a href="#${id}" class="selection--block">${text}</a>
                        <button class="dropdown-btn">▼</button>
                    </div>
                    <div class="dropdown-content">
            `;
        } else {
            menuHTML += `<a href="#${id}" class="selection--block">${text}</a><br>`;
        }
    });

    if (menuHTML) menuHTML += `</div></div>`; // Закриваємо останній dropdown

    navigation.innerHTML = menuHTML;

    addEventListeners();
}

// Додаємо обробники подій після генерації меню
function addEventListeners() {
    document.querySelectorAll(".selection--block").forEach(link => {
        link.addEventListener("click", function (event) {
            let targetId = this.getAttribute("href");

            // Запобігаємо зміні selectedId для внутрішніх посилань (#)
            if (targetId && targetId.startsWith("#")) return;

            let id = this.textContent.trim();
            localStorage.setItem("selectedId", encodeURIComponent(id));
        });
    });

    document.querySelectorAll(".dropdown-btn").forEach(button => {
        button.addEventListener("click", function () {
            const dropdown = this.closest(".dropdown");
            const content = dropdown.querySelector(".dropdown-content");

            dropdown.classList.toggle("active");
            content.style.display = dropdown.classList.contains("active") ? "block" : "none";
        });
    });
}

// CSS для стилізації dropdown
document.head.insertAdjacentHTML("beforeend", `
    <style>
        .dropdown-content {
            display: none;
        }
        .dropdown.active .dropdown-content {
            display: block;
        }
    </style>
`);
