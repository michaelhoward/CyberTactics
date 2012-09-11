function editModeFlag()
{
	if (EDIT_MODE == false)
	{
		EDIT_MODE = true;
		screen.characters.width = screen.characters.width;
		document.getElementById('editor').style.visibility = 'visible';
		
		populateTileSelector();
		
		editor.selectedTileImage = 0;
		editor.currentTool = TOOL_EDIT;
		document.getElementById(editor.selectedTileImage).className = 'selectedTile';
		
		screen.foreground.onclick = editorScreenClick;
		document.getElementById('cutScene').value = world.currentMap.cutScene;
	}
	else
	{
		EDIT_MODE = false;
		document.getElementById('editor').style.visibility = 'hidden';
		screen.foreground.onclick = gameScreenClick;
		
	}
}

function populateTileSelector()
{
var tileSelector = document.getElementById('tiles');
tileSelector.innerHTML = "";

	for (var i=0; i<gameData.tileCache.length; i++)
	{
		var tempImage = gameData.tileCache[i];
		tempImage.id = i;
		tempImage.className = 'Tile';
		tempImage.onclick = selectTile;
		tileSelector.appendChild(tempImage);
	}
}

function populateTileEditor(x, y)
{
	document.getElementById('xPos').value = x;
	document.getElementById('yPos').value = y;
	document.getElementById('tileType').value = world.currentMap.tiles[x][y].type;
	document.getElementById('specialFlag').value = world.currentMap.tiles[x][y].flag;
	//document.getElementById('mapDestination').value = world.currentMap.tiles[x][y].mapDestination;
	document.getElementById('spawnID').value = world.currentMap.tiles[x][y].spawnID;
	document.getElementById('enemySpawnID').value = world.currentMap.tiles[x][y].enemySpawnID;
	document.getElementById('enemySpawnTrigger').value = world.currentMap.tiles[x][y].enemySpawnTrigger;
	document.getElementById('targetX').value = world.currentMap.tiles[x][y].targetX;
	document.getElementById('targetY').value = world.currentMap.tiles[x][y].targetY;
	document.getElementById('network').value = world.currentMap.tiles[x][y].network;
	document.getElementById('switchItemRequired').value = world.currentMap.tiles[x][y].switchItemRequired;
	document.getElementById('item').value = world.currentMap.tiles[x][y].switchItemRequired;
	
	//document.getElementById('completesLevel').value = world.currentMap.tiles[x][y].completesLevel;
}


function updateTile()
{
	var x = document.getElementById('xPos').value;
	var y = document.getElementById('yPos').value;
	world.currentMap.tiles[x][y].type = document.getElementById('tileType').value;
	world.currentMap.tiles[x][y].flag = document.getElementById('specialFlag').value;
	//world.currentMap.tiles[x][y].mapDestination = document.getElementById('mapDestination').value;
	world.currentMap.tiles[x][y].spawnID = parseInt(document.getElementById('spawnID').value);
	world.currentMap.tiles[x][y].enemySpawnID = parseInt(document.getElementById('enemySpawnID').value);
	world.currentMap.tiles[x][y].enemySpawnTrigger = parseInt(document.getElementById('enemySpawnTrigger').value);
	world.currentMap.tiles[x][y].targetX = parseInt(document.getElementById('targetX').value);
	world.currentMap.tiles[x][y].targetY = parseInt(document.getElementById('targetY').value);
	world.currentMap.tiles[x][y].network = parseInt(document.getElementById('network').value);
	world.currentMap.tiles[x][y].switchItemRequired = parseInt(document.getElementById('switchItemRequired').value);
	world.currentMap.tiles[x][y].item = parseInt(document.getElementById('item').value);
	//world.currentMap.tiles[x][y].completesLevel = document.getElementById('completesLevel').value;
}

function selectTile(e)
{
	document.getElementById(editor.selectedTileImage).className = 'Tile';
	e.target.className = 'selectedTile';
	editor.selectedTileImage = e.target.id;
}

function editorScreenClick(e)
{
	var clickedX = Math.floor((e.offsetX + screen.xPos)/TILE_WIDTH);
	var clickedY = Math.floor((e.offsetY + screen.yPos)/TILE_WIDTH);


	switch (editor.currentTool)
	{
	case TOOL_PAINT:
		if (document.getElementById('decalLayer').checked == true)
		{
			//if its already this decal, clear it
			if (world.currentMap.tiles[clickedX][clickedY].decalImage == editor.selectedTileImage)
			{
				world.currentMap.tiles[clickedX][clickedY].decalImage = -1;
			}
			else
			{
				world.currentMap.tiles[clickedX][clickedY].decalImage = editor.selectedTileImage;
			}
		}
		else
		{
			
			world.currentMap.tiles[clickedX][clickedY].image = editor.selectedTileImage;
		}
		
		generateBaseMap();
		screen.backgroundChanged = true;
		
	break;
	
	case TOOL_EDIT:
	populateTileEditor(clickedX, clickedY);
	break;
	
	case TOOL_BLOCK:
	
		if (world.currentMap.tiles[clickedX][clickedY].type == TILE_BLOCKED)
		{
			world.currentMap.tiles[clickedX][clickedY].type = TILE_OPEN;
		}
		else
		{
			world.currentMap.tiles[clickedX][clickedY].type = TILE_BLOCKED;
		}
	break;
	}
}

