# Go Binary Buffer and Serialization Study Notes

---

## Why and When to Use `bytes.Buffer`, `WriteByte`, and `binary.Write`

When building binary network protocols (like Teltonika), you often need to assemble packets made up of numbers, single bytes, and chunks of raw data. Go makes this easy and safe using `bytes.Buffer` and the `encoding/binary` package.

---

### 1. `bytes.Buffer`

- `bytes.Buffer` is a dynamic, growable buffer for building up your message step by step.
    
- All bytes written to it are stored in order, and you can get the final result as a `[]byte`.
    

**Example:**
```go
var buf bytes.Buffer
buf.Write([]byte{0x01, 0x02, 0x03}) // Appends 3 bytes to the buffer
result := buf.Bytes()               // result == []byte{0x01, 0x02, 0x03}
```

  ---
### 2. `WriteByte(b byte)`

- Writes a **single byte** to the buffer.
    
- Use when you have a protocol field that’s exactly one byte (e.g., ID, flag, count).
    

**Example:**

```go
buf.WriteByte(0x05) // Adds just one byte: 0x05
```

  
---
### 3. `Write([]byte)`

- Writes an entire slice of bytes at once.
    
- Use when you want to append a string (as bytes) or a pre-assembled chunk.
    

**Example:**

```go

buf.Write([]byte("ABC")) // Adds bytes for 'A', 'B', 'C'

```

  ---

### 4. `binary.Write(&buf, binary.BigEndian, value)`

- Converts a value (like an integer) to its byte representation and writes it to the buffer.
    
- Handles endianness for you (see below).
    
- Use for any **multi-byte fields** (e.g., `uint16`, `uint32`), per protocol requirements.
    

**Example:**

```go
binary.Write(&buf, binary.BigEndian, uint16(0x1234))
// Appends 2 bytes: 0x12, 0x34 (big-endian order)

```

  
---
### 5. **What is Endianness?**

Endianness = the order bytes are written for multi-byte values.

- **Big-endian**: Most significant byte first (network standard, Teltonika uses this)
    
- **Little-endian**: Least significant byte first
    

**Example:**

- `uint32(0x12345678)`
    
    - **Big-endian:** 0x12 0x34 0x56 0x78
        
    - **Little-endian:** 0x78 0x56 0x34 0x12
        

**Go Example:***  

```go

var buf bytes.Buffer
binary.Write(&buf, binary.BigEndian, uint32(0x12345678))
fmt.Printf("% X\n", buf.Bytes()) // prints: 12 34 56 78

buf.Reset()
binary.Write(&buf, binary.LittleEndian, uint32(0x12345678))
fmt.Printf("% X\n", buf.Bytes()) // prints: 78 56 34 12


```
  

---

### 6. **When to Use Each Function**

|Method|Use For|Example|
|---|---|---|
|`WriteByte(x)`|One byte|Protocol IDs, flags|
|`Write([]byte)`|Chunk of raw bytes|Strings, buffers|
|`binary.Write(&buf, order, v)`|Multi-byte numbers/fields|Length, CRC, IDs|

---

### 7. **Practical Example: Teltonika Codec12 Packet Building**
```go

var payload bytes.Buffer

// Write single bytes for protocol fields
payload.WriteByte(0x0C) // Codec ID
payload.WriteByte(0x01) // Command quantity
payload.WriteByte(0x05) // Command type

// Write 4-byte command size (big-endian)
command := []byte("getinfo")
binary.Write(&payload, binary.BigEndian, uint32(len(command)))

// Write the command as bytes
payload.Write(command)

// End quantity (1)
payload.WriteByte(0x01)

// Now get the whole packet as []byte
packet := payload.Bytes()

```

  
---
### 8. **Summary Table**

|Method|What It Does|When to Use|
|---|---|---|
|`WriteByte(b byte)`|Appends 1 byte|Single-byte protocol fields|
|`Write([]byte)`|Appends a slice of bytes|Raw data, commands|
|`binary.Write(...)`|Converts value to bytes (endianness-aware)|Numbers, CRC, length fields|

---

### 9. **Why  do`.Bytes()` at the End?**

- `.Bytes()` is a method on a Go `bytes.Buffer`.
    
- It **returns the entire contents of the buffer as a `[]byte` slice**.
    
- In this context, after you build up the whole message (piece by piece), calling `.Bytes()` gives you the final packet **ready to send** over the network.
    

**Example:**
```go
var buf bytes.Buffer
buf.Write([]byte{0x01, 0x02, 0x03})
finalPacket := buf.Bytes() // []byte{0x01, 0x02, 0x03}
```

- So, at the end of your method, `return message.Bytes(), nil` returns the **raw binary message**.
- `.Bytes()` → Gets all the bytes you’ve added to your buffer so you can send or save them.

---

### 10. **What does `binary.BigEndian` do?**

- `binary.BigEndian` is a value from the `encoding/binary` package that **specifies the byte order** (endianness) to use when writing multi-byte numbers.
    
- **Big-endian** means the most significant byte comes first.  
    (e.g., `0x12345678` → `0x12 0x34 0x56 0x78`)
    
- Many network protocols (including Teltonika’s) require **big-endian** encoding for numbers.
    

**Example:**
```go
var buf bytes.Buffer
binary.Write(&buf, binary.BigEndian, uint32(0x12345678))
// buf.Bytes() will be []byte{0x12, 0x34, 0x56, 0x78}
```

- `binary.BigEndian` → Tells Go to write numbers in "big-endian" byte order, eg: as required by the Teltonika protocol.

---

## **Key Takeaways**

- **Use `WriteByte` for single bytes** (e.g., codec IDs, flags, quantities).
    
- **Use `Write([]byte)` for data you already have as bytes** (strings, payloads).
    
- **Use `binary.Write` for numbers/fields that need specific byte order** (length, CRC, etc).
    
- **Always check your protocol's requirements for field sizes and endianness!**
    
- **Get the result with `.Bytes()`** to send it over the network.

---
