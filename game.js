
// ================
//
// CT - v0.4
// Michael Howard
// 
//
// ================

//
//
//Global
//
//

requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||  
                        window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;  

cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame || 
						window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;

Log('CT Engine Start');

var screen = new Object();

	screen.titleScreen = document.getElementById('titleScreen');
	screen.background = document.getElementById('background');
	screen.characters = document.getElementById('characters');
	screen.foreground = document.getElementById('foreground');
	screen.newGame = document.getElementById('newGame');
	screen.statsScreen = document.getElementById('statsScreen');
	screen.missionSelectScreen = document.getElementById('missionSelect');

var audioContext = new webkitAudioContext();


var world = new Object();
var gameData = new Object();
var editor = new Object();

// initialising the caching infrastructure as this happens before the rest of the game init
gameData.tileCache = new Array();
gameData.imageCache = new Array(100);

gameData.soundCache = new Array();
gameData.charCache = new Array(2);
gameData.charCache[FACING_LEFT] = new Array();
gameData.charCache[FACING_RIGHT] = new Array();

gameData.maps = new Array();
gameData.cutScenes = new Array(100);

gameData.cutScenePlaying = false;
gameData.activeCutScene = 0;
gameData.currentCutSceneFrame = 0;
gameData.cutSceneCounter = 0;
gameData.cutSceneSkip = false;

// Maps
gameData.maps[0] = new missionData('map1.json', 'Basic Training','Enter the training complex and capture the blue key', true, [1,2]);
gameData.maps[1] = new missionData('map2.json', 'First Try','First Simple mission', false);
gameData.maps[2] = new missionData('map3.json', 'second Try','Slightly harder mission', false);
gameData.currentMapNumber = -1;

// cut scenes
gameData.cutScenes[0] = new Object();
gameData.cutScenes[0].played = false;
gameData.cutScenes[0].scenes = new Array();
gameData.cutScenes[0].scenes[0] = new cutSceneFrame(CS_1);
gameData.cutScenes[0].scenes[1] = new cutSceneFrame(CS_2);


gameData.attackMode = false;
gameData.hackMode = false;


gameData.kills = 0;
gameData.turnsTaken = 0;
gameData.damageApplied = 0;
gameData.damageTaken = 0;

gameData.gameLoop = false;


//flags
var DEBUG_DRAW = 0;
var EDIT_MODE = 0;

gameData.turn = TURN_PLAYER;

Log('Starting Image/Tile Caching');

loadImages();
loadTiles();
loadSounds();

//
//
// Objects
//
//

function missionData(file, title, description, unlocked, unlocks)
{
	this.file = file;
	this.title = title;
	this.description = description;
	this.unlocked = unlocked;
	this.unlocks = unlocks;
	this.completed = false;
}

function cutSceneFrame(image)
{
	this.image = image;
}

function tile(imageType, tileType, specialFlag)
{
	//what is the tile image
	this.image = imageType;
	
	//what is the type - i.e. collision detection
	this.type = tileType;
	
	//things like doors, teleporters, other special tiles
	this.flag = specialFlag;
	
	//this.mapDestination = 0; // where to zone to
	
	this.spawnID = 0; // player spawn ID
	this.enemySpawnID = 0; // enemy spawn - what type
	
	this.enemySpawnTrigger = -1; //if -1, spawn on load, else spawn when triggered 
	
	this.switchTriggered = false;
	this.switchItemRequired = -1; //should the switch require an item? e.g. key
	this.network = -1;

	this.decalImage = -1; 
	//what image should we superimpose on this image
	
	//if this is a switch/teleporter, open a door at this location
	this.targetX = 0;
	this.targetY = 0;	

	this.item = -1;

	//this.completesLevel = false;

}

function map(width, height)
{
	Log('Generating map object');
	this.tiles = new Array();
	this.width = width;
	this.height = height;
	this.startX = 0;
	this.startY = 0;
	this.cutScene = -1;
	
	for (var i=0; i<width; i++)
	{
		this.tiles[i] = Array(); 
		for (var j = 0; j<height; j++)
		{
			this.tiles[i][j] = new tile(0, TILE_OPEN, TILE_TYPE_NORMAL);
		}
	}
	
	//this.objects = new Array();
	this.entities = new Array();
}

//inventory items
/*

Stealth Suit -> Allows Stealth, increases dodging by 20%
Extra Stealth Emitters -> increases stealth by 5%

Hacking Module -> Allows Hacking, increases hacking by 20%
Gold Plated Hacking Jack -> increases hacking by 5%

Personal Shield -> Reduces Damage by 20%
Shield Booster -> Improves shield by 5%

Weapon Scope -> Increases chance to hit by 20%
Weapon Power Booster -> Increases damage by 5%

Chest Armour -> Reduces Damage by 10%
Leg Armour > Reduces Damage by 10%
Armour Patches -> Reduces Damage by 5%

Shock Resist Booster -> Increases Crit resist chance by %5

Leg Boosters -> Add +1 to maximum moves, 5% dodge

Enhanced Vision Goggles -> Increase Focus (chance to hit) by 10%


*/

function InventoryItem(type)
{
	this.type = type;
	this.image = 0;

	this.statsDexterity = 0;
	this.statsFocus = 0;
	this.statsStealth = 0;
	this.allowStealth = false;
	this.statsHacking = 0;
	this.allowHacking = false;
	this.damage = 0;
	this.armour = 0;
	this.statsCritChance = 0;
	this.statsCritResistChance = 0;
	this.moves = 0;
	this.multiple = false;

	switch (type)
	{
		case INV_STEALTH_SUIT:
		this.title = 'Stealth Suit';
		this.allowStealth = true;
		this.statsStealth = 20;
		this.multiple = false;
		this.image = IMAGE_STEALTH_SUIT;
		break;

		case INV_STEALTH_EMITTERS:
		this.title = 'Stealth Suit Emitters';
		this.statsStealth = 5;
		this.multiple = true;
		this.image = IMAGE_STEALTH_EMITTERS;
		break;

		case INV_HACKING_MODULE:
		this.title = 'Hacking Module';
		this.allowHacking = true;
		this.statsHacking = 20;
		this.multiple = false;
		this.image = IMAGE_HACKING_MODULE;
		break;

		case INV_HACKING_JACK:
		this.title = 'Gold Plated Hacking Jack';
		this.statsHacking = 5;
		this.multiple = false;
		this.image = IMAGE_HACKING_JACK;
		break;

		case INV_SHIELD:
		this.title = 'Personal Shield';
		this.armour = 20;
		this.multiple = false;
		this.image = IMAGE_SHIELD;
		break;

		case INV_SHIELD_BOOSTER:
		this.title = 'Shield Booster';
		this.armour = 5;
		this.multiple = true;
		this.image = IMAGE_SHIELD_BOOSTER;
		break;

		case INV_WEAPON_SCOPE:
		this.title = 'Weapon Scope';
		this.statsFocus = 20;
		this.multiple = false;
		this.image = IMAGE_WEAPON_SCOPE;
		break;

		case INV_WEAPON_POWER_BOOSTER:
		this.title = 'Weapon Power Booster';
		this.damage = 5;
		this.multiple = true;
		this.image = IMAGE_WEAPON_POWER_BOOSTER;
		break;

		case INV_CHEST_ARMOUR:
		this.title = 'Chest Armour';
		this.armour = 10;
		this.multiple = false;
		this.image = IMAGE_CHEST_ARMOUR;
		break;

		case INV_LEG_ARMOUR:
		this.title = 'Leg Armour';
		this.armour = 10;
		this.multiple = false;
		this.image = IMAGE_LEG_ARMOUR;
		break;
		
		case INV_ARMOUR_PATCH:
		this.title = 'Armour Patch';
		this.armour = 5;
		this.multiple = true;
		this.image = IMAGE_AMOUR_PATCH;
		break;

		case INV_ARMOUR_SHOCKRESIST:
		this.title = 'Armour Shock Resist Booster';
		this.statsCritResistChance = 5;
		this.multiple = true;
		this.image = IMAGE_ARMOUR_SHOCKRESIST;
		break;

		case INV_LEG_BOOSTERS:
		this.title = 'Leg Boosters';
		this.moves = 1;
		this.statsDexterity = 5;
		this.multiple = false;
		this.image = IMAGE_LEG_BOOSTERS;
		break;

		case INV_ENHANCED_GOGGLES:
		this.title = 'Enhanced Vision Goggles';
		this.statsFocus = 10;
		this.multiple = false;
		this.image = IMAGE_ENHANCED_GOGGLES;
		break;						

		case INV_GOAL_INFO:
		this.title = 'Goal: Information';
		this.image = IMAGE_GOAL_INFO;
		this.multiple = false;
		break;
		
		case INV_KEY_RED:
		this.title ='Red Key';
		this.image = IMAGE_KEY_RED;
		this.multiple = false;
		break;

		case INV_KEY_BLU:
		this.title = 'Blue Key';
		this.image = IMAGE_KEY_BLU;
		this.multiple = false;
		break;
	}

}


function entityIsInInventory(type)
{
	if (type == -1)
	{
		return true;
	}

	for (var i=0; i<this.inventory.length; i++)
	{
		if (this.inventory[i].type == type)
		{
			return true;
		}
	}

	return false;
}

function entityAddInventoryItem(type, notify)
{
	var alreadyHave = this.isInInventory(type);
	var temp = new InventoryItem(type);

	if ((alreadyHave == true)&&(temp.multiple == false))
	{
		raiseNotification('Cannot equip multiple items of this type');
		return false;
	}
	else
	{
		this.inventory.push(temp);

		if (notify)
		{	
			raiseNotification('Item equipped');	
		}
		this.calculateStats();
		updatePlayerDetails();
		return true;
	}
	return false;
}


function entityPickUpInventoryItem()
{

if (world.currentMap.tiles[this.xPos][this.yPos].item >= 0)
{
	var type = world.currentMap.tiles[this.xPos][this.yPos].item;

	if (this.addInventoryItem(type, true))
	{
		world.currentMap.tiles[this.xPos][this.yPos].item = -1;
	}
	
}
else
{
	raiseNotification('No item at the current Location');
}
}

function entityDropInventoryItem(i)
{
	this.inventory.splice(i,1);
}

function entityRecalculateStats()
{
	this.calcDexterity = this.baseDexterity;
	this.calcFocus = this.baseFocus;
	this.calcStealth = this.baseStealth;
	this.calcHacking = this.baseHacking;
	this.calcDamage = this.baseDamage;
	this.calcArmour = this.baseArmour;
	this.calcCritChance = this.baseCritChance;
	this.calcCritResistChance = this.baseCritResistChance;
	this.movesPerTurn = parseInt(this.baseMovesPerTurn);

	for (var i=0; i<this.inventory.length; i++)
	{

	this.calcDexterity += this.inventory[i].statsDexterity;
	this.calcFocus += this.inventory[i].statsFocus;
	this.calcStealth += this.inventory[i].statsStealth;
	this.calcHacking += this.inventory[i].statsHacking;
	this.calcDamage += this.inventory[i].damage;
	this.calcArmour += this.inventory[i].armour;
	this.calcCritChance += this.inventory[i].statsCritChance;
	this.calcCritResistChance += this.inventory[i].statsCritResistChance;
	this.movesPerTurn += parseInt(this.inventory[i].moves);

	}
}


