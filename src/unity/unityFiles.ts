/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import JSZip from 'jszip';

export interface UnityFileEntry {
  path: string;
  content: string;
  description: string;
}

export const UNITY_PROJECT_FILES: UnityFileEntry[] = [
  {
    path: 'Assets/Scripts/Core/GameTypes.cs',
    description: 'Enums de Equipe, Personagens (Bobby, Silver, Luppy) e constantes do MVP',
    content: `using System;

namespace BarraBandeira
{
    public enum TeamType
    {
        Blue,
        Red
    }

    public enum CharacterRole
    {
        Bobby,  // Escudeiro: imune a toque por 6s
        Silver, // Velocista: dash de 5m para frente
        Luppy   // Suporte: granada descongelante de 4m
    }

    public static class GameConfig
    {
        public static TeamType SelectedHumanTeam = TeamType.Blue;
        public static CharacterRole SelectedHumanRole = CharacterRole.Silver;

        public const int TargetFlagsToWin = 3;
        public const float MatchDurationSeconds = 180f;

        // Balanceamento exato do README (salvogg)
        public const float BobbyShieldDuration = 6.0f;
        public const float BobbyCooldown = 9.0f;

        public const float SilverDashDistance = 5.0f;
        public const float SilverDashDuration = 0.45f;
        public const float SilverCooldown = 7.0f;

        public const float LuppyGrenadeRadius = 4.0f;
        public const float LuppyGrenadeRange = 6.5f;
        public const float LuppyCooldown = 8.0f;
    }
}
`,
  },
  {
    path: 'Assets/Scripts/Core/GameManager.cs',
    description: 'Gerenciador central da partida: placar, cronômetro, regras de território e HUD',
    content: `using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace BarraBandeira
{
    public class GameManager : MonoBehaviour
    {
        public static GameManager Instance { get; private set; }

        [Header("Regras da Partida")]
        public float timeRemaining = GameConfig.MatchDurationSeconds;
        public int blueFlagsCaptured = 0;
        public int redFlagsCaptured = 0;
        public bool isMatchActive = true;
        public string winnerText = "";

        [HideInInspector]
        public List<PlayerController> allPlayers = new List<PlayerController>();

        private string lastAlert = "Capture as 3 bandeiras do adversário!";
        private float alertTimer = 4f;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
        }

        private void Start()
        {
            allPlayers.Clear();
            allPlayers.AddRange(FindObjectsByType<PlayerController>(FindObjectsSortMode.None));

            // Atribui controle humano ao personagem selecionado no MenuScene
            bool humanAssigned = false;
            foreach (var p in allPlayers)
            {
                bool match = p.team == GameConfig.SelectedHumanTeam && p.role == GameConfig.SelectedHumanRole;
                p.isHuman = match;
                if (match) humanAssigned = true;
            }

            if (!humanAssigned && allPlayers.Count > 0)
            {
                allPlayers[0].isHuman = true;
            }
        }

        private void Update()
        {
            if (alertTimer > 0f) alertTimer -= Time.deltaTime;

            if (!isMatchActive) return;

            timeRemaining -= Time.deltaTime;
            if (timeRemaining <= 0f)
            {
                timeRemaining = 0f;
                FinishByTime();
            }
        }

        public void ShowAlert(string message)
        {
            lastAlert = message;
            alertTimer = 2.5f;
            Debug.Log("[Barra Bandeira] " + message);
        }

        public void RegisterFlagCapture(TeamType scoringTeam)
        {
            if (!isMatchActive) return;

            if (scoringTeam == TeamType.Blue)
            {
                blueFlagsCaptured++;
                ShowAlert("PONTO PARA O TIME AZUL!");
                if (blueFlagsCaptured >= GameConfig.TargetFlagsToWin)
                    EndMatch("VITÓRIA DO TIME AZUL!");
            }
            else
            {
                redFlagsCaptured++;
                ShowAlert("PONTO PARA O TIME VERMELHO!");
                if (redFlagsCaptured >= GameConfig.TargetFlagsToWin)
                    EndMatch("VITÓRIA DO TIME VERMELHO!");
            }
        }

        private void FinishByTime()
        {
            if (blueFlagsCaptured > redFlagsCaptured)
                EndMatch("VITÓRIA DO TIME AZUL!");
            else if (redFlagsCaptured > blueFlagsCaptured)
                EndMatch("VITÓRIA DO TIME VERMELHO!");
            else
                EndMatch("EMPATE!");
        }

        private void EndMatch(string result)
        {
            isMatchActive = false;
            winnerText = result;
        }

        private void OnGUI()
        {
            int mins = Mathf.FloorToInt(timeRemaining / 60f);
            int secs = Mathf.FloorToInt(timeRemaining % 60f);

            GUIStyle headerBox = new GUIStyle(GUI.skin.box);
            headerBox.fontSize = 16;
            headerBox.fontStyle = FontStyle.Bold;

            GUILayout.BeginArea(new Rect(Screen.width / 2f - 240, 12, 480, 72));
            GUILayout.BeginHorizontal(headerBox);
            GUILayout.Label($"AZUL: {blueFlagsCaptured}/3", GUILayout.Width(130));
            GUILayout.Label($"TEMPO {mins:00}:{secs:00}", GUILayout.Width(180));
            GUILayout.Label($"VERMELHO: {redFlagsCaptured}/3", GUILayout.Width(150));
            GUILayout.EndHorizontal();
            GUILayout.EndArea();

            if (alertTimer > 0f)
            {
                GUI.Box(new Rect(Screen.width / 2f - 210, 92, 420, 32), lastAlert);
            }

            // Status do jogador humano no canto inferior esquerdo
            foreach (var p in allPlayers)
            {
                if (!p.isHuman) continue;
                var ab = p.GetComponent<PlayerAbilityHandler>();
                string cdText = ab != null && ab.CurrentCooldown > 0f ? $"{ab.CurrentCooldown:F1}s" : "PRONTA (Espaço)";
                string statusText = p.isFrozen ? "CONGELADO!" : (p.isShieldImmune ? $"ESCUDO IMUNE ({p.shieldTimer:F1}s)" : "LIVRE");
                GUI.Box(new Rect(16, Screen.height - 74, 340, 58), $"{p.role} ({p.team}) | Estado: {statusText}\\nHabilidade: {cdText}");
                break;
            }

            if (!isMatchActive)
            {
                GUI.Box(new Rect(Screen.width / 2f - 180, Screen.height / 2f - 90, 360, 180), $"FIM DE PARTIDA\\n\\n{winnerText}\\nAzul {blueFlagsCaptured} x {redFlagsCaptured} Vermelho");
                if (GUI.Button(new Rect(Screen.width / 2f - 140, Screen.height / 2f + 15, 130, 36), "Jogar Novamente"))
                {
                    SceneManager.LoadScene(SceneManager.GetActiveScene().name);
                }
                if (GUI.Button(new Rect(Screen.width / 2f + 10, Screen.height / 2f + 15, 130, 36), "Menu"))
                {
                    SceneManager.LoadScene("MenuScene");
                }
            }
        }
    }
}
`,
  },
  {
    path: 'Assets/Scripts/Player/PlayerController.cs',
    description: 'Movimentação 3D com CharacterController, colisão sólida, congelamento e resgate por toque',
    content: `using UnityEngine;

namespace BarraBandeira
{
    [RequireComponent(typeof(CharacterController))]
    public class PlayerController : MonoBehaviour
    {
        [Header("Identidade")]
        public TeamType team = TeamType.Blue;
        public CharacterRole role = CharacterRole.Bobby;
        public bool isHuman = false;

        [Header("Movimento")]
        public float moveSpeed = 5.2f;
        public float turnSpeed = 14f;

        [Header("Estado de Jogo")]
        public bool isFrozen = false;
        public bool isShieldImmune = false;
        public float shieldTimer = 0f;
        public FlagController carriedFlag = null;

        [Header("Referências Visuais")]
        public GameObject iceVisual;
        public GameObject shieldVisual;

        private CharacterController controller;
        private PlayerAbilityHandler abilityHandler;
        private BotBrain botBrain;

        private const float HalfFieldW = 12.2f;
        private const float HalfFieldL = 17.2f;

        private void Awake()
        {
            controller = GetComponent<CharacterController>();
            abilityHandler = GetComponent<PlayerAbilityHandler>();
            botBrain = GetComponent<BotBrain>();
        }

        private void Update()
        {
            if (GameManager.Instance != null && !GameManager.Instance.isMatchActive)
                return;

            // Atualiza escudo do Bobby (6 segundos)
            if (isShieldImmune)
            {
                shieldTimer -= Time.deltaTime;
                if (shieldTimer <= 0f)
                {
                    isShieldImmune = false;
                    if (shieldVisual != null) shieldVisual.SetActive(false);
                }
            }

            if (isFrozen)
            {
                return;
            }

            Vector3 moveDir = Vector3.zero;
            bool triggerAbility = false;
            Vector3? aimTarget = null;

            if (isHuman)
            {
                float h = Input.GetAxisRaw("Horizontal");
                float v = Input.GetAxisRaw("Vertical");
                moveDir = new Vector3(h, 0f, v).normalized;

                if (Input.GetButtonDown("Jump"))
                {
                    triggerAbility = true;
                    aimTarget = GetMouseAimPoint();
                }
            }
            else if (botBrain != null)
            {
                var decision = botBrain.ComputeDecision(this);
                moveDir = decision.moveDirection;
                triggerAbility = decision.useAbility;
                aimTarget = decision.aimTarget;
            }

            if (triggerAbility && abilityHandler != null)
            {
                abilityHandler.TryActivate(aimTarget);
            }

            // Aplica movimento caso não esteja no meio de um Dash do Silver
            if (abilityHandler == null || !abilityHandler.IsDashing)
            {
                Vector3 velocity = moveDir * moveSpeed;
                velocity.y = -9.81f; // Mantém no solo
                controller.Move(velocity * Time.deltaTime);

                if (moveDir.sqrMagnitude > 0.01f)
                {
                    Quaternion targetRot = Quaternion.LookRotation(moveDir, Vector3.up);
                    transform.rotation = Quaternion.Slerp(transform.rotation, targetRot, turnSpeed * Time.deltaTime);
                }
            }

            ClampInsideArena();
            CheckProximityTagAndRescue();
        }

        private void ClampInsideArena()
        {
            Vector3 pos = transform.position;
            pos.x = Mathf.Clamp(pos.x, -HalfFieldW, HalfFieldW);
            pos.z = Mathf.Clamp(pos.z, -HalfFieldL, HalfFieldL);
            transform.position = pos;
        }

        private Vector3? GetMouseAimPoint()
        {
            if (Camera.main == null) return null;
            Ray ray = Camera.main.ScreenPointToRay(Input.mousePosition);
            Plane ground = new Plane(Vector3.up, Vector3.zero);
            if (ground.Raycast(ray, out float enter))
            {
                return ray.GetPoint(enter);
            }
            return null;
        }

        private void CheckProximityTagAndRescue()
        {
            if (GameManager.Instance == null) return;

            foreach (var other in GameManager.Instance.allPlayers)
            {
                if (other == null || other == this) continue;
                float dist = Vector3.Distance(
                    new Vector3(transform.position.x, 0f, transform.position.z),
                    new Vector3(other.transform.position.x, 0f, other.transform.position.z)
                );

                if (dist > 1.25f) continue;

                // Aliado congelado -> Toque de resgate ("SALVO!")
                if (other.team == team && other.isFrozen)
                {
                    other.Unfreeze();
                    GameManager.Instance.ShowAlert($"{other.role} FOI SALVO!");
                }
                // Adversário livre no nosso lado do campo -> Congela por toque!
                else if (other.team != team && !other.isFrozen)
                {
                    float avgZ = (transform.position.z + other.transform.position.z) * 0.5f;
                    bool inBlueSide = avgZ < 0f;

                    if ((team == TeamType.Blue && inBlueSide) || (team == TeamType.Red && !inBlueSide))
                    {
                        other.TryFreeze();
                    }
                }
            }
        }

        public void ActivateShield(float duration)
        {
            isShieldImmune = true;
            shieldTimer = duration;
            if (shieldVisual != null) shieldVisual.SetActive(true);
        }

        public void TryFreeze()
        {
            if (isFrozen) return;

            if (isShieldImmune)
            {
                GameManager.Instance?.ShowAlert("Bobby bloqueou o toque (Escudo Imune)!");
                return;
            }

            isFrozen = true;
            if (iceVisual != null) iceVisual.SetActive(true);

            if (carriedFlag != null)
            {
                carriedFlag.DropFlag();
                carriedFlag = null;
            }

            GameManager.Instance?.ShowAlert($"{role} ({team}) FOI CONGELADO!");
        }

        public void Unfreeze()
        {
            if (!isFrozen) return;
            isFrozen = false;
            if (iceVisual != null) iceVisual.SetActive(false);
        }
    }
}
`,
  },
  {
    path: 'Assets/Scripts/Abilities/PlayerAbilityHandler.cs',
    description: 'Habilidades do README: Bobby (6s imune), Silver (dash 5m) e Luppy (granada 4m)',
    content: `using UnityEngine;

namespace BarraBandeira
{
    public class PlayerAbilityHandler : MonoBehaviour
    {
        public float CurrentCooldown { get; private set; }
        public bool IsDashing { get; private set; }

        private PlayerController player;
        private CharacterController controller;

        private float dashTimer = 0f;
        private Vector3 dashVelocity = Vector3.zero;

        private void Awake()
        {
            player = GetComponent<PlayerController>();
            controller = GetComponent<CharacterController>();
        }

        private void Update()
        {
            if (CurrentCooldown > 0f)
                CurrentCooldown = Mathf.Max(0f, CurrentCooldown - Time.deltaTime);

            if (IsDashing)
            {
                dashTimer -= Time.deltaTime;
                controller.Move(dashVelocity * Time.deltaTime);
                if (dashTimer <= 0f)
                {
                    IsDashing = false;
                }
            }
        }

        public void TryActivate(Vector3? targetPos = null)
        {
            if (player == null || player.isFrozen || CurrentCooldown > 0f)
                return;

            switch (player.role)
            {
                case CharacterRole.Bobby:
                    // Bobby (Escudeiro): Fica imune a ser congelado por toque durante 6 segundos
                    CurrentCooldown = GameConfig.BobbyCooldown;
                    player.ActivateShield(GameConfig.BobbyShieldDuration);
                    GameManager.Instance?.ShowAlert("Bobby ativou Escudo Imune (6s)!");
                    break;

                case CharacterRole.Silver:
                    // Silver (Velocista): Dash rápido de 5 metros para frente
                    CurrentCooldown = GameConfig.SilverCooldown;
                    IsDashing = true;
                    dashTimer = GameConfig.SilverDashDuration;
                    float speed = GameConfig.SilverDashDistance / GameConfig.SilverDashDuration;
                    dashVelocity = transform.forward * speed;
                    GameManager.Instance?.ShowAlert("Silver executou Dash de 5m!");
                    break;

                case CharacterRole.Luppy:
                    // Luppy (Suporte): Granada descongelante (área de 4m)
                    CurrentCooldown = GameConfig.LuppyCooldown;
                    SpawnDefrostGrenade(targetPos);
                    break;
            }
        }

        private void SpawnDefrostGrenade(Vector3? targetPos)
        {
            Vector3 startPos = transform.position + Vector3.up * 1.2f;
            Vector3 destPos;

            if (targetPos.HasValue)
            {
                Vector3 diff = targetPos.Value - transform.position;
                diff.y = 0f;
                float dist = Mathf.Min(diff.magnitude, GameConfig.LuppyGrenadeRange);
                destPos = transform.position + diff.normalized * dist;
            }
            else
            {
                destPos = transform.position + transform.forward * 4.5f;
            }

            GameObject projObj = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            projObj.name = "GranadaLuppy";
            projObj.transform.position = startPos;
            projObj.transform.localScale = Vector3.one * 0.4f;
            Destroy(projObj.GetComponent<Collider>());

            var renderer = projObj.GetComponent<Renderer>();
            if (renderer != null) renderer.material.color = new Color(0.2f, 0.85f, 1f);

            var grenade = projObj.AddComponent<DefrostGrenadeProjectile>();
            grenade.Initialize(player.team, startPos, destPos, GameConfig.LuppyGrenadeRadius);
        }
    }
}
`,
  },
  {
    path: 'Assets/Scripts/Abilities/DefrostGrenadeProjectile.cs',
    description: 'Granada descongelante da Luppy (4m): descongela aliados e também inimigos na área!',
    content: `using UnityEngine;

namespace BarraBandeira
{
    public class DefrostGrenadeProjectile : MonoBehaviour
    {
        private TeamType throwerTeam;
        private Vector3 startPos;
        private Vector3 targetPos;
        private float blastRadius = GameConfig.LuppyGrenadeRadius; // 4 metros
        private float flightDuration = 0.55f;
        private float elapsed = 0f;

        public void Initialize(TeamType team, Vector3 start, Vector3 target, float radius)
        {
            throwerTeam = team;
            startPos = start;
            targetPos = new Vector3(target.x, 0.2f, target.z);
            blastRadius = radius;
        }

        private void Update()
        {
            elapsed += Time.deltaTime;
            float t = Mathf.Clamp01(elapsed / flightDuration);

            Vector3 pos = Vector3.Lerp(startPos, targetPos, t);
            pos.y += Mathf.Sin(t * Mathf.PI) * 2.5f;
            transform.position = pos;

            if (t >= 1f)
            {
                Explode();
            }
        }

        private void Explode()
        {
            if (GameManager.Instance != null)
            {
                int alliesFreed = 0;
                int enemiesFreed = 0;

                // Regra fiel do README: área de 4m descongela aliados E inimigos se mal posicionada!
                foreach (var p in GameManager.Instance.allPlayers)
                {
                    if (p == null || !p.isFrozen) continue;

                    float dist = Vector3.Distance(
                        new Vector3(p.transform.position.x, 0f, p.transform.position.z),
                        new Vector3(targetPos.x, 0f, targetPos.z)
                    );

                    if (dist <= blastRadius)
                    {
                        p.Unfreeze();
                        if (p.team == throwerTeam) alliesFreed++;
                        else enemiesFreed++;
                    }
                }

                if (enemiesFreed > 0)
                    GameManager.Instance.ShowAlert($"ATENÇÃO! Granada descongelou {enemiesFreed} inimigo(s)!");
                else if (alliesFreed > 0)
                    GameManager.Instance.ShowAlert($"SALVO! Luppy descongelou {alliesFreed} aliado(s)!");
                else
                    GameManager.Instance.ShowAlert("Granada descongelante (área 4m) explodiu.");
            }

            Destroy(gameObject);
        }
    }
}
`,
  },
  {
    path: 'Assets/Scripts/Gameplay/FlagController.cs',
    description: 'Lógica de captura, carregamento, queda ao congelar e entrega na base (z=0)',
    content: `using UnityEngine;

namespace BarraBandeira
{
    [RequireComponent(typeof(Collider))]
    public class FlagController : MonoBehaviour
    {
        public TeamType ownerTeam = TeamType.Blue;

        private Vector3 basePosition;
        private PlayerController carrier = null;
        private bool isCaptured = false;

        private void Start()
        {
            basePosition = transform.position;
            GetComponent<Collider>().isTrigger = true;
        }

        private void Update()
        {
            if (isCaptured) return;

            if (carrier != null)
            {
                if (carrier.isFrozen)
                {
                    DropFlag();
                    return;
                }

                transform.position = carrier.transform.position + Vector3.up * 1.3f - carrier.transform.forward * 0.4f;

                // Entrega ao cruzar a linha central para o próprio campo
                bool reachedHome = (carrier.team == TeamType.Blue && carrier.transform.position.z <= 0f) ||
                                   (carrier.team == TeamType.Red && carrier.transform.position.z >= 0f);

                if (reachedHome)
                {
                    isCaptured = true;
                    carrier.carriedFlag = null;
                    GameManager.Instance?.RegisterFlagCapture(carrier.team);
                    gameObject.SetActive(false);
                }
            }
        }

        private void OnTriggerEnter(Collider other)
        {
            if (isCaptured || carrier != null) return;

            var player = other.GetComponent<PlayerController>();
            if (player == null || player.isFrozen) return;

            if (player.team != ownerTeam && player.carriedFlag == null)
            {
                carrier = player;
                player.carriedFlag = this;
                GameManager.Instance?.ShowAlert($"{player.role} ({player.team}) pegou uma bandeira!");
            }
            else if (player.team == ownerTeam && Vector3.Distance(transform.position, basePosition) > 1.5f)
            {
                transform.position = basePosition;
                GameManager.Instance?.ShowAlert($"Bandeira do time {ownerTeam} retornou à base!");
            }
        }

        public void DropFlag()
        {
            if (carrier != null) carrier.carriedFlag = null;
            carrier = null;
            transform.position = new Vector3(transform.position.x, basePosition.y, transform.position.z);
        }

        public bool IsAvailable => !isCaptured && carrier == null;
    }
}
`,
  },
  {
    path: 'Assets/Scripts/AI/BotBrain.cs',
    description: 'IA autônoma 3v3 para bots Bobby, Silver e Luppy (evitando descongelar inimigos)',
    content: `using UnityEngine;

namespace BarraBandeira
{
    public struct BotDecision
    {
        public Vector3 moveDirection;
        public bool useAbility;
        public Vector3? aimTarget;
    }

    public class BotBrain : MonoBehaviour
    {
        private FlagController[] allFlags;

        private void Start()
        {
            allFlags = FindObjectsByType<FlagController>(FindObjectsSortMode.None);
        }

        public BotDecision ComputeDecision(PlayerController bot)
        {
            BotDecision decision = new BotDecision();
            if (GameManager.Instance == null || bot.isFrozen) return decision;

            bool isBlue = bot.team == TeamType.Blue;
            Vector3 targetPos = bot.transform.position;

            // 1. Se carregando bandeira, retorna para a própria base
            if (bot.carriedFlag != null)
            {
                targetPos = new Vector3(bot.transform.position.x * 0.6f, 0f, isBlue ? -2f : 2f);
                if (bot.role == CharacterRole.Silver || bot.role == CharacterRole.Bobby)
                    decision.useAbility = true;
            }
            else
            {
                // 2. Procura aliado congelado para resgatar
                PlayerController frozenAlly = FindNearestFrozen(bot, sameTeam: true);
                if (frozenAlly != null)
                {
                    targetPos = frozenAlly.transform.position;
                    float dist = Vector3.Distance(bot.transform.position, targetPos);

                    if (bot.role == CharacterRole.Luppy && dist <= GameConfig.LuppyGrenadeRange + 2f && dist > 1.5f)
                    {
                        // Só arremessa se não houver inimigo congelado na área de 4m
                        if (!HasFrozenEnemyNear(targetPos, bot.team, GameConfig.LuppyGrenadeRadius))
                        {
                            decision.useAbility = true;
                            decision.aimTarget = targetPos;
                        }
                    }
                }
                else if (bot.role == CharacterRole.Bobby)
                {
                    // Defende território próprio
                    PlayerController invader = FindInvader(bot.team);
                    if (invader != null)
                    {
                        targetPos = invader.transform.position;
                        if (Vector3.Distance(bot.transform.position, targetPos) < 3f)
                            decision.useAbility = true;
                    }
                    else
                    {
                        targetPos = new Vector3(Mathf.Sin(Time.time) * 5f, 0f, isBlue ? -8f : 8f);
                    }
                }
                else if (bot.role == CharacterRole.Silver)
                {
                    // Invade para buscar bandeira inimiga
                    FlagController targetFlag = FindAvailableEnemyFlag(bot.team);
                    if (targetFlag != null)
                    {
                        targetPos = targetFlag.transform.position;
                        if (Vector3.Distance(bot.transform.position, targetPos) < 8f)
                            decision.useAbility = true;
                    }
                }
                else
                {
                    // Luppy patrulha o meio de campo pronta para resgates
                    targetPos = new Vector3(Mathf.Cos(Time.time * 0.8f) * 6f, 0f, isBlue ? -2.5f : 2.5f);
                }
            }

            Vector3 dir = targetPos - bot.transform.position;
            dir.y = 0f;
            if (dir.magnitude > 0.25f)
                decision.moveDirection = dir.normalized;

            return decision;
        }

        private PlayerController FindNearestFrozen(PlayerController self, bool sameTeam)
        {
            PlayerController best = null;
            float bestDist = float.MaxValue;
            foreach (var p in GameManager.Instance.allPlayers)
            {
                if (p == null || !p.isFrozen) continue;
                if ((p.team == self.team) != sameTeam) continue;
                float d = Vector3.Distance(self.transform.position, p.transform.position);
                if (d < bestDist)
                {
                    bestDist = d;
                    best = p;
                }
            }
            return best;
        }

        private bool HasFrozenEnemyNear(Vector3 center, TeamType allyTeam, float radius)
        {
            foreach (var p in GameManager.Instance.allPlayers)
            {
                if (p != null && p.team != allyTeam && p.isFrozen)
                {
                    if (Vector3.Distance(center, p.transform.position) <= radius)
                        return true;
                }
            }
            return false;
        }

        private PlayerController FindInvader(TeamType defenderTeam)
        {
            foreach (var p in GameManager.Instance.allPlayers)
            {
                if (p == null || p.team == defenderTeam || p.isFrozen) continue;
                bool inOwnSide = (defenderTeam == TeamType.Blue && p.transform.position.z < 0f) ||
                                 (defenderTeam == TeamType.Red && p.transform.position.z > 0f);
                if (inOwnSide) return p;
            }
            return null;
        }

        private FlagController FindAvailableEnemyFlag(TeamType myTeam)
        {
            if (allFlags == null) return null;
            foreach (var f in allFlags)
            {
                if (f != null && f.ownerTeam != myTeam && f.IsAvailable)
                    return f;
            }
            return null;
        }
    }
}
`,
  },
  {
    path: 'Assets/Scripts/UI/MenuController.cs',
    description: 'Menu inicial de seleção de equipe e personagem (Bobby, Silver, Luppy)',
    content: `using UnityEngine;
using UnityEngine.SceneManagement;

namespace BarraBandeira
{
    public class MenuController : MonoBehaviour
    {
        private TeamType selectedTeam = TeamType.Blue;
        private CharacterRole selectedRole = CharacterRole.Silver;

        private void OnGUI()
        {
            float w = 520f;
            float h = 420f;
            Rect panel = new Rect((Screen.width - w) * 0.5f, (Screen.height - h) * 0.5f, w, h);

            GUI.Box(panel, "BARRA BANDEIRA - MVP (SALVO!)");

            GUILayout.BeginArea(new Rect(panel.x + 24, panel.y + 40, w - 48, h - 60));

            GUILayout.Label("1. Escolha sua Equipe:");
            GUILayout.BeginHorizontal();
            if (GUILayout.Button(selectedTeam == TeamType.Blue ? "[ATIVO] Time Azul" : "Time Azul", GUILayout.Height(36)))
                selectedTeam = TeamType.Blue;
            if (GUILayout.Button(selectedTeam == TeamType.Red ? "[ATIVO] Time Vermelho" : "Time Vermelho", GUILayout.Height(36)))
                selectedTeam = TeamType.Red;
            GUILayout.EndHorizontal();

            GUILayout.Space(16);
            GUILayout.Label("2. Selecione seu Personagem:");

            if (GUILayout.Button(RoleLabel(CharacterRole.Bobby, "Escudeiro — Imune a toque por 6s"), GUILayout.Height(42)))
                selectedRole = CharacterRole.Bobby;

            if (GUILayout.Button(RoleLabel(CharacterRole.Silver, "Velocista — Dash de 5 metros para frente"), GUILayout.Height(42)))
                selectedRole = CharacterRole.Silver;

            if (GUILayout.Button(RoleLabel(CharacterRole.Luppy, "Suporte — Granada descongelante (4m, cuidado com inimigos!)"), GUILayout.Height(42)))
                selectedRole = CharacterRole.Luppy;

            GUILayout.Space(24);
            if (GUILayout.Button("INICIAR PARTIDA 3v3", GUILayout.Height(48)))
            {
                GameConfig.SelectedHumanTeam = selectedTeam;
                GameConfig.SelectedHumanRole = selectedRole;
                SceneManager.LoadScene("MainScene");
            }

            GUILayout.EndArea();
        }

        private string RoleLabel(CharacterRole role, string desc)
        {
            string prefix = selectedRole == role ? ">>> " : "";
            return $"{prefix}{role}: {desc}";
        }
    }
}
`,
  },
  {
    path: 'Assets/Editor/BarraBandeiraSceneBuilder.cs',
    description: 'Gerador automático de MenuScene.unity e MainScene.unity dentro da Unity 6.3',
    content: `#if UNITY_EDITOR
using System.IO;
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

namespace BarraBandeira.EditorTools
{
    public static class BarraBandeiraSceneBuilder
    {
        [MenuItem("Barra Bandeira/Gerar Cenas MVP (MenuScene e MainScene)")]
        public static void BuildAllScenes()
        {
            if (!Directory.Exists("Assets/Scenes"))
                Directory.CreateDirectory("Assets/Scenes");

            BuildMenuScene();
            BuildMainScene();

            EditorBuildSettings.scenes = new[]
            {
                new EditorBuildSettingsScene("Assets/Scenes/MenuScene.unity", true),
                new EditorBuildSettingsScene("Assets/Scenes/MainScene.unity", true)
            };

            AssetDatabase.Refresh();
            EditorUtility.DisplayDialog("Barra Bandeira MVP", "Cenas MenuScene e MainScene criadas com sucesso em Assets/Scenes/!", "OK");
        }

        private static Material CreateColorMaterial(Color color)
        {
            Shader shader = Shader.Find("Standard");
            if (shader == null) shader = Shader.Find("Universal Render Pipeline/Lit");
            Material mat = new Material(shader);
            mat.color = color;
            return mat;
        }

        private static void BuildMenuScene()
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);
            GameObject menuObj = new GameObject("MenuController");
            menuObj.AddComponent<MenuController>();
            EditorSceneManager.SaveScene(scene, "Assets/Scenes/MenuScene.unity");
        }

        private static void BuildMainScene()
        {
            var scene = EditorSceneManager.NewScene(NewSceneSetup.DefaultGameObjects, NewSceneMode.Single);

            // Câmera Top-Down estilo Barra-Bandeira
            if (Camera.main != null)
            {
                Camera.main.transform.position = new Vector3(0f, 24f, -18f);
                Camera.main.transform.LookAt(Vector3.zero);
            }

            GameObject gmObj = new GameObject("GameManager");
            gmObj.AddComponent<GameManager>();

            // Chão da Arena
            GameObject ground = GameObject.CreatePrimitive(PrimitiveType.Cube);
            ground.name = "ArenaGround";
            ground.transform.position = new Vector3(0f, -0.25f, 0f);
            ground.transform.localScale = new Vector3(26f, 0.5f, 36f);
            ground.GetComponent<Renderer>().sharedMaterial = CreateColorMaterial(new Color(0.18f, 0.5f, 0.2f));

            // Linha Divisória Central
            GameObject centerLine = GameObject.CreatePrimitive(PrimitiveType.Cube);
            centerLine.name = "CenterLine";
            centerLine.transform.position = new Vector3(0f, 0.02f, 0f);
            centerLine.transform.localScale = new Vector3(26f, 0.04f, 0.35f);
            Object.DestroyImmediate(centerLine.GetComponent<Collider>());
            centerLine.GetComponent<Renderer>().sharedMaterial = CreateColorMaterial(Color.white);

            // Obstáculos Sólidos
            Vector3[] cratePositions =
            {
                new Vector3(-5f, 0.7f, -3f), new Vector3(5f, 0.7f, 3f),
                new Vector3(3f, 0.7f, -10f), new Vector3(-8f, 0.7f, -8f),
                new Vector3(-3f, 0.7f, 10f), new Vector3(8f, 0.7f, 8f)
            };
            Material crateMat = CreateColorMaterial(new Color(0.7f, 0.35f, 0.1f));
            foreach (var pos in cratePositions)
            {
                GameObject box = GameObject.CreatePrimitive(PrimitiveType.Cube);
                box.name = "ObstacleCrate";
                box.transform.position = pos;
                box.transform.localScale = new Vector3(1.6f, 1.4f, 1.6f);
                box.GetComponent<Renderer>().sharedMaterial = crateMat;
            }

            // 6 Bandeiras (3 Azuis, 3 Vermelhas)
            CreateFlag("Flag_Blue_1", TeamType.Blue, new Vector3(-6f, 0.6f, -14f));
            CreateFlag("Flag_Blue_2", TeamType.Blue, new Vector3(0f, 0.6f, -15f));
            CreateFlag("Flag_Blue_3", TeamType.Blue, new Vector3(6f, 0.6f, -14f));

            CreateFlag("Flag_Red_1", TeamType.Red, new Vector3(-6f, 0.6f, 14f));
            CreateFlag("Flag_Red_2", TeamType.Red, new Vector3(0f, 0.6f, 15f));
            CreateFlag("Flag_Red_3", TeamType.Red, new Vector3(6f, 0.6f, 14f));

            // 6 Jogadores (Time Azul vs Time Vermelho)
            CreatePlayer("Blue_Bobby", TeamType.Blue, CharacterRole.Bobby, new Vector3(-5f, 0f, -8f));
            CreatePlayer("Blue_Silver", TeamType.Blue, CharacterRole.Silver, new Vector3(0f, 0f, -7f));
            CreatePlayer("Blue_Luppy", TeamType.Blue, CharacterRole.Luppy, new Vector3(5f, 0f, -8f));

            CreatePlayer("Red_Bobby", TeamType.Red, CharacterRole.Bobby, new Vector3(-5f, 0f, 8f));
            CreatePlayer("Red_Silver", TeamType.Red, CharacterRole.Silver, new Vector3(0f, 0f, 7f));
            CreatePlayer("Red_Luppy", TeamType.Red, CharacterRole.Luppy, new Vector3(5f, 0f, 8f));

            EditorSceneManager.SaveScene(scene, "Assets/Scenes/MainScene.unity");
        }

        private static void CreateFlag(string name, TeamType team, Vector3 pos)
        {
            GameObject flagObj = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            flagObj.name = name;
            flagObj.transform.position = pos;
            flagObj.transform.localScale = new Vector3(0.4f, 1.2f, 0.4f);
            flagObj.GetComponent<Renderer>().sharedMaterial = CreateColorMaterial(team == TeamType.Blue ? Color.blue : Color.red);

            var fc = flagObj.AddComponent<FlagController>();
            fc.ownerTeam = team;
        }

        private static void CreatePlayer(string name, TeamType team, CharacterRole role, Vector3 pos)
        {
            GameObject root = new GameObject(name);
            root.transform.position = pos;

            var cc = root.AddComponent<CharacterController>();
            cc.center = new Vector3(0f, 1f, 0f);
            cc.radius = 0.45f;
            cc.height = 1.8f;

            GameObject body = GameObject.CreatePrimitive(PrimitiveType.Capsule);
            body.transform.SetParent(root.transform, false);
            body.transform.localPosition = new Vector3(0f, 1f, 0f);
            Object.DestroyImmediate(body.GetComponent<Collider>());
            body.GetComponent<Renderer>().sharedMaterial = CreateColorMaterial(team == TeamType.Blue ? new Color(0.2f, 0.45f, 0.95f) : new Color(0.9f, 0.2f, 0.2f));

            // Bloco de gelo (ativo quando congelado)
            GameObject ice = GameObject.CreatePrimitive(PrimitiveType.Cube);
            ice.name = "IceCube";
            ice.transform.SetParent(root.transform, false);
            ice.transform.localPosition = new Vector3(0f, 1f, 0f);
            ice.transform.localScale = new Vector3(1.3f, 1.9f, 1.3f);
            Object.DestroyImmediate(ice.GetComponent<Collider>());
            ice.GetComponent<Renderer>().sharedMaterial = CreateColorMaterial(new Color(0.6f, 0.9f, 1f));
            ice.SetActive(false);

            // Escudo do Bobby (ativo por 6s)
            GameObject shield = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            shield.name = "ShieldDome";
            shield.transform.SetParent(root.transform, false);
            shield.transform.localPosition = new Vector3(0f, 1f, 0f);
            shield.transform.localScale = Vector3.one * 2.1f;
            Object.DestroyImmediate(shield.GetComponent<Collider>());
            shield.GetComponent<Renderer>().sharedMaterial = CreateColorMaterial(new Color(1f, 0.8f, 0.2f));
            shield.SetActive(false);

            var pc = root.AddComponent<PlayerController>();
            pc.team = team;
            pc.role = role;
            pc.iceVisual = ice;
            pc.shieldVisual = shield;

            root.AddComponent<PlayerAbilityHandler>();
            root.AddComponent<BotBrain>();
        }
    }
}
#endif
`,
  },
  {
    path: 'README_UNITY_IMPORT.md',
    description: 'Passo a passo para colocar a pasta Assets/ no repositório salvogg (Unity 6.3 LTS)',
    content: `# Como integrar no repositório salvogg (Unity 6.3 LTS)

Este pacote gera a pasta \`Assets/\` completa (Scripts C# + Construtor Automático de Cenas) compatível com a versão **Unity 6.3 LTS (6000.3.28f1)** e com os pacotes nativos já presentes em \`vitormigueld/salvogg\`.

## Passo a passo:
1. Baixe e extraia o arquivo \`.zip\`.
2. Copie a pasta \`Assets/\` para a raiz do seu repositório clonado \`salvogg\` (ao lado de \`Packages/\` e \`ProjectSettings/\`).
3. Abra o projeto no **Unity Hub** (versão **6000.3.28f1**).
4. No menu superior do Editor Unity, clique em:
   **Barra Bandeira > Gerar Cenas MVP (MenuScene e MainScene)**
5. Abra \`Assets/Scenes/MenuScene.unity\` (ou \`MainScene.unity\`) e aperte **Play**!

## Controles na Unity:
- **W, A, S, D** ou **Setas**: Movimentação.
- **Barra de Espaço**: Habilidade especial (**Bobby** 6s imune / **Silver** Dash 5m / **Luppy** Granada descongelante 4m).
- **Mouse**: Mira da granada da **Luppy**.
`,
  },
];

/**
 * Generates and triggers download of the Unity 6.3 Assets C# package ZIP archive
 */
export async function downloadUnityProjectZip(): Promise<void> {
  const zip = new JSZip();

  for (const file of UNITY_PROJECT_FILES) {
    zip.file(`salvogg_unity_assets/${file.path}`, file.content);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'salvogg_Unity6_Assets_MVP.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
