import * as THREE from 'three';
import { OrbitControls } from 'https://threejs.org/examples/jsm/controls/OrbitControls.js';

'use strict';
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
const cameras = [];
const identityVector = [1, 1, 1], zeroVector = [0, 0, 0];

let activeCamera, controls;
let wireframeMode = false;
let boomGroup, boomRotationSpeed = 0.02;
let car, carMaxX, carMinX, carSpeed = 0.2;
let clawBase, cable, clawMaxY, clawMinY, clawBaseSpeed = 0.2;
let claw1, claw2, claw3, claw4, maxClawAngle = 0.4, minClawAngle = 0.8, clawSpeed = 0.03;
let cableInitialYScale;
let keys = {};
let clawCollisionSphere;
let loadCollisionSpheres = [];
let animationState = 0;
let animationSpeed = 0.5;


function addCollisionSphere(object, radius) {
    const sphereGeometry = new THREE.SphereGeometry(radius, 16, 16);
    const invisibleMaterial = new THREE.MeshBasicMaterial({ visible: true });
    const sphere = new THREE.Mesh(sphereGeometry, invisibleMaterial);
    object.add(sphere);
    return sphere;
}

function checkSphereCollision(sphere1, sphere2) {
    var sphere1Position = sphere1.localToWorld(sphere1.position.clone());
    var sphere2Position = sphere2.localToWorld(sphere2.position.clone());

    const distance = sphere1Position.distanceTo(sphere2Position);
    const totalRadius = sphere1.geometry.parameters.radius + sphere2.geometry.parameters.radius;
    return distance < totalRadius;
}

function animateClawToContainer(claw, load, targetPosition) {
    // Disable key processing
    disableKeyProcessing();


    // Convert local coordinates to world coordinates
    let clawWorldPosition = new THREE.Vector3();
    claw.getWorldPosition(clawWorldPosition);


    let loadWorldPosition = new THREE.Vector3();
    load.getWorldPosition(loadWorldPosition);


    switch (animationState) {
        case 0: // Close claw
            if(claw1.rotation.z != -maxClawAngle){
                closeClaw();
            } else {
                animationState++;
            }
            break;
        case 1: // Move the claw and load up to the maximum
            console.log("Moving claw and load up");
            if (claw.position.y < clawMaxY) {
                moveClawBaseUp(claw.position.y, animationSpeed, clawMaxY);
                load.position.y += animationSpeed;
            } else {
                animationState++;
            }
            break;
        case 2: // Rotate the boom so it's above the container
            console.log("Rotating boom above container");
            if (Math.round(clawWorldPosition.z) != Math.round(targetPosition.z)) {
                let prevClawX = clawWorldPosition.x;
                let prevClawZ = clawWorldPosition.z;
                
                //checks which way to rotate
                if(load.position.z > 0){
                    rotateBoomGroup(animationSpeed*0.1);
                } else {
                    rotateBoomGroup(-animationSpeed*0.1);
                }

                claw.getWorldPosition(clawWorldPosition);

                let deltaX = clawWorldPosition.x - prevClawX;
                let deltaZ = clawWorldPosition.z - prevClawZ;

                load.position.x += deltaX;
                load.position.z += deltaZ;
            } else {
                animationState++;
            }
            break;
        case 3: // Move the car so the claw is above the container
            if (Math.round(clawWorldPosition.x) < Math.round(targetPosition.x)) {

                let prevClawX = clawWorldPosition.x;
                let prevClawZ = clawWorldPosition.z;

                moveCarForward(clawWorldPosition.x, animationSpeed, targetPosition.x);

                claw.getWorldPosition(clawWorldPosition);

                let deltaX = clawWorldPosition.x - prevClawX;
                let deltaZ = clawWorldPosition.z - prevClawZ;

                load.position.x += deltaX;
                load.position.z += deltaZ;

            } else if (Math.round(clawWorldPosition.x) > Math.round(targetPosition.x)) {
                let prevClawX = clawWorldPosition.x;
                let prevClawZ = clawWorldPosition.z;

                moveCarBackward(clawWorldPosition.x, animationSpeed, targetPosition.x);

                claw.getWorldPosition(clawWorldPosition);

                let deltaX = clawWorldPosition.x - prevClawX;
                let deltaZ = clawWorldPosition.z - prevClawZ;

                load.position.x += deltaX;
                load.position.z += deltaZ;
            } else {
                animationState++;
            }
            break;
        case 4: // Descend the load until it is at the container
            console.log("Descending load until it is at the container");
            if (loadWorldPosition.y > 2) {
                moveClawBaseDown(clawBase.position.y, animationSpeed, clawMinY);
                load.position.y -= animationSpeed;
            } else {
                animationState++;
            }
            break;
        case 5: // Open claw
            if(claw1.rotation.z != minClawAngle){
                openClaw();
            } else {
                animationState++;
            }
            break;
        case 6:
            break;
    }
}

