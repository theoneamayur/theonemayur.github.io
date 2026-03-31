// Projects Data
const projects = {
    1: { title: 'Brand Identity', label: 'Branding', desc: 'Complete visual identity system for a tech startup.' },
    2: { title: 'Motion Reel', label: 'Motion', desc: 'Dynamic motion graphics for product launch campaign.' },
    3: { title: 'Editorial', label: 'Print', desc: 'Magazine layout and typographic system.' },
    4: { title: 'UI System', label: 'Digital', desc: 'Design system for SaaS platform.' }
};

let currentProject = 1;
let currentPanel = 0;
let isAnimating = false;

// DOM Elements
const wrapper = document.getElementById('wrapper');
const panels = document.querySelectorAll('.panel');
const loader = document.querySelector('.loader');
const modal = document.getElementById('modal');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
const modalHamburger = document.getElementById('modal-hamburger');
const modalMobileMenu = document.getElementById('modal-mobile-menu');
const gradientCanvas = document.getElementById('gradient-canvas');
const ctx = gradientCanvas ? gradientCanvas.getContext('2d') : null;

// Check if mobile
function isMobile() {
    return window.innerWidth <= 767;
}

// Loader
window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('hide'), 1500);
});

// Check if on desktop
const isDesktop = !isMobile();

// ============================
// Pen Tool Effect
// ============================
let penTool = {
  paths: [],
  currentPath: null,
  isDrawing: false,
  dragStart: null,
  lastClickTime: 0,
  fadeDuration: 2000,
  pointRadius: 4,
  handleLength: 50
};

// ============================
// Gradient Trail Effect
// ============================
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

function resizeCanvas() {
    if (gradientCanvas) {
        gradientCanvas.width = window.innerWidth;
        gradientCanvas.height = window.innerHeight;
    }
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Track mouse position
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

// Pen Tool Drawing Effect
function drawPenTool() {
    if (!ctx || !gradientCanvas || isMobile()) {
        requestAnimationFrame(drawPenTool);
        return;
    }
    
    // Skip drawing when modal is open
    if (modal.classList.contains('active')) {
        ctx.clearRect(0, 0, gradientCanvas.width, gradientCanvas.height);
        requestAnimationFrame(drawPenTool);
        return;
    }

    ctx.clearRect(0, 0, gradientCanvas.width, gradientCanvas.height);
    
    const now = Date.now();
    
    // Draw all completed paths with fade
    penTool.paths.forEach(path => {
        const age = now - path.createdAt;
        const alpha = Math.max(0, 1 - age / penTool.fadeDuration);
        if (alpha <= 0) return;
        
        drawPath(path, alpha);
    });
    
    // Draw current path (if any)
    if (penTool.currentPath) {
        drawPath(penTool.currentPath, 1);
        drawAnchorPoints(penTool.currentPath);
        drawHandles(penTool.currentPath);
        drawPreviewLine(penTool.currentPath);
    }
    
    // Remove faded paths
    penTool.paths = penTool.paths.filter(path => now - path.createdAt < penTool.fadeDuration);
    
    requestAnimationFrame(drawPenTool);
}

function drawPath(path, alpha) {
    if (path.points.length < 2) return;
    
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(path.points[0].x, path.points[0].y);
    
    for (let i = 1; i < path.points.length; i++) {
        const prev = path.points[i-1];
        const curr = path.points[i];
        if (prev.handleOut && curr.handleIn) {
            // Bezier curve
            ctx.bezierCurveTo(
                prev.handleOut.x, prev.handleOut.y,
                curr.handleIn.x, curr.handleIn.y,
                curr.x, curr.y
            );
        } else {
            ctx.lineTo(curr.x, curr.y);
        }
    }
    
    if (path.closed && path.points.length > 2) {
        const last = path.points[path.points.length-1];
        const first = path.points[0];
        if (last.handleOut && first.handleIn) {
            ctx.bezierCurveTo(
                last.handleOut.x, last.handleOut.y,
                first.handleIn.x, first.handleIn.y,
                first.x, first.y
            );
        } else {
            ctx.lineTo(first.x, first.y);
        }
        ctx.closePath();
    }
    
    ctx.stroke();
}

function drawAnchorPoints(path) {
    path.points.forEach(point => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(point.x, point.y, penTool.pointRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
    });
}

function drawHandles(path) {
    path.points.forEach(point => {
        if (point.handleIn) {
            drawHandle(point, point.handleIn);
        }
        if (point.handleOut) {
            drawHandle(point, point.handleOut);
        }
    });
}

function drawHandle(anchor, handle) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(anchor.x, anchor.y);
    ctx.lineTo(handle.x, handle.y);
    ctx.stroke();
    
    // Draw handle point
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(handle.x, handle.y, 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawPreviewLine(path) {
    if (path.points.length === 0) return;
    const lastPoint = path.points[path.points.length - 1];
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(mouseX, mouseY);
    ctx.stroke();
    ctx.setLineDash([]);
}

// Pen Tool Event Listeners
document.addEventListener('mousedown', (e) => {
    if (isMobile() || modal.classList.contains('active')) return;
    if (e.button !== 0) return; // Only left click
    
    // Ignore clicks on interactive elements
    if (e.target.closest('a, button, .project-visual, .service, input, textarea, select, .hamburger, .modal-close, .modal-next, .modal-site-nav a, .site-nav a, .mobile-menu-links a, .modal-mobile-menu-links a')) return;
    
    const now = Date.now();
    const timeSinceLastClick = now - penTool.lastClickTime;
    penTool.lastClickTime = now;
    
    // Double click detection (within 300ms)
    if (timeSinceLastClick < 300) {
        // Finish current path
        if (penTool.currentPath && penTool.currentPath.points.length > 1) {
            penTool.currentPath.closed = true;
            penTool.paths.push(penTool.currentPath);
        }
        penTool.currentPath = null;
        penTool.isDrawing = false;
        return;
    }
    
    // Start new path if not drawing
    if (!penTool.isDrawing) {
        penTool.isDrawing = true;
        penTool.currentPath = {
            points: [],
            closed: false,
            createdAt: now
        };
    }
    
    // Check if clicking near existing point to adjust handles (future enhancement)
    
    // Add new point
    const newPoint = {
        x: mouseX,
        y: mouseY,
        handleIn: null,
        handleOut: null
    };
    
    penTool.currentPath.points.push(newPoint);
    penTool.dragStart = { x: mouseX, y: mouseY, pointIndex: penTool.currentPath.points.length - 1 };
});

document.addEventListener('mousemove', (e) => {
    // mouseX and mouseY are updated by the gradient trail mousemove listener
    
    // If dragging, create handles
    if (penTool.dragStart && penTool.isDrawing) {
        const dx = mouseX - penTool.dragStart.x;
        const dy = mouseY - penTool.dragStart.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 10) { // Only create handles if dragged enough
            const point = penTool.currentPath.points[penTool.dragStart.pointIndex];
            const handleX = penTool.dragStart.x + dx;
            const handleY = penTool.dragStart.y + dy;
            
            // Create symmetric handles
            point.handleOut = { x: handleX, y: handleY };
            point.handleIn = { x: penTool.dragStart.x - dx, y: penTool.dragStart.y - dy };
        }
    }
});

document.addEventListener('mouseup', (e) => {
    penTool.dragStart = null;
});

// Initialize pen tool
if (!isMobile()) {
    drawPenTool();
}

// Clear pen tool paths with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('active')) {
        penTool.paths = [];
        penTool.currentPath = null;
        penTool.isDrawing = false;
        penTool.dragStart = null;
    }
});

