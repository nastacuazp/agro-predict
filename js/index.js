document.addEventListener('DOMContentLoaded', function() {
    const links = document.querySelectorAll('nav a');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            // Remover la clase 'active' de todos los enlaces
            links.forEach(l => l.classList.remove('active'));
            
            // Agregar la clase 'active' al enlace clickeado
            this.classList.add('active');
            
            // Si el enlace es "Inicio" o "Predicción", no prevenimos el comportamiento por defecto
            if (this.id === 'resumen-link') {
                e.preventDefault();
                document.querySelector('#resumen').scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Establecer el enlace activo basado en la URL actual
    const currentPath = window.location.pathname;
    if (currentPath.includes('prediccion.html')) {
        document.getElementById('prediccion-link').classList.add('active');
    } else if (currentPath === '/' || currentPath.includes('index.html')) {
        document.getElementById('inicio-link').classList.add('active');
    }

    // Verificar si el hash en la URL corresponde a #resumen
    if (window.location.hash === '#resumen') {
        document.getElementById('resumen-link').classList.add('active');
    }
});