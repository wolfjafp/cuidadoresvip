/**
 * WhatsApp Integration - CuidadoresVIP
 * v1.0.0 - optimizado para rendimiento
 * Integración de formulario de contacto con WhatsApp
 */

(function() {
  'use strict';

  // Número de WhatsApp del negocio (formato internacional)
  const whatsappNumber = '+56912345678'; // Actualizar con el número real
  
  // Códigos de servicio para facilitar el seguimiento
  const serviceCodes = {
    'basico': 'CV-B1',
    'estandar': 'CV-E1',
    'premium': 'CV-P1'
  };

  // Caché de elementos DOM
  let contactForm = null;
  let serviceTypeInputs = null;
  let submitButton = null;
  let recaptchaToken = null;
  
  // Inicializar cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', init);
  
  /**
   * Inicializar la integración con WhatsApp
   */
  function init() {
    contactForm = document.getElementById('contact-form');
    serviceTypeInputs = document.querySelectorAll('input[name="service-type"]');
    submitButton = document.querySelector('#contact-form button[type="submit"]');
    
    if (!contactForm) return;
    
    // Asignar evento de envío al formulario
    contactForm.addEventListener('submit', handleFormSubmit);
    
    // Asignar evento de cambio a los inputs de tipo de servicio
    serviceTypeInputs.forEach(input => {
      input.addEventListener('change', updateSubmitButton);
    });
    
    // Inicializar estado del botón
    updateSubmitButton();
    
    // Observador para detectar cuando reCAPTCHA se ha completado
    if (window.grecaptcha) {
      try {
        grecaptcha.ready(function() {
          // Verificar cada 5 segundos si el token está disponible
          const recaptchaInterval = setInterval(function() {
            if (grecaptcha.getResponse()) {
              recaptchaToken = grecaptcha.getResponse();
              clearInterval(recaptchaInterval);
            }
          }, 5000);
        });
      } catch (e) {
        console.warn('Error al inicializar reCAPTCHA:', e);
      }
    }
  }
  
  /**
   * Actualizar el texto del botón de envío según el servicio seleccionado
   */
  function updateSubmitButton() {
    if (!submitButton) return;
    
    let selectedService = getSelectedService();
    if (selectedService) {
      submitButton.textContent = `Solicitar presupuesto para servicio ${selectedService}`;
      submitButton.disabled = false;
    } else {
      submitButton.textContent = 'Selecciona un servicio';
      submitButton.disabled = true;
    }
  }
  
  /**
   * Obtener el servicio seleccionado
   * @returns {string|null} Nombre del servicio seleccionado o null
   */
  function getSelectedService() {
    for (const input of serviceTypeInputs) {
      if (input.checked) {
        return input.value;
      }
    }
    return null;
  }
  
  /**
   * Manejar el envío del formulario
   * @param {Event} event - Evento de envío
   */
  function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!validateForm()) {
      showFormError('Por favor, completa todos los campos obligatorios');
      return;
    }
    
    // Verificar reCAPTCHA si está configurado
    if (window.grecaptcha && !recaptchaToken) {
      showFormError('Por favor, completa la verificación de seguridad');
      return;
    }
    
    // Obtener datos del formulario
    const formData = new FormData(contactForm);
    const formFields = {};
    
    for (const [key, value] of formData.entries()) {
      formFields[key] = value;
    }
    
    // Generar mensaje para WhatsApp
    const message = formatWhatsAppMessage(formFields);
    
    // Crear URL de WhatsApp
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    // Mostrar indicador de carga
    submitButton.innerHTML = '<span class="loading-indicator"></span> Redirigiendo...';
    submitButton.disabled = true;
    
    // Registrar la conversión (opcional si se usa Google Analytics)
    if (window.gtag) {
      gtag('event', 'conversion', {
        'send_to': 'AW-CONVERSION_ID/CONVERSION_LABEL',
        'event_callback': function() {
          redirectToWhatsApp(whatsappUrl);
        }
      });
      
      // Timeout de seguridad por si falla el callback de Analytics
      setTimeout(function() {
        redirectToWhatsApp(whatsappUrl);
      }, 1500);
    } else {
      // Redireccionar inmediatamente si no hay Analytics
      redirectToWhatsApp(whatsappUrl);
    }
  }
  
  /**
   * Validar el formulario
   * @returns {boolean} Verdadero si el formulario es válido
   */
  function validateForm() {
    const requiredFields = contactForm.querySelectorAll('[required]');
    
    for (const field of requiredFields) {
      if (!field.value.trim()) {
        field.classList.add('error');
        field.addEventListener('input', function() {
          this.classList.remove('error');
        }, { once: true });
        return false;
      }
    }
    
    // Validar formato de email si hay campo de email
    const emailField = contactForm.querySelector('input[type="email"]');
    if (emailField && emailField.value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailField.value)) {
        emailField.classList.add('error');
        emailField.addEventListener('input', function() {
          this.classList.remove('error');
        }, { once: true });
        return false;
      }
    }
    
    // Validar que se haya seleccionado un servicio
    if (!getSelectedService()) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Mostrar error en el formulario
   * @param {string} message - Mensaje de error
   */
  function showFormError(message) {
    let errorEl = document.querySelector('.form-error');
    
    if (!errorEl) {
      errorEl = document.createElement('div');
      errorEl.className = 'form-error shake-effect';
      contactForm.prepend(errorEl);
    }
    
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    
    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
      errorEl.style.display = 'none';
    }, 5000);
  }
  
  /**
   * Formatear mensaje para WhatsApp
   * @param {Object} data - Datos del formulario
   * @returns {string} Mensaje formateado
   */
  function formatWhatsAppMessage(data) {
    const serviceType = data['service-type'] || 'No especificado';
    const serviceCode = serviceCodes[serviceType] || 'CV-X';
    const petType = data['pet-type'] || 'No especificado';
    const petCount = data['pet-count'] || '1';
    
    let message = `🐾 *Nueva solicitud de CuidadoresVIP* 🐾\n`;
    message += `Ref: ${serviceCode}-${Date.now().toString().slice(-6)}\n\n`;
    message += `👤 *Datos del cliente*\n`;
    message += `Nombre: ${data.name || 'No especificado'}\n`;
    message += `Teléfono: ${data.phone || 'No especificado'}\n`;
    
    if (data.email) {
      message += `Email: ${data.email}\n`;
    }
    
    message += `\n🐶 *Datos de la mascota*\n`;
    message += `Tipo: ${petType}\n`;
    message += `Cantidad: ${petCount}\n`;
    
    message += `\n📋 *Servicio solicitado*\n`;
    message += `Plan: ${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}\n`;
    
    if (data.message) {
      message += `\n💬 *Mensaje*\n${data.message}\n`;
    }
    
    message += `\n🔍 *Datos adicionales*\n`;
    message += `Fecha de solicitud: ${new Date().toLocaleDateString()}\n`;
    message += `Origen: Sitio Web CuidadoresVIP\n`;
    
    return message;
  }
  
  /**
   * Redireccionar a WhatsApp
   * @param {string} url - URL de WhatsApp
   */
  function redirectToWhatsApp(url) {
    // Registrar el evento en localStorage para seguimiento de conversiones
    try {
      localStorage.setItem('whatsapp_contact_sent', Date.now().toString());
      localStorage.setItem('last_service_requested', getSelectedService());
    } catch (e) {
      // Si localStorage no está disponible, continuar sin error
    }
    
    // Abrir WhatsApp en una nueva pestaña
    window.open(url, '_blank');
    
    // Mostrar mensaje de éxito
    submitButton.innerHTML = '✅ Enviado con éxito';
    
    // Resetear formulario después de 2 segundos
    setTimeout(() => {
      contactForm.reset();
      submitButton.textContent = 'Enviar consulta';
      submitButton.disabled = false;
    }, 2000);
  }
})(); 