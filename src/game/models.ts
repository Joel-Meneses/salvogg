/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import { CharacterType, Team } from '../types/game';
import { ARENA_OBSTACLES } from './constants';

// Shared materials and geometries for high performance and zero memory leaks
const pbrCache = {
  blueUniform: new THREE.MeshStandardMaterial({ color: 0x2563EB, roughness: 0.4, metalness: 0.1 }),
  redUniform: new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.4, metalness: 0.1 }),
  skinTone: new THREE.MeshStandardMaterial({ color: 0xF6D8AE, roughness: 0.7, metalness: 0.0 }),
  darkGray: new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.6, metalness: 0.2 }),
  goldMetal: new THREE.MeshStandardMaterial({ color: 0xF59E0B, roughness: 0.25, metalness: 0.85 }),
  silverMetal: new THREE.MeshStandardMaterial({ color: 0x94A3B8, roughness: 0.3, metalness: 0.7 }),
  cyanGlow: new THREE.MeshStandardMaterial({ color: 0x06B6D4, emissive: 0x0891B2, emissiveIntensity: 0.6, roughness: 0.2 }),
  purpleVest: new THREE.MeshStandardMaterial({ color: 0x7C3AED, roughness: 0.5, metalness: 0.1 }),
  whiteTrim: new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.3, metalness: 0.1 }),
  shadowMat: new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 }),
};

/**
 * Creates a procedural 3-12 part stylized cartoon character model for SALVO!
 */
