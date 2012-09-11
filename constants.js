//
//
// CT Constants 
//
//

// constant values
var TILE_WIDTH = 32;

// tile collision types
var TILE_OPEN = 0;
var TILE_BLOCKED = 1;

var CUTSCENE_DELAY = 300; //60 fps: 10 seconds


var TILE_TYPE_NORMAL = 0;
var TILE_TYPE_PLAYER_SPAWN = 1;
var TILE_TYPE_EXIT = 2;
var TILE_TYPE_HACK = 3;
var TILE_TYPE_DOOR = 4;
var TILE_TYPE_TELEPORTER = 5;
var TILE_TYPE_ENEMY_SPAWN = 6;
var TILE_TYPE_AUTO_SWITCH = 7;
var TILE_TYPE_HURT = 8;


//object types

var TOOL_PAINT = 0;
var TOOL_EDIT = 1;
var TOOL_BLOCK = 2;

var KEY_A = 65;
var KEY_B = 66;
var KEY_C = 67;
var KEY_D = 68;
var KEY_E = 69;
var KEY_F = 70;
var KEY_G = 71;
var KEY_H = 72;
var KEY_I = 73;
var KEY_J = 74;
var KEY_K = 75;
var KEY_L = 76;
var KEY_M = 77;
var KEY_N = 78;
var KEY_O = 79;
var KEY_P = 80;
var KEY_Q = 81;
var KEY_R = 82;
var KEY_S = 83;
var KEY_T = 84;
var KEY_U = 85;
var KEY_V = 86;
var KEY_W = 87;
var KEY_X = 88;
var KEY_Y = 89;
var KEY_Z = 90;


var KEY_SPACE = 32;
var KEY_TILDE = 192;
var KEY_TAB = 9;
var KEY_SHIFT = 16;
var KEY_CTRL = 17;
var KEY_OPTION = 18;
var KEY_CMD = 91;

var KEY_ESCAPE = 27;

var KEY_UP = 38;
var KEY_DOWN = 40;
var KEY_LEFT = 37;
var KEY_RIGHT = 39;

var KEY_1 = 49;
var KEY_2 = 50;
var KEY_3 = 51;
var KEY_4 = 52;
var KEY_5 = 53;
var KEY_6 = 54;
var KEY_7 = 55;
var KEY_8 = 56;
var KEY_9 = 57;
var KEY_0 = 48;


// images

var ENTITY_NULL_IMAGE = 0;

var ENTITY_BLU_SPY_STANDING = 1;
var ENTITY_BLU_SPY_ATTACKING_1 = 2;
var ENTITY_BLU_SPY_ATTACKING_2 = 3;
var ENTITY_BLU_SPY_WALKING_1 = 4;
var ENTITY_BLU_SPY_WALKING_2 = 5;
var ENTITY_BLU_SPY_TELEPORTING_1 = 6;
var ENTITY_BLU_SPY_TELEPORTING_2 = 7;
var ENTITY_BLU_SPY_TELEPORTING_3 = 8;

var ENTITY_RED_SPY_STANDING = 9;
var ENTITY_RED_SPY_ATTACKING_1 = 10;
var ENTITY_RED_SPY_ATTACKING_2 = 11;
var ENTITY_RED_SPY_WALKING_1 = 12;
var ENTITY_RED_SPY_WALKING_2 = 13;
var ENTITY_RED_SPY_TELEPORTING_1 = 14;
var ENTITY_RED_SPY_TELEPORTING_2 = 15;
var ENTITY_RED_SPY_TELEPORTING_3 = 16;

var ENTITY_BLU_SOLDIER_STANDING = 17;
var ENTITY_BLU_SOLDIER_ATTACKING_1 = 18;
var ENTITY_BLU_SOLDIER_ATTACKING_2 = 19;
var ENTITY_BLU_SOLDIER_WALKING_1 = 20;
var ENTITY_BLU_SOLDIER_WALKING_2 = 21;
var ENTITY_BLU_SOLDIER_TELEPORTING_1 = 22;
var ENTITY_BLU_SOLDIER_TELEPORTING_2 = 23;
var ENTITY_BLU_SOLDIER_TELEPORTING_3 = 24;

var ENTITY_RED_SOLDIER_STANDING = 25;
var ENTITY_RED_SOLDIER_ATTACKING_1 = 26;
var ENTITY_RED_SOLDIER_ATTACKING_2 = 27;
var ENTITY_RED_SOLDIER_WALKING_1 = 28;
var ENTITY_RED_SOLDIER_WALKING_2 = 29;
var ENTITY_RED_SOLDIER_TELEPORTING_1 = 30;
var ENTITY_RED_SOLDIER_TELEPORTING_2 = 31;
var ENTITY_RED_SOLDIER_TELEPORTING_3 = 32;

var ENTITY_SENTRY_STANDING_1 = 33;
var ENTITY_SENTRY_STANDING_2 = 34;
var ENTITY_SENTRY_ATTACKING_1 = 35;
var ENTITY_SENTRY_ATTACKING_2 = 36;
var ENTITY_SENTRY_DYING_1 = 37;
var ENTITY_SENTRY_DYING_2 = 38;
var ENTITY_SENTRY_DYING_3 = 39;
var ENTITY_SENTRY_DYING_4 = 40;
var ENTITY_SENTRY_DYING_5 = 41;
var ENTITY_SENTRY_DEAD = 42;