function gameScreenClick(e)
{
		var clickedX = Math.floor((e.offsetX + screen.xPos)/TILE_WIDTH);
		var clickedY = Math.floor((e.offsetY + screen.yPos)/TILE_WIDTH);


	//Log(clickedX+' '+clickedY);
	//Log(e);
	

	if (world.turn == TURN_AI)
	{
		return false;

	}

	if (gameData.cutScenePlaying == true)
	{
	clearCutScene();
	}


	for (var i=0; i<world.players.length; i++)
	{
		if ((clickedX == world.players[i].xPos)&&(clickedY == world.players[i].yPos))
		{
			if (world.players[i].isAlive())
			{
				world.selectedPlayer = i;
			
				//make the player details panel visible
				document.getElementById('playerDetails').style.visibility = 'visible';
				disableAttackMode();
				updatePlayerDetails();
				return true;
			
			}
		}	
	}


	if (world.selectedPlayer >= 0)
	{
	// we have a selected player, and detect movement clicks

		var playerX = world.players[world.selectedPlayer].xPos;
		var playerY = world.players[world.selectedPlayer].yPos;
		
		
		//if I'm in hack mode, process the click
		if (gameData.hackMode == true)
		{
			processHack(clickedX, clickedY);
			disableHackMode();
		}
		
		//if i'm in attack mode and i'm clicking on an entity, start an attack
		if (gameData.attackMode == true)
		{
			for (var i=0; i<world.currentMap.entities.length; i++)
			{	
				// dont bother with dead entities...
				if ((world.currentMap.entities[i].isAlive())&&(world.currentMap.entities[i].aiModel != AI_PSENTRY))
				{
					if ((clickedX == world.currentMap.entities[i].xPos)&&(clickedY == world.currentMap.entities[i].yPos))
					{
				
					if (lineOfSight(world.players[world.selectedPlayer], world.currentMap.entities[i]) >= 0)
					{
					// processAttack
						
						if (world.players[world.selectedPlayer].movesLeft() >0)
						{	
						world.players[world.selectedPlayer].useMove();
						processAttack(world.players[world.selectedPlayer], world.currentMap.entities[i]);
						
						disableAttackMode();
						}
						else
						{
							raiseNotification('No Moves remaining');
						}
					}
					else
					{
					raiseNotification("Cannot see target");
					}
					}
				}
				else
				{
				raiseNotification('Target is not alive');
				disableAttackMode();
				}
			}
		}

		else if ((clickedX == playerX)&&(clickedY == playerY -1))
		{
		//clicked UP
		
			if (world.players[world.selectedPlayer].isBlockedTileNorth() == false)
			{
			//TODO: Replace these with methods
				world.players[world.selectedPlayer].moveNorth();
			}
		}
		else if ((clickedX == playerX +1)&&(clickedY == playerY))
		{
			if (world.players[world.selectedPlayer].isBlockedTileEast() == false)
			{
		
				//clicked RIGHT
				world.players[world.selectedPlayer].moveEast();
			}
		}
		else if ((clickedX == playerX)&&(clickedY == playerY +1))
		{
		
			if (world.players[world.selectedPlayer].isBlockedTileSouth() == false)
			{
		//clicked DOWN
				world.players[world.selectedPlayer].moveSouth();
			}
		}
		else if ((clickedX == playerX -1)&&(clickedY == playerY))
		{
			if (world.players[world.selectedPlayer].isBlockedTileWest() == false)
			{
			//clicked LEFT
				world.players[world.selectedPlayer].moveWest();
				
			}
		}
		else
		{
					
			world.selectedPlayer = -1;
			document.getElementById('playerDetails').style.visibility = 'hidden';	
		}
	}
	
}


function enableAttackMode()
{
	gameData.attackMode = true;
	screen.foreground.style.cursor = "crosshair";
}

function disableAttackMode()
{
	gameData.attackMode = false;
	screen.foreground.style.cursor = "auto";
}

