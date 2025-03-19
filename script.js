const pages = document.querySelectorAll('.page');
const totalPages = pages.length;
let currentPage = 1;

// Initialize page visibility
function initializePages() {
    pages.forEach((page, index) => {
        // Set initial state for all pages except the first one
        if (index > 0) {
            page.classList.add('flip');
        }
        // Ensure all pages are visible
        page.style.display = 'block';
    });
}

// Update page counter and button visibility
function updatePageState() {
    document.getElementById('current-page').textContent = currentPage;
    document.getElementById('total-pages').textContent = totalPages;
    
    // Hide/show navigation buttons based on current page
    const prevButton = document.querySelector('.navigation-buttons button.prev');
    const nextButton = document.querySelector('.navigation-buttons button.next');
    
    // Handle previous button visibility
    if (currentPage === 1) {
        prevButton.classList.add('hidden');
    } else {
        prevButton.classList.remove('hidden');
    }
    
    // Handle next button visibility
    if (currentPage === totalPages) {
        nextButton.classList.add('hidden');
    } else {
        nextButton.classList.remove('hidden');
    }

    // Update page visibility
    pages.forEach((page, index) => {
        if (index < currentPage - 1) {
            page.classList.add('flip');
        } else if (index >= currentPage - 1) {
            page.classList.remove('flip');
        }
    });
}

// Go to the next page
function nextPage() {
    if (currentPage < totalPages) {
        // Hide navigation buttons
        document.querySelector('.navigation-buttons').classList.add('hide-nav');
        
        // Flip the current page
        pages[currentPage - 1].classList.add('flip');
        currentPage++;
        
        // Show navigation buttons after animation
        setTimeout(() => {
            document.querySelector('.navigation-buttons').classList.remove('hide-nav');
            updatePageState();
        }, 500); // Match this with the page flip transition duration
    }
}

// Go to the previous page
function previousPage() {
    if (currentPage > 1) {
        // Hide navigation buttons
        document.querySelector('.navigation-buttons').classList.add('hide-nav');
        
        // Unflip the previous page
        pages[currentPage - 2].classList.remove('flip');
        currentPage--;
        
        // Show navigation buttons after animation
        setTimeout(() => {
            document.querySelector('.navigation-buttons').classList.remove('hide-nav');
            updatePageState();
        }, 700); // Match this with the page flip transition duration
    }
}

// Handle mouse wheel scroll with debounce
let wheelTimeout;
window.addEventListener('wheel', (e) => {
    if (wheelTimeout) clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(() => {
        if (e.deltaY > 0) {
            nextPage();
        } else if (e.deltaY < 0) {
            previousPage();
        }
    }, 50);
});

// Handle touch swipe
let touchStartX = 0;
window.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
});

window.addEventListener('touchend', (e) => {
    const touchEndX = e.changedTouches[0].clientX;
    if (touchStartX - touchEndX > 50) {
        nextPage();
    } else if (touchStartX - touchEndX < -50) {
        previousPage();
    }
});

// Theme Toggle Functionality
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcon(theme);
}

function toggleTheme() {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
}

function updateThemeIcon(theme) {
    const themeIcon = document.querySelector('.theme-toggle i');
    themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

// Initialize theme
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

// Initialize
initializePages();
updatePageState();
initializeTheme();

// Smooth scroll for menu links
document.querySelectorAll('.menu-item').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        targetSection.scrollIntoView({ behavior: 'smooth' });
    });
});


//portfolio
function scrollLeft() {
    document.querySelector('.portfolio-container').scrollBy({
        left: -300,
        behavior: 'smooth'
    });
}

function scrollRight() {
    document.querySelector('.portfolio-container').scrollBy({
        left: 300,
        behavior: 'smooth'
    });
}