import * as THREE from 'three';
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';

'use strict';
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
const cameras = [];
const identityVector = vector(1, 1, 1), zeroVector = vector(0, 0, 0);

let activeCamera, controls;
let wireframeMode = false;
let theta1 = 0, delta1 = 0, delta2 = 0, theta2 = 0;
let speed = 0.5;
let boomGroup, car, cable, clawBase;
let cableInitialYScale;

function vector(x, y, z) {
    'use strict';
    return [x, y, z];
}

function createObject(parent, geometry, material, position, scale, rotation) {
    'use strict';
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
    mesh.position.set(position[0], position[1], position[2]);
    parent.add(mesh);
    return mesh;
}

function createReferencial(parent, position, scale, rotation) {
    'use strict';
    const ref = new THREE.Object3D();
    ref.scale.set(scale[0], scale[1], scale[2]);
    ref.rotation.set(rotation[0], rotation[1], rotation[2]);
    ref.position.set(position[0], position[1], position[2]);
    parent.add(ref);
    return ref;
}

function createCrane(x, y, z) {
    'use strict';
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1);
    const coneGeometry = new THREE.ConeGeometry(2, 2, 10);
    const material = new THREE.MeshStandardMaterial({ color: 0xfffff00 });

    const craneReferencial = createReferencial(scene, vector(x, y, z), identityVector, zeroVector);

    // base
    createObject(craneReferencial, boxGeometry, material, zeroVector, vector(10, 3, 8), zeroVector);
    // tower
    createObject(craneReferencial, boxGeometry, material, vector(0, 16.5, 0), vector(2, 30, 2), zeroVector);

    boomGroup = createReferencial(craneReferencial, vector(0, 31.5, 0), identityVector, zeroVector);

    // boom
    createObject(boomGroup, boxGeometry, material, vector(5, 0, 0), vector(34, 2, 2), zeroVector);
    // cabin
    createObject(boomGroup, boxGeometry, material, vector(0, -5.5, -0.5), vector(4, 3, 5), zeroVector);
    // counterweight
    createObject(boomGroup, boxGeometry, material, vector(-7.5, -2, -1), vector(3, 6, 8), zeroVector);
    // tower peak
    createObject(boomGroup, boxGeometry, material, vector(0, 4, 0), vector(2, 6, 2), zeroVector);
    // fore pendant
    createObject(boomGroup, cylinderGeometry, material, vector(11, 4, 0), vector(0.1, 21.8, 0.1), vector(0, 0, 1.292));
    // rear pendant
    createObject(boomGroup, cylinderGeometry, material, vector(-6, 4, 0), vector(0.1, 12.5, 0.1), vector(0, 0, -1.05));

    car = createReferencial(boomGroup, vector(10, -1, 0), identityVector, zeroVector);

    // car
    createObject(car, boxGeometry, material, zeroVector, vector(3, 1, 2), zeroVector);
    cable = createObject(car, cylinderGeometry, material, vector(0, -7.5, 0), vector(0.5, 14, 0.5), zeroVector);
    cableInitialYScale = cable.scale.y;

    clawBase = createReferencial(car, vector(0, -15, 0), identityVector, zeroVector);
    delta2 = clawBase.position.y;

    // claw base
    createObject(clawBase, coneGeometry, material, zeroVector, identityVector, zeroVector);

    const clawReferencial = createReferencial(clawBase, zeroVector, identityVector, zeroVector);

    // claw 1 through 4
    createObject(clawReferencial, boxGeometry, material, vector(1.5, -2.15, 0), vector(0.5, 2.5, 0.5), zeroVector);
    createObject(clawReferencial, boxGeometry, material, vector(-1.5, -2.15, 0), vector(0.5, 2.5, 0.5), zeroVector);
    createObject(clawReferencial, boxGeometry, material, vector(0, -2.15, 1.5), vector(0.5, 2.5, 0.5), zeroVector);
    createObject(clawReferencial, boxGeometry, material, vector(0, -2.15, -1.5), vector(0.5, 2.5, 0.5), zeroVector);

    return craneReferencial;
}

function createScene() {
    'use strict';
    scene.background = new THREE.Color(0xadd8e6);
    scene.add(new THREE.AxesHelper(20));

    let light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);

    createCrane(0, 0, 0).name = "Crane";
}

