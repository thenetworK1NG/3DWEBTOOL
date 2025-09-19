// PWA Installation and Service Worker Registration
let deferredPrompt;
let isAppInstalled = false;

// Check if app is already installed
window.addEventListener('beforeinstallprompt', (e) => {
    console.log('💡 PWA installation available');
    e.preventDefault();
    deferredPrompt = e;
    showInstallButton();
});

// Handle successful installation
window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installed successfully');
    isAppInstalled = true;
    hideInstallButton();
    showNotification('🎉 3D Viewer installed! You can now use it offline.');
});

// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('✅ Service Worker registered:', registration.scope);
                
                // Check for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateNotification();
                        }
                    });
                });
            })
            .catch((error) => {
                console.error('❌ Service Worker registration failed:', error);
            });
    });
}

function showInstallButton() {
    // Add install button to toolbar if not already present
    const existingBtn = document.getElementById('pwa-install-btn');
    if (existingBtn || isAppInstalled) return;
    
    // Wait for toolbars to be created
    setTimeout(() => {
        // Desktop install button
        const desktopBar = document.getElementById('desktop-toolbar');
        if (desktopBar && !document.getElementById('pwa-install-btn-desktop')) {
            const installBtn = document.createElement('button');
            installBtn.id = 'pwa-install-btn-desktop';
            installBtn.textContent = '⬇️';
            installBtn.title = 'Install as Progressive Web App';
            installBtn.onclick = installPWA;
            installBtn.style.cssText = `
                background: #ffffff;
                color: #000000;
                border: 1px solid #aaaaaa;
                padding: 8px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 13px;
                font-weight: normal;
                margin-left: 8px;
                transition: all 0.1s ease;
                font-family: system-ui, -apple-system, sans-serif;
            `;
            
            // Add hover effect to match other buttons
            installBtn.addEventListener('mouseenter', () => {
                installBtn.style.background = '#f0f0f0';
                installBtn.style.borderColor = '#999999';
            });
            
            installBtn.addEventListener('mouseleave', () => {
                installBtn.style.background = '#ffffff';
                installBtn.style.borderColor = '#aaaaaa';
            });
            
            desktopBar.appendChild(installBtn);
        }
        
        // Mobile install button
        const mobileBar = document.getElementById('mobile-toolbar');
        if (mobileBar && !document.getElementById('pwa-install-btn-mobile')) {
            const installBtnMobile = document.createElement('button');
            installBtnMobile.id = 'pwa-install-btn-mobile';
            installBtnMobile.textContent = '⬇️';
            installBtnMobile.title = 'Install App';
            installBtnMobile.onclick = installPWA;
            installBtnMobile.style.cssText = `
                padding: 0;
                font-size: 22px;
                width: 44px;
                height: 44px;
                border: 1px solid #aaaaaa;
                border-radius: 10px;
                background: #ffffff;
                color: #000000;
                white-space: nowrap;
                cursor: pointer;
                transition: all 0.1s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            // Add touch/hover effects for mobile to match theme
            installBtnMobile.addEventListener('touchstart', () => {
                installBtnMobile.style.background = '#f0f0f0';
            });
            
            installBtnMobile.addEventListener('touchend', () => {
                setTimeout(() => {
                    installBtnMobile.style.background = '#ffffff';
                }, 100);
            });
            
            installBtnMobile.addEventListener('mouseenter', () => {
                installBtnMobile.style.background = '#f0f0f0';
            });
            
            installBtnMobile.addEventListener('mouseleave', () => {
                installBtnMobile.style.background = '#ffffff';
            });
            
            mobileBar.appendChild(installBtnMobile);
        }
    }, 1000);
}

function hideInstallButton() {
    const installBtnDesktop = document.getElementById('pwa-install-btn-desktop');
    const installBtnMobile = document.getElementById('pwa-install-btn-mobile');
    if (installBtnDesktop) installBtnDesktop.remove();
    if (installBtnMobile) installBtnMobile.remove();
}

async function installPWA() {
    if (!deferredPrompt) {
        showNotification('⚠️ Installation not available on this device');
        return;
    }
    
    try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
            console.log('✅ User accepted PWA installation');
            showNotification('🎉 Installing 3D Viewer...');
        } else {
            console.log('❌ User dismissed PWA installation');
        }
        
        deferredPrompt = null;
        hideInstallButton();
    } catch (error) {
        console.error('❌ PWA installation error:', error);
        showNotification('❌ Installation failed. Try again later.');
    }
}

function showUpdateNotification() {
    const updateDiv = document.createElement('div');
    updateDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #007bff;
        color: white;
        padding: 15px;
        border-radius: 8px;
        z-index: 10000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    updateDiv.innerHTML = `
        <div style="margin-bottom: 10px;">🔄 App update available!</div>
        <button onclick="updateApp()" style="background: white; color: #007bff; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-right: 5px;">Update</button>
        <button onclick="this.parentElement.remove()" style="background: transparent; color: white; border: 1px solid white; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Later</button>
    `;
    document.body.appendChild(updateDiv);
    
    setTimeout(() => {
        if (updateDiv.parentElement) {
            updateDiv.remove();
        }
    }, 10000);
}

function updateApp() {
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
}

function showNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        z-index: 10000;
        font-size: 14px;
        max-width: 90%;
        text-align: center;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, duration);
}

// Check if running as PWA
function isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
}

// PWA-specific optimizations
if (isPWA()) {
    console.log('🚀 Running as PWA');
    document.body.classList.add('pwa-mode');
    
    // Hide browser-specific elements when running as PWA
    const style = document.createElement('style');
    style.textContent = `
        .pwa-mode #upload-label { display: none !important; }
        .pwa-mode body { padding-top: env(safe-area-inset-top); }
    `;
    document.head.appendChild(style);
}

// --- Scene Settings Save/Load Menu UI ---
function applyResponsiveMenu(menu) {
    const isMobile = (window.__isMobile !== undefined) ? window.__isMobile : matchMedia('(pointer: coarse), (max-width: 768px)').matches;
    if (!isMobile) return;
    menu.style.top = 'calc(env(safe-area-inset-top, 0px) + 64px)';
    menu.style.left = 'calc(env(safe-area-inset-left, 0px) + 12px)';
    menu.style.right = 'calc(env(safe-area-inset-right, 0px) + 12px)';
    menu.style.bottom = 'auto';
    menu.style.maxWidth = 'unset';
    menu.style.minWidth = 'auto';
    menu.style.width = 'auto';
    menu.style.maxHeight = '70vh';
        menu.style.position = 'absolute';
    menu.style.fontSize = '16px';
    menu.style.padding = '14px';
}

// Ensure only one menu is open at a time on mobile
function ensureSingleOpenMenu(menu, tag) {
    const isMobile = (window.__isMobile !== undefined) ? window.__isMobile : matchMedia('(pointer: coarse), (max-width: 768px)').matches;
    if (tag) menu.dataset.menuTag = tag;
    if (isMobile) {
        // Mobile: only one menu total
        if (window.__activeMenu && window.__activeMenu !== menu) {
            try { window.__activeMenu.remove(); } catch (_) {}
        }
        window.__activeMenu = menu;
        if (tag) window.__activeMenuTag = tag; // remember which menu type is open
    } else if (tag) {
        // Desktop: allow multiple menus, but only one per tag/type to avoid duplicate IDs
        const existing = Array.from(document.querySelectorAll('[data-menu-tag]'))
            .filter(el => el !== menu && el.dataset.menuTag === tag);
        existing.forEach(el => { try { el.remove(); } catch (_) {} });
    }
}

// Desktop-only: make popup menus draggable via a small handle
function makeMenuDraggable(menu) {
    const isMobile = (window.__isMobile !== undefined) ? window.__isMobile : matchMedia('(pointer: coarse), (max-width: 768px)').matches;
    if (isMobile || !menu) return;
    // Add a drag handle at the top
    const handle = document.createElement('div');
    handle.className = 'menu-drag-handle';
    handle.textContent = '⇕ Drag';
    Object.assign(handle.style, {
        cursor: 'move',
        userSelect: 'none',
        fontSize: '12px',
        color: '#333',
        background: 'rgba(240,240,240,0.9)',
        borderBottom: '1px solid #ddd',
        margin: '-12px -16px 8px -16px', // extend into the menu padding
        padding: '6px 10px',
        borderTopLeftRadius: '8px',
        borderTopRightRadius: '8px'
    });
    try { menu.insertBefore(handle, menu.firstChild); } catch(_) { menu.appendChild(handle); }

    if (!window.__menuZ) window.__menuZ = 1500;
    let dragging = false;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;
    const onMouseDown = (e) => {
        if (e.button !== 0) return; // left button only
        dragging = true;
        const rect = menu.getBoundingClientRect();
        // Promote to top
        window.__menuZ += 1; menu.style.zIndex = window.__menuZ;
        startX = e.clientX; startY = e.clientY;
        // If style left/top not set, initialize from rect
        const curLeft = parseFloat(menu.style.left || rect.left + '');
        const curTop = parseFloat(menu.style.top || rect.top + '');
        startLeft = curLeft; startTop = curTop;
        document.body.style.userSelect = 'none';
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        e.preventDefault();
    };
    const onMouseMove = (e) => {
        if (!dragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        let newLeft = startLeft + dx;
        let newTop = startTop + dy;
        // Clamp within viewport a bit
        const maxLeft = window.innerWidth - 80; // leave some space
        const maxTop = window.innerHeight - 60;
        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));
        menu.style.left = newLeft + 'px';
        menu.style.top = newTop + 'px';
    };
    const onMouseUp = () => {
        dragging = false;
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
    };
    handle.addEventListener('mousedown', onMouseDown);
    handle.addEventListener('dragstart', (e) => e.preventDefault());
}

function centerMenuOnOpen(menu) {
    const isMobile = (window.__isMobile !== undefined) ? window.__isMobile : matchMedia('(pointer: coarse), (max-width: 768px)').matches;
    if (isMobile || !menu) return; // mobile uses responsive top-left positioning
    // Use fixed positioning to center
    menu.style.position = 'fixed';
    // Compute after layout
    requestAnimationFrame(() => {
        const rect = menu.getBoundingClientRect();
        const left = Math.max(0, (window.innerWidth - rect.width) / 2);
        const top = Math.max(0, (window.innerHeight - rect.height) / 2);
        menu.style.left = left + 'px';
        menu.style.top = top + 'px';
    });
}

// Toggle helper: if the same menu is open, close it; otherwise open via creator()
function toggleMenu(tag, creator) {
    const isMobile = (window.__isMobile !== undefined) ? window.__isMobile : matchMedia('(pointer: coarse), (max-width: 768px)').matches;
    // We allow toggling on all devices, but the single-open behavior is mobile-only
    if (window.__activeMenu && window.__activeMenuTag === tag) {
        try { window.__activeMenu.remove(); } catch (_) {}
        window.__activeMenu = null;
        window.__activeMenuTag = null;
        return;
    }
    creator();
}

function createSceneSettingsMenu() {
    const menu = document.createElement('div');
    menu.style.position = 'fixed';
    menu.style.top = '176px';
    menu.style.left = '220px';
    menu.style.background = 'rgba(255,255,255,0.97)';
    menu.style.color = '#000';
    menu.style.border = '1px solid #aaa';
    menu.style.borderRadius = '8px';
    menu.style.padding = '16px';
    menu.style.zIndex = 1000;
    menu.style.fontFamily = 'sans-serif';
    menu.style.minWidth = '320px';
    menu.innerHTML = `
        <b>Scene Settings</b><br><br>
        <button id="downloadSceneJson">Save Scene JSON</button>
        <input type="file" id="importSceneJson" accept="application/json" style="margin-left:10px;">
        <pre id="sceneJsonPreview" style="margin-top:10px; max-height:200px; overflow:auto; background:#f7f7f7; border:1px solid #ddd; border-radius:4px; padding:8px; font-size:12px;"></pre>
        <button id="closeSceneSettingsMenu" style="margin-top:10px;">Close</button>
    `;
    applyResponsiveMenu(menu);
    ensureSingleOpenMenu(menu, 'scene');
    document.body.appendChild(menu);
    makeMenuDraggable(menu);
    centerMenuOnOpen(menu);

    // Gather scene data
    let hemi = null, dir = null;
    scene.traverse(obj => {
        if (obj.isHemisphereLight) hemi = obj;
        if (obj.isDirectionalLight) dir = obj;
    });
    let textureUrl = null;
    if (model && model.traverse) {
        model.traverse(child => {
            if (child.isMesh && child.material && child.material.map && child.material.map.image && child.material.map.image.src) {
                textureUrl = child.material.map.image.src;
            }
        });
    }
    const exportData = {
        camera: {
            fov: camera.fov,
            near: camera.near,
            far: camera.far,
            position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
            target: { x: controls.target.x, y: controls.target.y, z: controls.target.z },
            quaternion: { x: camera.quaternion.x, y: camera.quaternion.y, z: camera.quaternion.z, w: camera.quaternion.w }
        },
        keyframes: (window.cameraKeyframes || []).map((kf, i) => ({
            index: i+1,
            position: { x: kf.position.x, y: kf.position.y, z: kf.position.z },
            target: { x: kf.target.x, y: kf.target.y, z: kf.target.z },
            zoom: kf.zoom,
            fov: kf.fov,
            near: kf.near,
            far: kf.far,
            quaternion: { x: kf.quaternion.x, y: kf.quaternion.y, z: kf.quaternion.z, w: kf.quaternion.w },
            duration: kf.duration || ANIMATION_SPEED, // Include duration in export
            modelAnimTime: kf.modelAnimTime || 0 // Include model animation time in export
        })),
        lighting: {
            hemisphere: hemi ? { intensity: hemi.intensity, color: hemi.color.getHex(), groundColor: hemi.groundColor.getHex() } : null,
            directional: dir ? { intensity: dir.intensity, color: dir.color.getHex() } : null
        },
        background: scene.background ? scene.background.getStyle() : null,
        texture: textureUrl
    };
    document.getElementById('sceneJsonPreview').textContent = JSON.stringify(exportData, null, 2);

    document.getElementById('downloadSceneJson').onclick = function() {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'scene_settings.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    };
    document.getElementById('importSceneJson').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const data = JSON.parse(evt.target.result);
                // Camera
                if (data.camera) {
                    camera.fov = data.camera.fov;
                    camera.near = data.camera.near;
                    camera.far = data.camera.far;
                    camera.position.set(data.camera.position.x, data.camera.position.y, data.camera.position.z);
                    controls.target.set(data.camera.target.x, data.camera.target.y, data.camera.target.z);
                    camera.quaternion.set(data.camera.quaternion.x, data.camera.quaternion.y, data.camera.quaternion.z, data.camera.quaternion.w);
                    camera.updateProjectionMatrix();
                    controls.update();
                }
                // Keyframes
                if (data.keyframes) {
                    window.cameraKeyframes = data.keyframes.map(kf => ({
                        position: new THREE.Vector3(kf.position.x, kf.position.y, kf.position.z),
                        target: new THREE.Vector3(kf.target.x, kf.target.y, kf.target.z),
                        zoom: kf.zoom,
                        fov: kf.fov,
                        near: kf.near,
                        far: kf.far,
                        quaternion: new THREE.Quaternion(kf.quaternion.x, kf.quaternion.y, kf.quaternion.z, kf.quaternion.w),
                        duration: kf.duration || ANIMATION_SPEED, // Use saved duration or default
                        modelAnimTime: kf.modelAnimTime || 0 // Use saved model time or default
                    }));
                    if (typeof updateKeyframeList === 'function') updateKeyframeList();
                    if (typeof window.updateKeyframeList === 'function') window.updateKeyframeList();
                }
                // Lighting
                if (data.lighting) {
                    scene.traverse(obj => {
                        if (obj.isHemisphereLight && data.lighting.hemisphere) {
                            obj.intensity = data.lighting.hemisphere.intensity;
                            obj.color.setHex(data.lighting.hemisphere.color);
                            obj.groundColor.setHex(data.lighting.hemisphere.groundColor);
                        }
                        if (obj.isDirectionalLight && data.lighting.directional) {
                            obj.intensity = data.lighting.directional.intensity;
                            obj.color.setHex(data.lighting.directional.color);
                        }
                    });
                }
                // Background
                if (data.background) {
                    scene.background = new THREE.Color(data.background);
                }
                // Texture
                if (data.texture && model) {
                    const tex = new THREE.TextureLoader().load(data.texture, () => {
                        if (tex) {
                            tex.colorSpace = THREE.SRGBColorSpace;
                            tex.flipY = false;
                        }
                        model.traverse(child => {
                            if (child.isMesh && child.material) {
                                child.material.map = tex;
                                child.material.needsUpdate = true;
                            }
                        });
                    });
                }
                document.getElementById('sceneJsonPreview').textContent = JSON.stringify(data, null, 2);
            } catch (err) {
                alert('Failed to parse JSON: ' + err.message);
            }
        };
        reader.readAsText(file);
    });
    menu.querySelector('#closeSceneSettingsMenu').onclick = function() { menu.remove(); if (window.__activeMenu === menu) { window.__activeMenu = null; window.__activeMenuTag = null; } };
}
// --- Lighting Menu UI ---
function createLightingMenu() {
    const menu = document.createElement('div');
    menu.style.position = 'fixed';
    menu.style.top = '56px';
    menu.style.left = '220px';
    menu.style.background = 'rgba(255,255,255,0.97)';
    menu.style.color = '#000';
    menu.style.border = '1px solid #aaa';
    menu.style.borderRadius = '8px';
    menu.style.padding = '16px';
    menu.style.zIndex = 1000;
    menu.style.fontFamily = 'sans-serif';
    menu.style.minWidth = '220px';
    menu.innerHTML = `
        <b>Lighting Settings</b><br><br>
        <label>Hemisphere Intensity: <input id="hemiIntensity" type="range" min="0" max="3" step="0.01"> <span id="hemiVal"></span></label><br>
        <label>Directional Intensity: <input id="dirIntensity" type="range" min="0" max="3" step="0.01"> <span id="dirVal"></span></label><br>
        <button id="closeLightingMenu" style="margin-top:10px;">Close</button>
    `;
    applyResponsiveMenu(menu);
    ensureSingleOpenMenu(menu, 'lighting');
    document.body.appendChild(menu);
    makeMenuDraggable(menu);
    centerMenuOnOpen(menu);
    // Find lights
    let hemi = null, dir = null;
    scene.traverse(obj => {
        if (obj.isHemisphereLight) hemi = obj;
        if (obj.isDirectionalLight) dir = obj;
    });
    document.getElementById('hemiIntensity').value = hemi ? hemi.intensity : 1;
    document.getElementById('hemiVal').textContent = hemi ? hemi.intensity : 1;
    document.getElementById('dirIntensity').value = dir ? dir.intensity : 1;
    document.getElementById('dirVal').textContent = dir ? dir.intensity : 1;
    document.getElementById('hemiIntensity').addEventListener('input', function() {
        if (hemi) { hemi.intensity = parseFloat(this.value); document.getElementById('hemiVal').textContent = this.value; }
    });
    document.getElementById('dirIntensity').addEventListener('input', function() {
        if (dir) { dir.intensity = parseFloat(this.value); document.getElementById('dirVal').textContent = this.value; }
    });
    menu.querySelector('#closeLightingMenu').onclick = function() { menu.remove(); if (window.__activeMenu === menu) { window.__activeMenu = null; window.__activeMenuTag = null; } };
}

// --- Background Menu UI ---
function createBackgroundMenu() {
    const menu = document.createElement('div');
    menu.style.position = 'fixed';
    menu.style.top = '96px';
    menu.style.left = '220px';
    menu.style.background = 'rgba(255,255,255,0.97)';
    menu.style.color = '#000';
    menu.style.border = '1px solid #aaa';
    menu.style.borderRadius = '8px';
    menu.style.padding = '16px';
    menu.style.zIndex = 1000;
    menu.style.fontFamily = 'sans-serif';
    menu.style.minWidth = '220px';
    menu.innerHTML = `
        <b>Background Settings</b><br><br>
        <label>Color: <input id="bgColor" type="color" value="#f0f0f0"></label><br>
        <button id="closeBackgroundMenu" style="margin-top:10px;">Close</button>
    `;
    applyResponsiveMenu(menu);
    ensureSingleOpenMenu(menu, 'background');
    document.body.appendChild(menu);
    makeMenuDraggable(menu);
    centerMenuOnOpen(menu);
    document.getElementById('bgColor').value = '#'+scene.background.getHexString();
    document.getElementById('bgColor').addEventListener('input', function() {
        scene.background = new THREE.Color(this.value);
    });
    menu.querySelector('#closeBackgroundMenu').onclick = function() { menu.remove(); if (window.__activeMenu === menu) { window.__activeMenu = null; window.__activeMenuTag = null; } };
}

// --- Texture Menu UI ---
function createTextureMenu() {
    const menu = document.createElement('div');
    menu.style.position = 'fixed';
    menu.style.top = '136px';
    menu.style.left = '220px';
    menu.style.background = 'rgba(255,255,255,0.97)';
    menu.style.color = '#000';
    menu.style.border = '1px solid #aaa';
    menu.style.borderRadius = '8px';
    menu.style.padding = '16px';
    menu.style.zIndex = 1000;
    menu.style.fontFamily = 'sans-serif';
    menu.style.minWidth = '220px';
    menu.innerHTML = `
        <b>Texture Settings</b><br><br>
        <input type="file" id="textureUpload" accept="image/*"><br>
        <label><input type="checkbox" id="textureToggle" checked> Show Texture</label><br>
        <button id="closeTextureMenu" style="margin-top:10px;">Close</button>
    `;
    applyResponsiveMenu(menu);
    ensureSingleOpenMenu(menu, 'texture');
    document.body.appendChild(menu);
    makeMenuDraggable(menu);
    centerMenuOnOpen(menu);
    // Store original maps for restoration
    if (!model._originalMaps) {
        model._originalMaps = [];
        model.traverse(child => {
            if (child.isMesh && child.material) {
                model._originalMaps.push({ mesh: child, map: child.material.map });
            }
        });
    }
    let lastTexture = null;
    document.getElementById('textureUpload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file || !model) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            lastTexture = new THREE.TextureLoader().load(evt.target.result, () => {
                if (lastTexture) {
                    lastTexture.colorSpace = THREE.SRGBColorSpace;
                    lastTexture.flipY = false;
                }
                model.traverse(child => {
                    if (child.isMesh && child.material) {
                        child.material.map = lastTexture;
                        child.material.needsUpdate = true;
                    }
                });
                document.getElementById('textureToggle').checked = true;
            });
        };
        reader.readAsDataURL(file);
    });
    document.getElementById('textureToggle').addEventListener('change', function(e) {
        if (!model) return;
        if (this.checked) {
            // Restore last texture or original
            model.traverse(child => {
                if (child.isMesh && child.material) {
                    if (lastTexture) {
                        child.material.map = lastTexture;
                    } else {
                        // If no uploaded texture, restore original
                        const orig = (model._originalMaps||[]).find(m => m.mesh === child);
                        child.material.map = orig ? orig.map : null;
                    }
                    child.material.needsUpdate = true;
                }
            });
        } else {
            // Remove texture (set map to null)
            model.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.map = null;
                    child.material.needsUpdate = true;
                }
            });
        }
    });
    menu.querySelector('#closeTextureMenu').onclick = function() { menu.remove(); if (window.__activeMenu === menu) { window.__activeMenu = null; window.__activeMenuTag = null; } };
}

// --- Material Fixes / Debug Menu UI ---
function createMaterialFixMenu() {
    const menu = document.createElement('div');
    menu.style.position = 'fixed';
    menu.style.top = '216px';
    menu.style.left = '220px';
    menu.style.background = 'rgba(255,255,255,0.97)';
    menu.style.color = '#000';
    menu.style.border = '1px solid #aaa';
    menu.style.borderRadius = '8px';
    menu.style.padding = '16px';
    menu.style.zIndex = 1000;
    menu.style.fontFamily = 'sans-serif';
    menu.style.minWidth = '280px';
    menu.innerHTML = `
        <b>Material Fixes</b><br><br>
        <label><input type="checkbox" id="mfDoubleSided"> Force Double Sided</label><br>
        <label>Env Intensity: <input id="mfEnvInt" type="range" min="0" max="5" step="0.1" value="1"> <span id="mfEnvIntVal">1.0</span></label><br>
        <label>Exposure: <input id="mfExposure" type="range" min="0" max="2.5" step="0.01" value="1"> <span id="mfExposureVal">1.00</span></label><br>
        <label><input type="checkbox" id="mfBasic"> Use Basic Shading (debug)</label><br>
        <label><input type="checkbox" id="mfIgnoreVtx"> Ignore Vertex Colors</label><br>
        <button id="mfForceWhite" style="margin-top:6px;">Force White Albedo (no map)</button>
        <button id="closeMaterialFixMenu" style="margin-top:10px;">Close</button>
    `;
    applyResponsiveMenu(menu);
    ensureSingleOpenMenu(menu, 'material');
    document.body.appendChild(menu);
    makeMenuDraggable(menu);
    centerMenuOnOpen(menu);

    // Initialize from current state
    document.getElementById('mfExposure').value = renderer.toneMappingExposure;
    document.getElementById('mfExposureVal').textContent = renderer.toneMappingExposure.toFixed(2);

    // Wire events
    document.getElementById('mfDoubleSided').addEventListener('change', (e) => {
        if (!model) return;
        model.traverse((child) => {
            if (child.isMesh && child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((mat) => { mat.side = e.target.checked ? THREE.DoubleSide : THREE.FrontSide; mat.needsUpdate = true; });
            }
        });
    });
    document.getElementById('mfEnvInt').addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        document.getElementById('mfEnvIntVal').textContent = v.toFixed(1);
        if (!model) return;
        model.traverse((child) => {
            if (child.isMesh && child.material) {
                const mats = Array.isArray(child.material) ? child.material : [child.material];
                mats.forEach((mat) => {
                    if ('envMapIntensity' in mat) mat.envMapIntensity = v;
                    mat.needsUpdate = true;
                });
            }
        });
    });
    document.getElementById('mfExposure').addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        renderer.toneMappingExposure = v;
        document.getElementById('mfExposureVal').textContent = v.toFixed(2);
    });
    document.getElementById('mfBasic').addEventListener('change', (e) => {
        if (!model) return;
        const useBasic = e.target.checked;
        model.traverse((child) => {
            if (!child.isMesh) return;
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            if (useBasic) {
                child.userData._origMaterial = child.material;
                const hasVtxColors = !!(child.geometry && child.geometry.attributes && child.geometry.attributes.color);
                const basicMats = mats.map((m) => new THREE.MeshBasicMaterial({
                    map: m.map || null,
                    color: 0xffffff, // force white so lack of map isn't black
                    vertexColors: hasVtxColors,
                    transparent: !!m.transparent,
                    opacity: (typeof m.opacity === 'number') ? m.opacity : 1
                }));
                child.material = Array.isArray(child.material) ? basicMats : basicMats[0];
            } else if (child.userData._origMaterial) {
                child.material = child.userData._origMaterial;
                delete child.userData._origMaterial;
            }
        });
    });
    document.getElementById('mfIgnoreVtx').addEventListener('change', (e) => {
        const ignore = e.target.checked;
        if (!model) return;
        model.traverse((child) => {
            if (!child.isMesh || !child.material) return;
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((mat) => {
                if ('vertexColors' in mat) { mat.vertexColors = !ignore ? mat.vertexColors : false; }
                mat.needsUpdate = true;
            });
        });
    });
    document.getElementById('mfForceWhite').addEventListener('click', () => {
        if (!model) return;
        model.traverse((child) => {
            if (!child.isMesh || !child.material) return;
            const mats = Array.isArray(child.material) ? child.material : [child.material];
            mats.forEach((mat) => {
                const hasMap = !!mat.map;
                const isBlack = mat.color && mat.color.getHex && mat.color.getHex() === 0x000000;
                if (!hasMap && isBlack) {
                    mat.color.setHex(0xffffff);
                    mat.needsUpdate = true;
                }
            });
        });
    });
    menu.querySelector('#closeMaterialFixMenu').onclick = function() { menu.remove(); if (window.__activeMenu === menu) { window.__activeMenu = null; window.__activeMenuTag = null; } };
}
// --- Camera Animation Export Menu UI ---
function createCameraExportMenu() {
window.createCameraExportMenu = createCameraExportMenu;
    const menu = document.createElement('div');
    menu.style.position = 'fixed';
    menu.style.top = '16px';
    menu.style.left = '460px';
    menu.style.background = 'rgba(255,255,255,0.97)';
    menu.style.color = '#000';
    menu.style.border = '1px solid #aaa';
    menu.style.borderRadius = '8px';
    menu.style.padding = '16px';
    menu.style.zIndex = 1000;
    menu.style.fontFamily = 'sans-serif';
    menu.style.minWidth = '320px';
    menu.innerHTML = `
        <b>Export/Import Camera Animation</b><br><br>
        <button id="downloadKeyframesJson">Download JSON</button>
        <input type="file" id="importKeyframesJson" accept="application/json" style="margin-left:10px;">
        <pre id="exportJsonPreview" style="margin-top:10px; max-height:200px; overflow:auto; background:#f7f7f7; border:1px solid #ddd; border-radius:4px; padding:8px; font-size:12px;"></pre>
        <button id="closeCameraExportMenu" style="margin-top:10px;">Close</button>
    `;
    applyResponsiveMenu(menu);
    ensureSingleOpenMenu(menu, 'cam-export');
    document.body.appendChild(menu);
    makeMenuDraggable(menu);
    centerMenuOnOpen(menu);
    // Import logic
    document.getElementById('importKeyframesJson').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const data = JSON.parse(evt.target.result);
                if (data.camera && data.keyframes) {
                    // Restore camera
                    camera.fov = data.camera.fov;
                    camera.near = data.camera.near;
                    camera.far = data.camera.far;
                    camera.position.set(data.camera.position.x, data.camera.position.y, data.camera.position.z);
                    controls.target.set(data.camera.target.x, data.camera.target.y, data.camera.target.z);
                    camera.quaternion.set(data.camera.quaternion.x, data.camera.quaternion.y, data.camera.quaternion.z, data.camera.quaternion.w);
                    camera.updateProjectionMatrix();
                    controls.update();
                    // Restore keyframes
                    window.cameraKeyframes = data.keyframes.map(kf => ({
                        position: new THREE.Vector3(kf.position.x, kf.position.y, kf.position.z),
                        target: new THREE.Vector3(kf.target.x, kf.target.y, kf.target.z),
                        zoom: kf.zoom,
                        fov: kf.fov,
                        near: kf.near,
                        far: kf.far,
                        quaternion: new THREE.Quaternion(kf.quaternion.x, kf.quaternion.y, kf.quaternion.z, kf.quaternion.w),
                        duration: kf.duration || ANIMATION_SPEED, // Use saved duration or default
                        modelAnimTime: kf.modelAnimTime || 0 // Use saved model time or default
                    }));
                    // Update preview and keyframe UI if open
                    document.getElementById('exportJsonPreview').textContent = JSON.stringify(data, null, 2);
                    if (typeof updateKeyframeList === 'function') updateKeyframeList();
                    if (typeof window.updateKeyframeList === 'function') window.updateKeyframeList();
                } else {
                    alert('Invalid camera animation JSON.');
                }
            } catch (err) {
                alert('Failed to parse JSON: ' + err.message);
            }
        };
        reader.readAsText(file);
    });

    // Build export data
    const exportData = {
        camera: {
            fov: camera.fov,
            near: camera.near,
            far: camera.far,
            position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
            target: { x: controls.target.x, y: controls.target.y, z: controls.target.z },
            quaternion: { x: camera.quaternion.x, y: camera.quaternion.y, z: camera.quaternion.z, w: camera.quaternion.w }
        },
        keyframes: (window.cameraKeyframes || []).map((kf, i) => ({
            index: i+1,
            position: { x: kf.position.x, y: kf.position.y, z: kf.position.z },
            target: { x: kf.target.x, y: kf.target.y, z: kf.target.z },
            zoom: kf.zoom,
            fov: kf.fov,
            near: kf.near,
            far: kf.far,
            quaternion: { x: kf.quaternion.x, y: kf.quaternion.y, z: kf.quaternion.z, w: kf.quaternion.w },
            duration: kf.duration || ANIMATION_SPEED, // Include duration in export
            modelAnimTime: kf.modelAnimTime || 0 // Include model animation time in export
        }))
    };
    // Show preview
    document.getElementById('exportJsonPreview').textContent = JSON.stringify(exportData, null, 2);

    document.getElementById('downloadKeyframesJson').onclick = function() {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'camera_animation.json';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 100);
    };
    menu.querySelector('#closeCameraExportMenu').onclick = function() {
        menu.remove();
        if (window.__activeMenu === menu) { window.__activeMenu = null; window.__activeMenuTag = null; }
    };
}
// --- Camera View Settings Menu UI ---
function createCameraViewSettingsMenu() {
    const menu = document.createElement('div');
    menu.style.position = 'fixed';
    menu.style.top = '16px';
    menu.style.left = '220px';
    menu.style.background = 'rgba(255,255,255,0.97)';
    menu.style.color = '#000';
    menu.style.border = '1px solid #aaa';
    menu.style.borderRadius = '8px';
    menu.style.padding = '16px';
    menu.style.zIndex = 1000;
    menu.style.fontFamily = 'sans-serif';
    menu.style.minWidth = '220px';
    menu.innerHTML = `
        <b>Camera View Settings</b><br><br>
        <label>FOV: <input id="fovSlider" type="range" min="10" max="120" step="1" value="${camera.fov}"> <span id="fovVal">${camera.fov}</span></label><br>
        <label>Near: <input id="nearSlider" type="range" min="0.01" max="10" step="0.01" value="${camera.near}"> <span id="nearVal">${camera.near}</span></label><br>
        <label>Far: <input id="farSlider" type="range" min="10" max="20000" step="1" value="${camera.far}"> <span id="farVal">${camera.far}</span></label><br>
        <button id="closeCameraViewMenu" style="margin-top:10px;">Close</button>
    `;
    applyResponsiveMenu(menu);
    ensureSingleOpenMenu(menu, 'cam-view');
    document.body.appendChild(menu);
    makeMenuDraggable(menu);
    centerMenuOnOpen(menu);

    document.getElementById('fovSlider').addEventListener('input', function() {
        camera.fov = parseFloat(this.value);
        camera.updateProjectionMatrix();
        document.getElementById('fovVal').textContent = this.value;
    });
    document.getElementById('nearSlider').addEventListener('input', function() {
        camera.near = parseFloat(this.value);
        camera.updateProjectionMatrix();
        document.getElementById('nearVal').textContent = this.value;
    });
    document.getElementById('farSlider').addEventListener('input', function() {
        camera.far = parseFloat(this.value);
        camera.updateProjectionMatrix();
        document.getElementById('farVal').textContent = this.value;
    });
    menu.querySelector('#closeCameraViewMenu').onclick = function() {
        menu.remove();
        if (window.__activeMenu === menu) { window.__activeMenu = null; window.__activeMenuTag = null; }
    };
}
// --- Camera Animation Menu UI ---
function createCameraAnimationMenu() {
    // --- Camera Animation Menu UI ---
    const menu = document.createElement('div');
    menu.style.position = 'fixed';
    menu.style.top = '100px';
    menu.style.left = '16px';
    menu.style.background = 'rgba(255,255,255,0.97)';
    menu.style.color = '#000';
    menu.style.border = '1px solid #aaa';
    menu.style.borderRadius = '8px';
    menu.style.padding = '16px';
    menu.style.zIndex = 1000;
    menu.style.fontFamily = 'sans-serif';
    menu.style.minWidth = '200px';
    menu.innerHTML = `
        <b>Camera Animation</b><br><br>
        <div style="display: flex; flex-direction: column; gap: 8px; align-items: center;">
            <button id="cam-anim-add-keyframe">Add Keyframe</button>
            <button id="cam-anim-play">Play Camera Only</button>
            <button id="cam-anim-play-sync">Play Camera + Model</button>
            <button id="cam-anim-stop">Stop All</button>
            <button id="cam-anim-clear">Clear Keyframes</button>
            <div style="margin-top:8px; width:100%; text-align:left;">
                <label>Animation Speed: <input id="animationSpeed" type="range" min="200" max="5000" step="100" value="${ANIMATION_SPEED}"> <span id="animationSpeedVal">${(ANIMATION_SPEED/1000).toFixed(1)}s</span></label>
            </div>
            <div id="model-anim-status" style="margin-top:8px; width:100%; text-align:left; font-size:12px; color:#666; background:#f0f0f0; padding:6px; border-radius:4px;"></div>
            <div id="model-anim-controls" style="margin-top:8px; width:100%; text-align:left; display:none;">
                <div style="background:#e8f4fd; border:1px solid #bee5eb; border-radius:4px; padding:8px;">
                    <b style="font-size:13px;">Model Animation Preview</b><br>
                    <div style="margin:6px 0; display:flex; gap:4px; align-items:center;">
                        <button id="model-anim-preview-play" style="font-size:12px; padding:2px 6px;">▶</button>
                        <button id="model-anim-preview-pause" style="font-size:12px; padding:2px 6px;">⏸</button>
                        <button id="model-anim-preview-stop" style="font-size:12px; padding:2px 6px;">⏹</button>
                    </div>
                    <div style="margin:6px 0;">
                        <label style="font-size:12px;">Time: <input id="model-anim-time-scrubber" type="range" min="0" max="1" step="0.01" value="0" style="width:120px;"> <span id="model-anim-time-display">0.00s / 0.00s</span></label>
                    </div>
                    <div style="font-size:11px; color:#666; margin-top:4px;">
                        Scrub through model animation to position camera keyframes at specific moments
                    </div>
                </div>
            </div>
            <div id="cam-anim-keyframes" style="margin-top:10px; width:100%; text-align:left; font-size:13px; background:#f7f7f7; border:1px solid #ddd; border-radius:4px; min-height:40px; max-height:120px; overflow-y:auto; padding:6px;"></div>
            <div style="font-size:11px; color:#888; margin-top:4px; text-align:center;">
                💡 Click on a keyframe to jump camera to that position
            </div>
        </div>
        <button id="closeCameraAnimMenu" style="margin-top:10px;">Close</button>
    `;
    applyResponsiveMenu(menu);
    ensureSingleOpenMenu(menu, 'cam-anim');
    document.body.appendChild(menu);
    makeMenuDraggable(menu);
    centerMenuOnOpen(menu);

    // --- Camera Animation Logic ---
    let animating = false;
    let animFrame = null;
    function lerpVec3(a, b, t) {
        return new THREE.Vector3(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t,
            a.z + (b.z - a.z) * t
        );
    }
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }
    function slerpQuat(a, b, t) {
        return a.clone().slerp(b, t);
    }
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }
    function animateKeyframes(keyframes, duration = 1000) {
        if (animating || keyframes.length < 2) return;
        animating = true;
        let i = 0;
        function animateToNext() {
            if (i >= keyframes.length - 1) {
                animating = false;
                return;
            }
            const start = keyframes[i];
            const end = keyframes[i+1];
            // Use the duration from the destination keyframe (end)
            const segmentDuration = end.duration || duration;
            const startTime = performance.now();
            function step(now) {
                let t = Math.min((now - startTime) / segmentDuration, 1);
                // Interpolate target, zoom, rotation, FOV, near, far
                const newTarget = lerpVec3(start.target, end.target, t);
                const newZoom = lerp(start.zoom, end.zoom, t);
                const newFov = lerp(start.fov, end.fov, t);
                const newNear = lerp(start.near, end.near, t);
                const newFar = lerp(start.far, end.far, t);
                controls.target.copy(newTarget);
                // Spherical interpolation for camera position
                const startOffset = start.position.clone().sub(start.target);
                const endOffset = end.position.clone().sub(end.target);
                const startSph = new THREE.Spherical().setFromVector3(startOffset);
                const endSph = new THREE.Spherical().setFromVector3(endOffset);
                const theta = lerp(startSph.theta, endSph.theta, t);
                const phi = lerp(startSph.phi, endSph.phi, t);
                const sph = new THREE.Spherical(newZoom, phi, theta);
                const newOffset = new THREE.Vector3().setFromSpherical(sph);
                camera.position.copy(newTarget.clone().add(newOffset));
                // Force global zoom system to match animation
                if (typeof window.targetZoom !== 'undefined') {
                    window.targetZoom = newZoom;
                }
                if (typeof currentZoom !== 'undefined') {
                    currentZoom = newZoom;
                }
                // Interpolate camera rotation (quaternion) after position update
                const newQuat = slerpQuat(start.quaternion, end.quaternion, t);
                camera.quaternion.copy(newQuat);
                // Animate FOV, near, far
                camera.fov = newFov;
                camera.near = newNear;
                camera.far = newFar;
                camera.updateProjectionMatrix();
                controls.update();
                if (t < 1) {
                    animFrame = requestAnimationFrame(step);
                } else {
                    i++;
                    animateToNext();
                }
            }
            animFrame = requestAnimationFrame(step);
        }
        animateToNext();
    }

    // Synchronized Camera + Model Animation
    function playSynchronizedAnimation() {
        if (animating || !window.cameraKeyframes || window.cameraKeyframes.length < 2) return;
        
        console.log('Starting synchronized animation...');
        
        // Start camera animation
        animateKeyframes(window.cameraKeyframes);
        
        // Start all model animations if available
        if (mixer && gltfClips && gltfClips.length > 0) {
            let startedAnimations = 0;
            gltfClips.forEach((clip, i) => {
                const action = ensureModelAction(i);
                if (action) {
                    action.reset(); // Start from beginning
                    action.paused = false;
                    action.play();
                    startedAnimations++;
                    console.log(`Started model animation: ${clip.name || `Clip ${i+1}`}`);
                }
            });
            
            if (startedAnimations > 0) {
                console.log(`Synchronized playback: Camera + ${startedAnimations} model animation(s)`);
            } else {
                console.log('Synchronized playback: Camera only (no model animations available)');
            }
        } else {
            console.log('Synchronized playback: Camera only (no model loaded or no animations)');
        }
    }
    
    function stopAllAnimations() {
        // Stop camera animation
        if (animFrame) {
            cancelAnimationFrame(animFrame);
            animFrame = null;
        }
        animating = false;
        
        // Stop all model animations
        let stoppedAnimations = 0;
        if (animationActions && animationActions.size > 0) {
            animationActions.forEach((action, i) => {
                if (action.isRunning()) {
                    action.stop();
                    stoppedAnimations++;
                }
            });
        }
        
        console.log(`Stopped all animations: Camera + ${stoppedAnimations} model animation(s)`);
    }
    
    // Helper function to ensure model animation action exists
    function ensureModelAction(i) {
        if (!mixer || !model || !gltfClips[i]) return null;
        if (!animationActions.has(i)) {
            const action = mixer.clipAction(gltfClips[i]);
            action.clampWhenFinished = true;
            action.enabled = true;
            animationActions.set(i, action);
        }
        return animationActions.get(i);
    }

    // Model Animation Preview Controls
    let previewAnimationPlaying = false;
    let maxAnimationDuration = 0;
    
    function updateAnimationDuration() {
        maxAnimationDuration = 0;
        if (gltfClips && gltfClips.length > 0) {
            maxAnimationDuration = Math.max(...gltfClips.map(clip => clip.duration || 0));
        }
        
        const scrubber = document.getElementById('model-anim-time-scrubber');
        if (scrubber) {
            scrubber.max = maxAnimationDuration;
        }
        updateTimeDisplay();
    }
    
    function updateTimeDisplay() {
        const display = document.getElementById('model-anim-time-display');
        const scrubber = document.getElementById('model-anim-time-scrubber');
        if (display && scrubber) {
            const currentTime = parseFloat(scrubber.value);
            display.textContent = `${currentTime.toFixed(2)}s / ${maxAnimationDuration.toFixed(2)}s`;
        }
    }
    
    function scrubModelAnimations(time) {
        if (!mixer || !gltfClips || gltfClips.length === 0) return;
        
        // Ensure all animations are set up and paused at the specified time
        gltfClips.forEach((clip, i) => {
            const action = ensureModelAction(i);
            if (action) {
                if (!action.isRunning()) action.play();
                action.paused = true;
                action.time = Math.min(time, clip.duration || 0);
            }
        });
        
        // Force mixer update to apply the time change
        mixer.update(0);
        updateTimeDisplay();
    }
    
    function playModelAnimationPreview() {
        if (!mixer || !gltfClips || gltfClips.length === 0) return;
        
        previewAnimationPlaying = true;
        gltfClips.forEach((clip, i) => {
            const action = ensureModelAction(i);
            if (action) {
                action.paused = false;
                if (!action.isRunning()) action.play();
            }
        });
    }
    
    function pauseModelAnimationPreview() {
        previewAnimationPlaying = false;
        if (animationActions) {
            animationActions.forEach(action => {
                action.paused = true;
            });
        }
    }
    
    function stopModelAnimationPreview() {
        previewAnimationPlaying = false;
        if (animationActions) {
            animationActions.forEach(action => {
                action.stop();
            });
        }
        
        const scrubber = document.getElementById('model-anim-time-scrubber');
        if (scrubber) {
            scrubber.value = 0;
            updateTimeDisplay();
        }
    }
    
    // Update scrubber position during preview playback
    function updateScrubberDuringPlayback() {
        if (previewAnimationPlaying && animationActions.size > 0) {
            const scrubber = document.getElementById('model-anim-time-scrubber');
            if (scrubber) {
                // Get the time from the first active animation
                const firstAction = animationActions.values().next().value;
                if (firstAction && firstAction.isRunning()) {
                    scrubber.value = firstAction.time;
                    updateTimeDisplay();
                }
            }
        }
    }

    // Camera Keyframe Navigation
    let currentSelectedKeyframe = -1;
    
    function restoreCameraToKeyframe(keyframeIndex) {
        if (!window.cameraKeyframes || keyframeIndex < 0 || keyframeIndex >= window.cameraKeyframes.length) {
            return;
        }
        
        const kf = window.cameraKeyframes[keyframeIndex];
        
        // Restore camera position and rotation
        camera.position.copy(kf.position);
        camera.quaternion.copy(kf.quaternion);
        
        // Restore camera target
        controls.target.copy(kf.target);
        
        // Restore camera settings
        camera.fov = kf.fov;
        camera.near = kf.near;
        camera.far = kf.far;
        camera.updateProjectionMatrix();
        
        // Update zoom system
        if (typeof window.targetZoom !== 'undefined') {
            window.targetZoom = kf.zoom;
        }
        if (typeof currentZoom !== 'undefined') {
            currentZoom = kf.zoom;
        }
        
        // Restore model animation time if available
        if (kf.modelAnimTime !== undefined) {
            const scrubber = document.getElementById('model-anim-time-scrubber');
            if (scrubber) {
                scrubber.value = kf.modelAnimTime;
                scrubModelAnimations(kf.modelAnimTime);
            }
        }
        
        // Update controls
        controls.update();
        
        // Update UI to show which keyframe is selected
        currentSelectedKeyframe = keyframeIndex;
        updateKeyframeList();
        
        console.log(`Jumped to keyframe #${keyframeIndex + 1}`);
    }

    // Keyframe storage (global for now)
    if (!window.cameraKeyframes) window.cameraKeyframes = [];

    function updateKeyframeList() {
        const listDiv = document.getElementById('cam-anim-keyframes');
        if (!window.cameraKeyframes.length) {
            listDiv.innerHTML = '<i>No keyframes yet.</i>';
            return;
        }
        
        // Migration: add duration to existing keyframes that don't have it
        window.cameraKeyframes.forEach(kf => {
            if (kf.duration === undefined) {
                kf.duration = ANIMATION_SPEED;
            }
        });
        
        listDiv.innerHTML = window.cameraKeyframes.map((kf, i) => {
            const transitionLabel = i === 0 ? '(Start)' : `(${(kf.duration/1000).toFixed(1)}s from #${i})`;
            const modelTimeLabel = kf.modelAnimTime !== undefined ? ` @ ${kf.modelAnimTime.toFixed(2)}s` : '';
            const isSelected = i === currentSelectedKeyframe;
            const selectedStyle = isSelected ? 'background:#d4edda; border-left:4px solid #28a745;' : '';
            const clickableStyle = 'cursor:pointer; transition:background-color 0.2s;';
            
            return `<div class='keyframe-item' data-kf='${i}' style='margin-bottom:6px; padding:6px; border-bottom:1px solid #eee; ${selectedStyle} ${clickableStyle}' 
                         onmouseover='this.style.backgroundColor="#f8f9fa"' 
                         onmouseout='this.style.backgroundColor="${isSelected ? "#d4edda" : "transparent"}"'>
                <div style='margin-bottom:4px;'>
                    <b>#${i+1}</b> ${transitionLabel}${modelTimeLabel} ${isSelected ? '<span style="color:#28a745;">●</span>' : ''}
                    <div style='float:right;'>
                        <button data-kf='${i}' class='kf-move-up' ${i===0?'disabled':''} title='Move Up' style='font-size:10px; padding:1px 4px;'>↑</button>
                        <button data-kf='${i}' class='kf-move-down' ${i===window.cameraKeyframes.length-1?'disabled':''} title='Move Down' style='font-size:10px; padding:1px 4px;'>↓</button>
                        <button data-kf='${i}' class='kf-delete' title='Delete' style='font-size:10px; padding:1px 4px;'>✕</button>
                        ${kf.modelAnimTime !== undefined ? `<button data-kf='${i}' class='kf-goto-time' title='Go to Model Time' style='font-size:10px; padding:1px 4px;'>⏰</button>` : ''}
                    </div>
                </div>
                ${i > 0 ? `<div style='margin:4px 0;'>
                    <label style='font-size:12px;'>Transition Time: 
                        <input data-kf='${i}' class='kf-duration' type='range' min='200' max='5000' step='100' value='${kf.duration}' style='width:80px;'> 
                        <span class='kf-duration-val'>${(kf.duration/1000).toFixed(1)}s</span>
                    </label>
                </div>` : ''}
                <div style='font-size:11px; color:#666;'>
                    <span style='color:#555'>Pos:</span> [${kf.position.x.toFixed(2)}, ${kf.position.y.toFixed(2)}, ${kf.position.z.toFixed(2)}] •
                    <span style='color:#555'>Target:</span> [${kf.target.x.toFixed(2)}, ${kf.target.y.toFixed(2)}, ${kf.target.z.toFixed(2)}]<br>
                    <span style='color:#555'>Zoom:</span> ${kf.zoom.toFixed(2)} • 
                    <span style='color:#555'>FOV:</span> ${kf.fov.toFixed(2)} • 
                    <span style='color:#555'>Near:</span> ${kf.near.toFixed(2)} • 
                    <span style='color:#555'>Far:</span> ${kf.far.toFixed(2)}
                </div>
            </div>`
        }).join('');
        // Add event listeners for move/delete
        listDiv.querySelectorAll('.kf-delete').forEach(btn => {
            btn.onclick = function(e) {
                e.stopPropagation(); // Prevent keyframe click
                const idx = parseInt(this.getAttribute('data-kf'));
                window.cameraKeyframes.splice(idx, 1);
                // Reset selection if deleted keyframe was selected
                if (currentSelectedKeyframe === idx) {
                    currentSelectedKeyframe = -1;
                } else if (currentSelectedKeyframe > idx) {
                    currentSelectedKeyframe--; // Adjust selection index
                }
                updateKeyframeList();
            };
        });
        listDiv.querySelectorAll('.kf-move-up').forEach(btn => {
            btn.onclick = function(e) {
                e.stopPropagation(); // Prevent keyframe click
                const idx = parseInt(this.getAttribute('data-kf'));
                if (idx > 0) {
                    const temp = window.cameraKeyframes[idx-1];
                    window.cameraKeyframes[idx-1] = window.cameraKeyframes[idx];
                    window.cameraKeyframes[idx] = temp;
                    // Update selection
                    if (currentSelectedKeyframe === idx) {
                        currentSelectedKeyframe = idx - 1;
                    } else if (currentSelectedKeyframe === idx - 1) {
                        currentSelectedKeyframe = idx;
                    }
                    updateKeyframeList();
                }
            };
        });
        listDiv.querySelectorAll('.kf-move-down').forEach(btn => {
            btn.onclick = function(e) {
                e.stopPropagation(); // Prevent keyframe click
                const idx = parseInt(this.getAttribute('data-kf'));
                if (idx < window.cameraKeyframes.length-1) {
                    const temp = window.cameraKeyframes[idx+1];
                    window.cameraKeyframes[idx+1] = window.cameraKeyframes[idx];
                    window.cameraKeyframes[idx] = temp;
                    // Update selection
                    if (currentSelectedKeyframe === idx) {
                        currentSelectedKeyframe = idx + 1;
                    } else if (currentSelectedKeyframe === idx + 1) {
                        currentSelectedKeyframe = idx;
                    }
                    updateKeyframeList();
                }
            };
        });
        
        // Add click listener for keyframe items
        listDiv.querySelectorAll('.keyframe-item').forEach(item => {
            item.onclick = function(e) {
                // Only handle clicks on the main area, not buttons
                if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
                    const idx = parseInt(this.getAttribute('data-kf'));
                    restoreCameraToKeyframe(idx);
                }
            };
        });
        listDiv.querySelectorAll('.kf-duration').forEach(slider => {
            slider.addEventListener('input', function(e) {
                e.stopPropagation(); // Prevent keyframe click
                const idx = parseInt(this.getAttribute('data-kf'));
                const duration = parseInt(this.value);
                window.cameraKeyframes[idx].duration = duration;
                const valSpan = this.parentElement.querySelector('.kf-duration-val');
                if (valSpan) valSpan.textContent = (duration/1000).toFixed(1) + 's';
                // Update the transition label
                updateKeyframeList();
            });
        });
        listDiv.querySelectorAll('.kf-goto-time').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation(); // Prevent keyframe click
                const idx = parseInt(this.getAttribute('data-kf'));
                const keyframe = window.cameraKeyframes[idx];
                if (keyframe && keyframe.modelAnimTime !== undefined) {
                    // Set model animation to this time
                    const scrubber = document.getElementById('model-anim-time-scrubber');
                    if (scrubber) {
                        scrubber.value = keyframe.modelAnimTime;
                        scrubModelAnimations(keyframe.modelAnimTime);
                    }
                }
            });
        });
    }

    document.getElementById('cam-anim-add-keyframe').onclick = function() {
        // Calculate zoom (distance from camera to target)
        const zoom = camera.position.distanceTo(controls.target);
        
        // Get current model animation time if available
        let modelAnimTime = 0;
        const scrubber = document.getElementById('model-anim-time-scrubber');
        if (scrubber) {
            modelAnimTime = parseFloat(scrubber.value);
        }
        
        window.cameraKeyframes.push({
            position: camera.position.clone(),
            target: controls.target.clone(),
            zoom: zoom,
            quaternion: camera.quaternion.clone(),
            fov: camera.fov,
            near: camera.near,
            far: camera.far,
            duration: ANIMATION_SPEED, // Default duration for transition TO this keyframe
            modelAnimTime: modelAnimTime // Store model animation time at this keyframe
        });
        
        // Auto-select the newly created keyframe
        currentSelectedKeyframe = window.cameraKeyframes.length - 1;
        updateKeyframeList();
    };
    document.getElementById('cam-anim-clear').onclick = function() {
        window.cameraKeyframes = [];
        updateKeyframeList();
    };
    document.getElementById('cam-anim-play').onclick = function() {
        if (animating) return;
        if (!window.cameraKeyframes || window.cameraKeyframes.length < 2) return;
        animateKeyframes(window.cameraKeyframes); // No longer passing global duration
    };
    
    document.getElementById('cam-anim-play-sync').onclick = function() {
        playSynchronizedAnimation();
    };
    
    document.getElementById('cam-anim-stop').onclick = function() {
        stopAllAnimations();
    };
    
    // Animation speed control
    document.getElementById('animationSpeed').addEventListener('input', function() {
        ANIMATION_SPEED = parseInt(this.value);
        document.getElementById('animationSpeedVal').textContent = (ANIMATION_SPEED/1000).toFixed(1) + 's';
    });
    
    // Update model animation status
    function updateModelAnimationStatus() {
        const statusDiv = document.getElementById('model-anim-status');
        const controlsDiv = document.getElementById('model-anim-controls');
        if (!statusDiv) return;
        
        if (!model) {
            statusDiv.innerHTML = '⚠️ No model loaded';
            if (controlsDiv) controlsDiv.style.display = 'none';
            return;
        }
        
        if (!gltfClips || gltfClips.length === 0) {
            statusDiv.innerHTML = '⚠️ No model animations available';
            if (controlsDiv) controlsDiv.style.display = 'none';
            return;
        }
        
        const animCount = gltfClips.length;
        const animNames = gltfClips.map(clip => clip.name || 'Unnamed').slice(0, 3);
        const nameList = animNames.join(', ') + (animCount > 3 ? '...' : '');
        statusDiv.innerHTML = `✅ ${animCount} model animation(s): ${nameList}`;
        
        // Show animation controls
        if (controlsDiv) {
            controlsDiv.style.display = 'block';
            updateAnimationDuration();
        }
    }
    
    // Add event listeners for model animation preview controls
    function setupModelAnimationControls() {
        const playBtn = document.getElementById('model-anim-preview-play');
        const pauseBtn = document.getElementById('model-anim-preview-pause');
        const stopBtn = document.getElementById('model-anim-preview-stop');
        const scrubber = document.getElementById('model-anim-time-scrubber');
        
        if (playBtn) {
            playBtn.onclick = playModelAnimationPreview;
        }
        
        if (pauseBtn) {
            pauseBtn.onclick = pauseModelAnimationPreview;
        }
        
        if (stopBtn) {
            stopBtn.onclick = stopModelAnimationPreview;
        }
        
        if (scrubber) {
            scrubber.addEventListener('input', function() {
                const time = parseFloat(this.value);
                scrubModelAnimations(time);
            });
        }
        
        // Update scrubber during playback
        const updateInterval = setInterval(() => {
            updateScrubberDuringPlayback();
        }, 50); // Update 20 times per second
        
        // Store interval ID to clean up later if needed
        window.modelAnimUpdateInterval = updateInterval;
    }
    
    // Update status when menu opens
    updateModelAnimationStatus();
    setupModelAnimationControls();
    
    // Add keyboard navigation for keyframes
    function handleKeyframeNavigation(e) {
        if (!window.cameraKeyframes || window.cameraKeyframes.length === 0) return;
        
        // Only handle keys when camera animation menu is open
        const menu = document.querySelector('#cam-anim-keyframes');
        if (!menu) return;
        
        let handled = false;
        
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            // Previous keyframe
            if (currentSelectedKeyframe > 0) {
                restoreCameraToKeyframe(currentSelectedKeyframe - 1);
            } else if (currentSelectedKeyframe === -1 && window.cameraKeyframes.length > 0) {
                restoreCameraToKeyframe(window.cameraKeyframes.length - 1);
            }
            handled = true;
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            // Next keyframe
            if (currentSelectedKeyframe < window.cameraKeyframes.length - 1) {
                restoreCameraToKeyframe(currentSelectedKeyframe + 1);
            } else if (currentSelectedKeyframe === -1 && window.cameraKeyframes.length > 0) {
                restoreCameraToKeyframe(0);
            }
            handled = true;
        }
        
        if (handled) {
            e.preventDefault();
            e.stopPropagation();
        }
    }
    
    // Add event listener for keyboard navigation
    document.addEventListener('keydown', handleKeyframeNavigation);
    
    // Update list on open
    updateKeyframeList();
    menu.querySelector('#closeCameraAnimMenu').onclick = function() {
        menu.remove();
        if (window.__activeMenu === menu) { window.__activeMenu = null; window.__activeMenuTag = null; }
    };
}
// --- Camera Controls Menu UI ---
function createCameraMenu() {
    const menu = document.createElement('div');
    menu.style.position = 'fixed';
    menu.style.top = '16px';
    menu.style.left = '16px';
    menu.style.background = 'rgba(255,255,255,0.97)';
    menu.style.color = '#000';
    menu.style.border = '1px solid #aaa';
    menu.style.borderRadius = '8px';
    menu.style.padding = '16px';
    menu.style.zIndex = 1000;
    menu.style.fontFamily = 'sans-serif';
    menu.style.minWidth = '180px';
    menu.innerHTML = `
        <b>Camera Controls</b><br><br>
        <div style="display: flex; flex-direction: column; gap: 8px; align-items: center;">
            <button id="cam-up">▲</button>
            <div>
                <button id="cam-left">◀</button>
                <button id="cam-reset">⟳</button>
                <button id="cam-right">▶</button>
            </div>
            <button id="cam-down">▼</button>
            <div>
                <button id="cam-forward">Zoom In</button>
                <button id="cam-backward">Zoom Out</button>
            </div>
        </div>
        <button id="closeCameraMenu" style="margin-top:10px;">Close</button>
    `;
    // Make mobile-friendly and register as the active menu on phones
    applyResponsiveMenu(menu);
    ensureSingleOpenMenu(menu, 'cam-controls');
    document.body.appendChild(menu);
    makeMenuDraggable(menu);
    centerMenuOnOpen(menu);

    // Camera movement step size
    // OrbitControls.pan expects deltas in screen pixels, not world units
    const PAN_PIXEL_STEP = 50; // 50px per button press
    // Store initial camera position and target for reset
    const initialCamPos = camera.position.clone();
    const initialTarget = controls.target.clone();

    // Fallback pan logic for Three.js r150+ (no controls.pan)
    function panCamera(deltaX, deltaY) {
        if (!controls || !camera) return;
    // Pan should move camera and target together, without affecting spherical zoom system
    const element = renderer.domElement;
    let distance = camera.position.distanceTo(controls.target);
    const fov = camera.fov * Math.PI / 180;
    const height = 2 * Math.tan(fov / 2) * distance;
    const width = height * camera.aspect;
    const panX = -(deltaX * width / element.clientWidth);
    const panY = (deltaY * height / element.clientHeight);
    // Get camera right and up vectors
    const right = new THREE.Vector3();
    camera.getWorldDirection(right);
    right.crossVectors(camera.up, right).normalize();
    const up = new THREE.Vector3();
    up.copy(camera.up).normalize();
    // Calculate pan offset
    const pan = new THREE.Vector3();
    pan.addScaledVector(right, panX);
    pan.addScaledVector(up, panY);
    // Move both camera and target by the same amount
    camera.position.add(pan);
    controls.target.add(pan);
    controls.update();
    }

    document.getElementById('cam-up').onclick = function() {
        panCamera(0, -PAN_PIXEL_STEP); // up is negative Y in screen space
    };
    document.getElementById('cam-down').onclick = function() {
        panCamera(0, PAN_PIXEL_STEP);
    };
    document.getElementById('cam-left').onclick = function() {
        panCamera(PAN_PIXEL_STEP, 0); // left is positive X in screen space
    };
    document.getElementById('cam-right').onclick = function() {
        panCamera(-PAN_PIXEL_STEP, 0);
    };
    document.getElementById('cam-forward').onclick = function() {
        // Zoom in by decreasing targetZoom
        if (window.targetZoom !== undefined) {
            window.targetZoom = Math.max(window.targetZoom - ZOOM_SPEED, controls.minDistance);
        }
    };
    document.getElementById('cam-backward').onclick = function() {
        // Zoom out by increasing targetZoom
        if (window.targetZoom !== undefined) {
            window.targetZoom = Math.min(window.targetZoom + ZOOM_SPEED, controls.maxDistance);
        }
    };
    document.getElementById('cam-reset').onclick = function() {
        camera.position.copy(initialCamPos);
        controls.target.copy(initialTarget);
        if (window.targetZoom !== undefined) {
            // Reset zoom as well
            let offset = new THREE.Vector3();
            offset.copy(camera.position).sub(controls.target);
            let spherical = new THREE.Spherical();
            spherical.setFromVector3(offset);
            window.targetZoom = spherical.radius;
        }
        controls.update();
    };
    menu.querySelector('#closeCameraMenu').onclick = function() {
        menu.remove();
        if (window.__activeMenu === menu) { window.__activeMenu = null; window.__activeMenuTag = null; }
    };
}
// --- Settings Menu UI ---
function createSettingsMenu() {
    const menu = document.createElement('div');
    menu.style.position = 'fixed';
    menu.style.top = '16px';
    menu.style.right = '16px';
    menu.style.background = 'rgba(255,255,255,0.97)';
    menu.style.color = '#000';
    menu.style.border = '1px solid #aaa';
    menu.style.borderRadius = '8px';
    menu.style.padding = '16px';
    menu.style.zIndex = 1000;
    menu.style.fontFamily = 'sans-serif';
    menu.style.minWidth = '220px';
        menu.innerHTML = `
            <b>Zoom Settings</b><br><br>
            <label>Zoom Speed: <input id="zoomSpeed" type="range" min="0.001" max="0.2" step="0.001" value="${ZOOM_SPEED}"> <span id="zoomSpeedVal">${ZOOM_SPEED}</span></label><br>
        <label>Damping: <input id="dampingFactor" type="range" min="0" max="1" step="0.01" value="${controls.dampingFactor}"> <span id="dampingVal">${controls.dampingFactor}</span></label><br>
        <label>Min Distance: <input id="minDistance" type="range" min="0.01" max="10" step="0.01" value="${controls.minDistance}"> <span id="minDistVal">${controls.minDistance}</span></label><br>
    <label>Max Distance: <input id="maxDistance" type="range" min="10" max="1000000" step="1" value="${controls.maxDistance}"> <span id="maxDistVal">${controls.maxDistance}</span></label><br>
        <button id="closeMenu" style="margin-top:10px;">Close</button>
    `;
    document.body.appendChild(menu);
    makeMenuDraggable(menu);
    centerMenuOnOpen(menu);

    // Update values on change
    const zoomSpeed = document.getElementById('zoomSpeed');
    const damping = document.getElementById('dampingFactor');
    const minDist = document.getElementById('minDistance');
    const maxDist = document.getElementById('maxDistance');
    zoomSpeed.addEventListener('input', function() {
        controls.zoomSpeed = parseFloat(this.value);
        document.getElementById('zoomSpeedVal').textContent = this.value;
    });
    damping.addEventListener('input', function() {
        controls.dampingFactor = parseFloat(this.value);
            ZOOM_SPEED = parseFloat(this.value); // Update the smooth zoom step size
    });
    minDist.addEventListener('input', function() {
        controls.minDistance = parseFloat(this.value);
        document.getElementById('minDistVal').textContent = this.value;
    });
    maxDist.addEventListener('input', function() {
        controls.maxDistance = parseFloat(this.value);
        document.getElementById('maxDistVal').textContent = this.value;
    });
    menu.querySelector('#closeMenu').onclick = function() {
        menu.remove();
        if (window.__activeMenu === menu) { window.__activeMenu = null; window.__activeMenuTag = null; }
    };
}


