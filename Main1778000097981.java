import java.util.Scanner; // 1. Import the Scanner class

public class Main1778000097981 {
    public static void main(String[] args) {
        // 2. Create a Scanner object to read from standard input (keyboard)
        Scanner scanner = new Scanner(System.in);

        // 3. Prompt and read a String (full line)
        System.out.print("Enter your name: ");
        String name = scanner.nextLine(); 

        // 4. Prompt and read an Integer
        System.out.print("Enter your age: ");
        int age = scanner.nextInt();

        // Display the results
        System.out.println("Hello " + name + "! You are " + age + " years old.");

        // 5. Close the scanner (good practice to free resources)
        scanner.close();
    }
}