// Hover effect - expand gradient
let isHovering = false;
document.querySelectorAll('a, button, .project-visual, .service').forEach(el => {
    el.addEventListener('mouseenter', () => {
        isHovering = true;
        document.body.classList.add('cursor-hover');
    });
    el.addEventListener('mouseleave', () => {
        isHovering = false;
        document.body.classList.remove('cursor-hover');
    });
});

// ============================
// Horizontal Scroll
// ============================
function goToPanel(index) {
    if (isMobile()) return;
    if (isAnimating || index < 0 || index >= panels.length) return;
    isAnimating = true;
    currentPanel = index;

    wrapper.style.transition = 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
    wrapper.style.transform = `translateX(-${index * 100}vw)`;

    updateNav(index);
    animatePanel(index);

    setTimeout(() => isAnimating = false, 900);
}

// Wheel
let wheelTimeout;
window.addEventListener('wheel', (e) => {
    if (isMobile() || modal.classList.contains('active')) return;
    e.preventDefault();

    clearTimeout(wheelTimeout);
    wheelTimeout = setTimeout(() => {
        if (e.deltaY > 20 || e.deltaX > 20) goToPanel(currentPanel + 1);
        else if (e.deltaY < -20 || e.deltaX < -20) goToPanel(currentPanel - 1);
    }, 50);
}, { passive: false });

// Touch
let touchStartX = 0;
window.addEventListener('touchstart', e => touchStartX = e.touches[0].clientX);
window.addEventListener('touchend', e => {
    if (isMobile() || modal.classList.contains('active')) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
        if (diff > 0) goToPanel(currentPanel + 1);
        else goToPanel(currentPanel - 1);
    }
});

// Keyboard
document.addEventListener('keydown', (e) => {
    if (modal.classList.contains('active')) {
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowRight') nextProject();
        return;
    }
    if (!isMobile()) {
        if (e.key === 'ArrowRight') goToPanel(currentPanel + 1);
        if (e.key === 'ArrowLeft') goToPanel(currentPanel - 1);
    }
});