function disableKeyProcessing() {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    for (let key in keys) {
        keys[key] = false;
    }
}

function enableKeyProcessing() {
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
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

function abracadabraClaws(material, clawsLength, clawsWidth) {
    const tetrahedronMagicRotation = [2.1933, 0.6141, -0.7780];
    const tetrahedron = new THREE.TetrahedronGeometry();
    const clawsY = -(clawsLength/2 + 0.);

    const clawRef1 = createReferencial(claw1, [0, clawsY, 0], [clawsWidth, clawsLength, clawsWidth], [0, 2 * Math.PI / 4, 0]);
    const clawRef2 = createReferencial(claw2, [0, clawsY, 0], [clawsWidth, clawsLength, clawsWidth], [0, -2 * Math.PI / 4, 0]);
    const clawRef3 = createReferencial(claw3, [0, clawsY, 0], [clawsWidth, clawsLength, clawsWidth], zeroVector);
    const clawRef4 = createReferencial(claw4, [0, clawsY, 0], [clawsWidth, clawsLength, clawsWidth], [0, 2 * Math.PI / 2, 0]);

    createObject(clawRef1, tetrahedron, material, zeroVector, identityVector, tetrahedronMagicRotation);
    createObject(clawRef2, tetrahedron, material, zeroVector, identityVector, tetrahedronMagicRotation);
    createObject(clawRef3, tetrahedron, material, zeroVector, identityVector, tetrahedronMagicRotation);
    createObject(clawRef4, tetrahedron, material, zeroVector, identityVector, tetrahedronMagicRotation);
}

function createCrane(x, y, z) {
    'use strict';
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1);
    const coneGeometry = new THREE.ConeGeometry(2, 2, 10);
    const material = new THREE.MeshStandardMaterial({ color: 0xfffff00 });

    // Base measurements
    const baseWidth = 10;
    const baseHeight = 3;
    const baseDepth = 8;

    // Tower measurements
    const towerWidth = 2;
    const towerHeight = 30;
    const towerY = (baseHeight + towerHeight) / 2;

    // Boom Group measurements
    const boomGroupHeight = towerHeight + baseHeight / 2;
    // boom
    const boomLength = 34;
    const boomWidth = 2;
    const boomX = Math.round((boomLength / 2) / 3);

    // cabin
    const cabinWidth = 4;
    const cabinHeight = 3;
    const cabinDepth = 5;
    const cabinZ = cabinDepth / 10;
    const cabinY = -((cabinHeight + boomWidth) / 2 + 3);

    // counterweight
    const weightWidth = 3;
    const weightHeight = 6;
    const weightDepth = 8;
    const weightX = -((boomLength / 2) - boomX + weightWidth) / 2;
    const weightY = -(weightHeight - boomWidth) / 2;

    // tower peak
    const towerPeakHeight = 6;
    const towerPeakY = (towerPeakHeight + boomWidth) / 2;

    // pendants
    const pendantsWidth = 0.1;
    const pendantsY = (towerWidth + towerPeakHeight - pendantsWidth) / 2;
    // fore pendant
    const forePendantLength = Math.sqrt(Math.pow(towerPeakHeight, 2) + Math.pow(boomX + boomLength / 2 - towerWidth / 2, 2));
    const forePendantX = (towerWidth / 2 + boomX + boomLength / 2) / 2;
    const forePendantAngle = Math.PI / 2 - Math.asin(towerPeakHeight / forePendantLength);
    // rear pendant
    const rearPendantLength = Math.sqrt(Math.pow(towerPeakHeight, 2) + Math.pow(boomLength / 2 - boomX - towerWidth / 2, 2));
    const rearPendantX = - (towerWidth / 2 + boomLength / 2 - boomX) / 2;
    const rearPendantAngle = - (Math.PI / 2 - Math.asin(towerPeakHeight / rearPendantLength));

    // car
    const carInitialPlacement = [boomX / 2 + boomLength / 4, -towerWidth / 2, 0];
    const carWidth = 3;
    const carHeight = 1;
    const carDepth = 2;
    carMaxX = boomX + boomLength / 2 - carWidth / 2;
    carMinX = boomX;

    // cable
    const cableWidth = 0.5;
    const cableLength = 28;
    const cableY = - (cableLength / 2 + carHeight / 2);
    clawMinY = -(cableLength + coneGeometry.parameters.height / 2);
    clawMaxY = - (carHeight + coneGeometry.parameters.height) / 2;

    // claw
    const clawBaseY = - (cableLength + coneGeometry.parameters.height / 2);
    const clawsWidth = 0.5;
    const clawsLength = 2;
    const clawsRadius = 1.5;
    const clawsY = - coneGeometry.parameters.height / 2;


    const craneReferencial = createReferencial(scene, [x, y, z], identityVector, zeroVector);

    // base
    createObject(craneReferencial, boxGeometry, material, zeroVector, [baseWidth, baseHeight, baseDepth], zeroVector);
    // tower
    createObject(craneReferencial, boxGeometry, material, [0, towerY, 0], [towerWidth, towerHeight, towerWidth], zeroVector);

    boomGroup = createReferencial(craneReferencial, [0, boomGroupHeight, 0], identityVector, zeroVector);

    // boom
    createObject(boomGroup, boxGeometry, material, [boomX, 0, 0], [boomLength, boomWidth, boomWidth], zeroVector);
    // cabin
    createObject(boomGroup, boxGeometry, material, [0, cabinY, cabinZ], [cabinWidth, cabinHeight, cabinDepth], zeroVector);
    // counterweight
    createObject(boomGroup, boxGeometry, material, [weightX, weightY, 0], [weightWidth, weightHeight, weightDepth], zeroVector);
    // tower peak
    createObject(boomGroup, boxGeometry, material, [0, towerPeakY, 0], [towerWidth, towerPeakHeight, towerWidth], zeroVector);
    // fore pendant
    createObject(boomGroup, cylinderGeometry, material, [forePendantX, pendantsY, 0], [pendantsWidth, forePendantLength, pendantsWidth], [0, 0, forePendantAngle]);
    // rear pendant
    createObject(boomGroup, cylinderGeometry, material, [rearPendantX, pendantsY, 0], [pendantsWidth, rearPendantLength, pendantsWidth], [0, 0, rearPendantAngle]);

    car = createReferencial(boomGroup, carInitialPlacement, identityVector, zeroVector);

    // claw car
    createObject(car, boxGeometry, material, zeroVector, [carWidth, carHeight, carDepth], zeroVector);

    cable = createObject(car, cylinderGeometry, material, [0, cableY, 0], [cableWidth, cableLength, cableWidth], zeroVector);
    cableInitialYScale = cable.scale.y;

    clawBase = createReferencial(car, [0, clawBaseY, 0], identityVector, zeroVector);

    // claw base
    createObject(clawBase, coneGeometry, material, zeroVector, identityVector, zeroVector);

    const clawReferencial = createReferencial(clawBase, zeroVector, identityVector, zeroVector);

    claw1 = createReferencial(clawReferencial, [clawsRadius, clawsY, 0], identityVector, zeroVector);
    claw2 = createReferencial(clawReferencial, [-clawsRadius, clawsY, 0], identityVector, zeroVector);
    claw3 = createReferencial(clawReferencial, [0, clawsY, clawsRadius], identityVector, zeroVector);
    claw4 = createReferencial(clawReferencial, [0, clawsY, -clawsRadius], identityVector, zeroVector);

    abracadabraClaws(material, clawsLength, clawsWidth);

    clawCollisionSphere = addCollisionSphere(clawBase, 2.5);

    return craneReferencial;
}