function Entity(type, x, y, team, network)
{
	Log('Creating Entity of type: '+type);
	this.xPos = x;
	this.yPos = y;
	
	this.xOffset = 0;
	this.yOffset = 0;
	
	this.movesPerTurn = 0;
	this.movesUsed = 0;

	this.directionFacing = FACING_LEFT; // 0=left, 1=right
	
	this.currentAnimation = ENTITY_STAND;
				
	this.type =  type;
	this.currentFrame = ENTITY_NULL_IMAGE;
	this.deathFrame = ENTITY_NULL_IMAGE;
	
	this.currentFrameIndex = 0;
	
	this.standingAnimation = new Array();
	this.walkingAnimation = new Array();
	this.dyingAnimation = new Array();	
	this.attackingAnimation = new Array();
	this.defendingAnimation = new Array();
	this.teleportingAnimation = new Array();
	
	//death behaviour
	this.cleanUpAfterDeath = false;
	
	//entity stats
	this.maxHealth = 100;
	this.currentHealth = 100;
	this.isAlive = entityIsAlive;

	this.hurtOnThisTile = false;


	this.stealthEnabled = false;

	this.baseDexterity = 20; // dodging
	this.baseFocus = 80; 
	this.baseStealth = 50;
	this.baseHacking = 50;
	this.baseDamage = 20;
	this.baseArmour = 10;
	this.baseCritChance = 20;
	this.baseCritResistChance = 50;
	

	this.calcDexterity = 0;
	this.calcFocus = 0;
	this.calcStealth = 0;
	this.calcHacking = 0;
	this.calcDamage = 0;
	this.calcArmour = 0;
	this.calcCritChance = 0;
	this.calcCritResistChance = 0;
	this.movesPerTurn = 0;

	this.calculateStats = entityRecalculateStats;


	//AI
	this.aiModel = AI_NULL;
	this.processAI = entityProcessAI;
	
	//movement
	this.isBlockedTileNorth = isBlockedTileNorth;
	this.isBlockedTileEast = isBlockedTileEast;
	this.isBlockedTileSouth = isBlockedTileSouth;
	this.isBlockedTileWest = isBlockedTileWest;
	
	this.moveNorth = entityMoveNorth;
	this.moveEast = entityMoveEast;
	this.moveSouth = entityMoveSouth;
	this.moveWest = entityMoveWest;
	
	this.lastAnimationFrame = 0;
	this.currentAnimationFrameTimer = 0;
	this.processAnimationFrame = entityProcessAnimationFrame;
	this.changeAnimation = entityChangeAnimation;
	this.processSpecialTiles = entityProcessSpecialTiles;
	this.processHit = entityProcessHit;
	
	// combat
	this.chanceToDodge = entityChanceToDodge;
	this.chanceToHit = entityChanceToHit;
	this.chanceToCrit = entityChanceToCrit;
	this.chanceToResistCrit = entityChanceToResistCrit;
	this.calculateDamage = entityCalculateDamage;
	this.calculateDamageResist = entityCalculateDamageResist;
	this.stealthRating = entityStealthRating;
	

	//turn management
	this.resetMoves = entityResetMoves;
	this.movesLeft = entityMovesLeft;
	this.useMove = entityUseMove;


	//inventory control
	this.inventory = new Array();
	this.pickUpInventoryItem = entityPickUpInventoryItem;
	this.addInventoryItem = entityAddInventoryItem;

	this.dropIventoryItem = entityDropInventoryItem;
	this.dropLoot = entityDropLoot;
	this.isInInventory = entityIsInInventory;
	
	this.lootTable = new Array();
	this.addLoot = entityAddLoot;


	//hacking
	this.network = -1;

	switch (parseInt(this.type))
	{
	//for the moment, make each class a copy of the other until more frames are drawn
	case ENTITY_SPY:
	this.addInventoryItem(INV_HACKING_MODULE, false);
	this.addInventoryItem(INV_STEALTH_SUIT, false);
		this.baseMovesPerTurn = 8;

		switch (team)
		{
			case TEAM_PC:
		this.staticFrame = ENTITY_BLU_SPY_STANDING;
		this.currentFrame = ENTITY_BLU_SPY_STANDING;
		this.standingAnimation[0] = ENTITY_BLU_SPY_STANDING;
		this.walkingAnimation[0] = ENTITY_BLU_SPY_STANDING;
		this.walkingAnimation[1] = ENTITY_BLU_SPY_WALKING_1;
		this.walkingAnimation[2] = ENTITY_BLU_SPY_STANDING;
		this.walkingAnimation[3] = ENTITY_BLU_SPY_WALKING_2;
		this.walkingAnimation[4] = ENTITY_BLU_SPY_STANDING;
		this.walkingAnimation[5] = ENTITY_BLU_SPY_WALKING_1;
		this.attackingAnimation[0] = ENTITY_BLU_SPY_ATTACKING_1;
		this.attackingAnimation[1] = ENTITY_BLU_SPY_ATTACKING_2;
		this.attackingAnimation[2] = ENTITY_BLU_SPY_ATTACKING_1;
		this.attackingAnimation[3] = ENTITY_BLU_SPY_ATTACKING_2;
		this.defendingAnimation[0] = ENTITY_BLU_SPY_STANDING ;
		this.defendingAnimation[1] = ENTITY_NULL_IMAGE;
		this.defendingAnimation[2] = ENTITY_BLU_SPY_STANDING;
		this.defendingAnimation[3] = ENTITY_NULL_IMAGE;
		this.dyingAnimation[0] = ENTITY_NULL_IMAGE;
		this.deathFrame = ENTITY_NULL_IMAGE;
		this.teleportingAnimation[0] = ENTITY_BLU_SPY_TELEPORTING_3;
		this.teleportingAnimation[1] = ENTITY_BLU_SPY_TELEPORTING_2;
		this.teleportingAnimation[2] = ENTITY_BLU_SPY_TELEPORTING_1;
			break;

			case TEAM_AI:
			this.staticFrame = ENTITY_RED_SPY_STANDING;
			this.currentFrame = ENTITY_RED_SPY_STANDING;
		this.standingAnimation[0] = ENTITY_RED_SPY_STANDING;
		this.walkingAnimation[0] = ENTITY_RED_SPY_STANDING;
		this.walkingAnimation[1] = ENTITY_RED_SPY_WALKING_1;
		this.walkingAnimation[2] = ENTITY_RED_SPY_STANDING;
		this.walkingAnimation[3] = ENTITY_RED_SPY_WALKING_2;
		this.walkingAnimation[4] = ENTITY_RED_SPY_STANDING;
		this.walkingAnimation[5] = ENTITY_RED_SPY_WALKING_1;
		this.attackingAnimation[0] = ENTITY_RED_SPY_ATTACKING_1;
		this.attackingAnimation[1] = ENTITY_RED_SPY_ATTACKING_2;
		this.attackingAnimation[2] = ENTITY_RED_SPY_ATTACKING_1;
		this.attackingAnimation[3] = ENTITY_RED_SPY_ATTACKING_2;
		this.defendingAnimation[0] = ENTITY_RED_SPY_STANDING ;
		this.defendingAnimation[1] = ENTITY_NULL_IMAGE;
		this.defendingAnimation[2] = ENTITY_RED_SPY_STANDING;
		this.defendingAnimation[3] = ENTITY_NULL_IMAGE;
		this.dyingAnimation[0] = ENTITY_NULL_IMAGE;
		this.deathFrame = ENTITY_NULL_IMAGE;
		this.teleportingAnimation[0] = ENTITY_RED_SPY_TELEPORTING_3;
		this.teleportingAnimation[1] = ENTITY_RED_SPY_TELEPORTING_2;
		this.teleportingAnimation[2] = ENTITY_RED_SPY_TELEPORTING_1;
			break;

		}

		this.addLoot(-1, 10);
		this.addLoot(INV_LEG_BOOSTERS, 1);
		this.addLoot(INV_ENHANCED_GOGGLES, 1);
		this.addLoot(INV_SHIELD, 1);
		this.addLoot(INV_SHIELD_BOOSTER, 1);

		break;

	case ENTITY_MECH:
	
		this.baseMovesPerTurn = 4;

		switch (team)
		{
			case TEAM_PC:
		this.staticFrame = ENTITY_BLU_MECH_STANDING;
		this.currentFrame = ENTITY_BLU_MECH_STANDING;
		this.standingAnimation[0] = ENTITY_BLU_MECH_STANDING;
		this.walkingAnimation[0] = ENTITY_BLU_MECH_STANDING;
		this.walkingAnimation[1] = ENTITY_BLU_MECH_WALKING_1;
		this.walkingAnimation[2] = ENTITY_BLU_MECH_STANDING;
		this.walkingAnimation[3] = ENTITY_BLU_MECH_WALKING_1;
		this.attackingAnimation[0] = ENTITY_BLU_MECH_ATTACKING_1;
		this.attackingAnimation[1] = ENTITY_BLU_MECH_ATTACKING_2;
		this.attackingAnimation[2] = ENTITY_BLU_MECH_ATTACKING_1;
		this.attackingAnimation[3] = ENTITY_BLU_MECH_ATTACKING_2;
		this.defendingAnimation[0] = ENTITY_BLU_MECH_STANDING;
		this.defendingAnimation[1] = ENTITY_NULL_IMAGE;
		this.defendingAnimation[2] = ENTITY_BLU_MECH_STANDING;
		this.defendingAnimation[3] = ENTITY_NULL_IMAGE;
		this.dyingAnimation[0] = ENTITY_NULL_IMAGE;
		this.deathFrame = ENTITY_NULL_IMAGE;
		this.teleportingAnimation[0] = ENTITY_BLU_MECH_TELEPORTING_3;
		this.teleportingAnimation[1] = ENTITY_BLU_MECH_TELEPORTING_2;
		this.teleportingAnimation[2] = ENTITY_BLU_MECH_TELEPORTING_1;
			break;

			case TEAM_AI:
			this.staticFrame = ENTITY_RED_MECH_STANDING;
			this.currentFrame = ENTITY_RED_MECH_STANDING;
		this.standingAnimation[0] = ENTITY_RED_MECH_STANDING;
		this.walkingAnimation[0] = ENTITY_RED_MECH_STANDING;
		this.walkingAnimation[1] = ENTITY_RED_MECH_WALKING_1;
		this.walkingAnimation[2] = ENTITY_RED_MECH_STANDING;
		this.walkingAnimation[3] = ENTITY_RED_MECH_WALKING_1;
		this.attackingAnimation[0] = ENTITY_RED_MECH_ATTACKING_1;
		this.attackingAnimation[1] = ENTITY_RED_MECH_ATTACKING_2;
		this.attackingAnimation[2] = ENTITY_RED_MECH_ATTACKING_1;
		this.attackingAnimation[3] = ENTITY_RED_MECH_ATTACKING_2;
		this.defendingAnimation[0] = ENTITY_RED_MECH_STANDING ;
		this.defendingAnimation[1] = ENTITY_NULL_IMAGE;
		this.defendingAnimation[2] = ENTITY_RED_MECH_STANDING;
		this.defendingAnimation[3] = ENTITY_NULL_IMAGE;
		this.dyingAnimation[0] = ENTITY_NULL_IMAGE;
		this.deathFrame = ENTITY_NULL_IMAGE;
		this.teleportingAnimation[0] = ENTITY_RED_MECH_TELEPORTING_3;
		this.teleportingAnimation[1] = ENTITY_RED_MECH_TELEPORTING_2;
		this.teleportingAnimation[2] = ENTITY_RED_MECH_TELEPORTING_1;
			break;

		}

		this.addLoot(-1, 10);
		this.addLoot(INV_LEG_BOOSTERS, 1);
		this.addLoot(INV_ENHANCED_GOGGLES, 1);
		this.addLoot(INV_SHIELD, 1);
		this.addLoot(INV_SHIELD_BOOSTER, 1);

	break;

	case ENTITY_SOLDIER:
	this.addInventoryItem(INV_HACKING_MODULE, false);
	this.baseMovesPerTurn = 6;

		switch (team)
		{
		case TEAM_PC:
		this.staticFrame = ENTITY_BLU_SOLDIER_STANDING;
		this.currentFrame = ENTITY_BLU_SOLDIER_STANDING;
		this.standingAnimation[0] = ENTITY_BLU_SOLDIER_STANDING;
		this.walkingAnimation[0] = ENTITY_BLU_SOLDIER_STANDING;
		this.walkingAnimation[1] = ENTITY_BLU_SOLDIER_WALKING_1;
		this.walkingAnimation[2] = ENTITY_BLU_SOLDIER_STANDING;
		this.walkingAnimation[3] = ENTITY_BLU_SOLDIER_WALKING_2;
		this.walkingAnimation[4] = ENTITY_BLU_SOLDIER_STANDING;
		this.walkingAnimation[5] = ENTITY_BLU_SOLDIER_WALKING_1;
		this.attackingAnimation[0] = ENTITY_BLU_SOLDIER_ATTACKING_1;
		this.attackingAnimation[1] = ENTITY_BLU_SOLDIER_ATTACKING_2;
		this.attackingAnimation[2] = ENTITY_BLU_SOLDIER_ATTACKING_1;
		this.attackingAnimation[3] = ENTITY_BLU_SOLDIER_ATTACKING_2;
		this.defendingAnimation[0] = ENTITY_BLU_SOLDIER_STANDING ;
		this.defendingAnimation[1] = ENTITY_NULL_IMAGE;
		this.defendingAnimation[2] = ENTITY_BLU_SOLDIER_STANDING;
		this.defendingAnimation[3] = ENTITY_NULL_IMAGE;
		this.dyingAnimation[0] = ENTITY_NULL_IMAGE;
		this.deathFrame = ENTITY_NULL_IMAGE;
		this.teleportingAnimation[0] = ENTITY_BLU_SOLDIER_TELEPORTING_3;
		this.teleportingAnimation[1] = ENTITY_BLU_SOLDIER_TELEPORTING_2;
		this.teleportingAnimation[2] = ENTITY_BLU_SOLDIER_TELEPORTING_1;
		break;

		case TEAM_AI:
		this.staticFrame = ENTITY_RED_SOLDIER_STANDING;
		this.currentFrame = ENTITY_RED_SOLDIER_STANDING;
		this.standingAnimation[0] = ENTITY_RED_SOLDIER_STANDING;
		this.walkingAnimation[0] = ENTITY_RED_SOLDIER_STANDING;
		this.walkingAnimation[1] = ENTITY_RED_SOLDIER_WALKING_1;
		this.walkingAnimation[2] = ENTITY_RED_SOLDIER_STANDING;
		this.walkingAnimation[3] = ENTITY_RED_SOLDIER_WALKING_2;
		this.walkingAnimation[4] = ENTITY_RED_SOLDIER_STANDING;
		this.walkingAnimation[5] = ENTITY_RED_SOLDIER_WALKING_1;
		this.attackingAnimation[0] = ENTITY_RED_SOLDIER_ATTACKING_1;
		this.attackingAnimation[1] = ENTITY_RED_SOLDIER_ATTACKING_2;
		this.attackingAnimation[2] = ENTITY_RED_SOLDIER_ATTACKING_1;
		this.attackingAnimation[3] = ENTITY_RED_SOLDIER_ATTACKING_2;
		this.defendingAnimation[0] = ENTITY_RED_SOLDIER_STANDING ;
		this.defendingAnimation[1] = ENTITY_NULL_IMAGE;
		this.defendingAnimation[2] = ENTITY_RED_SOLDIER_STANDING;
		this.defendingAnimation[3] = ENTITY_NULL_IMAGE;
		this.dyingAnimation[0] = ENTITY_NULL_IMAGE;
		this.deathFrame = ENTITY_NULL_IMAGE;
		this.teleportingAnimation[0] = ENTITY_RED_SOLDIER_TELEPORTING_3;
		this.teleportingAnimation[1] = ENTITY_RED_SOLDIER_TELEPORTING_2;
		this.teleportingAnimation[2] = ENTITY_RED_SOLDIER_TELEPORTING_1;
		this.aiModel = AI_SOLDIER;

		this.addLoot(-1, 10);
		this.addLoot(INV_HACKING_JACK, 1);
		this.addLoot(INV_WEAPON_SCOPE, 1);
		this.addLoot(INV_CHEST_ARMOUR, 1);
		this.addLoot(INV_LEG_ARMOUR, 1);
		this.addLoot(INV_ARMOUR_PATCH, 1);
		this.addLoot(INV_ARMOUR_SHOCKRESIST, 1);

		break;

		}
	break;

	case ENTITY_SENTRY:
		
		this.network = network;
		this.baseMovesPerTurn = 2;

		this.staticFrame = ENTITY_SENTRY_STANDING_1;
		this.currentFrame = ENTITY_SENTRY_STANDING_1;
		this.standingAnimation[0] = ENTITY_SENTRY_STANDING_1;
		this.standingAnimation[1] = ENTITY_SENTRY_STANDING_2;
		
		this.walkingAnimation[0] = ENTITY_SENTRY_STANDING_1;

		this.dyingAnimation[0] = ENTITY_SENTRY_DYING_1;
		this.dyingAnimation[1] = ENTITY_SENTRY_DYING_2;
		this.dyingAnimation[2] = ENTITY_SENTRY_DYING_3;
		this.dyingAnimation[3] = ENTITY_SENTRY_DYING_4;
		this.dyingAnimation[4] = ENTITY_SENTRY_DYING_5;
	
		this.defendingAnimation[0] = ENTITY_NULL_IMAGE;
	
		this.attackingAnimation[0] = ENTITY_SENTRY_ATTACKING_1;
		this.attackingAnimation[1] = ENTITY_SENTRY_ATTACKING_2;
		this.attackingAnimation[2] = ENTITY_SENTRY_ATTACKING_1;
		this.attackingAnimation[3] = ENTITY_SENTRY_ATTACKING_2;
		
		this.deathFrame = ENTITY_SENTRY_DEAD;
		
		this.teleportingAnimation[0] = ENTITY_SENTRY_TELEPORTING_1;
		this.teleportingAnimation[1] = ENTITY_SENTRY_TELEPORTING_2;
		this.teleportingAnimation[2] = ENTITY_SENTRY_TELEPORTING_3;
		this.teleportingAnimation[3] = ENTITY_SENTRY_TELEPORTING_4;
		
		
		this.baseDexterity = 0;

		this.aiModel = AI_SENTRY;
		this.addLoot(-1, 10);
		this.addLoot(INV_STEALTH_EMITTERS, 1);
		this.addLoot(INV_SHIELD_BOOSTER, 1);
		this.addLoot(INV_WEAPON_POWER_BOOSTER, 1);

		
	break;
	default:
		Log('Invalid Entity type');
		return false;
	break;
	}
	
	this.calculateStats();
	
}

