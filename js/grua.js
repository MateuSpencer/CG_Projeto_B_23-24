import * as THREE from 'three';
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';


var scene, renderer, controls;
var material, mesh;
var cameras = [];
var activeCamera;

function createBase(obj) {
    'use strict';
    const geometry = new THREE.BoxGeometry(10, 3, 10);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 1, 0);
    obj.add(mesh);
}

function createTower(obj) {
    'use strict';
    const geometry = new THREE.BoxGeometry(2, 40, 2);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(0, 20, 0);
    obj.add(mesh);
}

function createBoom(obj) {
    'use strict';
    const geometry = new THREE.BoxGeometry(20, 2, 2);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(10, 34, 0);
    obj.add(mesh);
}

function createCounterBoom(obj) {
    'use strict';
    const geometry = new THREE.BoxGeometry(10, 2, 2);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-5, 34, 0);
    obj.add(mesh);
}

function createCounterweight(obj) {
    'use strict';
    const geometry = new THREE.BoxGeometry(3, 6, 8);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-7, 32, 0);
    obj.add(mesh);
}

function createCable(obj) {
    'use strict';
    const geometry = new THREE.CylinderGeometry(0.5,0.5 , 14);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(14, 25, 0); 
    obj.add(mesh);
}

function createHookBase(obj) {
    'use strict';
    const geometry = new THREE.ConeGeometry(2, 2, 4);
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(14, 18, 0);
    obj.add(mesh);
}

function createCrane(x, y, z) {
    'use strict';
    var crane = new THREE.Object3D();
    material = new THREE.MeshStandardMaterial({ color: 0xfffff00 });

    createBase(crane);
    createTower(crane);
    createBoom(crane);
    createCounterBoom(crane);
    createCounterweight(crane);
    createCable(crane);
    createHookBase(crane);

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

function animate() {
    'use strict';
    render();
    requestAnimationFrame(animate);
}

init();
animate();
