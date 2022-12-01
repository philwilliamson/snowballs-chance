import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { MathUtils, Mesh, MeshPhongMaterial, Object3D, Vector2, Vector3, WebGLRenderer } from 'three';
import WebGL from './util/webGlChecker';
import "./App.css"
import OverlayMessage from './components/OverlayMessage';
import IntroMessage from './components/IntroMessage';

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
const fireballSpeed = 0.6;
const fireballSpacing = 40;

const leadingDistance = 500;

const ringNum = 11;
const ringSpacing = fireballNum * fireballSpacing / (ringNum - 1);
const lastRingPosZ = ringSpacing * (ringNum - 1) + leadingDistance;


// FLAGS
let gameLoaded = false;
let gameStarted = false;
let gameOver = false;
let gameWon = false;

// TIMES FOR ANIMATION LOOP
let prevTime: number;

// LOOKUP TARGETS
const iterFireballWorldPos = new Vector3(); // for storing world pos of fireball when detecting collisions
const snowballWorldPos = new Vector3(); // for storing world pos of snowball when detecting collisions
const collidedFireball = new Mesh(); // for storing the fireball that's been collided with


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

function resetGame(){
  gameStarted = false;
  gameOver = false;
  gameWon = false;
  obstacleGroup.position.set(0,0,0);
  const fireballMat = collidedFireball?.material as MeshPhongMaterial;
  fireballMat?.emissive?.setHex(0x660000);
  playerEntity.entityObject3D.position.set(0, 0, 0);
  fireballs.forEach((fireball) => {
    const xPos = Math.random() * (2 * maxFireballPosX) - maxFireballPosX;
    const yPos = Math.random() * (2 * maxFireballPosY) - maxFireballPosY;
    fireball.position.setX(xPos).setY(yPos);
  })

  playMusic.currentTime = 0;
}

function startGame(){
  gameStarted = true;

  // stop intro music

  playMusic.play();

}

function endGame(playerWon = false){
  gameOver = true;
  gameWon = playerWon;
}