import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


// --- Zoom Smoothness Constants ---
let ZOOM_SPEED = 0.05; // Match reference project for smooth, small steps
const ZOOM_SMOOTHING = 0.1; // Match reference project

// --- Camera Animation Speed Constants ---
let ANIMATION_SPEED = 1200; // Default duration in milliseconds per keyframe segment

let scene, camera, renderer, controls, model;
// --- Animation globals ---
let mixer = null;
let clock = new THREE.Clock();
let gltfClips = [];
let animationActions = new Map(); // key: clip index, value: THREE.AnimationAction

function getAnimatedNodeNamesForClip(clip, root) {
    // Parse node names from track names like 'NodeName.property' or 'node_uuid.property'
    const names = new Set();
    if (!clip || !clip.tracks) return [];
    for (const track of clip.tracks) {
        const parts = track.name.split('.');
        const nodeId = parts[0];
        if (!nodeId) continue;
        // Try to find by name first
        let found = root.getObjectByName(nodeId);
        if (!found) {
            // Fallback: try by UUID
            found = root.getObjectByProperty('uuid', nodeId);
        }
        if (found && found.name) names.add(found.name);
        else if (found) names.add(found.type);
        else names.add(nodeId);
    }
    return Array.from(names).sort();
}

function createAnimationsMenu() {
    const menu = document.createElement('div');
    menu.style.position = 'fixed';
    menu.style.top = '140px';
    menu.style.left = '16px';
    menu.style.background = 'rgba(255,255,255,0.97)';
    menu.style.color = '#000';
    menu.style.border = '1px solid #aaa';
    menu.style.borderRadius = '8px';
    menu.style.padding = '16px';
    menu.style.zIndex = 1000;
    menu.style.fontFamily = 'sans-serif';
    menu.style.minWidth = '320px';
    menu.innerHTML = `
        <b>Animations</b><br><br>
        <div style="display:flex; gap:8px; margin-bottom:10px;">
            <button id="anim-play-all">Play All</button>
            <button id="anim-pause-all">Pause All</button>
            <button id="anim-stop-all">Stop All</button>
        </div>
        <div id="anim-clips-list" style="max-height:260px; overflow:auto; background:#f7f7f7; border:1px solid #ddd; border-radius:4px; padding:8px;"></div>
        <button id="closeAnimationsMenu" style="margin-top:10px;">Close</button>
    `;
    applyResponsiveMenu(menu);
    ensureSingleOpenMenu(menu, 'gltf-anims');
    document.body.appendChild(menu);
    makeMenuDraggable(menu);
    centerMenuOnOpen(menu);

    function buildList() {
        const list = document.getElementById('anim-clips-list');
        if (!gltfClips || gltfClips.length === 0) {
            list.innerHTML = '<i>No animations found in the loaded model.</i>';
            return;
        }
        list.innerHTML = gltfClips.map((clip, i) => {
            const animatedNodes = model ? getAnimatedNodeNamesForClip(clip, model) : [];
            const dur = (clip.duration || 0).toFixed(2);
            const nodesSummary = animatedNodes.length ? `${animatedNodes.length} node(s)` : 'unknown nodes';
            return `
            <div style="padding:8px; margin-bottom:8px; background:#fff; border:1px solid #eee; border-radius:4px;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:8px;">
                    <div>
                        <b>${clip.name || 'Clip ' + (i+1)}</b>
                        <div style="font-size:12px; color:#666;">Duration: ${dur}s • Affects: ${nodesSummary}</div>
                    </div>
                    <div style="display:flex; gap:6px;">
                        <button data-i="${i}" class="anim-play">Play</button>
                        <button data-i="${i}" class="anim-pause">Pause</button>
                        <button data-i="${i}" class="anim-stop">Stop</button>
                    </div>
                </div>
                <div style="margin-top:6px; display:flex; flex-wrap:wrap; gap:10px; align-items:center;">
                    <label style="font-size:12px;">Loop <input data-i="${i}" type="checkbox" class="anim-loop" checked></label>
                    <label style="font-size:12px;">Speed <input data-i="${i}" type="range" class="anim-speed" min="0.1" max="3" step="0.1" value="1"> <span id="anim-speed-val-${i}">1.0x</span></label>
                    <label style="font-size:12px; flex:1;">Time <input data-i="${i}" type="range" class="anim-time" min="0" max="${clip.duration || 0}" step="0.01" value="0" style="width:100%"> <span id="anim-time-val-${i}">0.00s</span></label>
                    <button data-i="${i}" class="anim-show-nodes">Show nodes</button>
                </div>
                <div id="anim-nodes-${i}" style="display:none; margin-top:6px; font-size:12px; color:#333; max-height:120px; overflow:auto; background:#fafafa; border:1px dashed #ddd; padding:6px; border-radius:4px;">${animatedNodes.map(n=>`<code style="margin-right:6px;">${n}</code>`).join(' ') || '<i>No nodes parsed.</i>'}</div>
            </div>`;
        }).join('');

        // Wire events
        list.querySelectorAll('.anim-play').forEach(btn => btn.addEventListener('click', () => playClip(parseInt(btn.getAttribute('data-i')))));
        list.querySelectorAll('.anim-pause').forEach(btn => btn.addEventListener('click', () => pauseClip(parseInt(btn.getAttribute('data-i')))));
        list.querySelectorAll('.anim-stop').forEach(btn => btn.addEventListener('click', () => stopClip(parseInt(btn.getAttribute('data-i')))));
        list.querySelectorAll('.anim-loop').forEach(inp => inp.addEventListener('change', () => setClipLoop(parseInt(inp.getAttribute('data-i')), inp.checked)));
        list.querySelectorAll('.anim-speed').forEach(inp => inp.addEventListener('input', () => setClipSpeed(parseInt(inp.getAttribute('data-i')), parseFloat(inp.value))));
        list.querySelectorAll('.anim-time').forEach(inp => inp.addEventListener('input', () => setClipTime(parseInt(inp.getAttribute('data-i')), parseFloat(inp.value))));
        list.querySelectorAll('.anim-show-nodes').forEach(btn => btn.addEventListener('click', () => toggleNodes(parseInt(btn.getAttribute('data-i')))));
    }

    function ensureAction(i) {
        if (!mixer || !model || !gltfClips[i]) return null;
        if (!animationActions.has(i)) {
            const action = mixer.clipAction(gltfClips[i]);
            action.clampWhenFinished = true;
            action.enabled = true;
            animationActions.set(i, action);
        }
        return animationActions.get(i);
    }

    function playClip(i) {
        const action = ensureAction(i);
        if (!action) return;
        action.paused = false;
        action.play();
    }
    function pauseClip(i) {
        const action = ensureAction(i);
        if (!action) return;
        action.paused = !action.paused;
    }
    function stopClip(i) {
        const action = ensureAction(i);
        if (!action) return;
        action.stop();
        const tVal = document.getElementById(`anim-time-val-${i}`);
        if (tVal) tVal.textContent = '0.00s';
        const tSlider = menu.querySelector(`.anim-time[data-i="${i}"]`);
        if (tSlider) tSlider.value = 0;
    }
    function setClipLoop(i, loop) {
        const action = ensureAction(i);
        if (!action) return;
        action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    }
    function setClipSpeed(i, speed) {
        const action = ensureAction(i);
        if (!action) return;
        action.timeScale = speed;
        const label = document.getElementById(`anim-speed-val-${i}`);
        if (label) label.textContent = `${speed.toFixed(1)}x`;
    }
    function setClipTime(i, time) {
        const action = ensureAction(i);
        if (!action) return;
        // Scrub: ensure action is playing but paused to reflect time
        if (!action.isRunning()) action.play();
        action.paused = true;
        action.time = Math.max(0, Math.min(time, gltfClips[i].duration || 0));
        mixer.update(0); // apply immediate
        const label = document.getElementById(`anim-time-val-${i}`);
        if (label) label.textContent = `${action.time.toFixed(2)}s`;
    }
    function toggleNodes(i) {
        const div = document.getElementById(`anim-nodes-${i}`);
        if (div) div.style.display = div.style.display === 'none' ? 'block' : 'none';
    }

    document.getElementById('anim-play-all').onclick = function() {
        if (!gltfClips) return;
        gltfClips.forEach((_, i) => {
            const action = ensureAction(i);
            if (action) { action.paused = false; action.play(); }
        });
    };
    document.getElementById('anim-pause-all').onclick = function() {
        animationActions.forEach(action => { action.paused = true; });
    };
    document.getElementById('anim-stop-all').onclick = function() {
        animationActions.forEach(action => { action.stop(); });
        // Reset all time sliders
        gltfClips.forEach((_, i) => {
            const tVal = document.getElementById(`anim-time-val-${i}`);
            if (tVal) tVal.textContent = '0.00s';
            const tSlider = menu.querySelector(`.anim-time[data-i="${i}"]`);
            if (tSlider) tSlider.value = 0;
        });
    };
    menu.querySelector('#closeAnimationsMenu').onclick = function() { menu.remove(); if (window.__activeMenu === menu) { window.__activeMenu = null; window.__activeMenuTag = null; } };

    buildList();
}

