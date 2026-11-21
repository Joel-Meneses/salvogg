# Projeto SALVO! (MVP)

Um jogo multiplayer competitivo inspirado na tradicional brincadeira de rua **Barra Bandeira**, desenvolvido na **Godot Engine**. 

O objetivo é estratégico: invadir o campo adversário para capturar as **3 bandeiras** do time inimigo e trazê-las em segurança para a sua base, enquanto defende o seu próprio território congelando os invasores e descongelando aliados com um toque.

---

## Mecânicas Principais

* **Divisão de Campo:** A arena é dividida em dois territórios. No seu próprio lado, você atua como defensor; ao cruzar a linha central, você se torna um atacante vulnerável.
* **Sistema de Congelamento:** Ao ser tocado por um defensor no campo inimigo, o jogador fica **congelado** no lugar e não pode se mover ou interagir até ser salvo.
* **Condição de Vitória:** Vence a equipe que conseguir capturar todas as **3 bandeiras** do time adversário e levá-las até a sua zona de pontuação (base).

---

## Personagens (Classes)

Para adicionar profundidade tática à brincadeira clássica, o MVP conta com 3 personagens jogáveis, cada um com uma habilidade única:

| Personagem | Papel | Habilidade Especial | Detalhes Técnicos |
| :--- | :--- | :--- | :--- |
| **Bobby** | Escudeiro | **Escudo Protetor** | Fica imune a **1 toque** inimigo durante **4 segundos**, ideal para romper linhas de defesa ou garantir a fuga com a bandeira. |
| **Silver** | Velocista | **Dash Tático** | Avança rapidamente **5 metros** para frente, ótimo para atravessar a linha inimiga de surpresa ou desviar de defensores. |
| **Luppy** | Suporte | **Granada Descongelante** | Lança uma granada com **4 metros** de área de efeito que liberta aliados congelados. *Atenção:* se mal posicionada, também pode descongelar inimigos! |

---

## 🛠️ Tecnologias Utilizadas

* **Engine:** [Godot Engine](https://godotengine.org/) *(versão 4.7.2)*
* **Linguagem:** GDScript
* **Controle de Versão:** Git & GitHub

---

## 🚀 Como Executar o Projeto

1. Faça um clone deste repositório:
   ```bash
   git clone https://github.com/vitormigueld/salvogg.git
   ```
2. Abra a **Godot Engine**.
3. No Gerenciador de Projetos, clique em **Importar** e navegue até a pasta onde você clonou o repositório.
4. Selecione o arquivo `project.godot` e clique em **Importar e Editar**.
5. Pressione `F5` (ou clique no ícone de *Play* no canto superior direito) para iniciar o jogo.

---

## 👥 Equipe de Desenvolvimento

* **Julia Sousa de Lima** 
* **Vitor Miguel de Souza Santos** 
* **Joel Ferreira Meneses** 
* **Maria Clara Soares Bezerra**
* **João Victor Queiroz de Barros** 
---

*Desenvolvido como projeto de estudo e prototipagem na Godot Engine.*
