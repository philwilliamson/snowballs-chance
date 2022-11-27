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
const maxSnowballVel = 2;
const maxSnowballPosX = 200;
const maxSnowballPosY = 200;

const maxFireballPosX = 250;
const maxFireballPosY = 250;

const snowballRadius = 4;
const fireballRadius = 50;

// FLAGS
let gameStarted = false;
let collision = false;

// LOOKUP TARGETS
const iterFireballWorldPos = new Vector3(); // for storing world pos of fireball when detecting collisions
const snowballWorldPos = new Vector3(); // for storing world pos of snowball when detecting collisions


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
const far = 1000;
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
const fireballGroup = new THREE.Object3D();
scene.add(fireballGroup);

{
  const widthSegments = 8;
  const heightSegments = 8;
  const fireballGeom = new THREE.SphereGeometry(fireballRadius, widthSegments, heightSegments);

  for (let idx = 0; idx < 300; idx++){
    const xPos = Math.random() * (2 * maxFireballPosX) - maxFireballPosX;
    const yPos = Math.random() * (2 * maxFireballPosY) - maxFireballPosY;
    const zPos = -30 * idx - 500;
    const fireballMesh = new THREE.Mesh(
      fireballGeom,
      new THREE.MeshPhongMaterial({
        color: 0xFF0000
      }));
    fireballMesh.position.set(xPos, yPos, zPos);
    fireballGroup.add(fireballMesh);
    fireballs.push(fireballMesh);
  }

  
}

// MAIN PAGE
function PrimitivesDemoPage() {
  const containerRef = useRef<HTMLDivElement>(null)

  const [anyKeyPressed, setAnyKeyPressed] = useState(false);
  const [showCollisionMessage, setShowCollistionMessage] = useState(false);

  useEffect(() => {
    if ( WebGL.isWebGLAvailable() ) {

      const renderer = new THREE.WebGLRenderer();
      renderer.domElement.id = "renderer_canvas";
      containerRef.current?.appendChild( renderer.domElement );

      // add event listeners affecting threejs scene
      window.addEventListener("keydown", keyDownEventListener);
      window.addEventListener("keyup", keyUpEventListener);

      // add event listeners for affecting React DOM
      window.addEventListener("keydown", () => {
        setAnyKeyPressed(true);
      });

      let previousTimestamp = 0;
      
      function animate(time: number) {

        const elapsed = time - previousTimestamp;
        previousTimestamp = time;

        // move fireballs
        if(gameStarted && !collision){
          fireballGroup.position.z += 0.2 * elapsed;
        }

        // detect collision
        fireballs.forEach((fireball)=>{
          fireball.getWorldPosition(iterFireballWorldPos);
          snowball.getWorldPosition(snowballWorldPos);
          const distance = snowballWorldPos.distanceTo(iterFireballWorldPos);
          // const fireballIsAhead = 
          if(distance < snowballRadius + fireballRadius){
            const fireballMat = fireball.material as MeshPhongMaterial;
            fireballMat.emissive.setHex(0xff0000);
            collision = true;
            setShowCollistionMessage(true);
          }
          if (iterFireballWorldPos.z > 10){
            fireballGroup.remove(fireball);
          }
        })

        playerEntity.entityObject3D.position.add(
          new Vector3(playerEntity.vel.x, playerEntity.vel.y, 0).multiplyScalar(elapsed * 0.06)
        );

        playerEntity.entityObject3D.position.clamp(new Vector3(-1*maxSnowballPosX, -1*maxSnowballPosY, 0), new Vector3(maxSnowballPosX, maxSnowballPosY, 0));

        // reset vel and acc if snowball is at clamp edge
        if (playerEntity.entityObject3D.position.x === -1 * maxSnowballPosX || playerEntity.entityObject3D.position.x === maxSnowballPosX){
          playerEntity.vel.setX(0);
        }

        if (playerEntity.entityObject3D.position.y === -1 * maxSnowballPosY || playerEntity.entityObject3D.position.y === maxSnowballPosY){
          playerEntity.vel.setY(0);
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
        window.removeEventListener("keydown", () => {
          setAnyKeyPressed(true);
        });
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
            {anyKeyPressed || "Press Any Key to Begin"}
            {showCollisionMessage && "You Melted!"}
          </h1>
        </div>
      </div>
      
  )
}

export default PrimitivesDemoPage