export function createCharacterModel(character: CharacterType, team: Team): THREE.Group {
  const root = new THREE.Group();
  root.name = `character_${character}_${team}`;

  const teamMat = team === 'blue' ? pbrCache.blueUniform : pbrCache.redUniform;
  const teamColorHex = team === 'blue' ? 0x3B82F6 : 0xEF4444;

  // 1. Soft Ground Contact Shadow
  const shadowGeo = new THREE.CircleGeometry(0.55, 16);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMesh = new THREE.Mesh(shadowGeo, pbrCache.shadowMat);
  shadowMesh.position.y = 0.02;
  root.add(shadowMesh);

  // 2. Character Body Container (pivot at bottom-center)
  const bodyGroup = new THREE.Group();
  bodyGroup.name = 'bodyPivot';
  root.add(bodyGroup);

  // Torso (rounded barrel chest)
  const torsoGeo = new THREE.CylinderGeometry(0.38, 0.32, 0.75, 12);
  const torso = new THREE.Mesh(torsoGeo, teamMat);
  torso.position.y = 0.85;
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyGroup.add(torso);

  // Belt / waist band
  const beltGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.1, 12);
  const belt = new THREE.Mesh(beltGeo, pbrCache.darkGray);
  belt.position.y = 0.52;
  bodyGroup.add(belt);

  // Head
  const headGeo = new THREE.SphereGeometry(0.32, 16, 12);
  const head = new THREE.Mesh(headGeo, pbrCache.skinTone);
  head.position.y = 1.4;
  head.castShadow = true;
  bodyGroup.add(head);

  // Cartoon stylized eyes
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0F172A });
  const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });

  const leftEyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeWhiteMat);
  leftEyeWhite.position.set(-0.11, 1.44, 0.28);
  bodyGroup.add(leftEyeWhite);

  const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
  leftPupil.position.set(-0.11, 1.44, 0.34);
  bodyGroup.add(leftPupil);

  const rightEyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), eyeWhiteMat);
  rightEyeWhite.position.set(0.11, 1.44, 0.28);
  bodyGroup.add(rightEyeWhite);

  const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 6, 6), eyeMat);
  rightPupil.position.set(0.11, 1.44, 0.34);
  bodyGroup.add(rightPupil);

  // Legs & Feet
  const legGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.45, 8);
  const leftLeg = new THREE.Mesh(legGeo, pbrCache.darkGray);
  leftLeg.position.set(-0.18, 0.25, 0);
  leftLeg.castShadow = true;
  leftLeg.name = 'leftLeg';
  bodyGroup.add(leftLeg);

  const rightLeg = new THREE.Mesh(legGeo, pbrCache.darkGray);
  rightLeg.position.set(0.18, 0.25, 0);
  rightLeg.castShadow = true;
  rightLeg.name = 'rightLeg';
  bodyGroup.add(rightLeg);

  // Shoes / boots
  const shoeGeo = new THREE.BoxGeometry(0.2, 0.12, 0.28);
  const leftShoe = new THREE.Mesh(shoeGeo, pbrCache.whiteTrim);
  leftShoe.position.set(-0.18, 0.06, 0.05);
  bodyGroup.add(leftShoe);

  const rightShoe = new THREE.Mesh(shoeGeo, pbrCache.whiteTrim);
  rightShoe.position.set(0.18, 0.06, 0.05);
  bodyGroup.add(rightShoe);

  // Arms
  const armGeo = new THREE.CylinderGeometry(0.09, 0.08, 0.48, 8);
  const leftArm = new THREE.Mesh(armGeo, teamMat);
  leftArm.position.set(-0.44, 0.85, 0);
  leftArm.name = 'leftArm';
  leftArm.castShadow = true;
  bodyGroup.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, teamMat);
  rightArm.position.set(0.44, 0.85, 0);
  rightArm.name = 'rightArm';
  rightArm.castShadow = true;
  bodyGroup.add(rightArm);

  // 3. Unique Character Features & Silhouettes
  if (character === 'bobby') {
    // Bobby - Knight / Defender helmet & Big Shield
    const helmetGeo = new THREE.CylinderGeometry(0.34, 0.36, 0.3, 12);
    const helmet = new THREE.Mesh(helmetGeo, pbrCache.silverMetal);
    helmet.position.y = 1.52;
    bodyGroup.add(helmet);

    // Helmet Crest / Plume
    const plumeGeo = new THREE.BoxGeometry(0.06, 0.16, 0.4);
    const plumeMat = new THREE.MeshStandardMaterial({ color: teamColorHex, roughness: 0.3 });
    const plume = new THREE.Mesh(plumeGeo, plumeMat);
    plume.position.set(0, 1.7, 0);
    bodyGroup.add(plume);

    // Bobby's Iconic Shield on Left Arm
    const shieldGroup = new THREE.Group();
    shieldGroup.name = 'bobbyShield';
    shieldGroup.position.set(-0.48, 0.85, 0.22);
    shieldGroup.rotation.y = Math.PI / 6;

    const shieldBodyGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.08, 16);
    shieldBodyGeo.rotateX(Math.PI / 2);
    const shieldPlate = new THREE.Mesh(shieldBodyGeo, pbrCache.goldMetal);
    shieldPlate.castShadow = true;
    shieldGroup.add(shieldPlate);

    const shieldBossGeo = new THREE.SphereGeometry(0.12, 10, 8);
    const shieldBoss = new THREE.Mesh(shieldBossGeo, pbrCache.silverMetal);
    shieldBoss.position.z = 0.05;
    shieldGroup.add(shieldBoss);

    bodyGroup.add(shieldGroup);
  } else if (character === 'silver') {
    // Silver - Aerodynamic Visor Goggles & Streamlined Headset
    const visorGeo = new THREE.BoxGeometry(0.44, 0.12, 0.2);
    const visor = new THREE.Mesh(visorGeo, pbrCache.cyanGlow);
    visor.position.set(0, 1.45, 0.22);
    bodyGroup.add(visor);

    // Streamline winglets on ears
    const wingGeo = new THREE.ConeGeometry(0.08, 0.35, 4);
    wingGeo.rotateZ(Math.PI / 4);
    const leftWing = new THREE.Mesh(wingGeo, pbrCache.cyanGlow);
    leftWing.position.set(-0.35, 1.48, -0.05);
    bodyGroup.add(leftWing);

    const rightWing = leftWing.clone();
    rightWing.rotation.z = -Math.PI / 4;
    rightWing.position.x = 0.35;
    bodyGroup.add(rightWing);

    // Neon Speed Stripes on torso
    const stripeGeo = new THREE.BoxGeometry(0.06, 0.65, 0.04);
    const leftStripe = new THREE.Mesh(stripeGeo, pbrCache.cyanGlow);
    leftStripe.position.set(-0.16, 0.85, 0.33);
    bodyGroup.add(leftStripe);

    const rightStripe = leftStripe.clone();
    rightStripe.position.x = 0.16;
    bodyGroup.add(rightStripe);
  } else if (character === 'luppy') {
    // Luppy - Tactical Field Cap & Defrost Flasks
    const capGeo = new THREE.CylinderGeometry(0.34, 0.36, 0.12, 12);
    const cap = new THREE.Mesh(capGeo, pbrCache.purpleVest);
    cap.position.y = 1.62;
    bodyGroup.add(cap);

    const visorBillGeo = new THREE.BoxGeometry(0.36, 0.04, 0.22);
    const visorBill = new THREE.Mesh(visorBillGeo, pbrCache.darkGray);
    visorBill.position.set(0, 1.58, 0.28);
    bodyGroup.add(visorBill);

    // Alchemist ice flask strapped to hip
    const flaskGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.28, 8);
    const flaskMat = new THREE.MeshStandardMaterial({
      color: 0x38BDF8,
      emissive: 0x0284C7,
      emissiveIntensity: 0.5,
      roughness: 0.1,
      metalness: 0.1,
    });
    const flask = new THREE.Mesh(flaskGeo, flaskMat);
    flask.position.set(0.38, 0.55, 0.12);
    flask.rotation.z = -0.2;
    bodyGroup.add(flask);

    // Grenade in right hand ready to throw
    const grenadeProp = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), flaskMat);
    grenadeProp.name = 'handGrenade';
    grenadeProp.position.set(0.48, 0.65, 0.2);
    bodyGroup.add(grenadeProp);
  }

  // 4. Carried Flag Socket (invisible when no flag is carried)
  const carriedFlagSocket = new THREE.Group();
  carriedFlagSocket.name = 'carriedFlagSocket';
  carriedFlagSocket.position.set(0, 1.1, -0.32);
  carriedFlagSocket.visible = false;
  bodyGroup.add(carriedFlagSocket);

  // 5. Active Shield Dome (for Bobby)
  const shieldDomeGeo = new THREE.SphereGeometry(1.0, 16, 12);
  const shieldDomeMat = new THREE.MeshStandardMaterial({
    color: 0xFBBF24,
    emissive: 0xF59E0B,
    emissiveIntensity: 0.7,
    transparent: true,
    opacity: 0.38,
    roughness: 0.1,
    metalness: 0.3,
    wireframe: true,
  });
  const shieldDome = new THREE.Mesh(shieldDomeGeo, shieldDomeMat);
  shieldDome.name = 'shieldDome';
  shieldDome.position.y = 0.9;
  shieldDome.visible = false;
  root.add(shieldDome);

  // 6. Frozen Ice Cube Enclosure (for frozen state)
  const iceGroup = new THREE.Group();
  iceGroup.name = 'iceBlock';
  iceGroup.visible = false;

  const iceCubeGeo = new THREE.BoxGeometry(1.3, 1.9, 1.3);
  const iceMat = new THREE.MeshPhysicalMaterial({
    color: 0xBAE6FD,
    transmission: 0.85,
    roughness: 0.15,
    metalness: 0.1,
    transparent: true,
    opacity: 0.75,
    ior: 1.31,
  });
  const iceCube = new THREE.Mesh(iceCubeGeo, iceMat);
  iceCube.position.y = 0.95;
  iceGroup.add(iceCube);

  // Spiky ice crystals on top
  const spikeGeo = new THREE.ConeGeometry(0.2, 0.5, 5);
  for (let i = 0; i < 4; i++) {
    const spike = new THREE.Mesh(spikeGeo, iceMat);
    spike.position.set(
      (Math.random() - 0.5) * 0.8,
      1.9 + Math.random() * 0.1,
      (Math.random() - 0.5) * 0.8
    );
    spike.rotation.x = (Math.random() - 0.5) * 0.4;
    spike.rotation.z = (Math.random() - 0.5) * 0.4;
    iceGroup.add(spike);
  }
  root.add(iceGroup);

  return root;
}

