import * as THREE from 'three';
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';

'use strict';
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
const cameras = [];
const identityVector = [1, 1, 1], zeroVector = [0, 0, 0];

let activeCamera, controls;
let wireframeMode = false;
let boomGroup, boomRotationSpeed = 0.05;
let car, carMaxX, carMinX, carSpeed = 0.1;
let clawBase, cable, clawMaxY, clawMinY, clawBaseSpeed = 0.1;
let claw1, claw2, claw3, claw4, maxClawAngle = 0.4, minClawAngle = 0.8, clawSpeed = 0.1;
let cableInitialYScale;
let keys = {};

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

    const craneReferencial = createReferencial(scene, [x, y, z], identityVector, zeroVector);

    // base
    createObject(craneReferencial, boxGeometry, material, zeroVector, [10, 3, 8], zeroVector);
    // tower
    createObject(craneReferencial, boxGeometry, material, [0, 16.5, 0], [2, 30, 2], zeroVector);

    boomGroup = createReferencial(craneReferencial, [0, 31.5, 0], identityVector, zeroVector);

    // boom
    const boom = createObject(boomGroup, boxGeometry, material, [5, 0, 0], [34, 2, 2], zeroVector);
    // cabin
    createObject(boomGroup, boxGeometry, material, [0, -5.5, -0.5], [4, 3, 5], zeroVector);
    // counterweight
    createObject(boomGroup, boxGeometry, material, [-7.5, -2, -1], [3, 6, 8], zeroVector);
    // tower peak
    createObject(boomGroup, boxGeometry, material, [0, 4, 0], [2, 6, 2], zeroVector);
    // fore pendant
    createObject(boomGroup, cylinderGeometry, material, [11, 4, 0], [0.1, 21.8, 0.1], [0, 0, 1.292]);
    // rear pendant
    createObject(boomGroup, cylinderGeometry, material, [-6, 4, 0], [0.1, 12.5, 0.1], [0, 0, -1.05]);

    car = createReferencial(boomGroup, [10, -1, 0], identityVector, zeroVector);

    const clawCar = createObject(car, boxGeometry, material, zeroVector, [3, 1, 2], zeroVector);
    carMaxX = boom.position.x + (boom.scale.x / 2) - clawCar.scale.x / 2;
    carMinX = boom.position.x;

    cable = createObject(car, cylinderGeometry, material, [0, -7.5, 0], [0.5, 14, 0.5], zeroVector);
    cableInitialYScale = cable.scale.y;

    clawBase = createReferencial(car, [0, -15, 0], identityVector, zeroVector);
    clawMinY = -(cable.scale.y + coneGeometry.parameters.height / 2);
    clawMaxY = - (clawCar.scale.y + coneGeometry.parameters.height) / 2;

    // claw base
    createObject(clawBase, coneGeometry, material, zeroVector, identityVector, zeroVector);

    const clawReferencial = createReferencial(clawBase, zeroVector, identityVector, zeroVector);

    const clawsY = - coneGeometry.parameters.height / 2;

    claw1 = createReferencial(clawReferencial, [1.5, clawsY, 0], identityVector, zeroVector);
    claw2 = createReferencial(clawReferencial, [-1.5, clawsY, 0], identityVector, zeroVector);
    claw3 = createReferencial(clawReferencial, [0, clawsY, 1.5], identityVector, zeroVector);
    claw4 = createReferencial(clawReferencial, [0, clawsY, -1.5], identityVector, zeroVector);

    createObject(claw1, boxGeometry, material, [0, -1.25, 0], [0.5, 2.5, 0.5], zeroVector);
    createObject(claw2, boxGeometry, material, [0, -1.25, 0], [0.5, 2.5, 0.5], zeroVector);
    createObject(claw3, boxGeometry, material, [0, -1.25, 0], [0.5, 2.5, 0.5], zeroVector);
    createObject(claw4, boxGeometry, material, [0, -1.25, 0], [0.5, 2.5, 0.5], zeroVector);

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

    const cameraFront = new THREE.OrthographicCamera(window.innerWidth / - 16, window.innerWidth / 16, (window.innerHeight / 8) * (2 / 3), - (window.innerHeight / 8) * (1 / 3), 0.1, 1000);
    cameraFront.position.set(100, 0, 0);
    cameras.push(cameraFront);

    const cameraSide = new THREE.OrthographicCamera(window.innerWidth / - 16, window.innerWidth / 16, (window.innerHeight / 8) * (2 / 3), -(window.innerHeight / 8) * (1 / 3), 0.1, 1000);
    cameraSide.position.set(0, 0, 10);
    cameras.push(cameraSide);

    const cameraTop = new THREE.OrthographicCamera(window.innerWidth / - 16, window.innerWidth / 16, window.innerHeight / 16, window.innerHeight / - 16, 0.1, 1000);
    cameraTop.position.set(0, 100, 0);
    cameraTop.lookAt(0, 0, 0);
    cameras.push(cameraTop);

    // Orthographic camera
    const cameraOrthographic = new THREE.OrthographicCamera(- window.innerWidth / 20, window.innerWidth / 20, (window.innerHeight / 10) * (2 / 3), -(window.innerHeight / 10) * (1 / 3), 1, 1000);
    cameraOrthographic.position.set(50, 80, 100);
    cameraOrthographic.lookAt(0, 0, 0);
    cameras.push(cameraOrthographic);

    // Perspective camera
    const cameraPerspective = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    cameraPerspective.position.set(30, 60, 60);
    cameraPerspective.lookAt(0, 0, 0);
    cameras.push(cameraPerspective);

    // Hook camera (movable)
    const cameraHook = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    clawBase.add(cameraHook);
    cameraHook.lookAt(cameraHook.position.x, 0, cameraHook.position.y );
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
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener("resize", onResize);
}