function init() {
    // Basic mobile detection for layout tweaks
    const isMobile = matchMedia('(pointer: coarse), (max-width: 768px)').matches;
    window.__isMobile = isMobile;
    
    // Add initial help text
    addInitialHelpText();
    // Build desktop toolbar (only on desktop)
    const desktopBar = document.getElementById('desktop-toolbar');
    if (desktopBar && !isMobile) {
        const addBtn = (iconText, handler, title) => {
            const b = document.createElement('button');
            b.textContent = iconText;
            if (title) b.title = title;
            b.onclick = handler;
            return b;
        };
        const sep = () => { const d = document.createElement('div'); d.className = 'group-sep'; return d; };

        // File
        desktopBar.appendChild(addBtn('📂', () => document.getElementById('upload').click(), 'Open Model'));
        desktopBar.appendChild(sep());
        // Camera
        desktopBar.appendChild(addBtn('🎥', () => toggleMenu('cam-controls', createCameraMenu), 'Camera Controls'));
        desktopBar.appendChild(addBtn('🔭', () => toggleMenu('cam-view', createCameraViewSettingsMenu), 'View Settings'));
        desktopBar.appendChild(addBtn('▶️', () => toggleMenu('cam-anim', createCameraAnimationMenu), 'Camera Animation'));
        desktopBar.appendChild(addBtn('🗄️', () => toggleMenu('cam-export', createCameraExportMenu), 'Export Camera JSON'));
        desktopBar.appendChild(sep());
        // Scene
        desktopBar.appendChild(addBtn('💡', () => toggleMenu('lighting', createLightingMenu), 'Lighting'));
        desktopBar.appendChild(addBtn('🖼️', () => toggleMenu('background', createBackgroundMenu), 'Background'));
        desktopBar.appendChild(addBtn('🧵', () => toggleMenu('texture', createTextureMenu), 'Texture'));
        desktopBar.appendChild(addBtn('🎨', () => toggleMenu('material', createMaterialFixMenu), 'Material Fixes'));
        desktopBar.appendChild(addBtn('🧩', () => toggleMenu('scene', createSceneSettingsMenu), 'Scene Settings'));
        desktopBar.appendChild(sep());
        // Animations
        desktopBar.appendChild(addBtn('🎞️', () => toggleMenu('gltf-anims', createAnimationsMenu), 'GLTF Animations'));
        desktopBar.appendChild(sep());
        // Export
        desktopBar.appendChild(addBtn('🌐', () => exportStandaloneWebsite(), 'Export Standalone Website'));
        desktopBar.appendChild(addBtn('📱', () => togglePhonePreview(), 'Phone Preview Mode'));
        desktopBar.appendChild(sep());
        // Zoom Settings
        desktopBar.appendChild(addBtn('🔧', () => toggleMenu('zoom-settings', createSettingsMenu), 'Zoom Settings'));
    }
    // Add scene settings menu button
    const sceneBtn = document.createElement('button');
    sceneBtn.textContent = 'Scene Settings';
    sceneBtn.style.position = 'fixed';
    sceneBtn.style.top = '176px';
    sceneBtn.style.left = '220px';
    sceneBtn.style.zIndex = 999;
    sceneBtn.style.padding = '8px 16px';
    sceneBtn.style.fontSize = '14px';
    sceneBtn.style.borderRadius = '6px';
    sceneBtn.style.border = '1px solid #aaa';
    sceneBtn.style.background = '#fff';
    sceneBtn.style.cursor = 'pointer';
    sceneBtn.onclick = createSceneSettingsMenu;
    document.body.appendChild(sceneBtn);
    // Hidden on both mobile and desktop (desktop toolbar replaces it)
    sceneBtn.style.display = 'none';
    // Add lighting menu button
    const lightBtn = document.createElement('button');
    lightBtn.textContent = 'Lighting';
    lightBtn.style.position = 'fixed';
    lightBtn.style.top = '56px';
    lightBtn.style.left = '220px';
    lightBtn.style.zIndex = 999;
    lightBtn.style.padding = '8px 16px';
    lightBtn.style.fontSize = '14px';
    lightBtn.style.borderRadius = '6px';
    lightBtn.style.border = '1px solid #aaa';
    lightBtn.style.background = '#fff';
    lightBtn.style.cursor = 'pointer';
    lightBtn.onclick = createLightingMenu;
    document.body.appendChild(lightBtn);
    lightBtn.style.display = 'none';
    // Add background menu button
    const bgBtn = document.createElement('button');
    bgBtn.textContent = 'Background';
    bgBtn.style.position = 'fixed';
    bgBtn.style.top = '96px';
    bgBtn.style.left = '220px';
    bgBtn.style.zIndex = 999;
    bgBtn.style.padding = '8px 16px';
    bgBtn.style.fontSize = '14px';
    bgBtn.style.borderRadius = '6px';
    bgBtn.style.border = '1px solid #aaa';
    bgBtn.style.background = '#fff';
    bgBtn.style.cursor = 'pointer';
    bgBtn.onclick = createBackgroundMenu;
    document.body.appendChild(bgBtn);
    bgBtn.style.display = 'none';
    // Add texture menu button
    const texBtn = document.createElement('button');
    texBtn.textContent = 'Texture';
    texBtn.style.position = 'fixed';
    texBtn.style.top = '136px';
    texBtn.style.left = '220px';
    texBtn.style.zIndex = 999;
    texBtn.style.padding = '8px 16px';
    texBtn.style.fontSize = '14px';
    texBtn.style.borderRadius = '6px';
    texBtn.style.border = '1px solid #aaa';
    texBtn.style.background = '#fff';
    texBtn.style.cursor = 'pointer';
    texBtn.onclick = createTextureMenu;
    document.body.appendChild(texBtn);
    texBtn.style.display = 'none';
    // Add material fix menu button
    const matFixBtn = document.createElement('button');
    matFixBtn.textContent = 'Material Fixes';
    matFixBtn.style.position = 'fixed';
    matFixBtn.style.top = '216px';
    matFixBtn.style.left = '220px';
    matFixBtn.style.zIndex = 999;
    matFixBtn.style.padding = '8px 16px';
    matFixBtn.style.fontSize = '14px';
    matFixBtn.style.borderRadius = '6px';
    matFixBtn.style.border = '1px solid #aaa';
    matFixBtn.style.background = '#fff';
    matFixBtn.style.cursor = 'pointer';
    matFixBtn.onclick = createMaterialFixMenu;
    document.body.appendChild(matFixBtn);
    matFixBtn.style.display = 'none';
    // Add camera export menu button
    const exportBtn = document.createElement('button');
    exportBtn.textContent = 'Export Camera JSON';
    exportBtn.style.position = 'fixed';
    exportBtn.style.top = '16px';
    exportBtn.style.left = '460px';
    exportBtn.style.zIndex = 999;
    exportBtn.style.padding = '8px 16px';
    exportBtn.style.fontSize = '14px';
    exportBtn.style.borderRadius = '6px';
    exportBtn.style.border = '1px solid #aaa';
    exportBtn.style.background = '#fff';
    exportBtn.style.cursor = 'pointer';
    exportBtn.onclick = createCameraExportMenu;
    document.body.appendChild(exportBtn);
    exportBtn.style.display = 'none';
    // Add camera view settings menu button
    const viewBtn = document.createElement('button');
    viewBtn.textContent = 'Camera View Settings';
    viewBtn.style.position = 'fixed';
    viewBtn.style.top = '16px';
    viewBtn.style.left = '220px';
    viewBtn.style.zIndex = 999;
    viewBtn.style.padding = '8px 16px';
    viewBtn.style.fontSize = '14px';
    viewBtn.style.borderRadius = '6px';
    viewBtn.style.border = '1px solid #aaa';
    viewBtn.style.background = '#fff';
    viewBtn.style.cursor = 'pointer';
    viewBtn.onclick = createCameraViewSettingsMenu;
    document.body.appendChild(viewBtn);
    viewBtn.style.display = 'none';
    // Add camera animation menu button
    const animBtn = document.createElement('button');
    animBtn.textContent = 'Camera Animation';
    animBtn.style.position = 'fixed';
    animBtn.style.top = '96px';
    animBtn.style.left = '16px';
    animBtn.style.zIndex = 999;
    animBtn.style.padding = '8px 16px';
    animBtn.style.fontSize = '14px';
    animBtn.style.borderRadius = '6px';
    animBtn.style.border = '1px solid #aaa';
    animBtn.style.background = '#fff';
    animBtn.style.cursor = 'pointer';
    animBtn.onclick = createCameraAnimationMenu;
    document.body.appendChild(animBtn);
    animBtn.style.display = 'none';
    // Add animations menu button
    const gltfAnimBtn = document.createElement('button');
    gltfAnimBtn.textContent = 'Animations';
    gltfAnimBtn.style.position = 'fixed';
    gltfAnimBtn.style.top = '136px';
    gltfAnimBtn.style.left = '16px';
    gltfAnimBtn.style.zIndex = 999;
    gltfAnimBtn.style.padding = '8px 16px';
    gltfAnimBtn.style.fontSize = '14px';
    gltfAnimBtn.style.borderRadius = '6px';
    gltfAnimBtn.style.border = '1px solid #aaa';
    gltfAnimBtn.style.background = '#fff';
    gltfAnimBtn.style.cursor = 'pointer';
    gltfAnimBtn.onclick = createAnimationsMenu;
    document.body.appendChild(gltfAnimBtn);
    gltfAnimBtn.style.display = 'none';
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0); // light gray

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 20000);
    camera.position.set(0, 0, 5); // start at z=5, looking at origin

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Limit DPR on mobile to save battery/heat
    const maxDPR = isMobile ? 1.5 : 2;
    const dpr = Math.min(window.devicePixelRatio || 1, maxDPR);
    renderer.setPixelRatio(dpr);
    // Color management and tonemapping suitable for PBR workflows
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.physicallyCorrectLights = true;
    document.body.appendChild(renderer.domElement);
    // Improve touch interop: allow pinch-zoom while preventing page scroll on canvas
    renderer.domElement.style.touchAction = 'none';
    // Provide a default environment so metallic/roughness materials have reflections
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
    scene.environment = envTex;

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x888888, 1.2);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(3, 10, 10);
    scene.add(dirLight);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.zoomSpeed = 0.8;
    // Disable built-in zoom to avoid conflicts with custom smooth zoom (wheel/pinch)
    controls.enableZoom = false;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.minDistance = 1;
    controls.maxDistance = 8;
    controls.maxPolarAngle = Math.PI / 2;
    controls.rotateSpeed = 0.5;
    controls.panSpeed = 0.5;
    // --- Smooth Zoom Variables ---
    // --- Smooth Zoom Variables ---
    let offset = new THREE.Vector3();
    offset.copy(camera.position).sub(controls.target);
    let spherical = new THREE.Spherical();
    spherical.setFromVector3(offset);
    window.targetZoom = spherical.radius;
    let currentZoom = spherical.radius;

    renderer.domElement.addEventListener('wheel', function(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 1 : -1;
        targetZoom = THREE.MathUtils.clamp(
            targetZoom + delta * ZOOM_SPEED,
            controls.minDistance,
            controls.maxDistance
        );
    }, { passive: false });

    // Sync OrbitControls pinch with our smooth zoom target
    let lastPinchDistance = null;
    renderer.domElement.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastPinchDistance = Math.hypot(dx, dy);
        }
    }, { passive: true });
    renderer.domElement.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches.length === 2 && lastPinchDistance != null) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const d = Math.hypot(dx, dy);
            const diff = d - lastPinchDistance; // positive = zoom in
            const sign = diff < 0 ? 1 : -1; // emulate wheel delta direction
            window.targetZoom = THREE.MathUtils.clamp(
                window.targetZoom + sign * ZOOM_SPEED,
                controls.minDistance,
                controls.maxDistance
            );
            lastPinchDistance = d;
        }
    }, { passive: false });
    renderer.domElement.addEventListener('touchend', () => { lastPinchDistance = null; }, { passive: true });

    function animateZoom() {
        // Smoothly interpolate currentZoom toward targetZoom
    currentZoom += (window.targetZoom - currentZoom) * ZOOM_SMOOTHING;
    if (Math.abs(currentZoom - window.targetZoom) < 0.0001) currentZoom = window.targetZoom;
        // Update camera position using spherical coordinates
        let offset = new THREE.Vector3();
        offset.copy(camera.position).sub(controls.target);
        let spherical = new THREE.Spherical();
        spherical.setFromVector3(offset);
    spherical.radius = currentZoom;
        offset.setFromSpherical(spherical);
        camera.position.copy(controls.target).add(offset);
        camera.updateProjectionMatrix();
        requestAnimationFrame(animateZoom);
    }
    animateZoom();
    controls.target.set(0, 0, 0);
    controls.update();

    // Add settings menu button (also mirrored into mobile toolbar)
    const btn = document.createElement('button');
    btn.textContent = 'Zoom Settings';
    Object.assign(btn.style, { position:'fixed', top:'16px', right:'16px', zIndex:999, padding:'8px 16px', fontSize:'14px', borderRadius:'6px', border:'1px solid #aaa', background:'#fff', cursor:'pointer' });
    btn.onclick = createSettingsMenu;
    document.body.appendChild(btn);
    btn.style.display = 'none';

    // Add camera controls menu button
    const camBtn = document.createElement('button');
    camBtn.textContent = 'Camera Controls';
    camBtn.style.position = 'fixed';
    camBtn.style.top = '56px';
    camBtn.style.left = '16px';
    camBtn.style.zIndex = 999;
    camBtn.style.padding = '8px 16px';
    camBtn.style.fontSize = '14px';
    camBtn.style.borderRadius = '6px';
    camBtn.style.border = '1px solid #aaa';
    camBtn.style.background = '#fff';
    camBtn.style.cursor = 'pointer';
    camBtn.onclick = createCameraMenu;
    document.body.appendChild(camBtn);
    camBtn.style.display = 'none';

    // Populate mobile toolbar with icon-only buttons for small screens
    const mobileBar = document.getElementById('mobile-toolbar');
    if (mobileBar && isMobile) {
        const mkBtn = (iconText, handler, title) => {
            const b = document.createElement('button');
            b.textContent = iconText;
            b.title = title || '';
            b.style.padding = '0';
            b.style.fontSize = '22px';
            b.style.width = '44px';
            b.style.height = '44px';
            b.style.border = '1px solid #aaa';
            b.style.borderRadius = '10px';
            b.style.background = '#fff';
            b.style.whiteSpace = 'nowrap';
            b.onclick = handler;
            return b;
        };
        // Open (file) icon triggers hidden input
        const openHandler = () => document.getElementById('upload').click();
        mobileBar.appendChild(mkBtn('📂', openHandler, 'Open Model'));
        mobileBar.appendChild(mkBtn('🎥', () => toggleMenu('cam-controls', createCameraMenu), 'Camera Controls'));
        mobileBar.appendChild(mkBtn('🔭', () => toggleMenu('cam-view', createCameraViewSettingsMenu), 'View Settings'));
        mobileBar.appendChild(mkBtn('▶️', () => toggleMenu('cam-anim', createCameraAnimationMenu), 'Camera Animation'));
        mobileBar.appendChild(mkBtn('🎞️', () => toggleMenu('gltf-anims', createAnimationsMenu), 'GLTF Animations'));
        mobileBar.appendChild(mkBtn('💡', () => toggleMenu('lighting', createLightingMenu), 'Lighting'));
        mobileBar.appendChild(mkBtn('🖼️', () => toggleMenu('background', createBackgroundMenu), 'Background'));
        mobileBar.appendChild(mkBtn('🎨', () => toggleMenu('material', createMaterialFixMenu), 'Material Fixes'));
        mobileBar.appendChild(mkBtn('🧩', () => toggleMenu('scene', createSceneSettingsMenu), 'Scene Settings'));
        mobileBar.appendChild(mkBtn('📱', () => togglePhonePreview(), 'Phone Preview'));
        mobileBar.appendChild(mkBtn('🌐', () => exportStandaloneWebsite(), 'Export Website'));
    }

    window.addEventListener('resize', onWindowResize, false);
    
    // Drag and Drop functionality for model files
    setupDragAndDrop();
    
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // Keep pixel ratio in check on mobile
    const isMobile = matchMedia('(pointer: coarse), (max-width: 768px)').matches;
    const maxDPR = isMobile ? 1.5 : 2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDPR));
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (mixer) mixer.update(clock.getDelta());
    renderer.render(scene, camera);
}

