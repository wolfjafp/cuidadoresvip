/**
 * CuidadoresVIP - Script Principal
 * Versión: 1.2
 * Fecha: 2025
 * Optimizado para rendimiento
 */

document.addEventListener('DOMContentLoaded', function() {
    // Cache de selectores DOM para mejorar rendimiento
    const header = document.querySelector('.header');
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');
    const scrollLinks = document.querySelectorAll('.scroll-link');
    const backToTop = document.querySelector('.back-to-top');
    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    const contactForm = document.getElementById('contact-form');
    const formMessage = contactForm ? contactForm.querySelector('.form-message') : null;
    const whatsappBtn = document.getElementById('enviar-whatsapp');
    
    // Función para manejar el scroll con throttling para mejorar el rendimiento
    let lastScrollTime = 0;
    let ticking = false;
    
    function handleScroll() {
        const scrollY = window.scrollY;
        
        if (!ticking) {
            window.requestAnimationFrame(() => {
                // Header fijo al hacer scroll
                if (scrollY > 100) {
                    header.classList.add('scrolled');
                    if (backToTop) backToTop.classList.add('active');
                } else {
                    header.classList.remove('scrolled');
                    if (backToTop) backToTop.classList.remove('active');
                }
                
                ticking = false;
            });
            
            ticking = true;
        }
    }
    
    // Usar IntersectionObserver para las animaciones de scroll
    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                animationObserver.unobserve(entry.target); // Dejar de observar una vez animado
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    // Observar elementos para animación
    animatedElements.forEach(el => {
        if (!el.classList.contains('animate')) {
            animationObserver.observe(el);
        }
    });
    
    // Menú móvil con mejoras de accesibilidad
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            const isExpanded = navLinks.classList.contains('active');
            navLinks.classList.toggle('active');
            mobileToggle.classList.toggle('active');
            
            // Actualizar atributos ARIA
            mobileToggle.setAttribute('aria-expanded', !isExpanded);
            
            // Anunciar cambio para lectores de pantalla
            const statusText = isExpanded ? 'Menú cerrado' : 'Menú abierto';
            const statusAnnouncer = document.createElement('div');
            statusAnnouncer.className = 'sr-only';
            statusAnnouncer.setAttribute('aria-live', 'polite');
            statusAnnouncer.textContent = statusText;
            document.body.appendChild(statusAnnouncer);
            
            // Eliminar después de anunciar
            setTimeout(() => {
                document.body.removeChild(statusAnnouncer);
            }, 1000);
        });
        
        // Cerrar menú con Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                mobileToggle.classList.remove('active');
                mobileToggle.setAttribute('aria-expanded', 'false');
                mobileToggle.focus(); // Devolver el foco al botón
            }
        });
    }
    
    // Scroll suave con mejoras de accesibilidad
    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Cerrar menú móvil si está abierto
            if (navLinks && navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
                if (mobileToggle) {
                    mobileToggle.classList.remove('active');
                    mobileToggle.setAttribute('aria-expanded', 'false');
                }
            }
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                // Scroll suave
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Agregar el hash a la URL sin causar un salto
                history.pushState(null, null, targetId);
                
                // Establecer el foco en el elemento de destino para accesibilidad
                targetElement.setAttribute('tabindex', '-1');
                targetElement.focus({ preventScroll: true });
                
                // Eliminar el tabindex después de enfocar
                setTimeout(() => {
                    targetElement.removeAttribute('tabindex');
                }, 1000);
            }
        });
    });
    
    // Botón volver arriba con mejoras de accesibilidad
    if (backToTop) {
        backToTop.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            // Enfocar el primer elemento de la página para accesibilidad
            const firstFocusable = document.querySelector('header a');
            if (firstFocusable) {
                setTimeout(() => {
                    firstFocusable.focus();
                }, 500);
            }
        });
    }
    
    // Validación de formulario optimizada
    function validateForm(form) {
        let isValid = true;
        const inputs = form.querySelectorAll('input, select, textarea');
        
        inputs.forEach(input => {
            if (input.hasAttribute('required') && !input.value.trim()) {
                isValid = false;
                input.classList.add('error');
                
                // Añadir mensaje de error accesible
                let errorMsg = input.nextElementSibling;
                if (!errorMsg || !errorMsg.classList.contains('error-message')) {
                    errorMsg = document.createElement('div');
                    errorMsg.className = 'error-message';
                    errorMsg.setAttribute('aria-live', 'polite');
                    input.parentNode.insertBefore(errorMsg, input.nextSibling);
                }
                errorMsg.textContent = `Por favor, complete este campo.`;
            } else {
                input.classList.remove('error');
                const errorMsg = input.nextElementSibling;
                if (errorMsg && errorMsg.classList.contains('error-message')) {
                    errorMsg.textContent = '';
                }
            }
        });
        
        return isValid;
    }
    
    // Botón de WhatsApp con validación de formulario y CAPTCHA
    if (whatsappBtn && contactForm) {
        whatsappBtn.addEventListener('click', function() {
            if (validateForm(contactForm)) {
                try {
                    // Verificar CAPTCHA - Manejo mejorado para evitar errores
                    const captchaResponse = grecaptcha && grecaptcha.getResponse ? grecaptcha.getResponse() : '';
                    
                    if (!captchaResponse) {
                        // CAPTCHA no completado
                        formMessage.textContent = 'Por favor, completa el CAPTCHA para verificar que no eres un robot.';
                        formMessage.className = 'form-message error';
                        formMessage.setAttribute('role', 'alert');
                        
                        // Añadir efecto de shake al CAPTCHA para llamar la atención
                        const captchaContainer = document.querySelector('.captcha-container');
                        if (captchaContainer) {
                            captchaContainer.classList.add('shake');
                            setTimeout(() => {
                                captchaContainer.classList.remove('shake');
                            }, 820);
                            
                            // Scroll al CAPTCHA
                            captchaContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                        
                        return false;
                    }
                    
                    // Recoger datos del formulario
                    const nombre = document.getElementById('nombre').value;
                    const mascota = document.getElementById('mascota').value;
                    const servicio = document.getElementById('servicio').value;
                    const mensaje = document.getElementById('mensaje').value;
                    
                    // Construir mensaje para WhatsApp
                    let whatsappMessage = `Hola, soy ${nombre}. `;
                    whatsappMessage += `Mi mascota es ${mascota}. `;
                    whatsappMessage += `Estoy interesado/a en el servicio: ${servicio}. `;
                    whatsappMessage += `Mensaje adicional: ${mensaje}`;
                    
                    // Codificar mensaje para URL
                    const encodedMessage = encodeURIComponent(whatsappMessage);
                    const whatsappUrl = `https://wa.me/51918647921?text=${encodedMessage}`;
                    
                    // Mostrar mensaje de éxito
                    formMessage.textContent = '¡Gracias! Redirigiendo a WhatsApp...';
                    formMessage.className = 'form-message success';
                    formMessage.setAttribute('role', 'status');
                    
                    // Añadir animación al botón de WhatsApp
                    whatsappBtn.classList.add('pulse');
                    
                    // Redireccionar a WhatsApp después de un breve retraso
                    setTimeout(function() {
                        window.open(whatsappUrl, '_blank');
                        
                        // Limpiar el formulario
                        contactForm.reset();
                        
                        // Resetear el CAPTCHA
                        if (grecaptcha && grecaptcha.reset) {
                            grecaptcha.reset();
                        }
                        
                        // Quitar la animación
                        whatsappBtn.classList.remove('pulse');
                    }, 1000);
                    
                } catch (error) {
                    console.error('Error al procesar el formulario:', error);
                    formMessage.textContent = 'Ha ocurrido un error. Por favor, intenta nuevamente.';
                    formMessage.className = 'form-message error';
                    formMessage.setAttribute('role', 'alert');
                }
            } else {
                formMessage.textContent = 'Por favor, completa todos los campos requeridos.';
                formMessage.className = 'form-message error';
                formMessage.setAttribute('role', 'alert');
                
                // Scroll al primer campo con error
                const firstError = contactForm.querySelector('.error');
                if (firstError) {
                    firstError.focus();
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    }
    
    // Validación en tiempo real para formularios
    if (contactForm) {
        const inputs = contactForm.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                if (input.hasAttribute('required') && !input.value.trim()) {
                    input.classList.add('error');
                    
                    // Añadir mensaje de error
                    let errorMsg = input.nextElementSibling;
                    if (!errorMsg || !errorMsg.classList.contains('error-message')) {
                        errorMsg = document.createElement('div');
                        errorMsg.className = 'error-message';
                        errorMsg.setAttribute('aria-live', 'polite');
                        input.parentNode.insertBefore(errorMsg, input.nextSibling);
                    }
                    errorMsg.textContent = `Por favor, complete este campo.`;
                } else {
                    input.classList.remove('error');
                    const errorMsg = input.nextElementSibling;
                    if (errorMsg && errorMsg.classList.contains('error-message')) {
                        errorMsg.textContent = '';
                    }
                }
            });
        });
    }
    
    // Contador de estadísticas con IntersectionObserver
    const counters = document.querySelectorAll('.counter');
    if (counters.length > 0) {
        const counterObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const counter = entry.target;
                    const target = parseInt(counter.getAttribute('data-target'));
                    const duration = 2000; // ms
                    const increment = target / (duration / 16); // 60fps
                    
                    const updateCounter = () => {
                        const count = parseInt(counter.innerText);
                        if (count < target) {
                            counter.innerText = Math.ceil(count + increment);
                            requestAnimationFrame(updateCounter);
                        } else {
                            counter.innerText = target;
                        }
                    };
                    
                    updateCounter();
                    counterObserver.unobserve(counter);
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(counter => {
            counterObserver.observe(counter);
        });
    }
    
    // Lightbox para la galería con rendimiento optimizado
    function initLightbox() {
        const galleryItems = document.querySelectorAll('.gallery-item');
        if (galleryItems.length === 0) return;
        
        // Crear lightbox solo cuando se necesite (lazy initialization)
        let lightbox = null;
        let lightboxImg = null;
        let currentIndex = 0;
        
        function createLightbox() {
            // Crear el lightbox solo una vez
            if (lightbox) return;
            
            lightbox = document.createElement('div');
            lightbox.className = 'lightbox';
            lightbox.innerHTML = `
                <button class="lightbox-close" aria-label="Cerrar imagen"><i class="fas fa-times"></i></button>
                <button class="lightbox-prev" aria-label="Imagen anterior"><i class="fas fa-chevron-left"></i></button>
                <button class="lightbox-next" aria-label="Imagen siguiente"><i class="fas fa-chevron-right"></i></button>
                <div class="lightbox-content">
                    <img src="" alt="Imagen ampliada" class="lightbox-img">
                </div>
            `;
            
            document.body.appendChild(lightbox);
            lightboxImg = lightbox.querySelector('.lightbox-img');
            
            // Eventos del lightbox
            lightbox.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
            lightbox.querySelector('.lightbox-prev').addEventListener('click', prevImage);
            lightbox.querySelector('.lightbox-next').addEventListener('click', nextImage);
            
            // Cerrar con Escape
            document.addEventListener('keydown', function(e) {
                if (!lightbox.classList.contains('active')) return;
                
                if (e.key === 'Escape') {
                    closeLightbox();
                } else if (e.key === 'ArrowLeft') {
                    prevImage();
                } else if (e.key === 'ArrowRight') {
                    nextImage();
                }
            });
            
            // Cerrar al hacer clic fuera de la imagen
            lightbox.addEventListener('click', function(e) {
                if (e.target === lightbox) {
                    closeLightbox();
                }
            });
        }
        
        function openLightbox(index) {
            createLightbox();
            currentIndex = index;
            
            const imgSrc = galleryItems[index].querySelector('img').src;
            const imgAlt = galleryItems[index].querySelector('img').alt;
            
            // Precargar imagen
            const img = new Image();
            img.src = imgSrc;
            img.onload = function() {
                lightboxImg.src = imgSrc;
                lightboxImg.alt = imgAlt;
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden'; // Prevenir scroll
            };
        }
        
        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = ''; // Restaurar scroll
            
            // Devolver el foco al elemento que abrió el lightbox
            galleryItems[currentIndex].focus();
        }
        
        function nextImage() {
            currentIndex = (currentIndex + 1) % galleryItems.length;
            updateLightboxImage();
        }
        
        function prevImage() {
            currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
            updateLightboxImage();
        }
        
        function updateLightboxImage() {
            const imgSrc = galleryItems[currentIndex].querySelector('img').src;
            const imgAlt = galleryItems[currentIndex].querySelector('img').alt;
            
            // Efecto de transición
            lightboxImg.style.opacity = '0';
            
            setTimeout(() => {
                lightboxImg.src = imgSrc;
                lightboxImg.alt = imgAlt;
                lightboxImg.style.opacity = '1';
            }, 300);
        }
        
        // Asignar eventos a las imágenes de la galería
        galleryItems.forEach((item, index) => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                openLightbox(index);
            });
            
            // Accesibilidad: abrir con Enter
            item.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    openLightbox(index);
                }
            });
        });
    }
    
    // Selector de servicios interactivo
    function initServiceSelector() {
        const serviceOptions = document.querySelectorAll('.service-option');
        const serviceDetails = document.querySelectorAll('.service-detail-content');
        
        if (serviceOptions.length === 0) return;
        
        // Ocultar todos los planes primero
        serviceDetails.forEach(detail => {
            detail.classList.remove('active');
        });
        
        // Mostrar solo el plan estándar (recomendado) por defecto
        const recommendedOption = document.querySelector('.service-option.recommended');
        if (recommendedOption) {
            const plan = recommendedOption.getAttribute('data-plan');
            recommendedOption.classList.add('active');
            const detailElement = document.getElementById(`plan-${plan}`);
            if (detailElement) {
                detailElement.classList.add('active');
            }
        } else if (serviceOptions[0] && serviceDetails[0]) {
            // Si no hay plan recomendado, mostrar el primero
            serviceOptions[0].classList.add('active');
            serviceDetails[0].classList.add('active');
        }
        
        serviceOptions.forEach(option => {
            option.addEventListener('click', function() {
                const plan = this.getAttribute('data-plan');
                
                // Desactivar todos
                serviceOptions.forEach(opt => opt.classList.remove('active'));
                serviceDetails.forEach(detail => detail.classList.remove('active'));
                
                // Activar el seleccionado
                this.classList.add('active');
                document.getElementById(`plan-${plan}`).classList.add('active');
            });
        });
    }
    
    // Inicializar componentes
    initLightbox();
    initServiceSelector();
    
    // Registrar eventos globales una sola vez
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Ejecutar handleScroll una vez para establecer el estado inicial
    handleScroll();
    
    // Mejoras de rendimiento y seguridad
    document.addEventListener('DOMContentLoaded', function() {
        // CSP (Content Security Policy)
        const cspMeta = document.createElement('meta');
        cspMeta.httpEquiv = 'Content-Security-Policy';
        cspMeta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://www.google-analytics.com;";
        document.head.appendChild(cspMeta);
        
        // Lazy loading de imágenes
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            const io = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        io.unobserve(img);
                    }
                });
            }, { threshold: 0.1 });
            io.observe(img);
        });
        
        // Optimización de recursos
        const criticalCSS = document.createElement('style');
        criticalCSS.textContent = `
            .hero-section {
                background-color: var(--bg-light);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .hero-content {
                max-width: 800px;
                padding: 2rem;
                text-align: center;
            }
        `;
        document.head.appendChild(criticalCSS);
        
        // Optimización de scroll
        let lastScroll = 0;
        const throttle = (callback, limit) => {
            let inThrottle;
            return function() {
                if (!inThrottle) {
                    callback.apply(this, arguments);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        };
        
        const handleScroll = throttle(() => {
            const currentScroll = window.pageYOffset;
            if (currentScroll <= 0) {
                document.body.classList.remove('scroll-up');
                return;
            }
            if (currentScroll > lastScroll && !document.body.classList.contains('scroll-down')) {
                document.body.classList.remove('scroll-up');
                document.body.classList.add('scroll-down');
            } else if (currentScroll < lastScroll && document.body.classList.contains('scroll-down')) {
                document.body.classList.remove('scroll-down');
                document.body.classList.add('scroll-up');
            }
            lastScroll = currentScroll;
        }, 100);
        
        window.addEventListener('scroll', handleScroll);
        
        // Mejoras de accesibilidad
        const focusableElements = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('user-is-tabbing');
                window.setTimeout(() => document.body.classList.remove('user-is-tabbing'), 5000);
            }
        });
        
        // Mejoras de rendimiento para animaciones
        const animateOnScroll = () => {
            const elements = document.querySelectorAll('.animate-on-scroll');
            elements.forEach(element => {
                const elementTop = element.getBoundingClientRect().top;
                const elementBottom = element.getBoundingClientRect().bottom;
                
                if (elementTop < window.innerHeight && elementBottom > 0) {
                    element.classList.add('animate');
                }
            });
        };
        
        window.addEventListener('scroll', throttle(animateOnScroll, 100));
        animateOnScroll(); // Ejecutar inicialmente
    });
});
