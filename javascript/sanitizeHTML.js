function sanitizeHTML(html) {
    // Тимчасово видалити вміст .roadmaps--navigation
    const tmp = document.createElement('div');
    tmp.innerHTML = html;

    const nav = tmp.querySelector('.roadmaps--navigation');
    if (nav) nav.innerHTML = '';

    // Видалити "сміттєві" символи
    let cleaned = tmp.innerHTML.replace(/�/g, '');

    // Проста фільтрація непарних закритих тегів
    cleaned = cleaned.replace(/<\/(h[1-6]|div|p|span)>[^<]*<\/\1>/g, match => {
        return /<\/\1>/.test(match) ? match : '';
    });

    return cleaned;
}
