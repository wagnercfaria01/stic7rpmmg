// ====================================
// MENU MOBILE - VERSÃO SIMPLES E GARANTIDA
// ====================================

// Toggle menu mobile
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const btn = document.querySelector('.mobile-menu-btn');
    
    if (sidebar) {
        const isOpen = sidebar.classList.contains('mobile-open');
        
        if (isOpen) {
            // Fechar
            sidebar.classList.remove('mobile-open');
            sidebar.style.transform = 'translateX(-100%)';
            if (overlay) overlay.classList.remove('active');
            if (btn) btn.classList.remove('active');
        } else {
            // Abrir
            sidebar.classList.add('mobile-open');
            sidebar.style.transform = 'translateX(0)';
            sidebar.style.display = 'block';
            sidebar.style.visibility = 'visible';
            sidebar.style.opacity = '1';
            sidebar.style.zIndex = '1001';
            sidebar.style.background = '#ffffff';
            
            if (overlay) overlay.classList.add('active');
            if (btn) btn.classList.add('active');
        }
    }
}

// Fechar menu ao clicar em um link (somente mobile)
document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('.sidebar a');
    
    links.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('sidebar');
                const overlay = document.getElementById('sidebarOverlay');
                const btn = document.querySelector('.mobile-menu-btn');
                
                if (sidebar) sidebar.classList.remove('mobile-open');
                if (overlay) overlay.classList.remove('active');
                if (btn) btn.classList.remove('active');
            }
        });
    });
});

// Fechar ao redimensionar tela
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        const btn = document.querySelector('.mobile-menu-btn');
        
        if (sidebar) sidebar.classList.remove('mobile-open');
        if (overlay) overlay.classList.remove('active');
        if (btn) btn.classList.remove('active');
    }
});
