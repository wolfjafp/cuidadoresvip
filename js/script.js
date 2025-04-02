// Función autoejecutable para encapsular el código
(function() {
    'use strict';

    // --- Variables Constantes ---
    // Número de WhatsApp de CUIDADORESVIP.CL para recibir consultas
    const WHATSAPP_NUMBER = '56978937482'; // *** NÚMERO ACTUALIZADO ***
    const PREFILLED_MESSAGE_HEADER = "¡Hola Cuidadores VIP! 👋 Quiero cotizar/consultar por sus servicios:";

    // --- Selectores de Elementos Comunes ---
    const currentYearElement = document.getElementById('current-year');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    const contactForm = document.getElementById('contact-form');
    const formFeedback = document.getElementById('form-feedback');
    const planButtons = document.querySelectorAll('.plan-cta'); // Botones de planes

    // --- Funciones ---

    /**
     * Actualiza el año en el elemento del footer.
     */
    function updateFooterYear() {
        if (currentYearElement) {
            try {
                currentYearElement.textContent = new Date().getFullYear();
            } catch (error) {
                console.error("Error actualizando el año en el footer:", error);
            }
        }
    }

    /**
     * Alterna la visibilidad del menú de navegación móvil.
     * Gestiona clases y atributos ARIA.
     */
    function toggleMobileMenu() {
        if (!mainNav || !mobileMenuToggle) {
            console.warn("Elementos del menú móvil no encontrados.");
            return;
        }
        try {
            const isExpanded = mainNav.classList.toggle('active');
            mobileMenuToggle.setAttribute('aria-expanded', isExpanded.toString());
            const icon = mobileMenuToggle.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-bars', !isExpanded);
                icon.classList.toggle('fa-times', isExpanded);
            }
        } catch (error) {
            console.error("Error al alternar el menú móvil:", error);
        }
    }

    /**
     * Maneja el envío del formulario de contacto de Cuidadores VIP.
     * Prepara y abre el enlace de WhatsApp con los datos.
     * @param {Event} event - El evento de envío del formulario.
     */
    function handleContactFormSubmit(event) {
        event.preventDefault(); // Prevenir el envío normal

        if (!contactForm || !formFeedback) {
             console.warn("Formulario de contacto o elemento de feedback no encontrado.");
             return;
        }

        try {
            formFeedback.textContent = ''; // Limpiar feedback previo
            formFeedback.className = 'form-feedback'; // Resetear clases

            // Obtener valores de los campos del formulario CUIDADORESVIP
            const name = contactForm.elements['name']?.value?.trim() ?? '';
            const phone = contactForm.elements['phone']?.value?.trim() ?? '';
            const email = contactForm.elements['email']?.value?.trim() ?? ''; // Opcional
            const comuna = contactForm.elements['comuna']?.value?.trim() ?? '';
            const petType = contactForm.elements['pet-type']?.value ?? '';
            const servicePlan = contactForm.elements['service-plan']?.value ?? '';
            const dates = contactForm.elements['dates']?.value?.trim() ?? ''; // Opcional
            const message = contactForm.elements['message']?.value?.trim() ?? '';

            // --- Validación ---
            let firstInvalidField = null;

            // 1. Usar checkValidity() para campos requeridos básicos (HTML5)
            if (!contactForm.checkValidity()) {
                formFeedback.textContent = '¡Ojo! Parece que falta completar algunos campos obligatorios (*).';
                formFeedback.classList.add('error');
                contactForm.reportValidity(); // Muestra mensajes nativos del navegador
                firstInvalidField = contactForm.querySelector(':invalid');
                if (firstInvalidField) {
                    // Scroll suave hacia el campo inválido si es posible
                     try {
                        firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                     } catch(e) {
                         // Si falla el scroll, solo enfocar
                        firstInvalidField.focus();
                     }
                }
                return;
            }

            // Validación de teléfono eliminada para mayor flexibilidad


            // --- Construcción del Mensaje WhatsApp ---
            let whatsappMessage = `${PREFILLED_MESSAGE_HEADER}

*Nombre:* ${name}
*Teléfono:* ${phone}`;

            if (email) { // Añadir email solo si fue ingresado
                whatsappMessage += `\n*Email:* ${email}`;
            }

            whatsappMessage += `
*Comuna:* ${comuna}
*Mascota(s):* ${petType}
*Plan/Horas:* ${servicePlan}`;

            if (dates) { // Añadir fechas solo si fueron ingresadas
                whatsappMessage += `\n*Fechas Estimadas:* ${dates}`;
            }

            whatsappMessage += `

*Mensaje Adicional:*
${message}`;

            // --- Generar y Abrir Enlace WhatsApp ---
            const encodedMessage = encodeURIComponent(whatsappMessage);
            const cleanPhoneNumber = WHATSAPP_NUMBER.replace(/[^0-9]/g, ''); // Limpiar el número destino

            if (!cleanPhoneNumber) {
                 console.error("Número de WhatsApp destino no válido:", WHATSAPP_NUMBER);
                 formFeedback.textContent = 'Error configurando el enlace de contacto. Avísanos por favor.';
                 formFeedback.classList.add('error');
                 return;
            }

            const whatsappURL = `https://wa.me/${cleanPhoneNumber}?text=${encodedMessage}`;

            formFeedback.textContent = '¡Genial! Preparando tu mensaje para WhatsApp... 🐾';
            formFeedback.classList.add('success');

            // Abrir WhatsApp en nueva pestaña/app
            const whatsappWindow = window.open(whatsappURL, '_blank', 'noopener,noreferrer');

             // Si falla la apertura (pop-up bloqueado), informar al usuario
             if (!whatsappWindow || whatsappWindow.closed || typeof whatsappWindow.closed == 'undefined') {
                // Dar un pequeño margen por si tarda en abrir
                setTimeout(() => {
                    // Volver a chequear si realmente no se abrió
                    if (!whatsappWindow || whatsappWindow.closed || typeof whatsappWindow.closed == 'undefined') {
                         formFeedback.textContent = 'Parece que tu navegador bloqueó la ventana de WhatsApp. ¡Intenta de nuevo o contáctanos directamente!';
                         formFeedback.classList.remove('success');
                         formFeedback.classList.add('error');
                    }
                }, 1000); // Esperar 1 segundo
            }


             // Opcional: Resetear formulario después de un breve tiempo
             /*
             setTimeout(() => {
                 if (contactForm) { contactForm.reset(); }
                 if (formFeedback) {
                    formFeedback.textContent = '';
                    formFeedback.className = 'form-feedback';
                 }
             }, 4000); // Resetear después de 4 segundos
             */


        } catch (error) {
            console.error("Error procesando el formulario de contacto:", error);
            formFeedback.textContent = '¡Ups! Hubo un problema técnico al enviar tu consulta. Intenta de nuevo o contáctanos directo.';
            formFeedback.classList.add('error');
        }
    }

    /**
     * Maneja el clic en los botones de los planes para autoseleccionar
     * la opción en el formulario y hacer scroll.
     * @param {Event} event
     */
    function handlePlanButtonClick(event) {
        event.preventDefault(); // Prevenir navegación si el href es solo #contacto

        const planValue = event.target.dataset.plan; // Obtener valor desde data-plan
        const planSelectElement = contactForm.elements['service-plan'];
        const contactSection = document.getElementById('contacto');

        if (planValue && planSelectElement) {
            planSelectElement.value = planValue; // Establecer el valor en el select
        }

        // Hacer scroll suave hasta la sección de contacto
        if (contactSection) {
             // Pequeño retraso para asegurar que el valor se establezca antes del scroll
            setTimeout(() => {
                 contactSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 // Opcional: Enfocar el primer campo del formulario después del scroll
                 const firstInput = contactForm.querySelector('input:not([type="hidden"]), select, textarea');
                 if (firstInput) {
                    // firstInput.focus(); // Puede ser molesto a veces, probar si gusta
                 }
            }, 100);
        } else {
            console.warn("Sección de contacto no encontrada para hacer scroll.");
        }
    }

    // --- Inicialización y Event Listeners ---

    document.addEventListener('DOMContentLoaded', () => {
        updateFooterYear(); // Actualizar año en footer

        // Manejo del menú móvil
        if (mobileMenuToggle && mainNav) {
            mobileMenuToggle.addEventListener('click', toggleMobileMenu);
            // Asegurar estado inicial correcto del menú móvil
            if (window.innerWidth <= 992) {
                mainNav.classList.remove('active');
                mobileMenuToggle.setAttribute('aria-expanded', 'false');
                const icon = mobileMenuToggle.querySelector('i');
                 if(icon){
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                 }
            }
        } else {
             console.warn("Elementos del menú móvil (toggle o nav) no encontrados.");
        }

        // Manejo del formulario de contacto
        if (contactForm) {
            contactForm.addEventListener('submit', handleContactFormSubmit);
        } else {
             console.warn("Formulario de contacto no encontrado.");
        }

        // Añadir listener a los botones de planes
        if (planButtons.length > 0 && contactForm) { // Asegurar que exista el form también
            planButtons.forEach(button => button.addEventListener('click', handlePlanButtonClick));
        } else if (!contactForm) {
            console.warn("Formulario de contacto no encontrado, no se pudo añadir listeners a botones de plan.");
        }

        console.log("CUIDADORESVIP.CL script inicializado (v. con correcciones).");
    });

})(); // Fin de la función autoejecutable