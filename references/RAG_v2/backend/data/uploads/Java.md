# Java Programming 

## UNIT-I: Overview of Java

### Features of Java

Java is a high-level, class-based, object-oriented language designed to have as few implementation dependencies as possible. Its core philosophy is **Write Once, Run Anywhere (WORA)**, meaning compiled Java code can run on all platforms that support Java without the need for recompilation.

Key architectural features include:

* **Object-Oriented:** Everything in Java is treated as an Object which encapsulates data and behavior, conforming to standard OOP paradigms (Inheritance, Polymorphism, Abstraction, and Encapsulation).
* **Robustness:** Java emphasizes early error checking, compile-time error checking, and runtime checking. It eliminates manual pointer manipulation to prevent direct memory access violations.
* **Security:** Runs inside a secure virtual machine sandbox. The absence of explicit pointers ensures that programs cannot easily access unauthorized memory addresses.
* **Multithreaded:** Java has built-in support for concurrent execution of tasks, allowing developers to write efficient applications that utilize multi-core processors.

### Byte-code

When you compile a Java program using the compiler (`javac`), it does not turn into machine code for a specific CPU. Instead, it is converted into **Bytecode**—a highly optimized set of instructions stored in a `.class` file. Bytecode serves as the platform-independent intermediate language that bridges raw source code and native machine execution.

### JVM (Java Virtual Machine)

The JVM is the engine that drives the Java code execution pipeline. It loads, verifies, and executes Java Bytecode.

* It contains a **Just-In-Time (JIT) Compiler** which compiles bytecode into native machine code on the fly for optimal runtime performance.
* Because different operating systems require different JVM distributions, the JVM itself is platform-dependent, even though the bytecode it runs is platform-independent.

### Data Types

Java is a statically typed language, meaning all variables must be declared before they can be used. Data types are split into two major categories:

1. **Primitive Data Types:** Predefined by the language and named by a reserved keyword. There are 8 primitive types: `byte`, `short`, `int`, `long`, `float`, `double`, `char`, and `boolean`. They store raw, single values directly in memory (typically on the stack).
2. **Reference Data Types:** Created using defined constructors of classes. They point to object instances stored in memory (on the heap). Examples include Arrays, Classes, and Interfaces.

### Variables and Arrays

* **Variables:** Named memory blocks assigned to hold values of a specific data type during execution. They have a scope (local, instance, or static) that defines their visibility.
* **Arrays:** Homogeneous data structures that store a fixed-size, sequential collection of elements of the same type. Arrays in Java are treated as objects, and their elements are indexed starting from `0`.

### Control Statements

Control statements dictate the order of execution flow within a program based on runtime conditions.

* **Selection Statements:** `if-else` and `switch-case` constructs allow the program to choose different paths of execution.
* **Iteration Statements:** Loops such as `while`, `do-while`, and `for` (including the enhanced for-each loop) execute code blocks repeatedly as long as a condition remains true.
* **Jump Statements:** `break` exits a loop or switch immediately; `continue` skips the current iteration and jumps to the next condition evaluation.

### Introduction to Java Class and Object

* **Class:** A logical template or blueprint used to define the state (fields) and behavior (methods) that objects of its type will possess. It does not occupy memory space until instantiated.
* **Object:** A physical instance of a class. When an object is created using the `new` keyword, memory is allocated on the heap, and it gains its own distinct state.

### main() function

The `main()` method is the mandatory entry point for any standalone Java application. The runtime environment (JVM) looks specifically for this signature to start program execution:

```java
public static void main(String[] args)

```

* `public`: Allows the JVM to invoke the method from outside the class.
* `static`: Allows the JVM to call the method without instantiating an object of the class.
* `void`: Indicates the method returns no data upon termination.
* `String[] args`: Accepts command-line arguments as an array of strings.

### Garbage Collection and finalize() method

* **Garbage Collection:** An automated background process managed by the JVM that scans heap memory for objects that are no longer referenced by any active part of the application, freeing up memory automatically.
* **finalize() method:** A method protected inside the `Object` class. The garbage collector invokes this method on an object right before destroying it, allowing it to perform final resource cleanup (such as closing open files). *Note: It is largely deprecated in modern Java in favor of try-with-resources.*

### this

The `this` keyword is a reference variable that points directly to the current object instance inside a method or constructor. It is primarily used to eliminate ambiguity when instance fields are shadowed by local parameters, or to pass the current object as an argument to other methods.