function setupDragAndDrop() {
    // Create drag overlay for visual feedback
    const dragOverlay = document.createElement('div');
    dragOverlay.id = 'drag-overlay';
    dragOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 123, 255, 0.1);
        border: 3px dashed #007bff;
        z-index: 10000;
        display: none;
        pointer-events: none;
        backdrop-filter: blur(2px);
    `;
    
    // Add text to overlay
    const overlayText = document.createElement('div');
    overlayText.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 24px;
        font-weight: bold;
        color: #007bff;
        text-align: center;
        font-family: system-ui, -apple-system, sans-serif;
        text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
    `;
    overlayText.innerHTML = '🎯 Drop 3D Model Here<br><small style="font-size: 16px;">GLB or GLTF files</small>';
    dragOverlay.appendChild(overlayText);
    document.body.appendChild(dragOverlay);
    
    let dragCounter = 0;
    
    // File type validation
    function isValidModelFile(file) {
        const validExtensions = ['.glb', '.gltf'];
        const validMimeTypes = ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream'];
        
        const fileName = file.name.toLowerCase();
        const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
        const hasValidMimeType = validMimeTypes.includes(file.type);
        
        return hasValidExtension || hasValidMimeType;
    }
    
    // Drag enter
    document.addEventListener('dragenter', function(e) {
        e.preventDefault();
        dragCounter++;
        
        // Check if dragged items contain files
        if (e.dataTransfer.types && e.dataTransfer.types.includes('Files')) {
            // Update overlay text based on file types if possible
            let hasModelFiles = false;
            if (e.dataTransfer.items) {
                for (let item of e.dataTransfer.items) {
                    if (item.kind === 'file') {
                        const file = item.getAsFile();
                        if (file && isValidModelFile(file)) {
                            hasModelFiles = true;
                            break;
                        }
                    }
                }
            }
            
            if (hasModelFiles) {
                overlayText.innerHTML = '🎯 Drop 3D Model Here<br><small style="font-size: 16px;">GLB or GLTF detected!</small>';
                dragOverlay.style.borderColor = '#28a745';
                dragOverlay.style.background = 'rgba(40, 167, 69, 0.1)';
                overlayText.style.color = '#28a745';
            } else {
                overlayText.innerHTML = '🎯 Drop 3D Model Here<br><small style="font-size: 16px;">GLB or GLTF files only</small>';
                dragOverlay.style.borderColor = '#007bff';
                dragOverlay.style.background = 'rgba(0, 123, 255, 0.1)';
                overlayText.style.color = '#007bff';
            }
            
            dragOverlay.style.display = 'block';
        }
    });
    
    // Drag over
    document.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    });
    
    // Drag leave
    document.addEventListener('dragleave', function(e) {
        e.preventDefault();
        dragCounter--;
        
        if (dragCounter === 0) {
            dragOverlay.style.display = 'none';
        }
    });
    
    // Drop
    document.addEventListener('drop', function(e) {
        e.preventDefault();
        dragCounter = 0;
        dragOverlay.style.display = 'none';
        
        const files = Array.from(e.dataTransfer.files);
        
        if (files.length === 0) return;
        
        // Find the first valid model file
        const modelFile = files.find(file => isValidModelFile(file));
        
        if (modelFile) {
            console.log(`Loading model via drag & drop: ${modelFile.name}`);
            loadGLB(modelFile);
            
            // Show success feedback
            showDropFeedback(`✅ Loading ${modelFile.name}`, 'success');
        } else {
            // Show error feedback
            showDropFeedback('❌ Please drop a GLB or GLTF file', 'error');
        }
    });
    
    // Prevent default drag behavior on canvas to avoid conflicts
    renderer.domElement.addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    renderer.domElement.addEventListener('drop', function(e) {
        e.preventDefault();
    });
}