function entityAddLoot(type, amount)
{
	for (var i=0; i<amount; i++)
	{
		this.lootTable.push(type);
	}
}


function entityDropLoot()
{

	var lootItem = this.lootTable[Math.floor(Math.random()*this.lootTable.length)];
	world.currentMap.tiles[this.xPos][this.yPos].item = lootItem;
}

function entityProcessAI()
{

	if (!this.isAlive())
	{
		Log('this entity is not alive');
		return false;
	}
	if (this.movesLeft() == 0)
	{
		return false;
	}
	Log('Processing AI for entity');

	switch (parseInt(this.aiModel))
	{
		case AI_NULL:
		this.useMove();
		break;

		case AI_SENTRY:
		// are there any players visible and in range?
		var targets = new Array();
		Log('Looking through players for targets');
		for (var i=0; i<world.players.length; i++)
		{	

			if ((lineOfSight(this, world.players[i]) >= 0)&&(world.players[i].isAlive()))
			{
				targets.push(i);

			}
		}
		Log(targets.length+' targets found');
		this.useMove();
		if (targets.length > 0)
		{
		//pick a random player thats in range and shoot them
			processAttack(this, world.players[targets[
				Math.floor((Math.random()*targets.length))]] );
			
			world.aiTimer = DELAY_AI;

		}
		break;
		case AI_PSENTRY:
			// psentry = player controlled
			var targets = new Array();
			Log('Looking through entities for targets');
			for (var i=0; i<world.currentMap.entities.length; i++)
			{	

				if ((lineOfSight(this, world.currentMap.entities[i]) > 0)&&(world.currentMap.entities[i].isAlive()))
				{

					targets.push(i);

				}
			}
			Log(targets.length+' targets found');
			this.useMove();
			if (targets.length > 0)
			{
		//pick a random entitiy thats in range and shoot them
				processAttack(this, world.currentMap.entities[targets[
				Math.floor((Math.random()*targets.length))]] );
			
				world.aiTimer = DELAY_AI;

			}
		break;
		case AI_SOLDIER:

		var targets = new Array();
		Log('Looking through players for targets');
		
		for (var i=0; i<world.players.length; i++)
		{	
			var distance = lineOfSight(this, world.players[i]);

			if (( distance >= 0)&&(world.players[i].isAlive()))
			{
				if (distance < 5)
				{
					targets.push(i);
				}
			}
		}
		
		Log('Completed looking through players');
		//Log(targets.length);

		if (targets.length > 0)
		{
			// we have a close enough target
			this.useMove();
			Log(targets[Math.floor((Math.random()*targets.length))]);

			processAttack(this, world.players[targets[Math.floor((Math.random()*targets.length))]] );
			
		}
		else
		{
			switch (Math.floor(Math.random()*4))
			{
			case 0:
			if (!(this.isBlockedTileNorth()))
			{
				this.moveNorth();
			}
			break;
			case 1:
			if (!(this.isBlockedTileEast()))
			{
				this.moveEast();
			}
			break;
			case 2:
			if (!(this.isBlockedTileSouth()))
			{
				this.moveSouth();
			}
			break;
			case 3:
			if (!(this.isBlockedTileWest()))
			{
				this.moveWest();
			}
			break;

			}
		}

		world.aiTimer = DELAY_AI;

		break;
		default:
		Log('cannot process AI of type '+this.aiModel);
		break;

	}
}

function entityIsAlive()
{
	if (this.currentHealth > 0)
	{
		return true;
	}
	else
	{
		return false;
	}
}

function entityProcessHit(amount)
{
	if (this.currentHealth > amount)
	{
		this.currentHealth -= amount;
		//ouch... animate hit?

		if (this.aiModel == AI_NULL)
		{
		//if Im player controlled
			gameData.damageTaken += amount;
		}
		else
		{
			gameData.damageApplied += amount;
		}

	}
	else
	{
	// cause a death
		this.currentHealth = 0;
		//this.currentAction = ENTITY_DYING;	
		this.changeAnimation(ENTITY_DYING);	
		if (this.aiModel == AI_NULL)
		{
		//if Im player controlled
		world.currentMap.damageTaken += amount;

		}
		else
		{
			gameData.damageApplied += amount;
			gameData.kills++;
		}
	}




}

