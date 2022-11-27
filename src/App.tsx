import "./App.css"
import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Mesh, MeshPhongMaterial, Object3D, Vector2, Vector3, WebGLRenderer } from 'three';
import WebGL from './util/webGlChecker';

interface PlayerEntity {
  entityObject3D: Object3D,
  vel: Vector2,
}

// CONSTANTS
const maxSnowballVel = 1.8;
const maxSnowballPosX = 90;
const maxSnowballPosY = 90;

const maxFireballPosX = 100;
const maxFireballPosY = 100;

const snowballRadius = 5;
const fireballRadius = 20;

const fireballNum = 500;
const fireballSpeed = 0.3;
const fireballSpacing = 40;

const ringNum = 11;
const ringSpacing = fireballNum * fireballSpacing / (ringNum - 1);

// FLAGS
let gameStarted = false;
let gameOver = false;

// LOOKUP TARGETS
const iterFireballWorldPos = new Vector3(); // for storing world pos of fireball when detecting collisions
const snowballWorldPos = new Vector3(); // for storing world pos of snowball when detecting collisions
const collidedFireball = new Mesh();


// HELPERS
function resizeRendererToDisplaySize(renderer:WebGLRenderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

function keyDownEventListener(e: KeyboardEvent){
  if (!gameOver) {
    gameStarted = true;
    const downedKey = e.key;
    switch(downedKey) {
      case "w":
      case "W":
      case "ArrowUp":
        if (playerEntity.entityObject3D.position.y <= maxSnowballPosY) {
          playerEntity.vel.setY(maxSnowballVel);
        }
      break;
      case "a":
      case "A":
      case "ArrowLeft":
        if (playerEntity.entityObject3D.position.x >= -1 * maxSnowballPosX) {
          playerEntity.vel.setX(-1*maxSnowballVel);
        }
      break;
      case "s":
      case "S":
      case "ArrowDown":
        if (playerEntity.entityObject3D.position.y >= -1 * maxSnowballPosY) {
          playerEntity.vel.setY(-1*maxSnowballVel);
        }
      break;
      case "d":
      case "D":
      case "ArrowRight":
        if (playerEntity.entityObject3D.position.x <= maxSnowballPosX) {
          playerEntity.vel.setX(1*maxSnowballVel);
        }
      break;
    } 
  } else if (gameOver) {
    gameStarted = false;
    gameOver = false;
    obstacleGroup.position.set(0,0,0);
    const fireballMat = collidedFireball.material as MeshPhongMaterial;
    fireballMat.emissive.setHex(0x440000);
    playerEntity.entityObject3D.position.set(0, 0, 0);
  }

  
}

function keyUpEventListener(e: KeyboardEvent){
  const uppedKey = e.key;
  switch(uppedKey) {
    case "w":
    case "W":
    case "ArrowUp":
      if (playerEntity.vel.y === maxSnowballVel){
        playerEntity.vel.setY(0);
      }
    break;
    case "a":
    case "A":
    case "ArrowLeft":
      if (playerEntity.vel.x === -1*maxSnowballVel){
        playerEntity.vel.setX(0);
      }
    break;
    case "s":
    case "S":
    case "ArrowDown":
      if (playerEntity.vel.y === -1*maxSnowballVel){
        playerEntity.vel.setY(0);
      }
    break;
    case "d":
    case "D":
    case "ArrowRight":
      if (playerEntity.vel.x === maxSnowballVel){
        playerEntity.vel.setX(0);
      }
    break;
  } 
}

// TEXTURES
const loader = new THREE.TextureLoader();
const bgTexture = loader.load('/textures/sky_dark.jpg');
bgTexture.center.set(.5, .5);
bgTexture.rotation = THREE.MathUtils.degToRad(-90);

// SCENE
const scene = new THREE.Scene();
scene.background = bgTexture;

// ENTITIES
const playerEntity: PlayerEntity = {
  entityObject3D: new Object3D(),
  vel: new Vector2,
};

scene.add(playerEntity.entityObject3D);

const fov = 50;
const aspect = 2;  // the canvas default
const near = 0.1;
const far = 10000;
const camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
camera.position.set(0, 10, 60);

playerEntity.entityObject3D.add(camera);

{
  const color = 0xFFFFFF;
  const intensity = 1;
  const light = new THREE.DirectionalLight(color, intensity);
  light.position.set(1, 1, -4);
  scene.add(light);
}

{
  const color = 0xFFFFFF;
  const intensity = 0.5;
  const light = new THREE.AmbientLight(color, intensity)
  scene.add(light);
}

// SNOWBALL
const snowball = new THREE.Mesh();
playerEntity.entityObject3D.add(snowball);
{
  const widthSegments = 8;
  const heightSegments = 8;
  const snowballGeom = new THREE.SphereGeometry(snowballRadius, widthSegments, heightSegments);
  const snowballMat = new THREE.MeshPhongMaterial({
    color: 0xFFFFFF
  });
  snowball.geometry = snowballGeom;
  snowball.material = snowballMat
}


// FIREBALLS
const fireballs: Mesh[] = [];
const obstacleGroup = new THREE.Object3D();
scene.add(obstacleGroup);

{
  const widthSegments = 8;
  const heightSegments = 8;
  const fireballGeom = new THREE.SphereGeometry(fireballRadius, widthSegments, heightSegments);

  for (let idx = 0; idx < fireballNum; idx++){
    const xPos = Math.random() * (2 * maxFireballPosX) - maxFireballPosX;
    const yPos = Math.random() * (2 * maxFireballPosY) - maxFireballPosY;
    const zPos = -1 * fireballSpacing * idx - 500;
    const fireballMesh = new THREE.Mesh(
      fireballGeom,
      new THREE.MeshPhongMaterial({
        color: 0xFF0000,
        emissive: 0x440000
      }));
    fireballMesh.position.set(xPos, yPos, zPos);
    obstacleGroup.add(fireballMesh);
    fireballs.push(fireballMesh);
  }  
}

// RINGS
{
  const radius = 200;
  const tubeRadius = 30;
  const radialSegments = 8;
  const tubularSegments = 24;
  for (let idx = 0; idx < ringNum; idx++){
    const zPos = -1 * ringSpacing * idx - 500;
    const ringMesh = new THREE.Mesh(
      new THREE.TorusGeometry(radius, tubeRadius, radialSegments, tubularSegments),
    new THREE.MeshPhongMaterial({
      color: 0xFF0000,
    }));
    ringMesh.position.set(0, 0, zPos);
    obstacleGroup.add(ringMesh);
  }  
}

// AUDIO
const fireWhoosh = new Audio('/sounds/fire_whoosh.wav');
fireWhoosh.loop = false;

// MAIN PAGE
function PrimitivesDemoPage() {
  const containerRef = useRef<HTMLDivElement>(null)

  const [showStartMessage, setShowStartMessage] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);

  useEffect(() => {
    if ( WebGL.isWebGLAvailable() ) {

      const renderer = new THREE.WebGLRenderer();
      renderer.domElement.id = "renderer_canvas";
      containerRef.current?.appendChild( renderer.domElement );

      window.addEventListener("keydown", keyDownEventListener);
      window.addEventListener("keyup", keyUpEventListener);

      let previousTimestamp = 0;
      
      function animate(time: number) {

        const elapsed = time - previousTimestamp;
        previousTimestamp = time;

        // move fireballs
        if(gameStarted && !gameOver){
          obstacleGroup.position.z += fireballSpeed * elapsed;

          // detect collision
          fireballs.forEach((fireball)=>{
            fireball.getWorldPosition(iterFireballWorldPos);
            snowball.getWorldPosition(snowballWorldPos);
            const distance = snowballWorldPos.distanceTo(iterFireballWorldPos);
            // const fireballIsAhead = 
            if(distance < snowballRadius + fireballRadius){
              fireWhoosh.play();
              const fireballMat = fireball.material as MeshPhongMaterial;
              fireballMat.emissive.setHex(0xff0000);
              collidedFireball.copy(fireball);
              gameOver = true;
              setShowGameOver(true);
            }
          })

          playerEntity.entityObject3D.position.add(
            new Vector3(playerEntity.vel.x, playerEntity.vel.y, 0).multiplyScalar(elapsed * 0.06)
          );
        }

        // always clamp player position and conditionally reset velocity
        playerEntity.entityObject3D.position.clamp(new Vector3(-1*maxSnowballPosX, -1*maxSnowballPosY, 0), new Vector3(maxSnowballPosX, maxSnowballPosY, 0));

        // reset vel and acc if snowball is at clamp edge
        if (playerEntity.entityObject3D.position.x === -1 * maxSnowballPosX || playerEntity.entityObject3D.position.x === maxSnowballPosX){
          playerEntity.vel.setX(0);
        }

        if (playerEntity.entityObject3D.position.y === -1 * maxSnowballPosY || playerEntity.entityObject3D.position.y === maxSnowballPosY){
          playerEntity.vel.setY(0);
        }

        // update DOM
        if(!gameStarted && !gameOver){
          setShowStartMessage(true);
          setShowGameOver(false);
        } else if (gameOver){
          setShowStartMessage(false);
          setShowGameOver(true);
        }

        if (resizeRendererToDisplaySize(renderer)) {
          const canvas = renderer.domElement;
          camera.aspect = canvas.clientWidth / canvas.clientHeight;
          camera.updateProjectionMatrix();
        }
      
        renderer.render(scene, camera);
      
        requestAnimationFrame(animate);
        
      }
      
      requestAnimationFrame(animate);

      return () => {
        containerRef.current?.removeChild( renderer.domElement );
        
        // remove event listeners
        window.removeEventListener("keydown", keyDownEventListener);
        window.removeEventListener("keyup", keyUpEventListener);
      }

    } else {
      const warning = WebGL.getWebGLErrorMessage();
      containerRef.current?.appendChild( warning );

      return () => {
        containerRef.current?.removeChild( warning );
      }
    }
  },[])

  return (
      <div ref={containerRef} id="viewport_container">
        <div id="message_container">
          <h1>
            {showStartMessage && "Press Any Key to Begin"}
            {showGameOver && "You Melted!"}
          </h1>
        </div>
      </div>
      
  )
}

export default PrimitivesDemoPage