### Inheritance

Inheritance allows a new class (subclass or child class) to inherit the fields and methods of an existing class (superclass or parent class). Java uses the `extends` keyword to achieve this. It facilitates code reuse and forms the structural foundation for runtime polymorphism. Java supports single, multilevel, and hierarchical inheritance, but prohibits multiple inheritance with classes to avoid ambiguity.

### Method Overriding

Method overriding occurs when a subclass defines a method with the exact same name, return type, and parameters as a method declared in its superclass. This allows the child class to provide an specialized implementation of a behavior, replacing the parent class behavior when invoked on a child instance.

### Dynamic Method Dispatching

Dynamic Method Dispatch is the mechanism by which a call to an overridden method is resolved at **runtime** rather than compile-time. This is how Java implements runtime polymorphism.

```java
Parent obj = new Child();
obj.overriddenMethod(); // Invokes the Child version of the method at runtime

```

The JVM determines which method to execute based on the actual object type being referenced, not the reference variable's type.

### super

The `super` keyword is a reference variable used to access components of an immediate parent class. It can be used to:

1. Invoke the parent class version of an overridden method.
2. Access a hidden field of the parent class.
3. Call the parent class constructor (via `super()`), which must always be the very first statement inside the child class constructor.

### final

The `final` keyword is a non-access modifier used to enforce immutability and restrict inheritance:

* **Final Variable:** Becomes a constant; its value cannot be reassigned once initialized.
* **Final Method:** Cannot be overridden by any subclass.
* **Final Class:** Cannot be extended (inherited) by any other class.

### Package

A package is a container namespace used to group related classes, interfaces, and sub-packages together. Packages help organize large software projects, prevent naming conflicts across separate libraries, and provide a layer of access protection (package-private access level).

### Interface

An interface is a pure abstract contract specified using the `interface` keyword. It can only contain abstract methods (methods without a body) and `public static final` constants. Classes use the `implements` keyword to fulfill this contract. Interfaces allow Java to support the benefits of multiple inheritance, enabling a single class to implement multiple distinct interfaces.

### Abstract Class

An abstract class is declared using the `abstract` keyword and cannot be instantiated directly. Unlike interfaces, abstract classes can maintain instance states and can contain a mix of both abstract methods (without definitions) and concrete methods (with full bodies). They serve as partial blueprints for specialized subclasses.

### Class Path

The Classpath is a command-line option or environment variable that directs the Java compiler (`javac`) and the JVM to the directories or archive files (like `.jar` files) containing third-party or user-defined class definitions. Without a properly configured classpath, the JVM will fail to resolve class dependencies at runtime.

### String and String Buffer Class

* **String Class:** Represents an immutable sequence of characters. Any modifications made to a `String` object do not alter the existing instance; instead, they generate a completely new `String` object in memory, which can impact performance if done repeatedly in loops.
* **StringBuffer Class:** Represents a mutable, growable sequence of characters. Modifying a `StringBuffer` alters the original object directly without creating new allocations. It is fully thread-safe (synchronized), making it safe for concurrent multi-threaded operations.

---

## UNIT-II: Exception Handling and Multithreading

### Exception Types

An exception is an unwanted or unexpected event that disrupts the normal flow of program instructions. Java categorizes exceptions into a distinct hierarchy under `Throwable`:

1. **Checked Exceptions:** Exceptions verified by the compiler during compilation (e.g., `IOException`, `SQLException`). The program will not compile unless these exceptions are handled inside a try-catch block or declared in the method signature.
2. **Unchecked Exceptions (Runtime Exceptions):** Errors that occur during execution and are not verified at compile-time (e.g., `NullPointerException`, `ArrayIndexOutOfBoundsException`). They usually indicate logic bugs.

### Uncaught Exception

An uncaught exception occurs when a program encounters a runtime error that is not captured by any active user-defined `try-catch` block. When this happens, execution stops immediately, and control shifts to the JVM's **Default Exception Handler**. This handler prints the exception stack trace to the console and terminates the thread.

### Using try-catch

The `try-catch` construct is the fundamental mechanism for intercepting and recovering from errors.

* **try block:** Encloses code that could potentially throw an exception during execution.
* **catch block:** Contains code executed only if an exception matching its specific declared parameter type occurs inside the preceding try block.