function entityProcessSpecialTiles()
{
	if ((this.xOffset == 0)&&(this.yOffset == 0))
	{
	var flag = world.currentMap.tiles[this.xPos][this.yPos].flag;
	switch(parseInt(flag))
	{
	case TILE_TYPE_PLAYER_SPAWN:
	case TILE_TYPE_ENEMY_SPAWN:
	case TILE_TYPE_HACK:
	case TILE_TYPE_DOOR:
	//nothing
	break;
	case TILE_TYPE_EXIT:
	//Log('standing on an exit');
		
		endMap();


		//LoadMap(world.currentMap.tiles[this.xPos][this.yPos].mapDestination, world.currentMap.tiles[this.xPos][this.yPos].tileDestinationID);
	
	break;
	
	case TILE_TYPE_HURT:
		

	if (this.hurtOnThisTile == false)
	{

		this.changeAnimation(ENTITY_DEFENDING);
		this.processHit(ENVIRONMENT_HIT);
		this.hurtOnThisTile = true;
		updatePlayerDetails();
	}
	break;

	case TILE_TYPE_TELEPORTER:
		
		var targetX = world.currentMap.tiles[this.xPos][this.yPos].targetX;
		var targetY = world.currentMap.tiles[this.xPos][this.yPos].targetY;
		//make sure not to telefrag ;)
		for (var i=0; i<world.players.length; i++) 
		{
			if ((world.players[i].xPos == targetX)&&(world.players[i].yPos == targetY))
			{
				return false;
			}
		}
		raiseNotification('Player teleported');
		this.xPos = parseInt(targetX);
		this.yPos = parseInt(targetY);
		this.changeAnimation(ENTITY_TELEPORTING);
		this.hurtOnThisTile = false;

	break;		
	
	case TILE_TYPE_AUTO_SWITCH:

		if ((world.currentMap.tiles[this.xPos][this.yPos].switchTriggered == false)&&(this.isInInventory(world.currentMap.tiles[this.xPos][this.yPos].switchItemRequired)))
		{	
			if (world.currentMap.tiles[this.xPos][this.yPos].enemySpawnTrigger >=0)
			{
				for (var i=0; i<world.currentMap.width; i++)
				{
					for (var j=0; j<world.currentMap.height; j++)
					{

						if ((world.currentMap.tiles[i][j].flag == TILE_TYPE_ENEMY_SPAWN)&&(world.currentMap.tiles[i][j].enemySpawnTrigger == world.currentMap.tiles[this.xPos][this.yPos].enemySpawnTrigger))
						{
							spawnEntityInMap(world.currentMap.tiles[i][j].enemySpawnID, i, j, world.currentMap.tiles[i][j].network, true);

						}

					}
				}

			}

			var targetX = world.currentMap.tiles[this.xPos][this.yPos].targetX;
			var targetY = world.currentMap.tiles[this.xPos][this.yPos].targetY;
			
			if ((targetX >0)&&(targetY >0))
			{
				unlockDoor(targetX, targetY);
				generateBaseMap();
				screen.backgroundChanged = true;
			}

			world.currentMap.tiles[this.xPos][this.yPos].switchTriggered = true;
		}
	break;

	default:
	// nothing
	//Log(flag);
	break;
	}
	}

}

function entityChangeAnimation(animation)
{
	this.currentFrameIndex = 0;
	this.currentAnimation = animation;
	this.currentAnimationFrameTimer = ANIMATION_FRAME+1;
	
}

function entityProcessAnimationFrame()
{
	
	if (this.xOffset > 0)
	{
		this.xOffset--;
	}
	
	if (this.xOffset < 0)
	{
		this.xOffset++;
	}
	
	if (this.yOffset > 0)
	{
		this.yOffset--;
	}
	if (this.yOffset < 0)
	{
		this.yOffset++;
	}

		switch (this.currentAnimation)
		{
		
		case ENTITY_DEAD:
			this.currentFrame = this.deathFrame;
		break;
		
		case ENTITY_TELEPORTING:
		
			if (this.currentFrameIndex >= this.teleportingAnimation.length)
			{
				this.changeAnimation(ENTITY_STAND);
			}
			
			if (this.currentAnimationFrameTimer > ANIMATION_FRAME)
			{
				this.currentFrame = this.teleportingAnimation[this.currentFrameIndex];
				this.currentAnimationFrameTimer = 0;
				this.currentFrameIndex++;
			}
			
		break;
		
		case ENTITY_DYING:
		
			if (this.currentFrameIndex >= this.dyingAnimation.length)
			{
				this.changeAnimation(ENTITY_DEAD);
				this.dropLoot();
			}
			
			if (this.currentAnimationFrameTimer > ANIMATION_FRAME)
			{
				this.currentFrame = this.dyingAnimation[this.currentFrameIndex];
				this.currentAnimationFrameTimer = 0;
				this.currentFrameIndex++;
			}
			
		break;
		
			case ENTITY_ATTACKING:
		
			if (this.currentFrameIndex >= this.attackingAnimation.length)
			{
				this.changeAnimation(ENTITY_STAND);
			}
			
			if (this.currentAnimationFrameTimer > ANIMATION_FRAME)
			{
				this.currentFrame = this.attackingAnimation[this.currentFrameIndex];
				this.currentAnimationFrameTimer = 0;
				this.currentFrameIndex++;
			}
			
		break;
		
		case ENTITY_STAND:
			
			if (this.currentFrameIndex >= this.standingAnimation.length)
			{
			this.currentFrameIndex = 0;
			}
			if (this.currentAnimationFrameTimer > ANIMATION_FRAME)
			{
				this.currentFrame = this.standingAnimation[this.currentFrameIndex];
				this.currentAnimationFrameTimer = 0;
				this.currentFrameIndex++;
			}
		
		break;
		
		case ENTITY_WALKING:
		
			if (this.currentFrameIndex >= this.walkingAnimation.length)
			{
				this.changeAnimation(ENTITY_STAND);
			}
			
			if (this.currentAnimationFrameTimer > ANIMATION_FRAME)
			{
				this.currentFrame = this.walkingAnimation[this.currentFrameIndex];
				this.currentAnimationFrameTimer = 0;
				this.currentFrameIndex++;
			}
			
		break;
		
		case ENTITY_DEFENDING:
			if (this.currentFrameIndex >= this.defendingAnimation.length)
			{
				this.changeAnimation(ENTITY_STAND);
			}
			
			if (this.currentAnimationFrameTimer > ANIMATION_FRAME)
			{
				this.currentFrame = this.defendingAnimation[this.currentFrameIndex];
				this.currentAnimationFrameTimer = 0;
				this.currentFrameIndex++;
			}
		break;
		
		}

	this.currentAnimationFrameTimer++;
}


function isOpenTile(x,y)
{
	//Log(x+' '+y);
	if (x<0)
	{
		return false;
	}
	
	if (x>=world.currentMap.width)
	{
		return false;
	}
	if (y<0)
	{
		return false;
	}
	if (y>=world.currentMap.height)
	{
		return false;
	}
	
	if (world.currentMap.tiles[x][y].type == TILE_BLOCKED)
	{
		return false;
	}
	
	// now check if there's a player or entity there
	for (var i=0; i<world.players.length; i++)
	{
		if ((world.players[i].xPos == x)&&(world.players[i].yPos == y)&&(world.players[i].isAlive()))
		{
			return false;
		}
	}
	
	for (var i=0; i<world.currentMap.entities.length; i++)
	{
		if ((world.currentMap.entities[i].xPos == x)&&(world.currentMap.entities[i].yPos == y)&&(world.currentMap.entities[i].isAlive()))
		{
			return false;
		}
	}
	
return true;
}

function isBlockedTileNorth()
{
	if (isOpenTile(this.xPos, this.yPos - 1))
	{
		
		return false;
	}
return true;
}

function isBlockedTileWest()
{
	if (isOpenTile(this.xPos -1, this.yPos))
	{

		return false;
	}
return true;
}

function isBlockedTileSouth()
{
	if (isOpenTile(this.xPos, this.yPos + 1))
	{

		return false;
	}
return true;
}

function isBlockedTileEast()
{
	if (isOpenTile(this.xPos + 1, this.yPos))
	{

		return false;
	}
return true;
}


function entityMoveNorth()
{
	if (this.movesLeft()>0)
	{	
	this.yPos--;
	
	this.yOffset = TILE_WIDTH;
	

	this.changeAnimation(ENTITY_WALKING);
	
	this.useMove();
	this.hurtOnThisTile = false;
	}
	else
	{
		raiseNotification('No Moves remaining');
	}
}


function entityMoveEast()
{
	if (this.movesLeft()>0)
	{	
	this.xPos++;
	this.xOffset = -TILE_WIDTH;
	this.directionFacing = FACING_RIGHT;
	this.changeAnimation(ENTITY_WALKING);
	this.useMove();
	this.hurtOnThisTile = false;
	}
	else
	{
		raiseNotification('No Moves remaining');
	}
}


function entityMoveSouth()
{
	if (this.movesLeft()>0)
	{	
	this.yPos++;
	this.yOffset = -TILE_WIDTH;
	this.changeAnimation(ENTITY_WALKING);
	this.useMove();
	this.hurtOnThisTile = false;
	}
	else
	{
		raiseNotification('No Moves remaining');
	}
}

function entityMoveWest()
{
	if (this.movesLeft()>0)
	{	
	this.xPos--;
	this.xOffset = TILE_WIDTH;
	this.directionFacing = FACING_LEFT;
	this.changeAnimation(ENTITY_WALKING);
	this.useMove();
	this.hurtOnThisTile = false;
	}
	else
	{
		raiseNotification('No Moves remaining');
	}
}


function entityStealthRating()
{
	if (this.stealthEnabled == true)
	{
		return this.calcStealth;
	}
	else
	{
		return 0;
	}
}

function entityChanceToHit()
{
	return (this.calcFocus);
}

function entityChanceToDodge()
{
	return (this.calcDexterity + this.stealthRating());
}

function entityChanceToCrit()
{
	return (this.calcCritChance);
}

function entityChanceToResistCrit()
{
	return (this.calcCritResistChance);
}

function entityCalculateDamage()
{
	return (this.calcDamage);
}

function entityCalculateDamageResist()
{
	return (this.calcArmour);
}

function cleanUpEntities()
{
	for (var i=0; i < world.currentMap.entities.length; i++)
	{
		if ((world.currentMap.entities[i].currentAction == ENTITY_DEAD) && (world.currentMap.entities[i].cleanUpAfterDeath == true))
		{
		
			world.currentMap.entities.splice(i, 1);
		}
	}
}

//
//
// Main Game Loop
//
//

function gameLoop()
{


	if (gameData.cutScenePlaying == true)
	{
		drawCutScene();
		
	}
	else
	{

		//AI Control
		if ((world.turn == TURN_AI)&&(world.aiTurnOver == true))
		{
			changeBackToPlayerControl();
		}
		
		if (world.aiTimer > 0)
		{
			world.aiTimer--;
		}	
		
		if ((world.turn == TURN_AI)&&(world.aiTimer == 0))
		{


			if (world.currentMap.entities.length == 0)
			{
				world.aiTurnOver = true;
			}
			else
			{	
				if (world.currentMap.entities[world.aiCurrentEntity].movesLeft() > 0)
				{

					world.currentMap.entities[world.aiCurrentEntity].processAI();
				}
				else
				{
					world.aiCurrentEntity++;

					if (world.aiCurrentEntity >= world.currentMap.entities.length)
					{
					world.aiTurnOver = true;
					}
				}
			}
			
		}


		for (var i=0; i<world.players.length; i++)
		{
			world.players[i].processSpecialTiles();
			world.players[i].processAnimationFrame();
		}
		
		for (var i=0; i<world.currentMap.entities.length; i++)
		{
		
			world.currentMap.entities[i].processSpecialTiles();
			world.currentMap.entities[i].processAnimationFrame();
		}
		
		processScreenPosition();

		drawBackground();
	
		if (!EDIT_MODE)
		{	
			drawCharacters();
		}
	
		drawForeground();
	}
	

	if (gameData.gameLoop == true)
	{
		requestAnimationFrame(gameLoop);
	}
}