function showDropFeedback(message, type) {
    // Create temporary feedback message
    const feedback = document.createElement('div');
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 20px;
        border-radius: 8px;
        font-family: system-ui, -apple-system, sans-serif;
        font-weight: bold;
        z-index: 10001;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: opacity 0.3s ease;
        ${type === 'success' 
            ? 'background: #d4edda; color: #155724; border: 1px solid #c3e6cb;'
            : 'background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;'
        }
    `;
    feedback.textContent = message;
    document.body.appendChild(feedback);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        feedback.style.opacity = '0';
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 300);
    }, 3000);
}

function addInitialHelpText() {
    const helpText = document.createElement('div');
    helpText.id = 'initial-help-text';
    helpText.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        color: #666;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 18px;
        z-index: 100;
        pointer-events: none;
        user-select: none;
    `;
    helpText.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 16px;">🎯</div>
        <div style="font-weight: bold; margin-bottom: 8px;">Drag & Drop a 3D Model</div>
        <div style="font-size: 14px; color: #888;">
            GLB or GLTF files<br>
            Or use the 📂 button in the toolbar
        </div>
    `;
    document.body.appendChild(helpText);
}

function removeInitialHelpText() {
    const helpText = document.getElementById('initial-help-text');
    if (helpText) {
        helpText.style.opacity = '0';
        helpText.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            if (helpText.parentNode) {
                helpText.parentNode.removeChild(helpText);
            }
        }, 500);
    }
}

function exportStandaloneWebsite() {
    // Show device target selection dialog
    const deviceTarget = prompt(
        '📱 Choose device target for exported website:\n\n' +
        '1 = PC/Desktop (mouse controls, wider layout)\n' +
        '2 = Mobile/Phone (touch controls, mobile layout)\n' +
        '3 = Universal (adaptive for both)\n\n' +
        'Enter 1, 2, or 3:',
        '3'
    );
    
    if (deviceTarget === null) return; // User cancelled
    
    let targetDevice = 'universal';
    if (deviceTarget === '1') targetDevice = 'desktop';
    else if (deviceTarget === '2') targetDevice = 'mobile';
    else if (deviceTarget === '3') targetDevice = 'universal';
    else {
        alert('Invalid selection. Using Universal mode.');
        targetDevice = 'universal';
    }
    
    // Collect all scene data
    const sceneData = {
        camera: {
            fov: camera.fov,
            near: camera.near,
            far: camera.far,
            position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
            target: { x: controls.target.x, y: controls.target.y, z: controls.target.z },
            quaternion: { x: camera.quaternion.x, y: camera.quaternion.y, z: camera.quaternion.z, w: camera.quaternion.w }
        },
        keyframes: (window.cameraKeyframes || []).map((kf, i) => ({
            index: i+1,
            position: { x: kf.position.x, y: kf.position.y, z: kf.position.z },
            target: { x: kf.target.x, y: kf.target.y, z: kf.target.z },
            zoom: kf.zoom,
            fov: kf.fov,
            near: kf.near,
            far: kf.far,
            quaternion: { x: kf.quaternion.x, y: kf.quaternion.y, z: kf.quaternion.z, w: kf.quaternion.w },
            duration: kf.duration || ANIMATION_SPEED,
            modelAnimTime: kf.modelAnimTime || 0
        })),
        lighting: (() => {
            let hemi = null, dir = null;
            scene.traverse(obj => {
                if (obj.isHemisphereLight) hemi = obj;
                if (obj.isDirectionalLight) dir = obj;
            });
            return {
                hemisphere: hemi ? { intensity: hemi.intensity, color: hemi.color.getHex(), groundColor: hemi.groundColor.getHex() } : null,
                directional: dir ? { intensity: dir.intensity, color: dir.color.getHex() } : null
            };
        })(),
        background: scene.background ? scene.background.getHex() : 0xf0f0f0,
        settings: {
            animationSpeed: ANIMATION_SPEED,
            autoPlayCamera: false,
            autoPlayModel: false
        },
        deviceTarget: targetDevice
    };

    // Create ZIP package with all files
    createZipPackage(sceneData);
}

async function createZipPackage(sceneData) {
    // Import JSZip dynamically
    if (!window.JSZip) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        document.head.appendChild(script);
        
        await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
        });
    }

    const zip = new JSZip();
    
    // Add the main website files
    zip.file('index.html', generateViewerHTML());
    zip.file('viewer.js', generateViewerJS(sceneData));
    zip.file('README.txt', generateReadme());
    zip.file('manifest.json', generateManifest());
    zip.file('sw.js', generateServiceWorker());
    
    // Add icon files if they exist
    try {
        const iconFiles = ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon.ico'];
        for (const iconFile of iconFiles) {
            try {
                const response = await fetch('./' + iconFile);
                if (response.ok) {
                    const blob = await response.blob();
                    zip.file(iconFile, blob);
                    console.log('Added icon to ZIP:', iconFile);
                }
            } catch (err) {
                console.warn('Icon file not found:', iconFile);
            }
        }
    } catch (error) {
        console.warn('Could not add icon files to ZIP:', error);
    }
    
    // Add the batch file for local hosting
    const batchContent = `@echo off
echo Starting local web server...

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Using Python HTTP server...
    cd /d "%~dp0"
    start "" cmd /c "python -m http.server 8000"
    timeout /t 2 /nobreak > nul
    start http://localhost:8000
    goto :eof
)