function setupCameras() {
    const aspectRatio = window.innerWidth / window.innerHeight;

    const cameraFront = new THREE.OrthographicCamera(window.innerWidth / - 16, window.innerWidth / 16, window.innerHeight / 16, window.innerHeight / - 16, 0.1, 1000);
    cameraFront.position.set(100, 20, 0);
    cameras.push(cameraFront);

    const cameraSide = new THREE.OrthographicCamera(window.innerWidth / - 16, window.innerWidth / 16, window.innerHeight / 16, window.innerHeight / - 16, 0.1, 1000);
    cameraSide.position.set(0, 20, 107);
    cameras.push(cameraSide);

    const cameraTop = new THREE.OrthographicCamera(window.innerWidth / - 16, window.innerWidth / 16, window.innerHeight / 16, window.innerHeight / - 16, 0.1, 1000);
    cameraTop.position.set(0, 100, 0);
    cameraTop.lookAt(0, 0, 0);
    cameras.push(cameraTop);

    // Perspective camera
    const cameraPerspective = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    cameraPerspective.position.set(50, 50, 50);
    cameraPerspective.lookAt(0, 0, 0);
    cameras.push(cameraPerspective);

    // Orthographic camera
    const cameraOrthographic = new THREE.OrthographicCamera(window.innerWidth / - 8, window.innerWidth / 8, window.innerHeight / 8, window.innerHeight / - 8, 1, 1000);
    cameraOrthographic.position.set(50, 50, 50);
    cameraOrthographic.lookAt(0, 0, 0);
    cameras.push(cameraOrthographic);

    // Hook camera (movable)
    const crane = scene.getObjectByName("Crane");
    const cameraHook = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    crane.add(cameraHook);
    cameraHook.position.set(0, -10, 0);
    cameras.push(cameraHook);

    activeCamera = cameraPerspective;
    controls = new OrbitControls(activeCamera, renderer.domElement);
}

function onResize() {
    'use strict';
    renderer.setSize(window.innerWidth, window.innerHeight);
    cameras.forEach(cam => {
        if (cam instanceof THREE.PerspectiveCamera) {
            cam.aspect = window.innerWidth / window.innerHeight;
            cam.updateProjectionMatrix();
        } else if (cam instanceof THREE.OrthographicCamera) {
            const aspectRatio = window.innerWidth / window.innerHeight;
            cam.left = -50 * aspectRatio;
            cam.right = 50 * aspectRatio;
            cam.updateProjectionMatrix();
        }
    });
}

function toggleWireframeMode() {
    'use strict';
    wireframeMode = !wireframeMode;
    scene.traverse(function(child) {
        if (child instanceof THREE.Mesh) {
            child.material.wireframe = wireframeMode;
        }
    });
}

function render() {
    'use strict';
    renderer.render(scene, activeCamera);
}

function updateHUD() {
    'use strict';
    const hudElement = document.getElementById("hud");
    hudElement.innerHTML = "Press 1-6 to switch cameras:<br>";
    cameras.forEach((camera, index) => {
        hudElement.innerHTML += `${index + 1}: ${camera === activeCamera ? 'Active' : 'Inactive'}<br>`;
    });
    hudElement.innerHTML += `<br>Viewing Mode: ${wireframeMode ? 'Wireframe' : 'Solid'}<br>`;

    hudElement.innerHTML += `<br>Crane Controls:<br>`;
    hudElement.innerHTML += `Q/A: Rotate upper section<br>`;
    hudElement.innerHTML += `W/S: Move trolley<br>`;
    hudElement.innerHTML += `E/D: Move hook block and claw<br>`;
    hudElement.innerHTML += `R/F: Open/close gripper<br>`;
}

function init() {
    'use strict';
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createScene();
    setupCameras();
    updateHUD();
    render();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
}

function onKeyDown(e) {
    'use strict';
    const key = parseInt(e.key);
    if (key >= 1 && key <= 5) {
        if (key === 1) {
            toggleWireframeMode();
        }
        activeCamera = cameras[key - 1];
        controls.object = activeCamera;
        controls.update();
        updateHUD();
    }
    switch (e.key.toLowerCase()) {
        case 'q':
            theta1 += speed;
            boomGroup.rotation.y = theta1;
            break;
        case 'a':
            theta1 -= speed;
            boomGroup.rotation.y = theta1;
            break;
        case 'w':
            delta1 += speed;
            car.position.x = delta1;
            break;
        case 's':
            delta1 -= speed;
            car.position.x = delta1;
            console.log("cable size y: " + cable.scale.y);
            break;
        case 'e':
            delta2 += speed;
            clawBase.position.y = delta2;
            cable.scale.y = Math.max(cable.scale.y - speed , 0.4);
            cable.position.y = Math.min(cable.position.y + speed / 1.5, 0.14);
            break;
        case 'd':
            delta2 -= speed;
            clawBase.position.y = delta2;
            cable.scale.y = Math.min(cable.scale.y + speed , cableInitialYScale);
            cable.position.y = Math.max(cable.position.y - speed / 1.5, -8);
            break;
        case 'r':
            theta2 += speed;
            break;
        case 'f':
            theta2 -= speed;
            break;
    }

    delta1 = Math.max(Math.min(delta1, 8), 0);
    delta2 = Math.max(Math.min(delta2, -2), -14);
}

function animate() {
    'use strict';
    render();
    requestAnimationFrame(animate);
}

init();
requestAnimationFrame(animate);