//
//
// Game Init Function
//
//

function init()
{

	Log('Initialising Engine');
	
	
	// screen setup
	screen.screenWidth = 800;
	screen.screenHeight = 600;

	// where is the screen in the world
	screen.xPos = 0;
	screen.yPos = 0;
	screen.currentPosX = 0;
	screen.currentPosY = 0;
	screen.background.width = 800;
	screen.background.height = 600;
	screen.characters.width = 800;
	screen.characters.height = 600;
	screen.foreground.width = 800;
	screen.foreground.height = 600;
	screen.backgroundCTX = screen.background.getContext('2d');
	screen.charactersCTX = screen.characters.getContext('2d');
	screen.foregroundCTX = screen.foreground.getContext('2d');
	
	screen.backgroundChanged = true;
	
	Log('Setting event handlers');
	//event handlers	
	document.onkeydown = keyboardPress;
	document.onkeyup = keyboardRelease;
	screen.foreground.onclick = gameScreenClick;
	
	document.getElementById('editorTool').onchange = changeTool;
	document.getElementById('teamMember1').onchange = updatePlayerSelectImage;
	document.getElementById('teamMember2').onchange = updatePlayerSelectImage;
	document.getElementById('teamMember3').onchange = updatePlayerSelectImage;


	// gameData Setup
	world.baseMap = document.createElement('canvas'); 
	world.baseMapCTX = world.baseMap.getContext('2d');

	

	
	
	world.selectedPlayer = -1;
	world.selectedNetwork = -1;

	world.upFlag = false;
	world.downFlag = false;
	world.leftFlag = false;
	world.rightFlag = false;


	// notifications

	screen.notificationTime = 0;
	screen.notificationText = "";
	
	// AI
	world.aiTimer = 0;
	world.aiCurrentEntity = -1;


}


//
//
// Turn Management
//
//

function nextTurn()
{
	world.turn = TURN_AI;
	
	raiseNotification('Processing AI');
	Log('Processing AI');
	world.aiCurrentEntity = 0;
	world.aiTurnOver = false;
	gameData.turnsTaken++;

	for (var i=0; i<world.currentMap.entities.length; i++)
	{

		if (world.currentMap.entities[i].isAlive())
		{
			Log('Resetting Moves for entity '+i);
			world.currentMap.entities[i].resetMoves();
			//world.currentMap.entities[i].processAI();
		}
	}

	updatePlayerDetails();
}

function changeBackToPlayerControl()
{
	world.turn = TURN_PLAYER;
	world.aiCurrentEntity = -1;
	for (var i=0; i<world.players.length; i++)
	{
		world.players[i].resetMoves();
	}
	raiseNotification('Player Turn');
	updatePlayerDetails();
}

function entityResetMoves()
{
	this.movesUsed = 0;
}

function entityMovesLeft()
{
	return this.movesPerTurn - this.movesUsed;
}

function entityUseMove()
{
	this.movesUsed++;
	updatePlayerDetails();
	//TODO: Remove this after testing
	if (this.movesUsed > this.movesPerTurn)
	{
		Log('Violation of Moves Per Turn');
	}
}

// 
//
// Notifications
//
//
function raiseNotification(text)
{
	screen.notificationTime = NOTIFICATION_LENGTH;
	screen.notificationText = text;
}


//
//
// Hacking
//
//

function processHack(x,y)
{
		if(world.players[world.selectedPlayer].movesLeft() == 0)
		{
			raiseNotification('No Moves Remaining');
			return false;
		}


		if (rollDice(world.players[world.selectedPlayer].calcHacking))
		{	

			if ((world.currentMap.tiles[x][y].flag == TILE_TYPE_DOOR)&&(world.currentMap.tiles[x][y].type == TILE_BLOCKED)&&(world.currentMap.tiles[x][y].network == world.selectedNetwork))
			{
				unlockDoor(x,y);
				world.players[world.selectedPlayer].useMove();
				generateBaseMap();
				screen.backgroundChanged = true;
				return true;
			}

			for (var i=0; i<world.currentMap.entities.length; i++)
			{
				if ((world.currentMap.entities[i].network == world.selectedNetwork)&&(world.currentMap.entities[i].type == ENTITY_SENTRY))
				{
					assumeControlOfSentry(i);
					world.players[world.selectedPlayer].useMove();
					return true;
				}
			}
		}

		else
		{
			//failed hack
			world.players[world.selectedPlayer].processHit(TERMINAL_ZAP);	
			raiseNotification("Hack failed - Received "+TERMINAL_ZAP+" damage");
			updatePlayerDetails();
		}

return false;

}

function unlockDoor(x,y)
{
	raiseNotification('Opening Door');
	world.currentMap.tiles[x][y].type = TILE_OPEN;
	world.currentMap.tiles[x][y].decalImage = -1;

}

function assumeControlOfSentry(i)
{

	world.currentMap.entities[i].aiModel = AI_PSENTRY;

}



//
//
// Combat
//
//




function rollDice(value)
{
	if (Math.random() <= value) 
	{
	return true;
	}
	else
	{
	return false;
	}
	
}

function chanceCompare(value1, value2)
{
	var compare = value1 - value2;
	
	if (compare < 0)
	{
	return 0;
	}
	else
	{
	return compare;
	}
	
}

function processAttack(attacker, defender)
{
//Log('processing attack');
	/*
	if (attacker.movesLeft() == 0)
	{
		raiseNotification('No Moves Remaining');
		return false;

	}

	attacker.useMove();
*/
	Log('Starting Attack');
	if (attacker.xPos >= defender.xPos)
	{
		attacker.directionFacing = FACING_LEFT;
		attacker.changeAnimation(ENTITY_ATTACKING);
	}
	else
	{
		attacker.directionFacing = FACING_RIGHT;
		attacker.changeAnimation(ENTITY_ATTACKING);
	}
	
	//calculate chance to hit
	var hit = attacker.chanceToHit()/100;
	var dodge = defender.chanceToDodge()/100;
	var crit = chanceCompare(attacker.chanceToCrit()/100, defender.chanceToResistCrit()/100);
	var damage = chanceCompare(attacker.calculateDamage(), defender.calculateDamageResist());
	
	
	if (rollDice(hit))
	{
	// we think we've hit
		if (rollDice(dodge))
		{
			// dodged
			raiseNotification("Shot fired, dodged!");

		}
		else
		{
			// hit!
			
			if (attacker.xPos >= defender.xPos)
			{
				defender.directionFacing = FACING_RIGHT;
				defender.changeAnimation(ENTITY_DEFENDING);
			}
			else
			{
				defender.directionFacing = FACING_LEFT;
				defender.changeAnimation(ENTITY_DEFENDING);
			}
			
			
			if (rollDice(crit))
			{
				//critical hit
				raiseNotification('Critical hit for '+damage*CRITICAL_HIT+' damage');
				defender.processHit(damage*CRITICAL_HIT);
			}
			else
			{
				//normal hit
				raiseNotification('Normal hit for '+damage+' damage');
				defender.processHit(damage);
			}
		}		
	}
	else
	{
		raiseNotification('Shot fired, missed enemy!');
	// missed
	}

	updatePlayerDetails;
}




//
//
// Cut Scene Display
//
//

function triggerCutScene(scene)
{
	gameData.cutScenePlaying = true;
	gameData.activeCutScene = scene;
	gameData.currentCutSceneFrame = 0;
	gameData.cutSceneCounter = 0;
	gameData.cutSceneSkip = false;

	screen.foregroundCTX.drawImage( 	gameData.imageCache[gameData.cutScenes[gameData.activeCutScene].scenes[gameData.currentCutSceneFrame].image], 0, 0);

}

function clearCutScene()
{
	gameData.cutScenePlaying = false;
	gameData.activeCutScene = 0;
	gameData.currentCutSceneFrame = 0;
	gameData.cutSceneCounter = 0;
	gameData.cutSceneSkip = false;

	gameData.cutScenes[world.currentMap.cutScene].played = true;


	screen.characters.style.webkitAnimation = 'fadein 3s';
	screen.background.style.webkitAnimation = 'fadein 3s';

}

function drawCutScene()
{
	gameData.cutSceneCounter++;
	if (gameData.cutSceneCounter >= CUTSCENE_DELAY)
	{
		gameData.cutSceneCounter = 0;
		gameData.currentCutSceneFrame++;
	
		if (gameData.currentCutSceneFrame >= gameData.cutScenes[gameData.activeCutScene].scenes.length)
		{
		// shut down the cut scene, its finished
			clearCutScene();
		}
		else
		{
			screen.foregroundCTX.drawImage( gameData.imageCache[gameData.cutScenes[gameData.activeCutScene].scenes[gameData.currentCutSceneFrame].image], 0, 0);
		}
	
	}
}


//
//
// Map Functionality
//
//

/*
function startNewGame()
{
	LoadStartMap();

	// Start the game Loop
	//setInterval("gameLoop()", 1000/60);
	


}
*/

function LoadStartMap()
{
	Log('Loading Start Map');
	if (LoadMap(0) == false)
	{
		newMap();
	}
}


function unlockNextMissions()
{
	for (var i=0; i < gameData.maps[gameData.currentMapNumber].unlocks.length; i++)
	{
		gameData.maps[i].unlocked = true;
	}
}

function LoadMap(id)
{
	Log('Loading map: '+id);
	var xhr = new XMLHttpRequest();
	
	xhr.open('GET', './maps/'+gameData.maps[id].file, false);
	xhr.setRequestHeader("If-Modified-Since", "Sat, 1 Jan 2005 00:00:00 GMT");
	
	xhr.send();
	
	if (xhr.status == 404)
	{
		Log('Failed to Load map');
		endMap();
		return false;
	}
	
	var mapText = xhr.responseText;
	
	gameData.currentMapNumber = id;
	resetStatistics();
	world.currentMap = JSON.parse(mapText);
	
	if (!world.players)
	{
		world.players = new Array();
		world.players[0] = new Entity(document.getElementById('teamMember1').value, 0, 0, TEAM_PC);
		world.players[1] = new Entity(document.getElementById('teamMember2').value, 1, 1, TEAM_PC);
		world.players[2] = new Entity(document.getElementById('teamMember3').value, 2, 2, TEAM_PC);
	}	

	//create the current map image
	
	processEntitySpawnPoints();
	generateBaseMap();
	
	findMapEntrance();
	

	if (world.currentMap.startX)
	{
		screen.xPos = parseInt(world.currentMap.startX);
		screen.yPos = parseInt(world.currentMap.startY);
	}


	if ((world.currentMap.cutScene >= 0)&&(gameData.cutScenes[world.currentMap.cutScene].played == false))
	{
		Log('Triggering Cut Scene '+world.currentMap.cutScene);
		triggerCutScene(world.currentMap.cutScene);
	}
	
	for (var i=0; i<world.players.length; i++)
	{
		world.players[i].changeAnimation(ENTITY_TELEPORTING);

	}
	gameData.gameLoop = true;
	requestAnimationFrame(gameLoop);
	
}

