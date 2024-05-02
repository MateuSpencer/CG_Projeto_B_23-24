import * as THREE from 'three';
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';


var scene, renderer, controls;
var material, mesh;
var cameras = [];
var activeCamera;

function createBase(obj) {
    'use strict';
    const geometry = new THREE.BoxGeometry(10, 2, 10);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 1, 0);
    obj.add(mesh);
}

function createTower(obj) {
    'use strict';
    const geometry = new THREE.CylinderGeometry(1, 1, 20, 8);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 12, 0);
    obj.add(mesh);
}

function createBoom(obj) {
    'use strict';
    const geometry = new THREE.BoxGeometry(20, 2, 2);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(10, 20, 0);  // Position the boom at the top of the tower
    obj.add(mesh);
}

function createCounterweight(obj) {
    'use strict';
    const geometry = new THREE.BoxGeometry(6, 2, 2);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-8, 20, 0);  // Behind the tower
    obj.add(mesh);
}

function createHook(obj) {
    'use strict';
    const geometry = new THREE.BoxGeometry(0.5, 5, 0.5);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(10, 12.5, 0);  // Hanging below the boom
    obj.add(mesh);
}

function createGrabber(obj) {
    'use strict';
    const geometry = new THREE.ConeGeometry(1, 2, 4);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(10, 10, 0);  // Attached to the hook
    obj.add(mesh);
}

function createCrane(x, y, z) {
    'use strict';
    var crane = new THREE.Object3D();
    material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });

    createBase(crane);
    createTower(crane);
    createBoom(crane);
    createCounterweight(crane);
    createHook(crane);
    createGrabber(crane);

    scene.add(crane);
    crane.position.set(x, y, z);
    return crane; // Return the crane object
}

function createScene() {
    'use strict';
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xadd8e6);
    scene.add(new THREE.AxesHelper(20));
    createCrane(0, 0, 0).name = "Crane";
}

function setupCameras() {
    const aspectRatio = window.innerWidth / window.innerHeight;

    // Orthographic cameras
    const cameraFront = new THREE.OrthographicCamera(-50 * aspectRatio, 50 * aspectRatio, 50, -50, 1, 100);
    cameraFront.position.set(0, 20, 100);
    cameras.push(cameraFront);

    const cameraSide = new THREE.OrthographicCamera(-50 * aspectRatio, 50 * aspectRatio, 50, -50, 1, 100);
    cameraSide.position.set(100, 20, 0);
    cameras.push(cameraSide);

    const cameraTop = new THREE.OrthographicCamera(-50 * aspectRatio, 50 * aspectRatio, 50, -50, 1, 100);
    cameraTop.position.set(0, 100, 0);
    cameraTop.lookAt(0, 0, 0);
    cameras.push(cameraTop);

    // Perspective camera
    const cameraPerspective = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    cameraPerspective.position.set(50, 50, 50);
    cameras.push(cameraPerspective);

    // Hook camera (movable)
    const crane = scene.getObjectByName("Crane");
    const cameraHook = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    crane.add(cameraHook);
    cameraHook.position.set(0, -10, 0);
    cameras.push(cameraHook);

    activeCamera = cameraFront;
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

function onKeyDown(e) {
    'use strict';
    const key = parseInt(e.key);
    if (key >= 1 && key <= 5) {
        activeCamera = cameras[key - 1];
        controls.object = activeCamera;
        controls.update();
    }
}

function render() {
    'use strict';
    renderer.render(scene, activeCamera);
}

function init() {
    'use strict';
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createScene();
    setupCameras();
    render();

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
}

init();
