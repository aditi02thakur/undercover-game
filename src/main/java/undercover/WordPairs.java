package undercover;

import java.util.Random;

/** Built-in pairs of related words. One word goes to Civilians, the other to Undercovers. */
final class WordPairs {

    // Keep in sync with WORD_PAIRS in docs/game.js (the hosted web version).
    private static final String[][] PAIRS = {
            // Food and drink
            {"Coffee", "Tea"}, {"Pizza", "Burger"}, {"Wine", "Beer"}, {"Bread", "Cake"},
            {"Butter", "Cheese"}, {"Mango", "Papaya"}, {"Ice cream", "Yogurt"}, {"Honey", "Jam"},
            {"Lemon", "Lime"}, {"Apple", "Pear"}, {"Sushi", "Ramen"}, {"Pancake", "Waffle"},
            {"Chocolate", "Candy"}, {"Rice", "Noodles"}, {"Samosa", "Spring roll"}, {"Biryani", "Pulao"},
            {"Ketchup", "Mustard"}, {"Popcorn", "Chips"}, {"Orange", "Tangerine"},
            {"Strawberry", "Raspberry"}, {"Watermelon", "Melon"}, {"Milk", "Juice"}, {"Salt", "Sugar"},
            {"Donut", "Muffin"}, {"Garlic", "Onion"}, {"Cookie", "Brownie"}, {"Taco", "Burrito"},

            // Animals
            {"Cat", "Dog"}, {"Lion", "Tiger"}, {"Shark", "Dolphin"}, {"Horse", "Donkey"},
            {"Eagle", "Owl"}, {"Frog", "Toad"}, {"Rabbit", "Hamster"}, {"Bee", "Wasp"},
            {"Crocodile", "Alligator"}, {"Butterfly", "Moth"}, {"Wolf", "Fox"}, {"Elephant", "Hippo"},
            {"Penguin", "Polar bear"},

            // Places
            {"Beach", "Swimming pool"}, {"Hotel", "Hostel"}, {"Airport", "Train station"},
            {"Ocean", "Lake"}, {"Mountain", "Hill"}, {"Hospital", "Clinic"}, {"Library", "Bookstore"},
            {"Cinema", "Theatre"}, {"Zoo", "Farm"}, {"Restaurant", "Cafe"}, {"Museum", "Art gallery"},
            {"School", "College"}, {"River", "Waterfall"}, {"Desert", "Jungle"},

            // Everyday objects
            {"Pen", "Pencil"}, {"Spoon", "Fork"}, {"Book", "Magazine"}, {"Chair", "Sofa"},
            {"Laptop", "Tablet"}, {"Watch", "Clock"}, {"Socks", "Gloves"}, {"Shampoo", "Soap"},
            {"Umbrella", "Raincoat"}, {"Mirror", "Window"}, {"Bed", "Hammock"}, {"Toothbrush", "Comb"},
            {"Candle", "Lamp"}, {"Wallet", "Purse"}, {"Key", "Lock"}, {"Backpack", "Suitcase"},
            {"Helmet", "Cap"}, {"Phone", "Radio"}, {"Scissors", "Knife"}, {"Sunglasses", "Glasses"},
            {"Necklace", "Bracelet"}, {"Fridge", "Freezer"}, {"Camera", "Binoculars"},

            // Transport
            {"Train", "Bus"}, {"Car", "Motorcycle"}, {"Rocket", "Airplane"}, {"Ship", "Submarine"},
            {"Bicycle", "Scooter"}, {"Helicopter", "Drone"},

            // Jobs and people
            {"Doctor", "Nurse"}, {"Teacher", "Professor"}, {"Police officer", "Firefighter"},
            {"Pilot", "Astronaut"}, {"Chef", "Waiter"}, {"Dentist", "Pharmacist"}, {"King", "President"},

            // Sports, music and hobbies
            {"Football", "Rugby"}, {"Cricket", "Baseball"}, {"Tennis", "Badminton"},
            {"Basketball", "Volleyball"}, {"Skiing", "Snowboarding"}, {"Chess", "Checkers"},
            {"Yoga", "Meditation"}, {"Running", "Hiking"}, {"Dancing", "Singing"}, {"Boxing", "Wrestling"},
            {"Guitar", "Violin"}, {"Flute", "Trumpet"},

            // Nature and weather
            {"Sun", "Moon"}, {"Rain", "Snow"}, {"Volcano", "Earthquake"}, {"Star", "Planet"},
            {"Rose", "Tulip"}, {"Cactus", "Palm tree"}, {"Fog", "Cloud"}, {"Thunder", "Lightning"},

            // Celebrations
            {"Wedding", "Birthday party"}, {"Christmas", "New Year"}, {"Diwali", "Holi"},
            {"Santa Claus", "Easter Bunny"},

            // Pop culture, tech and fantasy
            {"Batman", "Superman"}, {"Harry Potter", "Lord of the Rings"}, {"Instagram", "Facebook"},
            {"Netflix", "YouTube"}, {"Spider-Man", "Iron Man"}, {"Mickey Mouse", "Donald Duck"},
            {"WhatsApp", "Telegram"}, {"Google", "Wikipedia"}, {"iPhone", "Android"},
            {"Ghost", "Zombie"}, {"Vampire", "Werewolf"}, {"Pirate", "Ninja"}, {"Dragon", "Dinosaur"},

            // Hindi and Indian
            {"Chai", "Lassi"}, {"Roti", "Paratha"}, {"Dosa", "Idli"}, {"Jalebi", "Gulab jamun"},
            {"Pani puri", "Bhel puri"}, {"Pakora", "Kachori"}, {"Dal", "Kadhi"}, {"Paneer", "Tofu"},
            {"Rasgulla", "Rasmalai"}, {"Ladoo", "Barfi"}, {"Chole", "Rajma"}, {"Poha", "Upma"},
            {"Halwa", "Kheer"}, {"Pav bhaji", "Vada pav"}, {"Achaar", "Chutney"}, {"Ghee", "Malai"},
            {"Paan", "Supari"}, {"Saree", "Lehenga"}, {"Kurta", "Sherwani"}, {"Dupatta", "Shawl"},
            {"Chappal", "Jutti"}, {"Bindi", "Sindoor"}, {"Choodi", "Payal"}, {"Mehndi", "Haldi"},
            {"Baraat", "Sangeet"}, {"Raksha Bandhan", "Bhai Dooj"}, {"Navratri", "Durga Puja"},
            {"Ganesh Chaturthi", "Janmashtami"}, {"Karva Chauth", "Teej"}, {"Dhol", "Tabla"},
            {"Sitar", "Veena"}, {"Bhangra", "Garba"}, {"Kabaddi", "Kho kho"}, {"Ludo", "Carrom"},
            {"Antakshari", "Dumb charades"}, {"Rickshaw", "Tanga"}, {"Mela", "Bazaar"},
            {"Dhaba", "Canteen"}, {"Matka", "Surahi"}, {"Tawa", "Kadhai"}, {"Jhadu", "Pocha"},
            {"Nani", "Dadi"}, {"Mama", "Chacha"}, {"Bhaiya", "Didi"}, {"Ramayan", "Mahabharat"},
            {"Shah Rukh Khan", "Salman Khan"}, {"Amitabh Bachchan", "Rajinikanth"},
            {"Chhota Bheem", "Motu Patlu"}, {"Sholay", "DDLJ"},
    };

