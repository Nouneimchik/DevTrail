document.addEventListener("DOMContentLoaded", function () {
    document.body.addEventListener("click", function (event) {
        const link = event.target.closest(".localStorageStart");
        if (link) {
            localStorage.setItem("selectedId", link.id);
            localStorage.setItem("selectedText", link.dataset.description);
        }
    });
});