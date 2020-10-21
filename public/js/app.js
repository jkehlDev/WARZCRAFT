/*
 * ----------------------------------------------------------------------------
 * "THE BEER-WARE LICENSE" (Revision 42):
 * <jkehl.dev@gmail.com> wrote this file. As long as you retain this notice you
 * can do whatever you want with this stuff. If we meet some day, and you think
 * this stuff is worth it, you can buy me a beer in return Johann KEHL
 * ----------------------------------------------------------------------------
 */
var app = {
    init: function() {
        app.game.gameEnd = false;
        app.game.levelMap = 0;
        app.game.difficulty = 0;

        app.parameter.map.mapCard = app.tools.cloneArray(mapCard.MAPBOOK[app.game.levelMap]);
        app.map.genMapTypes();
        app.map.genMap();
        app.game.genPlayer();

        for (const key of app.game.players.keys()) {
            app.game.colorPlayer(key);
        }

        app.game.pnjTimer = Math.floor(app.parameter.TIMER_DEFAULT / (1 + app.game.difficulty));

        app.elements.footer.appendChild(app.elements.gamePanel);
        app.elements.restartBt.style.display = 'none';
        app.elements.infoTitle.textContent = 'RULES';
        app.elements.infoArticle.innerHTML = 'FEAR THE WALKING DEAD <br><br> Press arrow touche to escape from walking dead and join your safe mine.<br>After each victory difficulty increase<br><br>[Arrow Left] moove left<br>[Arrow Up] moove Up<br>[Arrow Right] moove Right<br>[Arrow Down] moove Down';


        app.game.gameMusic.setAttribute('loop', 'true');
        app.game.retroMusic.setAttribute('loop', 'true');

        app.game.refeshGamePanel();
        app.tools.listenPlayEvents();
    },
    elements: {
        gridNode: document.getElementById('grid'),
        footer: document.getElementById('footer'),
        scoreNode: document.getElementById('gamePanel_score'),
        difficultyNode: document.getElementById('gamePanel_difficulty'),
        gamePanel: document.getElementById('gamePanel'),
        infoPanel: document.getElementById('infoPanel'),
        infoTitle: document.getElementById('infoPanel_title'),
        infoArticle: document.getElementById('infoPanel_section'),
        playBt: document.getElementById('infoPanel_playBt'),
        restartBt: document.getElementById('infoPanel_restartBt')
    },
    const: {
        HUMAN_ID: 'human',
        PNJ_ID: 'pnj',
        MESS_GAMEWIN: 'You succes to escape from walking dead !!',
        MESS_GAMELOSE: 'Not a lucky day... <br> The walking dead beat you !',
    },
    parameter: {
        DEPTH_LOOP_MAX: 20,
        DEPTH_TIME_MAX: 80,
        TIMER_DEFAULT: 1000,
        map: {
            ROW_COUNT: 10,
            COLUMN_COUNT: 10,
            CELL_SIZE: '70',
            mapCard: [],
        },
        mapTypes: [],
        directions: [{
            index: 0,
            offsetX: 1, //right
            offsetY: 0,
            backgroundPositionXFactor: 0
        }, {
            index: 1,
            offsetX: 0, //down
            offsetY: 1,
            backgroundPositionXFactor: -3
        }, {
            index: 2,
            offsetX: -1, //left
            offsetY: 0,
            backgroundPositionXFactor: -1
        }, {
            index: 3,
            offsetX: 0, //top
            offsetY: -1,
            backgroundPositionXFactor: -2
        }]
    },
    game: {
        gameMusic: new Audio("./sound/game.mp3"),
        retroMusic: new Audio("./sound/retro.mp3"),
        retroTimeOutId: null,
        zombieMusic: new Audio("./sound/zombie.mp3"),
        bloodMusic: new Audio("./sound/blood.mp3"),
        levelMap: 0,
        difficulty: 0,
        players: null,
        gameEnd: null,
        pnjTimer: null,
        pnjTimerId: null,
        start: function() {
            if (app.game.retroTimeOutId != null) {
                clearTimeout(app.game.retroTimeOutId);
            }
            document.removeEventListener('keyup', app.tools.catchEnterUp);
            app.parameter.map.mapCard = app.tools.cloneArray(mapCard.MAPBOOK[app.game.levelMap]);
            app.map.genMapTypes();
            app.map.genMap();
            app.game.genPlayer();
            app.game.refeshGamePanel();
            for (const key of app.game.players.keys()) {
                app.game.colorPlayer(key);
            }
            app.elements.infoPanel.animate([{
                transform: `scale(1)`
            }, {
                transform: 'scale(0)'
            }], {
                duration: 1000,
                direction: 'normal',
                easing: 'ease-in'
            });
            setTimeout(() => {
                app.game.gameEnd = false;
                app.tools.listenKeyboardEvents();
                app.game.retroMusic.pause();
                app.game.gameMusic.play();
                app.elements.infoPanel.style.display = 'none';
                app.elements.footer.appendChild(app.elements.gamePanel);
                app.game.pnjTimer = Math.floor(app.parameter.TIMER_DEFAULT / (1 + app.game.difficulty));
                app.tools.setTimerPnjMoove(app.game.pnjTimer);
            }, 500);
        },
        stop: function() {
            app.game.gameMusic.pause();
            document.removeEventListener('keyup', app.tools.catchKeyUp);
            clearInterval(app.game.pnjTimerId);
            setTimeout(() => {
                app.elements.infoPanel.style.display = 'flex';
                if (app.elements.restartBt.style.display == 'none') {
                    app.elements.restartBt.style.display = 'block';
                }
                app.elements.infoArticle.after(app.elements.gamePanel);
                app.elements.infoPanel.animate([{
                    transform: `scale(0)`
                }, {
                    transform: 'scale(1)'
                }], {
                    duration: 150,
                    direction: 'normal',
                    easing: 'ease-in'
                });
                setTimeout(() => {
                    app.tools.listenEnterEvents();
                }, 50);
            }, 50);
        },
        genPlayer: function() {
            function getPlayer(backgroundPositionY, backgroundPositionXOffset, posX, posY, direction, score, cellPath) {
                return {
                    backgroundPositionY: backgroundPositionY,
                    backgroundPositionXOffset: backgroundPositionXOffset,
                    posX: posX,
                    posY: posY,
                    direction: direction,
                    score: score,
                    cellPath: cellPath
                };
            }
            app.game.players = new Map();
            app.game.players.set(app.const.HUMAN_ID, getPlayer('0px', 70, 0, 0, 0, 0, null));
            app.game.players.set(app.const.PNJ_ID, getPlayer('-70px', 70, 9, 9, 2, 0, null));
        },
        updateGameEnd: function() {
            var player = app.game.players.get(app.const.HUMAN_ID);
            app.game.gameEnd = app.parameter.mapTypes[app.parameter.map.mapCard[player.posY][player.posX]].isTarget;

            var pnj = app.game.players.get(app.const.PNJ_ID);
            var isGameOver = (pnj.posY == player.posY) && (pnj.posX == player.posX);

            app.game.gameEnd = app.game.gameEnd || isGameOver;

            if (app.game.gameEnd) {
                app.game.stop();
                var playerNode = document.getElementById('Player--' + app.const.HUMAN_ID);
                var cellPosNode = document.getElementById(`Cell_${player.posX}_${player.posY}`);
                cellPosNode.removeChild(playerNode);
                if (isGameOver) {
                    app.game.zombieMusic.play();
                    setTimeout(() => {
                        app.game.bloodMusic.play();
                    }, 1000);

                    if (app.game.pnjTimer <= app.parameter.TIMER_DEFAULT) {
                        app.game.difficulty -= 0.25;
                    }
                    app.elements.infoTitle.textContent = 'GAME OVER';
                    app.elements.infoArticle.innerHTML = app.const.MESS_GAMELOSE;
                    app.game.retroTimeOutId = setTimeout(() => {
                        app.game.retroMusic.play();
                    }, 2000)
                } else {
                    cellPosNode.setAttribute('data-style-name', app.parameter.mapTypes[3].type);
                    app.map.colorMap();
                    if (app.game.pnjTimer > 100) {
                        app.game.difficulty += 0.25;
                    }
                    app.elements.infoTitle.textContent = 'WIN';
                    app.elements.infoArticle.innerHTML = app.const.MESS_GAMEWIN;
                    app.game.retroTimeOutId = setTimeout(() => {
                        app.game.retroMusic.play();
                    }, 50);
                }
                if (app.game.levelMap < mapCard.MAPBOOK.length - 1) {
                    app.game.levelMap++;
                } else {
                    app.game.levelMap = 0;
                }
            }
        },
        mvUp: function(playerId) {
            var player = app.game.players.get(playerId);
            player.direction = 3;
            app.game.players.set(playerId, player);
            app.game.mvForward(playerId);
        },
        mvLeft: function(playerId) {
            var player = app.game.players.get(playerId);
            player.direction = 2;
            app.game.players.set(playerId, player);
            app.game.mvForward(playerId);
        },
        mvRight: function(playerId) {
            var player = app.game.players.get(playerId);
            player.direction = 0;
            app.game.players.set(playerId, player);
            app.game.mvForward(playerId);
        },
        mvDown: function(playerId) {
            var player = app.game.players.get(playerId);
            player.direction = 1;
            app.game.players.set(playerId, player);
            app.game.mvForward(playerId);
        },
        mvForward: function(playerId) {
            var player = app.game.players.get(playerId);
            var nextX = player.posX + app.parameter.directions[player.direction].offsetX;
            var nextY = player.posY + app.parameter.directions[player.direction].offsetY;
            if (app.map.isInMapRange(nextX, nextY)) {
                var isNotObstacle = !app.parameter.mapTypes[app.parameter.map.mapCard[nextY][nextX]].isObstacle
                if (isNotObstacle) {
                    player.posX = nextX;
                    player.posY = nextY;
                    player.score++;
                    app.game.players.set(playerId, player);
                    app.game.colorPlayer(playerId);
                    app.game.refeshGamePanel();
                    app.game.updateGameEnd();
                }
            }
        },
        trnLeft: function(playerId) {
            var player = app.game.players.get(playerId);
            player.direction = (player.direction + 3) % 4;
            app.game.players.set(playerId, player);
            app.game.colorPlayer(playerId);
            app.game.updateGameEnd();
        },
        trnRight: function(playerId) {
            var player = app.game.players.get(playerId);
            player.direction = (player.direction + 1) % 4;
            app.game.players.set(playerId, player);
            app.game.colorPlayer(playerId);
            app.game.updateGameEnd();
        },
        refeshGamePanel: function() {
            app.elements.scoreNode.textContent = new Intl.NumberFormat("en-IN", {
                minimumIntegerDigits: 3
            }).format(app.game.players.get(app.const.HUMAN_ID).score);
            app.elements.difficultyNode.textContent = `${(1+app.game.difficulty)*100}%`;
        },
        colorPlayer: function(playerId) {
            var player = app.game.players.get(playerId);
            var playerNode = document.getElementById(`Player--${playerId}`);
            if (playerNode == null) {
                playerNode = document.createElement('div');
                playerNode.id = `Player--${playerId}`;
                playerNode.classList.add('player');
            }
            var backgroundPositionXFactor = app.parameter.directions[player.direction].backgroundPositionXFactor;
            playerNode.style.backgroundPositionX = player.backgroundPositionXOffset * backgroundPositionXFactor + 'px';
            playerNode.style.backgroundPositionY = player.backgroundPositionY;

            var newPosNode = document.getElementById(`Cell_${player.posX}_${player.posY}`);
            if (!newPosNode.contains(playerNode)) {
                newPosNode.appendChild(playerNode);
                let translateX = `${-app.parameter.directions[player.direction].offsetX*app.parameter.map.CELL_SIZE}px`;
                let translateY = `${-app.parameter.directions[player.direction].offsetY*app.parameter.map.CELL_SIZE}px`;
                playerNode.animate([{
                    transform: `translate(${translateX},${translateY})`
                }, {
                    transform: 'translate(0,0)'
                }], {
                    duration: 75,
                    direction: 'normal',
                    easing: 'ease-out'
                });
            }
        }
    },
    map: {
        genMapTypes: function() {
            function cellMap(type, isObstacle, isTarget, backgroundColor, backgroundPositionX) {
                return {
                    type: type,
                    isObstacle: isObstacle,
                    isTarget: isTarget,
                    backgroundColor: backgroundColor,
                    backgroundPositionX: backgroundPositionX
                };
            }
            app.parameter.mapTypes = [];
            app.parameter.mapTypes.push(cellMap('grass', false, false, 'lightgreen', '0px'));
            app.parameter.mapTypes.push(cellMap('mine', false, true, 'black', '-140px'));
            app.parameter.mapTypes.push(cellMap('tree', true, false, 'green', '-70px'));
            app.parameter.mapTypes.push(cellMap('mine_win', false, true, 'red', '-210px'));
        },
        genMap: function() {
            app.map.clearGrid();
            app.map.genGrid();

            app.map.colorMap();
            app.map.applyMapBorder();
        },
        clearGrid: function() {
            app.tools.clearDiv(app.elements.gridNode);
        },
        applyMapBorder() {
            document.getElementById(`Cell_0_0`).classList.add('cell--cornerTopLeft');
            document.getElementById(`Cell_0_${app.parameter.map.ROW_COUNT-1}`).classList.add('cell--cornerBottomLeft');
            document.getElementById(`Cell_${app.parameter.map.COLUMN_COUNT-1}_0`).classList.add('cell--cornerTopRight');
            document.getElementById(`Cell_${app.parameter.map.COLUMN_COUNT-1}_${app.parameter.map.ROW_COUNT-1}`).classList.add('cell--cornerBottomRight');
        },
        colorMap: function() {
            app.parameter.mapTypes.forEach(function(cellMap) {
                var nodes = document.querySelectorAll('[data-style-name="' + cellMap.type + '"');
                nodes.forEach(function(node) {
                    node.style.backgroundColor = cellMap.backgroundColor;
                    node.style.backgroundPositionX = cellMap.backgroundPositionX;
                });
            });
        },
        genGrid: function() {
            app.elements.gridNode.style.backgroundRepeat;
            for (var index = 0; index < app.parameter.map.ROW_COUNT; index++) {
                app.map.genRow(app.parameter.map.mapCard[index], index);
            }
        },
        genRow: function(rowCard, posY) {
            var rowNode = document.createElement('div');
            rowNode.classList.add('row');
            for (var index = 0; index < app.parameter.map.COLUMN_COUNT; index++) {
                app.map.genCell(rowCard[index], rowNode, index, posY);
            }
            app.elements.gridNode.appendChild(rowNode);
        },
        genCell: function(cellCard, rowNode, posX, posY) {
            var cell = document.createElement('div');
            cell.id = `Cell_${posX}_${posY}`;
            cell.classList.add('cell');
            cell.setAttribute('data-style-name', app.parameter.mapTypes[cellCard].type);
            rowNode.appendChild(cell);
        },
        isInMapRange: function(posX, posY) {
            return posX < app.parameter.map.COLUMN_COUNT && posX >= 0 && posY < app.parameter.map.ROW_COUNT && posY >= 0;
        }
    },
    tools: {
        cloneArray: function(arrayToClone) {
            let myArray = [];
            arrayToClone.forEach(element => {
                if (Array.isArray(element)) {
                    myArray.push(app.tools.cloneArray(element));
                } else if (typeof element === 'object') {
                    myArray.push(Object.assign({}, element));
                } else {
                    myArray.push(element);
                }
            });
            return myArray;
        },
        clearDiv: function(node) {
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
        },
        listenPlayEvents: function() {
            app.elements.infoPanel.addEventListener('submit', app.tools.doStartGame);
        },
        doStartGame: function(event) {
            event.preventDefault();
            if (event.submitter == app.elements.restartBt) {
                app.init();
            } else {
                app.game.start();
            }
        },
        setTimerPnjMoove: function(timer) {
            app.game.pnjTimerId = window.setInterval(app.tools.doPnjMoove, timer);
        },
        doPnjMoove: function() {
            app.pnj.mooveNearTo(app.const.PNJ_ID, app.const.HUMAN_ID);
            app.game.updateGameEnd();
        },
        listenKeyboardEvents: function() {
            document.addEventListener('keyup', app.tools.catchKeyUp);
        },
        catchKeyUp: function(event) {
            if (event.defaultPrevented) {
                return;
            }
            if (!app.game.gameEnd) {
                switch (event.code) {
                    case 'ArrowUp':
                        app.game.mvUp(app.const.HUMAN_ID);
                        break;
                    case 'ArrowLeft':
                        app.game.mvLeft(app.const.HUMAN_ID);
                        break;
                    case 'ArrowRight':
                        app.game.mvRight(app.const.HUMAN_ID);
                        break;
                    case 'ArrowDown':
                        app.game.mvDown(app.const.HUMAN_ID);
                        break;
                }
            }
            event.preventDefault();
        },
        listenEnterEvents: function() {
            document.addEventListener('keyup', app.tools.catchEnterUp);
        },
        catchEnterUp: function(event) {
            if (event.code == 'Enter') {
                document.removeEventListener('keyup', app.tools.catchEnterUp);
                app.game.start();
            }
        }
    },
    pnj: {
        tools: {
            cloneCellPath: function(cellPath) {
                return {
                    path: app.tools.cloneArray(cellPath.path),
                    map: app.tools.cloneArray(cellPath.map)
                };
            },
            getCell: function(posX, posY, direction) {
                return {
                    posX: posX,
                    posY: posY,
                    direction: direction
                };
            },
            getDist(pCell1, pCell2) {
                return Math.abs(pCell2.posX - pCell1.posX) + Math.abs(pCell2.posY - pCell1.posY)
            },
            isEnableCell: function(pCellTest, pCellPath) {
                if (pCellPath.map[pCellTest.posY] != null) {
                    if (pCellPath.map[pCellTest.posY][pCellTest.posX] != null) {
                        return pCellPath.map[pCellTest.posY][pCellTest.posX] == 0;
                    }
                }
                return false;
            },

            isPlayerCell: function(cell, pPlayerId) {
                var player = app.game.players.get(pPlayerId);
                return (cell.posY == player.posY) && (cell.posX == player.posX);
            }
        },
        mooveNearTo: function(pnjId, playerIdTo) {
            var betterPath = null;
            var directions = app.tools.cloneArray(app.parameter.directions);

            var pnj = app.game.players.get(pnjId);
            var pnjCell = app.pnj.tools.getCell(pnj.posX, pnj.posY, 0);

            var human = app.game.players.get(playerIdTo);
            var humanCell = app.pnj.tools.getCell(human.posX, human.posY, 0);

            directions.sort(function(o1, o2) {
                let cell1 = app.pnj.tools.getCell(pnjCell.posX + o1.offsetX, pnjCell.posY + o1.offsetY, 0);
                let dist1Major = (pnj.direction == ((o1.index + 2) % 4) ? 1 : 0);
                let cell2 = app.pnj.tools.getCell(pnjCell.posX + o2.offsetX, pnjCell.posY + o2.offsetY, 0);
                let dist2Major = (pnj.direction == ((o2.index + 2) % 4) ? 1 : 0);
                return (app.pnj.tools.getDist(cell1, humanCell) + dist1Major) - (app.pnj.tools.getDist(cell2, humanCell) + dist2Major);
            });

            var t0 = performance.now();

            function getPath(cellPath, cellFrm, pDepth_count) {
                let depth_count = pDepth_count + 1;
                if (performance.now() - t0 > app.parameter.DEPTH_TIME_MAX) {
                    return;
                }
                if (depth_count > app.parameter.DEPTH_LOOP_MAX) {
                    return;
                }
                if (betterPath != null) {
                    if (cellPath.path.length >= betterPath.path.length) {
                        return;
                    }
                }

                for (let index = 0; index < directions.length; index++) {
                    let cellPath_tmp = app.pnj.tools.cloneCellPath(cellPath);
                    let cellTest = app.pnj.tools.getCell(cellFrm.posX + directions[index].offsetX, cellFrm.posY + directions[index].offsetY, directions[index].index);
                    if (app.pnj.tools.isEnableCell(cellTest, cellPath_tmp)) {
                        cellPath_tmp.path.push(cellTest);
                        cellPath_tmp.map[cellTest.posY][cellTest.posX] = 1;
                        if (app.pnj.tools.isPlayerCell(cellTest, playerIdTo)) {
                            if (betterPath != null) {
                                betterPath = cellPath_tmp.path.length < betterPath.path.length ? cellPath_tmp : betterPath;
                            } else {
                                betterPath = cellPath_tmp;
                            }
                            return;
                        } else {
                            getPath(cellPath_tmp, cellTest, depth_count);
                        }
                    }
                }
            }

            let mapTest = app.tools.cloneArray(app.parameter.map.mapCard);
            mapTest[pnjCell.posY][pnjCell.posX] = 1;

            getPath(app.pnj.tools.cloneCellPath({
                path: [pnjCell],
                map: mapTest
            }), pnjCell, 0);
            if (betterPath != null) {
                betterPath.path.shift();
                pnj.cellPath = betterPath;
            }
            if (pnj.cellPath != null && pnj.cellPath.path.length > 0) {
                let cellNext = pnj.cellPath.path.shift();
                pnj.posX = cellNext.posX;
                pnj.posY = cellNext.posY;
                pnj.direction = cellNext.direction;
                app.game.players.set(pnjId, pnj);
                app.game.colorPlayer(pnjId);
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', app.init);
