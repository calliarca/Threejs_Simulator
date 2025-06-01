import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const textureLoader = new THREE.TextureLoader();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.shadowMap.enabled = true;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
document.body.appendChild(renderer.domElement);

const loader = new GLTFLoader();
const rainDensity = document.getElementById('rainDensity'); 
const tiltAngle = document.getElementById('tiltAngle');

let untitledPivot; // Pivot point for untitled.glb model

// Create a pivot for the 'untitled.glb' model
untitledPivot = new THREE.Object3D();
scene.add(untitledPivot);

// glass (plywood) material and geometry
const glassWidth = 9.5; // Width of the plywood
const glassHeight = 3; // Thickness of the plywood (very thin)
const glassDepth = 0.01; // Depth of the plywood

// Create the plywood geometry and material
const glassGeometry = new THREE.BoxGeometry(glassWidth, glassHeight, glassDepth);
const glassMaterial = new THREE.MeshPhysicalMaterial({
    roughness: 0,
    transmission: 1,
    thickness: 0.5,
  });
// Create the plywood mesh and position it in the scene
const glass = new THREE.Mesh(glassGeometry, glassMaterial);
glass.position.set(-5, 4, -1.85); // Position it slightly above the ground
glass.castShadow = true;
glass.receiveShadow = true;
scene.add(glass);

const untitledTexture = textureLoader.load('steel-texture.png'); // Replace with actual path to your texture image

const models = [
    { path: 'untitled.glb', position: { x: 0, y: -0.16, z: 0 } },
    { path: 'bawah.glb', position: { x: 0, y: -1.3, z: 0 } },
];

models.forEach(({ path, position }) => {
    loader.load(path, function (gltf) {
        const model = gltf.scene;
        model.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;

                // Apply texture to untitled.glb model
                if (path === 'untitled.glb') {
                    node.material.map = untitledTexture;
                    node.material.needsUpdate = true; // Ensure the texture is updated
                } else if (path === 'bawah.glb') {
                    node.material.map = untitledTexture;
                    node.material.needsUpdate = true; // Ensure the texture is updated
                }
            }
        });

        // Position and add model based on path
        if (path === 'untitled.glb') {
            untitledPivot.position.set(position.x, position.y, position.z);
            model.position.set(-2.5, -0.1, -5.47);
            untitledPivot.add(model);
        } else {
            model.position.set(position.x, position.y, position.z);
            scene.add(model);
        }
    }, undefined, function (error) {
        console.error(`Error loading ${path}:`, error);
    });
});

// Background and ground
const backgroundTexture = textureLoader.load('/weather-image.jpg');
scene.background = backgroundTexture;

const groundTexture = textureLoader.load('/ground-texture.jpg');
const planeGeometry = new THREE.PlaneGeometry(100, 100);
const planeMaterial = new THREE.MeshStandardMaterial({ map: groundTexture, side: THREE.DoubleSide });
const ground = new THREE.Mesh(planeGeometry, planeMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1;
ground.receiveShadow = true;
scene.add(ground);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 7);
light.castShadow = true;
scene.add(light);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);


// Set initial camera height
camera.position.set(0, 10, 15); // This sets camera 5 units up on the y-axis, 10 units back on the z-axis
const controls = new OrbitControls(camera, renderer.domElement);

// Rain setup
let rainEnabled = true;
let rainCount = 0; // Default rain count
let rain; // Variable to hold the rain points

function generateRain(count) {
    if (rain) scene.remove(rain); // Remove existing rain if any

    const rainGeometry = new THREE.BufferGeometry();
    const rainMaterial = new THREE.PointsMaterial({
        size: 0.05,
        color: 0x0000ff,
    });

    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() + 1) * 10 - 20;  // x position
        positions[i * 3 + 2] = Math.random() * 5 + 4;    // y position
        positions[i * 3 + 2] = (Math.random() - 1.4) * 4; // z position
    }

    rainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    rain = new THREE.Points(rainGeometry, rainMaterial);
    rain.visible = rainEnabled;
    scene.add(rain);
}

generateRain(rainCount); // Initial rain generation


// Update rain density
rainDensity.addEventListener('change', (event) => {
    rainCount = parseInt(event.target.value, 10);
    generateRain(rainCount);
});

// Update tilt angle for untitled.glb model
function updateTilt(angle) {
    if (untitledPivot) {
        untitledPivot.rotation.x = THREE.MathUtils.degToRad(angle);
    }
}

// Event listener for tilt angle selection
tiltAngle.addEventListener('change', (event) => {
    const angle = parseInt(event.target.value, 10);
    updateTilt(angle);
});

function animate() {
    if (rainEnabled && rain) {
        const positions = rain.geometry.attributes.position.array;
        for (let i = 1; i < rainCount; i++) {
            positions[i * 3 + 1] -= 0.1; // Move down
            if (positions[i * 3 + 1] < 1.2) {
                positions[i * 3 + 1] = Math.random() * 4 + 4; // Reset to top position
            }
        }
        rain.geometry.attributes.position.needsUpdate = true;
    }

    controls.update();
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
