document.addEventListener("DOMContentLoaded", function () {
    document.body.addEventListener("click", function (event) {
        const link = event.target.closest(".selection--block");
        if (link) {
            let text = link.textContent.trim();

            // Знайдемо кнопку всередині link
            const btn = link.querySelector("button");
            if (btn) {
                // Віднімемо текст кнопки з загального тексту
                const btnText = btn.textContent.trim();
                // Видаляємо текст кнопки з загального тексту
                text = text.replace(btnText, '').trim();
            }

            localStorage.setItem("selectedId", link.id);
            localStorage.setItem("selectedText", text);
        }
    });
});