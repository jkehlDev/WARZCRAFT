  /*
   * ----------------------------------------------------------------------------
   * "THE BEER-WARE LICENSE" (Revision 42):
   * <jkehl.dev@gmail.com> wrote this file. As long as you retain this notice you
   * can do whatever you want with this stuff. If we meet some day, and you think
   * this stuff is worth it, you can buy me a beer in return Johann KEHL.
   * ----------------------------------------------------------------------------
   */
  let pathGen = {
      param: {
          PROC_DURATION_MAX: 25, //temps d'exécution max recherche de chemin (millisecondes)
          DIRECTIONS_ARRAY: [],
      },
      obj: {
          cell: function(pPosX, pPosY) {
              this.posX = pPosX;
              this.posY = pPosY;
              this.distTo = function(pCellTo) {
                  return Math.abs(pCellTo.posX - this.posX) + Math.abs(pCellTo.posY - this.posY);
              };
              this.clone = function() {
                  return new pathGen.obj.cell(this.posX, this.posY);
              };
          },
          pathCell: function(pPosX, pPosY, pDirObj) {
              this.cell = new pathGen.obj.cell(pPosX, pPosY);
              this.dirObj = pDirObj;
              this.clone = function() {
                  return new pathGen.obj.pathCell(this.cell.posX, this.cell.posY, this.dirObj);
              };
              this.equalTo = function(pCellTo) {
                  return cell.distTo(pCellTo) == 0;
              };
          },
          pathObj: function() {
              this.pathArray = [];
              this.mapArray = new Map();
              this.isInPath = function(pPathCell) {
                  return this.mapArray.has(`${pPathCell.cell.posX}_${pPathCell.cell.posY}`);
              };
              this.push = function(pPathCell) {
                  if (!isInPath(pPathCell)) {
                      this.mapArray.set(`${pPathCell.cell.posX}_${pPathCell.cell.posY}`, this.pathArray.length);
                      this.pathArray.push(pPathCell);
                  }
              };
              this.shift = function() {
                  let pathCell = null;
                  if (this.pathArray.length > 0) {
                      pathCell = this.pathArray.shift();
                      this.mapArray.delete(`${pathCell.cell.posX}_${pathCell.cell.posY}`);
                  }
                  return pathCell;
              };
              this.last = function() {
                  let lastPathCell = null;
                  if (this.pathArray.length > 0) {
                      lastPathCell = this.pathArray(this.pathArray.length - 1).clone();
                  }
                  return lastPathCell;
              };
              this.first = function() {
                  let firstPathCell = null;
                  if (this.pathArray.length > 0) {
                      firstPathCell = this.pathArray(0).clone();
                  }
                  return firstPathCell;
              };
              this.clone = function() {
                  let clonePath = new pathGen.obj.pathObj();
                  this.pathArray.forEach(pathCell => {
                      clonePath.push(pathCell.clone());
                  });
                  return clonePath;
              };
              this.pathLength = function() {
                  return this.pathArray.length;
              };
          },
          mapCell: function(pPosX, pPosY, pCdType) {
              this.index = `${pPosX}_${pPosY}`;
              this.cell = new pathGen.obj.cell(pPosX, pPosY);
              this.cdType = pCdType;
              this.clone = function() {
                  return new pathGen.obj.mapCell(this.cell.posX, this.cell.posY, this.cdType);
              };
          },
          mapObj: function(pMapArray) {
              this.map = new Map();
              for (let posY = 0; posY < pMapArray.length; posY++) {
                  const row = pMapArray[posY];
                  for (let posX = 0; posX < array.length; posX++) {
                      const mapCell = new pathGen.obj.mapCell(posX, posY, row[posX]);
                      this.map.set(mapCell.index, mapCell);
                  }
              }
              this.getCellType = function(pCell) {
                  if (!this.map.has(`${pCell.posX}_${pCell.posY}`)) {
                      return this.map.get(`${pCell.posX}_${pCell.posY}`).cdType;
                  }
                  return -1;
              };
              this.changeCellType = function(pCell, pCdType) {
                  if (!this.map.has(`${pCell.posX}_${pCell.posY}`)) {
                      let mapCell = this.map.get(`${pCell.posX}_${pCell.posY}`);
                      mapCell.cdType = pCdType;
                      this.map.set(`${pCell.posX}_${pCell.posY}`, mapCell);
                  }
              }
              this.setCell = function(pMapCell) {
                  this.map.set(pMapCell.index, pMapCell);
              }
              this.clone = function() {
                  let cloneMap = new pathGen.obj.mapObj([]);
                  for (const mapCell in this.map.values()) {
                      cloneMap.setCell(mapCell.index, mapCell.clone());
                  }
                  return cloneMap;
              }
          },
          dirObj: function(pIndex, pOffsetX, pOffsetY) {
              this.index = pIndex;
              this.offsetX = pOffsetX;
              this.offsetY = pOffsetY;
              this.clone = function() {
                  return new pathGen.obj.dirObj(this.index, this.offsetX, this.offsetY);
              };
          }
      },
      utils: {
          getPriorisedDirections: function(pDirectionsArray, pFromPathCell, pToCell) {
              return pDirectionsArray.sort(function(dir1, dir2) {
                  let cellFrm1 = new pathGen.obj.cell(dir1.offsetX + pFromPathCell.cell.posX, dir1.offsetY + pFromPathCell.cell.posY);
                  let malus1 = Math.abs(dir1.offsetX + pFromPathCell.dirObj.offsetX) + Math.abs(dir1.offsetY + pFromPathCell.dirObj.offsetY) == 0 ? 1 : 0;
                  let dist1 = pToCell.getDist(cellFrm1) + malus1;

                  let cellFrm2 = new pathGen.obj.cell(dir2.offsetX + pFromPathCell.cell.posX, dir2.offsetY + pFromPathCell.cell.posY);
                  let malus2 = Math.abs(dir2.offsetX + pFromPathCell.dirObj.offsetX) + Math.abs(dir2.offsetY + pFromPathCell.dirObj.offsetY) == 0 ? 1 : 0;
                  let dist2 = pToCell.getDist(cellFrm2) + malus2;

                  return dist1 - dist2;
              });
          },
          searchPath: function(currentPathCell, mapObj, targetCell, pathLengthMax, processDurationMax) {
              let nextPathObj = null;
              let t0 = performance.now();

              function getPath(pCurrentPathObj, pCurrentPathLength) {
                  if (performance.now() - t0 > processDurationMax) {
                      return;
                  }
                  let currentPathLength = pCurrentPathLength + 1;
                  if (currentPathLength > pathLengthMax) {
                      return;
                  }
                  if (nextPathObj != null) {
                      if (nextPathObj.pathLength() <= currentPathLength) {
                          return;
                      }
                  }
                  let currentPathCell = pCurrentPathObj.last();
                  let directions = pathGen.utils.getPriorisedDirections(pathGen.param.DIRECTIONS_ARRAY, currentPathCell, targetCell);
                  for (let index = 0; index < directions.length; index++) {
                      let pathObj_test = fromPathCell.clone();
                      let pathCell_test = new pathGen.obj.pathCell(currentPathCell.posX + directions[index].offsetX, currentPathCell.posY + directions[index].offsetY, directions[index].index);
                      if (mapObj.getCellType(pathCell_test.cell) === 0 && !pathObj_test.isInPath(pathCell_test)) {
                          pathObj_test.path.push(pathCell_test);
                          if (pathCell_test.equalTo(targetCell)) {
                              nextPathObj = pathObj_test.clone();
                              return;
                          } else {
                              getPath(pathObj_test, currentPathLength);
                          }
                      }
                  }
              }
              let seedPathObj = new pathGen.obj.pathObj();
              seedPathObj.push(currentPathCell);
              getPath(seedPathObj, 0);

              return nextPathObj;
          }
      },
      nextPath: function(player1, player2, mapObj) {
          let player1_nextPathObj = pathGen.utils.searchPath(player1.pathCell.clone(), mapObj.clone(), player2.pathCell.cell.clone(), player1.pathLengthMax, pathGen.param.PROC_DURATION_MAX);
          if (player1_nextPathObj != null) {
              player1.pathObj = player1_nextPathObj;
          }
          if (player1.pathObj != null && player1.pathObj.pathLength() > 0) {
              player1.pathObj.shift();
              player1.pathCell = player1.pathObj.first();
          }
      }
  }