function enableHackMode()
{
	
	var playerX = world.players[world.selectedPlayer].xPos;
	var playerY = world.players[world.selectedPlayer].yPos;
	
	if (world.currentMap.tiles[playerX][playerY].flag == TILE_TYPE_HACK)
	{
			gameData.hackMode = true;
			world.selectedNetwork = parseInt(world.currentMap.tiles[playerX][playerY].network);
			raiseNotification('Infiltrating Network '+world.selectedNetwork);
			screen.foreground.style.cursor = "crosshair";
	}
}

function disableHackMode()
{
	gameData.hackMode = false;
	world.selectedNetwork = -1;
	screen.foreground.style.cursor = "auto";
}


function updateMapData()
{
	world.currentMap.cutScene = document.getElementById('cutScene').value;
	world.currentMap.startX = document.getElementById('startX').value;
	world.currentMap.startY = document.getElementById('startY').value;
}


function changeTool(e)
{
	switch(e.target.value)
	{
		case "Paint":
			editor.currentTool = TOOL_PAINT;
			document.getElementById('EditTool').style.display = 'none';
			document.getElementById('PaintTool').style.display = 'block';
		
		break;
		case "Edit":
			editor.currentTool = TOOL_EDIT;
			document.getElementById('EditTool').style.display = 'block';
			document.getElementById('PaintTool').style.display = 'none';
		break;
		case "Block":
			editor.currentTool = TOOL_BLOCK;
			document.getElementById('EditTool').style.display = 'none';
			document.getElementById('PaintTool').style.display = 'none';
		break;
	}
}


function displayNewGame()
{

	screen.background.style.visibility = 'hidden';
	screen.characters.style.visibility = 'hidden';
	screen.foreground.style.visibility = 'hidden';

	screen.statsScreen.style.visibility = 'hidden';
	screen.titleScreen.style.visibility = 'hidden';
	screen.newGame.style.visibility = 'visible';
	screen.missionSelectScreen.style.visibility = 'hidden';
}
/*
function newGame()
{

	screen.titleScreen.style.visibility = 'hidden';
	screen.newGame.style.visibility = 'hidden';
	screen.statsScreen.style.visibility = 'hidden';
	screen.background.style.visibility = 'visible';
	screen.characters.style.visibility = 'visible';
	screen.foreground.style.visibility = 'visible';

	startNewGame();
}
*/
function startMap(i)
{
	screen.titleScreen.style.visibility = 'hidden';
	screen.newGame.style.visibility = 'hidden';
	screen.statsScreen.style.visibility = 'hidden';
	screen.missionSelectScreen.style.visibility = 'hidden';
	
	screen.background.style.visibility = 'visible';
	screen.characters.style.visibility = 'visible';
	screen.foreground.style.visibility = 'visible';


	LoadMap(i);
}

function updatePlayerDetails()
{
	if (world.selectedPlayer >= 0)
	{	


	var xPos = world.players[world.selectedPlayer].xPos;
	var yPos = world.players[world.selectedPlayer].yPos;
		
	document.getElementById('selectedPlayerImage').src = gameData.charCache[FACING_LEFT][world.players[world.selectedPlayer].staticFrame].src;
	document.getElementById('maxHealth').style.width = world.players[world.selectedPlayer].maxHealth+'px';	
	document.getElementById('currentHealth').style.width = world.players[world.selectedPlayer].currentHealth+'px';
	document.getElementById('movesLeft').innerHTML = "Moves Remaining: "+world.players[world.selectedPlayer].movesLeft();
	document.getElementById('calcDexterity').innerHTML = world.players[world.selectedPlayer].calcDexterity;
	document.getElementById('calcFocus').innerHTML = world.players[world.selectedPlayer].calcFocus;
	document.getElementById('calcStealth').innerHTML = world.players[world.selectedPlayer].calcStealth;
	document.getElementById('calcHacking').innerHTML = world.players[world.selectedPlayer].calcHacking;
	document.getElementById('calcDamage').innerHTML = world.players[world.selectedPlayer].calcDamage;
	document.getElementById('calcArmour').innerHTML = world.players[world.selectedPlayer].calcArmour;
	document.getElementById('calcCritChance').innerHTML = world.players[world.selectedPlayer].calcCritChance;
	document.getElementById('calcCritResistChance').innerHTML = world.players[world.selectedPlayer].calcCritResistChance;
	document.getElementById('enableStealth').disabled = !world.players[world.selectedPlayer].isInInventory(INV_STEALTH_SUIT);
	document.getElementById('disableStealth').disabled = !world.players[world.selectedPlayer].isInInventory(INV_STEALTH_SUIT);
	document.getElementById('hackTerminal').disabled = !((world.players[world.selectedPlayer].isInInventory(INV_HACKING_MODULE))&&(world.currentMap.tiles[xPos][yPos].flag == TILE_TYPE_HACK));


	var inventory = document.getElementById('inventory');
	inventory.innerHTML = "";

	for (var i=0; i<world.players[world.selectedPlayer].inventory.length; i++)
	{
		var tempImage = gameData.imageCache[world.players[world.selectedPlayer].inventory[i].image];
		tempImage.id = i;
		tempImage.title = world.players[world.selectedPlayer].inventory[i].title;
		//Log('adding item to inventory display');
		//tempImage.className = 'Inventory';
		inventory.appendChild(tempImage);
	}


	var loot = document.getElementById('loot');
	loot.innerHTML = "";

	var lootItem = parseInt(world.currentMap.tiles[xPos][yPos].item);

	if (lootItem >= 0)
	{
		var tempLoot = new InventoryItem(lootItem);
		Log(tempLoot.image);
		var tempImage = gameData.imageCache[tempLoot.image];
		tempImage.id = 'lootImage';
		loot.appendChild(tempImage);
	

		var pickup = document.createElement('button');
		pickup.onclick = pickUpLoot;
		pickup.innerHTML = 'Pickup';
		loot.appendChild(pickup);
	}

	}
}

