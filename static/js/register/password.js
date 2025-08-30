import * as THREE from "three";
import { OrbitControls } from "../OrbitControls.js";

class BuildYourPassword {
  constructor() {
    // Get the container
    const container = document.getElementById("buildYourPassword-container");

    // Create Scene, camera, renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 30, 30);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(this.renderer.domElement);

    // Set background colour
    this.renderer.setClearColor(0xffffff);

    // Create Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // Prevent user from looking below baseplate
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI / 2;
    // Max/Min zoom
    this.controls.minDistance = 10;
    this.controls.maxDistance = 50;
    this.camera.position.set(0, 20, 20);
    this.camera.lookAt(0, 0, 0);

    // Create Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(10, 20, 10);
    this.scene.add(dirLight);

    // Grid options
    this.gridSize = 15;
    this.squareSize = 1;
    this.offset = (this.gridSize * this.squareSize) / 2 - this.squareSize / 2;
    this.studHeight = 0.15;

    // Colour Management
    this.selectedColour = 0xff0000;
    this.selectedColourStud = 0xab1f1f;

    // Brick Selector Management
    this.selectedBrickWidth = 1;
    this.selectedBrickLength = 1;

    // Rotation
    this.currentRotation = 0;

    // Occupied Bricks
    this.occupied = Array.from({ length: this.gridSize }, () =>
      Array(this.gridSize).fill(false)
    );

    // Placed bricks
    this.placedBricks = [];

    // Draw grid lines
    const gridHelper = new THREE.GridHelper(
      this.gridSize * this.squareSize,
      this.gridSize,
      0xb5b3b3,
      0xb5b3b3
    );
    gridHelper.position.y = 0.01;
    this.scene.add(gridHelper);

    // Create base baseplate (the thick one)
    const baseplateThickness = 0.2;
    const baseplateMaterial = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
    });
    const baseplateGeometry = new THREE.BoxGeometry(
      this.gridSize * this.squareSize,
      baseplateThickness,
      this.gridSize * this.squareSize
    );
    const baseplateMesh = new THREE.Mesh(baseplateGeometry, baseplateMaterial);
    baseplateMesh.position.set(0, -baseplateThickness / 2, 0);
    this.scene.add(baseplateMesh);

    // Draw flat baseplate squares and studs
    const plateMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const studMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa });
    const studRadius = 0.26;
    const studHeight = 0.15;

    for (let x = 0; x < this.gridSize; x++) {
      for (let z = 0; z < this.gridSize; z++) {
        const geometry = new THREE.PlaneGeometry(
          this.squareSize,
          this.squareSize
        );
        const mesh = new THREE.Mesh(geometry, plateMaterial);
        mesh.rotation.x = -Math.PI / 2;
        mesh.position.set(
          x * this.squareSize - this.offset,
          0,
          z * this.squareSize - this.offset
        );
        this.scene.add(mesh);

        const studGeo = new THREE.CylinderGeometry(
          studRadius,
          studRadius,
          studHeight,
          32
        );
        const stud = new THREE.Mesh(studGeo, studMaterial);
        stud.position.set(
          x * this.squareSize - this.offset,
          studHeight / 2,
          z * this.squareSize - this.offset
        );
        this.scene.add(stud);
      }
    }

    // Place Block
    this.renderer.domElement.addEventListener(
      "pointerdown",
      this.onPointerDown.bind(this)
    );

    // Change Colour Selection
    const colourButtons = document.querySelectorAll(".colourSelect");
    colourButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        colourButtons.forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        const colour = btn.getAttribute("data-colour");
        this.selectedColour = colour
          ? parseInt(colour.replace("#", "0x"))
          : 0xff0000;

        const studColour = btn.getAttribute("data-studcolour");
        this.selectedColourStud = studColour
          ? parseInt(studColour.replace("#", "0x"))
          : 0xab1f1f;
      });
    });

    // Change Brick Selection
    const brickButtons = document.querySelectorAll(".brick");
    brickButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        brickButtons.forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        this.selectedBrickWidth = parseInt(btn.getAttribute("data-brickwidth"));
        this.selectedBrickLength = parseInt(
          btn.getAttribute("data-bricklength")
        );
      });
    });

    // Rotation
    const rotateButton = document.getElementById(
      "buildYourPassword-rotateButton"
    );
    rotateButton.addEventListener("click", () => {
      this.rotateBrick();
    });

    window.addEventListener("keydown", (event) => {
      if (event.key === "r" || event.key === "R") {
        this.rotateBrick();
      }
    });

    // Brick Previewer
    this.previewBrick = null;
    this.previewVisable = false;

    this.renderer.domElement.addEventListener(
      "pointermove",
      this.onPointerMove.bind(this)
    );

    const submitBtn = document.getElementById("buildYourPassword-submitButton");
    submitBtn.addEventListener("click", async () => {
      const password = await this.generatePassword();
      fetch("/register/password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: password }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            window.location.href = "/register/displayname";
          }
          if (data.error) {
            if (data.error === "No username has been set.") {
              window.location.href = "/register/username";
            } else if (data.error === "Username already taken.") {
              window.location.href = "/register/username";
            }
            alert(data.error);
          }
        })
        .catch((err) => console.error("Fetch error:", err));
    });

    // Render loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  // Brick Preview
  onPointerMove(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const planeY = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(planeY, intersectPoint);

    const x = Math.round((intersectPoint.x + this.offset) / this.squareSize);
    const z = Math.round((intersectPoint.z + this.offset) / this.squareSize);

    if (
      x >= 0 &&
      x < this.gridSize &&
      z >= 0 &&
      z < this.gridSize &&
      this.canPlaceBrick(x, z)
    ) {
      this.showPreview(x, z);
    } else {
      this.hidePreview();
    }
  }

  showPreview(x, z) {
    let brickWidth = this.selectedBrickWidth;
    let brickLength = this.selectedBrickLength;

    let rotation = this.currentRotation;
    if (rotation === 90 || rotation === 270) {
      [brickWidth, brickLength] = [brickLength, brickWidth];
    }

    const brickHeight = 0.8;

    // Remove old previews
    if (this.previewBrick) {
      this.scene.remove(this.previewBrick);
      this.previewBrick.geometry.dispose();
      this.previewBrick.material.dispose();
      this.previewBrick = null;
    }

    const previewMaterial = new THREE.MeshStandardMaterial({
      color: this.selectedColour,
      transparent: true,
      opacity: 0.5,
    });
    const brickGeometry = new THREE.BoxGeometry(
      brickWidth * this.squareSize,
      brickHeight,
      brickLength * this.squareSize
    );
    const brick = new THREE.Mesh(brickGeometry, previewMaterial);
    brick.position.set(
      (x + (brickWidth - 1) / 2) * this.squareSize - this.offset,
      brickHeight / 2,
      (z + (brickLength - 1) / 2) * this.squareSize - this.offset
    );
    this.scene.add(brick);
    this.previewBrick = brick;

    this.previewVisable = true;
  }

  hidePreview() {
    if (this.previewBrick) {
      this.scene.remove(this.previewBrick);
      this.previewBrick.geometry.dispose();
      this.previewBrick.material.dispose();
      this.previewBrick = null;
    }
    this.previewVisable = false;
  }

  // Place Brick
  onPointerDown(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.camera);

    const planeY = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(planeY, intersectPoint);

    const x = Math.round((intersectPoint.x + this.offset) / this.squareSize);
    const z = Math.round((intersectPoint.z + this.offset) / this.squareSize);

    if (x >= 0 && x < this.gridSize && z >= 0 && z < this.gridSize) {
      if (this.canPlaceBrick(x, z)) {
        this.placeBrick(x, z);
      }
    }
    this.hidePreview();
  }

  canPlaceBrick(x, z) {
    let brickWidth = this.selectedBrickWidth;
    let brickLength = this.selectedBrickLength;

    let rotation = this.currentRotation;
    if (rotation === 90 || rotation === 270) {
      [brickWidth, brickLength] = [brickLength, brickWidth];
    }

    if (
      x < 0 ||
      z < 0 ||
      x + brickWidth - 1 >= this.gridSize ||
      z + brickLength - 1 >= this.gridSize
    ) {
      return false;
    }

    for (let dx = 0; dx < brickWidth; dx++) {
      for (let dz = 0; dz < brickLength; dz++) {
        if (this.occupied[x + dx][z + dz]) {
          return false;
        }
      }
    }
    return true;
  }

  placeBrick(x, z) {
    let brickWidth = this.selectedBrickWidth;
    let brickLength = this.selectedBrickLength;

    let rotation = this.currentRotation;
    if (rotation === 90 || rotation === 270) {
      [brickWidth, brickLength] = [brickLength, brickWidth];
    }

    const brickHeight = 0.8;
    const brickMaterial = new THREE.MeshStandardMaterial({
      color: this.selectedColour,
    });

    const brickGeometry = new THREE.BoxGeometry(
      brickWidth * this.squareSize,
      brickHeight,
      brickLength * this.squareSize
    );
    const brick = new THREE.Mesh(brickGeometry, brickMaterial);

    const studHeight = 0.15;
    const y = 0;
    brick.position.set(
      (x + (brickWidth - 1) / 2) * this.squareSize - this.offset,
      y + brickHeight / 2,
      (z + (brickLength - 1) / 2) * this.squareSize - this.offset
    );
    this.scene.add(brick);

    // Add studs on top of the brick
    const studRadius = 0.26;
    const studMaterial = new THREE.MeshStandardMaterial({
      color: this.selectedColourStud,
    });
    for (let dx = 0; dx < brickWidth; dx++) {
      for (let dz = 0; dz < brickLength; dz++) {
        const studGeometry = new THREE.CylinderGeometry(
          studRadius,
          studRadius,
          studHeight,
          32
        );
        const stud = new THREE.Mesh(studGeometry, studMaterial);
        stud.position.set(
          (x + dx) * this.squareSize - this.offset,
          y + brickHeight + studHeight / 2,
          (z + dz) * this.squareSize - this.offset
        );
        this.scene.add(stud);
        this.occupied[x + dx][z + dz] = true;
      }
    }

    this.placedBricks.push({
      x,
      z,
      width: brickWidth,
      length: brickLength,
      rotation: this.currentRotation,
      colour: this.selectedColour,
      studColour: this.selectedColourStud,
    });
  }

  // Rotate Brick
  rotateBrick() {
    this.currentRotation = (this.currentRotation + 90) % 360;
  }

  // Generate Password
  async generatePassword() {
    // sort to make sure the order is always the same no matter the brick placement time
    const sorted = this.placedBricks.slice().sort((a, b) => {
      return (
        a.x - b.x ||
        a.z - b.z ||
        a.width - b.width ||
        a.length - b.length ||
        a.rotation - b.rotation ||
        a.color - b.color ||
        a.studColor - b.studColor
      );
    });

    const str = JSON.stringify(sorted);

    // hash password using SHA256
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = crypto.subtle.digest("SHA-256", data);

    // convert hash to hex string
    const hashArray = Array.from(new Uint8Array(await hashBuffer));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hashHex;
  }

  animate() {
    requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}

window.addEventListener("load", () => {
  try {
    new BuildYourPassword();
  } catch (error) {
    console.error("Error initializing BuildYourPassword:", error);
  }
});
//