function keyDownEventListener(e: KeyboardEvent){

  const downedKey = e.key;
  switch(downedKey) {
    case " ": // spacebar
    if (!gameStarted && gameLoaded){
      startGame();
    } else if (gameOver) {
      resetGame();
    }
    break;
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
const loadManager = new THREE.LoadingManager();
const loader = new THREE.TextureLoader(loadManager);

const bgTexture = loader.load('/textures/sky.jpg');
bgTexture.center.set(.5, .5);
bgTexture.rotation = THREE.MathUtils.degToRad(-90);

const tunnelTexture = loader.load('/textures/solid_lava.png');
const ringTexture = tunnelTexture.clone();

tunnelTexture.wrapS = THREE.RepeatWrapping;
tunnelTexture.wrapT = THREE.RepeatWrapping;
tunnelTexture.repeat.set(4,40);

ringTexture.wrapS = THREE.RepeatWrapping;
ringTexture.repeat.set(3,1);

const fireballTexture = loader.load('/textures/melted_lava.png');
fireballTexture.rotation = THREE.MathUtils.degToRad(90);
fireballTexture.wrapS = THREE.RepeatWrapping;
fireballTexture.wrapT = THREE.RepeatWrapping;
fireballTexture.repeat.set(1,2);
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
    const zPos = -1 * fireballSpacing * idx - leadingDistance;
    const fireballMesh = new THREE.Mesh(
      fireballGeom,
      new THREE.MeshPhongMaterial({
        map: fireballTexture,
        emissive: 0x660000
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
  const ringGeom = new THREE.TorusGeometry(radius, tubeRadius, radialSegments, tubularSegments)
  const ringMat = new THREE.MeshPhongMaterial({
    map: ringTexture,
  })
  for (let idx = 0; idx < ringNum; idx++){
    const zPos = -1 * ringSpacing * idx - 500;
    const ringMesh = new THREE.Mesh(
      ringGeom,
      ringMat
    );
    ringMesh.position.set(0, 0, zPos);
    obstacleGroup.add(ringMesh);
  }  
}

// TUNNEL
{
  const tunnelGeom = new THREE.CylinderGeometry( 200, 200, lastRingPosZ, 32, 1, true );
  const tunnelMat = new THREE.MeshPhongMaterial({
    // color: 0xffff00, 
    map: tunnelTexture,
    side: THREE.BackSide
  });
  const tunnel = new THREE.Mesh( tunnelGeom, tunnelMat );
  tunnel.rotation.x = MathUtils.degToRad(90);
  tunnel.position.z = -1 * lastRingPosZ / 2
  obstacleGroup.add(tunnel);
}

// AUDIO
const fireWhoosh = new Audio('/sounds/fire_whoosh.wav');
fireWhoosh.loop = false;
fireWhoosh.volume = 0.5;

const playMusic = new Audio('/music/HoliznaCC0-DearMrSuperComputer.mp3');
playMusic.volume = 0.2;

// MAIN PAGE
function PrimitivesDemoPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [showStartMessage, setShowStartMessage] = useState(true);
  const [showGameOver, setShowGameOver] = useState(false);
  const [showWinMessage, setShowWinMessage] = useState(false);
  const [showPlayPrompt, setShowPlayPrompt] = useState(false);

  useEffect(() => {
    if ( WebGL.isWebGLAvailable() ) {

      const renderer = new THREE.WebGLRenderer();
      renderer.domElement.id = "renderer_canvas";
      containerRef.current?.appendChild( renderer.domElement );

      window.addEventListener("keydown", keyDownEventListener);
      window.addEventListener("keyup", keyUpEventListener);

      // TEXTURE LOADER CALLBACK

      let playDelay: number;

      loadManager.onLoad = () => {

        if (loadingRef.current) {
          loadingRef.current.style.display = 'none';
        }

        playDelay = setTimeout(()=>{
          gameLoaded = true;
          setShowPlayPrompt(true);
        }, 3000);
      };

      loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
        const progress = itemsLoaded / itemsTotal;
        if (progressBarRef.current) {
          progressBarRef.current.style.transform = `scaleX(${progress})`;
        }
      };

      function animate() {
        // initialize prevTime
        if (!prevTime){ prevTime = new Date().getTime(); }
        
        const elapsed = new Date().getTime() - prevTime;
        prevTime = new Date().getTime();

        if(gameStarted && !gameOver){
          // move fireballs
          obstacleGroup.position.z += fireballSpeed * elapsed;
          // check if player won
          if (obstacleGroup.position.z >= lastRingPosZ){
            endGame(true);
          }

          // spin fireballs and detect collision
          fireballs.forEach((fireball, idx)=>{
            fireball.rotation.z += ((idx % 4) + 1) * 0.002 * elapsed;

            fireball.getWorldPosition(iterFireballWorldPos);
            snowball.getWorldPosition(snowballWorldPos);
            const distance = snowballWorldPos.distanceTo(iterFireballWorldPos);
            if(distance < snowballRadius + fireballRadius){
              fireWhoosh.play();
              const fireballMat = fireball.material as MeshPhongMaterial;
              fireballMat.emissive.setHex(0xff0000);
              collidedFireball.copy(fireball);
              endGame();
            }
          })

          // move player
          playerEntity.entityObject3D.position.add(
            new Vector3(playerEntity.vel.x, playerEntity.vel.y, 0).multiplyScalar(elapsed * 0.15)
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

        // update DOM via React
        setShowStartMessage(false);
        setShowGameOver(false);
        setShowWinMessage(false);
        
        if(!gameStarted){
          setShowStartMessage(true);
        } else if (gameWon) {
          setShowWinMessage(true);
        } else if (gameOver){
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

        // clear timeout
        clearTimeout(playDelay);
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
          {
            showStartMessage ? 
              <OverlayMessage 
                headerString={`Snowball's Chance`}
                promptString={`Press Space Bar to Start`}
                showPrompt={showPlayPrompt}
                messageClassNames={`message game-start`}
              >
                <IntroMessage/>
              </OverlayMessage>
            :
              showWinMessage
              ?
                <OverlayMessage 
                  headerString={`You Escaped!`}
                  promptString={`Press Space Bar to Play Again`}
                  messageClassNames={`message game-won`}
                />
              :
                showGameOver && <OverlayMessage 
                  headerString={`You Melted!`}
                  promptString={`Press Space Bar to Restart`}
                  messageClassNames={`message game-over`}
                />
          }
        </div>
        <div ref={loadingRef} id="loading">
          <h1>Loading...</h1>
          <div className="progress">
            <div className="progressbar"/>
          </div>
        </div>
      </div>
      
  )
}

export default PrimitivesDemoPage
