// accordion.js - Fungsi accordion untuk sidebar
function toggleAccordion(element) {
    element.classList.toggle('active');
    const content = element.nextElementSibling;
    content.classList.toggle('show');
    
    if (content.classList.contains('show')) {
        content.style.maxHeight = content.scrollHeight + "px";
    } else {
        content.style.maxHeight = "0px";
    }
}

// Buka accordion default (Daftar Perangkat)
document.addEventListener('DOMContentLoaded', function() {
    const defaultOpen = document.querySelector('.accordion-header.active');
    if (defaultOpen) {
        const content = defaultOpen.nextElementSibling;
        content.classList.add('show');
        content.style.maxHeight = content.scrollHeight + "px";
    }
});