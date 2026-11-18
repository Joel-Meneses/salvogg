# Barra Bandeira - MVP

Jogo multiplayer competitivo inspirado na clássica brincadeira de rua **Barra Bandeira**.

## Objetivo
Capturar as **3 bandeiras** do time adversário e trazê-las de volta para a sua base, enquanto defende o seu território congelando os invasores com um toque.

## Personagens e Habilidades

| Personagem | Função | Habilidade Especial |
| :--- | :--- | :--- |
| **Bobby** | Escudeiro | Fica imune a ser congelado por toque durante **6 segundos**. |
| **Silver** | Velocista | Executa um dash rápido de **5 metros** para frente. |
| **Luppy** | Suporte | Lança uma granada descongelante (área de **4m**). **Atenção:** se mal posicionada, pode descongelar inimigos também! |

## Regras Básicas
1. **Ataque:** Ao cruzar para o campo inimigo, você corre o risco de ser congelado se for tocado por um adversário.
2. **Defesa:** No seu lado do campo, toque nos inimigos para congelá-los no lugar.
3. **Resgate:** Jogadores congelados podem ser liberados pela granada da Luppy (ou regra de toque de aliados).
4. **Vitória:** Vence a equipe que trouxer as 3 bandeiras adversárias para a própria base primeiro.

## Como Executar (Unity)

### Pré-requisitos
* **Unity Hub** instalado.
* **Unity Editor** (Versão recomendada:  Unity 6.3 LTS (6000.3.28f1)).

### Passo a passo
1. Clone este repositório:
   ```bash
   git clone https://github.com/vitormigueld/salvogg
2. Abra o Unity Hub, clique em Add > Add project from disk e selecione a pasta clonada.
3. Abra o projeto (a primeira abertura pode levar alguns minutos para compilar os pacotes).
4. Na janela Project, navegue até Assets/Scenes/ e abra a cena MainScene (ou MenuScene).
5. Aperte o botão Play no topo do editor para testar.
