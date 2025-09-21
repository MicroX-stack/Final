/** Generates unique ID using timestamp and random string */
const generateId = (): string => `${Date.now()}${Math.random().toString(36).slice(2, 9)}`;

/** Adds player to list immutably */
const addPlayerToList = (players: Player[], player: Player): Player[] => [...players, player];

/** Returns true/false with 50% probability for catch result */
const randomBoolean = (): boolean => Math.random() > 0.5;

/** List of Pokemon names for random selection */
const pokemonList: string[] = [
  'Pikachu', 'Gengar', 'Fudin', 'Charizard', 'Jigglypuff',
  'Eevee', 'Snorlax', 'Mewtwo', 'Dragonite'
];

/** Randomly select a Pokemon name */
const getRandomPokemon = (): string => {
  return pokemonList[Math.floor(Math.random() * pokemonList.length)];
};

// OOP Classes
/** Base class for players */
class Player {
  // Public  
  id: string; // Unique identifier for the player
  name: string; // Player's name
  hasPlayed: boolean = false; // Tracks if player has participated

  constructor(name: string) {
    if (!name || name.trim() === '') {
      throw new Error('Player name cannot be empty');
    }
    this.id = generateId();
    this.name = name.trim();
  }

  // Public methods (accessible from outside the class)
  /** Simulates catching Pokemon with random result */
  catchPokemon(): boolean {
    const success = randomBoolean();
    console.log(`${this.name}: ${success ? 'Done!' : 'Failed'}`);
    return success;
  }

  /** Marks player as having participated */
  markAsPlayed(): void {
    this.hasPlayed = true;
  }
}

/** Leader class extends Player with additional responsibility */
class Leader extends Player {
  constructor(name: string) {
    super(name);
    console.log(`${this.name} is the room leader`);
  }
  // Inherits all public properties and methods from Player
  // No additional properties or methods, so all are public
}

/** Represents a Pokemon with name and location */
class Pokemon {
  // Public properties
  name: string; // Pokemon's name
  location: string; // Pokemon's location

  constructor(name: string, location: string) {
    if (!name || !location) {
      throw new Error('Pokemon name and location cannot be empty');
    }
    this.name = name.trim();
    this.location = location.trim();
  }
  // No methods, so all members are public properties
}

/** Manages mission to catch Pokemon */
class Mission {
  // Public properties
  id: string; // Unique mission ID
  pokemon: Pokemon; // Pokemon to catch
  duration: number = 10 * 1000; // 10 seconds
  startTime: number | null = null; // Mission start time
  endTime: number | null = null; // Mission end time
  results: Map<string, boolean> = new Map(); // Player catch results

  constructor(pokemon: Pokemon) {
    this.id = generateId();
    this.pokemon = pokemon;
  }

  // Public methods
  /** Starts mission and sets timer */
  start(): void {
    this.startTime = Date.now();
    this.endTime = this.startTime + this.duration;
    console.log(`Mission started at ${this.pokemon.location} with ${this.pokemon.name}. Time: ${this.duration / 1000} sec`);
  }

  /** Checks if mission is active */
  isActive(): boolean {
    return !!(this.startTime && this.endTime && Date.now() < this.endTime);
  }

  /** Ends mission and processes results for all players */
  end(players: Player[]): void {
    console.log('Mission ended. Catch results:');
    players.forEach(player => {
      const success = player.catchPokemon();
      this.results.set(player.id, success);
      player.markAsPlayed();
    });
  }
}

/** Manages game room and players */
class Room {
  // Public properties
  id: string; // Unique room ID
  leader: Leader; // Room leader
  players: Player[] = []; // List of players
  maxPlayers: number; // Maximum players allowed
  mission: Mission | null = null; // Current mission
  joinWindow: number = 5 * 1000; // 5 seconds
  createdAt: number; // Room creation time
  joinDeadline: number; // Join deadline
  isJoinOpen: boolean = true; // Join status
  timer: number | null = null; // Timer for join window (browser-compatible)

  constructor(leader: Leader, pokemonName: string, location: string, maxPlayers: number) {
    if (maxPlayers < 1) {
      throw new Error('Max players must be at least 1');
    }
    this.id = generateId();
    this.leader = leader;
    this.players = addPlayerToList(this.players, leader);
    this.maxPlayers = maxPlayers;
    this.createdAt = Date.now();
    this.joinDeadline = this.createdAt + this.joinWindow;
    this.mission = new Mission(new Pokemon(pokemonName, location));
    this.startJoinTimer();
    console.log(`Room created by ${leader.name}. Max players: ${maxPlayers}. Join within ${this.joinWindow / 1000} sec`);
  }

  // Private method (explicitly marked with 'private' keyword)
  /** Starts timer for join window */
  private startJoinTimer(): void {
    this.timer = setTimeout(() => {
      this.closeJoins();
      this.startMission();
    }, this.joinWindow);
  }

  // Public methods
  /** Adds player to room, checks for duplicates and max limit */
  join(player: Player): void {
    if (this.players.some(p => p.name === player.name)) {
      console.log(`Cannot join: Player ${player.name} already exists.`);
      return;
    }
    if (this.players.length >= this.maxPlayers) {
      console.log('Room full! Cannot join.');
      return;
    }
    if (!this.isJoinOpen || Date.now() > this.joinDeadline) {
      console.log('Cannot join: Time’s up or room full.');
      return;
    }
    this.players = addPlayerToList(this.players, player);
    console.log(`${player.name} joined. Total players: ${this.players.length}/${this.maxPlayers}`);
  }

  /** Closes join phase */
  closeJoins(): void {
    this.isJoinOpen = false;
    console.log(`Join closed. Starting mission with ${this.players.length} players.`);
  }

  /** Starts mission and sets timer */
  startMission(): void {
    if (this.mission) {
      this.mission.start();
      setTimeout(() => {
        if (this.mission) {
          this.mission.end(this.players);
          this.endRoom();
        }
      }, this.mission.duration);
    }
  }

  /** Ends room without creating a new one */
  endRoom(): void {
    console.log('Room ended. Game over. Rerun to play again.');
  }
}

/** Simulates game with random player joins */
function simulateGame(maxPlayers: number = 3): void {
  console.log('Starting Pokemon Catching Game Simulation...');
  try {
    // Prompt user for Leader's name in browser
    const leaderName = prompt('Host game:') || 'DefaultLeader';
    const leader = new Leader(leaderName);
    // Randomly select a Pokemon
    const randomPokemon = getRandomPokemon();
    const room = new Room(leader, randomPokemon, 'Park', maxPlayers);

    // Auto add players up to maxPlayers
    let added = 1; // Leader already added
    const addInterval = setInterval(() => {
      if (added < maxPlayers && room.isJoinOpen && Date.now() < room.joinDeadline) {
        try {
          const player = new Player(`Player${added}`);
          room.join(player);
          added++;
        } catch (error: any) {
          console.log(`Error adding player: ${error.message}`);
        }
      } else {
        clearInterval(addInterval);
      }
    }, 1000); // Add one player every 1s to fit 5s window
  } catch (error: any) {
    console.log(`Error starting game: ${error.message}`);
  }
}

// Run simulation (set maxPlayers as needed)
try {
  simulateGame(5); // Allow up to 5 players
} catch (error: any) {
  console.log(`Error starting game: ${error.message}`);
}