/**
 * Creates a stylized 3D Flag with pedestal, pole, finial, and team banner
 */
export function createFlagModel(team: Team): THREE.Group {
  const root = new THREE.Group();
  root.name = `flag_${team}`;

  const teamColor = team === 'blue' ? 0x2563EB : 0xDC2626;
  const teamEmissive = team === 'blue' ? 0x1D4ED8 : 0xB91C1C;

  // 1. Pedestal Base
  const baseGeo = new THREE.CylinderGeometry(0.7, 0.85, 0.25, 16);
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.7,
    metalness: 0.2,
  });
  const base = new THREE.Mesh(baseGeo, baseMat);
  base.position.y = 0.125;
  base.receiveShadow = true;
  root.add(base);

  // Ring glow on base
  const ringGeo = new THREE.TorusGeometry(0.72, 0.05, 8, 24);
  ringGeo.rotateX(Math.PI / 2);
  const ringMat = new THREE.MeshStandardMaterial({
    color: teamColor,
    emissive: teamEmissive,
    emissiveIntensity: 0.8,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.position.y = 0.25;
  root.add(ring);

  // 2. Brass Pole
  const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.6, 10);
  const poleMat = new THREE.MeshStandardMaterial({
    color: 0xE2E8F0,
    roughness: 0.2,
    metalness: 0.8,
  });
  const pole = new THREE.Mesh(poleGeo, poleMat);
  pole.position.y = 1.35;
  pole.castShadow = true;
  root.add(pole);

  // Pole Finial Ball
  const finialGeo = new THREE.SphereGeometry(0.14, 12, 10);
  const finialMat = new THREE.MeshStandardMaterial({
    color: 0xF59E0B,
    roughness: 0.2,
    metalness: 0.9,
  });
  const finial = new THREE.Mesh(finialGeo, finialMat);
  finial.position.y = 2.65;
  root.add(finial);

  // 3. Flag Cloth Banner
  const bannerGeo = new THREE.PlaneGeometry(1.3, 0.8, 8, 4);
  const bannerMat = new THREE.MeshStandardMaterial({
    color: teamColor,
    emissive: teamEmissive,
    emissiveIntensity: 0.35,
    roughness: 0.6,
    side: THREE.DoubleSide,
  });
  const banner = new THREE.Mesh(bannerGeo, bannerMat);
  banner.name = 'bannerCloth';
  banner.position.set(0.68, 2.1, 0);
  banner.castShadow = true;
  root.add(banner);

  return root;
}

