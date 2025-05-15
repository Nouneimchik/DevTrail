document.addEventListener("DOMContentLoaded", function () {
    let savedText = localStorage.getItem("selectedText");
    
    if (savedText) {
        document.title = savedText; // Вставляємо текст у title
    }
});
