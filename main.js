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
    menu.style.overflow = 'auto';
    menu.style.fontSize = '16px';
    menu.style.padding = '14px';
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
    document.body.appendChild(menu);

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
            quaternion: { x: kf.quaternion.x, y: kf.quaternion.y, z: kf.quaternion.z, w: kf.quaternion.w }
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
                        quaternion: new THREE.Quaternion(kf.quaternion.x, kf.quaternion.y, kf.quaternion.z, kf.quaternion.w)
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
    document.getElementById('closeSceneSettingsMenu').onclick = function() { menu.remove(); };
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
    document.body.appendChild(menu);
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
    document.getElementById('closeLightingMenu').onclick = function() { menu.remove(); };
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
    document.body.appendChild(menu);
    document.getElementById('bgColor').value = '#'+scene.background.getHexString();
    document.getElementById('bgColor').addEventListener('input', function() {
        scene.background = new THREE.Color(this.value);
    });
    document.getElementById('closeBackgroundMenu').onclick = function() { menu.remove(); };
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
    document.body.appendChild(menu);
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
    document.getElementById('closeTextureMenu').onclick = function() { menu.remove(); };
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
    document.body.appendChild(menu);

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
    document.getElementById('closeMaterialFixMenu').onclick = function() { menu.remove(); };
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
    document.body.appendChild(menu);
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
                        quaternion: new THREE.Quaternion(kf.quaternion.x, kf.quaternion.y, kf.quaternion.z, kf.quaternion.w)
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
            quaternion: { x: kf.quaternion.x, y: kf.quaternion.y, z: kf.quaternion.z, w: kf.quaternion.w }
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
    document.getElementById('closeCameraExportMenu').onclick = function() {
        menu.remove();
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
    document.body.appendChild(menu);

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
    document.getElementById('closeCameraViewMenu').onclick = function() {
        menu.remove();
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
            <button id="cam-anim-play">Play Animation</button>
            <button id="cam-anim-clear">Clear Keyframes</button>
            <div id="cam-anim-keyframes" style="margin-top:10px; width:100%; text-align:left; font-size:13px; background:#f7f7f7; border:1px solid #ddd; border-radius:4px; min-height:40px; max-height:120px; overflow-y:auto; padding:6px;"></div>
        </div>
        <button id="closeCameraAnimMenu" style="margin-top:10px;">Close</button>
    `;
    applyResponsiveMenu(menu);
    document.body.appendChild(menu);

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
            const startTime = performance.now();
            function step(now) {
                let t = Math.min((now - startTime) / duration, 1);
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

    // Keyframe storage (global for now)
    if (!window.cameraKeyframes) window.cameraKeyframes = [];

    function updateKeyframeList() {
        const listDiv = document.getElementById('cam-anim-keyframes');
        if (!window.cameraKeyframes.length) {
            listDiv.innerHTML = '<i>No keyframes yet.</i>';
            return;
        }
        listDiv.innerHTML = window.cameraKeyframes.map((kf, i) =>
            `<div style='margin-bottom:6px; padding-bottom:6px; border-bottom:1px solid #eee;'>
                <b>#${i+1}</b> 
                <button data-kf='${i}' class='kf-move-up' ${i===0?'disabled':''} title='Move Up'>↑</button>
                <button data-kf='${i}' class='kf-move-down' ${i===window.cameraKeyframes.length-1?'disabled':''} title='Move Down'>↓</button>
                <button data-kf='${i}' class='kf-delete' title='Delete'>✕</button><br>
                <span style='color:#555'>Pos:</span> [${kf.position.x.toFixed(2)}, ${kf.position.y.toFixed(2)}, ${kf.position.z.toFixed(2)}]<br>
                <span style='color:#555'>Target:</span> [${kf.target.x.toFixed(2)}, ${kf.target.y.toFixed(2)}, ${kf.target.z.toFixed(2)}]<br>
                <span style='color:#555'>Zoom:</span> ${kf.zoom.toFixed(2)}<br>
                <span style='color:#555'>FOV:</span> ${kf.fov.toFixed(2)}<br>
                <span style='color:#555'>Near:</span> ${kf.near.toFixed(2)}<br>
                <span style='color:#555'>Far:</span> ${kf.far.toFixed(2)}<br>
                <span style='color:#555'>Rot:</span> [${kf.quaternion.x.toFixed(2)}, ${kf.quaternion.y.toFixed(2)}, ${kf.quaternion.z.toFixed(2)}, ${kf.quaternion.w.toFixed(2)}]
            </div>`
        ).join('');
        // Add event listeners for move/delete
        listDiv.querySelectorAll('.kf-delete').forEach(btn => {
            btn.onclick = function() {
                const idx = parseInt(this.getAttribute('data-kf'));
                window.cameraKeyframes.splice(idx, 1);
                updateKeyframeList();
            };
        });
        listDiv.querySelectorAll('.kf-move-up').forEach(btn => {
            btn.onclick = function() {
                const idx = parseInt(this.getAttribute('data-kf'));
                if (idx > 0) {
                    const temp = window.cameraKeyframes[idx-1];
                    window.cameraKeyframes[idx-1] = window.cameraKeyframes[idx];
                    window.cameraKeyframes[idx] = temp;
                    updateKeyframeList();
                }
            };
        });
        listDiv.querySelectorAll('.kf-move-down').forEach(btn => {
            btn.onclick = function() {
                const idx = parseInt(this.getAttribute('data-kf'));
                if (idx < window.cameraKeyframes.length-1) {
                    const temp = window.cameraKeyframes[idx+1];
                    window.cameraKeyframes[idx+1] = window.cameraKeyframes[idx];
                    window.cameraKeyframes[idx] = temp;
                    updateKeyframeList();
                }
            };
        });
    }

    document.getElementById('cam-anim-add-keyframe').onclick = function() {
        // Calculate zoom (distance from camera to target)
        const zoom = camera.position.distanceTo(controls.target);
        window.cameraKeyframes.push({
            position: camera.position.clone(),
            target: controls.target.clone(),
            zoom: zoom,
            quaternion: camera.quaternion.clone(),
            fov: camera.fov,
            near: camera.near,
            far: camera.far
        });
        updateKeyframeList();
    };
    document.getElementById('cam-anim-clear').onclick = function() {
        window.cameraKeyframes = [];
        updateKeyframeList();
    };
    document.getElementById('cam-anim-play').onclick = function() {
        if (animating) return;
        if (!window.cameraKeyframes || window.cameraKeyframes.length < 2) return;
        animateKeyframes(window.cameraKeyframes, 1200); // 1.2s per segment
    };
    // Update list on open
    updateKeyframeList();
    document.getElementById('closeCameraAnimMenu').onclick = function() {
        menu.remove();
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
    document.body.appendChild(menu);

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
    document.getElementById('closeCameraMenu').onclick = function() {
        menu.remove();
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
    document.getElementById('closeMenu').onclick = function() {
        menu.remove();
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
    document.body.appendChild(menu);

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
    document.getElementById('closeAnimationsMenu').onclick = function() { menu.remove(); };

    buildList();
}

function init() {
    // Basic mobile detection for layout tweaks
    const isMobile = matchMedia('(pointer: coarse), (max-width: 768px)').matches;
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
    controls.enableZoom = true;
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

    // Populate mobile toolbar with key actions for small screens
    const mobileBar = document.getElementById('mobile-toolbar');
    if (mobileBar && isMobile) {
        const mkBtn = (label, handler) => {
            const b = document.createElement('button');
            b.textContent = label;
            b.style.padding = '10px 12px';
            b.style.fontSize = '14px';
            b.style.border = '1px solid #aaa';
            b.style.borderRadius = '6px';
            b.style.background = '#fff';
            b.style.whiteSpace = 'nowrap';
            b.onclick = handler;
            return b;
        };
        mobileBar.appendChild(mkBtn('Camera', createCameraMenu));
        mobileBar.appendChild(mkBtn('View', createCameraViewSettingsMenu));
        mobileBar.appendChild(mkBtn('Anim', createCameraAnimationMenu));
        mobileBar.appendChild(mkBtn('GLTF Anim', createAnimationsMenu));
        mobileBar.appendChild(mkBtn('Lighting', createLightingMenu));
        mobileBar.appendChild(mkBtn('BG', createBackgroundMenu));
        mobileBar.appendChild(mkBtn('Material', createMaterialFixMenu));
        mobileBar.appendChild(mkBtn('Scene', createSceneSettingsMenu));
    }

    window.addEventListener('resize', onWindowResize, false);
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

function loadGLB(file) {
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
