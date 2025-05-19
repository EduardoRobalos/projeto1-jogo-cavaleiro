const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Tamanho do personagem e inimigos
const playerSize = 30;
const espada = document.querySelector('.espada');
const enemySize = 30;
const bossSize = 50;
const swordLength = 50;
const botaoInicio = document.getElementById('botaoInicio');

const botaoVolta = document.getElementById('botaoVolta');
const titulo = document.querySelector('.titulo');
let playerX = 50, playerY = canvas.height / 2; // Posição inicial do personagem
let playerDX = 0, playerDY = 0;
let isAttacking = false;
let playerHealth = 50; // Vida do jogador
let attackCooldown = 0; // Tempo do último ataque (em ms)
const attackDuration = 200; // Duração do ataque em ms
const attackCooldownTime = 500; // Cooldown entre ataques em ms
let gameOver = false; // Estado do jogo

// Fase atual
var currentLevel = 1;

// Inimigos
let enemies = [
    { x: 450, y: 100, health: 3, lastShot: 0 },
    { x: 500, y: 200, health: 3, lastShot: 0 },
    { x: 550, y: 300, health: 3, lastShot: 0 }
];

// Projéteis
let projectiles = [];

// Chefe
let boss = { x: 500, y: 100, health: 10, active: false, lastShot: 0 }; // Adicionado lastShot para ataque do chefe

// Porta para a próxima fase
let door = { x: 100, y: 50, width: 30, height: 50, isOpen: false };

// Função para desenhar a espada
function drawSword() {
    if (!isAttacking) return;  // Só desenha a espada quando estiver atacando

    // Definir a cor da espada
    ctx.strokeStyle = 'yellow'; // Cor brilhante para a lâmina da espada
    ctx.lineWidth = 6;  // Largura da lâmina
    ctx.shadowColor = 'white'; // Cor do brilho
    ctx.shadowBlur = 15; // Intensidade do brilho

    // Calcular posição da espada com base no movimento do jogador
    let swordX = playerX + playerSize / 2;
    let swordY = playerY + playerSize / 2;
    let swordAngle = Math.atan2(playerDY, playerDX); // Direção da espada com base no movimento do personagem

    // Desenhar a espada como uma linha com um pequeno ângulo, imitando uma lâmina
    ctx.beginPath();
    ctx.moveTo(swordX, swordY);  // Inicia a espada a partir do personagem
    ctx.lineTo(swordX + Math.cos(swordAngle) * swordLength, swordY + Math.sin(swordAngle) * swordLength);  // Define a posição final da lâmina com base na direção
    ctx.stroke();  // Desenha a espada
    ctx.shadowBlur = 0;  // Desativa o brilho depois de desenhar
}

