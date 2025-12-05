import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class StudioViewer {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.scene = new THREE.Scene();
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(45, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
        this.camera.position.set(5, 5, 5);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.setClearColor(0xFFFAF7, 1); // Match homepage bg
        this.container.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Lighting
        this.setupLighting();

        // Load Model
        this.loadModel();

        // Events
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Setup UI Buttons
        this.setupUI();

        // Start loop
        this.animate();
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 10, 7);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        this.scene.add(dirLight);

        // Add a subtle environment map or secondary light
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
        fillLight.position.set(-5, 0, -5);
        this.scene.add(fillLight);
    }

    loadModel() {
        const loader = new GLTFLoader();
        
        // Load the enclosure model from parent directory
        loader.load(
            '../enclosure4.glb',
            (gltf) => {
                const model = gltf.scene;
                
                // Center model
                const box = new THREE.Box3().setFromObject(model);
                const center = box.getCenter(new THREE.Vector3());
                model.position.sub(center); // Center at origin

                // Add wireframe overlay like main site
                model.traverse((child) => {
                    if (child.isMesh) {
                        // Light grey material
                        child.material = new THREE.MeshStandardMaterial({
                            color: 0xffffff,
                            roughness: 0.5,
                            metalness: 0.1
                        });
                        child.castShadow = true;
                        child.receiveShadow = true;

                        // Add edges
                        const edges = new THREE.EdgesGeometry(child.geometry, 15);
                        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
                        child.add(line);
                    }
                });

                this.scene.add(model);
                this.model = model;

                // Fit camera
                this.fitCameraToSelection(this.camera, this.controls, [model]);
            },
            undefined,
            (error) => {
                console.error('Error loading model:', error);
                // If error (e.g. running locally without server), create a placeholder
                this.createPlaceholder();
            }
        );
    }

    createPlaceholder() {
        const geometry = new THREE.BoxGeometry(2, 3, 1);
        const material = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        const cube = new THREE.Mesh(geometry, material);
        
        // Edges
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x000000 }));
        cube.add(line);

        this.scene.add(cube);
        this.model = cube;
    }

    fitCameraToSelection(camera, controls, selection, fitOffset = 1.2) {
        const box = new THREE.Box3();
        
        for(const object of selection) box.expandByObject(object);
        
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        const maxSize = Math.max(size.x, size.y, size.z);
        const fitHeightDistance = maxSize / (2 * Math.atan(Math.PI * camera.fov / 360));
        const fitWidthDistance = fitHeightDistance / camera.aspect;
        const distance = fitOffset * Math.max(fitHeightDistance, fitWidthDistance);
        
        const direction = controls.target.clone()
            .sub(camera.position)
            .normalize()
            .multiplyScalar(distance);

        controls.maxDistance = distance * 10;
        controls.target.copy(center);
        
        camera.near = distance / 100;
        camera.far = distance * 100;
        camera.updateProjectionMatrix();

        camera.position.copy(controls.target).sub(direction);
        
        controls.update();
    }

    setupUI() {
        const buttons = document.querySelectorAll('.cam-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all
                buttons.forEach(b => b.classList.remove('active'));
                // Add to clicked
                const target = e.currentTarget;
                target.classList.add('active');

                const view = target.dataset.view;
                this.setCameraView(view);
            });
        });
    }

    setCameraView(view) {
        if (!this.model) return;

        const dist = 5;
        const target = new THREE.Vector3(0, 0, 0); // Assuming model is centered

        // Animate or set position
        switch(view) {
            case 'isometric':
                this.camera.position.set(dist, dist, dist);
                break;
            case 'front':
                this.camera.position.set(0, 0, dist * 1.5);
                break;
            case 'top':
                this.camera.position.set(0, dist * 1.5, 0);
                break;
            case 'side':
                this.camera.position.set(dist * 1.5, 0, 0);
                break;
        }
        
        this.camera.lookAt(target);
        this.controls.update();
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

new StudioViewer();