### Throw

The `throw` keyword is explicitly used to manually instantiate and fire a specific exception object from any block of code or conditional statement.

```java
if (age < 18) {
    throw new ArithmeticException("Access Denied");
}

```

### Throws

The `throws` keyword is used in a method's signature to explicitly signal that this method might choose not to handle certain checked exceptions internally, deferring the responsibility of handling them to whichever method calls it next in the execution stack.

```java
public void readFile() throws IOException { ... }

```

### Finally

The `finally` block is placed immediately after a try-catch sequence. It is guaranteed to execute regardless of whether an exception is thrown, caught, or completely bypassed. It is used to run essential cleanup code, such as closing file attachments, network paths, or database handles.

### Throwable Class and Object

The `Throwable` class is the absolute root class for all error objects that can be processed by the Java language syntax. Only instances of `Throwable` or its structural subclasses can be passed to a `throw` statement or declared in a `catch` clause.

### Exception Classes

Java includes a comprehensive library of built-in exception classes nested under the `java.lang` and `java.io` packages. Each class describes a specific error condition (e.g., `ArithmeticException` for division by zero, `FileNotFoundException` when a disk file path is missing).

### Create Own Exception Subclass

Developers can construct tailored exception definitions to represent domain-specific business logic errors. This is achieved by creating a custom class that extends `Exception` (for a checked exception) or `RuntimeException` (for an unchecked exception).

```java
public class InsufficientFundsException extends Exception {
    public InsufficientFundsException(String message) { super(message); }
}

```

### Creating Multiple Threads

Multithreading can be achieved through two primary mechanisms:

1. **Extending the Thread Class:** Create a class that extends `java.lang.Thread` and override its `run()` method.
2. **Implementing the Runnable Interface:** Create a class that implements `java.lang.Runnable`, implement the `run()` method, and pass this instance to a standard `Thread` constructor. This is preferred as it preserves the class's single inheritance slot.

### isAlive()

The `isAlive()` method is a built-in tool used to inspect a thread's operational status. It returns `true` if the target thread has been started via `.start()` and is still actively running or waiting, and returns `false` if the thread is still in its new state or has terminated.

### join()

The `join()` method allows one thread to pause execution and wait for another thread to finish. When Thread A invokes `ThreadB.join()`, Thread A goes into a waiting state and will not resume until Thread B transitions to the dead state.

### Thread Priorities

Every thread in Java is assigned a priority value ranging between `1` (`Thread.MIN_PRIORITY`) and `10` (`Thread.MAX_PRIORITY`). The default priority value is `5`. The thread scheduler uses these values as hints when allocating CPU runtime, favoring higher priority threads.

### Synchronization

When multiple threads attempt to modify a shared resource concurrently, they can corrupt the data state (a condition called a race condition). Synchronization uses the `synchronized` keyword to lock a method or code block, ensuring that only one thread can access the protected resource at any given moment.

### Deadlock

A deadlock occurs when two or more threads are permanently blocked, each waiting for a lock held by the other. For instance, if Thread 1 holds Lock A and waits for Lock B, while Thread 2 holds Lock B and waits for Lock A, neither thread can proceed, causing the application to hang.

### wait(), notify(), notifyAll() methods

These methods are defined within the root `Object` class and are used to coordinate threads inside synchronized blocks:

* `wait()`: Instructs the current thread to release its lock and sleep until another thread wakes it up.
* `notify()`: Wakes up a single thread that is waiting on this object's lock monitor.
* `notifyAll()`: Wakes up all threads waiting on this object's lock monitor.

### Inter-Thread Communication

Inter-thread communication allows synchronized threads to cooperate efficiently using `wait()` and `notify()`. Instead of continuously running loops to check if a condition has changed (which wastes CPU cycles), threads suspend execution safely until another thread signals that resources are available.

### Suspend, Resume, and Stop the Threads

These are original thread management tools from early Java versions. They have been **deprecated** because they are inherently unsafe. Specifically, `.stop()` causes instant termination that can leave objects in a corrupted state, while `.suspend()` retains locks while paused, frequently causing system deadlocks. Modern implementations use flags or interruption signals instead.

### Collection Framework - HashSet, ArrayList, HashMap

The Java Collection Framework provides a set of pre-built classes and interfaces for managing data structures efficiently:

