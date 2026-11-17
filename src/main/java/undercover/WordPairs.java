package undercover;

import java.util.Random;

/** Built-in pairs of related words. One word goes to Civilians, the other to Undercovers. */
final class WordPairs {

    private static final String[][] PAIRS = {
            {"Coffee", "Tea"},
            {"Cat", "Dog"},
            {"Beach", "Swimming pool"},
            {"Pizza", "Burger"},
            {"Guitar", "Violin"},
            {"Train", "Bus"},
            {"Doctor", "Nurse"},
            {"Sun", "Moon"},
            {"Apple", "Pear"},
            {"Football", "Rugby"},
            {"Wine", "Beer"},
            {"Lion", "Tiger"},
            {"Instagram", "Facebook"},
            {"Netflix", "YouTube"},
            {"Shampoo", "Soap"},
            {"Pen", "Pencil"},
            {"Rain", "Snow"},
            {"Bread", "Cake"},
            {"Hotel", "Hostel"},
            {"Spoon", "Fork"},
            {"Car", "Motorcycle"},
            {"Butter", "Cheese"},
            {"Ocean", "Lake"},
            {"Book", "Magazine"},
            {"Chair", "Sofa"},
            {"Mango", "Papaya"},
            {"Cricket", "Baseball"},
            {"Laptop", "Tablet"},
            {"Wedding", "Birthday party"},
            {"Airport", "Train station"},
            {"Ice cream", "Yogurt"},
            {"Shark", "Dolphin"},
            {"Teacher", "Professor"},
            {"Mountain", "Hill"},
            {"Watch", "Clock"},
            {"Honey", "Jam"},
            {"Socks", "Gloves"},
            {"Lemon", "Lime"},
            {"Batman", "Superman"},
            {"Harry Potter", "Lord of the Rings"},
    };

    private WordPairs() {
    }

    static String[] pick(Random random) {
        return PAIRS[random.nextInt(PAIRS.length)].clone();
    }
}
