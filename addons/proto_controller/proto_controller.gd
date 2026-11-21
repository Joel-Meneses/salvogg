
extends CharacterBody3D

@export var velocidade: float = 5.0
@export var gravidade: float = 9.8

func _physics_process(delta):

	# Captura as teclas de movimentação
	var input_dir = Input.get_vector(
		"mover-esquerda",
		"mover_direita",
		"mover_frente",
        "mover_tras"
	)

	# Calcula a direção
	var direcao = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()

	# Movimenta o personagem
	if direcao:
		velocity.x = direcao.x * velocidade
		velocity.z = direcao.z * velocidade
	else:
		velocity.x = move_toward(velocity.x, 0, velocidade)
		velocity.z = move_toward(velocity.z, 0, velocidade)

	# Aplica gravidade
	if not is_on_floor():
		velocity.y -= gravidade * delta

	# Executa o movimento
	move_and_slide()
