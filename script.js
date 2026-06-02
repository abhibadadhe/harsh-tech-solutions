document.addEventListener('DOMContentLoaded', () => {
    // 1. Sticky Navbar
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // 2. Mobile Menu Toggle
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    const navBackdrop = document.getElementById('nav-backdrop');

    const setBodyScroll = (disabled) => {
        document.body.classList.toggle('nav-open', disabled);
    };

    const closeMenu = () => {
        navLinks.classList.remove('active');
        if (navBackdrop) {
            navBackdrop.classList.remove('active');
        }
        setBodyScroll(false);
        const bars = hamburger.querySelectorAll('.bar');
        bars[0].style.transform = 'none';
        bars[1].style.opacity = '1';
        bars[2].style.transform = 'none';
    };

    const openMenu = () => {
        navLinks.classList.add('active');
        if (navBackdrop) {
            navBackdrop.classList.add('active');
        }
        setBodyScroll(true);
        const bars = hamburger.querySelectorAll('.bar');
        bars[0].style.transform = 'translateY(8px) rotate(45deg)';
        bars[1].style.opacity = '0';
        bars[2].style.transform = 'translateY(-8px) rotate(-45deg)';
    };

    hamburger.addEventListener('click', () => {
        if (navLinks.classList.contains('active')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    if (navBackdrop) {
        navBackdrop.addEventListener('click', closeMenu);
    }

    // Close mobile menu when clicking outside or on a link
    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navLinks.contains(e.target) && navLinks.classList.contains('active')) {
            closeMenu();
        }
    });

    if (navLinks) {
        const mobileNavLinks = navLinks.querySelectorAll('a');
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                // If this link is the parent dropdown anchor on mobile, allow navigation to the section
                const parentHas = link.closest('.has-dropdown');
                if (window.innerWidth <= 768 && parentHas && parentHas.querySelector(':scope > a') === link) {
                    // Let the anchor navigate to the section, then close the mobile menu
                    if (navLinks.classList.contains('active')) {
                        setTimeout(() => closeMenu(), 60);
                    }
                    return; // don't run the default close logic below
                }

                // Close the mobile nav when any other link is clicked while menu is open.
                if (navLinks.classList.contains('active')) {
                    closeMenu();
                }
            });
        });
    }

    // Allow closing the mobile nav with the Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navLinks && navLinks.classList.contains('active')) {
            closeMenu();
        }
    });

    // 3. Mobile Dropdown Toggle — attach to parent link only so child clicks don't re-toggle
    const dropdownParents = document.querySelectorAll('.has-dropdown');
    dropdownParents.forEach(parent => {
        const parentLink = parent.querySelector(':scope > a');
        if (!parentLink) return;
        parentLink.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                // On mobile, we don't show the dropdown inside the nav; navigate to the section
                // Allow default anchor behavior (do not preventDefault). Close the menu shortly after.
                if (navLinks.classList.contains('active')) {
                    setTimeout(() => closeMenu(), 60);
                }
                return;
            }

            // On larger screens keep the existing toggle-by-click behavior if needed
            // (click will toggle the active class only when explicitly desired)
            // If desired to toggle on desktop click, uncomment below lines.
            // e.preventDefault();
            // parent.classList.toggle('active');
        });
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }
            // remove active from all dropdown parents when leaving mobile
            const dropdownParents = document.querySelectorAll('.has-dropdown');
            dropdownParents.forEach(p => p.classList.remove('active'));
        }
    });

    // Ensure nav is closed on initial load and when resizing into mobile
    const initNavState = () => {
        try {
            if (navLinks && navLinks.classList.contains('active')) navLinks.classList.remove('active');
            if (navBackdrop && navBackdrop.classList.contains('active')) navBackdrop.classList.remove('active');
            document.body.classList.remove('nav-open');
            if (hamburger) {
                const bars = hamburger.querySelectorAll('.bar');
                if (bars && bars.length >= 3) {
                    bars[0].style.transform = 'none';
                    bars[1].style.opacity = '1';
                    bars[2].style.transform = 'none';
                }
            }
        } catch (err) {
            // silent
        }
    };

    // Run on load and when crossing mobile breakpoint
    initNavState();
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
        if ((lastWidth > 768 && window.innerWidth <= 768) || (lastWidth <= 768 && window.innerWidth > 768)) {
            initNavState();
        }
        lastWidth = window.innerWidth;
    });

    // 4. Scroll Reveal Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const revealElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right');

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach(el => {
        observer.observe(el);
    });

    // 5. Active Link Switching on Scroll
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.menu a[href^="#"]');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === `#${current}`) {
                item.classList.add('active');
            }
        });
    });

    // 6. Service Modal Logic
    const serviceData = {
        'billing': {
            title: 'Billing & Invoicing Systems',
            description: 'Our comprehensive billing and invoicing solutions are designed to simplify your financial operations.',
            features: [
                'Automated invoice generation',
                'Customizable invoice templates',
                'Real-time financial reporting',
                'Payment gateway integration'
            ]
        },
        'crm': {
            title: 'Customer Management',
            description: 'Manage your client relationships effectively with our robust CRM solutions tailored for your business needs.',
            features: [
                'Centralized customer database',
                'Appointment and schedule tracking',
                'Automated follow-up reminders',
                'Customer interaction history'
            ]
        },
        'booking': {
            title: 'Online Booking Systems',
            description: 'Empower your customers to book your services 24/7 with a seamless, user-friendly online scheduling system.',
            features: [
                'Self-service booking portal',
                'Calendar synchronization',
                'Automated email/SMS confirmations',
                'Secure online deposits'
            ]
        },
        'inventory': {
            title: 'Inventory Management',
            description: 'Keep track of your stock levels in real-time and automate your supply chain processes.',
            features: [
                'Real-time stock tracking',
                'Low stock alerts',
                'Supplier management',
                'Barcode scanning integration'
            ]
        },
        'whatsapp': {
            title: 'WhatsApp Automation',
            description: 'Leverage the world\'s most popular messaging app to engage with your customers automatically.',
            features: [
                'Automated chatbots and replies',
                'Bulk broadcast messages',
                'Booking & order confirmations',
                'Customer support ticketing'
            ]
        },
        'hosting': {
            title: 'Hosting, SSL & Deployment',
            description: 'Secure and optimized hosting with HTTPS, deployment automation, and reliable uptime for customer-facing sites.',
            features: [
                'SSL certificate setup',
                'Fast CDN-backed hosting',
                'Automated deployment workflows',
                'Performance monitoring'
            ]
        },
        'design': {
            title: 'UI/UX & Product Design',
            description: 'Effective user interfaces and product experiences that increase engagement and conversion rates.',
            features: [
                'User research and wireframes',
                'High-fidelity UI design',
                'Mobile-first experience',
                'Conversion-focused interactions'
            ]
        },
        'web': {
            title: 'Website & App Development',
            description: 'We build high-performance, responsive websites and mobile applications tailored to your brand.',
            features: [
                'Custom UI/UX design',
                'E-commerce functionality',
                'Progressive Web Apps (PWA)',
                'Ongoing maintenance and support'
            ]
        },
        'software': {
            title: 'Custom Software Development',
            description: 'Bespoke software solutions engineered specifically to solve your unique business challenges.',
            features: [
                'End-to-end development cycle',
                'Legacy system modernization',
                'Cloud infrastructure integration',
                'Scalable architecture'
            ]
        },
        'saas': {
            title: 'SaaS Platform Development',
            description: 'We design and engineer highly scalable Software-as-a-Service platforms built on secure, modern cloud architectures.',
            features: [
                'Multi-tenant database structures',
                'Stripe & Razorpay payment integrations',
                'Custom subscription billing logic',
                'Elastic auto-scaling server configurations',
                'Advanced user analytics dashboards'
            ]
        },
        'about': {
            title: 'About Harsh Tech Solutions',
            description: 'Harsh Tech Solutions is a technology-driven company focused on delivering innovative digital solutions including web development, software applications, AI-powered systems, and IT services. We help businesses build a strong digital presence with reliable and scalable technology solutions.',
            features: [
                'Expert team of developers and designers',
                'Client-centric approach to problem solving',
                'Commitment to quality and innovation',
                'Proven track record of successful deliveries'
            ]
        },
        'careers': {
            title: 'Careers at Harsh Tech',
            description: 'Join our dynamic team of innovators and creators. We are always looking for passionate individuals who want to make a real impact in the tech world.',
            features: [
                'Competitive compensation and benefits',
                'Flexible working environment',
                'Continuous learning and growth opportunities',
                'Work on cutting-edge technologies'
            ]
        },
        'privacy': {
            title: 'Privacy Policy',
            description: 'Your privacy is important to us. This policy outlines how we collect, use, and protect your personal information across our services.',
            features: [
                'Data encryption and secure storage',
                'Transparent data collection practices',
                'No third-party data selling',
                'Full compliance with global privacy standards'
            ]
        },
        'terms': {
            title: 'Terms of Service',
            description: 'By accessing and using our services, you agree to these terms. They establish the rules and guidelines for using our platforms and software.',
            features: [
                'Clear user rights and responsibilities',
                'Service level agreements (SLAs)',
                'Intellectual property protection',
                'Dispute resolution procedures'
            ]
        }
    };

    const modalOverlay = document.getElementById('service-modal');
    const modalContent = document.getElementById('modal-content');
    const modalCloseBtn = document.getElementById('modal-close');
    const serviceTriggers = document.querySelectorAll('.service-trigger');

    serviceTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const serviceKey = trigger.getAttribute('data-service');
            const data = serviceData[serviceKey];
            
            if (data) {
                let featuresHtml = data.features.map(f => `<li><i class="fa-solid fa-check-circle"></i> ${f}</li>`).join('');
                modalContent.innerHTML = `
                    <h3>${data.title}</h3>
                    <p>${data.description}</p>
                    <ul>
                        ${featuresHtml}
                    </ul>
                    <a href="#contact" class="btn btn-primary btn-block" id="modal-cta">Get Started <i class="fa-solid fa-arrow-right"></i></a>
                `;
                
                document.getElementById('modal-cta').addEventListener('click', () => {
                    closeModal();
                });

                // Ensure mobile nav is closed when opening a service modal
                if (typeof closeMenu === 'function') closeMenu();

                modalOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    const closeModal = () => {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    };

    if(modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);

    if(modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });

    // 7. Counter Animation
    const counters = document.querySelectorAll('.counter');
    const speed = 100; // Lower is faster

    counters.forEach(counter => {
        const updateCount = () => {
            const target = +counter.getAttribute('data-target');
            const count = +counter.innerText;
            const inc = target / speed;

            if (count < target) {
                counter.innerText = Math.ceil(count + inc);
                setTimeout(updateCount, 20); // 20ms delay
            } else {
                counter.innerText = target;
            }
        };

        // Small delay before starting the animation for better effect
        setTimeout(updateCount, 500);
    });

    // 8. Contact Form Submission
    const contactForm = document.getElementById('contactForm');
    // const contactStatus = document.getElementById('contactStatus'); // Removed in favor of toast

    window.showToast = function showToast(type, title, message) {
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container';
            document.body.appendChild(toastContainer);
        }

        const iconClass = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';

        toastContainer.innerHTML = `
            <div class="toast ${type}">
                <i class="fa-solid ${iconClass} toast-icon"></i>
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        // Small delay to allow DOM to render before adding class for transition
        setTimeout(() => toastContainer.classList.add('show'), 10);

        // Hide after 4 seconds
        setTimeout(() => {
            toastContainer.classList.remove('show');
        }, 4000);
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = document.getElementById('contactSubmitBtn');
            const originalBtnText = submitBtn.innerHTML;
            
            // UI Loading state
            submitBtn.innerHTML = 'Sending... <i class="fa-solid fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;

            // Gather data
            const formData = {
                name: document.getElementById('contactName').value,
                email: document.getElementById('contactEmail').value,
                phone: document.getElementById('contactPhone').value,
                subject: document.getElementById('contactSubject').value,
                message: document.getElementById('contactMessage').value
            };

            try {
                // Determine API base URL (in case user opens HTML file directly instead of through localhost)
                const baseUrl = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';

                // Send to backend
                const response = await fetch(`${baseUrl}/api/contact`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok) {
                    showToast('success', 'Awesome!', 'Your message has been sent. We will contact you shortly.');
                    contactForm.reset();
                } else {
                    throw new Error(data.error || 'Failed to send message');
                }
            } catch (error) {
                showToast('error', 'Oops!', error.message);
            } finally {
                // Reset button
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    // 9. FAQ Accordion Click Handler
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Close all other items
                faqItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                    const otherAnswer = otherItem.querySelector('.faq-answer');
                    if (otherAnswer) otherAnswer.style.maxHeight = null;
                });
                
                // Toggle current item
                if (!isActive) {
                    item.classList.add('active');
                    const answer = item.querySelector('.faq-answer');
                    if (answer) {
                        answer.style.maxHeight = answer.scrollHeight + 'px';
                    }
                }
            });
        }
    });

    // 10. Portfolio Dynamic Filtering
    const filterButtons = document.querySelectorAll('.portfolio-filters .filter-btn');
    const projectCards = document.querySelectorAll('.project-grid .project-card');

    if (filterButtons.length > 0 && projectCards.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                filterButtons.forEach(b => b.classList.remove('active'));
                // Add active class to current button
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');

                projectCards.forEach(card => {
                    // Reset animation/visibility classes
                    card.classList.remove('portfolio-hidden');
                    card.classList.remove('portfolio-fade-in');

                    const cardCategory = card.getAttribute('data-category');

                    if (filterValue === 'all' || cardCategory === filterValue) {
                        // Force a layout reflow to restart CSS keyframe animations
                        void card.offsetWidth;
                        card.classList.add('portfolio-fade-in');
                    } else {
                        card.classList.add('portfolio-hidden');
                    }
                });
            });
        });
    }
});

// Global function to copy email to clipboard (used in index.html)
window.copyEmailGlobal = function(email) {
    navigator.clipboard.writeText(email).then(() => {
        // Show the existing premium toast if possible, otherwise use alert
        const toastContainer = document.getElementById('toast-container');
        if (toastContainer && typeof window.showToast === 'function') {
            window.showToast('success', 'Copied!', 'Email address copied to clipboard.');
        } else {
            alert('Email copied to clipboard: ' + email);
        }
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });
};

// Global function to pre-select contact service and scroll to it (used in index.html)
window.selectContactService = function(serviceVal) {
    const selectEl = document.getElementById('contactSubject');
    if (selectEl) {
        selectEl.value = serviceVal;
        // Trigger change event for dropdown interactions
        selectEl.dispatchEvent(new Event('change'));
    }
};