function endMap()
{
	Log('Map is complete. Cleaning up');
	gameData.gameLoop = false;
	gameData.maps[gameData.currentMapNumber].completed = true;
	world.selectedPlayer = -1;
	document.getElementById('playerDetails').style.visibility = 'hidden';
	unlockNextMissions();
	displayStatsScreen();
}


function newMap()
{
	Log('Generating new Map');
	
	var width = document.getElementById('width').value;
	var height = document.getElementById('height').value;
	
	world.currentMap = new map(width, height);
	screen.xPos = 0;
	screen.yPos = 0;
	screen.currentPosX = 0;
	screen.currentPosY = 0;

	processEntitySpawnPoints();
	generateBaseMap();
	screen.backgroundChanged = true;
}

function generateBaseMap()
{

	world.baseMap.width = world.currentMap.width*TILE_WIDTH;
	world.baseMap.height = world.currentMap.height*TILE_WIDTH;
	
	for (var i=0; i<world.currentMap.width; i++)
	{
		for (var j = 0; j<world.currentMap.height; j++)
		{
			world.baseMapCTX.drawImage(gameData.tileCache[world.currentMap.tiles[i][j].image], 0,0, TILE_WIDTH, TILE_WIDTH, i*TILE_WIDTH, j*TILE_WIDTH, TILE_WIDTH, TILE_WIDTH);
		
			if (world.currentMap.tiles[i][j].decalImage >= 0)
			{
				world.baseMapCTX.drawImage(gameData.tileCache[world.currentMap.tiles[i][j].decalImage], 0,0, TILE_WIDTH, TILE_WIDTH, i*TILE_WIDTH, j*TILE_WIDTH, TILE_WIDTH, TILE_WIDTH);
			}
			
		}
	}
}

function processEntitySpawnPoints()
{
	for (var i=0; i<world.currentMap.width; i++)
	{
		for (var j = 0; j<world.currentMap.height; j++)
		{
			if ((world.currentMap.tiles[i][j].flag == TILE_TYPE_ENEMY_SPAWN)&&(world.currentMap.tiles[i][j].enemySpawnTrigger == -1))
			{
				spawnEntityInMap(world.currentMap.tiles[i][j].enemySpawnID, i, j, world.currentMap.tiles[i][j].network, false);
			}
		}
	}
}

function findMapEntrance()
{
	var found1 = false;
	var found2 = false;
	var found3 = false;
	
	for (var i=0; i<world.currentMap.width; i++)
	{
		for (var j = 0; j<world.currentMap.height; j++)
		{
		
			if (world.currentMap.tiles[i][j].flag == TILE_TYPE_PLAYER_SPAWN)
			
			{ 
				if (world.currentMap.tiles[i][j].spawnID == 0)
				{
					Log('spawn point found for player 1');
					world.players[0].xPos = i;
					world.players[0].yPos = j;
					found1 = true;
				}
				if (world.currentMap.tiles[i][j].spawnID == 1)
				{
					Log('spawn point found for player 2');
					world.players[1].xPos = i;
					world.players[1].yPos = j;
					found2 = true;
				}
				if (world.currentMap.tiles[i][j].spawnID == 2)
				{
					Log('spawn point found for player 3');
					world.players[2].xPos = i;
					world.players[2].yPos = j;
					found3 = true;
				}
				
			}
			
		}
	}
	
	if (found1 == false)
	{
		world.players[0].xPos = 1;
		world.players[0].yPos = 1;
	}
	if (found2 == false)
	{
		world.players[1].xPos = 1;
		world.players[1].yPos = 1;
	}
	if (found3 == false)
	{
		world.players[2].xPos = 1;
		world.players[2].yPos = 1;
	}
	
}


function spawnEntityInMap(entityType, x, y, network, teleportIn)
{
	var tempEnt = new Entity(entityType, parseInt(x), parseInt(y), TEAM_AI, parseInt(network));
	
	if (teleportIn)
	{
		tempEnt.changeAnimation(ENTITY_TELEPORTING);
	}

	world.currentMap.entities.push(tempEnt);	
}

//
//
// Drawing Functionality
//
//
function drawBackground()
{

	if (screen.backgroundChanged == true)
	{
		//screen.background.width = screen.background.width;
		screen.backgroundCTX.clearRect(0,0, screen.screenWidth, screen.screenHeight);
		screen.backgroundCTX.drawImage(world.baseMap, screen.xPos, screen.yPos, screen.screenWidth, screen.screenHeight, 0,0, screen.screenWidth, screen.screenHeight);
		screen.backgroundChanged = false;

	if ((DEBUG_DRAW)||(EDIT_MODE))
	{
	
		var startX = Math.floor(screen.xPos/TILE_WIDTH);
		var endX = startX + Math.floor(screen.screenWidth/TILE_WIDTH);
		
		var startY = Math.floor(screen.yPos/TILE_WIDTH);
		var endY = startY + Math.floor(screen.screenHeight/TILE_WIDTH);
		// draw blocked tiles
		for (var i=startX; i<endX; i++)
		{
			for (var j=startY; j<endY; j++) 
			{
				if (world.currentMap.tiles[i][j].type == TILE_BLOCKED)
				{
					screen.backgroundCTX.fillStyle = 'rgba(255,0,0,0.5)';
					
					screen.backgroundCTX.fillRect(i*TILE_WIDTH - screen.xPos, j*TILE_WIDTH - screen.yPos, TILE_WIDTH, TILE_WIDTH);
				}
			}
		}
	}

	}	
}

function drawCharacters()
{

	//screen.characters.width = screen.characters.width;
	screen.charactersCTX.clearRect(0,0, screen.screenWidth, screen.screenHeight);
	for (var i=0; i<world.currentMap.entities.length; i++)
	{
		drawEntity(i);
	}

	for (var i=0; i<world.players.length; i++)
	{
	
		screen.charactersCTX.globalAlpha = 1- world.players[i].stealthRating()/100;
		screen.charactersCTX.drawImage(gameData.charCache[world.players[i].directionFacing][world.players[i].currentFrame], world.players[i].xPos*TILE_WIDTH - screen.xPos +world.players[i].xOffset, world.players[i].yPos*TILE_WIDTH - screen.yPos +world.players[i].yOffset);
		screen.charactersCTX.globalAlpha  = 1;	

		//draw health
		screen.charactersCTX.beginPath();
		screen.charactersCTX.moveTo(world.players[i].xPos*TILE_WIDTH- screen.xPos +world.players[i].xOffset, world.players[i].yPos*TILE_WIDTH- screen.yPos +world.players[i].yOffset);
		screen.charactersCTX.lineTo(world.players[i].xPos*TILE_WIDTH- screen.xPos +world.players[i].xOffset+TILE_WIDTH, world.players[i].yPos*TILE_WIDTH- screen.yPos +world.players[i].yOffset);
		screen.charactersCTX.lineWidth = 3;
		screen.charactersCTX.strokeStyle = '#000000';
		screen.charactersCTX.stroke();
		

		screen.charactersCTX.beginPath();
		screen.charactersCTX.moveTo(world.players[i].xPos*TILE_WIDTH- screen.xPos +world.players[i].xOffset, world.players[i].yPos*TILE_WIDTH- screen.yPos +world.players[i].yOffset);
		screen.charactersCTX.lineTo(world.players[i].xPos*TILE_WIDTH+ (world.players[i].currentHealth/world.players[i].maxHealth)*TILE_WIDTH- screen.xPos +world.players[i].xOffset, world.players[i].yPos*TILE_WIDTH- screen.yPos +world.players[i].yOffset);
		screen.charactersCTX.lineWidth = 3;
		screen.charactersCTX.strokeStyle = '#FF0000';
		screen.charactersCTX.stroke();
		
	}
	


	for (var i=0; i<world.currentMap.width; i++)
	{
		for (var j=0; j<world.currentMap.height; j++)
		{
			if (world.currentMap.tiles[i][j].item >= 0)
			{
				drawImageAtTile(LOOT, i,j,0,0);
			}

			if ((world.currentMap.tiles[i][j].flag == TILE_TYPE_DOOR)&&(world.currentMap.tiles[i][j].type == TILE_BLOCKED)&&(world.selectedNetwork >=0)&&(world.currentMap.tiles[i][j].network == world.selectedNetwork))
			{
				//Log('drawing tile hack selector');
				drawImageAtTile(HACK_SELECTOR, i, j,0,0);
			}

		}
	}



	if (world.selectedPlayer >= 0)
	{

		if ((world.players[world.selectedPlayer].xOffset ==0)&&(world.players[world.selectedPlayer].yOffset == 0))
		{
		if (world.players[world.selectedPlayer].isBlockedTileNorth() == false) 
		{
			drawImageAtTile(UP_ARROW, world.players[world.selectedPlayer].xPos, world.players[world.selectedPlayer].yPos -1,0,0);
		}
		if (world.players[world.selectedPlayer].isBlockedTileEast() == false) 
		{		
			drawImageAtTile(RIGHT_ARROW, world.players[world.selectedPlayer].xPos+1, world.players[world.selectedPlayer].yPos,0,0);
		}
		if (world.players[world.selectedPlayer].isBlockedTileSouth() == false) 
		{
			drawImageAtTile(DOWN_ARROW, world.players[world.selectedPlayer].xPos, world.players[world.selectedPlayer].yPos +1,0,0);
		}
		if (world.players[world.selectedPlayer].isBlockedTileWest() == false) 
		{
			drawImageAtTile(LEFT_ARROW, world.players[world.selectedPlayer].xPos-1, world.players[world.selectedPlayer].yPos,0,0);
		}
		}
		
	}


	
	
}

function drawImageAtTile(image,x,y,xOffset, yOffset)
{
	screen.charactersCTX.drawImage(gameData.imageCache[image], x*TILE_WIDTH - screen.xPos + xOffset, y*TILE_WIDTH - screen.yPos + yOffset);
}