:: Check if Python3 is installed
python3 --version >nul 2>&1
if %errorlevel% equ 0 (
    echo Using Python3 HTTP server...
    cd /d "%~dp0"
    start "" cmd /c "python3 -m http.server 8000"
    timeout /t 2 /nobreak > nul
    start http://localhost:8000
    goto :eof
)

echo Error: Python is not installed.
echo Please install Python from https://www.python.org/downloads/
pause`;
    
    zip.file('starthost.bat', batchContent);
    
    // Try to include the current model if available
    if (window.currentModelFile && window.currentModelFileName) {
        try {
            // Use the stored model file data
            zip.file(window.currentModelFileName, window.currentModelFile);
            console.log('Added current model to ZIP:', window.currentModelFileName);
        } catch (error) {
            console.warn('Could not add model file to ZIP:', error);
        }
    }
    
    // Generate and download the ZIP
    try {
        const content = await zip.generateAsync({type: 'blob'});
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = '3d-viewer-website.zip';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
        
        // Show success message
        const modelInfo = window.currentModelFileName ? 
            '\n✅ Current model included: ' + window.currentModelFileName : 
            '\n⚠️  No model loaded - you can add one later';
            
        const deviceInfo = sceneData.deviceTarget === 'desktop' ? '🖥️ Desktop optimized' :
                          sceneData.deviceTarget === 'mobile' ? '📱 Mobile optimized' :
                          '🔄 Universal (adaptive)';
            
        alert('🎉 Website ZIP package created!\n\n' +
              'Target: ' + deviceInfo + '\n\n' +
              'Files included:\n' +
              '• index.html (viewer page)\n' +
              '• viewer.js (scene data)\n' +
              '• README.txt (instructions)\n' +
              '• starthost.bat (local server)\n' +
              modelInfo + '\n\n' +
              '💡 Double-click starthost.bat to run locally!');
              
    } catch (error) {
        console.error('Error creating ZIP:', error);
        alert('Error creating ZIP file. Please try again.');
    }
}

function generateViewerHTML() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>3D Model Viewer - Exported Scene</title>
    
    <!-- PWA Meta Tags -->
    <meta name="description" content="Exported 3D scene with camera animations and model viewer">
    <meta name="theme-color" content="#007bff">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
    <meta name="apple-mobile-web-app-title" content="3D Scene">
    
    <!-- PWA Manifest -->
    <link rel="manifest" href="./manifest.json">
    
    <!-- Favicon -->
    <link rel="icon" href="./favicon.ico" sizes="32x32">
    <link rel="icon" type="image/png" href="./icon-192.png" sizes="192x192">
    <link rel="apple-touch-icon" href="./apple-touch-icon.png">
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: system-ui, -apple-system, sans-serif;
            background: #222; 
            color: white; 
            overflow: hidden; 
            height: 100vh;
            padding-top: env(safe-area-inset-top);
        }
        canvas { display: block; width: 100%; height: 100%; }
        
        #loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 1000;
        }
        
        #controls {
            position: absolute;
            bottom: calc(20px + env(safe-area-inset-bottom));
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            gap: 10px;
            z-index: 1000;
            background: rgba(0,0,0,0.7);
            padding: 10px;
            border-radius: 8px;
        }
        
        button {
            padding: 8px 16px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        
        button:hover { background: #0056b3; }
        button:disabled { background: #6c757d; cursor: not-allowed; }
        
        #dropZone {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 100;
            padding: 40px;
            border: 3px dashed #666;
            border-radius: 12px;
            background: rgba(0,0,0,0.8);
        }
        
        #dropZone.hidden { display: none; }
        
        .drag-over {
            border-color: #007bff !important;
            background: rgba(0,123,255,0.2) !important;
        }
        
        #deviceInfo {
            position: absolute;
            top: calc(10px + env(safe-area-inset-top));
            right: 10px;
            background: rgba(0,0,0,0.7);
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
        }
        
        #installPrompt {
            position: absolute;
            top: calc(10px + env(safe-area-inset-top));
            left: 10px;
            background: #28a745;
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            z-index: 1000;
            display: none;
        }
    </style>
</head>
<body>
    <div id="loading">
        <h2>Loading 3D Viewer...</h2>
        <p>Please wait...</p>
    </div>
    
    <div id="dropZone">
        <h2>🎯 Drop Your 3D Model Here</h2>
        <p>GLB or GLTF files</p>
        <p style="margin-top: 10px; font-size: 12px; color: #ccc;">
            Or place your model file in this folder as "model.glb" and refresh
        </p>
    </div>
    
    <div id="deviceInfo"></div>
    <div id="installPrompt" onclick="installApp()">⬇️</div>
    
    <div id="controls" style="display: none;">
        <button id="playCamera">📹 Play Camera</button>
        <button id="playBoth">🎬 Play Camera + Model</button>
        <button id="stop">⏹ Stop</button>
        <button id="reset">🔄 Reset View</button>
    </div>

    <script type="importmap">
        {
            "imports": {
                "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
                "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
            }
        }
    </script>
    
    <script>
        // PWA Installation for exported scene
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            document.getElementById('installPrompt').style.display = 'block';
        });
        
        function installApp() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('PWA installed');
                    }
                    deferredPrompt = null;
                    document.getElementById('installPrompt').style.display = 'none';
                });
            }
        }
        
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('SW registered'))
                .catch(err => console.log('SW registration failed'));
        }
    </script>
    <script type="module" src="viewer.js"></script>
</body>
</html>`;
}

