extends CharacterBody3D

@export var velocidade: float = 3.5
@export var gravidade: float = 9.8

var player: Node3D = null

func _ready():
	# 1. Tenta encontrar pelo nome exato que está na sua árvore de cenas
	player = get_node_or_null("../character_teste")
	
	# 2. Se ainda não achar, tenta pelo grupo "jogador"
	if not player:
		player = get_tree().get_first_node_in_group("jogador")
		
	if not player:
		print("AVISO: O bot não encontrou nenhum jogador na cena!")

func _physics_process(delta):
	# Aplica a gravidade se não estiver no chão
	if not is_on_floor():
		velocity.y -= gravidade * delta
	else:
		velocity.y = 0

	if player:
		# Calcula a direção apontando para o jogador
		var direcao = (player.global_position - global_position)
		direcao.y = 0 # Mantém o movimento apenas no plano horizontal
		
		# Verifica se a distância não é zero para evitar erros
		if direcao.length() > 0.1:
			direcao = direcao.normalized()

			# Move o bot em direção ao player
			velocity.x = direcao.x * velocidade
			velocity.z = direcao.z * velocidade

			# Faz o bot olhar para o jogador
			look_at(Vector3(player.global_position.x, position.y, player.global_position.z), Vector3.UP)
		else:
			velocity.x = move_toward(velocity.x, 0, velocidade)
			velocity.z = move_toward(velocity.z, 0, velocidade)
	else:
		velocity.x = move_toward(velocity.x, 0, velocidade)
		velocity.z = move_toward(velocity.z, 0, velocidade)

	move_and_slide()
