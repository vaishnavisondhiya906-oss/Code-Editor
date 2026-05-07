import java.util.Scanner; // 1. Import the class

public class Main_1777784439959 {
    public static void main(String[] args) {
        // 2. Create a Scanner object
        Scanner sc = new Scanner(System.in);

        // 3. Ask for and read a String (full line)
        System.out.print("Enter your name: ");
        String name = sc.nextLine();

        // 4. Ask for and read an Integer
        System.out.print("Enter your age: ");
        int age = sc.nextInt();

        System.out.println("Hello " + name + ", you are " + age + " years old!");

        // 5. Close the scanner (optional but recommended)
        sc.close();
    }
}
