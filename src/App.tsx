import "./App.css"
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { BufferGeometry, Mesh, Object3D, Vector2, Vector3, WebGLRenderer } from 'three';
import WebGL from './util/webGlChecker';

const maxVel = 1;

// INTERFACES
interface SnowBall {
  entityMesh: Mesh,
  vel: Vector2,
}

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
  const downedKey = e.key;
  switch(downedKey) {
    case "w":
    case "W":
    case "ArrowUp":
      if (snowBallEntity.entityMesh.position.y <= 30) {
        snowBallEntity.vel.setY(maxVel);
      }
    break;
    case "a":
    case "A":
    case "ArrowLeft":
      if (snowBallEntity.entityMesh.position.x >= -50) {
        snowBallEntity.vel.setX(-1*maxVel);
      }
    break;
    case "s":
    case "S":
    case "ArrowDown":
      if (snowBallEntity.entityMesh.position.y >= -30) {
        snowBallEntity.vel.setY(-1*maxVel);
      }
    break;
    case "d":
    case "D":
    case "ArrowRight":
      if (snowBallEntity.entityMesh.position.x <= 50) {
        snowBallEntity.vel.setX(1*maxVel);
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
      if (snowBallEntity.vel.y === maxVel){
        snowBallEntity.vel.setY(0);
      }
    break;
    case "a":
    case "A":
    case "ArrowLeft":
      if (snowBallEntity.vel.x === -1*maxVel){
        snowBallEntity.vel.setX(0);
      }
    break;
    case "s":
    case "S":
    case "ArrowDown":
      if (snowBallEntity.vel.y === -1*maxVel){
        snowBallEntity.vel.setY(0);
      }
    break;
    case "d":
    case "D":
    case "ArrowRight":
      if (snowBallEntity.vel.x === maxVel){
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

const fov = 40;
const aspect = 2;  // the canvas default
const near = 0.1;
const far = 1000;
const camera = new THREE.PerspectiveCamera( fov, aspect, near, far );
camera.position.z = 100;

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


// ADD GEOMETRIES
{
  const radius = 5;
  const widthSegments = 8;
  const heightSegments = 8;
  const snowBallGeom = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
  const snowBallMat = new THREE.MeshPhongMaterial({
    color: 0xFFFFFF
  });
  const snowBallMesh = new THREE.Mesh(snowBallGeom, snowBallMat);
  scene.add(snowBallMesh)
  snowBallEntity.entityMesh = snowBallMesh;
  snowBallEntity.vel = new Vector2;
}

// MAIN PAGE
function PrimitivesDemoPage() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if ( WebGL.isWebGLAvailable() ) {

      const renderer = new THREE.WebGLRenderer();
      renderer.domElement.id = "renderer_canvas";
      containerRef.current?.appendChild( renderer.domElement );

      // add event listeners
      window.addEventListener("keydown", keyDownEventListener);
      window.addEventListener("keyup", keyUpEventListener);

      let previousTimestamp = 0;
      
      function animate(time: number) {

        const elapsed = time - previousTimestamp;
        previousTimestamp = time;

        snowBallEntity.entityMesh.position.add(
          new Vector3(snowBallEntity.vel.x, snowBallEntity.vel.y, 0).multiplyScalar(elapsed * 0.06)
        );

        snowBallEntity.entityMesh.position.clamp(new Vector3(-50, -30, 0), new Vector3(50, 30, 0));

        // reset vel and acc if snowball is at clamp edge
        if (snowBallEntity.entityMesh.position.x === -50 || snowBallEntity.entityMesh.position.x === 50){
          snowBallEntity.vel.setX(0);
        }

        if (snowBallEntity.entityMesh.position.y === -30 || snowBallEntity.entityMesh.position.y === 30){
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
    <div ref={containerRef} id="canvas_container"></div>
  )
}

export default PrimitivesDemoPage