* **ArrayList:** A resizable array implementation. It allows duplicate entries and maintains the order in which items are added, offering fast, index-based lookups.
* **HashSet:** A collection that does not allow duplicate elements. It does not guarantee any specific order when iterating through items.
* **HashMap:** A structure that stores data as key-value pairs. Each key must be unique, allowing fast retrieval of values based on their corresponding key.

---

## UNIT-III: Streams and Sockets

### I/O Classes & Interfaces

The `java.io` package contains a comprehensive suite of classes and interfaces designed to manage data transmission. These utilities process input (reading data into the application from an external source) and output (writing data from the application to a destination) across various formats.

### File

The `File` class provides an abstract representation of actual file and directory paths on a computer's disk. It does not open or read the content itself; instead, it is used to manage file properties, such as checking permissions, verifying if a file exists, creating new directories, or deleting files.

### The Stream Classes

In Java, a stream represents a continuous flow of data. The stream architecture is divided into two distinct hierarchies based on data type:

1. **Byte Streams:** Process raw binary data in 8-bit blocks.
2. **Character Streams:** Process text data in 16-bit blocks, supporting international character sets like Unicode automatically.

### The Byte Stream (InputStream, OutputStream, FileInputStream, FileOutputStream)

* **InputStream / OutputStream:** The abstract base classes for all byte stream inputs and outputs.
* **FileInputStream / FileOutputStream:** Specialized classes used to read data from and write data to files on disk as raw bytes. They are ideal for binary files like images, audio clips, or compiled data.

### Serialization

Serialization is the process of converting an object's live state in memory into a linear byte stream. This allows the object to be saved to a disk file or transmitted across a network. To make an object serializable, its class must implement the `java.io.Serializable` marker interface. **Deserialization** reverses this process, reconstructing the live object back into memory from the byte stream.

### Network Basics

Network operations in Java rely on standard internet communication protocols:

* **IP Address:** A unique numerical identifier for a specific computer on a network.
* **Port Number:** A numerical identifier that routes network traffic to a specific software application on a computer.
* **Protocols:** Standard rule sets like TCP (reliable, connection-oriented) and UDP (fast, connectionless).

### Networking Classes and Interfaces

The `java.net` package provides built-in tools for network application development. It handles low-level networking tasks automatically, allowing developers to focus on application logic when connecting systems across the internet.

### InetAddress

The `InetAddress` class represents an IP address (supporting both IPv4 and IPv6 formats). It provides utilities to look up domain names and resolve them to their corresponding numerical IP addresses using network DNS services.

### TCP/IP Client/Server Socket

TCP communication uses a dedicated, two-way connection channel:

* **ServerSocket:** Used by server applications to listen on a specific port. It calls `.accept()`, which pauses execution until a client requests a connection.
* **Socket:** Used by client applications to initiate a connection to a server's IP address and port. Once connected, both sides can transfer data using standard input and output streams.

### URL

The `URL` (Uniform Resource Locator) class represents the address of a specific resource on the World Wide Web (such as a webpage or file). It provides methods to parse this address into its individual components, including the protocol, host name, port, and file path.

### URL Connection

A `URLConnection` object represents an active communication link between a Java application and a web resource, established via a `URL`. It allows developers to interact with web servers directly, making it easy to read data from or write data to remote HTTP web services.

### Datagram

A datagram is an isolated, self-contained packet of information sent over a network using the User Datagram Protocol (UDP). Unlike TCP, UDP does not establish a persistent connection or verify that data arrives safely, meaning packets may arrive out of order or be lost entirely. However, it provides lower latency, making it ideal for real-time applications like video streaming or gaming.

### Introduction to RMI

RMI (Remote Method Invocation) is an API that allows a Java program running on one computer to invoke methods on an object located on a completely different computer across a network. It makes distributed computing straightforward by allowing remote method calls to look just like local method calls.

---

## UNIT-IV: Event Handling and Swing

### Delegation Event Model

Java uses the Delegation Event Model to handle user interactions in a user interface. This model divides the work into distinct parts:

* **Event Source:** The UI component that the user interacts with (such as a button or text field).
* **Event Object:** A data package created by the source when an interaction occurs, containing details about the action.
* **Event Listener:** An object that registers with the source and waits for updates. When an event occurs, the source passes the event object to the listener to run its handling code.

### Event Classes