function createContainer(x, y, z) {
    'use strict';
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xfff0000 });
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff }); // Blue floor

    const container = new THREE.Object3D();

    // Floor
    createObject(container, boxGeometry, floorMaterial, [x, y, z], [6, 0.1, 10], zeroVector);

    // Walls
    createObject(container, boxGeometry, wallMaterial, [x - 3, y + 3, z], [0.1, 6, 10], zeroVector); // Left wall
    createObject(container, boxGeometry, wallMaterial, [x + 3, y + 3, z], [0.1, 6, 10], zeroVector); // Right wall
    createObject(container, boxGeometry, wallMaterial, [x, y + 3, z - 5], [6, 6, 0.1], zeroVector); // Front wall
    createObject(container, boxGeometry, wallMaterial, [x, y + 3, z + 5], [6, 6, 0.1], zeroVector); // Back wall

    scene.add(container);

    return container;
}

function createSquareLoad(x, y, z) {
    'use strict';
    const boxGeometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

    const boxReferencial = createReferencial(scene, [x, y, z], identityVector, zeroVector);

    createObject(boxReferencial, boxGeometry, material, zeroVector, [1, 1, 1], zeroVector);

    loadCollisionSpheres.push(addCollisionSphere(boxReferencial, 1.75));
    
    return boxReferencial;
}

