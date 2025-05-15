document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll(".load-fragment").forEach(element => {
        const file = element.getAttribute("data-file");

        if (file) {
            fetch(file)
                .then(response => response.text())
                .then(data => {
                    element.innerHTML = data;
                        setupLoginModal();
                        updateLoginModal();
                })
                .catch(error => console.error(`Помилка завантаження ${file}:`, error));
        }
    });
});