// Função para desenhar o personagem (Knight-like design)
function drawPlayer() {
    // Centro do personagem
    const centerX = playerX + playerSize / 2;
    const centerY = playerY + playerSize / 2;

    // Desenhar corpo (retângulo com gradiente)
    const gradient = ctx.createLinearGradient(playerX, playerY, playerX + playerSize, playerY + playerSize);
    gradient.addColorStop(0, '#4682b4'); // Azul escuro
    gradient.addColorStop(1, '#87ceeb'); // Azul claro
    ctx.fillStyle = gradient;
    ctx.fillRect(playerX + 5, playerY + 10, playerSize - 10, playerSize - 10);

    // Desenhar cabeça (círculo com capacete)
    ctx.fillStyle = '#c0c0c0'; // Cinza prateado
    ctx.beginPath();
    ctx.arc(centerX, playerY + 10, 8, 0, Math.PI * 2); // Cabeça
    ctx.fill();

    // Capacete (triângulo)
    ctx.fillStyle = '#808080';
    ctx.beginPath();
    ctx.moveTo(centerX, playerY);
    ctx.lineTo(centerX - 10, playerY + 10);
    ctx.lineTo(centerX + 10, playerY + 10);
    ctx.closePath();
    ctx.fill();

    // Escudo (círculo na lateral)
    ctx.fillStyle = '#b22222'; // Vermelho
    ctx.beginPath();
    ctx.arc(playerX + 5, centerY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Desenha a espada do personagem
    drawSword();
}

// Função para desenhar os inimigos (Spiky Monsters)
function drawEnemies() {
    enemies.forEach(enemy => {
        const centerX = enemy.x + enemySize / 2;
        const centerY = enemy.y + enemySize / 2;

        // Corpo principal (círculo com gradiente)
        const gradient = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, enemySize / 2);
        gradient.addColorStop(0, '#ff0000'); // Vermelho brilhante
        gradient.addColorStop(1, '#8b0000'); // Vermelho escuro
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, enemySize / 2, 0, Math.PI * 2);
        ctx.fill();

        // Espinhos (triângulos ao redor)
        ctx.fillStyle = '#ff4500'; // Laranja avermelhado
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI / 4) * i;
            const spikeX = centerX + Math.cos(angle) * (enemySize / 2 + 5);
            const spikeY = centerY + Math.sin(angle) * (enemySize / 2 + 5);
            ctx.beginPath();
            ctx.moveTo(spikeX, spikeY);
            ctx.lineTo(spikeX + Math.cos(angle + Math.PI / 6) * 10, spikeY + Math.sin(angle + Math.PI / 6) * 10);
            ctx.lineTo(spikeX + Math.cos(angle - Math.PI / 6) * 10, spikeY + Math.sin(angle - Math.PI / 6) * 10);
            ctx.closePath();
            ctx.fill();
        }

        // Olhos (círculos vermelhos brilhantes)
        ctx.fillStyle = '#ff69b4'; // Rosa brilhante
        ctx.beginPath();
        ctx.arc(centerX - 5, centerY - 5, 3, 0, Math.PI * 2);
        ctx.arc(centerX + 5, centerY - 5, 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Função para desenhar o chefe (Large Menacing Creature)
function drawBoss() {
    if (boss.active && boss.health > 0) {
        const centerX = boss.x + bossSize / 2;
        const centerY = boss.y + bossSize / 2;

        // Corpo principal (círculo com bordas irregulares)
        const gradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, bossSize / 2);
        gradient.addColorStop(0, '#006400'); // Verde escuro
        gradient.addColorStop(1, '#228b22'); // Verde floresta
        ctx.fillStyle = gradient;
        ctx.beginPath();
        for (let i = 0; i < 360; i += 10) {
            const angle = (i * Math.PI) / 180;
            const radius = (bossSize / 2) + (Math.random() * 5 - 2.5); // Bordas irregulares
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();

        // Chifres (triângulos)
        ctx.fillStyle = '#2f4f4f'; // Cinza escuro
        ctx.beginPath();
        ctx.moveTo(centerX - 20, centerY - 20);
        ctx.lineTo(centerX - 30, centerY - 40);
        ctx.lineTo(centerX - 10, centerY - 30);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(centerX + 20, centerY - 20);
        ctx.lineTo(centerX + 30, centerY - 40);
        ctx.lineTo(centerX + 10, centerY - 30);
        ctx.closePath();
        ctx.fill();

        // Olho central (círculo verde brilhante)
        ctx.fillStyle = '#00ff00'; // Verde brilhante
        ctx.beginPath();
        ctx.arc(centerX, centerY, 10, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Função para desenhar a porta
function drawDoor() {
    if (boss.health <= 0) { // Porta visível após derrotar o chefe
        ctx.fillStyle = door.isOpen ? 'gold' : 'brown';
        if (!door.isOpen) {
            ctx.shadowColor = 'yellow'; // Brilho para indicar interação
            ctx.shadowBlur = 10;
        }
        ctx.fillRect(door.x, door.y, door.width, door.height);
        ctx.shadowBlur = 0; // Resetar brilho
    }
}

// Função para desenhar projéteis
function drawProjectiles() {
    projectiles.forEach(projectile => {
        ctx.fillStyle = projectile.isBoss ? '#00ff00' : '#ffa500'; // Verde para projéteis do chefe, laranja para inimigos
        ctx.shadowColor = projectile.isBoss ? '#00cc00' : '#ff4500';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.isBoss ? 7 : 5, 0, Math.PI * 2); // Projéteis do chefe são maiores
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}

// Função para mover o personagem
function movePlayer() {
    if (gameOver) return; // Não move se o jogo terminou
    playerX += playerDX;
    playerY += playerDY;

    // Prevenir que o personagem saia da tela
    if (playerX < 0) playerX = 0;
    if (playerX + playerSize > canvas.width) playerX = canvas.width - playerSize;
    if (playerY < 0) playerY = 0;
    if (playerY + playerSize > canvas.height) playerY = canvas.height - playerSize;
}

// Função para verificar colisões da espada com inimigos
function checkSwordCollision() {
    if (!isAttacking) return;

    enemies.forEach((enemy, index) => {
        if (playerX + playerSize / 2 + swordLength > enemy.x && playerX + playerSize / 2 < enemy.x + enemySize && playerY + playerSize / 2 > enemy.y && playerY + playerSize / 2 < enemy.y + enemySize) {
            enemy.health -= 1;
            if (enemy.health <= 0) {
                enemies.splice(index, 1); // Remove o inimigo derrotado
            }
        }
    });

    // Checa se a espada atinge o chefe
    if (boss.active && playerX + playerSize / 2 + swordLength > boss.x && playerX + playerSize / 2 < boss.x + bossSize && playerY + playerSize / 2 > boss.y && playerY + playerSize / 2 < boss.y + bossSize) {
        boss.health -= 1;
    }
    if (boss.active && boss.health <= 0) {
        boss.active = false; // O chefe desaparece quando sua vida chega a 0
    }
}

// Função para verificar colisões dos projéteis com o jogador
function checkProjectileCollision() {
    projectiles.forEach((projectile, index) => {
        const distance = Math.sqrt((projectile.x - (playerX + playerSize / 2)) ** 2 + (projectile.y - (playerY + playerSize / 2)) ** 2);
        if (distance < playerSize / 2 + (projectile.isBoss ? 7 : 5)) { // Ajustado para projéteis do chefe
            playerHealth -= projectile.isBoss ? 2 : 1; // Projéteis do chefe causam mais dano
            console.log('Projétil atingiu o jogador! Vida restante: ' + playerHealth);
            projectiles.splice(index, 1); // Remove o projétil
            if (playerHealth <= 0) {
                gameOver = true;
                ctx.fillStyle = 'white';
                ctx.font = '24px Arial';
                ctx.fillText('Game Over!', canvas.width / 2 - 50, canvas.height / 2);
                clearInterval(gameLoop); // Para o jogo
            }
        }
    });
}

// Função para mover os projéteis
function moveProjectiles() {
    projectiles.forEach((projectile, index) => {
        projectile.x += projectile.dx;
        projectile.y += projectile.dy;

        // Remove projéteis que saem da tela
        if (projectile.x < 0 || projectile.x > canvas.width || projectile.y < 0 || projectile.y > canvas.height) {
            projectiles.splice(index, 1);
        }
    });
}

// Função para inimigos atirarem projéteis
function shootProjectile(entity, isBoss = false) {
    const now = Date.now();
    const shootInterval = isBoss ? 1500 : 2000; // Chefe atira mais rápido
    if (now - entity.lastShot < shootInterval) return;

    const centerX = entity.x + (isBoss ? bossSize : enemySize) / 2;
    const centerY = entity.y + (isBoss ? bossSize : enemySize) / 2;
    const playerCenterX = playerX + playerSize / 2;
    const playerCenterY = playerY + playerSize / 2;

    // Calcular direção do projétil
    const dx = playerCenterX - centerX;
    const dy = playerCenterY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < 1) return; // Evita divisão por zero

    const speed = isBoss ? 3 : 2; // Projéteis do chefe são mais rápidos
    const moveX = (dx / distance) * speed;
    const moveY = (dy / distance) * speed;

    // Criar projétil
    projectiles.push({
        x: centerX,
        y: centerY,
        dx: moveX,
        dy: moveY,
        isBoss: isBoss
    });

    entity.lastShot = now;
}

// Função para desenhar a pontuação de vida
function drawHealth() {
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.fillText('Vida jogador: ' + playerHealth, 10, 20);
    ctx.fillText('Fase: ' + currentLevel, 10, 40);
    if (boss.active) {
        ctx.fillText('Chefe: ' + boss.health, 10, 60);
    }
    enemies.forEach((enemy, index) => {
        ctx.fillText('Inimigo ' + (index + 1) + ': ' + enemy.health, 10, 80 + (index * 20));
    });
}

// Função para verificar se o jogador tocou na porta
function checkDoorCollision() {
    if (boss.health <= 0 && !gameOver) { // Porta acessível após derrotar o chefe, se o jogo não terminou
        if (playerX + playerSize > door.x && playerX < door.x + door.width && playerY + playerSize > door.y && playerY < door.y + door.height) {
            door.isOpen = true; // Porta fica aberta
            // Tocar som de transição
            const transitionSound = document.getElementById('transitionSound');
            if (transitionSound) transitionSound.play();
            // Exibir efeito de transição
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '16px "Press Start 2P"';
            ctx.fillText(`Indo para a Fase ${currentLevel + 1}`, canvas.width / 2 - 120, canvas.height / 2);
            // Impedir múltiplas transições
            if (!gameOver) {
                currentLevel+=1;
                console.log(currentLevel)
                resetLevel(); // Reseta a fase
            }
        }
    }
}

// Função para reiniciar a fase
function resetLevel() {
    // Redefinir estado comum
    playerX = 50;
    playerY = canvas.height / 2;
    projectiles = [];
    gameOver = false;
    door.isOpen = false;

    console.log(`Resetando fase: currentLevel=${currentLevel}`);

    switch (currentLevel) {
        case 1:
            enemies = [
                { x: 450, y: 100, health: 3, lastShot: 0 },
                { x: 500, y: 200, health: 3, lastShot: 0 },
                { x: 550, y: 300, health: 3, lastShot: 0 }
            ];
            boss = { x: 500, y: 100, health: 10, active: false, lastShot: 0 };
            door = { x: 100, y: 50, width: 30, height: 50, isOpen: false };
            break;
        case 2:
            enemies = [
                { x: 450, y: 100, health: 4, lastShot: 0 },
                { x: 500, y: 200, health: 4, lastShot: 0 },
                { x: 550, y: 300, health: 4, lastShot: 0 },
                { x: 400, y: 150, health: 4, lastShot: 0 }
            ];
            boss = { x: 500, y: 100, health: 15, active: false, lastShot: 0 };
            door = { x: 550, y: 50, width: 30, height: 50, isOpen: false };
            break;
        case 3:
            enemies = [
                { x: 450, y: 100, health: 5, lastShot: 0 },
                { x: 500, y: 200, health: 5, lastShot: 0 },
                { x: 550, y: 300, health: 5, lastShot: 0 },
                { x: 400, y: 150, health: 5, lastShot: 0 },
                { x: 350, y: 250, health: 5, lastShot: 0 }
            ];
            boss = { x: 500, y: 100, health: 20, active: false, lastShot: 0 };
            door = { x: 550, y: 100, width: 30, height: 50, isOpen: false };
            break;
        case 4:
                gameOver = true;
                document.getElementById('victoryOverlay').style.display = 'flex';
                clearInterval(gameLoop);
                gameLoop = null;
            
        default:
            // Caso inválido
            console.warn(`Nível inválido detectado (${currentLevel}), reiniciando para 1.`);
            currentLevel = 1;
            resetLevel(); // Chamada recursiva para iniciar fase 1
            return;
    }

}

// Função para controlar o movimento do jogador
function controlPlayer(event) {
    if (gameOver) return; // Não aceita entrada se o jogo terminou
    if (event.key === 'ArrowUp') playerDY = -2;
    if (event.key === 'ArrowDown') playerDY = 2;
    if (event.key === 'ArrowLeft') playerDX = -2;
    if (event.key === 'ArrowRight') playerDX = 2;
    if (event.key === ' ' && Date.now() - attackCooldown >= attackCooldownTime) {
        isAttacking = true;
        attackCooldown = Date.now();
        setTimeout(() => {
            isAttacking = false;
        }, attackDuration);
    }
}

// Função para parar o movimento do jogador
function stopPlayerMovement(event) {
    if (gameOver) return; // Não aceita entrada se o jogo terminou
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') playerDY = 0;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') playerDX = 0;
}

// Função para mover os inimigos e o chefe em direção ao jogador e atacar
function moveEnemies() {
    if (gameOver) return; // Não move se o jogo terminou
    enemies.forEach(enemy => {
        // Calcular direção do movimento do inimigo
        let dx = playerX - enemy.x;
        let dy = playerY - enemy.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Evitar divisão por zero
        if (distance < 1) return;

        // Normalizar a direção para evitar que o inimigo se mova mais rápido na diagonal
        let moveX = dx / distance;
        let moveY = dy / distance;

        // Movimento do inimigo
        enemy.x += moveX * 0.5;  // Velocidade de movimento (ajustável)
        enemy.y += moveY * 0.5;

        // Verificar se o inimigo atacou o jogador (colisão)
        if (distance < playerSize) {
            playerHealth -= 1; // Inimigo causa dano ao jogador
            console.log('Inimigo atacou o jogador! Vida restante: ' + playerHealth);
            if (playerHealth <= 0) {
                gameOver = true;
                ctx.fillStyle = 'white';
                ctx.font = '24px Arial';
                ctx.fillText('Game Over!', canvas.width / 2 - 50, canvas.height / 2);
                clearInterval(gameLoop); // Para o jogo
            }
        }

        // Atirar projétil
        shootProjectile(enemy);
    });

    // Ativa o chefe quando todos os inimigos forem derrotados
    if (enemies.length === 0 && !boss.active) {
        boss.active = true;
    }

    // Movimento e ataque do chefe
    if (boss.active && boss.health > 0) {
        // Calcular direção do movimento do chefe
        let dx = playerX - boss.x;
        let dy = playerY - boss.y;
        let distance = Math.sqrt(dx * dx + dy * dy);

        // Evitar divisão por zero
        if (distance < 1) return;

        // Normalizar a direção para o chefe
        let moveX = dx / distance;
        let moveY = dy / distance;

        // Movimento do chefe (mais lento que os inimigos)
        boss.x += moveX * 0.3; // Velocidade de movimento do chefe
        boss.y += moveY * 0.3;

        // Verificar se o chefe atacou o jogador (colisão)
        if (distance < playerSize + bossSize / 7) {
            playerHealth -= 2; // Chefe causa mais dano que inimigos
            console.log('Chefe atacou o jogador! Vida restante: ' + playerHealth);
            if (playerHealth <= 0) {
                gameOver = true;
                ctx.fillStyle = 'white';
                ctx.font = '24px Arial';
                ctx.fillText('Game Over!', canvas.width / 2 - 50, canvas.height / 2);
                clearInterval(gameLoop); // Para o jogo
            }
        }

        // Chefe atira projéteis
        shootProjectile(boss, true);
    }
}

// Função principal para desenhar o jogo
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpa a tela

    movePlayer();
    moveEnemies();  // Mover os inimigos e o chefe
    moveProjectiles(); // Mover os projéteis
    drawPlayer();
    drawEnemies();
    drawBoss();
    drawProjectiles();
    drawHealth();
    drawDoor();
    checkSwordCollision();
    checkProjectileCollision();
    checkDoorCollision();

    // Verifica se todos os inimigos foram derrotados
    if (enemies.length === 0 && boss.active && boss.health > 0) {
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText('Boss Fight!', canvas.width / 2 - 70, 40);
    } else if (boss.health <= 0) {
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText('Você ganhou! Vá para a próxima fase', canvas.width / 2 - 120, 40);
    }
}

// Inicializa o jogo
document.addEventListener('keydown', controlPlayer);
document.addEventListener('keyup', stopPlayerMovement);

// Inicia o loop do jogo
let gameLoop = setInterval(draw, 1000 / 60); // Atualiza 60 vezes por segundo

window.onload = function() {
    var audio = document.getElementById('backgroundMusic');
    audio.play();
}

botaoInicio.addEventListener('click', () => {
    botaoInicio.setAttribute('hidden', 'hidden');
   
    espada.setAttribute('hidden', 'hidden');
    canvas.removeAttribute('hidden');
    titulo.setAttribute('hidden', 'hidden');
    botaoVolta.removeAttribute('hidden', 'hidden');
});
// Variáveis para controle de pausa
let isPaused = false;

// Função para reiniciar o jogo
function restartGame() {
    currentLevel = 1;
    gameOver = false;
    playerHealth = 10;
    playerX = 50;
    playerY = canvas.height / 2;
    projectiles = [];
    isPaused = false;
    resetLevel();
    // Garantir que o game loop está rodando
    if (!gameLoop) {
        gameLoop = setInterval(draw, 1000 / 60);
    }
    // Esconder overlays
    document.getElementById('pauseOverlay').style.display = 'none';
    document.getElementById('gameOverOverlay').style.display = 'none';
    document.getElementById('victoryOverlay').style.display = 'none';
    // Mostrar canvas e navbar
    document.getElementById('gameCanvas').hidden = false;
    document.getElementById('navBar').hidden = false;
}

// Função para voltar à tela inicial
function goToMainMenu() {
    gameOver = true;
    clearInterval(gameLoop);
    gameLoop = null;
    // Esconder canvas, navbar e overlays
    document.getElementById('gameCanvas').hidden = true;
    document.getElementById('navBar').hidden = true;
    document.getElementById('pauseOverlay').style.display = 'none';
    document.getElementById('gameOverOverlay').style.display = 'none';
    document.getElementById('victoryOverlay').style.display = 'none';
    // Mostrar tela inicial
  
    document.getElementById('botaoInicio').hidden = false;
    document.getElementById('botaoCustom').hidden = false;
    document.getElementById('titulo').hidden = false;
    document.getElementById('Espada').parentElement.hidden = false;
}

// Função para pausar/resumir o jogo
function togglePause() {
    if (gameOver) return;
    isPaused = !isPaused;
    document.getElementById('pauseOverlay').style.display = isPaused ? 'flex' : 'none';
    document.getElementById('botaoPausar').textContent = isPaused ? 'RESUMIR' : 'PAUSAR';
}

// Atualizar draw para respeitar pausa
const originalDraw = draw;
draw = function() {
    if (isPaused || gameOver) return;
    originalDraw();
};

// Atualizar checkProjectileCollision para usar overlay de game over
const originalCheckProjectileCollision = checkProjectileCollision;
checkProjectileCollision = function() {
    originalCheckProjectileCollision();
    if (playerHealth <= 0) {
        gameOver = true;
        document.getElementById('gameOverOverlay').style.display = 'flex';
        clearInterval(gameLoop);
        gameLoop = null;
    }
};

// Atualizar moveEnemies para usar overlay de game over
const originalMoveEnemies = moveEnemies;
moveEnemies = function() {
    originalMoveEnemies();
    if (playerHealth <= 0) {
        gameOver = true;
        document.getElementById('gameOverOverlay').style.display = 'flex';
        clearInterval(gameLoop);
        gameLoop = null;
    }
};

// Atualizar resetLevel para usar overlay de vitória
const originalResetLevel = resetLevel;
resetLevel = function() {
    originalResetLevel();
    if (currentLevel > 3) {
        gameOver = true;
        document.getElementById('victoryOverlay').style.display = 'flex';
        clearInterval(gameLoop);
        gameLoop = null;
    }
};

// Event listeners para botões
document.getElementById('botaoReiniciar').addEventListener('click', restartGame);
document.getElementById('botaoVoltarNav').addEventListener('click', goToMainMenu);
document.getElementById('botaoPausar').addEventListener('click', togglePause);
document.getElementById('botaoResumir').addEventListener('click', togglePause);
document.getElementById('botaoReiniciarPausa').addEventListener('click', restartGame);
document.getElementById('botaoVoltarPausa').addEventListener('click', goToMainMenu);
document.getElementById('botaoReiniciarGameOver').addEventListener('click', restartGame);
document.getElementById('botaoVoltarGameOver').addEventListener('click', goToMainMenu);
document.getElementById('botaoReiniciarVictory').addEventListener('click', restartGame);
document.getElementById('botaoVoltarVictory').addEventListener('click', goToMainMenu);

// Atualizar botão de início para mostrar navbar
const originalBotaoInicioHandler = () => {
    botaoInicio.setAttribute('hidden', 'hidden');
    espada.setAttribute('hidden', 'hidden');
    canvas.removeAttribute('hidden');
    titulo.setAttribute('hidden', 'hidden');
    botaoVolta.removeAttribute('hidden', 'hidden');
};
botaoInicio.addEventListener('click', () => {
    originalBotaoInicioHandler();
    document.getElementById('navBar').hidden = false;
    document.getElementById('telaInicio').style.display = 'none';
});

// Inicializar tela inicial
document.getElementById('telaInicio').style.display = 'block';
console.log(`checkDoorCollision: currentLevel=${currentLevel}, gameOver=${gameOver}`);
console.log(`resetLevel: currentLevel=${currentLevel}`);