// ============================
// Navigation
// ============================
function updateNav(activePanel) {
    // Map panels to nav sections
    const sectionMap = {
        0: 'home', 1: 'home',
        2: 'work', 3: 'work', 4: 'work', 5: 'work',
        6: 'services', 7: 'services',
        8: 'about', 9: 'about',
        10: 'contact'
    };
    
    const activeSection = sectionMap[activePanel] || 'home';
    
    document.querySelectorAll('.site-nav a').forEach(link => {
        const href = link.getAttribute('href');
        link.classList.toggle('active', href === `#${activeSection}`);
    });
}

// Header links
document.querySelectorAll('.site-header a, .mobile-menu-links a').forEach(link => {
    link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#') && href.length > 1) {
            e.preventDefault();
            const section = href.substring(1);
            
            // Close mobile menu if open
            hamburger.classList.remove('active');
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
            
            // Find panel index for section
            const panelMap = {
                'home': 0, 'work': 2, 'services': 6, 'about': 8, 'contact': 10
            };
            
            const targetPanel = panelMap[section];
            if (targetPanel !== undefined && !isMobile()) {
                goToPanel(targetPanel);
            } else {
                const target = document.getElementById(section);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            }
        }
    });
});

// Logo links - always go to home
document.getElementById('logo-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (!isMobile()) {
        goToPanel(0);
    } else {
        document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
    }
});

document.getElementById('modal-logo-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal();
    setTimeout(() => {
        if (!isMobile()) {
            goToPanel(0);
        } else {
            document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
        }
    }, 400);
});

// Hamburger
hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
});

// Modal Hamburger
modalHamburger?.addEventListener('click', () => {
    modalHamburger.classList.toggle('active');
    modalMobileMenu.classList.toggle('active');
});

// Modal Mobile Menu Links
document.querySelectorAll('.modal-mobile-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const panelIndex = parseInt(link.dataset.section);
        
        modalHamburger.classList.remove('active');
        modalMobileMenu.classList.remove('active');
        closeModal();
        
        setTimeout(() => {
            if (!isMobile()) {
                goToPanel(panelIndex);
            } else {
                const sectionMap = {
                    0: 'home', 2: 'work', 6: 'services', 8: 'about', 10: 'contact'
                };
                const sectionId = sectionMap[panelIndex];
                document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
            }
        }, 400);
    });
});

// ============================
// Modal Navigation Links
// ============================
document.querySelectorAll('.modal-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const panelIndex = parseInt(link.dataset.section);
        
        closeModal();
        
        setTimeout(() => {
            if (!isMobile()) {
                goToPanel(panelIndex);
            } else {
                const sectionMap = {
                    0: 'home', 2: 'work', 6: 'services', 8: 'about', 10: 'contact'
                };
                const sectionId = sectionMap[panelIndex];
                document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
            }
        }, 400);
    });
});

// Modal CTA
document.querySelector('.modal-cta')?.addEventListener('click', (e) => {
    e.preventDefault();
    closeModal();
    setTimeout(() => {
        if (!isMobile()) {
            goToPanel(10);
        } else {
            document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
        }
    }, 400);
});

// ============================
// Animate panel elements
// ============================
function animatePanel(index) {
    const panel = panels[index];
    if (!panel) return;
    
    const elements = panel.querySelectorAll('.project-info, .services-header, .about-left, .contact-left, .team');
    elements.forEach((el, i) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        setTimeout(() => {
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        }, 200 + i * 100);
    });
}

// ============================
// Modal
// ============================
function openModal(id) {
    currentProject = id;
    const project = projects[id];
    if (!project) return;

    document.getElementById('modal-title').textContent = project.title;
    document.getElementById('modal-label').textContent = project.label;
    document.getElementById('modal-desc').textContent = project.desc;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function nextProject() {
    currentProject = currentProject < 4 ? currentProject + 1 : 1;
    openModal(currentProject);
}

document.querySelectorAll('.project-visual').forEach(visual => {
    visual.addEventListener('click', () => openModal(parseInt(visual.dataset.project)));
});


document.querySelector('.modal-bg')?.addEventListener('click', closeModal);
document.getElementById('modal-next')?.addEventListener('click', nextProject);

// ============================
// Counter Animation
// ============================
function animateCounters() {
    document.querySelectorAll('.stat-number').forEach(el => {
        const text = el.textContent;
        const hasPlus = text.includes('+');
        const target = parseInt(text);
        let current = 0;
        const increment = target / 60;
        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                el.textContent = target + (hasPlus ? '+' : '');
                clearInterval(timer);
            } else {
                el.textContent = Math.floor(current) + (hasPlus ? '+' : '');
            }
        }, 30);
    });
}

// Initialize
if (!isMobile()) {
    animatePanel(0);
}
setTimeout(animateCounters, 2000);

// Window resize
window.addEventListener('resize', () => {
    resizeCanvas();
    if (!isMobile()) {
        wrapper.style.transform = `translateX(-${currentPanel * 100}vw)`;
        document.body.style.overflow = '';
    } else {
        wrapper.style.transform = 'none';
    }
});
