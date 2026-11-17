'use strict';

// Game rules for pass-and-play Undercover (Civilians vs Undercovers).
// A game is a plain object so it can be saved to sessionStorage and survive a page refresh.
(function (root) {
  const MIN_PLAYERS = 3;
  const MAX_PLAYERS = 20;
  const MAX_NAME_LENGTH = 20;

  // One word goes to Civilians, the other to Undercovers (which one is random).
  // Keep in sync with PAIRS in src/main/java/undercover/WordPairs.java.
  const WORD_PAIRS = [
    // Food and drink
    ['Coffee', 'Tea'], ['Pizza', 'Burger'], ['Wine', 'Beer'], ['Bread', 'Cake'],
    ['Butter', 'Cheese'], ['Mango', 'Papaya'], ['Ice cream', 'Yogurt'], ['Honey', 'Jam'],
    ['Lemon', 'Lime'], ['Apple', 'Pear'], ['Sushi', 'Ramen'], ['Pancake', 'Waffle'],
    ['Chocolate', 'Candy'], ['Rice', 'Noodles'], ['Samosa', 'Spring roll'], ['Biryani', 'Pulao'],
    ['Ketchup', 'Mustard'], ['Popcorn', 'Chips'], ['Orange', 'Tangerine'],
    ['Strawberry', 'Raspberry'], ['Watermelon', 'Melon'], ['Milk', 'Juice'], ['Salt', 'Sugar'],
    ['Donut', 'Muffin'], ['Garlic', 'Onion'], ['Cookie', 'Brownie'], ['Taco', 'Burrito'],

    // Animals
    ['Cat', 'Dog'], ['Lion', 'Tiger'], ['Shark', 'Dolphin'], ['Horse', 'Donkey'],
    ['Eagle', 'Owl'], ['Frog', 'Toad'], ['Rabbit', 'Hamster'], ['Bee', 'Wasp'],
    ['Crocodile', 'Alligator'], ['Butterfly', 'Moth'], ['Wolf', 'Fox'], ['Elephant', 'Hippo'],
    ['Penguin', 'Polar bear'],

    // Places
    ['Beach', 'Swimming pool'], ['Hotel', 'Hostel'], ['Airport', 'Train station'],
    ['Ocean', 'Lake'], ['Mountain', 'Hill'], ['Hospital', 'Clinic'], ['Library', 'Bookstore'],
    ['Cinema', 'Theatre'], ['Zoo', 'Farm'], ['Restaurant', 'Cafe'], ['Museum', 'Art gallery'],
    ['School', 'College'], ['River', 'Waterfall'], ['Desert', 'Jungle'],

    // Everyday objects
    ['Pen', 'Pencil'], ['Spoon', 'Fork'], ['Book', 'Magazine'], ['Chair', 'Sofa'],
    ['Laptop', 'Tablet'], ['Watch', 'Clock'], ['Socks', 'Gloves'], ['Shampoo', 'Soap'],
    ['Umbrella', 'Raincoat'], ['Mirror', 'Window'], ['Bed', 'Hammock'], ['Toothbrush', 'Comb'],
    ['Candle', 'Lamp'], ['Wallet', 'Purse'], ['Key', 'Lock'], ['Backpack', 'Suitcase'],
    ['Helmet', 'Cap'], ['Phone', 'Radio'], ['Scissors', 'Knife'], ['Sunglasses', 'Glasses'],
    ['Necklace', 'Bracelet'], ['Fridge', 'Freezer'], ['Camera', 'Binoculars'],

    // Transport
    ['Train', 'Bus'], ['Car', 'Motorcycle'], ['Rocket', 'Airplane'], ['Ship', 'Submarine'],
    ['Bicycle', 'Scooter'], ['Helicopter', 'Drone'],

    // Jobs and people
    ['Doctor', 'Nurse'], ['Teacher', 'Professor'], ['Police officer', 'Firefighter'],
    ['Pilot', 'Astronaut'], ['Chef', 'Waiter'], ['Dentist', 'Pharmacist'], ['King', 'President'],

    // Sports, music and hobbies
    ['Football', 'Rugby'], ['Cricket', 'Baseball'], ['Tennis', 'Badminton'],
    ['Basketball', 'Volleyball'], ['Skiing', 'Snowboarding'], ['Chess', 'Checkers'],
    ['Yoga', 'Meditation'], ['Running', 'Hiking'], ['Dancing', 'Singing'], ['Boxing', 'Wrestling'],
    ['Guitar', 'Violin'], ['Flute', 'Trumpet'],

    // Nature and weather
    ['Sun', 'Moon'], ['Rain', 'Snow'], ['Volcano', 'Earthquake'], ['Star', 'Planet'],
    ['Rose', 'Tulip'], ['Cactus', 'Palm tree'], ['Fog', 'Cloud'], ['Thunder', 'Lightning'],

    // Celebrations
    ['Wedding', 'Birthday party'], ['Christmas', 'New Year'], ['Diwali', 'Holi'],
    ['Santa Claus', 'Easter Bunny'],

    // Pop culture, tech and fantasy
    ['Batman', 'Superman'], ['Harry Potter', 'Lord of the Rings'], ['Instagram', 'Facebook'],
    ['Netflix', 'YouTube'], ['Spider-Man', 'Iron Man'], ['Mickey Mouse', 'Donald Duck'],
    ['WhatsApp', 'Telegram'], ['Google', 'Wikipedia'], ['iPhone', 'Android'],
    ['Ghost', 'Zombie'], ['Vampire', 'Werewolf'], ['Pirate', 'Ninja'], ['Dragon', 'Dinosaur'],

    // Hindi and Indian
    ['Chai', 'Lassi'], ['Roti', 'Paratha'], ['Dosa', 'Idli'], ['Jalebi', 'Gulab jamun'],
    ['Pani puri', 'Bhel puri'], ['Pakora', 'Kachori'], ['Dal', 'Kadhi'], ['Paneer', 'Tofu'],
    ['Rasgulla', 'Rasmalai'], ['Ladoo', 'Barfi'], ['Chole', 'Rajma'], ['Poha', 'Upma'],
    ['Halwa', 'Kheer'], ['Pav bhaji', 'Vada pav'], ['Achaar', 'Chutney'], ['Ghee', 'Malai'],
    ['Paan', 'Supari'], ['Saree', 'Lehenga'], ['Kurta', 'Sherwani'], ['Dupatta', 'Shawl'],
    ['Chappal', 'Jutti'], ['Bindi', 'Sindoor'], ['Choodi', 'Payal'], ['Mehndi', 'Haldi'],
    ['Baraat', 'Sangeet'], ['Raksha Bandhan', 'Bhai Dooj'], ['Navratri', 'Durga Puja'],
    ['Ganesh Chaturthi', 'Janmashtami'], ['Karva Chauth', 'Teej'], ['Dhol', 'Tabla'],
    ['Sitar', 'Veena'], ['Bhangra', 'Garba'], ['Kabaddi', 'Kho kho'], ['Ludo', 'Carrom'],
    ['Antakshari', 'Dumb charades'], ['Rickshaw', 'Tanga'], ['Mela', 'Bazaar'],
    ['Dhaba', 'Canteen'], ['Matka', 'Surahi'], ['Tawa', 'Kadhai'], ['Jhadu', 'Pocha'],
    ['Nani', 'Dadi'], ['Mama', 'Chacha'], ['Bhaiya', 'Didi'], ['Ramayan', 'Mahabharat'],
    ['Shah Rukh Khan', 'Salman Khan'], ['Amitabh Bachchan', 'Rajinikanth'],
    ['Chhota Bheem', 'Motu Patlu'], ['Sholay', 'DDLJ'],

    // Tricky and fun: clues for both words overlap a lot
    ['First date', 'Job interview'], ['Alarm clock', 'Mom'], ['Ex', 'Crush'],
    ['Breakup', 'Divorce'], ['Ghosting', 'Blocking'], ['Dating app', 'Arranged marriage'],
    ['Kiss', 'Hug'], ['Dream', 'Nightmare'], ['Lie', 'Excuse'], ['Gossip', 'News'],
    ['Monday', 'Friday'], ['Hangover', 'Jet lag'], ['Homework', 'Deadline'],
    ['Selfie', 'Passport photo'], ['Wi-Fi', 'Bluetooth'], ['Password', 'OTP'],
    ['Traffic jam', 'Queue'], ['Elevator', 'Escalator'], ['Mosquito', 'Housefly'],
    ['Hiccups', 'Sneezing'], ['Tattoo', 'Piercing'], ['Beard', 'Moustache'],
    ['Pillow', 'Teddy bear'], ['Shadow', 'Reflection'], ['Ice', 'Glass'],
    ['Spy', 'Detective'], ['Twins', 'Clone'], ['Robot', 'Alien'],
    ['Time machine', 'Teleporter'], ['Magician', 'Comedian'], ['Lottery', 'Casino'],
    ['Horoscope', 'Fortune teller'], ['Gym', 'Diet'], ['Jugaad', 'Shortcut'],
    ['Sharma ji ka beta', 'Topper'], ['Saas', 'Bahu'],
  ];

  // Uniform random float in [0, 1) from the browser's (or Node's) crypto source.
  function cryptoRandom() {
    return globalThis.crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
  }

  const randomInt = (n, rng) => Math.floor(rng() * n);

  function shuffle(items, rng) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = randomInt(i + 1, rng);
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  /** Undercovers must always be outnumbered by Civilians. */
  const maxUndercovers = (playerCount) => Math.max(1, Math.floor((playerCount - 1) / 2));

  function validateNames(rawNames) {
    if (rawNames.length < MIN_PLAYERS || rawNames.length > MAX_PLAYERS) {
      throw new Error(`You need ${MIN_PLAYERS} to ${MAX_PLAYERS} players.`);
    }
    const seen = new Set();
    return rawNames.map((raw) => {
      const name = (raw || '').trim();
      if (!name) throw new Error('Every player needs a name.');
      if (name.length > MAX_NAME_LENGTH) {
        throw new Error(`Names can be at most ${MAX_NAME_LENGTH} characters.`);
      }
      const key = name.toLowerCase();
      if (seen.has(key)) throw new Error(`Two players are called "${name}".`);
      seen.add(key);
      return name;
    });
  }

  function pickFirstSpeaker(game, rng) {
    const alive = game.players.map((p, i) => (p.alive ? i : -1)).filter((i) => i >= 0);
    return alive[randomInt(alive.length, rng)];
  }

  function newGame(rawNames, undercoverCount, rng = cryptoRandom) {
    const names = validateNames(rawNames);
    const max = maxUndercovers(names.length);
    if (!Number.isInteger(undercoverCount) || undercoverCount < 1 || undercoverCount > max) {
      throw new Error(`With ${names.length} players you can have 1 to ${max} undercovers.`);
    }

    const pair = WORD_PAIRS[randomInt(WORD_PAIRS.length, rng)];
    const swap = rng() < 0.5;
    const roles = shuffle(names.map((_, i) => (i < undercoverCount ? 'UNDERCOVER' : 'CIVILIAN')), rng);

    const game = {
      phase: 'REVEAL', // REVEAL -> CLUES -> OVER
      round: 1,
      revealIndex: 0,
      players: names.map((name, i) => ({ name, role: roles[i], alive: true })),
      civilianWord: swap ? pair[1] : pair[0],
      undercoverWord: swap ? pair[0] : pair[1],
      firstSpeaker: 0,
      lastEliminated: null, // index of the most recently voted-out player
      winner: null, // 'CIVILIANS' | 'UNDERCOVERS'
    };
    game.firstSpeaker = pickFirstSpeaker(game, rng);
    return game;
  }

  function requirePhase(game, phase) {
    if (game.phase !== phase) {
      throw new Error(`That action isn't allowed right now (phase is ${game.phase}).`);
    }
  }

  /** The player whose turn it is to look at their word. */
  function currentRevealPlayer(game) {
    requirePhase(game, 'REVEAL');
    return game.players[game.revealIndex];
  }

  const wordFor = (game, player) =>
    (player.role === 'UNDERCOVER' ? game.undercoverWord : game.civilianWord);

  /** The current player has seen their word; move on to the next one. */
  function finishReveal(game) {
    requirePhase(game, 'REVEAL');
    game.revealIndex++;
    if (game.revealIndex === game.players.length) game.phase = 'CLUES';
  }

  /** Indexes of alive players in the order they give clues this round. */
  function speakingOrder(game) {
    const order = [];
    const n = game.players.length;
    for (let offset = 0; offset < n; offset++) {
      const i = (game.firstSpeaker + offset) % n;
      if (game.players[i].alive) order.push(i);
    }
    return order;
  }

  /** Remove the player the group voted out, then check for a winner. */
  function eliminate(game, index, rng = cryptoRandom) {
    requirePhase(game, 'CLUES');
    const player = game.players[index];
    if (!player) throw new Error('No such player.');
    if (!player.alive) throw new Error(`${player.name} is already out.`);

    player.alive = false;
    game.lastEliminated = index;

    const aliveWith = (role) => game.players.filter((p) => p.alive && p.role === role).length;
    if (aliveWith('UNDERCOVER') === 0) game.winner = 'CIVILIANS';
    else if (aliveWith('CIVILIAN') <= 1) game.winner = 'UNDERCOVERS';

    if (game.winner) {
      game.phase = 'OVER';
    } else {
      game.round++;
      game.firstSpeaker = pickFirstSpeaker(game, rng);
    }
    return player;
  }

  const api = {
    MIN_PLAYERS,
    MAX_PLAYERS,
    MAX_NAME_LENGTH,
    WORD_PAIRS,
    maxUndercovers,
    newGame,
    currentRevealPlayer,
    wordFor,
    finishReveal,
    speakingOrder,
    eliminate,
  };

  root.UndercoverGame = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(globalThis);