function generateViewerJS(sceneData) {
    const modelFileName = window.currentModelFileName || 'model.glb';
    return `// 3D Model Viewer - Generated from Scene Export
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Scene Data (exported from your scene)
const SCENE_DATA = ${JSON.stringify(sceneData, null, 2)};

// Model file to load automatically
const MODEL_FILE = '${modelFileName}';

// Global variables
let scene, camera, renderer, controls, model;
let mixer = null;
let clock = new THREE.Clock();
let gltfClips = [];
let animationActions = new Map();
let animating = false;
let animFrame = null;

// Initialize the viewer
function init() {
    // Device optimization based on target
    const deviceTarget = SCENE_DATA.deviceTarget || 'universal';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Show device info
    document.getElementById('deviceInfo').textContent = 
        \`Optimized for: \${deviceTarget === 'desktop' ? '🖥️ Desktop' : 
        deviceTarget === 'mobile' ? '📱 Mobile' : '🔄 Universal'}\`;
    
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_DATA.background);

    // Camera setup with device-specific optimizations
    camera = new THREE.PerspectiveCamera(
        SCENE_DATA.camera.fov,
        window.innerWidth / window.innerHeight,
        SCENE_DATA.camera.near,
        SCENE_DATA.camera.far
    );
    camera.position.set(
        SCENE_DATA.camera.position.x,
        SCENE_DATA.camera.position.y,
        SCENE_DATA.camera.position.z
    );
    camera.quaternion.set(
        SCENE_DATA.camera.quaternion.x,
        SCENE_DATA.camera.quaternion.y,
        SCENE_DATA.camera.quaternion.z,
        SCENE_DATA.camera.quaternion.w
    );

    // Renderer setup with device-specific settings
    const rendererOptions = { antialias: true };
    
    // Adjust quality based on device target
    let pixelRatio = window.devicePixelRatio;
    if (deviceTarget === 'mobile' || (deviceTarget === 'universal' && isMobile)) {
        pixelRatio = Math.min(pixelRatio, 2); // Limit for mobile performance
    } else if (deviceTarget === 'desktop') {
        pixelRatio = Math.min(pixelRatio, 3); // Higher quality for desktop
    }
    
    renderer = new THREE.WebGLRenderer(rendererOptions);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(pixelRatio);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.physicallyCorrectLights = true;
    document.body.appendChild(renderer.domElement);

    // Environment
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
    scene.environment = envTex;

    // Lighting
    if (SCENE_DATA.lighting.hemisphere) {
        const hemiLight = new THREE.HemisphereLight(
            SCENE_DATA.lighting.hemisphere.color,
            SCENE_DATA.lighting.hemisphere.groundColor,
            SCENE_DATA.lighting.hemisphere.intensity
        );
        hemiLight.position.set(0, 20, 0);
        scene.add(hemiLight);
    }

    if (SCENE_DATA.lighting.directional) {
        const dirLight = new THREE.DirectionalLight(
            SCENE_DATA.lighting.directional.color,
            SCENE_DATA.lighting.directional.intensity
        );
        dirLight.position.set(3, 10, 10);
        scene.add(dirLight);
    }

    // Controls with device-specific settings
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(
        SCENE_DATA.camera.target.x,
        SCENE_DATA.camera.target.y,
        SCENE_DATA.camera.target.z
    );
    
    // Device-specific control optimizations (reuse deviceTarget from above)
    if (deviceTarget === 'mobile' || (deviceTarget === 'universal' && isMobile)) {
        // Mobile optimizations
        controls.enablePan = true; // Touch panning
        controls.enableZoom = true; // Pinch zoom
        controls.enableRotate = true; // Touch rotation
        controls.rotateSpeed = 0.8; // Slightly slower for touch
        controls.zoomSpeed = 1.2; // Faster zoom for touch
        controls.panSpeed = 1.0;
        controls.autoRotate = false;
        controls.autoRotateSpeed = 2.0;
        
        // Mobile-specific limits
        controls.minDistance = 0.5;
        controls.maxDistance = 50;
        controls.maxPolarAngle = Math.PI; // Allow full rotation
        
    } else if (deviceTarget === 'desktop') {
        // Desktop optimizations
        controls.enablePan = true; // Right-click panning
        controls.enableZoom = true; // Mouse wheel zoom
        controls.enableRotate = true; // Mouse rotation
        controls.rotateSpeed = 1.0; // Standard speed
        controls.zoomSpeed = 1.0;
        controls.panSpeed = 1.0;
        controls.autoRotate = false;
        
        // Desktop-specific limits
        controls.minDistance = 0.1;
        controls.maxDistance = 100;
        controls.maxPolarAngle = Math.PI;
        
    } else {
        // Universal - adaptive settings
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.enableRotate = true;
        controls.rotateSpeed = isMobile ? 0.8 : 1.0;
        controls.zoomSpeed = isMobile ? 1.2 : 1.0;
        controls.panSpeed = 1.0;
        controls.autoRotate = false;
        
        controls.minDistance = isMobile ? 0.5 : 0.1;
        controls.maxDistance = isMobile ? 50 : 100;
        controls.maxPolarAngle = Math.PI;
    }
    
    controls.update();

    // Setup drag and drop (as fallback)
    setupDragAndDrop();
    
    // Setup controls
    setupControls();

    // Try to load the included model first
    tryLoadIncludedModel();

    // Start animation loop
    animate();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (mixer) mixer.update(clock.getDelta());
    renderer.render(scene, camera);
}

// Try to load the model that was included with the export
async function tryLoadIncludedModel() {
    try {
        const response = await fetch(MODEL_FILE);
        if (response.ok) {
            const blob = await response.blob();
            const file = new File([blob], MODEL_FILE);
            loadModelFromFile(file);
            document.getElementById('loading').style.display = 'none';
            document.getElementById('dropZone').classList.add('hidden');
            document.getElementById('controls').style.display = 'flex';
            return;
        }
    } catch (e) {
        console.log('Included model not found, showing drop zone');
    }
    
    // If included model fails, show drop zone and hide loading
    document.getElementById('loading').style.display = 'none';
    document.getElementById('dropZone').classList.remove('hidden');
}

// Load 3D model from file
function loadModelFromFile(file) {
    if (model) {
        scene.remove(model);
        if (mixer) mixer.stopAllActions();
    }

    const loader = new GLTFLoader();
    
    // Setup additional loaders
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/');
    loader.setDRACOLoader(dracoLoader);

    const ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/basis/');
    ktx2Loader.detectSupport(renderer);
    loader.setKTX2Loader(ktx2Loader);

    loader.setMeshoptDecoder(MeshoptDecoder);

    const reader = new FileReader();
    reader.onload = function(e) {
        loader.parse(e.target.result, '', function(gltf) {
            model = gltf.scene;
            
            // Setup animations
            if (gltf.animations && gltf.animations.length) {
                gltfClips = gltf.animations;
                mixer = new THREE.AnimationMixer(model);
                gltfClips.forEach((clip, i) => {
                    const action = mixer.clipAction(clip);
                    action.clampWhenFinished = true;
                    action.setLoop(THREE.LoopRepeat, Infinity);
                    action.enabled = true;
                    animationActions.set(i, action);
                });
            }

            // Center model
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
            scene.add(model);

            // Fit camera if no keyframes
            if (SCENE_DATA.keyframes.length === 0) {
                fitCameraToModel();
            }

            // Hide drop zone and show controls
            document.getElementById('dropZone').classList.add('hidden');
            document.getElementById('controls').style.display = 'flex';
            
        }, function(error) {
            console.error('Error loading model:', error);
            alert('Error loading 3D model. Please check the file format.');
        });
    };
    reader.readAsArrayBuffer(file);
}

// Camera animation functions
function playCamera() {
    if (SCENE_DATA.keyframes.length < 2) {
        alert('No camera animation available');
        return;
    }
    animateKeyframes(SCENE_DATA.keyframes);
}

function playBoth() {
    if (SCENE_DATA.keyframes.length < 2) {
        alert('No camera animation available');
        return;
    }
    
    // Start camera animation
    animateKeyframes(SCENE_DATA.keyframes);
    
    // Start model animations
    if (mixer && gltfClips.length > 0) {
        gltfClips.forEach((_, i) => {
            const action = animationActions.get(i);
            if (action) {
                action.reset();
                action.paused = false;
                action.play();
            }
        });
    }
}

function stopAnimations() {
    if (animFrame) {
        cancelAnimationFrame(animFrame);
        animFrame = null;
    }
    animating = false;
    
    if (animationActions.size > 0) {
        animationActions.forEach(action => action.stop());
    }
}

function resetView() {
    camera.position.set(
        SCENE_DATA.camera.position.x,
        SCENE_DATA.camera.position.y,
        SCENE_DATA.camera.position.z
    );
    controls.target.set(
        SCENE_DATA.camera.target.x,
        SCENE_DATA.camera.target.y,
        SCENE_DATA.camera.target.z
    );
    controls.update();
    stopAnimations();
}

// Animation helper functions
function lerpVec3(a, b, t) {
    return new THREE.Vector3(
        a.x + (b.x - a.x) * t,
        a.y + (b.y - a.y) * t,
        a.z + (b.z - a.z) * t
    );
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function slerpQuat(a, b, t) {
    return a.clone().slerp(b, t);
}

function animateKeyframes(keyframes) {
    if (animating || keyframes.length < 2) return;
    animating = true;
    let i = 0;
    
    function animateToNext() {
        if (i >= keyframes.length - 1) {
            animating = false;
            return;
        }
        
        const start = keyframes[i];
        const end = keyframes[i + 1];
        const duration = end.duration || 1200;
        const startTime = performance.now();
        
        function step(now) {
            let t = Math.min((now - startTime) / duration, 1);
            
            // Interpolate camera properties
            const newTarget = lerpVec3(
                new THREE.Vector3(start.target.x, start.target.y, start.target.z),
                new THREE.Vector3(end.target.x, end.target.y, end.target.z),
                t
            );
            const newZoom = lerp(start.zoom, end.zoom, t);
            const newFov = lerp(start.fov, end.fov, t);
            const newNear = lerp(start.near, end.near, t);
            const newFar = lerp(start.far, end.far, t);
            
            controls.target.copy(newTarget);
            
            // Spherical interpolation for camera position
            const startOffset = new THREE.Vector3(start.position.x, start.position.y, start.position.z).sub(newTarget);
            const endOffset = new THREE.Vector3(end.position.x, end.position.y, end.position.z).sub(newTarget);
            const startSph = new THREE.Spherical().setFromVector3(startOffset);
            const endSph = new THREE.Spherical().setFromVector3(endOffset);
            const theta = lerp(startSph.theta, endSph.theta, t);
            const phi = lerp(startSph.phi, endSph.phi, t);
            const sph = new THREE.Spherical(newZoom, phi, theta);
            const newOffset = new THREE.Vector3().setFromSpherical(sph);
            camera.position.copy(newTarget.clone().add(newOffset));
            
            // Interpolate camera rotation
            const startQuat = new THREE.Quaternion(start.quaternion.x, start.quaternion.y, start.quaternion.z, start.quaternion.w);
            const endQuat = new THREE.Quaternion(end.quaternion.x, end.quaternion.y, end.quaternion.z, end.quaternion.w);
            const newQuat = slerpQuat(startQuat, endQuat, t);
            camera.quaternion.copy(newQuat);
            
            // Update camera properties
            camera.fov = newFov;
            camera.near = newNear;
            camera.far = newFar;
            camera.updateProjectionMatrix();
            controls.update();
            
            if (t < 1) {
                animFrame = requestAnimationFrame(step);
            } else {
                i++;
                animateToNext();
            }
        }
        animFrame = requestAnimationFrame(step);
    }
    animateToNext();
}

// Fit camera to model
function fitCameraToModel() {
    if (!model) return;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 2.2;
    camera.position.set(0, 0, cameraZ);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.minDistance = Math.max(0.01, maxDim * 0.2);
    controls.maxDistance = cameraZ * 50;
    controls.update();
    camera.far = cameraZ * 200;
    camera.updateProjectionMatrix();
}

// Setup drag and drop (fallback if no model included)
function setupDragAndDrop() {
    const dropZone = document.getElementById('dropZone');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });
    
    dropZone.addEventListener('drop', handleDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight(e) {
        dropZone.classList.add('drag-over');
    }
    
    function unhighlight(e) {
        dropZone.classList.remove('drag-over');
    }
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            const file = files[0];
            if (file.name.toLowerCase().endsWith('.glb') || file.name.toLowerCase().endsWith('.gltf')) {
                loadModelFromFile(file);
            } else {
                alert('Please drop a GLB or GLTF file');
            }
        }
    }
}

// Setup control buttons
function setupControls() {
    document.getElementById('playCamera').addEventListener('click', playCamera);
    document.getElementById('playBoth').addEventListener('click', playBoth);
    document.getElementById('stop').addEventListener('click', stopAnimations);
    document.getElementById('reset').addEventListener('click', resetView);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', onWindowResize, false);

// Initialize when page loads
init();`;
}