function pickUpLoot()
{
	world.players[world.selectedPlayer].pickUpInventoryItem();
}

function enableStealth()
{
	world.players[world.selectedPlayer].stealthEnabled = true;
}

function disableStealth()
{
	world.players[world.selectedPlayer].stealthEnabled = false;
}

function updatePlayerSelectImage(e)
{

	var target;

	switch (e.target.id)
	{
		case 'teamMember1':
		target = 'playerSelect1';
		break;

		case 'teamMember2':
		target = 'playerSelect2';
		break;
		case 'teamMember3':
		target = 'playerSelect3';
		break;
		default:
		break;	
	}
	
	switch (parseInt(e.target.value))
	{

		case 0:
		document.getElementById(target).src = './images/char-000.png';
		break;
		case 1:
		document.getElementById(target).src = './images/char-400.png';
		break;
		case 2:
		document.getElementById(target).src = './images/char-200.png';
		break;
				
	}
}


function updateStatsScreen()
{
	document.getElementById('statsKills').innerHTML = gameData.kills;
	document.getElementById('statsDamageApplied').innerHTML = gameData.damageApplied;
	document.getElementById('statsDamageTaken').innerHTML = gameData.damageTaken;
	document.getElementById('statsTurnsTaken').innerHTML = gameData.turnsTaken;
	
}

function displayStatsScreen()
{

	screen.background.style.visibility = 'hidden';
	screen.characters.style.visibility = 'hidden';
	screen.foreground.style.visibility = 'hidden';

	screen.statsScreen.style.visibility = 'visible';
	screen.titleScreen.style.visibility = 'hidden';
	screen.newGame.style.visibility = 'hidden';
	screen.missionSelectScreen.style.visibility = 'hidden';
		updateStatsScreen();

}

function displayMissionSelect()
{

	
	Log('Changing Active screen to mission select');
	populateMissionSelect();
	screen.background.style.visibility = 'hidden';
	screen.characters.style.visibility = 'hidden';
	screen.foreground.style.visibility = 'hidden';

	screen.statsScreen.style.visibility = 'hidden';
	screen.titleScreen.style.visibility = 'hidden';
	screen.newGame.style.visibility = 'hidden';
	screen.missionSelectScreen.style.visibility = 'visible';

	Log(screen.missionSelectScreen.style.visibility);
	
	
	Log('Active switch complete');
}


function populateMissionSelect()
{
Log('Populating Mission Select List');
document.getElementById('missionList').innerHTML = "";
	for (var i=0; i<gameData.maps.length; i++)
	{
		if ((gameData.maps[i].unlocked == true)&&(gameData.maps[i].completed == false))
		{
			var tempRow = document.createElement('tr');
			var tempTitle = document.createElement('td');
			var tempDescription = document.createElement('td');
			var tempSelect = document.createElement('td');

			tempTitle.innerHTML = gameData.maps[i].title;
			tempDescription.innerHTML = gameData.maps[i].description;

			var tempSelectButton = new Image();
			tempSelectButton.src = './images/select.png';
			var map = i;
			tempSelectButton.className = 'button';
			tempSelectButton.onclick = function () {startMap(map);};
			//Log(tempSelectButton.onclick);
			tempSelect.appendChild(tempSelectButton);

			tempRow.appendChild(tempTitle);
			tempRow.appendChild(tempDescription);
			tempRow.appendChild(tempSelect);

			
			document.getElementById('missionList').appendChild(tempRow);

		}
	}

Log('Completed Populating Mission Select List');
}