function drawEntity(i)
{
	//Log('drawing entity '+i);
		screen.charactersCTX.drawImage(gameData.charCache[world.currentMap.entities[i].directionFacing][world.currentMap.entities[i].currentFrame], world.currentMap.entities[i].xPos*TILE_WIDTH - screen.xPos+world.currentMap.entities[i].xOffset, world.currentMap.entities[i].yPos*TILE_WIDTH  - screen.yPos+world.currentMap.entities[i].yOffset);
	
		if (world.aiCurrentEntity == i)
		{
			//Log(i);
			drawImageAtTile(SELECTOR, world.currentMap.entities[i].xPos, world.currentMap.entities[i].yPos, world.currentMap.entities[i].xOffset, world.currentMap.entities[i].yOffset);
		}
		// if its an enemy sentry
		if (world.currentMap.entities[i].aiModel == AI_SENTRY)
		{	
			if ((gameData.hackMode == true)&&(world.selectedNetwork == world.currentMap.entities[i].network))
			{
				drawImageAtTile(HACK_SELECTOR, world.currentMap.entities[i].xPos, world.currentMap.entities[i].yPos, 0, 0);
			}
		}
		if ((gameData.attackMode == true)&&(world.currentMap.entities[i].isAlive()))
		{
			drawImageAtTile(POTENTIAL_TARGET, world.currentMap.entities[i].xPos, world.currentMap.entities[i].yPos, 0, 0);
		}



		//draw health

		if (world.currentMap.entities[i].isAlive())
		{
			screen.charactersCTX.beginPath();
			screen.charactersCTX.moveTo(world.currentMap.entities[i].xPos*TILE_WIDTH- screen.xPos +world.currentMap.entities[i].xOffset, world.currentMap.entities[i].yPos*TILE_WIDTH- screen.yPos +world.currentMap.entities[i].yOffset);
			screen.charactersCTX.lineTo(world.currentMap.entities[i].xPos*TILE_WIDTH- screen.xPos +world.currentMap.entities[i].xOffset+TILE_WIDTH, world.currentMap.entities[i].yPos*TILE_WIDTH- screen.yPos +world.currentMap.entities[i].yOffset);
			screen.charactersCTX.lineWidth = 3;
			screen.charactersCTX.strokeStyle = '#000000';
			screen.charactersCTX.stroke();
		

			screen.charactersCTX.beginPath();
			screen.charactersCTX.moveTo(world.currentMap.entities[i].xPos*TILE_WIDTH- screen.xPos +world.currentMap.entities[i].xOffset, world.currentMap.entities[i].yPos*TILE_WIDTH- screen.yPos +world.currentMap.entities[i].yOffset);
			screen.charactersCTX.lineTo(world.currentMap.entities[i].xPos*TILE_WIDTH+ (world.currentMap.entities[i].currentHealth/world.currentMap.entities[i].maxHealth)*TILE_WIDTH- screen.xPos +world.currentMap.entities[i].xOffset, world.currentMap.entities[i].yPos*TILE_WIDTH- screen.yPos +world.currentMap.entities[i].yOffset);
			screen.charactersCTX.lineWidth = 3;
			screen.charactersCTX.strokeStyle = '#FF0000';
			screen.charactersCTX.stroke();
		}

}

function drawForeground()
{


	//screen.foreground.width = screen.foreground.width;
	screen.foregroundCTX.clearRect(0,0, screen.screenWidth, screen.screenHeight);

	screen.foregroundCTX.font = "bold 16pt sans-serif";
	screen.foregroundCTX.strokeStyle = "#000000";
	screen.foregroundCTX.fillStyle = "#FFFFFF";
	
	drawHUD();

	if (screen.notificationTime > 0)
	{
		screen.foregroundCTX.strokeText(screen.notificationText, 10, 20);
		screen.foregroundCTX.fillText(screen.notificationText, 10, 20);
		
		screen.notificationTime--;
	}


}


function drawHUD()
{

}


function processScreenPosition()
{

	if (world.upFlag == true)
	{
		screen.yPos = screen.yPos - 2;
		if (screen.yPos < 0)
		{
			screen.yPos = 0;
		}
	}
	if (world.downFlag == true)
	{
		screen.yPos = screen.yPos + 2;
	if (screen.yPos > (world.currentMap.height * TILE_WIDTH) - screen.screenHeight)
	{
		screen.yPos = (world.currentMap.height * TILE_WIDTH) - screen.screenHeight;
	}
	}
	if (world.leftFlag == true)
	{
		screen.xPos = screen.xPos - 2;
		if (screen.xPos < 0)
		{
			screen.xPos = 0;
		}
	}
	if (world.rightFlag == true)
	{
		screen.xPos = screen.xPos + 2;
	if (screen.xPos > (world.currentMap.width * TILE_WIDTH) - screen.screenWidth)
	{
		screen.xPos = (world.currentMap.width * TILE_WIDTH) - screen.screenWidth;
	}
	}
	screen.backgroundChanged = true;
}


//
//
// Audio
//
//

function loadSound(id, file)
{

	var request = new XMLHttpRequest();
	request.open('GET', file, true);
	request.responseType = 'arraybuffer';

	Log('Requesting Audio file '+id);

	request.onload = function() 
	{
		audioContext.decodeAudioData(request.response, function(buffer)
		{
			gameData.soundCache[id] = buffer;
		}, 
		function(err)
		{
			Log('Error in decode: '+err);
		}
		);
	}

	request.send();

}

function playSound(id)
{
	var source = audioContext.createBufferSource();
	source.buffer = gameData.soundCache[id];
	source.connect(audioContext.destination);
	source.noteOn(0);
}

function loadSounds()
{
	loadSound(SFX_ERROR, './sounds/histicks.wav');
}

//
//
// Tile Image Loading
//
//

function incrementCacheAndRun()
{
	gameData.numCacheLoaded++;
	if (gameData.numCacheLoaded == gameData.tileCache.length)
	{
		Log('Caching complete');
		init();
	}
}

function loadTiles()
{

	gameData.numCacheLoaded = 0;
	
//Dont move these out of order as it affects map images

	loadTile('./images/void-000.png');

	loadTile('./images/wall-000.png');
	loadTile('./images/wall-001.png');
	loadTile('./images/wall-002.png');
	loadTile('./images/wall-003.png');
	loadTile('./images/wall-004.png');
	loadTile('./images/wall-005.png');
	loadTile('./images/wall-006.png');
	loadTile('./images/wall-007.png');
	loadTile('./images/wall-008.png');
	loadTile('./images/wall-009.png');
	loadTile('./images/wall-010.png');
	loadTile('./images/wall-011.png');
	loadTile('./images/wall-012.png');
	loadTile('./images/wall-013.png');
	loadTile('./images/wall-014.png');
	loadTile('./images/wall-015.png');
	loadTile( './images/wall-016.png');
	loadTile( './images/wall-017.png');
	loadTile( './images/wall-018.png');
	loadTile( './images/wall-019.png');
	loadTile( './images/wall-020.png');
	loadTile( './images/wall-021.png');
	loadTile( './images/wall-022.png');
	loadTile( './images/wall-023.png');
	loadTile( './images/wall-024.png');
	loadTile( './images/wall-025.png');
	loadTile( './images/wall-026.png');
	loadTile( './images/wall-027.png');


	loadTile('./images/floor-000.png');	
	loadTile('./images/floor-001.png');
	loadTile('./images/floor-002.png');
	loadTile('./images/floor-003.png');
	loadTile('./images/floor-004.png');
	loadTile('./images/floor-005.png');

	loadTile( './images/road-000.png');
	loadTile( './images/road-001.png');
	loadTile( './images/road-002.png');
	loadTile( './images/road-003.png');

	loadTile( './images/decal-door-00.png');
	loadTile( './images/decal-door-01.png');
	loadTile( './images/decal-door-02.png');
	loadTile( './images/decal-door-03.png');
	loadTile( './images/decal-door-04.png');
		
	loadTile( './images/decal-hack.png');
	loadTile( './images/decal-pipes.png');	
	loadTile( './images/decal-station-01.png');
	loadTile( './images/decal-station-02.png');
	loadTile( './images/decal-table.png');	
	loadTile( './images/decal-teleporter.png');	

	loadTile( './images/decal-spikes.png');
	loadTile( './images/decal-sector-01.png');
	loadTile( './images/decal-sector-02.png');
	loadTile( './images/decal-slime.png');

	loadTile( './images/decal-radiation.png');
	loadTile( './images/decal-exit.png');
	loadTile( './images/decal-desk.png');
	loadTile( './images/decal-trash.png');
	loadTile( './images/decal-plant.png');
	loadTile( './images/decal-reactor.png');
	loadTile( './images/inv-key-red.png');
	loadTile( './images/inv-key-blu.png');

}

function loadTile(file)
{
	var id = gameData.tileCache.length;

	Log('loading tile: '+id+' '+file);
	gameData.tileCache[id] = new Image();
	gameData.tileCache[id].onload = incrementCacheAndRun;
	gameData.tileCache[id].src = file;
}

function loadImage(id, file)
{
	gameData.imageCache[id] = new Image();
	gameData.imageCache[id].src = file;
}

function loadCharImage(id, file)
{
	gameData.charCache[FACING_LEFT][id] = new Image();
	gameData.charCache[FACING_LEFT][id].onload = function()
	{
		var copyCanvas = document.createElement("canvas");
		var ctx = copyCanvas.getContext("2d");
	
		copyCanvas.width = TILE_WIDTH;
		copyCanvas.height = TILE_WIDTH;
		
		ctx.translate(TILE_WIDTH, 0);
		ctx.scale(-1,1);
		
		ctx.drawImage(gameData.charCache[FACING_LEFT][id], 0,0, TILE_WIDTH, TILE_WIDTH);
		
		gameData.charCache[FACING_RIGHT][id] = new Image();
		gameData.charCache[FACING_RIGHT][id].src = copyCanvas.toDataURL();
	}
	
	gameData.charCache[FACING_LEFT][id].src = file;
}