Event classes represent specific types of user actions in a GUI. They are located in packages like `java.awt.event` and `javax.swing.event`. Examples include:

* `ActionEvent`: Triggered when a button is clicked or a menu item is selected.
* `KeyEvent`: Triggered when a user presses or releases a key on the keyboard.
* `MouseEvent`: Triggered by mouse interactions like clicking, moving, or dragging.

### Event Listener Interface

An event listener interface defines the methods a class must implement to handle specific user actions. For example, to handle button clicks, a class must implement the `ActionListener` interface and provide a definition for its `actionPerformed()` method.

### Layout Managers

Layout managers automatically arrange the size and positioning of visual components inside a user interface container. Instead of using fixed coordinates (which can break when windows are resized or viewed on different screen sizes), layout managers dynamically adjust components using predefined layouts, such as `BorderLayout`, `FlowLayout`, or `GridLayout`.

### Swing: Benefits of Swing over AWT

Swing is a modern GUI toolkit that improves upon the older Abstract Window Toolkit (AWT):

* **AWT Components:** Dependent on the operating system's native code (heavyweight). A button in AWT looks different on Windows than it does on macOS.
* **Swing Components:** Written entirely in Java (lightweight). They run independent of the operating system, providing a consistent appearance across all platforms and support for customizable themes.

### JFrames

A `JFrame` is a top-level window container that forms the main window of a desktop application. It provides standard window elements, including a title bar, minimize, maximize, and close buttons, and serves as the canvas where other user interface components are placed.

### JPanels

A `JPanel` is a lightweight container used to organize and group related user interface components within a window. It does not create a standalone window on its own; instead, it is placed inside a `JFrame` or another panel to help manage layout design.

### JLabels

A `JLabel` is a display component used to show read-only text or images within a user interface. It does not respond directly to user input or clicks, making it ideal for descriptive labels or status messages.

### JButtons

A `JButton` is an interactive push-button component. When clicked, it generates an `ActionEvent`, which triggers the application logic defined in its registered listeners.

### JTabbedPane

A `JTabbedPane` is a container component that organizes content into multiple pages or tabs. Users can switch between different views or panels by clicking on tabs, making it useful for optimizing limited screen space.

### JScrollPane

A `JScrollPane` provides a scrollable view of another component. When a component (like a large text area or image) grows larger than its display area, the scroll pane automatically adds horizontal or vertical scrollbars to keep the content accessible.

### JSplitPane

A `JSplitPane` divides two user interface components into separate, resizable panels. It displays a divider bar that users can drag to adjust how much space each panel occupies, either horizontally or vertically.

### JOptionPane

A `JOptionPane` is a utility class used to easily display standard dialog popups. It provides ready-to-use layouts for showing informational alerts, gathering text input, or asking users for confirmation (e.g., Yes/No options).

### JComboBox

A `JComboBox` is a drop-down list component. It combines a text field with a selectable list, allowing users to select a single option from a list that expands when clicked.

### JListBox (JList)

A `JList` is a component that displays a collection of text options in a fixed-size list. Unlike a combo box, the list options are visible directly on screen, and users can be allowed to select multiple items at the same time.

### Text Components

Text components handle text input and editing in a user interface. The primary classes include:

* `JTextField`: A single-line text input field, commonly used for usernames or short search queries.
* `JTextArea`: A multi-line text input area, ideal for displaying or editing larger blocks of text like descriptions or comments.

### JMenu

A `JMenu` represents a drop-down menu component. It is attached to a master `JMenuBar` at the top of a window and contains individual `JMenuItem` options that users can select to run commands.

### JToolbar

A `JToolbar` is a container bar that groups frequently used command buttons together for quick access. It is typically positioned right below the main menu bar and can often be dragged or docked to different sides of the window by the user.

### JDialog

A `JDialog` is a popup window component used to display temporary information or gather specific user input. Unlike a main `JFrame` window, dialogs are dependent on a parent window and are often set to block access to the rest of the application until closed.

### JTable

A `JTable` is a data grid component used to display and edit information in a two-dimensional row-and-column layout, similar to a spreadsheet. It includes built-in support for sorting, filtering, and customizing data display.

### Database Connectivity (JDBC)

JDBC (Java Database Connectivity) is a standard database access API. It allows Java applications to connect to relational databases (such as MySQL, Oracle, or PostgreSQL), send SQL statements, and process the data returned from the database.

