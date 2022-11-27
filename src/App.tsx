import "./App.css"
import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { BufferGeometry, Material, Mesh, MeshPhongMaterial, Object3D, Vector2, Vector3, WebGLRenderer } from 'three';
import WebGL from './util/webGlChecker';

interface SnowBall {
  entityMesh: Mesh,
  vel: Vector2,
}

// CONSTANTS
const maxSnowballVel = 1.2;
const maxSnowballPosX = 100;
const maxSnowballPosY = 50;

const maxFireballPosX = 100;
const maxFireballPosY = 50;

const snowballRadius = 8;
const fireBallRadius = 8;

// FLAGS
let gameStarted = false;
let collision = false;

// LOOKUP TARGETS
const iterFireballWorldPos = new Vector3(); // for storing world pos of fireball when detecting collisions


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
      if (snowBallEntity.entityMesh.position.y <= maxSnowballPosY) {
        snowBallEntity.vel.setY(maxSnowballVel);
      }
    break;
    case "a":
    case "A":
    case "ArrowLeft":
      if (snowBallEntity.entityMesh.position.x >= -1 * maxSnowballPosX) {
        snowBallEntity.vel.setX(-1*maxSnowballVel);
      }
    break;
    case "s":
    case "S":
    case "ArrowDown":
      if (snowBallEntity.entityMesh.position.y >= -1 * maxSnowballPosY) {
        snowBallEntity.vel.setY(-1*maxSnowballVel);
      }
    break;
    case "d":
    case "D":
    case "ArrowRight":
      if (snowBallEntity.entityMesh.position.x <= maxSnowballPosX) {
        snowBallEntity.vel.setX(1*maxSnowballVel);
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
      if (snowBallEntity.vel.y === maxSnowballVel){
        snowBallEntity.vel.setY(0);
      }
    break;
    case "a":
    case "A":
    case "ArrowLeft":
      if (snowBallEntity.vel.x === -1*maxSnowballVel){
        snowBallEntity.vel.setX(0);
      }
    break;
    case "s":
    case "S":
    case "ArrowDown":
      if (snowBallEntity.vel.y === -1*maxSnowballVel){
        snowBallEntity.vel.setY(0);
      }
    break;
    case "d":
    case "D":
    case "ArrowRight":
      if (snowBallEntity.vel.x === maxSnowballVel){
        snowBallEntity.vel.setX(0);
      }
    break;
  } 
}

const radius = 5;
const widthSegments = 8;
const heightSegments = 8;

// ENTITIES
const snowBallEntity: SnowBall = {
  entityMesh: new THREE.Mesh(
    new THREE.SphereGeometry(radius, widthSegments, heightSegments),
    new THREE.MeshPhongMaterial({
      color: 0xFFFFFF
    })
  ),
  vel: new Vector2,
};

// TEXTURES
const loader = new THREE.TextureLoader();
const bgTexture = loader.load('/textures/sky_dark.jpg');
bgTexture.center.set(.5, .5);
bgTexture.rotation = THREE.MathUtils.degToRad(-90);

const scene = new THREE.Scene();
scene.background = bgTexture;

const fov = 50;
const aspect = 2;  // the canvas default
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
camera.position.z = 150;

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
{
  const widthSegments = 8;
  const heightSegments = 8;
  const snowBallGeom = new THREE.SphereGeometry(snowballRadius, widthSegments, heightSegments);
  const snowBallMat = new THREE.MeshPhongMaterial({
    color: 0xFFFFFF
  });
  const snowBallMesh = new THREE.Mesh(snowBallGeom, snowBallMat);
  scene.add(snowBallMesh)
  snowBallEntity.entityMesh = snowBallMesh;
}

// FIREBALLS

const fireBalls: Mesh[] = [];
const fireBallGroup = new THREE.Object3D();
scene.add(fireBallGroup);

{
  const widthSegments = 8;
  const heightSegments = 8;
  const fireBallGeom = new THREE.SphereGeometry(fireBallRadius, widthSegments, heightSegments);

  for (let idx = 0; idx < 300; idx++){
    const xPos = Math.random() * (2 * maxFireballPosX) - maxFireballPosX;
    const yPos = Math.random() * (2 * maxFireballPosY) - maxFireballPosY;
    const zPos = -30 * idx - 500;
    const fireBallMesh = new THREE.Mesh(
      fireBallGeom,
      new THREE.MeshPhongMaterial({
        color: 0xFF0000
      }));
    fireBallMesh.position.set(xPos, yPos, zPos);
    fireBallGroup.add(fireBallMesh);
    fireBalls.push(fireBallMesh);
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
          fireBallGroup.position.z += 0.2 * elapsed;
        }

        // detect collision
        fireBalls.forEach((fireball)=>{
          fireball.getWorldPosition(iterFireballWorldPos);
          const distance = snowBallEntity.entityMesh.position.distanceTo(iterFireballWorldPos);
          if (distance < snowballRadius + fireBallRadius){
            const fireballMat = fireball.material as MeshPhongMaterial;
            fireballMat.emissive.setHex(0xff0000);
            collision = true;
            setShowCollistionMessage(true);
          }
          if (iterFireballWorldPos.z > 10){
            fireBallGroup.remove(fireball);
          }
        })

        snowBallEntity.entityMesh.position.add(
          new Vector3(snowBallEntity.vel.x, snowBallEntity.vel.y, 0).multiplyScalar(elapsed * 0.06)
        );

        snowBallEntity.entityMesh.position.clamp(new Vector3(-1*maxSnowballPosX, -1*maxSnowballPosY, 0), new Vector3(maxSnowballPosX, maxSnowballPosY, 0));

        // reset vel and acc if snowball is at clamp edge
        if (snowBallEntity.entityMesh.position.x === -1 * maxSnowballPosX || snowBallEntity.entityMesh.position.x === maxSnowballPosX){
          snowBallEntity.vel.setX(0);
        }

        if (snowBallEntity.entityMesh.position.y === -1 * maxSnowballPosY || snowBallEntity.entityMesh.position.y === maxSnowballPosY){
          snowBallEntity.vel.setY(0);
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