function createDodecahedronLoad(x, y, z) {
    'use strict';
    const dodecahedronGeometry = new THREE.DodecahedronGeometry(2.5, 3);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

    const dodecahedronReferencial = createReferencial(scene, [x, y, z], identityVector, zeroVector);

    createObject(dodecahedronReferencial, dodecahedronGeometry, material, zeroVector, [1, 1, 1], zeroVector);

    loadCollisionSpheres.push(addCollisionSphere(dodecahedronReferencial, 2.5));
    
    return dodecahedronReferencial;
}

function createIcosahedronLoad(x, y, z) {
    'use strict';
    const icosahedronGeometry = new THREE.IcosahedronGeometry(1.3, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

    const icosahedronReferencial = createReferencial(scene, [x, y, z], identityVector, zeroVector);

    createObject(icosahedronReferencial, icosahedronGeometry, material, zeroVector, [1, 1, 1], zeroVector);

    loadCollisionSpheres.push(addCollisionSphere(icosahedronReferencial, 1.3));
    
    return icosahedronReferencial;
}

function createTorusLoad(x, y, z) {
    'use strict';
    const torusGeometry = new THREE.TorusGeometry( 1, 0.75, 16, 100 ); ;
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

    const torusReferencial = createReferencial(scene, [x, y, z], identityVector, zeroVector);

    createObject(torusReferencial, torusGeometry, material, zeroVector, [1, 1, 1], zeroVector);

    loadCollisionSpheres.push(addCollisionSphere(torusReferencial, 1.75));
    
    return torusReferencial;
}

function createTorusKnotLoad(x, y, z) {
    'use strict';
    const torusKnotGeometry = new THREE.TorusKnotGeometry( 1.4, 1.3, 8, 75 ); ;
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });

    const torusKnotReferencial = createReferencial(scene, [x, y, z], identityVector, zeroVector);

    createObject(torusKnotReferencial, torusKnotGeometry, material, zeroVector, [1, 1, 1], zeroVector);

    loadCollisionSpheres.push(addCollisionSphere(torusKnotReferencial, 2.8));
    
    return torusKnotReferencial;
}