---

## UNIT-V: Web Development

### The Applet Class

An applet is a legacy Java program designed to be embedded within a webpage. It runs inside a client web browser using a Java plugin, providing interactive features before web standards like HTML5 became widespread. *Note: Applets are obsolete and have been removed from modern Java editions.*

### Applet Architecture

Applet execution runs within a client-side architecture controlled entirely by a web browser's engine. Unlike standard Java applications, an applet does not use a `main()` entry method; instead, its lifecycle is managed through a set of predefined callback methods triggered by the browser.

### Applet Skeleton

The baseline lifecycle of an applet is structured around five core methods that are overridden to manage its execution steps:

```
+--------+      +---------+      +---------+      +--------+      +-----------+
| init() | ---> | start() | ---> | paint() | ---> | stop() | ---> | destroy() |
+--------+      +---------+      +---------+      +--------+      +-----------+

```

* `init()`: Called once when the applet is first loaded to handle initialization tasks.
* `start()`: Called when the applet starts or resumes execution on the page.
* `paint(Graphics g)`: Called whenever the applet's visual area needs to be redrawn.
* `stop()`: Called when the user navigates away from the webpage.
* `destroy()`: Called when the browser is closed to free up remaining resources.

### HTML APPLET Tag

The `<applet>` tag was a specialized HTML element used to embed a Java applet into a webpage. It specified the path to the compiled `.class` file, along with the width and height of the display area on the screen.

```html
<applet code="MyApplet.class" width="300" height="300"></applet>

```

### Passing Parameter to Applet

Web pages can pass external configuration values to an embedded applet using `<param>` tags nested inside the HTML applet definition. The applet can then retrieve these values during initialization using its `getParameter("paramName")` method.

### getDocumentBase()

The `getDocumentBase()` method returns the absolute URL of the HTML document that contains and embedded the running applet. This helps the applet find other assets located in the same web directory.

### getCodeBase()

The `getCodeBase()` method returns the base URL of the applet's compiled code files (the directory where the `.class` file is stored), which can be different from the directory hosting the HTML file itself.

### Applet Context

The `AppletContext` interface provides a communication link between an applet and its surrounding web browser environment. It allows the applet to discover other active applets on the same page or request changes from the browser frame.

### showDocument()

The `showDocument(URL url)` method is an utility provided by the `AppletContext`. It instructs the web browser to navigate away from the current page and open a new webpage at the specified URL destination.

### Servlet Architecture

A servlet is a Java class that runs on a web server to handle incoming requests and generate dynamic web content. Unlike applets, which run on the client side, servlets operate entirely on the server side within a **Servlet Container** (like Apache Tomcat), processing client requests and returning responses back across the network.

### Servlet Interface

The `Servlet` interface is the core contract of the Java Servlet API. Every servlet must implement this interface, either directly or by extending helper classes like `HttpServlet`. It defines the core methods that manage a servlet's lifetime: `init()`, `service()`, and `destroy()`.

### Servlet Request/Response Interface

When a web server routes a request to a servlet, it passes two operational interfaces to its handling methods:

* `HttpServletRequest`: Contains incoming data sent by the client, such as form input parameters, HTTP headers, and cookies.
* `HttpServletResponse`: Provides methods that allow the servlet to configure and send its response back to the client, including setting the content type, HTTP status codes, and writing output text.

### Servlet Designing

Designing a servlet involves creating a Java class that extends `HttpServlet` and overriding its request handling methods, such as `doGet()` (for retrieving data) or `doPost()` (for submitting data). The servlet must also be registered with the server container using either annotations (`@WebServlet`) or an XML configuration file (`web.xml`).

```java
@WebServlet("/hello")
public class HelloServlet extends HttpServlet {
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.getWriter().println("Hello, World!");
    }
}

```

### Using Cookies

A cookie is a small text data package sent by a server servlet and stored locally by a user's web browser. Every time the browser requests a page from that server, it sends the cookie back with the request. This allows servlets to recognize returning users and store small amounts of persistent data across separate visits.

### Session Management

Because the HTTP protocol is stateless, web servers treat every request as completely independent. Session management allows a server to recognize a series of requests from the same user as a single continuous session. In Java, this is primarily managed using the `HttpSession` API, which creates a unique session ID stored in a cookie on the client side while keeping the user's actual session data safely in the server's memory.