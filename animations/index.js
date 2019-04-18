require("buffer"); // Load the Buffer polyfill

const
	fs = require("fs"),
	
	AnimationDecoder = require("./animation-decoder"),
	
	THREE = require("three");

const
	dogBHD = fs.readFileSync(__dirname + "/DOG.bhd"),
	
	// Have to write these out explicitly so that brfs's static transformation can catch them for us
	BHTs = [
		fs.readFileSync(__dirname + "/DOG0.bht"),
		fs.readFileSync(__dirname + "/DOG1.bht"),
		fs.readFileSync(__dirname + "/DOG2.bht"),
		fs.readFileSync(__dirname + "/DOG3.bht"),
		fs.readFileSync(__dirname + "/DOG4.bht"),
		fs.readFileSync(__dirname + "/DOG5.bht"),
		fs.readFileSync(__dirname + "/DOG6.bht"),
		fs.readFileSync(__dirname + "/DOG7.bht"),
		fs.readFileSync(__dirname + "/DOG8.bht"),
		fs.readFileSync(__dirname + "/DOG9.bht"),
		fs.readFileSync(__dirname + "/DOG10.bht"),
		fs.readFileSync(__dirname + "/DOG11.bht"),
		fs.readFileSync(__dirname + "/DOG12.bht"),
		fs.readFileSync(__dirname + "/DOG13.bht"),
		fs.readFileSync(__dirname + "/DOG14.bht"),
		fs.readFileSync(__dirname + "/DOG15.bht"),
		fs.readFileSync(__dirname + "/DOG16.bht"),
		fs.readFileSync(__dirname + "/DOG17.bht"),
		fs.readFileSync(__dirname + "/DOG18.bht"),
		fs.readFileSync(__dirname + "/DOG19.bht"),
		fs.readFileSync(__dirname + "/DOG20.bht"),
	],

	decoder = new AnimationDecoder(dogBHD);

for (let i = 0; i < BHTs.length; i++) {
	decoder.addAnimation(i, BHTs[i]);
}

let
	CAMERA_DISTANCE = 750,
	
	camera, scene, renderer, petGroup,
	mouseX = 0, mouseY = 0,
	displayHalfX = window.innerWidth / 2,
	displayHalfY = window.innerHeight / 2,
	
	ballMeshes = [],
	
	animationStart = Date.now(),
	
	animationIndex = 0,
	animationFrameIndex = 0;

function initScene() {
	camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
	camera.position.z = CAMERA_DISTANCE;
	scene = new THREE.Scene();
	scene.background = new THREE.Color(0xffffff);
	scene.fog = new THREE.Fog(0xffffff, 1, 100000);
	
	let
		material = new THREE.MeshNormalMaterial();
	
	petGroup = new THREE.Group();
	
	animationFrameIndex = 0;
	
	for (let i = 0; i < decoder.numBalls; i++) {
		let
			geometry = new THREE.SphereBufferGeometry(decoder.ballSizes[i] / 2, 16, 16),
			ball = new THREE.Mesh(geometry, material);
		
		ball.position.x = decoder.animations[animationIndex].frames[animationFrameIndex].balls[i].x;
		ball.position.y = -decoder.animations[animationIndex].frames[animationFrameIndex].balls[i].y;
		ball.position.z = decoder.animations[animationIndex].frames[animationFrameIndex].balls[i].z;
		ball.matrixAutoUpdate = false;
		ball.updateMatrix();
		
		ballMeshes.push(ball);
		
		petGroup.add(ball);
	}
	
	scene.add(petGroup);
	
	renderer = new THREE.WebGLRenderer({antialias: true});
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.getElementById("container").appendChild(renderer.domElement);
	
	document.addEventListener('mousemove', onDocumentMouseMove, false);
	window.addEventListener('resize', onWindowResize, false);
	window.addEventListener('click', e => {
		animationStart = Date.now();
		animationIndex = (animationIndex + 1) % decoder.animations.length;
		animationFrameIndex = -1;
	});
	window.addEventListener("wheel", e => {
		if (e.deltaY > 0) {
			CAMERA_DISTANCE *= 1.2;
		} else {
			CAMERA_DISTANCE /= 1.2;
		}
	});
}

function onWindowResize() {
	let
		displayWidth = renderer.domElement.clientWidth,
		displayHeight = renderer.domElement.clientHeight;
	
	displayHalfX = displayWidth / 2;
	displayHalfY = displayHeight / 2;
	camera.aspect = displayWidth / displayHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(displayWidth, displayHeight);
}

function onDocumentMouseMove(event) {
	mouseX = event.clientX - displayHalfX;
	mouseY = event.clientY - displayHalfY;
}

function animate() {
	requestAnimationFrame(animate);
	render();
}

function render() {
	let
		newFrameIndex = Math.round((Date.now() - animationStart) / 100) % decoder.animations[animationIndex].frames.length;
	
	if (newFrameIndex !== animationFrameIndex) {
		animationFrameIndex = newFrameIndex;
		
		for (let i = 0; i < decoder.numBalls; i++) {
			ballMeshes[i].position.x = decoder.animations[animationIndex].frames[newFrameIndex].balls[i].x;
			ballMeshes[i].position.y = -decoder.animations[animationIndex].frames[newFrameIndex].balls[i].y;
			ballMeshes[i].position.z = decoder.animations[animationIndex].frames[newFrameIndex].balls[i].z;
			
			ballMeshes[i].updateMatrix();
		}
	}
	
	petGroup.rotation.y = mouseX / displayHalfX * Math.PI * 2;
	
	camera.position.y = Math.sin(mouseY / displayHalfY * Math.PI / 2) * CAMERA_DISTANCE;
	camera.position.z = Math.cos(mouseY / displayHalfY * Math.PI / 2) * CAMERA_DISTANCE;
	
	camera.lookAt(scene.position);
	
	renderer.render(scene, camera);
}

initScene();
animate();
