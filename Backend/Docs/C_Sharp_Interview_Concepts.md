# C# Interview Concepts: Abstract Classes vs Interfaces

## 1. Abstract Class
**Definition:** An `abstract` class is a specialized type of class that cannot be instantiated directly. It serves as a **base class** for other classes.

- **"Is-A" Relationship:** Use it when the derived class "is a" type of the base class (e.g., `Dog` *is an* `Animal`).
- **Mixed Implementation:** It **can** have fully implemented methods (logic shared by all children) AND `abstract` methods (logic the child MUST implement).
- **State:** It can hold concrete data (fields/properties) like `Name` or `Age`.
- **Inheritance Limit:** A class can only inherit from **ONE** abstract class (C# single inheritance).

### Example
```csharp
public abstract class Animal
{
    // 1. Shared State (Data)
    public string Name { get; set; }

    // 2. Shared Implementation (Logic reused by all)
    public void Sleep()
    {
        Console.WriteLine("Zzzzz... (All animals sleep the same way)");
    }

    // 3. Abstract Method (No logic - Child MUST define this)
    public abstract void MakeSound();
}

public class Dog : Animal
{
    public override void MakeSound()
    {
        Console.WriteLine("Bark!");
    }
}
```

---

## 2. Interface
**Definition:** An `interface` defines a **contract** or a set of capabilities. It specifies **"what"** a class can do, but traditionally does not care **"how"** it does it.

- **"Can-Do" Relationship:** Use it to define behavior (e.g., `IMovable`, `ISaveable`).
- **No State:** Interfaces traditionally do not hold data fields (like `private int _count`).
- **Multiple Implementation:** A class can implement **multiple** interfaces. This is powerful for combining behaviors.
- **Decoupling (Critical for Interviews):** Interfaces are the key to **Dependency Injection (DI)**. They allow you to swap implementations easily (e.g., swapping a real database service for a mock service during testing).

### Example
```csharp
// Defines a capability: "This thing can be saved"
public interface ISaveable
{
    void Save();
}

// Defines a capability: "This thing can be logged"
public interface ILoggable
{
    void Log(string message);
}

// A generic 'CommonEntity' doesn't force these behaviors, 
// but we can choose to add them.
public class Transaction : ISaveable, ILoggable
{
    public void Save()
    {
        Console.WriteLine("Saving transaction to DB...");
    }

    public void Log(string message)
    {
        Console.WriteLine($"Log: {message}");
    }
}
```

---

## 3. Comparison Cheat Sheet

| Feature | Abstract Class | Interface |
| :--- | :--- | :--- |
| **Relationship** | **"Is-A"** (Vertical Inheritance hierarchy) | **"Can-Do"** (Horizontal capabilities) |
| **Implementation** | Can have both logic & abstract methods | Typically only signatures (method names/returns)* |
| **Inheritance** | Single (A class inherits 1 abstract class) | **Multiple** (A class implements N interfaces) |
| **Fields/State** | Can have fields, constants, properties | Cannot have instance fields (state) |
| **Speed** | Slightly faster (direct inheritance) | Slightly slower (method lookup), but negligible |

*\*Note: Modern C# (8.0+) allows "Default Interface Methods", allowing some logic in interfaces, but it is best practice to stick to the definitions above for core design.*

## 4. When to allow which? (Interview Answer)

**Use an Abstract Class when:**
1.  You have a strict **parent-child relationship** (e.g., `Bird`, `Fish` are both `Animal`).
2.  You want to provide **shared code** that children shouldn't have to rewrite.
3.  You need to manage **internal state** (fields) in the parent.

**Use an Interface when:**
1.  **Decoupling is needed (Dependency Injection):** This is the #1 reason in modern web dev. You want to inject `ICategoryService` so you can swap `CategoryService` with `MockCategoryService`.
2.  **Unrelated classes share behavior:** `Car`, `Dog`, and `Robot` all `IMove`, but they don't share a common "Concept".
3.  **Multiple inheritance is needed:** You need a class to be both `IDisposable` AND `IEnumerable`.