function loadImages()
{

	loadCharImage(ENTITY_NULL_IMAGE, './images/entity_null.png');
	
	loadCharImage(ENTITY_BLU_SPY_STANDING, './images/char-000.png');
	loadCharImage(ENTITY_BLU_SPY_ATTACKING_1, './images/char-001.png');
	loadCharImage(ENTITY_BLU_SPY_ATTACKING_2, './images/char-002.png');
	loadCharImage(ENTITY_BLU_SPY_WALKING_1, './images/char-003.png');
	loadCharImage(ENTITY_BLU_SPY_WALKING_2, './images/char-004.png');
	loadCharImage(ENTITY_BLU_SPY_TELEPORTING_1, './images/char-005.png');
	loadCharImage(ENTITY_BLU_SPY_TELEPORTING_2, './images/char-006.png');
	loadCharImage(ENTITY_BLU_SPY_TELEPORTING_3, './images/char-007.png');


	loadCharImage(ENTITY_RED_SPY_STANDING, './images/char-100.png');
	loadCharImage(ENTITY_RED_SPY_ATTACKING_1, './images/char-101.png');
	loadCharImage(ENTITY_RED_SPY_ATTACKING_2, './images/char-102.png');
	loadCharImage(ENTITY_RED_SPY_WALKING_1, './images/char-103.png');
	loadCharImage(ENTITY_RED_SPY_WALKING_2, './images/char-104.png');
	loadCharImage(ENTITY_RED_SPY_TELEPORTING_1, './images/char-105.png');
	loadCharImage(ENTITY_RED_SPY_TELEPORTING_2, './images/char-106.png');
	loadCharImage(ENTITY_RED_SPY_TELEPORTING_3, './images/char-107.png');

	loadCharImage(ENTITY_BLU_SOLDIER_STANDING, './images/char-200.png');
	loadCharImage(ENTITY_BLU_SOLDIER_ATTACKING_1, './images/char-201.png');
	loadCharImage(ENTITY_BLU_SOLDIER_ATTACKING_2, './images/char-202.png');
	loadCharImage(ENTITY_BLU_SOLDIER_WALKING_1, './images/char-203.png');
	loadCharImage(ENTITY_BLU_SOLDIER_WALKING_2, './images/char-204.png');
	loadCharImage(ENTITY_BLU_SOLDIER_TELEPORTING_1, './images/char-205.png');
	loadCharImage(ENTITY_BLU_SOLDIER_TELEPORTING_2, './images/char-206.png');
	loadCharImage(ENTITY_BLU_SOLDIER_TELEPORTING_3, './images/char-207.png');

	loadCharImage(ENTITY_RED_SOLDIER_STANDING, './images/char-300.png');
	loadCharImage(ENTITY_RED_SOLDIER_ATTACKING_1, './images/char-301.png');
	loadCharImage(ENTITY_RED_SOLDIER_ATTACKING_2, './images/char-302.png');
	loadCharImage(ENTITY_RED_SOLDIER_WALKING_1, './images/char-303.png');
	loadCharImage(ENTITY_RED_SOLDIER_WALKING_2, './images/char-304.png');
	loadCharImage(ENTITY_RED_SOLDIER_TELEPORTING_1, './images/char-305.png');
	loadCharImage(ENTITY_RED_SOLDIER_TELEPORTING_2, './images/char-306.png');
	loadCharImage(ENTITY_RED_SOLDIER_TELEPORTING_3, './images/char-307.png');

	loadCharImage(ENTITY_BLU_MECH_STANDING, './images/char-400.png');
	loadCharImage(ENTITY_BLU_MECH_ATTACKING_1, './images/char-401.png');
	loadCharImage(ENTITY_BLU_MECH_ATTACKING_2, './images/char-402.png');
	loadCharImage(ENTITY_BLU_MECH_WALKING_1, './images/char-403.png');
	loadCharImage(ENTITY_BLU_MECH_TELEPORTING_1, './images/char-404.png');
	loadCharImage(ENTITY_BLU_MECH_TELEPORTING_2, './images/char-405.png');
	loadCharImage(ENTITY_BLU_MECH_TELEPORTING_3, './images/char-406.png');

	loadCharImage(ENTITY_RED_MECH_STANDING, './images/char-500.png');
	loadCharImage(ENTITY_RED_MECH_ATTACKING_1, './images/char-501.png');
	loadCharImage(ENTITY_RED_MECH_ATTACKING_2, './images/char-502.png');
	loadCharImage(ENTITY_RED_MECH_WALKING_1, './images/char-503.png');
	loadCharImage(ENTITY_RED_MECH_TELEPORTING_1, './images/char-504.png');
	loadCharImage(ENTITY_RED_MECH_TELEPORTING_2, './images/char-505.png');
	loadCharImage(ENTITY_RED_MECH_TELEPORTING_3, './images/char-506.png');
	
	loadCharImage(ENTITY_SENTRY_STANDING_1, './images/sentry-000.png');
	loadCharImage(ENTITY_SENTRY_STANDING_2, './images/sentry-001.png');
	loadCharImage(ENTITY_SENTRY_ATTACKING_1, './images/sentry-002.png');
	loadCharImage(ENTITY_SENTRY_ATTACKING_2, './images/sentry-003.png');
	loadCharImage(ENTITY_SENTRY_DYING_1, './images/sentry-004.png');
	loadCharImage(ENTITY_SENTRY_DYING_2, './images/sentry-005.png');
	loadCharImage(ENTITY_SENTRY_DYING_3, './images/sentry-006.png');
	loadCharImage(ENTITY_SENTRY_DYING_4, './images/sentry-007.png');
	loadCharImage(ENTITY_SENTRY_DYING_5, './images/sentry-008.png');
	loadCharImage(ENTITY_SENTRY_DEAD, './images/sentry-009.png');

	loadCharImage(ENTITY_SENTRY_TELEPORTING_1, './images/sentry-010.png');
	loadCharImage(ENTITY_SENTRY_TELEPORTING_2, './images/sentry-011.png');
	loadCharImage(ENTITY_SENTRY_TELEPORTING_3, './images/sentry-012.png');
	loadCharImage(ENTITY_SENTRY_TELEPORTING_4, './images/sentry-013.png');




//Just in case
	loadImage(0, './images/entity_null.png');
// cut scene images
	loadImage(CS_1, './images/intro1.png');
	loadImage(CS_2, './images/intro2.png');
//UI items
	loadImage(UP_ARROW, './images/up-arrow.png');
	loadImage(RIGHT_ARROW, './images/right-arrow.png');
	loadImage(DOWN_ARROW, './images/down-arrow.png');
	loadImage(LEFT_ARROW, './images/left-arrow.png');
	loadImage(SELECTOR, './images/selector.png');
	loadImage(HACK_SELECTOR, './images/selector2.png');
	loadImage(POTENTIAL_TARGET, './images/potential-target.png');
	loadImage(LOOT, './images/loot.png');

	//loadImage(IMAGE_MEDKIT, './images/');
	//loadImage(IMAGE_TURNREFILL, './images/');

	loadImage(IMAGE_STEALTH_SUIT, './images/inv-stealthsuit.png');
	loadImage(IMAGE_STEALTH_EMITTERS, './images/inv-stealth-emit.png');
	loadImage(IMAGE_HACKING_MODULE, './images/inv-hack.png');
	loadImage(IMAGE_HACKING_JACK, './images/inv-hack-gold.png');
	loadImage(IMAGE_SHIELD, './images/inv-shield.png');
	loadImage(IMAGE_SHIELD_BOOSTER, './images/inv-shield-booster.png');
	loadImage(IMAGE_WEAPON_SCOPE, './images/inv-weapon-scope.png');
	loadImage(IMAGE_WEAPON_POWER_BOOSTER, './images/inv-weapon-booster.png');
	loadImage(IMAGE_CHEST_ARMOUR, './images/inv-chest-armour.png');
	loadImage(IMAGE_LEG_ARMOUR, './images/inv-leg-armour.png');
	loadImage(IMAGE_ARMOUR_PATCH, './images/inv-armour-patch.png');
	loadImage(IMAGE_ARMOUR_SHOCKRESIST, './images/inv-shock-resist.png');
	loadImage(IMAGE_LEG_BOOSTERS, './images/inv-leg-booster.png');
	loadImage(IMAGE_ENHANCED_GOGGLES, './images/inv-vision-goggles.png');


	loadImage(IMAGE_KEY_RED, './images/inv-key-red.png');
	loadImage(IMAGE_KEY_BLU, './images/inv-key-blu.png');
	loadImage(IMAGE_GOAL_INFO, './images/inv-goal-info.png');


}

//
//
// Input Processing
//
//

function keyboardPress(e)
{
	
	if (gameData.cutScenePlaying == true)
	{
	clearCutScene();
	}
	
	switch (e.keyCode)
	{
	case KEY_ESCAPE:
	
		disableAttackMode();
		disableHackMode();
	break;
	
	case KEY_W:
	case KEY_UP:
	//up
		world.upFlag = true;
	break;
	case KEY_S:
	case KEY_DOWN:
		world.downFlag = true;
	//down
	break;
	case KEY_A:
	case KEY_LEFT:
		world.leftFlag = true;
	//left
	break;
	case KEY_D:
	case KEY_RIGHT:
		world.rightFlag = true;
	//right
	case KEY_E:
	//use/activate
	break;
	
	case KEY_SPACE:

	break;
	
	case KEY_1:
	world.selectedPlayer = 0;
	break;
	
	case KEY_2:
	world.selectedPlayer = 1;
	break;
	
	case KEY_3:
	world.selectedPlayer = 2;
	break;
	
	case KEY_N:
		NextTurn();
	break;

	default:
		Log(e.keyCode);
	
	break;
	}

}

function keyboardRelease(e)
{
	switch (e.keyCode)
	{
	case KEY_W:
	case KEY_UP:
	//up
		world.upFlag = false;
	break;
	case KEY_S:
	case KEY_DOWN:
		world.downFlag = false;
	//down
	break;
	case KEY_A:
	case KEY_LEFT:
		world.leftFlag = false;
	//left
	break;
	case KEY_D:
	case KEY_RIGHT:
		world.rightFlag = false;
	//right
	break;
	default:
	break;
	}

}

//
//
// Collision Detection
//
//

function lineOfSight(attacker, defender)
{
//http://free.pages.at/easyfilter/bresenham.html

	var x0, y0, x1, y1;
	x0 = attacker.xPos;
	y0 = attacker.yPos;
	x1 = defender.xPos;
	y1 = defender.yPos;

	var dx, sx, dy, sy;
	var distance = 0;


	dx= Math.abs(x1-x0);
	if (x0 < x1)
	{
		sx = 1;
	}
	else
	{
		sx =-1;
	}
	dy = -Math.abs(y1-y0);
	
	if (y0 < y1)
	{
		sy = 1;
	}
	else
	{
		sy = -1;
	}
	
	var err = dx+dy;
	var err2;
	
	while (true)
	{
	
		if (world.currentMap.tiles[x0][y0].type == TILE_BLOCKED)
		{
			return -1;
		}
	
		if ((x0 ==x1) && (y0 == y1))
		{
			break;
		}
	
		err2 = 2*err;
	
		if (err2 >= dy) { err += dy; x0 += sx; }
		if (err2 <= dx) { err += dx; y0 += sy; }
		distance++;
	
	}
	//Log(distance);
	return distance;
}


function distanceToPlayer(entity)
{
	return Math.sqrt(Math.pow(Math.abs(entity.xPos - world.player.xPos),2) + Math.pow(Math.abs(entity.yPos - world.player.yPos),2));
}

function xPosOverlap(x1, range1, x2, range2)
{

// [......x1.......]
//          [...........x2........]
// true

// [......x1.................]
//          [......x2.....]
// true

// [......x2.................]
//          [......x1.....]
// true

// [......x1....]
//                    [...........x2........]
// false

// [......x2....]
//                    [.....x1..]
// false

	if ((x1 - range1/2) > (x2 + range2/2))
	{
		return false;
	}
	
	if ((x1 + range1/2) < (x2 - range2/2))
	{
		return false;
	}
	
	return true;
}

function yPosOverlap(y1, range1, y2, range2)
{

	if ((y1 - range1) > (y2))
	{
		return false;
	}
	
	if ((y1) < (y2 - range2))
	{
		return false;
	}
	
	return true;
}


//
//
// Utility Functions
//
//

function Log(text)
{
	var time = new Date();
	console.log('['+time+']'+text);
}


function outputMap()
{
	world.currentMap.entities = [];
	for (var i=0; i<world.currentMap.width; i++)
	{
		for (var j=0; j<world.currentMap.height; j++)
		{
			world.currentMap.tiles[i][j].switchTriggered = false;
		}
	}

console.log(JSON.stringify(world.currentMap));
}

function resetStatistics()
{
	gameData.kills = 0;
	gameData.turnsTaken = 0;
	gameData.damageApplied = 0;
	gameData.damageTaken = 0;
}

//
//
// Image Manipulation
//
//
/*
function paletteSwap(charImage)
{
		var copyCanvas = document.createElement("canvas");
		var ctx = copyCanvas.getContext("2d");
	
		copyCanvas.width = TILE_WIDTH;
		copyCanvas.height = TILE_WIDTH;
				
		ctx.drawImage(gameData.charCache[FACING_LEFT][charImage], 0,0, TILE_WIDTH, TILE_WIDTH);
		
		var imageData = ctx.getImageData(0,0,TILE_WIDTH, TILE_WIDTH);

		for (var i=0; i<TILE_WIDTH; i++)
		{
			for (var j=0; j<TILE_WIDTH; j++)
			{
				swapBlueRedPixel(imageData, i, j);
			}
		}

		ctx.putImageData(imageData, 0, 0);

		return copyCanvas.toDataURL();
		//gameData.charCache[FACING_RIGHT][id] = new Image();
		//gameData.charCache[FACING_RIGHT][id].src = copyCanvas.toDataURL();
}


function swapBlueRedPixel(imageData, x, y) {
    index = (x + y * imageData.width) * 4;
    var temp;
   	temp = imageData.data[index+0];
    imageData.data[index+0] = imageData.data[index+2];
    imageData.data[index+2] = temp;
}
*/