/**
 * Creates the 3D Arena Court (Campo de Barra-Bandeira)
 */
export function createArenaCourt(): THREE.Group {
  const court = new THREE.Group();
  court.name = 'arena_court';

  // 1. Main grass terrain
  const grassGeo = new THREE.PlaneGeometry(36, 46);
  grassGeo.rotateX(-Math.PI / 2);
  const grassMat = new THREE.MeshStandardMaterial({
    color: 0x2E7D32, // rich cartoon turf
    roughness: 0.85,
    metalness: 0.05,
  });
  const grass = new THREE.Mesh(grassGeo, grassMat);
  grass.receiveShadow = true;
  court.add(grass);

  // 2. Playable Field Bounds: Blue Territory (Z < 0) and Red Territory (Z > 0)
  const fieldWidth = 26;
  const fieldLength = 36;
  const halfLength = fieldLength / 2; // 18

  // Blue Zone tint overlay
  const blueZoneGeo = new THREE.PlaneGeometry(fieldWidth, halfLength);
  blueZoneGeo.rotateX(-Math.PI / 2);
  const blueZoneMat = new THREE.MeshStandardMaterial({
    color: 0x1E3A8A,
    transparent: true,
    opacity: 0.28,
    roughness: 0.8,
  });
  const blueZone = new THREE.Mesh(blueZoneGeo, blueZoneMat);
  blueZone.position.set(0, 0.01, -halfLength / 2);
  blueZone.receiveShadow = true;
  court.add(blueZone);

  // Red Zone tint overlay
  const redZoneGeo = new THREE.PlaneGeometry(fieldWidth, halfLength);
  redZoneGeo.rotateX(-Math.PI / 2);
  const redZoneMat = new THREE.MeshStandardMaterial({
    color: 0x881337,
    transparent: true,
    opacity: 0.28,
    roughness: 0.8,
  });
  const redZone = new THREE.Mesh(redZoneGeo, redZoneMat);
  redZone.position.set(0, 0.01, halfLength / 2);
  redZone.receiveShadow = true;
  court.add(redZone);

  // 3. Dividing Center Line (A Linha da Barra-Bandeira!)
  const centerLineGeo = new THREE.PlaneGeometry(fieldWidth, 0.35);
  centerLineGeo.rotateX(-Math.PI / 2);
  const centerLineMat = new THREE.MeshStandardMaterial({
    color: 0xF8FAFC,
    emissive: 0xE2E8F0,
    emissiveIntensity: 0.3,
    roughness: 0.4,
  });
  const centerLine = new THREE.Mesh(centerLineGeo, centerLineMat);
  centerLine.position.set(0, 0.02, 0);
  court.add(centerLine);

  // Center Circle
  const centerCircleGeo = new THREE.RingGeometry(3.2, 3.45, 32);
  centerCircleGeo.rotateX(-Math.PI / 2);
  const centerCircle = new THREE.Mesh(centerCircleGeo, centerLineMat);
  centerCircle.position.set(0, 0.02, 0);
  court.add(centerCircle);

  // Outer Border Lines
  const borderLineMat = new THREE.MeshStandardMaterial({ color: 0xF8FAFC, roughness: 0.4 });
  const hBorderGeo = new THREE.PlaneGeometry(fieldWidth, 0.25);
  hBorderGeo.rotateX(-Math.PI / 2);

  const topBorder = new THREE.Mesh(hBorderGeo, borderLineMat);
  topBorder.position.set(0, 0.02, -halfLength);
  court.add(topBorder);

  const bottomBorder = new THREE.Mesh(hBorderGeo, borderLineMat);
  bottomBorder.position.set(0, 0.02, halfLength);
  court.add(bottomBorder);

  const vBorderGeo = new THREE.PlaneGeometry(0.25, fieldLength);
  vBorderGeo.rotateX(-Math.PI / 2);

  const leftBorder = new THREE.Mesh(vBorderGeo, borderLineMat);
  leftBorder.position.set(-fieldWidth / 2, 0.02, 0);
  court.add(leftBorder);

  const rightBorder = new THREE.Mesh(vBorderGeo, borderLineMat);
  rightBorder.position.set(fieldWidth / 2, 0.02, 0);
  court.add(rightBorder);

  // 4. Strategic Obstacles & Covers (Wooden Crates & Stone Blocks)
  const crateMat = new THREE.MeshStandardMaterial({ color: 0xB45309, roughness: 0.8, metalness: 0.1 });
  const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.85, metalness: 0.2 });

  ARENA_OBSTACLES.forEach((obs) => {
    const isCrate = obs.type === 'crate';
    const geo = isCrate ? new THREE.BoxGeometry(obs.size, 1.4, obs.size) : new THREE.CylinderGeometry(obs.size * 0.9, obs.size, 1.3, 12);
    const mesh = new THREE.Mesh(geo, isCrate ? crateMat : stoneMat);
    mesh.position.set(obs.x, 0.7, obs.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    court.add(mesh);
  });

  // 5. Stylized Cartoon Perimeter Trees
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x78350F, roughness: 0.9 });
  const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803D, roughness: 0.7 });

  for (let z = -20; z <= 20; z += 5) {
    [-15, 15].forEach((x) => {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1.8, 8), trunkMat);
      trunk.position.y = 0.9;
      tree.add(trunk);

      const fol1 = new THREE.Mesh(new THREE.ConeGeometry(1.4, 2.2, 8), foliageMat);
      fol1.position.y = 2.4;
      fol1.castShadow = true;
      tree.add(fol1);

      const fol2 = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.8, 8), foliageMat);
      fol2.position.y = 3.3;
      fol2.castShadow = true;
      tree.add(fol2);

      tree.position.set(x + (Math.random() - 0.5) * 1.5, 0, z + (Math.random() - 0.5) * 1.5);
      court.add(tree);
    });
  }

  return court;
}

/**
 * Creates an Ice Grenade 3D Mesh
 */
export function createGrenadeMesh(): THREE.Group {
  const root = new THREE.Group();
  const sphereGeo = new THREE.SphereGeometry(0.24, 12, 12);
  const sphereMat = new THREE.MeshStandardMaterial({
    color: 0x38BDF8,
    emissive: 0x0284C7,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.3,
  });
  const sphere = new THREE.Mesh(sphereGeo, sphereMat);
  root.add(sphere);

  const ringGeo = new THREE.TorusGeometry(0.28, 0.04, 6, 16);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xE0F2FE });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  root.add(ring);

  return root;
}