function createScene() {
    'use strict';
    scene.background = new THREE.Color(0xadd8e6);
    scene.add(new THREE.AxesHelper(20));

    let light = new THREE.AmbientLight(0xffffff, 1);
    scene.add(light);

    createCrane(0, 1.5, 0).name = "Crane";
    createContainer(20, 0, 0).name = "Container";
    createSquareLoad(10, 0.5, 7).name = "Load 1";
    createDodecahedronLoad(10, 0.5, -7).name = "Load 2";
    createIcosahedronLoad(-8, 0.5, -12).name = "Load 3";
    createTorusLoad(-15, 0.5, 13.2).name = "Load 4";
    createTorusKnotLoad(-21, 0.5, -5).name = "Load 5";
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
    cameraHook.lookAt(cameraHook.position.x, 0, cameraHook.position.y);
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

    hudElement.innerHTML += `<br>Crane Controls<br>`;

    hudElement.innerHTML += `Q/A - Rotate upper section: ${keys['q'] || keys['a'] ? 'Active' : 'Inactive'}<br>`;
    hudElement.innerHTML += `W/S - Move trolley: ${keys['w'] || keys['s'] ? 'Active' : 'Inactive'}<br>`;
    hudElement.innerHTML += `E/D - Move hook block and claw: ${keys['e'] || keys['d'] ? 'Active' : 'Inactive'}<br>`;
    hudElement.innerHTML += `R/F - Open/close gripper: ${keys['r'] || keys['f'] ? 'Active' : 'Inactive'}<br>`;
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

function rotateBoomGroup(speed) {
    boomGroup.rotation.y += speed;
}

function moveCarForward(position, speed, limit) {
    car.position.x =  Math.min(position + speed, limit);
}

function moveCarBackward(position, speed, limit) {
    car.position.x =  Math.max(position - speed, limit);
}

function moveClawBaseUp(position, speed, limit) {
    let newPosition = Math.min(position + speed, limit);
    cable.scale.y = newPosition;
    cable.position.y = cable.scale.y / 2;
    clawBase.position.y =  newPosition;
}

function moveClawBaseDown(position, speed, limit) {
    let newPosition = Math.max(position - speed, limit);
    cable.scale.y = newPosition;
    cable.position.y = cable.scale.y / 2;
    clawBase.position.y =  newPosition;
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
    }
    keys[e.key.toLowerCase()] = true;
}

function onKeyUp(e) {
    'use strict';
    keys[e.key.toLowerCase()] = false;
}

function animate() {
    'use strict';

    console.log(animationState);
    let collision = false;
    for (let i = 0; i < loadCollisionSpheres.length; i++) {
        if (checkSphereCollision(clawCollisionSphere, loadCollisionSpheres[i])) {
            //checks if animation is done, if it is, it doesn't consider collision so that the claw can move back up again
            if(animationState != 6){
                collision = 1;
            }
            animateClawToContainer(clawCollisionSphere.parent , loadCollisionSpheres[i].parent, {x: 20, y: 0, z: 0}); //TODO: mudar isto para a posição do contentor
            break;
        }
    }
    // after animation
    if (animationState == 6 && collision == false) {
        console.log("entrei");
        if (clawCollisionSphere.parent.position.y < clawMaxY) {
            moveClawBaseUp(clawCollisionSphere.parent.position.y, animationSpeed, clawMaxY);
        } else {
            animationState = 0;
            enableKeyProcessing();
        }
    }

    if (keys['q']) {
        rotateBoomGroup(boomRotationSpeed);
    }
    if (keys['a']) {
        rotateBoomGroup(-boomRotationSpeed);
    }
    if (keys['w']) {
        moveCarForward(car.position.x, carSpeed, carMaxX);
    }
    if (keys['s']) {
        moveCarBackward(car.position.x, carSpeed, carMinX);
    }
    if (keys['e']) {
        moveClawBaseUp(clawBase.position.y, clawBaseSpeed, clawMaxY);
    }
    if (keys['d']) {
        moveClawBaseDown(clawBase.position.y, clawBaseSpeed, clawMinY);
    }
    if (keys['r']) {
        openClaw();
    }
    if (keys['f']) {
        closeClaw();
    }

    updateHUD();
    render();
    requestAnimationFrame(animate);
}

init();
requestAnimationFrame(animate);