var ENTITY_SENTRY_TELEPORTING_1 = 43;
var ENTITY_SENTRY_TELEPORTING_2 = 44;
var ENTITY_SENTRY_TELEPORTING_3 = 45;
var ENTITY_SENTRY_TELEPORTING_4 = 46;



var ENTITY_BLU_MECH_STANDING = 47;
var ENTITY_BLU_MECH_ATTACKING_1 = 48;
var ENTITY_BLU_MECH_ATTACKING_2 = 49;
var ENTITY_BLU_MECH_WALKING_1 = 50;
var ENTITY_BLU_MECH_TELEPORTING_1 = 51;
var ENTITY_BLU_MECH_TELEPORTING_2 = 52;
var ENTITY_BLU_MECH_TELEPORTING_3 = 53;

var ENTITY_RED_MECH_STANDING = 54;
var ENTITY_RED_MECH_ATTACKING_1 = 55;
var ENTITY_RED_MECH_ATTACKING_2 = 56;
var ENTITY_RED_MECH_WALKING_1 = 57;
var ENTITY_RED_MECH_TELEPORTING_1 = 58;
var ENTITY_RED_MECH_TELEPORTING_2 = 59;
var ENTITY_RED_MECH_TELEPORTING_3 = 60;




var SELECTOR = 100;
var POTENTIAL_TARGET = 101;
var HACK_SELECTOR = 102;

var UP_ARROW = 200;
var RIGHT_ARROW = 201;
var DOWN_ARROW = 202;
var LEFT_ARROW = 203;
var LOOT = 204;

var IMAGE_MEDKIT = 205;
var IMAGE_TURNREFILL = 206;

var IMAGE_STEALTH_SUIT = 207;
var IMAGE_STEALTH_EMITTERS = 208;

var IMAGE_HACKING_MODULE = 209;
var IMAGE_HACKING_JACK = 210;

var IMAGE_SHIELD = 211;
var IMAGE_SHIELD_BOOSTER = 212;

var IMAGE_WEAPON_SCOPE = 213;
var IMAGE_WEAPON_POWER_BOOSTER = 214;

var IMAGE_CHEST_ARMOUR = 215;
var IMAGE_LEG_ARMOUR= 216;
var IMAGE_ARMOUR_PATCH = 217;
var IMAGE_ARMOUR_SHOCKRESIST = 218;

var IMAGE_LEG_BOOSTERS = 219;
var IMAGE_ENHANCED_GOGGLES = 220;

var IMAGE_KEY_RED = 221;
var IMAGE_KEY_BLU = 222;
var IMAGE_GOAL_INFO = 223;


// cut-scene images
var CS_1 = 300;
var CS_2 = 301;


// Animations

var ENTITY_STAND = 0;
var ENTITY_WALKING = 1;
var ENTITY_DYING = 2;
var ENTITY_DEAD = 3;
var ENTITY_ATTACKING = 4;
var ENTITY_DEFENDING = 5;
var ENTITY_TELEPORTING = 6;

var ANIMATION_FRAME = 6;
var FACING_RIGHT = 1;
var FACING_LEFT = 0;

// entity types
var ENTITY_SPY = 0;
var ENTITY_MECH = 1;
var ENTITY_SOLDIER = 2;
var ENTITY_SENTRY = 3;

//team
var TEAM_PC = 0;
var TEAM_AI = 1;

// AI Models
var AI_NULL = 0; // not controlled by AI
var AI_SENTRY = 1; // enemy sentry
var AI_PSENTRY = 2; //player controlled sentry
var AI_SOLDIER = 3;

// turn management
var TURN_PLAYER = 0;
var TURN_AI =1;
var DELAY_AI = 64;

// Combat
var CRITICAL_HIT = 2;
var TERMINAL_ZAP = 10;
var ENVIRONMENT_HIT = 10;

//Notifications
var NOTIFICATION_LENGTH= 180;


// Loot / inventory items


var INV_STEALTH_SUIT = 0;
var INV_STEALTH_EMITTERS = 1;

var INV_HACKING_MODULE = 2;
var INV_HACKING_JACK = 3;

var INV_SHIELD = 4;
var INV_SHIELD_BOOSTER = 5;

var INV_WEAPON_SCOPE = 6;
var INV_WEAPON_POWER_BOOSTER = 7;

var INV_CHEST_ARMOUR = 8;
var INV_LEG_ARMOUR= 9;
var INV_ARMOUR_PATCH = 10;
var INV_ARMOUR_SHOCKRESIST = 11;

var INV_LEG_BOOSTERS = 12;
var INV_ENHANCED_GOGGLES = 13;


var INV_GOAL_INFO = 14;
var INV_KEY_RED = 15;
var INV_KEY_BLU = 16;

//var LOOT_MEDKIT = 14;
//var LOOT_TURNREFILL = 15;

//Sounds
var SFX_ERROR = 0;