function generateReadme() {
    return `3D Model Viewer - Standalone Website Package
=============================================

This ZIP contains your exported 3D scene as a standalone website!

QUICK START (Windows):
1. Double-click "starthost.bat" to start local server
2. Your browser will open automatically
3. Done! Your 3D scene is ready to view

MANUAL SETUP:
1. Extract all files to a folder
2. If no model included, add your GLB/GLTF file
3. Open index.html in a web browser

ALTERNATIVE METHOD:
- Open index.html directly
- Drag and drop model files onto the viewer

FILES INCLUDED:
📄 index.html - Main viewer page
⚙️  viewer.js - Scene data & viewer code
📋 README.txt - This file
🖥️  starthost.bat - Local server launcher (Windows)
🎯 [model file] - Your 3D model (if loaded)

FEATURES INCLUDED:
✅ Your camera animation keyframes
✅ Your scene lighting settings  
✅ Your background color
✅ Model animation support
✅ Drag & drop model loading
✅ Clean viewer interface

CONTROLS:
📹 Play Camera - Plays your camera animation only
🎬 Play Camera + Model - Plays both camera and model animations
⏹ Stop - Stops all animations
🔄 Reset View - Returns to original camera position

HOSTING ONLINE:
To put this on the web:
1. Upload all files to a web server
2. Make sure your model file is included
3. Share the URL!

TECHNICAL NOTES:
- Uses CDN for Three.js (internet required)
- Works on desktop and mobile browsers
- Optimized for performance
- No server backend needed
- CORS-friendly for local development

TROUBLESHOOTING:
- If starthost.bat doesn't work, install Python from python.org
- For CORS issues, use the batch file or a local server
- Drag & drop works if you need to change models

Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
Your creative work preserved forever! 🎨
`;
}

let phonePreviewActive = false;

function togglePhonePreview() {
    phonePreviewActive = !phonePreviewActive;
    
    if (phonePreviewActive) {
        createPhonePreviewBorder();
    } else {
        removePhonePreviewBorder();
    }
}

function createPhonePreviewBorder() {
    // Remove existing border if any
    removePhonePreviewBorder();
    
    // Create phone preview overlay
    const phoneOverlay = document.createElement('div');
    phoneOverlay.id = 'phone-preview-overlay';
    phoneOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        pointer-events: none;
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
    `;
    
    // Create phone frame
    const phoneFrame = document.createElement('div');
    phoneFrame.id = 'phone-frame';
    
    // Calculate phone dimensions (iPhone 14 Pro proportions)
    const phoneAspectRatio = 19.5 / 9; // iPhone 14 Pro ratio
    const maxPhoneHeight = window.innerHeight * 0.85;
    const maxPhoneWidth = window.innerWidth * 0.4;
    
    let phoneHeight = maxPhoneHeight;
    let phoneWidth = phoneHeight / phoneAspectRatio;
    
    if (phoneWidth > maxPhoneWidth) {
        phoneWidth = maxPhoneWidth;
        phoneHeight = phoneWidth * phoneAspectRatio;
    }
    
    phoneFrame.style.cssText = `
        width: ${phoneWidth}px;
        height: ${phoneHeight}px;
        border: 8px solid #2c2c2c;
        border-radius: 35px;
        background: transparent;
        position: relative;
        box-shadow: 
            0 0 0 2px #1a1a1a,
            0 0 20px rgba(0,0,0,0.3),
            inset 0 0 0 2px #404040;
    `;
    
    // Add phone details (camera notch, home indicator, etc.)
    const notch = document.createElement('div');
    notch.style.cssText = `
        position: absolute;
        top: 8px;
        left: 50%;
        transform: translateX(-50%);
        width: 120px;
        height: 28px;
        background: #2c2c2c;
        border-radius: 0 0 15px 15px;
        z-index: 10001;
    `;
    
    const homeIndicator = document.createElement('div');
    homeIndicator.style.cssText = `
        position: absolute;
        bottom: 8px;
        left: 50%;
        transform: translateX(-50%);
        width: 140px;
        height: 4px;
        background: #666;
        border-radius: 2px;
        z-index: 10001;
    `;
    
    phoneFrame.appendChild(notch);
    phoneFrame.appendChild(homeIndicator);
    phoneOverlay.appendChild(phoneFrame);
    
    // Add phone preview info
    const infoPanel = document.createElement('div');
    infoPanel.style.cssText = `
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 10px;
        font-family: system-ui, sans-serif;
        font-size: 14px;
        text-align: center;
        pointer-events: auto;
        z-index: 10002;
    `;
    infoPanel.innerHTML = `
        📱 <strong>Phone Preview Mode</strong><br>
        Resolution: ${Math.round(phoneWidth-16)}×${Math.round(phoneHeight-16)}<br>
        <button onclick="togglePhonePreview()" style="margin-top: 8px; padding: 5px 10px; border: none; border-radius: 5px; background: #007bff; color: white; cursor: pointer;">Exit Preview</button>
    `;
    
    phoneOverlay.appendChild(infoPanel);
    document.body.appendChild(phoneOverlay);
    
    // Adjust renderer size to fit phone frame
    const phoneInnerWidth = phoneWidth - 16; // Account for border
    const phoneInnerHeight = phoneHeight - 16;
    
    // Store original size for restoration
    window.originalRendererSize = {
        width: renderer.domElement.width,
        height: renderer.domElement.height
    };
    
    // Position the canvas inside the phone frame
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '50%';
    renderer.domElement.style.left = '50%';
    renderer.domElement.style.transform = 'translate(-50%, -50%)';
    renderer.domElement.style.width = phoneInnerWidth + 'px';
    renderer.domElement.style.height = phoneInnerHeight + 'px';
    renderer.domElement.style.zIndex = '10000';
    renderer.domElement.style.borderRadius = '27px'; // Match phone frame radius
    
    // Update renderer size
    renderer.setSize(phoneInnerWidth, phoneInnerHeight);
    camera.aspect = phoneInnerWidth / phoneInnerHeight;
    camera.updateProjectionMatrix();
    
    console.log('📱 Phone preview activated:', phoneInnerWidth + 'x' + phoneInnerHeight);
}

function removePhonePreviewBorder() {
    const overlay = document.getElementById('phone-preview-overlay');
    if (overlay) {
        overlay.remove();
    }
    
    // Restore original renderer settings
    if (window.originalRendererSize) {
        renderer.domElement.style.position = '';
        renderer.domElement.style.top = '';
        renderer.domElement.style.left = '';
        renderer.domElement.style.transform = '';
        renderer.domElement.style.width = '';
        renderer.domElement.style.height = '';
        renderer.domElement.style.zIndex = '';
        renderer.domElement.style.borderRadius = '';
        
        // Restore full size
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        
        delete window.originalRendererSize;
        console.log('📱 Phone preview deactivated');
    }
}

function generateManifest() {
    return `{
  "name": "3D Model Viewer - Exported Scene",
  "short_name": "3D Scene",
  "description": "Exported 3D scene with camera animations and model viewer",
  "start_url": "./index.html",
  "display": "standalone",
  "background_color": "#222222",
  "theme_color": "#007bff",
  "orientation": "any",
  "scope": "./",
  "icons": [
    {
      "src": "./icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "./icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "./icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}`;
}

function generateServiceWorker() {
    return `// Service Worker for Exported 3D Scene
const CACHE_NAME = 'exported-3d-scene-v1.0.0';
const urlsToCache = [
  './',
  './index.html',
  './viewer.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon.ico'
];

// Add model file to cache if it exists
const modelFile = '${window.currentModelFileName || 'model.glb'}';
if (modelFile) {
  urlsToCache.push('./' + modelFile);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app files');
        return cache.addAll(urlsToCache.filter(url => url !== './undefined'));
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});`;
}

function loadGLB(file) {
    // Store file data for export
    window.currentModelFile = file;
    window.currentModelFileName = file.name;
    
    // Remove initial help text when loading starts
    removeInitialHelpText();
    
    if (model) {
        scene.remove(model);
        model.traverse(child => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        model = null;
    }
    // Reset previous animations
    if (mixer) {
        try { mixer.stopAllAction(); } catch (e) {}
    }
    mixer = null;
    gltfClips = [];
    animationActions = new Map();
    const loader = new GLTFLoader();
    // Configure common decoders/transcoders used by Sketchfab assets
    try {
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/draco/');
        loader.setDRACOLoader(dracoLoader);
    } catch (e) {}
    try {
        const ktx2 = new KTX2Loader()
            .setTranscoderPath('https://unpkg.com/three@0.160.0/examples/jsm/libs/basis/')
            .detectSupport(renderer);
        loader.setKTX2Loader(ktx2);
    } catch (e) {}
    try { loader.setMeshoptDecoder(MeshoptDecoder); } catch (e) {}
    const reader = new FileReader();
    reader.onload = function(e) {
        loader.parse(e.target.result, '', function(gltf) {
            model = gltf.scene;
            // Normalize materials and textures
            model.traverse((child) => {
                if (child.isMesh && child.material) {
                    const mats = Array.isArray(child.material) ? child.material : [child.material];
                    // Check vertex colors; if all near black, disable vertexColors to avoid black result
                    let disableVertexColors = false;
                    const colAttr = child.geometry && child.geometry.attributes && child.geometry.attributes.color;
                    if (colAttr && colAttr.count > 0) {
                        const sample = Math.min(colAttr.count, 200);
                        let maxComp = 0;
                        for (let i = 0; i < sample; i++) {
                            const r = colAttr.getX(i);
                            const g = colAttr.getY(i);
                            const b = colAttr.getZ(i);
                            maxComp = Math.max(maxComp, r, g, b);
                        }
                        if (maxComp < 0.05) disableVertexColors = true; // effectively black vertex colors
                    }
                    mats.forEach((mat) => {
                        if (mat.map) { mat.map.colorSpace = THREE.SRGBColorSpace; mat.map.flipY = false; }
                        if (mat.emissiveMap && mat.emissive) { mat.emissiveMap.colorSpace = THREE.SRGBColorSpace; }
                        if (mat.aoMap) { mat.aoMap.flipY = false; }
                        if (mat.normalMap) { mat.normalMap.flipY = false; }
                        if (mat.roughnessMap) { mat.roughnessMap.flipY = false; }
                        if (mat.metalnessMap) { mat.metalnessMap.flipY = false; }
                        if (typeof mat.metalness === 'number') mat.metalness = THREE.MathUtils.clamp(mat.metalness, 0, 1);
                        if (typeof mat.roughness === 'number') mat.roughness = THREE.MathUtils.clamp(mat.roughness, 0, 1);
                        if (disableVertexColors && 'vertexColors' in mat) mat.vertexColors = false;
                        // If no base map and base color is black, force white to avoid silhouettes
                        const hasBase = !!mat.map;
                        if (!hasBase && mat.color && mat.color.getHex && mat.color.getHex() === 0x000000) {
                            mat.color.setHex(0xffffff);
                        }
                        mat.needsUpdate = true;
                    });
                }
            });
            // Setup animations if present
            if (gltf.animations && gltf.animations.length) {
                gltfClips = gltf.animations;
                mixer = new THREE.AnimationMixer(model);
                gltfClips.forEach((clip, i) => {
                    const action = mixer.clipAction(clip);
                    action.clampWhenFinished = true;
                    action.setLoop(THREE.LoopRepeat, Infinity);
                    action.enabled = true;
                    animationActions.set(i, action);
                });
            }
            // Center model at origin
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center); // move model so its center is at (0,0,0)
            model.rotation.set(0, 0, 0); // reset rotation
            scene.add(model);
            fitCameraToObject(camera, model, controls);
        });
    };
    reader.readAsArrayBuffer(file);
}

function fitCameraToObject(camera, object, controls) {
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));
    cameraZ *= 2.2; // zoom out a bit more for comfort
    camera.position.set(0, 0, cameraZ);
    camera.lookAt(0, 0, 0);
    if (controls) {
        controls.target.set(0, 0, 0);
        // Set min/max distance based on model size
        controls.minDistance = Math.max(0.01, maxDim * 0.2);
        // Allow much further zoom out
        controls.maxDistance = cameraZ * 50;
        controls.update();
    }
    // Also update camera far plane if needed
    camera.far = cameraZ * 200;
    camera.updateProjectionMatrix();
}

document.getElementById('upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) loadGLB(file);
});

init();