function closeClaw() {
    claw1.rotation.z = Math.max(claw1.rotation.z - clawSpeed, -maxClawAngle);
    claw2.rotation.z = Math.min(claw2.rotation.z + clawSpeed, maxClawAngle);
    claw3.rotation.x = Math.min(claw3.rotation.x + clawSpeed, maxClawAngle);
    claw4.rotation.x = Math.max(claw4.rotation.x - clawSpeed, -maxClawAngle);
}

function openClaw() {
    claw1.rotation.z = Math.min(claw1.rotation.z + clawSpeed, minClawAngle);
    claw2.rotation.z = Math.max(claw2.rotation.z - clawSpeed, -minClawAngle);
    claw3.rotation.x = Math.max(claw3.rotation.x - clawSpeed, -minClawAngle);
    claw4.rotation.x = Math.min(claw4.rotation.x + clawSpeed, minClawAngle);
}

function onKeyDown(e) {
    'use strict';
    const key = parseInt(e.key);
    if (key >= 1 && key <= 6) {
        if (key === 1) {
            toggleWireframeMode();
        }
        activeCamera = cameras[key - 1];
        controls.object = activeCamera;
        controls.update();
        updateHUD();
    }
    keys[e.key.toLowerCase()] = true;
}

function onKeyUp(e) {
    'use strict';
    keys[e.key.toLowerCase()] = false;
}

function animate() {
    'use strict';

    if (keys['q']) {
        boomGroup.rotation.y += boomRotationSpeed;
    }
    if (keys['a']) {
        boomGroup.rotation.y -= boomRotationSpeed;
    }
    if (keys['w']) {
        car.position.x = Math.min(car.position.x + carSpeed, carMaxX);
    }
    if (keys['s']) {
        car.position.x = Math.max(car.position.x - carSpeed, carMinX);
    }
    if (keys['e']) {
        clawBase.position.y = Math.min(clawBase.position.y + clawBaseSpeed, clawMaxY);
        cable.scale.y = clawBase.position.y;
        cable.position.y = cable.scale.y / 2;
    }
    if (keys['d']) {
        clawBase.position.y = Math.max(clawBase.position.y - clawBaseSpeed, clawMinY);
        cable.scale.y = clawBase.position.y;
        cable.position.y = cable.scale.y / 2;
    }
    if (keys['r']) {
        openClaw();
    }
    if (keys['f']) {
        closeClaw();
    }
    render();
    requestAnimationFrame(animate);
}

init();
requestAnimationFrame(animate);
