import * as THREE from 'three';
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';


var scene, renderer, controls;
var material, mesh;
var cameras = [];
var activeCamera;
var theta1 = 0, delta1 = 0, delta2 = 0, theta2 = 0;
var speed = 0.1;
var crane, boom, boomGroup, car, cable, hook;

function createBase(obj) {
    'use strict';
    const geometry = new THREE.BoxGeometry(10, 3, 10);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 1, 0);
    obj.add(mesh);
    return mesh;
}

function createTower(obj) {
    'use strict';
    const geometry = new THREE.BoxGeometry(2, 40, 2);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 20, 0);
    obj.add(mesh);
    return mesh;
}

function createBoom(obj) {
    'use strict';
    const geometry = new THREE.BoxGeometry(20, 2, 2);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(10, 34, 0);
    obj.add(mesh);
    return mesh;
}

function createCounterBoom(obj) {
    'use strict';
    const geometry = new THREE.BoxGeometry(10, 2, 2);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-15, 0, 0);
    obj.add(mesh);
    return mesh;
}

function createCounterweight(obj) {
    'use strict';
    const geometry = new THREE.BoxGeometry(3, 6, 8);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-17, -2, 0);
    obj.add(mesh);
    return mesh;
}

function createCabin(obj) {
    'use strict';
    const geometry = new THREE.BoxGeometry(6, 5, 6);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-10, -4, 0);
    obj.add(mesh);
    return mesh;
}

function createCar(obj) {
    'use strict';
    const geometry = new THREE.BoxGeometry(3, 2, 2);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, -2, 0);
    obj.add(mesh);
    return mesh;
}

function createCable(obj) {
    'use strict';
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 14);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, -8, 0);
    obj.add(mesh);
    return mesh;
}

function createHookBase(obj) {
    'use strict';
    const geometry = new THREE.ConeGeometry(2, 2, 4);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, -15, 0);
    obj.add(mesh);
    delta2 = mesh.position.y;
    return mesh;
}

function createCrane(x, y, z) {
    'use strict';
    crane = new THREE.Object3D();
    material = new THREE.MeshStandardMaterial({ color: 0xfffff00 });

    crane = createBase(crane);
    createTower(crane);

    boomGroup = new THREE.Group();
    crane.add(boomGroup);

    boom = createBoom(boomGroup);
    createCounterBoom(boom);
    createCounterweight(boom);
    createCabin(boom);
    car = createCar(boom);
    cable = createCable(car);
    hook = createHookBase(car);

    scene.add(crane);
    crane.position.set(x, y, z);
    return crane;
}

function createScene() {
    'use strict';
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xadd8e6);
    scene.add(new THREE.AxesHelper(20));

    var light = new THREE.AmbientLight(0xffffff, 1);
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

var wireframeMode = false;

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
    renderer = new THREE.WebGLRenderer({ antialias: true });
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
            hook.position.y = delta2;
            cable.scale.y = Math.max(cable.scale.y - speed/20, 0.4);
            cable.position.y = Math.min(cable.position.y + speed/1.5, 0.14);
            break;
        case 'd':
            delta2 -= speed;
            hook.position.y = delta2;
            cable.scale.y = Math.min(cable.scale.y + speed/20, 1);
            cable.position.y = Math.max(cable.position.y - speed/1.5, -8);
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
animate();
