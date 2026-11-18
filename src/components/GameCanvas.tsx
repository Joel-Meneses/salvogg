/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GAME_RULES } from '../game/constants';
import { GameEngine } from '../game/gameEngine';
import { createArenaCourt, createCharacterModel, createFlagModel, createGrenadeMesh } from '../game/models';

interface GameCanvasProps {
  engine: GameEngine;
  cameraMode: 'follow' | 'tactical';
  touchInput: { moveX: number; moveZ: number };
  touchAbilityTriggered: boolean;
  onAbilityTriggerHandled: () => void;
}

// Pre-allocated math objects for zero garbage collection
const _camTarget = new THREE.Vector3();
const _camPos = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _camRight = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);
const _raycaster = new THREE.Raycaster();
const _mouse = new THREE.Vector2();
const _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const _hitPoint = new THREE.Vector3();

export const GameCanvas: React.FC<GameCanvasProps> = ({
  engine,
  cameraMode,
  touchInput,
  touchAbilityTriggered,
  onAbilityTriggerHandled,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  // References to keep mutable state across render loop
  const keyState = useRef<{ [key: string]: boolean }>({});
  const mouseWorldPos = useRef<{ x: number; z: number }>({ x: 0, z: 0 });
  const touchAbilityRef = useRef(touchAbilityTriggered);
  touchAbilityRef.current = touchAbilityTriggered;
  const touchInputRef = useRef(touchInput);
  touchInputRef.current = touchInput;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Detect software WebGL guard
    const isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 2. Initialize Three.js Scene & Renderer
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x38BDF8);
    scene.fog = new THREE.FogExp2(0x38BDF8, 0.015);

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 120);

    const humanInit = engine.getHumanPlayer();
    if (humanInit && humanInit.team === 'blue') {
      camera.position.set(0, 12, -22);
      camera.lookAt(0, 0, 0);
    } else {
      camera.position.set(0, 12, 22);
      camera.lookAt(0, 0, 0);
    }

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    const handleContextLost = (e: Event) => {
      e.preventDefault();
    };
    renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

    // 3. Studio Environment Map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xBAE6FD, 0x166534, 0.8);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xFFFBEB, 1.4);
    dirLight.position.set(14, 25, 14);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 70;
    dirLight.shadow.camera.left = -20;
    dirLight.shadow.camera.right = 20;
    dirLight.shadow.camera.top = 22;
    dirLight.shadow.camera.bottom = -22;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    // 5. Build Arena Court
    const court = createArenaCourt();
    scene.add(court);

    // 6. Character 3D Meshes map
    const characterMeshes = new Map<string, THREE.Group>();
    engine.players.forEach((player) => {
      const mesh = createCharacterModel(player.character, player.team);
      mesh.position.set(player.position.x, 0, player.position.z);
      mesh.rotation.y = player.rotation;
      mesh.userData = { runCycle: 0, walkWeight: 0 };
      scene.add(mesh);
      characterMeshes.set(player.id, mesh);
    });

    // 7. Flag 3D Meshes map
    const flagMeshes = new Map<string, THREE.Group>();
    engine.flags.forEach((flag) => {
      const mesh = createFlagModel(flag.team);
      mesh.position.set(flag.currentPosition.x, 0, flag.currentPosition.z);
      scene.add(mesh);
      flagMeshes.set(flag.id, mesh);
    });

    // 8. Projectile 3D Meshes group
    const projectilesGroup = new THREE.Group();
    scene.add(projectilesGroup);
    const projectileMeshes = new Map<string, THREE.Group>();

    // 8b. Explosion 4m Shockwave Ring group
    const explosionsGroup = new THREE.Group();
    scene.add(explosionsGroup);
    const explosionMeshes = new Map<string, THREE.Mesh>();

    // 8c. Luppy Aim Reticle (4m radius preview on ground)
    const aimRingGeo = new THREE.RingGeometry(GAME_RULES.grenadeRadius - 0.12, GAME_RULES.grenadeRadius, 40);
    aimRingGeo.rotateX(-Math.PI / 2);
    const aimRingMat = new THREE.MeshBasicMaterial({
      color: 0x34D399,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const aimRing = new THREE.Mesh(aimRingGeo, aimRingMat);
    aimRing.position.y = 0.04;
    aimRing.visible = false;
    scene.add(aimRing);

    // 9. Floating Text Billboard Canvas Texture Sprites
    const notificationSprites = new Map<string, THREE.Sprite>();
    const notifsGroup = new THREE.Group();
    scene.add(notifsGroup);

    function createTextSprite(text: string, color: string): THREE.Sprite {
      const canvas = document.createElement('canvas');
      canvas.width = 448;
      canvas.height = 96;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.beginPath();
      ctx.roundRect(8, 8, 432, 80, 20);
      ctx.fill();

      ctx.strokeStyle = color;
      ctx.lineWidth = 4;
      ctx.stroke();

      ctx.font = 'bold 28px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      ctx.fillText(text, 224, 48);

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(4.0, 0.9, 1);
      return sprite;
    }

    // 10. Input Handlers (Keyboard & Mouse)
    const handleKeyDown = (e: KeyboardEvent) => {
      keyState.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keyState.current[e.code] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      _mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      _mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      _raycaster.setFromCamera(_mouse, camera);
      if (_raycaster.ray.intersectPlane(_plane, _hitPoint)) {
        mouseWorldPos.current = { x: _hitPoint.x, z: _hitPoint.z };
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    container.addEventListener('mousemove', handleMouseMove);

    // 11. Resize Observer
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener('resize', handleResize);

    // 12. Software WebGL pacing helper & Main Game Loop
    const clock = new THREE.Clock();
    let frameId = 0;
    let animTime = 0;

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const tick = () => {
      const delta = Math.min(clock.getDelta(), 0.05);
      animTime += delta;

      let screenX = 0;
      let screenY = 0;

      if (keyState.current['KeyW'] || keyState.current['ArrowUp']) screenY += 1;
      if (keyState.current['KeyS'] || keyState.current['ArrowDown']) screenY -= 1;
      if (keyState.current['KeyA'] || keyState.current['ArrowLeft']) screenX -= 1;
      if (keyState.current['KeyD'] || keyState.current['ArrowRight']) screenX += 1;

      screenX += touchInputRef.current.moveX;
      screenY -= touchInputRef.current.moveZ;

      camera.getWorldDirection(_camDir);
      _camDir.y = 0;
      _camDir.normalize();

      _camRight.crossVectors(_up, _camDir).normalize();

      const moveWorldX = -_camRight.x * screenX + _camDir.x * screenY;
      const moveWorldZ = -_camRight.z * screenX + _camDir.z * screenY;

      const useAbility =
        keyState.current['Space'] ||
        keyState.current['KeyE'] ||
        keyState.current['ShiftLeft'] ||
        touchAbilityRef.current;

      if (keyState.current['Space'] || keyState.current['KeyE']) {
        keyState.current['Space'] = false;
        keyState.current['KeyE'] = false;
      }
      if (touchAbilityRef.current) {
        onAbilityTriggerHandled();
      }

      // Update Simulation Engine
      engine.update(delta, {
        moveX: moveWorldX,
        moveZ: moveWorldZ,
        useAbility,
        mouseWorldTarget: mouseWorldPos.current,
      });

      // Update Character 3D Meshes
      engine.players.forEach((player) => {
        const mesh = characterMeshes.get(player.id);
        if (!mesh) return;

        mesh.position.set(player.position.x, 0, player.position.z);

        let angleDiff = player.rotation - mesh.rotation.y;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        mesh.rotation.y += angleDiff * Math.min(1, delta * 15);

        const bodyPivot = mesh.getObjectByName('bodyPivot');
        const leftLeg = mesh.getObjectByName('leftLeg');
        const rightLeg = mesh.getObjectByName('rightLeg');
        const leftArm = mesh.getObjectByName('leftArm');
        const rightArm = mesh.getObjectByName('rightArm');

        const speed = Math.hypot(player.velocity.x, player.velocity.z);
        const targetWalkWeight = speed > 0.3 && !player.isFrozen ? 1 : 0;
        mesh.userData.walkWeight = THREE.MathUtils.damp(mesh.userData.walkWeight, targetWalkWeight, 10, delta);
        const weight = mesh.userData.walkWeight;

        if (weight > 0.01) {
          mesh.userData.runCycle += delta * Math.max(speed, 2.5) * 3.5;
        }
        const runPhase = mesh.userData.runCycle;

        if (leftLeg) leftLeg.rotation.x = Math.sin(runPhase) * 0.5 * weight;
        if (rightLeg) rightLeg.rotation.x = -Math.sin(runPhase) * 0.5 * weight;
        if (leftArm) leftArm.rotation.x = -Math.sin(runPhase) * 0.5 * weight;
        if (rightArm) rightArm.rotation.x = Math.sin(runPhase) * 0.5 * weight;
        if (bodyPivot) {
          bodyPivot.position.y =
            Math.abs(Math.sin(runPhase * 2)) * 0.06 * weight +
            Math.sin(animTime * 2.5) * 0.02 * (1 - weight);
        }

        const iceBlock = mesh.getObjectByName('iceBlock');
        if (iceBlock) iceBlock.visible = player.isFrozen;

        const shieldDome = mesh.getObjectByName('shieldDome');
        if (shieldDome) {
          shieldDome.visible = player.isShieldActive;
          if (player.isShieldActive) {
            shieldDome.rotation.y += delta * 2.5;
            shieldDome.rotation.x += delta * 1.2;
          }
        }
      });

      // Update Luppy Aim Reticle (4m tactical preview)
      const human = engine.getHumanPlayer();
      if (human && human.character === 'luppy' && !human.isFrozen && engine.isMatchActive) {
        const dx = mouseWorldPos.current.x - human.position.x;
        const dz = mouseWorldPos.current.z - human.position.z;
        const d = Math.hypot(dx, dz);
        const clamped = Math.min(d, GAME_RULES.grenadeMaxRange);
        const aimX = human.position.x + (dx / (d || 1)) * clamped;
        const aimZ = human.position.z + (dz / (d || 1)) * clamped;

        aimRing.position.set(aimX, 0.04, aimZ);
        aimRing.visible = human.abilityCooldown <= 0;

        // Turn amber if a frozen enemy is inside the 4m blast area!
        const enemyAtRisk = engine.players.some(
          (p) =>
            p.team !== human.team &&
            p.isFrozen &&
            Math.hypot(p.position.x - aimX, p.position.z - aimZ) <= GAME_RULES.grenadeRadius
        );
        aimRingMat.color.setHex(enemyAtRisk ? 0xF59E0B : 0x34D399);
      } else {
        aimRing.visible = false;
      }

      // Update Flag 3D Meshes & Cloth Ripple
      engine.flags.forEach((flag) => {
        const mesh = flagMeshes.get(flag.id);
        if (!mesh) return;

        if (flag.isCaptured) {
          mesh.visible = false;
        } else {
          mesh.visible = true;
          mesh.position.set(flag.currentPosition.x, flag.currentPosition.y || 0, flag.currentPosition.z);

          const banner = mesh.getObjectByName('bannerCloth');
          if (banner) {
            banner.rotation.y = Math.sin(animTime * 6 + flag.basePosition.x) * 0.25;
            banner.rotation.z = Math.cos(animTime * 4) * 0.08;
          }
        }
      });

      // Update Projectiles
      const currentProjIds = new Set(engine.projectiles.map((p) => p.id));
      for (const [id, mesh] of projectileMeshes.entries()) {
        if (!currentProjIds.has(id)) {
          projectilesGroup.remove(mesh);
          projectileMeshes.delete(id);
        }
      }
      engine.projectiles.forEach((proj) => {
        let pMesh = projectileMeshes.get(proj.id);
        if (!pMesh) {
          pMesh = createGrenadeMesh();
          projectilesGroup.add(pMesh);
          projectileMeshes.set(proj.id, pMesh);
        }
        pMesh.position.set(proj.position.x, proj.position.y, proj.position.z);
        pMesh.rotation.x += delta * 12;
        pMesh.rotation.y += delta * 8;
      });

      // Update 4m Explosion Shockwave Rings
      const currentExpIds = new Set(engine.explosions.map((e) => e.id));
      for (const [id, mesh] of explosionMeshes.entries()) {
        if (!currentExpIds.has(id)) {
          explosionsGroup.remove(mesh);
          mesh.geometry.dispose();
          (mesh.material as THREE.Material).dispose();
          explosionMeshes.delete(id);
        }
      }
      engine.explosions.forEach((exp) => {
        let eMesh = explosionMeshes.get(exp.id);
        if (!eMesh) {
          const ringGeo = new THREE.RingGeometry(0.65, 1.0, 40);
          ringGeo.rotateX(-Math.PI / 2);
          const ringMat = new THREE.MeshBasicMaterial({
            color: exp.color,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide,
            depthWrite: false,
          });
          eMesh = new THREE.Mesh(ringGeo, ringMat);
          eMesh.position.set(exp.position.x, 0.06, exp.position.z);
          explosionsGroup.add(eMesh);
          explosionMeshes.set(exp.id, eMesh);
        }
        const progress = Math.min(1, exp.life / exp.maxLife);
        const scale = exp.radius * (0.35 + 0.65 * progress);
        eMesh.scale.set(scale, 1, scale);
        (eMesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.85 * (1 - progress));
      });

      // Update 3D Floating Notification Billboards
      const currentNotifIds = new Set(engine.notifications.map((n) => n.id));
      for (const [id, sprite] of notificationSprites.entries()) {
        if (!currentNotifIds.has(id)) {
          notifsGroup.remove(sprite);
          sprite.material.map?.dispose();
          sprite.material.dispose();
          notificationSprites.delete(id);
        }
      }
      engine.notifications.forEach((notif) => {
        let sprite = notificationSprites.get(notif.id);
        if (!sprite) {
          sprite = createTextSprite(notif.text, notif.color);
          notifsGroup.add(sprite);
          notificationSprites.set(notif.id, sprite);
        }
        sprite.position.set(notif.position.x, notif.position.y + 1.2, notif.position.z);
        const progress = notif.life / notif.maxLife;
        sprite.material.opacity = Math.max(0, 1 - progress * progress);
      });

      // Smooth Camera Choreography
      if (cameraMode === 'follow' && human) {
        _camTarget.set(human.position.x, 0.8, human.position.z);
        const camDist = 14;
        const camHeight = 11;
        const zOffset = human.team === 'blue' ? -camDist : camDist;
        _camPos.set(human.position.x * 0.4, camHeight, human.position.z + zOffset);

        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camPos.x, 4.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camPos.y, 4.5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camPos.z, 4.5, delta);
        camera.lookAt(_camTarget);
      } else {
        const isBlue = engine.userSelectedTeam === 'blue';
        _camPos.set(0, 26, isBlue ? -17 : 17);
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _camPos.x, 3.5, delta);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _camPos.y, 3.5, delta);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _camPos.z, 3.5, delta);
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
      if (isSoftwareGl) afterDraw(tick);
      else frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);

      characterMeshes.forEach((mesh) => scene.remove(mesh));
      flagMeshes.forEach((mesh) => scene.remove(mesh));
      explosionMeshes.forEach((mesh) => {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      });
      aimRing.geometry.dispose();
      aimRingMat.dispose();
      scene.remove(court);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [engine, cameraMode, onAbilityTriggerHandled]);

  return <div ref={mountRef} className="w-full h-full relative cursor-crosshair overflow-hidden" />;
};