    // Hard mode pairs on the web version: clues for both words overlap a lot.
    // Keep in sync with HARD_WORD_PAIRS in docs/game.js.
    private static final String[][] HARD_PAIRS = {            {"First date", "Job interview"}, {"Alarm clock", "Mom"}, {"Ex", "Crush"},
            {"Breakup", "Divorce"}, {"Ghosting", "Blocking"}, {"Dating app", "Arranged marriage"},
            {"Kiss", "Hug"}, {"Dream", "Nightmare"}, {"Lie", "Excuse"}, {"Gossip", "News"},
            {"Monday", "Friday"}, {"Hangover", "Jet lag"}, {"Homework", "Deadline"},
            {"Selfie", "Passport photo"}, {"Wi-Fi", "Bluetooth"}, {"Password", "OTP"},
            {"Traffic jam", "Queue"}, {"Elevator", "Escalator"}, {"Mosquito", "Housefly"},
            {"Hiccups", "Sneezing"}, {"Tattoo", "Piercing"}, {"Beard", "Moustache"},
            {"Pillow", "Teddy bear"}, {"Shadow", "Reflection"}, {"Ice", "Glass"},
            {"Spy", "Detective"}, {"Twins", "Clone"}, {"Robot", "Alien"},
            {"Time machine", "Teleporter"}, {"Magician", "Comedian"}, {"Lottery", "Casino"},
            {"Horoscope", "Fortune teller"}, {"Gym", "Diet"}, {"Jugaad", "Shortcut"},
            {"Sharma ji ka beta", "Topper"}, {"Saas", "Bahu"},
    };

    private WordPairs() {
    }

    /** The local Java version has no hard-mode toggle, so it picks from every pair. */
    static String[] pick(Random random) {
        int index = random.nextInt(PAIRS.length + HARD_PAIRS.length);
        String[] pair = index < PAIRS.length ? PAIRS[index] : HARD_PAIRS[index - PAIRS.length];
        return pair.clone();
    }
}
